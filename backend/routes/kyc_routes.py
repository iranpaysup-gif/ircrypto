from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime
import uuid
import os

from models import ApiResponse, UserLevel
from auth import get_current_user
from database import (
    insert_document, find_documents, find_document, 
    update_document
)
from services.api_ir_service import ApiIrService, NationalIDVerificationRequest

router = APIRouter(prefix="/kyc", tags=["kyc"])

# KYC document types
DOCUMENT_TYPES = {
    "national_id": "کارت ملی",
    "passport": "گذرنامه",
    "driving_license": "گواهینامه رانندگی",
    "selfie": "سلفی با مدرک",
    "address_proof": "مدرک آدرس",
    "bank_statement": "گردش حساب بانکی"
}

@router.get("/status", response_model=ApiResponse)
async def get_kyc_status(current_user = Depends(get_current_user)):
    """Get user's KYC verification status"""
    try:
        # Get KYC documents
        kyc_docs = await find_documents("kyc_documents", {"user_id": current_user.id})
        
        # Get KYC submissions
        kyc_submissions = await find_documents(
            "kyc_submissions", 
            {"user_id": current_user.id},
            sort=[("created_at", -1)]
        )
        
        latest_submission = kyc_submissions[0] if kyc_submissions else None
        
        return ApiResponse(
            success=True,
            message="وضعیت احراز هویت دریافت شد",
            data={
                "verified": current_user.verified,
                "level": current_user.level,
                "documents_count": len(kyc_docs),
                "required_documents": list(DOCUMENT_TYPES.keys()),
                "latest_submission": {
                    "id": latest_submission["id"],
                    "status": latest_submission["status"],
                    "created_at": latest_submission["created_at"],
                    "admin_notes": latest_submission.get("admin_notes", "")
                } if latest_submission else None
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت وضعیت احراز هویت: {str(e)}"
        )

@router.post("/upload-document", response_model=ApiResponse)
async def upload_kyc_document(
    document_type: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload KYC document"""
    try:
        if document_type not in DOCUMENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail="نوع مدرک نامعتبر است"
            )
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="فرمت فایل پشتیبانی نمی‌شود. فقط JPG، PNG و PDF مجاز است"
            )
        
        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="حجم فایل نباید بیشتر از ۵ مگابایت باشد"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = "/app/uploads/kyc"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{current_user.id}_{document_type}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Save document record
        document_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "document_type": document_type,
            "filename": file.filename,
            "file_path": file_path,
            "file_size": file.size,
            "content_type": file.content_type,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        # Remove existing document of same type
        from database import get_database
        db = await get_database()
        await db.kyc_documents.delete_many({
            "user_id": current_user.id,
            "document_type": document_type
        })
        
        await insert_document("kyc_documents", document_record)
        
        return ApiResponse(
            success=True,
            message=f"مدرک {DOCUMENT_TYPES[document_type]} با موفقیت آپلود شد",
            data={
                "document_id": document_record["id"],
                "document_type": document_type,
                "filename": file.filename,
                "status": "pending"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در آپلود مدرک: {str(e)}"
        )

@router.post("/submit", response_model=ApiResponse)
async def submit_kyc_application(
    application_data: dict,
    current_user = Depends(get_current_user)
):
    """Submit KYC application for admin review"""
    try:
        # Check if user has uploaded required documents
        kyc_docs = await find_documents("kyc_documents", {"user_id": current_user.id})
        uploaded_types = [doc["document_type"] for doc in kyc_docs]
        
        required_docs = ["national_id", "selfie"]
        missing_docs = [doc for doc in required_docs if doc not in uploaded_types]
        
        if missing_docs:
            missing_names = [DOCUMENT_TYPES[doc] for doc in missing_docs]
            raise HTTPException(
                status_code=400,
                detail=f"مدارک زیر ضروری است: {', '.join(missing_names)}"
            )
        
        # Extract application data
        full_name = application_data.get("full_name")
        national_id = application_data.get("national_id")
        birth_date = application_data.get("birth_date")
        address = application_data.get("address")
        phone = application_data.get("phone", current_user.phone)
        
        if not all([full_name, national_id, birth_date, address]):
            raise HTTPException(
                status_code=400,
                detail="تمام اطلاعات شخصی ضروری است"
            )
        
        # Verify identity using Shahkar system
        shahkar_verification = {"verified": False, "status": "not_verified"}
        
        try:
            # Split full name into first and last name
            name_parts = full_name.strip().split()
            first_name = name_parts[0] if name_parts else full_name
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            
            shahkar_request = NationalIDVerificationRequest(
                national_id=national_id,
                first_name=first_name,
                last_name=last_name,
                birth_date=birth_date,
                mobile_number=phone
            )
            
            async with ApiIrService() as api_ir:
                shahkar_result = await api_ir.verify_shahkar(shahkar_request)
                shahkar_verification = {
                    "verified": shahkar_result.get("verified", False),
                    "status": shahkar_result.get("status", "unknown"),
                    "verification_id": shahkar_result.get("verification_id", ""),
                    "verified_at": shahkar_result.get("verified_at")
                }
        except Exception as e:
            # Log Shahkar error but continue with manual verification
            print(f"Shahkar verification failed: {str(e)}")
            shahkar_verification = {
                "verified": False, 
                "status": "error",
                "error": str(e)
            }

        # Create KYC submission with Shahkar results
        submission = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "full_name": full_name,
            "national_id": national_id,
            "birth_date": birth_date,
            "address": address,
            "phone": phone,
            "status": "shahkar_verified" if shahkar_verification["verified"] else "pending",
            "shahkar_verification": shahkar_verification,
            "created_at": datetime.utcnow(),
            "admin_notes": "احراز هویت شهکار موفق" if shahkar_verification["verified"] else "نیاز به بررسی دستی",
            "reviewed_at": datetime.utcnow() if shahkar_verification["verified"] else None,
            "reviewed_by": "shahkar_system" if shahkar_verification["verified"] else None
        }
        
        await insert_document("kyc_submissions", submission)
        
        # If Shahkar verified, update user verification status
        if shahkar_verification["verified"]:
            from database import get_database
            db = await get_database()
            await db.users.update_one(
                {"id": current_user.id},
                {"$set": {"verified": True, "level": 1, "kyc_verified_at": datetime.utcnow()}}
            )
        
        message = "احراز هویت با موفقیت تأیید شد" if shahkar_verification["verified"] else "درخواست احراز هویت ثبت شد و در انتظار بررسی ادمین قرار گرفت"
        
        return ApiResponse(
            success=True,
            message=message,
            data={
                "submission_id": submission["id"],
                "status": submission["status"],
                "shahkar_verified": shahkar_verification["verified"],
                "created_at": submission["created_at"],
                "auto_approved": shahkar_verification["verified"]
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در ثبت درخواست احراز هویت: {str(e)}"
        )

@router.get("/documents", response_model=List[dict])
async def get_uploaded_documents(current_user = Depends(get_current_user)):
    """Get user's uploaded KYC documents"""
    try:
        documents = await find_documents(
            "kyc_documents", 
            {"user_id": current_user.id},
            sort=[("created_at", -1)]
        )
        
        return [
            {
                "id": doc["id"],
                "document_type": doc["document_type"],
                "document_name": DOCUMENT_TYPES.get(doc["document_type"], doc["document_type"]),
                "filename": doc["filename"],
                "status": doc["status"],
                "created_at": doc["created_at"]
            } for doc in documents
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت مدارک: {str(e)}"
        )

@router.post("/verify-shahkar", response_model=ApiResponse)
async def verify_national_id_shahkar(
    verification_data: dict,
    current_user = Depends(get_current_user)
):
    """Verify Iranian national ID using Shahkar system"""
    try:
        # Extract verification data
        national_id = verification_data.get("national_id")
        first_name = verification_data.get("first_name")
        last_name = verification_data.get("last_name")
        birth_date = verification_data.get("birth_date")
        mobile_number = verification_data.get("mobile_number", current_user.phone)
        
        if not all([national_id, first_name, last_name, birth_date]):
            raise HTTPException(
                status_code=400,
                detail="تمام اطلاعات (کد ملی، نام، نام خانوادگی، تاریخ تولد) ضروری است"
            )
        
        # Create Shahkar verification request
        shahkar_request = NationalIDVerificationRequest(
            national_id=national_id,
            first_name=first_name,
            last_name=last_name,
            birth_date=birth_date,
            mobile_number=mobile_number
        )
        
        # Verify with Shahkar
        async with ApiIrService() as api_ir:
            result = await api_ir.verify_shahkar(shahkar_request)
            
            # Store verification result
            verification_record = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "national_id": national_id,
                "verification_type": "shahkar",
                "verified": result.get("verified", False),
                "status": result.get("status", "unknown"),
                "verification_id": result.get("verification_id", ""),
                "request_data": {
                    "first_name": first_name,
                    "last_name": last_name,
                    "birth_date": birth_date,
                    "mobile_number": mobile_number
                },
                "response_data": result,
                "created_at": datetime.utcnow()
            }
            
            await insert_document("shahkar_verifications", verification_record)
            
            return ApiResponse(
                success=result.get("success", False),
                message=result.get("message", "احراز هویت شهکار انجام شد"),
                data={
                    "verification_id": verification_record["id"],
                    "shahkar_verification_id": result.get("verification_id", ""),
                    "verified": result.get("verified", False),
                    "status": result.get("status", "unknown"),
                    "national_id": national_id,
                    "mobile_number": mobile_number,
                    "verified_at": result.get("verified_at")
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در احراز هویت شهکار: {str(e)}"
        )

@router.get("/requirements", response_model=ApiResponse)
async def get_kyc_requirements():
    """Get KYC requirements and document types"""
    try:
        requirements = {
            "required_documents": [
                {"type": "national_id", "name": "کارت ملی", "required": True},
                {"type": "selfie", "name": "سلفی با مدرک", "required": True},
                {"type": "address_proof", "name": "مدرک آدرس", "required": False},
            ],
            "verification_levels": [
                {"level": "Bronze", "daily_limit": 50000000, "withdrawal_limit": 10000000},
                {"level": "Silver", "daily_limit": 200000000, "withdrawal_limit": 50000000},
                {"level": "Gold", "daily_limit": 1000000000, "withdrawal_limit": 200000000},
                {"level": "Platinum", "daily_limit": 5000000000, "withdrawal_limit": 1000000000},
            ],
            "file_requirements": {
                "max_size": "5MB",
                "allowed_formats": ["JPG", "PNG", "PDF"],
                "image_quality": "حداقل 300 DPI"
            }
        }
        
        return ApiResponse(
            success=True,
            message="الزامات احراز هویت دریافت شد",
            data=requirements
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت الزامات: {str(e)}"
        )
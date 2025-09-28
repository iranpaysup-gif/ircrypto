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
        
        # Create KYC submission
        submission = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "full_name": full_name,
            "national_id": national_id,
            "birth_date": birth_date,
            "address": address,
            "phone": phone,
            "status": "pending",  # pending, approved, rejected
            "created_at": datetime.utcnow(),
            "admin_notes": "",
            "reviewed_at": None,
            "reviewed_by": None
        }
        
        await insert_document("kyc_submissions", submission)
        
        return ApiResponse(
            success=True,
            message="درخواست احراز هویت ثبت شد و در انتظار بررسی ادمین قرار گرفت",
            data={
                "submission_id": submission["id"],
                "status": "pending",
                "created_at": submission["created_at"]
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
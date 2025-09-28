"""
Admin Panel Routes for Iranian Cryptocurrency Exchange
Handles admin authentication, user management, KYC approvals, and system management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import uuid
import hashlib
import jwt

from models import ApiResponse
from database import (
    insert_document, find_documents, find_document, 
    update_document, delete_document, get_database
)
from config import settings

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()

# Admin JWT Configuration
ADMIN_JWT_SECRET = settings.jwt_secret_key + "_admin"
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 hours

class AdminAuth:
    def __init__(self):
        self.default_admin = {
            "id": "admin_001",
            "username": "admin",
            "password_hash": self._hash_password("admin"),
            "role": "super_admin",
            "created_at": datetime.utcnow(),
            "last_login": None,
            "permissions": ["all"]
        }
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(plain_password) == hashed_password
    
    async def get_admin(self, username: str) -> Optional[Dict]:
        """Get admin by username"""
        try:
            admin = await find_document("admins", {"username": username})
            return admin
        except:
            # Return default admin if no database admin exists
            if username == "admin":
                return self.default_admin
            return None
    
    async def create_admin_if_not_exists(self):
        """Create default admin if not exists"""
        try:
            existing_admin = await find_document("admins", {"username": "admin"})
            if not existing_admin:
                await insert_document("admins", self.default_admin)
        except:
            pass  # Skip if database error
    
    def create_access_token(self, admin_data: Dict) -> str:
        """Create JWT token for admin"""
        to_encode = {
            "sub": admin_data["username"],
            "admin_id": admin_data["id"],
            "role": admin_data["role"],
            "exp": datetime.utcnow() + timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        return jwt.encode(to_encode, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)
    
    def verify_token(self, token: str) -> Dict:
        """Verify and decode admin JWT token"""
        try:
            payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Admin token expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid admin token")

admin_auth = AdminAuth()

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated admin"""
    token = credentials.credentials
    payload = admin_auth.verify_token(token)
    
    admin = await admin_auth.get_admin(payload["sub"])
    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Admin not found"
        )
    
    return admin

@router.post("/login", response_model=ApiResponse)
async def admin_login(login_data: Dict[str, str]):
    """Admin login endpoint"""
    try:
        username = login_data.get("username")
        password = login_data.get("password")
        
        if not username or not password:
            raise HTTPException(
                status_code=400,
                detail="نام کاربری و رمز عبور الزامی است"
            )
        
        # Ensure default admin exists
        await admin_auth.create_admin_if_not_exists()
        
        # Get admin
        admin = await admin_auth.get_admin(username)
        if not admin:
            raise HTTPException(
                status_code=401,
                detail="نام کاربری یا رمز عبور اشتباه است"
            )
        
        # Verify password
        if not admin_auth._verify_password(password, admin["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="نام کاربری یا رمز عبور اشتباه است"
            )
        
        # Update last login
        try:
            await update_document(
                "admins", 
                {"username": username}, 
                {"last_login": datetime.utcnow()}
            )
        except:
            pass  # Continue even if update fails
        
        # Create access token
        access_token = admin_auth.create_access_token(admin)
        
        return ApiResponse(
            success=True,
            message="ورود ادمین موفقیت‌آمیز بود",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "admin": {
                    "id": admin["id"],
                    "username": admin["username"],
                    "role": admin["role"],
                    "permissions": admin["permissions"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در ورود ادمین: {str(e)}"
        )

@router.post("/change-password", response_model=ApiResponse)
async def change_admin_password(
    password_data: Dict[str, str],
    current_admin: Dict = Depends(get_current_admin)
):
    """Change admin password"""
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        confirm_password = password_data.get("confirm_password")
        
        if not all([current_password, new_password, confirm_password]):
            raise HTTPException(
                status_code=400,
                detail="تمام فیلدها الزامی است"
            )
        
        if new_password != confirm_password:
            raise HTTPException(
                status_code=400,
                detail="رمز عبور جدید و تأیید آن یکسان نیست"
            )
        
        if len(new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="رمز عبور جدید باید حداقل ۶ کاراکتر باشد"
            )
        
        # Verify current password
        if not admin_auth._verify_password(current_password, current_admin["password_hash"]):
            raise HTTPException(
                status_code=400,
                detail="رمز عبور فعلی اشتباه است"
            )
        
        # Update password
        new_password_hash = admin_auth._hash_password(new_password)
        await update_document(
            "admins",
            {"username": current_admin["username"]},
            {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}
        )
        
        return ApiResponse(
            success=True,
            message="رمز عبور با موفقیت تغییر یافت",
            data={"updated_at": datetime.utcnow().isoformat()}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در تغییر رمز عبور: {str(e)}"
        )

@router.get("/dashboard", response_model=ApiResponse)
async def admin_dashboard(current_admin: Dict = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    try:
        # Get statistics
        users_count = len(await find_documents("users", {}))
        pending_kyc_count = len(await find_documents("kyc_submissions", {"status": "pending"}))
        pending_deposits_count = len(await find_documents("deposit_requests", {"status": "pending"}))
        pending_withdrawals_count = len(await find_documents("withdrawal_requests", {"status": "pending"}))
        
        # Recent activities
        recent_users = await find_documents(
            "users", {}, 
            sort=[("created_at", -1)], 
            limit=5
        )
        
        recent_kyc = await find_documents(
            "kyc_submissions", {}, 
            sort=[("created_at", -1)], 
            limit=5
        )
        
        return ApiResponse(
            success=True,
            message="آمار داشبورد دریافت شد",
            data={
                "statistics": {
                    "total_users": users_count,
                    "pending_kyc": pending_kyc_count,
                    "pending_deposits": pending_deposits_count,
                    "pending_withdrawals": pending_withdrawals_count
                },
                "recent_activities": {
                    "recent_users": recent_users,
                    "recent_kyc": recent_kyc
                },
                "admin_info": {
                    "username": current_admin["username"],
                    "role": current_admin["role"],
                    "last_login": current_admin.get("last_login")
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت آمار داشبورد: {str(e)}"
        )

@router.get("/users", response_model=ApiResponse)
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    current_admin: Dict = Depends(get_current_admin)
):
    """Get all users with pagination and search"""
    try:
        skip = (page - 1) * limit
        query = {}
        
        if search:
            query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"phone": {"$regex": search, "$options": "i"}}
                ]
            }
        
        users = await find_documents(
            "users", query,
            sort=[("created_at", -1)],
            skip=skip,
            limit=limit
        )
        
        total_users = len(await find_documents("users", query))
        
        return ApiResponse(
            success=True,
            message="لیست کاربران دریافت شد",
            data={
                "users": users,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_users,
                    "total_pages": (total_users + limit - 1) // limit
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت لیست کاربران: {str(e)}"
        )

@router.get("/kyc-requests", response_model=ApiResponse)
async def get_kyc_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin: Dict = Depends(get_current_admin)
):
    """Get KYC requests for admin review"""
    try:
        skip = (page - 1) * limit
        query = {}
        
        if status:
            query["status"] = status
        
        kyc_requests = await find_documents(
            "kyc_submissions", query,
            sort=[("created_at", -1)],
            skip=skip,
            limit=limit
        )
        
        total_requests = len(await find_documents("kyc_submissions", query))
        
        return ApiResponse(
            success=True,
            message="درخواست‌های احراز هویت دریافت شد",
            data={
                "kyc_requests": kyc_requests,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_requests,
                    "total_pages": (total_requests + limit - 1) // limit
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت درخواست‌های احراز هویت: {str(e)}"
        )

@router.post("/approve-kyc/{submission_id}", response_model=ApiResponse)
async def approve_kyc_request(
    submission_id: str,
    approval_data: Dict[str, str],
    current_admin: Dict = Depends(get_current_admin)
):
    """Approve or reject KYC request"""
    try:
        action = approval_data.get("action")  # "approve" or "reject"
        admin_notes = approval_data.get("admin_notes", "")
        
        if action not in ["approve", "reject"]:
            raise HTTPException(
                status_code=400,
                detail="عمل باید 'approve' یا 'reject' باشد"
            )
        
        # Get KYC submission
        kyc_submission = await find_document("kyc_submissions", {"id": submission_id})
        if not kyc_submission:
            raise HTTPException(
                status_code=404,
                detail="درخواست احراز هویت یافت نشد"
            )
        
        # Update KYC status
        new_status = "approved" if action == "approve" else "rejected"
        await update_document(
            "kyc_submissions",
            {"id": submission_id},
            {
                "status": new_status,
                "admin_notes": admin_notes,
                "reviewed_by": current_admin["username"],
                "reviewed_at": datetime.utcnow()
            }
        )
        
        # Update user verification status if approved
        if action == "approve":
            await update_document(
                "users",
                {"id": kyc_submission["user_id"]},
                {
                    "verified": True,
                    "level": 1,
                    "kyc_verified_at": datetime.utcnow()
                }
            )
        
        return ApiResponse(
            success=True,
            message=f"درخواست احراز هویت {'تأیید' if action == 'approve' else 'رد'} شد",
            data={
                "submission_id": submission_id,
                "status": new_status,
                "reviewed_by": current_admin["username"],
                "reviewed_at": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در پردازش درخواست احراز هویت: {str(e)}"
        )
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials
from typing import Dict

from models import UserCreate, UserLogin, PhoneVerification, TokenResponse, UserResponse, ApiResponse
from auth import (
    create_user, authenticate_user, create_access_token, create_refresh_token,
    generate_verification_code, verify_phone_code, send_verification_sms,
    get_current_user
)
from services.api_ir_service import ApiIrService, PhoneVerificationRequest

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=ApiResponse)
async def register_user(user_data: UserCreate):
    """Register a new user with SMS verification"""
    try:
        user = await create_user(user_data)
        
        # Send SMS OTP using API.ir service
        async with ApiIrService() as api_ir:
            sms_result = await api_ir.send_sms_otp(
                phone_number=user.phone,
                purpose="registration"
            )
            
            if sms_result["success"]:
                return ApiResponse(
                    success=True,
                    message="کاربر با موفقیت ثبت شد. کد تأیید به شماره موبایل شما ارسال شد",
                    data={
                        "user_id": user.id, 
                        "requires_verification": True,
                        "otp_expires_in": sms_result.get("expires_in", 300)
                    }
                )
            else:
                # Fallback to original SMS service if API.ir fails
                code = await generate_verification_code(user.phone)
                await send_verification_sms(user.phone, code)
                
                return ApiResponse(
                    success=True,
                    message="کاربر با موفقیت ثبت شد. کد تأیید به شماره موبایل شما ارسال شد",
                    data={"user_id": user.id, "requires_verification": True}
                )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در ثبت نام: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    """Login user with phone and password"""
    user = await authenticate_user(user_data.phone, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="شماره موبایل یا رمز عبور اشتباه است"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            level=user.level,
            verified=user.verified,
            balance=user.balance
        )
    )

@router.post("/verify-phone", response_model=ApiResponse)
async def verify_phone_number(verification_data: PhoneVerification):
    """Verify phone number with OTP code"""
    try:
        # Try to verify with existing system first
        is_verified = await verify_phone_code(verification_data.phone, verification_data.code)
        
        if is_verified:
            return ApiResponse(
                success=True,
                message="شماره موبایل با موفقیت تأیید شد",
                data={
                    "verified": True,
                    "phone_number": verification_data.phone,
                    "verified_at": "2025-09-28T19:50:00Z"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="کد تأیید اشتباه است"
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در تأیید شماره موبایل: {str(e)}"
        )

@router.post("/send-otp", response_model=ApiResponse)
async def send_otp_code(phone_request: PhoneVerificationRequest):
    """Send OTP code using API.ir SMS service"""
    try:
        async with ApiIrService() as api_ir:
            result = await api_ir.send_sms_otp(
                phone_number=phone_request.phone_number,
                purpose=phone_request.purpose
            )
            
            if result["success"]:
                return ApiResponse(
                    success=True,
                    message="کد تأیید با موفقیت ارسال شد",
                    data={
                        "phone_number": result["phone_number"],
                        "expires_in": result["expires_in"],
                        "request_id": result.get("request_id", "")
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result.get("message", "خطا در ارسال SMS")
                )
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در ارسال کد تأیید: {str(e)}"
        )

@router.post("/resend-code", response_model=ApiResponse)
async def resend_verification_code(phone_data: Dict[str, str]):
    """Resend verification code"""
    phone = phone_data.get("phone")
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شماره موبایل ضروری است"
        )
    
    code = await generate_verification_code(phone)
    await send_verification_sms(phone, code)
    
    return ApiResponse(
        success=True,
        message="کد تأیید جدید ارسال شد",
        data={"phone": phone}
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        level=current_user.level,
        verified=current_user.verified,
        balance=current_user.balance
    )

@router.post("/logout", response_model=ApiResponse)
async def logout_user(current_user = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    # In a production app, you might want to blacklist the token
    return ApiResponse(
        success=True,
        message="با موفقیت خارج شدید",
        data={"user_id": current_user.id}
    )
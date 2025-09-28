"""
API.ir Integration Service for SMS verification and Shahkar KYC
Implements SMS OTP and Iranian national ID verification
"""

import asyncio
import httpx
import secrets
import string
import json
import re
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from enum import Enum
from pydantic import BaseModel, Field, validator

# Configuration from environment
from config import settings

logger = logging.getLogger(__name__)

class ApiIrEndpoint(Enum):
    SMS_OTP = "/sw1/SmsOTP"
    SEND_SMS = "/sw1/SendSms"
    SHAHKAR = "/sw1/Shahkar"

class PhoneVerificationRequest(BaseModel):
    phone_number: str = Field(..., description="Iranian mobile number")
    purpose: str = Field(..., description="Verification purpose: registration or login")
    
    @validator('phone_number')
    def validate_iranian_phone(cls, v):
        # Remove any formatting characters
        clean_number = re.sub(r'[^\d+]', '', v)
        
        # Iranian mobile number patterns
        patterns = [
            r'^09[0-9]{9}$',  # 09xxxxxxxxx
            r'^(\+98|0098)9[0-9]{9}$',  # +989xxxxxxxxx or 00989xxxxxxxxx
            r'^989[0-9]{9}$'  # 989xxxxxxxxx
        ]
        
        if not any(re.match(pattern, clean_number) for pattern in patterns):
            raise ValueError('Invalid Iranian mobile number format')
            
        # Normalize to Iranian format (09xxxxxxxxx)
        if clean_number.startswith('+98'):
            return '0' + clean_number[3:]
        elif clean_number.startswith('0098'):
            return '0' + clean_number[4:]
        elif clean_number.startswith('98'):
            return '0' + clean_number[2:]
        elif clean_number.startswith('09'):
            return clean_number
        else:
            return '09' + clean_number

class NationalIDVerificationRequest(BaseModel):
    national_id: str = Field(..., description="Iranian national ID (10 digits)")
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    mobile_number: str = Field(..., description="Verified mobile number")
    
    @validator('national_id')
    def validate_national_id(cls, v):
        # Remove any non-digit characters
        clean_id = re.sub(r'\D', '', v)
        
        if len(clean_id) != 10:
            raise ValueError('National ID must be exactly 10 digits')
            
        # Check for obviously invalid patterns
        if clean_id in ['0000000000', '1111111111', '2222222222', 
                       '3333333333', '4444444444', '5555555555',
                       '6666666666', '7777777777', '8888888888', '9999999999']:
            raise ValueError('Invalid national ID pattern')
            
        # Validate check digit using Iranian algorithm
        if not cls._validate_iranian_national_id(clean_id):
            raise ValueError('Invalid Iranian national ID check digit')
            
        return clean_id
        
    @staticmethod
    def _validate_iranian_national_id(national_id: str) -> bool:
        """Validate Iranian national ID check digit"""
        if len(national_id) != 10:
            return False
            
        # Calculate check digit
        check_sum = 0
        for i in range(9):
            check_sum += int(national_id[i]) * (10 - i)
            
        remainder = check_sum % 11
        check_digit = int(national_id[9])
        
        if remainder < 2:
            return check_digit == remainder
        else:
            return check_digit == 11 - remainder

class ApiIrService:
    """Main service class for API.ir integration"""
    
    def __init__(self):
        self.base_url = "https://s.api.ir/api"
        self.api_key = settings.API_IR_API_KEY
        self.bearer_token = settings.API_IR_BEARER_TOKEN
        self.session: Optional[httpx.AsyncClient] = None
        self.otp_length = 6
        self.otp_expiry_minutes = 5
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
            
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        """Make authenticated request to API.ir"""
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.bearer_token}"
        headers["Content-Type"] = "application/json"
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = await self.session.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"API.ir request failed: {e.response.status_code} - {e.response.text}")
            raise Exception(f"API.ir service error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Network error: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate cryptographically secure OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
        
    async def send_sms_otp(self, phone_number: str, purpose: str = "verification") -> Dict[str, Any]:
        """Send SMS OTP to Iranian mobile number"""
        try:
            # Validate phone number
            request = PhoneVerificationRequest(
                phone_number=phone_number,
                purpose=purpose
            )
            
            # Generate OTP
            otp_code = self.generate_otp(self.otp_length)
            
            # Prepare SMS message in Persian
            message = f"کد تایید والکس: {otp_code}\nاین کد تا {self.otp_expiry_minutes} دقیقه معتبر است."
            
            # API.ir SMS OTP request
            sms_data = {
                "mobile": request.phone_number,
                "template_id": "100000",  # Default OTP template
                "parameters": [
                    {"name": "code", "value": otp_code},
                    {"name": "minutes", "value": str(self.otp_expiry_minutes)}
                ]
            }
            
            response = await self._make_request(
                "POST",
                ApiIrEndpoint.SMS_OTP.value,
                json=sms_data
            )
            
            return {
                "success": True,
                "message": "SMS sent successfully",
                "otp_code": otp_code,  # In real implementation, store in Redis/cache
                "phone_number": request.phone_number,
                "expires_in": self.otp_expiry_minutes * 60,
                "request_id": response.get("id", ""),
                "status": response.get("status", "sent")
            }
            
        except Exception as e:
            logger.error(f"SMS sending failed: {str(e)}")
            return {
                "success": False,
                "message": "Failed to send SMS",
                "error": str(e)
            }
    
    async def verify_shahkar(self, verification_request: NationalIDVerificationRequest) -> Dict[str, Any]:
        """Verify Iranian national ID through Shahkar system"""
        try:
            # Prepare Shahkar request
            shahkar_data = {
                "id_number": verification_request.national_id,
                "mobile": verification_request.mobile_number,
                "first_name": verification_request.first_name,
                "last_name": verification_request.last_name,
                "birth_date": verification_request.birth_date
            }
            
            response = await self._make_request(
                "POST", 
                ApiIrEndpoint.SHAHKAR.value,
                json=shahkar_data
            )
            
            # Process Shahkar response
            is_verified = response.get("result", {}).get("is_verified", False)
            verification_status = response.get("result", {}).get("status", "unknown")
            
            return {
                "success": True,
                "verified": is_verified,
                "status": verification_status,
                "verification_id": response.get("id", ""),
                "national_id": verification_request.national_id,
                "mobile_number": verification_request.mobile_number,
                "verified_at": datetime.utcnow().isoformat() if is_verified else None,
                "message": "Identity verification completed" if is_verified else "Identity verification failed"
            }
            
        except Exception as e:
            logger.error(f"Shahkar verification failed: {str(e)}")
            return {
                "success": False,
                "verified": False,
                "status": "error",
                "message": "Identity verification service unavailable",
                "error": str(e)
            }
    
    async def send_general_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send general SMS message"""
        try:
            # Validate phone number
            request = PhoneVerificationRequest(
                phone_number=phone_number,
                purpose="notification"
            )
            
            sms_data = {
                "mobile": request.phone_number,
                "message": message
            }
            
            response = await self._make_request(
                "POST",
                ApiIrEndpoint.SEND_SMS.value, 
                json=sms_data
            )
            
            return {
                "success": True,
                "message": "SMS sent successfully",
                "phone_number": request.phone_number,
                "request_id": response.get("id", ""),
                "status": response.get("status", "sent")
            }
            
        except Exception as e:
            logger.error(f"General SMS sending failed: {str(e)}")
            return {
                "success": False,
                "message": "Failed to send SMS",
                "error": str(e)
            }

# Utility functions for Iranian data validation
def is_valid_iranian_phone(phone_number: str) -> bool:
    """Check if phone number is valid Iranian format"""
    try:
        PhoneVerificationRequest(phone_number=phone_number, purpose="validation")
        return True
    except ValueError:
        return False

def is_valid_iranian_national_id(national_id: str) -> bool:
    """Check if national ID is valid Iranian format"""
    try:
        NationalIDVerificationRequest(
            national_id=national_id,
            first_name="test",
            last_name="test", 
            birth_date="1990-01-01",
            mobile_number="09123456789"
        )
        return True
    except ValueError:
        return False

def normalize_iranian_phone(phone_number: str) -> str:
    """Normalize Iranian phone number to standard format"""
    try:
        request = PhoneVerificationRequest(
            phone_number=phone_number,
            purpose="normalization"
        )
        return request.phone_number
    except ValueError as e:
        raise ValueError(f"Invalid phone number: {str(e)}")
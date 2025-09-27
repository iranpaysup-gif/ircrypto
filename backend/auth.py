from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import secrets
import random

from .models import User, UserCreate, UserLogin
from .database import find_document, insert_document, update_document

# Security configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await find_document("users", {"id": user_id})
    if user is None:
        raise credentials_exception
    
    return User(**user)

async def get_current_user(current_user: User = Depends(verify_token)):
    """Get current authenticated user"""
    return current_user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user"""
    return current_user

async def authenticate_user(phone: str, password: str) -> Optional[User]:
    """Authenticate user with phone and password"""
    user_doc = await find_document("users", {"phone": phone})
    if not user_doc:
        return None
    
    if not verify_password(password, user_doc["password_hash"]):
        return None
    
    return User(**user_doc)

async def create_user(user_data: UserCreate) -> User:
    """Create a new user"""
    # Check if user already exists
    existing_user = await find_document("users", {
        "$or": [
            {"email": user_data.email},
            {"phone": user_data.phone}
        ]
    })
    
    if existing_user:
        if existing_user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this phone number already exists"
            )
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        level="Bronze",
        verified=False,
        balance={"IRR": 0.0, "USD": 0.0}
    )
    
    # Prepare user document for database
    user_dict = user.dict()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    
    # Insert user into database
    await insert_document("users", user_dict)
    
    return user

async def generate_verification_code(phone: str) -> str:
    """Generate and store phone verification code"""
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Store in database with expiration
    verification_doc = {
        "phone": phone,
        "code": code,
        "created_at": datetime.utcnow(),
        "verified": False
    }
    
    # Remove any existing codes for this phone
    from .database import get_database
    db = await get_database()
    await db.verification_codes.delete_many({"phone": phone})
    
    # Insert new code
    await insert_document("verification_codes", verification_doc)
    
    return code

async def verify_phone_code(phone: str, code: str) -> bool:
    """Verify phone verification code"""
    verification_doc = await find_document("verification_codes", {
        "phone": phone,
        "code": code,
        "verified": False
    })
    
    if not verification_doc:
        return False
    
    # Check if code is not expired (5 minutes)
    created_at = verification_doc["created_at"]
    if datetime.utcnow() - created_at > timedelta(minutes=5):
        return False
    
    # Mark code as verified
    await update_document("verification_codes", 
                         {"phone": phone, "code": code}, 
                         {"verified": True})
    
    # Mark user as verified if exists
    await update_document("users", {"phone": phone}, {"verified": True})
    
    return True

# Mock SMS service (replace with real service in production)
async def send_sms(phone: str, message: str) -> bool:
    """Send SMS (mock implementation)"""
    print(f"SMS to {phone}: {message}")
    # In production, integrate with SMS service like Kavenegar
    return True

async def send_verification_sms(phone: str, code: str) -> bool:
    """Send verification code via SMS"""
    message = f"کد تأیید والکس: {code}\nاین کد تا 5 دقیقه معتبر است."
    return await send_sms(phone, message)
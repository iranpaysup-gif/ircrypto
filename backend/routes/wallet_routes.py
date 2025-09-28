from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime

from models import (
    Transaction, TransactionCreate, TransactionType, TransactionStatus,
    ApiResponse, UserLevel
)
from auth import get_current_user
from database import (
    insert_document, find_documents, find_document, 
    update_document
)

router = APIRouter(prefix="/wallet", tags=["wallet"])

# TMN (Toman) deposit/withdrawal limits based on user level
LEVEL_LIMITS = {
    UserLevel.BRONZE: {"daily_deposit": 50000000, "daily_withdrawal": 10000000},  # 50M TMN deposit, 10M withdrawal
    UserLevel.SILVER: {"daily_deposit": 200000000, "daily_withdrawal": 50000000},
    UserLevel.GOLD: {"daily_deposit": 1000000000, "daily_withdrawal": 200000000},
    UserLevel.PLATINUM: {"daily_deposit": 5000000000, "daily_withdrawal": 1000000000}
}

@router.get("/balance", response_model=ApiResponse)
async def get_wallet_balance(current_user = Depends(get_current_user)):
    """Get user wallet balance"""
    try:
        # Get latest user data to ensure balance is current
        user_doc = await find_document("users", {"id": current_user.id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد")
        
        balance = user_doc.get("balance", {})
        
        # Add TMN balance if not present
        if "TMN" not in balance:
            balance["TMN"] = 0.0
        
        return ApiResponse(
            success=True,
            message="موجودی کیف پول با موفقیت دریافت شد",
            data={
                "balance": balance,
                "user_level": user_doc.get("level", "Bronze"),
                "verified": user_doc.get("verified", False)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت موجودی: {str(e)}"
        )

@router.post("/deposit", response_model=ApiResponse)
async def create_deposit_request(
    deposit_data: dict,
    current_user = Depends(get_current_user)
):
    """Create TMN deposit request (requires admin approval)"""
    try:
        amount = deposit_data.get("amount")
        payment_method = deposit_data.get("payment_method", "bank_transfer")  # bank_transfer, card
        bank_account = deposit_data.get("bank_account")
        
        if not amount or amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="مبلغ واریز باید بیشتر از صفر باشد"
            )
        
        # Check user limits
        user_limits = LEVEL_LIMITS.get(current_user.level, LEVEL_LIMITS[UserLevel.BRONZE])
        if amount > user_limits["daily_deposit"]:
            raise HTTPException(
                status_code=400,
                detail=f"مبلغ واریز از حد مجاز روزانه ({user_limits['daily_deposit']:,} تومان) بیشتر است"
            )
        
        # Check daily deposit limit
        today_deposits = await get_daily_transactions(
            current_user.id, 
            TransactionType.DEPOSIT, 
            TransactionStatus.COMPLETED
        )
        daily_total = sum(t.get("amount", 0) for t in today_deposits)
        
        if daily_total + amount > user_limits["daily_deposit"]:
            remaining = user_limits["daily_deposit"] - daily_total
            raise HTTPException(
                status_code=400,
                detail=f"حد واریز روزانه تکمیل شده. مبلغ قابل واریز: {remaining:,} تومان"
            )
        
        # Create deposit transaction
        transaction = Transaction(
            user_id=current_user.id,
            amount=amount,
            currency="TMN",
            type=TransactionType.DEPOSIT,
            status=TransactionStatus.PENDING,
            description=f"واریز {payment_method} - {bank_account if bank_account else 'N/A'}"
        )
        
        await insert_document("transactions", transaction.dict())
        
        # In production, integrate with payment gateway here
        # For now, we'll simulate pending approval
        
        return ApiResponse(
            success=True,
            message="درخواست واریز ثبت شد و در انتظار تأیید ادمین قرار گرفت",
            data={
                "transaction_id": transaction.id,
                "amount": amount,
                "currency": "TMN",
                "status": "pending",
                "payment_method": payment_method
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در ثبت درخواست واریز: {str(e)}"
        )

@router.post("/withdraw", response_model=ApiResponse)
async def create_withdrawal_request(
    withdrawal_data: dict,
    current_user = Depends(get_current_user)
):
    """Create TMN withdrawal request (requires admin approval)"""
    try:
        amount = withdrawal_data.get("amount")
        bank_account = withdrawal_data.get("bank_account")
        iban = withdrawal_data.get("iban")
        
        if not amount or amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="مبلغ برداشت باید بیشتر از صفر باشد"
            )
        
        if not bank_account or not iban:
            raise HTTPException(
                status_code=400,
                detail="شماره حساب و شبا ضروری است"
            )
        
        # Check user verification
        if not current_user.verified:
            raise HTTPException(
                status_code=400,
                detail="برای برداشت وجه، احراز هویت (KYC) الزامی است"
            )
        
        # Check user balance
        user_doc = await find_document("users", {"id": current_user.id})
        tmn_balance = user_doc.get("balance", {}).get("TMN", 0)
        
        if amount > tmn_balance:
            raise HTTPException(
                status_code=400,
                detail=f"موجودی ناکافی. موجودی فعلی: {tmn_balance:,} تومان"
            )
        
        # Check user limits
        user_limits = LEVEL_LIMITS.get(current_user.level, LEVEL_LIMITS[UserLevel.BRONZE])
        if amount > user_limits["daily_withdrawal"]:
            raise HTTPException(
                status_code=400,
                detail=f"مبلغ برداشت از حد مجاز روزانه ({user_limits['daily_withdrawal']:,} تومان) بیشتر است"
            )
        
        # Check daily withdrawal limit
        today_withdrawals = await get_daily_transactions(
            current_user.id, 
            TransactionType.WITHDRAWAL, 
            TransactionStatus.COMPLETED
        )
        daily_total = sum(t.get("amount", 0) for t in today_withdrawals)
        
        if daily_total + amount > user_limits["daily_withdrawal"]:
            remaining = user_limits["daily_withdrawal"] - daily_total
            raise HTTPException(
                status_code=400,
                detail=f"حد برداشت روزانه تکمیل شده. مبلغ قابل برداشت: {remaining:,} تومان"
            )
        
        # Create withdrawal transaction
        transaction = Transaction(
            user_id=current_user.id,
            amount=amount,
            currency="TMN",
            type=TransactionType.WITHDRAWAL,
            status=TransactionStatus.PENDING,
            description=f"برداشت به حساب {bank_account} - شبا: {iban}"
        )
        
        await insert_document("transactions", transaction.dict())
        
        # Temporarily freeze the amount (in production, use proper account holds)
        new_balance = tmn_balance - amount
        await update_document(
            "users", 
            {"id": current_user.id}, 
            {"balance.TMN": new_balance}
        )
        
        return ApiResponse(
            success=True,
            message="درخواست برداشت ثبت شد و در انتظار تأیید ادمین قرار گرفت",
            data={
                "transaction_id": transaction.id,
                "amount": amount,
                "currency": "TMN",
                "status": "pending",
                "bank_account": bank_account,
                "iban": iban
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در ثبت درخواست برداشت: {str(e)}"
        )

@router.get("/transactions", response_model=List[dict])
async def get_wallet_transactions(
    transaction_type: Optional[str] = Query(None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get user's wallet transactions"""
    try:
        filter_dict = {"user_id": current_user.id}
        if transaction_type:
            filter_dict["type"] = transaction_type
        
        transactions = await find_documents(
            "transactions",
            filter_dict,
            limit=limit,
            skip=offset,
            sort=[("created_at", -1)]
        )
        
        return [
            {
                "id": t["id"],
                "amount": t["amount"],
                "currency": t["currency"],
                "type": t["type"],
                "status": t["status"],
                "description": t.get("description", ""),
                "created_at": t["created_at"],
                "updated_at": t.get("updated_at")
            } for t in transactions
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت تراکنش‌ها: {str(e)}"
        )

@router.get("/limits", response_model=ApiResponse)
async def get_user_limits(current_user = Depends(get_current_user)):
    """Get user's deposit/withdrawal limits"""
    try:
        user_limits = LEVEL_LIMITS.get(current_user.level, LEVEL_LIMITS[UserLevel.BRONZE])
        
        # Get today's usage
        today_deposits = await get_daily_transactions(
            current_user.id, 
            TransactionType.DEPOSIT, 
            TransactionStatus.COMPLETED
        )
        today_withdrawals = await get_daily_transactions(
            current_user.id, 
            TransactionType.WITHDRAWAL, 
            TransactionStatus.COMPLETED
        )
        
        used_deposit = sum(t.get("amount", 0) for t in today_deposits)
        used_withdrawal = sum(t.get("amount", 0) for t in today_withdrawals)
        
        return ApiResponse(
            success=True,
            message="محدودیت‌های کاربر با موفقیت دریافت شد",
            data={
                "level": current_user.level,
                "daily_deposit_limit": user_limits["daily_deposit"],
                "daily_withdrawal_limit": user_limits["daily_withdrawal"],
                "used_deposit_today": used_deposit,
                "used_withdrawal_today": used_withdrawal,
                "remaining_deposit": user_limits["daily_deposit"] - used_deposit,
                "remaining_withdrawal": user_limits["daily_withdrawal"] - used_withdrawal,
                "verified": current_user.verified
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت محدودیت‌ها: {str(e)}"
        )

# Helper functions
async def get_daily_transactions(user_id: str, transaction_type: TransactionType, status: TransactionStatus):
    """Get user's transactions for today"""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    return await find_documents(
        "transactions",
        {
            "user_id": user_id,
            "type": transaction_type,
            "status": status,
            "created_at": {"$gte": today}
        }
    )
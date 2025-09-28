from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta

from ..models import (
    OrderCreate, Order, OrderResponse, OrderStatus, OrderSide,
    Transaction, TransactionType, TransactionStatus, ApiResponse
)
from ..auth import get_current_user
from ..database import (
    insert_document, find_documents, find_document, 
    update_document, delete_document
)
from ..crypto_service import get_crypto_service

router = APIRouter(prefix="/trading", tags=["trading"])

@router.post("/order", response_model=OrderResponse)
async def place_order(
    order_data: OrderCreate,
    current_user = Depends(get_current_user)
):
    """Place a new trading order"""
    try:
        # Validate trading pair
        service = await get_crypto_service()
        pairs = await service.get_trading_pairs()
        valid_pairs = [pair.pair for pair in pairs]
        
        if order_data.pair not in valid_pairs:
            raise HTTPException(
                status_code=400,
                detail=f"جفت معاملاتی {order_data.pair} پشتیبانی نمی‌شود"
            )
        
        # Get current price for market orders
        base_currency = order_data.pair.split('/')[0]
        crypto = await service.get_crypto_by_symbol(base_currency)
        
        if not crypto:
            raise HTTPException(
                status_code=400,
                detail=f"ارز {base_currency} یافت نشد"
            )
        
        # Set price for market orders
        if order_data.type == "market":
            order_price = crypto.price
        else:
            if not order_data.price or order_data.price <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="قیمت برای سفارش محدود ضروری است"
                )
            order_price = order_data.price
        
        # Validate user balance (simplified check)
        total_cost = order_data.amount * order_price
        if order_data.side == OrderSide.BUY:
            if current_user.balance.get('USD', 0) < total_cost:
                raise HTTPException(
                    status_code=400,
                    detail="موجودی ناکافی برای خرید"
                )
        else:  # SELL
            if current_user.balance.get(base_currency, 0) < order_data.amount:
                raise HTTPException(
                    status_code=400,
                    detail=f"موجودی {base_currency} ناکافی برای فروش"
                )
        
        # Create order
        order = Order(
            user_id=current_user.id,
            pair=order_data.pair,
            side=order_data.side,
            type=order_data.type,
            amount=order_data.amount,
            price=order_price,
            status=OrderStatus.FILLED if order_data.type == "market" else OrderStatus.OPEN
        )
        
        # Execute market orders immediately
        if order_data.type == "market":
            order.filled_amount = order.amount
            order.executed_at = datetime.utcnow()
            
            # Update user balance (simplified)
            await update_user_balance_after_trade(current_user.id, order)
            
            # Create transaction record
            await create_trade_transaction(current_user.id, order)
        
        # Save order to database
        await insert_document("orders", order.dict())
        
        return OrderResponse(
            id=order.id,
            pair=order.pair,
            side=order.side,
            type=order.type,
            amount=order.amount,
            price=order.price,
            filled_amount=order.filled_amount,
            status=order.status,
            created_at=order.created_at,
            executed_at=order.executed_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در ثبت سفارش: {str(e)}"
        )

@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get user's trading orders"""
    try:
        filter_dict = {"user_id": current_user.id}
        if status:
            filter_dict["status"] = status
        
        orders = await find_documents(
            "orders", 
            filter_dict, 
            limit=limit, 
            skip=offset,
            sort=[("created_at", -1)]
        )
        
        return [OrderResponse(
            id=order["id"],
            pair=order["pair"],
            side=order["side"],
            type=order["type"],
            amount=order["amount"],
            price=order["price"],
            filled_amount=order.get("filled_amount", 0),
            status=order["status"],
            created_at=order["created_at"],
            executed_at=order.get("executed_at")
        ) for order in orders]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت سفارشات: {str(e)}"
        )

@router.delete("/orders/{order_id}", response_model=ApiResponse)
async def cancel_order(
    order_id: str,
    current_user = Depends(get_current_user)
):
    """Cancel a trading order"""
    try:
        # Find order
        order = await find_document("orders", {
            "id": order_id,
            "user_id": current_user.id
        })
        
        if not order:
            raise HTTPException(
                status_code=404,
                detail="سفارش یافت نشد"
            )
        
        if order["status"] != OrderStatus.OPEN:
            raise HTTPException(
                status_code=400,
                detail="تنها سفارشات باز قابل لغو هستند"
            )
        
        # Update order status
        await update_document(
            "orders",
            {"id": order_id},
            {"status": OrderStatus.CANCELLED}
        )
        
        return ApiResponse(
            success=True,
            message="سفارش با موفقیت لغو شد",
            data={"order_id": order_id}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در لغو سفارش: {str(e)}"
        )

@router.get("/history", response_model=List[OrderResponse])
async def get_trading_history(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get user's trading history"""
    try:
        # Calculate date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        filter_dict = {
            "user_id": current_user.id,
            "status": OrderStatus.FILLED,
            "executed_at": {"$gte": start_date}
        }
        
        orders = await find_documents(
            "orders",
            filter_dict,
            limit=limit,
            skip=offset,
            sort=[("executed_at", -1)]
        )
        
        return [OrderResponse(
            id=order["id"],
            pair=order["pair"],
            side=order["side"],
            type=order["type"],
            amount=order["amount"],
            price=order["price"],
            filled_amount=order.get("filled_amount", 0),
            status=order["status"],
            created_at=order["created_at"],
            executed_at=order.get("executed_at")
        ) for order in orders]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت تاریخچه معاملات: {str(e)}"
        )

# Helper functions
async def update_user_balance_after_trade(user_id: str, order: Order):
    """Update user balance after a successful trade"""
    # This is a simplified implementation
    # In production, you'd want more sophisticated balance management
    base_currency = order.pair.split('/')[0]
    quote_currency = order.pair.split('/')[1]
    
    user = await find_document("users", {"id": user_id})
    if not user:
        return
    
    balance = user.get("balance", {})
    
    if order.side == OrderSide.BUY:
        # Add base currency, subtract quote currency
        balance[base_currency] = balance.get(base_currency, 0) + order.amount
        balance[quote_currency] = balance.get(quote_currency, 0) - (order.amount * order.price)
    else:
        # Add quote currency, subtract base currency
        balance[quote_currency] = balance.get(quote_currency, 0) + (order.amount * order.price)
        balance[base_currency] = balance.get(base_currency, 0) - order.amount
    
    await update_document("users", {"id": user_id}, {"balance": balance})

async def create_trade_transaction(user_id: str, order: Order):
    """Create transaction record for completed trade"""
    transaction = Transaction(
        user_id=user_id,
        amount=order.amount * order.price,
        currency=order.pair.split('/')[1],  # Quote currency
        type=TransactionType.TRADE,
        status=TransactionStatus.COMPLETED,
        description=f"{order.side.upper()} {order.amount} {order.pair.split('/')[0]} at {order.price}",
        order_id=order.id
    )
    
    await insert_document("transactions", transaction.dict())
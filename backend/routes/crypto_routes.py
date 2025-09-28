from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from models import CryptoCurrency, TradingPair, ChartData, ApiResponse
from wallex_service import get_wallex_service

router = APIRouter(prefix="/crypto", tags=["cryptocurrency"])

@router.get("/list", response_model=List[CryptoCurrency])
async def get_cryptocurrencies(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """Get list of supported cryptocurrencies with current prices"""
    try:
        service = await get_wallex_service()
        cryptos = await service.get_cryptocurrencies()
        
        # Apply pagination
        paginated_cryptos = cryptos[offset:offset + limit]
        
        return paginated_cryptos
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت اطلاعات ارزها: {str(e)}"
        )

@router.get("/prices", response_model=List[CryptoCurrency])
async def get_crypto_prices():
    """Get current cryptocurrency prices"""
    try:
        service = await get_wallex_service()
        return await service.get_cryptocurrencies()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت قیمت‌ها: {str(e)}"
        )

@router.get("/price/{symbol}", response_model=CryptoCurrency)
async def get_crypto_price(symbol: str):
    """Get price for specific cryptocurrency"""
    try:
        service = await get_crypto_service()
        crypto = await service.get_crypto_by_symbol(symbol)
        
        if not crypto:
            raise HTTPException(
                status_code=404,
                detail=f"ارز {symbol} یافت نشد"
            )
        
        return crypto
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت قیمت {symbol}: {str(e)}"
        )

@router.get("/chart/{symbol}", response_model=List[ChartData])
async def get_crypto_chart(
    symbol: str,
    days: int = Query(default=7, ge=1, le=365)
):
    """Get chart data for cryptocurrency"""
    try:
        service = await get_crypto_service()
        chart_data = await service.get_chart_data(symbol, days)
        
        return chart_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت نمودار {symbol}: {str(e)}"
        )

@router.get("/pairs", response_model=List[TradingPair])
async def get_trading_pairs():
    """Get available trading pairs"""
    try:
        service = await get_crypto_service()
        return await service.get_trading_pairs()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت جفت‌های معاملاتی: {str(e)}"
        )

@router.get("/market-stats", response_model=ApiResponse)
async def get_market_stats():
    """Get overall market statistics"""
    try:
        service = await get_wallex_service()
        cryptos = await service.get_cryptocurrencies()
        
        total_market_cap = sum(crypto.market_cap for crypto in cryptos)
        total_volume_24h = sum(crypto.volume_24h for crypto in cryptos)
        
        # Calculate BTC dominance
        btc_market_cap = next((crypto.market_cap for crypto in cryptos if crypto.symbol == "BTC"), 0)
        btc_dominance = (btc_market_cap / total_market_cap * 100) if total_market_cap > 0 else 0
        
        stats = {
            "total_market_cap": total_market_cap,
            "total_volume_24h": total_volume_24h,
            "btc_dominance": round(btc_dominance, 2),
            "active_cryptocurrencies": len(cryptos),
            "total_exchanges": 1  # Wallex exchange
        }
        
        return ApiResponse(
            success=True,
            message="آمار بازار با موفقیت دریافت شد",
            data=stats
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطا در دریافت آمار بازار: {str(e)}"
        )
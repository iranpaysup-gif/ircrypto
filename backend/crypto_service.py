import aiohttp
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import os

from models import CryptoCurrency, TradingPair, ChartData
from database import find_documents, update_document, insert_document, find_document

# CoinGecko API configuration
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
IRR_USD_RATE = 42000  # Mock IRR to USD rate - in production, get from forex API

# Supported cryptocurrencies
SUPPORTED_CRYPTOS = [
    {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "name_persian": "بیت کوین"},
    {"id": "ethereum", "symbol": "ETH", "name": "Ethereum", "name_persian": "اتریوم"},
    {"id": "tether", "symbol": "USDT", "name": "Tether", "name_persian": "تتر"},
    {"id": "binancecoin", "symbol": "BNB", "name": "BNB", "name_persian": "بایننس کوین"},
    {"id": "cardano", "symbol": "ADA", "name": "Cardano", "name_persian": "کاردانو"},
    {"id": "solana", "symbol": "SOL", "name": "Solana", "name_persian": "سولانا"},
    {"id": "polkadot", "symbol": "DOT", "name": "Polkadot", "name_persian": "پولکادات"},
    {"id": "chainlink", "symbol": "LINK", "name": "Chainlink", "name_persian": "چین لینک"},
    {"id": "uniswap", "symbol": "UNI", "name": "Uniswap", "name_persian": "یونی سواپ"},
    {"id": "litecoin", "symbol": "LTC", "name": "Litecoin", "name_persian": "لایت کوین"}
]

class CryptoService:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache_duration = timedelta(minutes=1)  # Cache for 1 minute
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def fetch_crypto_prices(self) -> List[CryptoCurrency]:
        """Fetch cryptocurrency prices from CoinGecko API"""
        try:
            session = await self.get_session()
            crypto_ids = ",".join([crypto["id"] for crypto in SUPPORTED_CRYPTOS])
            
            url = f"{COINGECKO_API_URL}/coins/markets"
            params = {
                "vs_currency": "usd",
                "ids": crypto_ids,
                "order": "market_cap_desc",
                "per_page": 100,
                "page": 1,
                "sparkline": False,
                "price_change_percentage": "24h"
            }
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return await self.process_crypto_data(data)
                else:
                    print(f"CoinGecko API error: {response.status}")
                    return await self.get_cached_crypto_data()
        
        except Exception as e:
            print(f"Error fetching crypto prices: {str(e)}")
            return await self.get_cached_crypto_data()
    
    async def process_crypto_data(self, data: List[Dict]) -> List[CryptoCurrency]:
        """Process raw crypto data from API"""
        cryptocurrencies = []
        
        for item in data:
            # Find Persian name
            persian_name = next(
                (crypto["name_persian"] for crypto in SUPPORTED_CRYPTOS 
                 if crypto["id"] == item["id"]), 
                item["name"]
            )
            
            crypto = CryptoCurrency(
                id=item["id"],
                symbol=item["symbol"].upper(),
                name=item["name"],
                name_persian=persian_name,
                price=float(item["current_price"]),
                price_irr=float(item["current_price"]) * IRR_USD_RATE,
                change_24h=float(item.get("price_change_percentage_24h", 0)),
                volume_24h=float(item.get("total_volume", 0)),
                market_cap=float(item.get("market_cap", 0)),
                high_24h=float(item.get("high_24h", item["current_price"])),
                low_24h=float(item.get("low_24h", item["current_price"])),
                logo_url=item.get("image", ""),
                updated_at=datetime.utcnow()
            )
            
            cryptocurrencies.append(crypto)
            
            # Update database cache
            await self.update_crypto_cache(crypto)
        
        return cryptocurrencies
    
    async def update_crypto_cache(self, crypto: CryptoCurrency):
        """Update cryptocurrency data in database cache"""
        existing = await find_document("cryptocurrencies", {"symbol": crypto.symbol})
        
        if existing:
            await update_document(
                "cryptocurrencies", 
                {"symbol": crypto.symbol}, 
                crypto.dict()
            )
        else:
            await insert_document("cryptocurrencies", crypto.dict())
    
    async def get_cached_crypto_data(self) -> List[CryptoCurrency]:
        """Get cached cryptocurrency data from database"""
        cached_data = await find_documents("cryptocurrencies", {})
        
        if not cached_data:
            # Return mock data if no cache available
            return self.get_mock_crypto_data()
        
        return [CryptoCurrency(**item) for item in cached_data]
    
    def get_mock_crypto_data(self) -> List[CryptoCurrency]:
        """Return mock cryptocurrency data as fallback"""
        mock_data = [
            CryptoCurrency(
                id="bitcoin",
                symbol="BTC",
                name="Bitcoin",
                name_persian="بیت کوین",
                price=67850.0,
                price_irr=2847570000.0,
                change_24h=2.45,
                volume_24h=28500000000.0,
                market_cap=1335000000000.0,
                high_24h=68200.0,
                low_24h=66800.0,
                logo_url="https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
            ),
            CryptoCurrency(
                id="ethereum",
                symbol="ETH",
                name="Ethereum",
                name_persian="اتریوم",
                price=3850.0,
                price_irr=161700000.0,
                change_24h=-1.23,
                volume_24h=15200000000.0,
                market_cap=463000000000.0,
                high_24h=3920.0,
                low_24h=3810.0,
                logo_url="https://assets.coingecko.com/coins/images/279/large/ethereum.png"
            )
        ]
        return mock_data
    
    async def get_trading_pairs(self) -> List[TradingPair]:
        """Get available trading pairs"""
        cryptos = await self.get_cached_crypto_data()
        pairs = []
        
        for crypto in cryptos:
            if crypto.symbol != "USDT":
                pair = TradingPair(
                    pair=f"{crypto.symbol}/USDT",
                    base_currency=crypto.symbol,
                    quote_currency="USDT",
                    price=crypto.price,
                    change_24h=crypto.change_24h,
                    volume_24h=crypto.volume_24h,
                    active=True
                )
                pairs.append(pair)
        
        return pairs
    
    async def get_crypto_by_symbol(self, symbol: str) -> Optional[CryptoCurrency]:
        """Get cryptocurrency by symbol"""
        crypto_doc = await find_document("cryptocurrencies", {"symbol": symbol.upper()})
        if crypto_doc:
            return CryptoCurrency(**crypto_doc)
        return None
    
    async def get_chart_data(self, symbol: str, days: int = 7) -> List[ChartData]:
        """Get chart data for a cryptocurrency (mock implementation)"""
        # In production, this would fetch real historical data
        # For now, return mock chart data
        base_price = 67850.0 if symbol == "BTC" else 3850.0
        chart_data = []
        
        for i in range(days * 24):  # Hourly data
            timestamp = datetime.utcnow() - timedelta(hours=days * 24 - i)
            # Generate realistic price variations
            variation = (hash(str(timestamp)) % 200 - 100) / 1000  # ±10% variation
            price = base_price * (1 + variation)
            
            chart_data.append(ChartData(
                timestamp=timestamp,
                open=price,
                high=price * 1.02,
                low=price * 0.98,
                close=price,
                volume=1000000 + (hash(str(timestamp)) % 500000)
            ))
        
        return chart_data

# Global crypto service instance
crypto_service = None

async def get_crypto_service() -> CryptoService:
    """Get crypto service instance"""
    global crypto_service
    if not crypto_service:
        crypto_service = CryptoService()
    return crypto_service

async def update_crypto_prices_task():
    """Background task to update crypto prices periodically"""
    while True:
        try:
            service = await get_crypto_service()
            await service.fetch_crypto_prices()
            print("Crypto prices updated successfully")
        except Exception as e:
            print(f"Error updating crypto prices: {str(e)}")
        
        # Wait 60 seconds before next update
        await asyncio.sleep(60)
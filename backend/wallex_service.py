import aiohttp
import asyncio
import websockets
import json
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import os
import logging

from models import CryptoCurrency, TradingPair, ChartData
from database import find_documents, update_document, insert_document, find_document

# Wallex API configuration
WALLEX_API_KEY = "16402|z4Ecrm71K4sQieWClbz27BPLbmfjcnIkzRMCg2JF"
WALLEX_API_URL = "https://api.wallex.ir"
WALLEX_WS_URL = "wss://api.wallex.ir/ws"
IRR_USD_RATE = 42000  # Current approximate rate

# Setup logging
logger = logging.getLogger(__name__)

class WallexService:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.cache_duration = timedelta(minutes=1)
        self.markets_cache = {}
        self.prices_cache = {}
        self.last_update = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'x-api-key': WALLEX_API_KEY}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        if self.websocket:
            await self.websocket.close()
    
    async def get_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers={'x-api-key': WALLEX_API_KEY}
            )
        return self.session
    
    async def fetch_markets(self) -> List[dict]:
        """Fetch all available markets from Wallex API"""
        try:
            session = await self.get_session()
            url = f"{WALLEX_API_URL}/hector/web/v1/markets"
            
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('result', {}).get('success'):
                        markets = data['result']['markets']
                        self.markets_cache = {market['symbol']: market for market in markets}
                        logger.info(f"Fetched {len(markets)} markets from Wallex API")
                        return markets
                    else:
                        logger.error(f"Wallex API error: {data}")
                        return []
                else:
                    logger.error(f"HTTP error {response.status} from Wallex API")
                    return []
        
        except Exception as e:
            logger.error(f"Error fetching Wallex markets: {str(e)}")
            return []
    
    async def get_cryptocurrencies(self) -> List[CryptoCurrency]:
        """Convert Wallex markets to CryptoCurrency objects"""
        try:
            markets = await self.fetch_markets()
            cryptocurrencies = []
            
            for market in markets:
                # Only include USDT and TMN based markets for now
                if not market.get('is_usdt_based') and not market.get('is_tmn_based'):
                    continue
                
                # Extract base asset (the crypto being traded)
                base_asset = market.get('base_asset', '')
                symbol = market.get('en_base_asset', base_asset).upper()
                
                # Skip if it's the quote currency itself
                if symbol in ['USDT', 'TMN', 'IRT']:
                    continue
                
                price = float(market.get('price', 0))
                change_24h = float(market.get('change_24h', 0))
                volume_24h = float(market.get('volume_24h', 0))
                
                # Calculate IRR price
                if market.get('is_tmn_based'):
                    price_irr = price  # Already in TMN/IRR
                else:
                    price_irr = price * IRR_USD_RATE  # Convert from USDT to IRR
                
                crypto = CryptoCurrency(
                    id=symbol.lower(),
                    symbol=symbol,
                    name=market.get('en_base_asset', symbol),
                    name_persian=market.get('fa_base_asset', symbol),
                    price=float(price) if price else 0.0,
                    price_irr=float(price_irr) if price_irr else 0.0,
                    change_24h=float(change_24h) if change_24h else 0.0,
                    volume_24h=float(volume_24h) if volume_24h else 0.0,
                    market_cap=0.0,  # Not provided by Wallex API
                    high_24h=float(price * 1.05) if price else 0.0,  # Estimate
                    low_24h=float(price * 0.95) if price else 0.0,   # Estimate
                    logo_url=f"https://cdn.wallex.ir/static/media/crypto-icons/{symbol.lower()}.png",
                    updated_at=datetime.utcnow()
                )
                
                cryptocurrencies.append(crypto)
                
                # Update database cache
                await self.update_crypto_cache(crypto)
            
            logger.info(f"Processed {len(cryptocurrencies)} cryptocurrencies from Wallex")
            return cryptocurrencies
        
        except Exception as e:
            logger.error(f"Error processing Wallex cryptocurrencies: {str(e)}")
            return await self.get_cached_crypto_data()
    
    async def get_trading_pairs(self) -> List[TradingPair]:
        """Get available trading pairs from Wallex"""
        try:
            markets = await self.fetch_markets()
            pairs = []
            
            for market in markets:
                # Only include active spot markets
                if not market.get('is_spot', False):
                    continue
                
                pair = TradingPair(
                    pair=market['symbol'],
                    base_currency=market.get('en_base_asset', ''),
                    quote_currency=market.get('en_quote_asset', ''),
                    price=float(market.get('price', 0)),
                    change_24h=float(market.get('change_24h', 0)),
                    volume_24h=float(market.get('volume_24h', 0)),
                    active=True
                )
                pairs.append(pair)
            
            logger.info(f"Found {len(pairs)} trading pairs from Wallex")
            return pairs
        
        except Exception as e:
            logger.error(f"Error fetching Wallex trading pairs: {str(e)}")
            return []
    
    async def get_crypto_by_symbol(self, symbol: str) -> Optional[CryptoCurrency]:
        """Get cryptocurrency by symbol from Wallex data"""
        try:
            cryptos = await self.get_cryptocurrencies()
            return next((crypto for crypto in cryptos if crypto.symbol.upper() == symbol.upper()), None)
        except Exception as e:
            logger.error(f"Error getting crypto {symbol}: {str(e)}")
            return None
    
    async def update_crypto_cache(self, crypto: CryptoCurrency):
        """Update cryptocurrency data in database cache"""
        try:
            existing = await find_document("cryptocurrencies", {"symbol": crypto.symbol})
            
            if existing:
                await update_document(
                    "cryptocurrencies", 
                    {"symbol": crypto.symbol}, 
                    crypto.dict()
                )
            else:
                await insert_document("cryptocurrencies", crypto.dict())
        except Exception as e:
            logger.error(f"Error updating crypto cache: {str(e)}")
    
    async def get_cached_crypto_data(self) -> List[CryptoCurrency]:
        """Get cached cryptocurrency data from database"""
        try:
            cached_data = await find_documents("cryptocurrencies", {})
            if cached_data:
                return [CryptoCurrency(**item) for item in cached_data]
            return []
        except Exception as e:
            logger.error(f"Error getting cached crypto data: {str(e)}")
            return []
    
    async def start_websocket_connection(self):
        """Start WebSocket connection for real-time price updates"""
        try:
            logger.info("Connecting to Wallex WebSocket...")
            
            async with websockets.connect(WALLEX_WS_URL) as websocket:
                self.websocket = websocket
                
                # Subscribe to all price updates
                subscribe_message = ["subscribe", {"channel": "all@price"}]
                await websocket.send(json.dumps(subscribe_message))
                logger.info("Subscribed to Wallex all@price channel")
                
                # Listen for messages
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        if len(data) >= 2 and data[0] == "all@price":
                            price_data = data[1]
                            await self.process_price_update(price_data)
                    except Exception as e:
                        logger.error(f"Error processing WebSocket message: {str(e)}")
                        continue
        
        except Exception as e:
            logger.error(f"WebSocket connection error: {str(e)}")
            # Reconnect after delay
            await asyncio.sleep(5)
            await self.start_websocket_connection()
    
    async def process_price_update(self, price_data: dict):
        """Process real-time price update from WebSocket"""
        try:
            symbol = price_data.get('symbol', '')
            price = float(price_data.get('price', 0))
            change_24h = float(price_data.get('24h_ch', 0))
            
            # Extract base asset from symbol (e.g., BTCUSDT -> BTC)
            base_asset = symbol.replace('USDT', '').replace('TMN', '').replace('IRT', '')
            
            if base_asset and price > 0:
                # Update cache
                self.prices_cache[base_asset] = {
                    'price': price,
                    'change_24h': change_24h,
                    'updated_at': datetime.utcnow()
                }
                
                # Update database
                await update_document(
                    "cryptocurrencies",
                    {"symbol": base_asset},
                    {
                        "price": price,
                        "change_24h": change_24h,
                        "updated_at": datetime.utcnow()
                    }
                )
                
                logger.debug(f"Updated price for {base_asset}: ${price} ({change_24h:+.2f}%)")
        
        except Exception as e:
            logger.error(f"Error processing price update: {str(e)}")

# Global Wallex service instance
wallex_service = None

async def get_wallex_service() -> WallexService:
    """Get Wallex service instance"""
    global wallex_service
    if not wallex_service:
        wallex_service = WallexService()
    return wallex_service

async def update_wallex_prices_task():
    """Background task to update prices from Wallex API and WebSocket"""
    service = await get_wallex_service()
    
    # Start with initial API fetch
    await service.get_cryptocurrencies()
    
    # Start WebSocket connection for real-time updates
    websocket_task = asyncio.create_task(service.start_websocket_connection())
    
    # Periodic API refresh (every 5 minutes)
    while True:
        try:
            await asyncio.sleep(300)  # 5 minutes
            await service.get_cryptocurrencies()
            logger.info("Periodic Wallex data refresh completed")
        except Exception as e:
            logger.error(f"Error in periodic Wallex update: {str(e)}")
            await asyncio.sleep(60)  # Wait 1 minute before retry
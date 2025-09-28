#!/usr/bin/env python3
"""
Test the fallback crypto data function directly
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

# Set environment variables
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = 'test_database'

from wallex_service import WallexService

async def test_fallback():
    service = WallexService()
    
    print("Testing fallback crypto data...")
    fallback_data = await service.get_fallback_crypto_data()
    
    print(f"Fallback data contains {len(fallback_data)} cryptocurrencies:")
    for crypto in fallback_data:
        print(f"  - {crypto.symbol}: ${crypto.price}")
    
    print("\nTesting get_cryptocurrencies (should use fallback)...")
    crypto_data = await service.get_cryptocurrencies()
    
    print(f"get_cryptocurrencies returned {len(crypto_data)} cryptocurrencies:")
    for crypto in crypto_data:
        print(f"  - {crypto.symbol}: ${crypto.price}")

if __name__ == "__main__":
    asyncio.run(test_fallback())
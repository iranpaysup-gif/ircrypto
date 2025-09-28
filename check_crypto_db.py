#!/usr/bin/env python3
"""
Check cryptocurrency data in database
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

from database import connect_to_mongo, find_documents, close_mongo_connection

async def check_crypto_data():
    await connect_to_mongo()
    cached_data = await find_documents('cryptocurrencies', {})
    print(f'Cached cryptocurrencies in database: {len(cached_data)}')
    for crypto in cached_data:
        print(f'  - {crypto.get("symbol", "N/A")}: ${crypto.get("price", 0)}')
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_crypto_data())
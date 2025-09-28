#!/usr/bin/env python3
"""
Clear cached cryptocurrency data from database
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

# Set environment variables
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = 'test_database'

from database import connect_to_mongo, close_mongo_connection, db_instance

async def clear_crypto_cache():
    await connect_to_mongo()
    
    # Delete all cached cryptocurrency data
    result = await db_instance.db.cryptocurrencies.delete_many({})
    print(f"Deleted {result.deleted_count} cached cryptocurrency records")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(clear_crypto_cache())
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
from datetime import datetime

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

# Database instance
db_instance = Database()

async def connect_to_mongo():
    """Create database connection"""
    db_instance.client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db_instance.database = db_instance.client[os.environ["DB_NAME"]]
    
    # Create indexes for better performance
    await create_indexes()
    print("Connected to MongoDB successfully!")

async def close_mongo_connection():
    """Close database connection"""
    if db_instance.client:
        db_instance.client.close()
        print("Disconnected from MongoDB!")

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db_instance.database

async def create_indexes():
    """Create database indexes for optimal performance"""
    db = db_instance.database
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("created_at")
    
    # Orders collection indexes
    await db.orders.create_index("user_id")
    await db.orders.create_index("pair")
    await db.orders.create_index("status")
    await db.orders.create_index("created_at")
    await db.orders.create_index([("user_id", 1), ("status", 1)])
    
    # Transactions collection indexes
    await db.transactions.create_index("user_id")
    await db.transactions.create_index("type")
    await db.transactions.create_index("created_at")
    await db.transactions.create_index("status")
    
    # Cryptocurrencies collection indexes
    await db.cryptocurrencies.create_index("symbol", unique=True)
    await db.cryptocurrencies.create_index("updated_at")
    
    # Trading pairs collection indexes
    await db.trading_pairs.create_index("pair", unique=True)
    await db.trading_pairs.create_index("active")
    
    # Staking positions collection indexes
    await db.staking_positions.create_index("user_id")
    await db.staking_positions.create_index("status")
    await db.staking_positions.create_index("end_date")
    
    # Phone verification codes collection indexes
    await db.verification_codes.create_index("phone")
    await db.verification_codes.create_index("created_at", expireAfterSeconds=300)  # Expire after 5 minutes
    
    print("Database indexes created successfully!")

# Helper functions for database operations
async def insert_document(collection: str, document: dict) -> str:
    """Insert a document and return its ID"""
    db = await get_database()
    result = await db[collection].insert_one(document)
    return str(result.inserted_id)

async def find_document(collection: str, filter_dict: dict) -> Optional[dict]:
    """Find a single document"""
    db = await get_database()
    return await db[collection].find_one(filter_dict)

async def find_documents(collection: str, filter_dict: dict, limit: int = None, skip: int = 0, sort: list = None) -> list:
    """Find multiple documents"""
    db = await get_database()
    cursor = db[collection].find(filter_dict)
    
    if skip > 0:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
    if sort:
        cursor = cursor.sort(sort)
        
    return await cursor.to_list(length=limit)

async def update_document(collection: str, filter_dict: dict, update_dict: dict) -> bool:
    """Update a document"""
    db = await get_database()
    update_dict["updated_at"] = datetime.utcnow()
    result = await db[collection].update_one(filter_dict, {"$set": update_dict})
    return result.modified_count > 0

async def delete_document(collection: str, filter_dict: dict) -> bool:
    """Delete a document"""
    db = await get_database()
    result = await db[collection].delete_one(filter_dict)
    return result.deleted_count > 0

async def count_documents(collection: str, filter_dict: dict) -> int:
    """Count documents matching filter"""
    db = await get_database()
    return await db[collection].count_documents(filter_dict)
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
from pathlib import Path

# Import database functions
from .database import connect_to_mongo, close_mongo_connection

# Import route modules
from .routes.auth_routes import router as auth_router
from .routes.crypto_routes import router as crypto_router
from .routes.trading_routes import router as trading_router
from .routes.wallet_routes import router as wallet_router
from .routes.kyc_routes import router as kyc_router

# Import crypto service
from .crypto_service import update_crypto_prices_task

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(
    title="Wallex.ir Clone API",
    description="Complete cryptocurrency exchange API clone of Wallex.ir",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "Wallex.ir Clone API", 
        "version": "1.0.0",
        "status": "active"
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "wallex-api"}

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(crypto_router)
api_router.include_router(trading_router)
api_router.include_router(wallet_router)
api_router.include_router(kyc_router)

# Include the main API router
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Background task for updating crypto prices
crypto_update_task = None

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    global crypto_update_task
    
    logger.info("Starting Wallex.ir Clone API...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Start background task for crypto price updates
    crypto_update_task = asyncio.create_task(update_crypto_prices_task())
    
    logger.info("Application startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources"""
    global crypto_update_task
    
    logger.info("Shutting down Wallex.ir Clone API...")
    
    # Cancel background tasks
    if crypto_update_task:
        crypto_update_task.cancel()
        try:
            await crypto_update_task
        except asyncio.CancelledError:
            pass
    
    # Close database connection
    await close_mongo_connection()
    
    logger.info("Application shutdown complete!")

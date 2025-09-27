from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserLevel(str, Enum):
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"

class OrderStatus(str, Enum):
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    PARTIALLY_FILLED = "partially_filled"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRADE = "trade"
    STAKING_REWARD = "staking_reward"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class PhoneVerification(BaseModel):
    phone: str
    code: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    level: UserLevel = UserLevel.BRONZE
    verified: bool = False
    balance: Dict[str, float] = Field(default_factory=lambda: {"IRR": 0.0, "USD": 0.0})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    level: UserLevel
    verified: bool
    balance: Dict[str, float]

# Cryptocurrency Models
class CryptoCurrency(BaseModel):
    id: str
    symbol: str
    name: str
    name_persian: str
    price: float
    price_irr: float
    change_24h: float
    volume_24h: float
    market_cap: float
    high_24h: float
    low_24h: float
    logo_url: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TradingPair(BaseModel):
    pair: str
    base_currency: str
    quote_currency: str
    price: float
    change_24h: float
    volume_24h: float
    active: bool = True

# Trading Models
class OrderCreate(BaseModel):
    pair: str
    side: OrderSide
    type: OrderType
    amount: float
    price: Optional[float] = None  # Required for limit orders

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pair: str
    side: OrderSide
    type: OrderType
    amount: float
    price: float
    filled_amount: float = 0.0
    status: OrderStatus = OrderStatus.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    executed_at: Optional[datetime] = None

class OrderResponse(BaseModel):
    id: str
    pair: str
    side: OrderSide
    type: OrderType
    amount: float
    price: float
    filled_amount: float
    status: OrderStatus
    created_at: datetime
    executed_at: Optional[datetime]

# Transaction Models
class TransactionCreate(BaseModel):
    amount: float
    currency: str
    type: TransactionType
    description: Optional[str] = None

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    currency: str
    type: TransactionType
    status: TransactionStatus = TransactionStatus.PENDING
    description: Optional[str] = None
    order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Staking Models
class StakingOption(BaseModel):
    id: str
    coin: str
    name: str
    apy: float
    min_amount: float
    duration_days: int
    active: bool = True

class StakingPosition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    staking_option_id: str
    amount: float
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    apy: float
    status: str = "active"  # active, completed, cancelled
    rewards_earned: float = 0.0

# Chart Models
class ChartData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

# API Response Models
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Market Data Models
class MarketStats(BaseModel):
    total_volume_24h: float
    total_market_cap: float
    btc_dominance: float
    active_cryptocurrencies: int
    total_exchanges: int
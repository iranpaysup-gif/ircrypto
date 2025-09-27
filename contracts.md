# Wallex.ir Clone - API Contracts & Integration Guide

## Overview
This document defines the API contracts, data models, and integration patterns for the Wallex.ir cryptocurrency exchange clone.

## Frontend Components Created
- **Header**: Navigation with authentication, language selector, theme toggle
- **Hero**: Main landing section with phone registration and animated 3D logo
- **CryptoMarket**: Live cryptocurrency market data with sorting, filtering, and favorites
- **AuthModal**: Complete login/registration flow with phone verification
- **TradingInterface**: Advanced trading platform with charts, order forms, and history
- **UserDashboard**: User account management with wallet, trading history, staking
- **Footer**: Comprehensive footer with links, newsletter, social media

## Mock Data Currently Used
Located in `/frontend/src/mock/data.js`:

1. **cryptoData**: Cryptocurrency market data (Bitcoin, Ethereum, Tether, etc.)
2. **tradingPairs**: Trading pairs with prices and 24h changes
3. **walletData**: User wallet balances and assets
4. **tradingHistory**: Mock trading transaction history
5. **features**: Platform features for marketing sections
6. **news**: News and announcements
7. **chartData**: Price chart data for trading interface
8. **userLevels**: User verification levels (Bronze, Silver, Gold, Platinum)
9. **stakingOptions**: Staking products with APY rates
10. **faqData**: Support FAQ content

## API Endpoints to Implement

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-phone
POST /api/auth/logout
GET /api/auth/me
```

### Cryptocurrency Market Data
```
GET /api/crypto/list - Get all supported cryptocurrencies
GET /api/crypto/prices - Get current prices
GET /api/crypto/chart/{symbol} - Get price chart data
GET /api/trading/pairs - Get all trading pairs
```

### User Management
```
GET /api/user/profile - Get user profile
PUT /api/user/profile - Update user profile
GET /api/user/balance - Get user wallet balances
GET /api/user/level - Get user verification level
```

### Trading Operations
```
POST /api/trading/order - Place new order
GET /api/trading/orders - Get user orders
DELETE /api/trading/orders/{id} - Cancel order
GET /api/trading/history - Get trading history
```

### Wallet Operations
```
POST /api/wallet/deposit - Create deposit request
POST /api/wallet/withdraw - Create withdrawal request
GET /api/wallet/transactions - Get transaction history
```

### Staking Operations
```
GET /api/staking/options - Get available staking products
POST /api/staking/stake - Start staking position
GET /api/staking/positions - Get user staking positions
```

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  passwordHash: String,
  level: String, // Bronze, Silver, Gold, Platinum
  verified: Boolean,
  balance: {
    IRR: Number,
    USD: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  pair: String, // e.g., "BTC/USDT"
  side: String, // "buy" or "sell"
  type: String, // "market" or "limit"
  amount: Number,
  price: Number,
  status: String, // "open", "filled", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // "deposit", "withdrawal", "trade"
  amount: Number,
  currency: String,
  status: String,
  orderId: ObjectId, // if related to trading
  createdAt: Date
}
```

## Real Data Integration Requirements

### Live Cryptocurrency Data
- **Primary**: CoinGecko API for price data
- **Secondary**: Binance API for additional market data
- **Update Frequency**: Every 30 seconds for prices, real-time for trading pairs
- **Caching**: Redis cache for frequently accessed data

### External Services
- **SMS Service**: For phone verification (Kavenegar or similar)
- **Email Service**: For notifications and account management
- **Payment Gateway**: For IRR deposits/withdrawals
- **KYC Service**: For user verification

## Frontend-Backend Integration Plan

### Phase 1: Replace Mock Authentication
1. Connect AuthModal to real `/api/auth/*` endpoints
2. Implement JWT token storage and refresh
3. Add authentication guards to protected routes
4. Update user context with real user data

### Phase 2: Live Market Data
1. Replace `cryptoData` with live API calls
2. Implement WebSocket connection for real-time prices
3. Add proper error handling and loading states
4. Cache market data appropriately

### Phase 3: Trading Functionality
1. Connect TradingInterface to real trading endpoints
2. Implement real order placement and management
3. Add proper validation and risk management
4. Real-time order book updates

### Phase 4: User Dashboard Integration
1. Connect wallet data to real user balances
2. Implement actual deposit/withdrawal flows
3. Real trading history from database
4. Live staking positions and rewards

## Security Considerations
- JWT tokens with proper expiration
- Rate limiting on all endpoints
- Input validation and sanitization
- Secure password hashing (bcrypt)
- 2FA implementation for high-value operations
- API key rotation for external services

## Performance Optimizations
- Redis caching for market data
- Database indexing on frequently queried fields
- Pagination for large datasets
- WebSocket connections for real-time data
- CDN for static assets

## Error Handling Strategy
- Consistent error response format
- Proper HTTP status codes
- User-friendly Persian error messages
- Logging and monitoring integration
- Graceful degradation for external service failures
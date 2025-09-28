import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wallex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('wallex_token');
      localStorage.removeItem('wallex_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  resendCode: (phone) => api.post('/auth/resend-code', { phone }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Crypto API
export const cryptoAPI = {
  getList: (limit = 50, offset = 0) => api.get(`/crypto/list?limit=${limit}&offset=${offset}`),
  getPrices: () => api.get('/crypto/prices'),
  getPrice: (symbol) => api.get(`/crypto/price/${symbol}`),
  getChart: (symbol, days = 7) => api.get(`/crypto/chart/${symbol}?days=${days}`),
  getTradingPairs: () => api.get('/crypto/pairs'),
  getMarketStats: () => api.get('/crypto/market-stats'),
};

// Trading API
export const tradingAPI = {
  placeOrder: (orderData) => api.post('/trading/order', orderData),
  getOrders: (status = null, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (status) params.append('status', status);
    return api.get(`/trading/orders?${params}`);
  },
  cancelOrder: (orderId) => api.delete(`/trading/orders/${orderId}`),
  getHistory: (days = 30, limit = 50, offset = 0) => 
    api.get(`/trading/history?days=${days}&limit=${limit}&offset=${offset}`),
};

// Wallet API
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  deposit: (depositData) => api.post('/wallet/deposit', depositData),
  withdraw: (withdrawData) => api.post('/wallet/withdraw', withdrawData),
  getTransactions: (type = null, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (type) params.append('transaction_type', type);
    return api.get(`/wallet/transactions?${params}`);
  },
  getLimits: () => api.get('/wallet/limits'),
};

// KYC API
export const kycAPI = {
  getStatus: () => api.get('/kyc/status'),
  uploadDocument: (documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return api.post('/kyc/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  submit: (applicationData) => api.post('/kyc/submit', applicationData),
  verifyShahkar: (shahkarData) => api.post('/kyc/verify-shahkar', shahkarData),
  getDocuments: () => api.get('/kyc/documents'),
  getRequirements: () => api.get('/kyc/requirements'),
};

// SMS OTP API
export const smsAPI = {
  sendOTP: (phoneNumber, purpose = 'verification') => api.post('/auth/send-otp', {
    phone_number: phoneNumber,
    purpose: purpose
  }),
  verifyOTP: (phoneNumber, otpCode) => api.post('/auth/verify-phone', {
    phone: phoneNumber,
    code: otpCode
  })
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'خطای غیرمنتظره رخ داد';
};

export const isTokenValid = () => {
  const token = localStorage.getItem('wallex_token');
  if (!token) return false;
  
  try {
    // Simple token expiry check (in production, use proper JWT validation)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default api;
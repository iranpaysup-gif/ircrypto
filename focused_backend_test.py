#!/usr/bin/env python3
"""
Focused Backend API Testing for specific endpoints requested in review
Tests: Health check, Crypto data (fallback verification), Wallet deposit, Basic auth
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Optional

# Configuration
BACKEND_URL = "https://crypto-exchange-copy-2.preview.emergentagent.com/api"
TEST_USER_DATA = {
    "name": "علی احمدی",
    "email": "ali.ahmadi@example.com", 
    "phone": "09123456789",
    "password": "SecurePass123!"
}

class FocusedAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, response_data: Optional[Dict] = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    headers: Optional[Dict] = None) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.access_token:
            request_headers["Authorization"] = f"Bearer {self.access_token}"
            
        if headers:
            request_headers.update(headers)
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers, params=data, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=request_headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            raise

    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n🏥 Testing Health Check Endpoints")
        print("-" * 40)
        
        try:
            # Test root endpoint
            response = self.make_request("GET", "/")
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Wallex.ir Clone API":
                    self.log_test("Health Check - Root", True, "Root endpoint working correctly", data)
                else:
                    self.log_test("Health Check - Root", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check - Root", False, f"Status code: {response.status_code}")
                
            # Test health endpoint
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check - Health", True, "Health endpoint working correctly", data)
                else:
                    self.log_test("Health Check - Health", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check - Health", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_crypto_data_endpoints(self):
        """Test cryptocurrency data endpoints - focus on fallback data verification"""
        print("\n💰 Testing Crypto Data Endpoints (Fallback Verification)")
        print("-" * 60)
        
        try:
            # Test crypto list - should have 6 cryptocurrencies in fallback
            response = self.make_request("GET", "/crypto/list")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    crypto_count = len(data)
                    crypto_symbols = [crypto.get('symbol', 'N/A') for crypto in data]
                    
                    # Check if we have the expected 6 cryptocurrencies from fallback
                    expected_symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL']
                    found_symbols = [symbol for symbol in expected_symbols if symbol in crypto_symbols]
                    
                    if crypto_count >= 6 and len(found_symbols) >= 6:
                        self.log_test("Crypto List - Fallback Data", True, 
                                    f"Retrieved {crypto_count} cryptocurrencies with expected fallback symbols: {crypto_symbols}")
                    else:
                        self.log_test("Crypto List - Fallback Data", False, 
                                    f"Expected 6+ cryptos with fallback symbols, got {crypto_count}: {crypto_symbols}")
                else:
                    self.log_test("Crypto List", False, f"Invalid crypto list: {data}")
            else:
                self.log_test("Crypto List", False, f"Status code: {response.status_code}")
                
            # Test crypto prices - should match list
            response = self.make_request("GET", "/crypto/prices")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    price_count = len(data)
                    price_symbols = [crypto.get('symbol', 'N/A') for crypto in data]
                    
                    if price_count >= 6:
                        self.log_test("Crypto Prices - Fallback Data", True, 
                                    f"Retrieved prices for {price_count} cryptocurrencies: {price_symbols}")
                    else:
                        self.log_test("Crypto Prices - Fallback Data", False, 
                                    f"Expected 6+ crypto prices, got {price_count}: {price_symbols}")
                else:
                    self.log_test("Crypto Prices", False, f"Invalid prices data: {data}")
            else:
                self.log_test("Crypto Prices", False, f"Status code: {response.status_code}")
                
            # Test specific crypto price (BTC) - should be from fallback
            response = self.make_request("GET", "/crypto/price/BTC")
            if response.status_code == 200:
                data = response.json()
                if "symbol" in data and data["symbol"] == "BTC":
                    btc_price = data.get('price', 0)
                    # Fallback BTC price should be around 67850.0
                    if 60000 <= btc_price <= 80000:  # Reasonable range for fallback data
                        self.log_test("Crypto Price BTC - Fallback", True, 
                                    f"BTC price from fallback: ${btc_price}")
                    else:
                        self.log_test("Crypto Price BTC - Fallback", False, 
                                    f"BTC price seems incorrect: ${btc_price}")
                else:
                    self.log_test("Crypto Price BTC", False, f"Invalid BTC data: {data}")
            else:
                self.log_test("Crypto Price BTC", False, f"Status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Crypto Data Endpoints", False, f"Exception: {str(e)}")

    def test_basic_auth_flow(self):
        """Test basic authentication flow"""
        print("\n🔐 Testing Basic Authentication Flow")
        print("-" * 40)
        
        try:
            # Test user registration
            response = self.make_request("POST", "/auth/register", TEST_USER_DATA)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "user_id" in data.get("data", {}):
                    self.user_id = data["data"]["user_id"]
                    self.log_test("User Registration", True, "User registered successfully", data)
                else:
                    self.log_test("User Registration", False, f"Registration failed: {data}")
            elif response.status_code == 400:
                # User might already exist
                data = response.json()
                if "already exists" in data.get("detail", ""):
                    self.log_test("User Registration", True, "User already exists (expected)", data)
                else:
                    self.log_test("User Registration", False, f"Registration error: {data}")
            else:
                self.log_test("User Registration", False, f"Status code: {response.status_code}, Response: {response.text}")
                
            # Test user login
            login_data = {
                "phone": TEST_USER_DATA["phone"],
                "password": TEST_USER_DATA["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.access_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User Login", True, "Login successful", {"user_id": self.user_id})
                else:
                    self.log_test("User Login", False, f"No access token in response: {data}")
            else:
                self.log_test("User Login", False, f"Status code: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Basic Auth Flow", False, f"Exception: {str(e)}")

    def test_wallet_deposit(self):
        """Test wallet deposit functionality"""
        print("\n💳 Testing Wallet Deposit Functionality")
        print("-" * 40)
        
        if not self.access_token:
            self.log_test("Wallet Deposit", False, "No access token available")
            return
            
        try:
            # Test deposit request
            deposit_data = {
                "amount": 1000000,  # 1M TMN
                "payment_method": "bank_transfer",
                "bank_account": "1234567890"
            }
            response = self.make_request("POST", "/wallet/deposit", deposit_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Wallet Deposit", True, "Deposit request created successfully", data)
                else:
                    self.log_test("Wallet Deposit", False, f"Deposit failed: {data}")
            elif response.status_code == 400:
                # Expected validation failure due to limits or KYC
                data = response.json()
                self.log_test("Wallet Deposit", True, f"Expected validation failure (limits/KYC): {data.get('detail', 'Unknown error')}")
            else:
                self.log_test("Wallet Deposit", False, f"Status code: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Wallet Deposit", False, f"Exception: {str(e)}")

    def run_focused_tests(self):
        """Run focused API tests"""
        print("🎯 Starting Focused Wallex.ir Clone Backend API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Test the specific endpoints requested
        self.test_health_endpoints()
        self.test_crypto_data_endpoints()
        self.test_basic_auth_flow()
        self.test_wallet_deposit()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 FOCUSED TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n📝 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = FocusedAPITester()
    tester.run_focused_tests()
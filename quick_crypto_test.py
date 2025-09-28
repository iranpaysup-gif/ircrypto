#!/usr/bin/env python3
"""
Quick test for crypto endpoints to verify fallback data
"""

import requests
import json

BACKEND_URL = "https://crypto-exchange-copy-2.preview.emergentagent.com/api"

def test_crypto_endpoints():
    print("🔍 Testing Crypto Endpoints with Fallback Data")
    print("=" * 50)
    
    try:
        # Test crypto list
        print("Testing /crypto/list...")
        response = requests.get(f"{BACKEND_URL}/crypto/list", timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Crypto List: {len(data)} cryptocurrencies found")
            
            symbols = [crypto.get('symbol', 'N/A') for crypto in data]
            print(f"   Symbols: {symbols}")
            
            # Check for expected fallback symbols
            expected_symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL']
            found_expected = [s for s in expected_symbols if s in symbols]
            
            if len(found_expected) >= 6:
                print(f"✅ Fallback data confirmed: Found {len(found_expected)} expected symbols")
            else:
                print(f"⚠️  Only found {len(found_expected)} expected symbols: {found_expected}")
                
            # Show first crypto details
            if data:
                first_crypto = data[0]
                print(f"   Sample crypto: {first_crypto.get('symbol')} - ${first_crypto.get('price', 0)}")
        else:
            print(f"❌ Crypto List failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing crypto list: {str(e)}")
    
    try:
        # Test crypto prices
        print("\nTesting /crypto/prices...")
        response = requests.get(f"{BACKEND_URL}/crypto/prices", timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Crypto Prices: {len(data)} price entries found")
            
            symbols = [crypto.get('symbol', 'N/A') for crypto in data]
            print(f"   Price symbols: {symbols}")
        else:
            print(f"❌ Crypto Prices failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing crypto prices: {str(e)}")
    
    try:
        # Test BTC price specifically
        print("\nTesting /crypto/price/BTC...")
        response = requests.get(f"{BACKEND_URL}/crypto/price/BTC", timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            btc_price = data.get('price', 0)
            print(f"✅ BTC Price: ${btc_price}")
            
            # Check if it's fallback data (around 67850)
            if 60000 <= btc_price <= 80000:
                print("✅ BTC price appears to be from fallback data")
            else:
                print(f"⚠️  BTC price might not be from fallback: ${btc_price}")
        else:
            print(f"❌ BTC Price failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing BTC price: {str(e)}")

if __name__ == "__main__":
    test_crypto_endpoints()
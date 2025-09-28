#!/usr/bin/env python3
"""
Complete KYC Flow Test - Upload required documents and submit KYC application
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "https://crypto-exchange-copy-2.preview.emergentagent.com/api"

IRANIAN_USER_DATA = {
    "name": "محمد رضایی",
    "email": "mohammad.rezaei@gmail.com", 
    "phone": "09123456789",
    "password": "SecurePass123!"
}

IRANIAN_KYC_DATA = {
    "full_name": "محمد رضا رضایی",
    "national_id": "0123456789",
    "birth_date": "1990-05-15",
    "address": "تهران، خیابان ولیعصر، پلاک ۱۲۳",
    "phone": "09123456789"
}

class CompleteKYCTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.access_token = None
        
    def login(self):
        """Login to get access token"""
        login_data = {
            "phone": IRANIAN_USER_DATA["phone"],
            "password": IRANIAN_USER_DATA["password"]
        }
        
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False
    
    def upload_document(self, document_type, filename):
        """Upload a KYC document"""
        if not self.access_token:
            return False
            
        mock_content = b"Mock document content for testing"
        
        files = {
            'file': (filename, mock_content, 'image/jpeg')
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        params = {
            'document_type': document_type
        }
        
        response = self.session.post(
            f"{self.base_url}/kyc/upload-document",
            files=files,
            headers=headers,
            params=params
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {document_type} uploaded successfully - ID: {data['data']['document_id']}")
            return True
        else:
            print(f"❌ {document_type} upload failed: {response.status_code} - {response.text}")
            return False
    
    def submit_kyc(self):
        """Submit KYC application"""
        if not self.access_token:
            return False
            
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        response = self.session.post(
            f"{self.base_url}/kyc/submit",
            json=IRANIAN_KYC_DATA,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ KYC application submitted successfully - ID: {data['data']['submission_id']}")
            return True
        else:
            print(f"❌ KYC submission failed: {response.status_code} - {response.text}")
            return False
    
    def check_kyc_status(self):
        """Check KYC status after submission"""
        if not self.access_token:
            return False
            
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        response = self.session.get(
            f"{self.base_url}/kyc/status",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            kyc_data = data['data']
            print(f"✅ KYC Status Check:")
            print(f"   - Verified: {kyc_data['verified']}")
            print(f"   - Level: {kyc_data['level']}")
            print(f"   - Documents: {kyc_data['documents_count']}")
            if kyc_data['latest_submission']:
                print(f"   - Latest Submission Status: {kyc_data['latest_submission']['status']}")
            return True
        else:
            print(f"❌ KYC status check failed: {response.status_code}")
            return False
    
    def run_complete_kyc_flow(self):
        """Run the complete KYC flow"""
        print("🆔 Testing Complete KYC Flow")
        print("=" * 50)
        
        # Step 1: Login
        if not self.login():
            return
        
        # Step 2: Upload required documents
        print("\n📄 Uploading required documents...")
        self.upload_document("national_id", "national_id.jpg")
        self.upload_document("selfie", "selfie_with_id.jpg")
        
        # Step 3: Submit KYC application
        print("\n📝 Submitting KYC application...")
        self.submit_kyc()
        
        # Step 4: Check final status
        print("\n🔍 Checking final KYC status...")
        self.check_kyc_status()

if __name__ == "__main__":
    tester = CompleteKYCTester()
    tester.run_complete_kyc_flow()
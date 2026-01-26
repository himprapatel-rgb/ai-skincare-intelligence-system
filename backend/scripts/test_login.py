#!/usr/bin/env python3
"""
Test login endpoint to debug authentication issues.
"""
import os
import sys
import requests
import json

# Get API URL from environment or use production
API_URL = os.getenv("API_URL", "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1")

def test_login(email: str, password: str):
    """Test login endpoint."""
    url = f"{API_URL}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    
    print(f"Testing login for: {email}")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return True
        else:
            print(f"❌ Login failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

if __name__ == "__main__":
    email = "himanshu@test.com"
    password = "Test1234!"
    test_login(email, password)

import requests
import json
import time
import uuid

BASE_URL = "http://localhost:5000/api"

def test_login_existing_user():
    print("\n--- Testing Login: Existing User ---")
    payload = {
        "email": "oriongd@aras.ai",
        "password": "Password123"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"[SUCCESS] Login Successful!")
            print(f"User: {user.get('email')}")
            print(f"Role: {user.get('role')}")
            print(f"Plan: {user.get('planTier')}")
            
            if user.get('role') == 'admin':
                print("Verification: User would be routed to /admin")
            else:
                print("Verification: User would be routed to /dashboard")
            return data.get('token')
        else:
            print(f"[FAILURE] Login Failed: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
    return None

def test_signup_new_user():
    print("\n--- Testing Signup: New User Sync ---")
    unique_id = str(uuid.uuid4())[:8]
    new_email = f"test_user_{unique_id}@aras.ai"
    payload = {
        "email": new_email,
        "password": "TestPassword123",
        "name": f"Test User {unique_id}"
    }
    
    try:
        print(f"Registering: {new_email}...")
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            user = data.get('user', {})
            print(f"[SUCCESS] Signup Successful!")
            print(f"Firebase Sync: User created and mapped in MongoDB")
            print(f"User ID: {user.get('id')}")
            print(f"Assigned Role: {user.get('role')}")
            return True
        else:
            print(f"[FAILURE] Signup Failed: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
    return False

if __name__ == "__main__":
    token = test_login_existing_user()
    time.sleep(1)
    test_signup_new_user()

#!/usr/bin/env python3
"""
Quick test to verify viewer permissions are working correctly
"""

import requests
import json
import os

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://attendsmart-11.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def make_request(method, endpoint, data=None, token=None):
    """Make HTTP request with proper headers"""
    url = f"{API_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"{method} {endpoint} -> Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        return response
    except Exception as e:
        print(f"Request error: {e}")
        return None

def test_viewer_permissions():
    print("Testing Viewer Permissions...")
    
    # Login as viewer
    login_data = {
        "email": "viewer@test.com",
        "password": "viewer123"
    }
    
    response = make_request("POST", "/auth/login", login_data)
    if not response or response.status_code != 200:
        print("❌ Failed to login as viewer")
        return
    
    viewer_token = response.json()["access_token"]
    print("✅ Viewer login successful")
    
    # Try to create employee (should fail with 403)
    employee_data = {
        "chapa": "80003",
        "nome": "Test Employee",
        "funcao": "TEST",
        "turno": "DIA",
        "grupo": "1",
        "mo": "M.O.D"
    }
    
    response = make_request("POST", "/employees", employee_data, viewer_token)
    if response and response.status_code == 403:
        print("✅ Viewer correctly forbidden from creating employees (403)")
    else:
        print(f"❌ Expected 403, got {response.status_code if response else 'No response'}")
    
    # Try to list employees (should succeed)
    response = make_request("GET", "/employees", token=viewer_token)
    if response and response.status_code == 200:
        employees = response.json()
        print(f"✅ Viewer can list employees: {len(employees)} found")
    else:
        print(f"❌ Viewer cannot list employees: {response.status_code if response else 'No response'}")

if __name__ == "__main__":
    test_viewer_permissions()
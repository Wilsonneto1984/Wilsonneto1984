#!/usr/bin/env python3
"""
Employee Management System Backend Test Suite
Tests all backend functionality according to FASE 1 requirements
"""

import requests
import json
import csv
import io
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-repository-2.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class EmployeeManagementTester:
    def __init__(self):
        self.super_admin_token = None
        self.company_admin_token = None
        self.viewer_token = None
        self.company_id = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED - {message}")
    
    def make_request(self, method, endpoint, data=None, files=None, token=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if files:
            # Remove content-type for file uploads
            headers.pop("Content-Type", None)
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method == "POST":
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            
            return response
        except Exception as e:
            print(f"Request error: {e}")
            return None
    
    def test_1_super_admin_login(self):
        """Test 1: Super Admin Authentication"""
        print("\n=== Test 1: Super Admin Authentication ===")
        
        # Login as super admin
        login_data = {
            "email": "admin@system.com",
            "password": "admin123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and data["user"]["role"] == "super_admin":
                self.super_admin_token = data["access_token"]
                self.log_result("Super Admin Login", True, f"Token received, role: {data['user']['role']}")
            else:
                self.log_result("Super Admin Login", False, "Invalid response structure")
        else:
            self.log_result("Super Admin Login", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_2_auth_me_endpoint(self):
        """Test 2: /auth/me endpoint with token"""
        print("\n=== Test 2: Auth Me Endpoint ===")
        
        if not self.super_admin_token:
            self.log_result("Auth Me Endpoint", False, "No super admin token available")
            return
        
        response = self.make_request("GET", "/auth/me", token=self.super_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data["email"] == "admin@system.com" and data["role"] == "super_admin":
                self.log_result("Auth Me Endpoint", True, f"User: {data['name']}, Role: {data['role']}")
            else:
                self.log_result("Auth Me Endpoint", False, "Incorrect user data returned")
        else:
            self.log_result("Auth Me Endpoint", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_3_create_company(self):
        """Test 3: Create Test Company"""
        print("\n=== Test 3: Create Test Company ===")
        
        if not self.super_admin_token:
            self.log_result("Create Company", False, "No super admin token available")
            return
        
        company_data = {
            "name": "Empresa Teste 1",
            "subscription_type": "monthly",
            "admin_email": "empresa1@test.com",
            "admin_password": "senha123",
            "admin_name": "Admin Empresa 1"
        }
        
        response = self.make_request("POST", "/companies", company_data, token=self.super_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data["name"] == "Empresa Teste 1":
                self.company_id = data["id"]
                self.log_result("Create Company", True, f"Company ID: {self.company_id}")
            else:
                self.log_result("Create Company", False, "Company data mismatch")
        else:
            self.log_result("Create Company", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_4_list_companies(self):
        """Test 4: List All Companies"""
        print("\n=== Test 4: List All Companies ===")
        
        if not self.super_admin_token:
            self.log_result("List Companies", False, "No super admin token available")
            return
        
        response = self.make_request("GET", "/companies", token=self.super_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                found_test_company = any(company["name"] == "Empresa Teste 1" for company in data)
                if found_test_company:
                    self.log_result("List Companies", True, f"Found {len(data)} companies including test company")
                else:
                    self.log_result("List Companies", False, "Test company not found in list")
            else:
                self.log_result("List Companies", False, "No companies returned")
        else:
            self.log_result("List Companies", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_5_company_admin_login(self):
        """Test 5: Company Admin Login"""
        print("\n=== Test 5: Company Admin Login ===")
        
        login_data = {
            "email": "empresa1@test.com",
            "password": "senha123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and data["user"]["role"] == "company_admin":
                self.company_admin_token = data["access_token"]
                self.log_result("Company Admin Login", True, f"Role: {data['user']['role']}, Company: {data['user']['company_id']}")
            else:
                self.log_result("Company Admin Login", False, "Invalid response structure")
        else:
            self.log_result("Company Admin Login", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_6_create_employees(self):
        """Test 6: Create Test Employees"""
        print("\n=== Test 6: Create Test Employees ===")
        
        if not self.company_admin_token:
            self.log_result("Create Employees", False, "No company admin token available")
            return
        
        # Employee 1
        employee1_data = {
            "chapa": "80001",
            "nome": "João Silva",
            "funcao": "MONTADOR DE ANDAIME",
            "turno": "DIA",
            "grupo": "1",
            "mo": "M.O.D",
            "admissao": "2024-01-15",
            "sindicato": "1"
        }
        
        response1 = self.make_request("POST", "/employees", employee1_data, token=self.company_admin_token)
        
        # Employee 2
        employee2_data = {
            "chapa": "80002",
            "nome": "Maria Santos",
            "funcao": "CALDEIREIRO",
            "turno": "NOITE",
            "grupo": "2",
            "mo": "M.O.I",
            "admissao": "2024-02-20",
            "sindicato": "1"
        }
        
        response2 = self.make_request("POST", "/employees", employee2_data, token=self.company_admin_token)
        
        success1 = response1 and response1.status_code == 200
        success2 = response2 and response2.status_code == 200
        
        if success1 and success2:
            self.log_result("Create Employees", True, "Both employees created successfully")
        elif success1 or success2:
            self.log_result("Create Employees", False, "Only one employee created successfully")
        else:
            self.log_result("Create Employees", False, "Failed to create employees")
    
    def test_7_list_employees(self):
        """Test 7: List All Employees"""
        print("\n=== Test 7: List All Employees ===")
        
        if not self.company_admin_token:
            self.log_result("List Employees", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/employees", token=self.company_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                chapas = [emp["chapa"] for emp in data]
                if "80001" in chapas and "80002" in chapas:
                    self.log_result("List Employees", True, f"Found {len(data)} employees including test employees")
                else:
                    self.log_result("List Employees", False, "Test employees not found in list")
            else:
                self.log_result("List Employees", False, f"Expected at least 2 employees, got {len(data) if isinstance(data, list) else 0}")
        else:
            self.log_result("List Employees", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_8_filter_employees_by_turno(self):
        """Test 8: Filter Employees by Turno"""
        print("\n=== Test 8: Filter Employees by Turno ===")
        
        if not self.company_admin_token:
            self.log_result("Filter Employees", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/employees", token=self.company_admin_token, params={"turno": "DIA"})
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                dia_employees = [emp for emp in data if emp["turno"] == "DIA"]
                if len(dia_employees) >= 1 and any(emp["chapa"] == "80001" for emp in dia_employees):
                    self.log_result("Filter Employees", True, f"Found {len(dia_employees)} DIA employees")
                else:
                    self.log_result("Filter Employees", False, "DIA employee 80001 not found")
            else:
                self.log_result("Filter Employees", False, "Invalid response format")
        else:
            self.log_result("Filter Employees", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_9_update_employee(self):
        """Test 9: Update Employee"""
        print("\n=== Test 9: Update Employee ===")
        
        if not self.company_admin_token:
            self.log_result("Update Employee", False, "No company admin token available")
            return
        
        update_data = {
            "grupo": "2"
        }
        
        response = self.make_request("PUT", "/employees/80001", update_data, token=self.company_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data["grupo"] == "2":
                self.log_result("Update Employee", True, f"Employee 80001 grupo updated to {data['grupo']}")
            else:
                self.log_result("Update Employee", False, "Grupo not updated correctly")
        else:
            self.log_result("Update Employee", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_10_get_employee_by_chapa(self):
        """Test 10: Get Employee by Chapa"""
        print("\n=== Test 10: Get Employee by Chapa ===")
        
        if not self.company_admin_token:
            self.log_result("Get Employee by Chapa", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/employees/80001", token=self.company_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data["chapa"] == "80001" and data["nome"] == "João Silva":
                self.log_result("Get Employee by Chapa", True, f"Employee: {data['nome']}, Grupo: {data['grupo']}")
            else:
                self.log_result("Get Employee by Chapa", False, "Employee data mismatch")
        else:
            self.log_result("Get Employee by Chapa", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_11_create_shifts(self):
        """Test 11: Create Shifts"""
        print("\n=== Test 11: Create Shifts ===")
        
        if not self.company_admin_token:
            self.log_result("Create Shifts", False, "No company admin token available")
            return
        
        # Create DIA shift
        shift_dia = {
            "name": "DIA",
            "start_time": "07:00",
            "end_time": "18:00",
            "description": "Turno diurno"
        }
        
        response1 = self.make_request("POST", "/shifts", shift_dia, token=self.company_admin_token)
        
        # Create NOITE shift
        shift_noite = {
            "name": "NOITE",
            "start_time": "18:00",
            "end_time": "06:00",
            "description": "Turno noturno"
        }
        
        response2 = self.make_request("POST", "/shifts", shift_noite, token=self.company_admin_token)
        
        success1 = response1 and response1.status_code == 200
        success2 = response2 and response2.status_code == 200
        
        if success1 and success2:
            self.log_result("Create Shifts", True, "Both shifts created successfully")
        else:
            self.log_result("Create Shifts", False, "Failed to create shifts")
    
    def test_12_list_shifts(self):
        """Test 12: List Shifts"""
        print("\n=== Test 12: List Shifts ===")
        
        if not self.company_admin_token:
            self.log_result("List Shifts", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/shifts", token=self.company_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                shift_names = [shift["name"] for shift in data]
                if "DIA" in shift_names and "NOITE" in shift_names:
                    self.log_result("List Shifts", True, f"Found {len(data)} shifts")
                else:
                    self.log_result("List Shifts", False, "Expected shifts not found")
            else:
                self.log_result("List Shifts", False, f"Expected at least 2 shifts, got {len(data) if isinstance(data, list) else 0}")
        else:
            self.log_result("List Shifts", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_13_create_attendance(self):
        """Test 13: Create Attendance Records"""
        print("\n=== Test 13: Create Attendance Records ===")
        
        if not self.company_admin_token:
            self.log_result("Create Attendance", False, "No company admin token available")
            return
        
        # Attendance for employee 80001
        attendance1 = {
            "employee_chapa": "80001",
            "date": "2024-12-01",
            "status": "P",
            "hora_batida": "07:30"
        }
        
        response1 = self.make_request("POST", "/attendance", attendance1, token=self.company_admin_token)
        
        # Attendance for employee 80002
        attendance2 = {
            "employee_chapa": "80002",
            "date": "2024-12-01",
            "status": "FALTA"
        }
        
        response2 = self.make_request("POST", "/attendance", attendance2, token=self.company_admin_token)
        
        success1 = response1 and response1.status_code == 200
        success2 = response2 and response2.status_code == 200
        
        if success1 and success2:
            self.log_result("Create Attendance", True, "Both attendance records created")
        else:
            self.log_result("Create Attendance", False, "Failed to create attendance records")
    
    def test_14_update_attendance(self):
        """Test 14: Update Attendance Status"""
        print("\n=== Test 14: Update Attendance Status ===")
        
        if not self.company_admin_token:
            self.log_result("Update Attendance", False, "No company admin token available")
            return
        
        # First get the attendance record for 80002
        response = self.make_request("GET", "/attendance", token=self.company_admin_token, 
                                   params={"date": "2024-12-01", "employee_chapa": "80002"})
        
        if response and response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                attendance_id = data[0]["id"]
                
                # Update status from FALTA to FO
                update_data = {
                    "status": "FO"
                }
                
                update_response = self.make_request("PUT", f"/attendance/{attendance_id}", 
                                                  update_data, token=self.company_admin_token)
                
                if update_response and update_response.status_code == 200:
                    updated_data = update_response.json()
                    if updated_data["status"] == "FO":
                        self.log_result("Update Attendance", True, "Status updated from FALTA to FO")
                    else:
                        self.log_result("Update Attendance", False, "Status not updated correctly")
                else:
                    self.log_result("Update Attendance", False, "Failed to update attendance")
            else:
                self.log_result("Update Attendance", False, "No attendance record found")
        else:
            self.log_result("Update Attendance", False, "Failed to get attendance record")
    
    def test_15_list_attendance(self):
        """Test 15: List Attendance for Date"""
        print("\n=== Test 15: List Attendance for Date ===")
        
        if not self.company_admin_token:
            self.log_result("List Attendance", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/attendance", token=self.company_admin_token, 
                                   params={"date": "2024-12-01"})
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                chapas = [att["employee_chapa"] for att in data]
                if "80001" in chapas and "80002" in chapas:
                    self.log_result("List Attendance", True, f"Found {len(data)} attendance records for 2024-12-01")
                else:
                    self.log_result("List Attendance", False, "Expected attendance records not found")
            else:
                self.log_result("List Attendance", False, f"Expected at least 2 records, got {len(data) if isinstance(data, list) else 0}")
        else:
            self.log_result("List Attendance", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_16_csv_import(self):
        """Test 16: CSV Import with Automatic Logic"""
        print("\n=== Test 16: CSV Import with Automatic Logic ===")
        
        if not self.company_admin_token:
            self.log_result("CSV Import", False, "No company admin token available")
            return
        
        # Create CSV content
        csv_content = """CHAPA,NOME,FUNCAO,BATIDA
80001,João Silva,MONTADOR DE ANDAIME,07:45
80002,Maria Santos,CALDEIREIRO,"""
        
        # Create file-like object
        csv_file = io.StringIO(csv_content)
        
        # Prepare form data
        files = {
            'file': ('test_attendance.csv', csv_content, 'text/csv')
        }
        data = {
            'date': '2024-12-02'
        }
        
        response = self.make_request("POST", "/import/csv", data=data, files=files, token=self.company_admin_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if result.get("processed", 0) >= 2 and result.get("created", 0) >= 2:
                self.log_result("CSV Import", True, f"Processed: {result['processed']}, Created: {result['created']}")
            else:
                self.log_result("CSV Import", False, f"Unexpected result: {result}")
        else:
            self.log_result("CSV Import", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_17_verify_csv_logic(self):
        """Test 17: Verify CSV Import Logic"""
        print("\n=== Test 17: Verify CSV Import Logic ===")
        
        if not self.company_admin_token:
            self.log_result("Verify CSV Logic", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/attendance", token=self.company_admin_token, 
                                   params={"date": "2024-12-02"})
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                # Check 80001 (DIA turno with batida) should be P
                emp_80001 = next((att for att in data if att["employee_chapa"] == "80001"), None)
                # Check 80002 (NOITE turno without batida) should be FALTA
                emp_80002 = next((att for att in data if att["employee_chapa"] == "80002"), None)
                
                if emp_80001 and emp_80002:
                    if emp_80001["status"] == "P" and emp_80002["status"] == "FALTA":
                        self.log_result("Verify CSV Logic", True, "CSV logic working correctly: P for DIA with batida, FALTA for no batida")
                    else:
                        self.log_result("Verify CSV Logic", False, f"Logic error: 80001={emp_80001['status']}, 80002={emp_80002['status']}")
                else:
                    self.log_result("Verify CSV Logic", False, "Attendance records not found")
            else:
                self.log_result("Verify CSV Logic", False, "No attendance records found for verification")
        else:
            self.log_result("Verify CSV Logic", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_18_deactivate_employee(self):
        """Test 18: Deactivate Employee"""
        print("\n=== Test 18: Deactivate Employee ===")
        
        if not self.company_admin_token:
            self.log_result("Deactivate Employee", False, "No company admin token available")
            return
        
        response = self.make_request("POST", "/employees/80002/deactivate", token=self.company_admin_token)
        
        if response and response.status_code == 200:
            self.log_result("Deactivate Employee", True, "Employee 80002 deactivated")
        else:
            self.log_result("Deactivate Employee", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_19_list_active_employees(self):
        """Test 19: List Active Employees (should not include 80002)"""
        print("\n=== Test 19: List Active Employees ===")
        
        if not self.company_admin_token:
            self.log_result("List Active Employees", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/employees", token=self.company_admin_token, 
                                   params={"active_only": True})
        
        if response and response.status_code == 200:
            data = response.json()
            chapas = [emp["chapa"] for emp in data]
            if "80001" in chapas and "80002" not in chapas:
                self.log_result("List Active Employees", True, "80002 correctly excluded from active list")
            else:
                self.log_result("List Active Employees", False, "Deactivated employee still in active list")
        else:
            self.log_result("List Active Employees", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_20_list_inactive_employees(self):
        """Test 20: List Inactive Employees (should include 80002)"""
        print("\n=== Test 20: List Inactive Employees ===")
        
        if not self.company_admin_token:
            self.log_result("List Inactive Employees", False, "No company admin token available")
            return
        
        response = self.make_request("GET", "/employees", token=self.company_admin_token, 
                                   params={"active_only": False})
        
        if response and response.status_code == 200:
            data = response.json()
            inactive_employees = [emp for emp in data if not emp.get("active", True)]
            chapas = [emp["chapa"] for emp in inactive_employees]
            if "80002" in chapas:
                self.log_result("List Inactive Employees", True, "80002 correctly in inactive list")
            else:
                self.log_result("List Inactive Employees", False, "Deactivated employee not found in inactive list")
        else:
            self.log_result("List Inactive Employees", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_21_create_viewer_user(self):
        """Test 21: Create Viewer User"""
        print("\n=== Test 21: Create Viewer User ===")
        
        if not self.company_admin_token or not self.company_id:
            self.log_result("Create Viewer User", False, "No company admin token or company ID available")
            return
        
        viewer_data = {
            "email": "viewer@test.com",
            "password": "viewer123",
            "name": "Test Viewer",
            "role": "company_viewer",
            "company_id": self.company_id
        }
        
        response = self.make_request("POST", "/users", viewer_data, token=self.company_admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data["role"] == "company_viewer":
                self.log_result("Create Viewer User", True, f"Viewer user created: {data['email']}")
            else:
                self.log_result("Create Viewer User", False, "Incorrect role assigned")
        else:
            self.log_result("Create Viewer User", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_22_viewer_login(self):
        """Test 22: Viewer User Login"""
        print("\n=== Test 22: Viewer User Login ===")
        
        login_data = {
            "email": "viewer@test.com",
            "password": "viewer123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and data["user"]["role"] == "company_viewer":
                self.viewer_token = data["access_token"]
                self.log_result("Viewer Login", True, f"Role: {data['user']['role']}")
            else:
                self.log_result("Viewer Login", False, "Invalid response structure")
        else:
            self.log_result("Viewer Login", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_23_viewer_create_employee_forbidden(self):
        """Test 23: Viewer Cannot Create Employee (should fail with 403)"""
        print("\n=== Test 23: Viewer Cannot Create Employee ===")
        
        if not self.viewer_token:
            self.log_result("Viewer Create Employee Forbidden", False, "No viewer token available")
            return
        
        employee_data = {
            "chapa": "80003",
            "nome": "Test Employee",
            "funcao": "TEST",
            "turno": "DIA",
            "grupo": "1",
            "mo": "M.O.D"
        }
        
        response = self.make_request("POST", "/employees", employee_data, token=self.viewer_token)
        
        if response is not None and response.status_code == 403:
            self.log_result("Viewer Create Employee Forbidden", True, "Correctly forbidden (403)")
        else:
            status_code = response.status_code if response is not None else "No response"
            self.log_result("Viewer Create Employee Forbidden", False, f"Expected 403, got {status_code}")
    
    def test_24_reactivate_employee(self):
        """Test 24: Reactivate Employee (viewer can do this)"""
        print("\n=== Test 24: Reactivate Employee ===")
        
        if not self.viewer_token:
            self.log_result("Reactivate Employee", False, "No viewer token available")
            return
        
        response = self.make_request("POST", "/employees/80002/reactivate", token=self.viewer_token)
        
        if response and response.status_code == 200:
            self.log_result("Reactivate Employee", True, "Employee 80002 reactivated by viewer")
        else:
            self.log_result("Reactivate Employee", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_25_viewer_list_employees(self):
        """Test 25: Viewer Can List Employees"""
        print("\n=== Test 25: Viewer Can List Employees ===")
        
        if not self.viewer_token:
            self.log_result("Viewer List Employees", False, "No viewer token available")
            return
        
        response = self.make_request("GET", "/employees", token=self.viewer_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 2:
                self.log_result("Viewer List Employees", True, f"Viewer can list {len(data)} employees")
            else:
                self.log_result("Viewer List Employees", False, "Insufficient employees returned")
        else:
            self.log_result("Viewer List Employees", False, f"Status: {response.status_code if response else 'No response'}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Employee Management System Backend Tests")
        print(f"🔗 API Base URL: {API_BASE}")
        
        # Authentication Tests
        self.test_1_super_admin_login()
        self.test_2_auth_me_endpoint()
        
        # Company Management Tests
        self.test_3_create_company()
        self.test_4_list_companies()
        
        # Company Admin Tests
        self.test_5_company_admin_login()
        
        # Employee Management Tests
        self.test_6_create_employees()
        self.test_7_list_employees()
        self.test_8_filter_employees_by_turno()
        self.test_9_update_employee()
        self.test_10_get_employee_by_chapa()
        
        # Shift Management Tests
        self.test_11_create_shifts()
        self.test_12_list_shifts()
        
        # Attendance Management Tests
        self.test_13_create_attendance()
        self.test_14_update_attendance()
        self.test_15_list_attendance()
        
        # CSV Import Tests
        self.test_16_csv_import()
        self.test_17_verify_csv_logic()
        
        # Employee Deactivation Tests
        self.test_18_deactivate_employee()
        self.test_19_list_active_employees()
        self.test_20_list_inactive_employees()
        
        # Viewer User Tests
        self.test_21_create_viewer_user()
        self.test_22_viewer_login()
        self.test_23_viewer_create_employee_forbidden()
        self.test_24_reactivate_employee()
        self.test_25_viewer_list_employees()
        
        # Print final results
        print(f"\n📊 TEST RESULTS:")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print(f"\n🔍 FAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        return self.test_results

if __name__ == "__main__":
    tester = EmployeeManagementTester()
    results = tester.run_all_tests()
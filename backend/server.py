from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class ShiftCreate(BaseModel):
    name: str
    start_time: str  # Format: "HH:MM"
    end_time: str    # Format: "HH:MM"
    description: Optional[str] = None

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    start_time: str
    end_time: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    name: str
    employee_id: str  # Matrícula/ID do funcionário
    position: str
    shift_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    employee_id: str
    position: str
    shift_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceRecordCreate(BaseModel):
    employee_id: str
    date: str  # Format: "YYYY-MM-DD"
    status: Literal["present", "absent", "medical_leave", "day_off", "vacation"]
    notes: Optional[str] = None

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: str
    status: Literal["present", "absent", "medical_leave", "day_off", "vacation"]
    notes: Optional[str] = None
    registered_by: str  # User ID who registered
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(email=user_data.email, name=user_data.name)
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token({"sub": user['id']})
    
    # Convert datetime
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    return TokenResponse(access_token=access_token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**{k: v for k, v in current_user.items() if k != 'password'})

# ============ SHIFT ROUTES ============

@api_router.post("/shifts", response_model=Shift)
async def create_shift(shift_data: ShiftCreate, current_user: dict = Depends(get_current_user)):
    shift = Shift(**shift_data.model_dump())
    shift_dict = shift.model_dump()
    shift_dict['created_at'] = shift_dict['created_at'].isoformat()
    
    await db.shifts.insert_one(shift_dict)
    return shift

@api_router.get("/shifts", response_model=List[Shift])
async def get_shifts():
    shifts = await db.shifts.find({}, {"_id": 0}).to_list(1000)
    for shift in shifts:
        if isinstance(shift['created_at'], str):
            shift['created_at'] = datetime.fromisoformat(shift['created_at'])
    return shifts

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.shifts.delete_one({"id": shift_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift deleted successfully"}

# ============ EMPLOYEE ROUTES ============

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    # Check if employee_id already exists
    existing = await db.employees.find_one({"employee_id": employee_data.employee_id})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    employee = Employee(**employee_data.model_dump())
    employee_dict = employee.model_dump()
    employee_dict['created_at'] = employee_dict['created_at'].isoformat()
    
    await db.employees.insert_one(employee_dict)
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(active_only: bool = True):
    query = {"active": True} if active_only else {}
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    for emp in employees:
        if isinstance(emp['created_at'], str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if isinstance(employee['created_at'], str):
        employee['created_at'] = datetime.fromisoformat(employee['created_at'])
    return employee

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_data.model_dump()
    await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated_employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if isinstance(updated_employee['created_at'], str):
        updated_employee['created_at'] = datetime.fromisoformat(updated_employee['created_at'])
    return Employee(**updated_employee)

@api_router.delete("/employees/{employee_id}")
async def deactivate_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.employees.update_one({"id": employee_id}, {"$set": {"active": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deactivated successfully"}

# ============ ATTENDANCE ROUTES ============

@api_router.post("/attendance", response_model=AttendanceRecord)
async def create_attendance_record(record_data: AttendanceRecordCreate, current_user: dict = Depends(get_current_user)):
    # Verify employee exists
    employee = await db.employees.find_one({"id": record_data.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if record for this date already exists
    existing = await db.attendance.find_one({
        "employee_id": record_data.employee_id,
        "date": record_data.date
    })
    
    if existing:
        # Update existing record
        update_data = record_data.model_dump()
        update_data['registered_by'] = current_user['id']
        update_data['registered_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.attendance.update_one(
            {"employee_id": record_data.employee_id, "date": record_data.date},
            {"$set": update_data}
        )
        
        updated_record = await db.attendance.find_one({
            "employee_id": record_data.employee_id,
            "date": record_data.date
        }, {"_id": 0})
        
        if isinstance(updated_record['registered_at'], str):
            updated_record['registered_at'] = datetime.fromisoformat(updated_record['registered_at'])
        return AttendanceRecord(**updated_record)
    else:
        # Create new record
        record = AttendanceRecord(**record_data.model_dump(), registered_by=current_user['id'])
        record_dict = record.model_dump()
        record_dict['registered_at'] = record_dict['registered_at'].isoformat()
        
        await db.attendance.insert_one(record_dict)
        return record

@api_router.get("/attendance", response_model=List[AttendanceRecord])
async def get_attendance_records(
    employee_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if employee_id:
        query['employee_id'] = employee_id
    if start_date and end_date:
        query['date'] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query['date'] = {"$gte": start_date}
    elif end_date:
        query['date'] = {"$lte": end_date}
    if status:
        query['status'] = status
    
    records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for record in records:
        if isinstance(record['registered_at'], str):
            record['registered_at'] = datetime.fromisoformat(record['registered_at'])
    return records

@api_router.get("/attendance/summary")
async def get_attendance_summary(date: Optional[str] = None):
    """Get summary of attendance for a specific date (or today)"""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get all active employees
    employees = await db.employees.find({"active": True}, {"_id": 0}).to_list(1000)
    
    # Get attendance records for the date
    records = await db.attendance.find({"date": date}, {"_id": 0}).to_list(1000)
    
    # Create a map of employee_id to attendance status
    attendance_map = {r['employee_id']: r for r in records}
    
    # Build summary
    summary = {
        "date": date,
        "total_employees": len(employees),
        "present": 0,
        "absent": 0,
        "medical_leave": 0,
        "day_off": 0,
        "vacation": 0,
        "not_registered": 0,
        "employees": []
    }
    
    for emp in employees:
        emp_summary = {
            "id": emp['id'],
            "name": emp['name'],
            "employee_id": emp['employee_id'],
            "position": emp['position'],
            "shift_id": emp.get('shift_id'),
            "status": "not_registered",
            "notes": None
        }
        
        if emp['id'] in attendance_map:
            record = attendance_map[emp['id']]
            emp_summary['status'] = record['status']
            emp_summary['notes'] = record.get('notes')
            summary[record['status']] += 1
        else:
            summary['not_registered'] += 1
        
        summary['employees'].append(emp_summary)
    
    return summary

@api_router.get("/")
async def root():
    return {"message": "Attendance System API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

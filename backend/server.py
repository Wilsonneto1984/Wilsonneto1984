from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import csv
import io

# Import models
from models import (
    Company, CompanyCreate, CompanyUpdate,
    User, UserCreate, UserLogin, TokenResponse,
    Employee, EmployeeCreate, EmployeeUpdate,
    Shift, ShiftCreate, ShiftUpdate,
    Attendance, AttendanceCreate, AttendanceUpdate,
    DayOff, Payment, PaymentCreate,
    CSVImportRow, CSVImportRequest,
    EmployeeAttendanceSummary, ShiftSummary, RecordistaItem
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'employee_management_system')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Employee Management System API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user['role'] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker


# ============ AUTH ROUTES ============

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check company access if not super admin
    if user['role'] != 'super_admin':
        company = await db.companies.find_one({"id": user['company_id']}, {"_id": 0})
        if not company or not company.get('active', True):
            raise HTTPException(status_code=403, detail="Company account is inactive")
        
        # Check subscription expiry
        if company.get('subscription_expires_at'):
            expires = datetime.fromisoformat(company['subscription_expires_at']) if isinstance(company['subscription_expires_at'], str) else company['subscription_expires_at']
            if expires < datetime.now(timezone.utc):
                raise HTTPException(status_code=403, detail="Company subscription has expired")
    
    access_token = create_access_token({"sub": user['id']})
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    return TokenResponse(access_token=access_token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**{k: v for k, v in current_user.items() if k != 'password'})


# ============ COMPANY ROUTES ============

@api_router.post("/companies", response_model=Company)
async def create_company(
    company_data: CompanyCreate,
    current_user: dict = Depends(require_role(["super_admin"]))
):
    existing = await db.companies.find_one({"name": company_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Company name already exists")
    
    existing_user = await db.users.find_one({"email": company_data.admin_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin email already registered")
    
    company = Company(
        name=company_data.name,
        subscription_type=company_data.subscription_type
    )
    
    if company_data.subscription_type == "monthly":
        company.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        company.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    
    company_dict = company.model_dump()
    company_dict['created_at'] = company_dict['created_at'].isoformat()
    company_dict['subscription_expires_at'] = company_dict['subscription_expires_at'].isoformat()
    
    await db.companies.insert_one(company_dict)
    
    admin_user = User(
        email=company_data.admin_email,
        name=company_data.admin_name,
        role="company_admin",
        company_id=company.id
    )
    
    admin_dict = admin_user.model_dump()
    admin_dict['password'] = hash_password(company_data.admin_password)
    admin_dict['created_at'] = admin_dict['created_at'].isoformat()
    
    await db.users.insert_one(admin_dict)
    
    return company

@api_router.get("/companies", response_model=List[Company])
async def get_companies(
    current_user: dict = Depends(require_role(["super_admin"]))
):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    for company in companies:
        if isinstance(company.get('created_at'), str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
        if isinstance(company.get('subscription_expires_at'), str):
            company['subscription_expires_at'] = datetime.fromisoformat(company['subscription_expires_at'])
    return companies

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'super_admin' and current_user['company_id'] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if isinstance(company.get('created_at'), str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    if isinstance(company.get('subscription_expires_at'), str):
        company['subscription_expires_at'] = datetime.fromisoformat(company['subscription_expires_at'])
    
    return Company(**company)

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(
    company_id: str,
    update_data: CompanyUpdate,
    current_user: dict = Depends(require_role(["super_admin"]))
):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.companies.update_one({"id": company_id}, {"$set": update_dict})
    
    updated_company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if isinstance(updated_company.get('created_at'), str):
        updated_company['created_at'] = datetime.fromisoformat(updated_company['created_at'])
    if isinstance(updated_company.get('subscription_expires_at'), str):
        updated_company['subscription_expires_at'] = datetime.fromisoformat(updated_company['subscription_expires_at'])
    
    return Company(**updated_company)

@api_router.post("/companies/{company_id}/logo")
async def upload_company_logo(
    company_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'super_admin' and current_user['company_id'] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user['role'] == 'company_viewer':
        raise HTTPException(status_code=403, detail="Viewers cannot upload logos")
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    uploads_dir = ROOT_DIR / "uploads" / "logos"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    file_extension = file.filename.split('.')[-1]
    filename = f"{company_id}.{file_extension}"
    file_path = uploads_dir / filename
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    logo_url = f"/api/companies/{company_id}/logo/{filename}"
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {"logo_url": logo_url}}
    )
    
    return {"logo_url": logo_url, "message": "Logo uploaded successfully"}

@api_router.get("/companies/{company_id}/logo/{filename}")
async def get_company_logo(company_id: str, filename: str):
    file_path = ROOT_DIR / "uploads" / "logos" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(file_path)


# Mount the API router
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Employee Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

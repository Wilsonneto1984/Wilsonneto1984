"""
Employee Management System - Main Server
Multi-tenant system for employee attendance and shift management
"""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'employee_management_system')]

# Create app
app = FastAPI(title="Employee Management System API")
api_router = APIRouter(prefix="/api")

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

# Import and register routes
from routes import auth_routes, company_routes, employee_routes, attendance_routes, report_routes

auth_routes.register_routes(api_router, db)
company_routes.register_routes(api_router, db)
employee_routes.register_routes(api_router, db)
attendance_routes.register_routes(api_router, db)
report_routes.register_routes(api_router, db)

# Mount router
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Employee Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

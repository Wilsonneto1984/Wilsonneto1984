"""
Authentication routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from models import User, UserLogin, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, get_current_user


def register_routes(router: APIRouter, db):
    
    @router.post("/auth/login", response_model=TokenResponse)
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
    
    @router.get("/auth/me", response_model=User)
    async def get_me(current_user: dict = Depends(lambda creds: get_current_user(creds, db))):
        if isinstance(current_user['created_at'], str):
            current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
        return User(**{k: v for k, v in current_user.items() if k != 'password'})

"""
Script para inicializar o banco de dados com um usuário admin padrão
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def init_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔄 Inicializando banco de dados...")
    
    # Check if admin user already exists
    admin_user = await db.users.find_one({"email": "admin@admin.com"})
    
    if not admin_user:
        # Create admin user
        hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@admin.com",
            "name": "Administrador",
            "password": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        print("✅ Usuário admin criado com sucesso!")
        print("   Email: admin@admin.com")
        print("   Senha: admin123")
    else:
        print("ℹ️  Usuário admin já existe")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.employees.create_index("employee_id", unique=True)
    await db.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)
    
    print("✅ Índices criados com sucesso!")
    print("✅ Banco de dados inicializado!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())

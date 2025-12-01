"""
Script de Inicialização do Banco de Dados MongoDB
Sistema de Controle de Efetivo Multi-Empresa

Execute este script para criar a estrutura do banco de dados e inserir dados iniciais.
Uso: python init_database.py
"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'efetivo_db'

async def init_database():
    """Inicializa o banco de dados com estrutura e dados iniciais"""
    
    print("=" * 60)
    print("INICIALIZANDO BANCO DE DADOS - Sistema de Controle de Efetivo")
    print("=" * 60)
    
    # Conectar ao MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print(f"\n✓ Conectado ao MongoDB: {MONGO_URL}")
    print(f"✓ Banco de dados: {DATABASE_NAME}\n")
    
    # ============ CRIAR ÍNDICES ============
    print("📊 Criando índices...")
    
    # Índices para Companies
    await db.companies.create_index("company_code", unique=True)
    await db.companies.create_index("name")
    print("  ✓ Índices da coleção 'companies' criados")
    
    # Índices para Users
    await db.users.create_index([("email", 1), ("company_id", 1)], unique=True)
    await db.users.create_index("role")
    print("  ✓ Índices da coleção 'users' criados")
    
    # Índices para Employees
    await db.employees.create_index([("company_id", 1), ("chapa", 1)], unique=True)
    await db.employees.create_index([("company_id", 1), ("active", 1)])
    await db.employees.create_index([("company_id", 1), ("turno", 1)])
    print("  ✓ Índices da coleção 'employees' criados")
    
    # Índices para Attendance
    await db.attendance.create_index([("company_id", 1), ("date", 1), ("employee_chapa", 1)], unique=True)
    await db.attendance.create_index([("company_id", 1), ("date", 1)])
    await db.attendance.create_index([("company_id", 1), ("employee_chapa", 1)])
    print("  ✓ Índices da coleção 'attendance' criados")
    
    # Índices para Shifts
    await db.shifts.create_index([("company_id", 1), ("name", 1)], unique=True)
    print("  ✓ Índices da coleção 'shifts' criados\n")
    
    # ============ LIMPAR DADOS EXISTENTES (OPCIONAL) ============
    print("🗑️  Limpando dados existentes...")
    await db.companies.delete_many({})
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.attendance.delete_many({})
    await db.shifts.delete_many({})
    print("  ✓ Dados anteriores removidos\n")
    
    # ============ CRIAR SUPER ADMIN ============
    print("👤 Criando Super Admin...")
    
    super_admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    super_admin = {
        "id": str(uuid4()),
        "email": "admin@system.com",
        "password": super_admin_password,
        "name": "Administrador do Sistema",
        "role": "super_admin",
        "company_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(super_admin)
    print(f"  ✓ Super Admin criado")
    print(f"    Email: admin@system.com")
    print(f"    Senha: admin123\n")
    
    # ============ CRIAR EMPRESAS DE TESTE ============
    print("🏢 Criando empresas de teste...")
    
    # Empresa 1: REVAP
    company1_id = str(uuid4())
    company1 = {
        "id": company1_id,
        "name": "REVAP - Refinaria do Vale do Paraíba",
        "company_code": "REVAP2024",
        "logo_url": None,
        "active": True,
        "subscription_type": "annual",
        "subscription_expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "mercado_pago_customer_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(company1)
    print(f"  ✓ Empresa REVAP criada")
    print(f"    Código: REVAP2024")
    
    # Criar Admin da REVAP
    revap_admin_password = bcrypt.hashpw("revap123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    revap_admin = {
        "id": str(uuid4()),
        "email": "admin@revap.com",
        "password": revap_admin_password,
        "name": "Administrador REVAP",
        "role": "company_admin",
        "company_id": company1_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(revap_admin)
    print(f"    Admin: admin@revap.com / revap123")
    
    # Criar Viewer da REVAP
    revap_viewer_password = bcrypt.hashpw("viewer123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    revap_viewer = {
        "id": str(uuid4()),
        "email": "viewer@revap.com",
        "password": revap_viewer_password,
        "name": "Visualizador REVAP",
        "role": "company_viewer",
        "company_id": company1_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(revap_viewer)
    print(f"    Viewer: viewer@revap.com / viewer123\n")
    
    # Empresa 2: PETRO
    company2_id = str(uuid4())
    company2 = {
        "id": company2_id,
        "name": "PETROBRAS - Petróleo Brasileiro S.A.",
        "company_code": "PETRO2024",
        "logo_url": None,
        "active": True,
        "subscription_type": "monthly",
        "subscription_expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "mercado_pago_customer_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.companies.insert_one(company2)
    print(f"  ✓ Empresa PETROBRAS criada")
    print(f"    Código: PETRO2024")
    
    # Criar Admin da PETRO
    petro_admin_password = bcrypt.hashpw("petro123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    petro_admin = {
        "id": str(uuid4()),
        "email": "admin@petrobras.com",
        "password": petro_admin_password,
        "name": "Administrador Petrobras",
        "role": "company_admin",
        "company_id": company2_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(petro_admin)
    print(f"    Admin: admin@petrobras.com / petro123\n")
    
    # ============ CRIAR FUNCIONÁRIOS DE EXEMPLO ============
    print("👷 Criando funcionários de exemplo para REVAP...")
    
    employees_revap = [
        {
            "id": str(uuid4()),
            "chapa": "80001",
            "nome": "João Silva Santos",
            "funcao": "Soldador",
            "turno": "DIA",
            "grupo": "1",
            "mo": "M.O.D",
            "admissao": "2024-01-15",
            "sindicato": "1",
            "primeiro_acesso": "2024-01-20",
            "active": True,
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "chapa": "80002",
            "nome": "Maria Oliveira Costa",
            "funcao": "Encanadora",
            "turno": "DIA",
            "grupo": "2",
            "mo": "M.O.I",
            "admissao": "2024-02-10",
            "sindicato": "1",
            "primeiro_acesso": "2024-02-15",
            "active": True,
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "chapa": "80003",
            "nome": "Pedro Almeida Rocha",
            "funcao": "Mecânico",
            "turno": "NOITE",
            "grupo": "1",
            "mo": "M.O.D",
            "admissao": "2024-03-05",
            "sindicato": "1",
            "primeiro_acesso": "2024-03-10",
            "active": True,
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "chapa": "80004",
            "nome": "Ana Paula Ferreira",
            "funcao": "Eletricista",
            "turno": "NOITE",
            "grupo": "2",
            "mo": "M.O.I",
            "admissao": "2024-04-01",
            "sindicato": "1",
            "primeiro_acesso": "2024-04-05",
            "active": True,
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "chapa": "80005",
            "nome": "Carlos Eduardo Lima",
            "funcao": "Supervisor",
            "turno": "DIA",
            "grupo": "3",
            "mo": "M.O.I",
            "admissao": "2023-12-01",
            "sindicato": "1",
            "primeiro_acesso": "2023-12-05",
            "active": True,
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.employees.insert_many(employees_revap)
    print(f"  ✓ {len(employees_revap)} funcionários criados para REVAP\n")
    
    # Funcionário para PETRO
    print("👷 Criando funcionário de exemplo para PETROBRAS...")
    employee_petro = {
        "id": str(uuid4()),
        "chapa": "90001",
        "nome": "Carlos Petrobras Santos",
        "funcao": "Engenheiro",
        "turno": "DIA",
        "grupo": "1",
        "mo": "M.O.D",
        "admissao": "2024-01-10",
        "sindicato": "1",
        "primeiro_acesso": "2024-01-15",
        "active": True,
        "company_id": company2_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.employees.insert_one(employee_petro)
    print(f"  ✓ 1 funcionário criado para PETROBRAS\n")
    
    # ============ CRIAR TURNOS DE EXEMPLO ============
    print("⏰ Criando turnos de exemplo...")
    
    shifts_revap = [
        {
            "id": str(uuid4()),
            "name": "Turno Diurno",
            "start_time": "07:00",
            "end_time": "16:00",
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "name": "Turno Noturno",
            "start_time": "19:00",
            "end_time": "04:00",
            "company_id": company1_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.shifts.insert_many(shifts_revap)
    print(f"  ✓ {len(shifts_revap)} turnos criados para REVAP\n")
    
    # ============ CRIAR REGISTROS DE PRESENÇA DE EXEMPLO ============
    print("📅 Criando registros de presença de exemplo...")
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    
    attendance_records = [
        # Hoje
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80001",
            "date": today,
            "status": "P",
            "hora_batida": "07:15",
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80002",
            "date": today,
            "status": "P",
            "hora_batida": "07:20",
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80003",
            "date": today,
            "status": "FALTA",
            "hora_batida": None,
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80004",
            "date": today,
            "status": "FO",
            "hora_batida": None,
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80005",
            "date": today,
            "status": "ATE",
            "hora_batida": None,
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        },
        # Ontem
        {
            "id": str(uuid4()),
            "company_id": company1_id,
            "employee_chapa": "80001",
            "date": yesterday,
            "status": "P",
            "hora_batida": "07:10",
            "registered_by": revap_admin["id"],
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.attendance.insert_many(attendance_records)
    print(f"  ✓ {len(attendance_records)} registros de presença criados\n")
    
    # ============ RESUMO ============
    print("=" * 60)
    print("✅ BANCO DE DADOS INICIALIZADO COM SUCESSO!")
    print("=" * 60)
    print(f"\n📊 Estatísticas:")
    print(f"  • Empresas: {await db.companies.count_documents({})}")
    print(f"  • Usuários: {await db.users.count_documents({})}")
    print(f"  • Funcionários: {await db.employees.count_documents({})}")
    print(f"  • Registros de Presença: {await db.attendance.count_documents({})}")
    print(f"  • Turnos: {await db.shifts.count_documents({})}")
    
    print(f"\n🔐 Credenciais de Acesso:")
    print(f"\n  SUPER ADMIN:")
    print(f"    Email: admin@system.com")
    print(f"    Senha: admin123")
    
    print(f"\n  EMPRESA REVAP (Código: REVAP2024):")
    print(f"    Admin: admin@revap.com / revap123")
    print(f"    Viewer: viewer@revap.com / viewer123")
    
    print(f"\n  EMPRESA PETROBRAS (Código: PETRO2024):")
    print(f"    Admin: admin@petrobras.com / petro123")
    
    print(f"\n🌐 Acesso Público:")
    print(f"    REVAP: /public/REVAP2024")
    print(f"    PETROBRAS: /public/PETRO2024")
    
    print("\n" + "=" * 60 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())

"""
Database Models for Employee Management System
Multi-tenant system with company-based access control
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime, timezone
import uuid


# ============ COMPANY MODELS ============

class CompanyCreate(BaseModel):
    name: str
    company_code: str  # Código único da empresa (ex: REVAP2024)
    subscription_type: Literal["monthly", "annual"]
    admin_email: EmailStr
    admin_password: str
    admin_name: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_code: Optional[str] = None
    active: Optional[bool] = None
    subscription_type: Optional[Literal["monthly", "annual"]] = None
    subscription_expires_at: Optional[str] = None  # ISO format
    logo_url: Optional[str] = None

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company_code: str  # Código único de acesso da empresa
    logo_url: Optional[str] = None
    active: bool = True
    subscription_type: Literal["monthly", "annual"]
    subscription_expires_at: Optional[datetime] = None
    mercado_pago_customer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ USER MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["super_admin", "company_admin", "company_viewer"]
    company_id: Optional[str] = None  # None for super_admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    company_code: Optional[str] = None  # Código da empresa (obrigatório para company_admin e company_viewer)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: Literal["super_admin", "company_admin", "company_viewer"]
    company_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# ============ EMPLOYEE MODELS ============

class EmployeeCreate(BaseModel):
    chapa: str  # Employee ID/Badge number
    nome: str
    funcao: str
    turno: Literal["DIA", "NOITE"]
    grupo: str  # 1, 2, 3, etc
    mo: Optional[str] = None  # M.O.D ou M.O.I ou vazio
    admissao: Optional[str] = None  # Data de admissão YYYY-MM-DD
    sindicato: Optional[str] = None
    primeiro_acesso: Optional[str] = None  # Data do primeiro acesso

class EmployeeUpdate(BaseModel):
    nome: Optional[str] = None
    funcao: Optional[str] = None
    turno: Optional[Literal["DIA", "NOITE"]] = None
    grupo: Optional[str] = None
    mo: Optional[str] = None  # M.O.D ou M.O.I ou vazio
    admissao: Optional[str] = None
    sindicato: Optional[str] = None
    primeiro_acesso: Optional[str] = None
    active: Optional[bool] = None

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    chapa: str
    nome: str
    funcao: str
    turno: Literal["DIA", "NOITE"]
    grupo: str
    mo: Optional[str] = None  # M.O.D ou M.O.I ou vazio (pode editar depois)
    admissao: Optional[str] = None
    sindicato: Optional[str] = None
    primeiro_acesso: Optional[str] = None
    active: bool = True  # False when demobilized
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ SUBCONTRACTOR MODELS ============

class SubcontractorCreate(BaseModel):
    name: str  # Nome da empresa subcontratada
    employee_count: int  # Quantidade de funcionários

class SubcontractorUpdate(BaseModel):
    name: Optional[str] = None
    employee_count: Optional[int] = None
    active: Optional[bool] = None

class Subcontractor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    employee_count: int
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))



# ============ SHIFT MODELS ============

class ShiftCreate(BaseModel):
    name: str  # DIA or NOITE
    start_time: str  # Format: "HH:MM"
    end_time: str
    description: Optional[str] = None

class ShiftUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    start_time: str
    end_time: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ ATTENDANCE MODELS ============

class AttendanceCreate(BaseModel):
    employee_chapa: str
    date: str  # Format: "YYYY-MM-DD"
    status: Literal["P", "PN", "FALTA", "FO", "ATE"]
    hora_batida: Optional[str] = None  # Format: "HH:MM:SS"
    notes: Optional[str] = None

class AttendanceUpdate(BaseModel):
    status: Optional[Literal["P", "PN", "FALTA", "FO", "ATE"]] = None
    hora_batida: Optional[str] = None
    notes: Optional[str] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    employee_chapa: str
    date: str
    status: Literal["P", "PN", "FALTA", "FO", "ATE"]
    hora_batida: Optional[str] = None
    notes: Optional[str] = None
    registered_by: str  # User ID
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ DAY OFF TRACKING MODELS ============

class DayOff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    employee_chapa: str
    calculated_days: int = 0  # Total days calculated (every 7 days with P/PN)
    used_days: int = 0  # Days used (FO marked)
    last_calculated_date: Optional[str] = None  # Last date calculation was run
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ PAYMENT MODELS ============

class PaymentCreate(BaseModel):
    amount: float
    subscription_type: Literal["monthly", "annual"]
    payment_method: str = "mercado_pago"

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    amount: float
    payment_method: str
    mercado_pago_payment_id: Optional[str] = None
    mercado_pago_payment_status: Optional[str] = None
    status: Literal["pending", "approved", "rejected", "cancelled"] = "pending"
    subscription_type: Literal["monthly", "annual"]
    split_amount: float  # Platform commission (10%)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ CSV IMPORT MODELS ============

class CSVImportRow(BaseModel):
    chapa: str
    nome: str
    funcao: str
    batida: Optional[str] = None  # Hora da batida (HH:MM:SS or HH:MM)

class CSVImportRequest(BaseModel):
    date: str  # Date for which this attendance is being imported YYYY-MM-DD
    rows: List[CSVImportRow]


# ============ REPORT MODELS ============

class EmployeeAttendanceSummary(BaseModel):
    employee: Employee
    presencas: int
    faltas: int
    folgas: int
    atestados: int
    total_dias: int

class ShiftSummary(BaseModel):
    turno: Literal["DIA", "NOITE"]
    mo_type: Literal["M.O.D", "M.O.I"]
    efetivo: int
    presentes: int
    faltas: int
    folgas: int
    atestados: int

class RecordistaItem(BaseModel):
    employee_chapa: str
    employee_nome: str
    total_presencas: int

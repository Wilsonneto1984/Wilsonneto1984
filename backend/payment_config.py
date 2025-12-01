"""
Configurações de pagamento e integração com Mercado Pago
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import os
from pydantic import BaseModel

class PaymentSettings(BaseModel):
    mp_public_key: Optional[str] = None
    mp_access_token: Optional[str] = None
    mp_webhook_secret: Optional[str] = None
    monthly_price: Optional[str] = None
    semiannual_price: Optional[str] = None
    annual_price: Optional[str] = None
    commission_percentage: str = "10"

# Storage em arquivo para configurações (temporário - em produção use banco de dados)
SETTINGS_FILE = "/app/backend/payment_settings.json"

def get_payment_settings() -> PaymentSettings:
    """Carrega configurações de pagamento do arquivo"""
    import json
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
                return PaymentSettings(**data)
    except Exception as e:
        print(f"Error loading payment settings: {e}")
    
    # Retorna configurações padrão se arquivo não existe
    return PaymentSettings()

def save_payment_settings(settings: PaymentSettings) -> bool:
    """Salva configurações de pagamento no arquivo"""
    import json
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings.model_dump(), f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving payment settings: {e}")
        return False

def is_payment_configured() -> bool:
    """Verifica se o pagamento está configurado"""
    settings = get_payment_settings()
    return bool(
        settings.mp_public_key and 
        settings.mp_access_token and 
        settings.monthly_price
    )

def get_plan_price(plan_type: str) -> float:
    """Retorna o preço de um plano específico"""
    settings = get_payment_settings()
    
    if plan_type == "monthly" and settings.monthly_price:
        return float(settings.monthly_price)
    elif plan_type == "semiannual" and settings.semiannual_price:
        return float(settings.semiannual_price)
    elif plan_type == "annual" and settings.annual_price:
        return float(settings.annual_price)
    
    return 0.0

def calculate_subscription_end_date(plan_type: str) -> datetime:
    """Calcula a data de expiração da assinatura baseada no plano"""
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    
    if plan_type == "monthly":
        return now + timedelta(days=30)
    elif plan_type == "semiannual":
        return now + timedelta(days=180)
    elif plan_type == "annual":
        return now + timedelta(days=365)
    
    return now

# 📊 Estrutura do Banco de Dados - Sistema de Controle de Efetivo

## 🗄️ Banco de Dados: MongoDB

**Nome do Banco:** `efetivo_db`

---

## 📋 Coleções e Estrutura

### 1. **companies** (Empresas)
Armazena informações das empresas cadastradas no sistema.

```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "name": "Nome da Empresa",
  "company_code": "CODIGO2024",
  "logo_url": "url-do-logo ou null",
  "active": true,
  "subscription_type": "monthly | annual",
  "subscription_expires_at": "2024-12-31T23:59:59Z",
  "mercado_pago_customer_id": "customer-id ou null",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Índices:**
- `company_code` (UNIQUE)
- `name`

---

### 2. **users** (Usuários)
Armazena informações dos usuários do sistema.

```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "email": "usuario@email.com",
  "password": "hash-bcrypt",
  "name": "Nome do Usuário",
  "role": "super_admin | company_admin | company_viewer",
  "company_id": "uuid-string ou null (para super_admin)",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Índices:**
- `(email, company_id)` (UNIQUE - composto)
- `role`

**Roles:**
- `super_admin`: Gestor da plataforma (gerencia empresas)
- `company_admin`: Administrador da empresa (CRUD completo)
- `company_viewer`: Visualizador (somente leitura, pode reativar funcionários)

---

### 3. **employees** (Funcionários/Colaboradores)
Armazena informações dos funcionários de cada empresa.

```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "chapa": "80001",
  "nome": "João Silva Santos",
  "funcao": "Soldador",
  "turno": "DIA | NOITE",
  "grupo": "1, 2, 3, etc.",
  "mo": "M.O.D | M.O.I",
  "admissao": "2024-01-15",
  "sindicato": "1",
  "primeiro_acesso": "2024-01-20",
  "active": true,
  "company_id": "uuid-string",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Índices:**
- `(company_id, chapa)` (UNIQUE - composto)
- `(company_id, active)`
- `(company_id, turno)`

**Campos:**
- `chapa`: ID único do funcionário (matrícula)
- `turno`: DIA ou NOITE
- `mo`: Mão de obra - M.O.D (Direta) ou M.O.I (Indireta)
- `active`: true (ativo) ou false (desmobilizado)

---

### 4. **attendance** (Registros de Presença)
Armazena os registros diários de presença dos funcionários.

```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "company_id": "uuid-string",
  "employee_chapa": "80001",
  "date": "2024-12-01",
  "status": "P | PN | FALTA | FO | ATE",
  "hora_batida": "07:15 ou null",
  "registered_by": "uuid-do-usuario",
  "registered_at": "2024-12-01T07:15:00Z"
}
```

**Índices:**
- `(company_id, date, employee_chapa)` (UNIQUE - composto)
- `(company_id, date)`
- `(company_id, employee_chapa)`

**Status:**
- `P`: Presente (turno DIA)
- `PN`: Presente Noite (turno NOITE)
- `FALTA`: Ausência não justificada
- `FO`: Folga
- `ATE`: Atestado médico

---

### 5. **shifts** (Turnos)
Armazena os turnos configurados para cada empresa.

```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "name": "Turno Diurno",
  "start_time": "07:00",
  "end_time": "16:00",
  "company_id": "uuid-string",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Índices:**
- `(company_id, name)` (UNIQUE - composto)

---

## 🔐 Dados Iniciais (Seed Data)

### Super Admin
```
Email: admin@system.com
Senha: admin123
Role: super_admin
```

### Empresa 1: REVAP
```
Nome: REVAP - Refinaria do Vale do Paraíba
Código: REVAP2024
Admin: admin@revap.com / revap123
Viewer: viewer@revap.com / viewer123
Funcionários: 5 colaboradores de exemplo
```

### Empresa 2: PETROBRAS
```
Nome: PETROBRAS - Petróleo Brasileiro S.A.
Código: PETRO2024
Admin: admin@petrobras.com / petro123
Funcionários: 1 colaborador de exemplo
```

---

## 🚀 Como Inicializar o Banco de Dados

### Método 1: Script Python (Recomendado)

```bash
cd /app/backend
python init_database.py
```

Este script irá:
1. ✅ Criar todas as coleções
2. ✅ Criar todos os índices
3. ✅ Limpar dados existentes
4. ✅ Inserir dados iniciais
5. ✅ Exibir relatório de criação

### Método 2: Manual via MongoDB Shell

```javascript
use efetivo_db

// Criar índices
db.companies.createIndex({ "company_code": 1 }, { unique: true })
db.users.createIndex({ "email": 1, "company_id": 1 }, { unique: true })
db.employees.createIndex({ "company_id": 1, "chapa": 1 }, { unique: true })
db.attendance.createIndex({ "company_id": 1, "date": 1, "employee_chapa": 1 }, { unique: true })
db.shifts.createIndex({ "company_id": 1, "name": 1 }, { unique: true })
```

---

## 📝 Variáveis de Ambiente Necessárias

Certifique-se de configurar no arquivo `.env`:

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=efetivo_db

# JWT
SECRET_KEY=sua-chave-secreta-jwt-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Mercado Pago (opcional)
MERCADO_PAGO_ACCESS_TOKEN=seu-token-aqui
```

---

## 🔄 Backup e Restore

### Fazer Backup
```bash
mongodump --uri="mongodb://localhost:27017/efetivo_db" --out=/backup/efetivo_db_backup
```

### Restaurar Backup
```bash
mongorestore --uri="mongodb://localhost:27017" --db=efetivo_db /backup/efetivo_db_backup/efetivo_db
```

---

## 📊 Queries Úteis

### Contar documentos por coleção
```javascript
db.companies.countDocuments()
db.users.countDocuments()
db.employees.countDocuments()
db.attendance.countDocuments()
db.shifts.countDocuments()
```

### Buscar funcionários de uma empresa
```javascript
db.employees.find({ "company_id": "uuid-da-empresa", "active": true })
```

### Buscar presença de um dia específico
```javascript
db.attendance.find({ 
  "company_id": "uuid-da-empresa", 
  "date": "2024-12-01" 
})
```

### Listar todas as empresas ativas
```javascript
db.companies.find({ "active": true })
```

---

## ⚠️ Notas Importantes

1. **Multi-Tenancy**: Todas as queries devem incluir `company_id` para garantir isolamento de dados
2. **Índices Únicos**: O par `(company_id, chapa)` garante que cada empresa tenha seu próprio conjunto de funcionários
3. **Senhas**: Todas as senhas são hash com bcrypt antes de serem armazenadas
4. **Datas**: Utilize timezone UTC para todas as datas
5. **IDs**: Utilize UUID v4 para IDs personalizados (campo `id`)

---

## 🛠️ Manutenção

### Verificar Integridade dos Índices
```javascript
db.companies.getIndexes()
db.users.getIndexes()
db.employees.getIndexes()
db.attendance.getIndexes()
db.shifts.getIndexes()
```

### Recriar Índices (se necessário)
```javascript
db.collection_name.dropIndexes()
// Depois executar os comandos createIndex novamente
```

---

**Versão:** 1.0  
**Última Atualização:** Dezembro 2024

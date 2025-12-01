# 🚀 Guia de Configuração do Banco de Dados

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Inicialização do Banco](#inicialização-do-banco)
3. [Backup e Restore](#backup-e-restore)
4. [Verificação](#verificação)
5. [Credenciais de Acesso](#credenciais-de-acesso)

---

## 🔧 Pré-requisitos

### Software Necessário
- MongoDB 5.0 ou superior
- Python 3.11+ (para script de inicialização)
- mongosh (MongoDB Shell)
- mongodump e mongorestore (MongoDB Database Tools)

### Variáveis de Ambiente
Configure as seguintes variáveis no arquivo `/app/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=efetivo_db
SECRET_KEY=sua-chave-secreta-jwt-muito-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## 📊 Inicialização do Banco

### Método 1: Script Python Automatizado (Recomendado)

Este é o método mais rápido e completo para configurar o banco de dados.

```bash
# 1. Navegue até o diretório backend
cd /app/backend

# 2. Instale as dependências (se necessário)
pip install motor bcrypt python-dotenv

# 3. Execute o script de inicialização
python init_database.py
```

**O que o script faz:**
- ✅ Cria todas as coleções necessárias
- ✅ Cria índices para performance otimizada
- ✅ Limpa dados existentes (opcional)
- ✅ Insere Super Admin
- ✅ Cria 2 empresas de teste (REVAP e PETROBRAS)
- ✅ Cria usuários para cada empresa
- ✅ Insere funcionários de exemplo
- ✅ Cria registros de presença de exemplo
- ✅ Exibe relatório detalhado

**Saída esperada:**
```
============================================================
INICIALIZANDO BANCO DE DADOS - Sistema de Controle de Efetivo
============================================================

✓ Conectado ao MongoDB: mongodb://localhost:27017
✓ Banco de dados: efetivo_db

📊 Criando índices...
  ✓ Índices da coleção 'companies' criados
  ✓ Índices da coleção 'users' criados
  ✓ Índices da coleção 'employees' criados
  ✓ Índices da coleção 'attendance' criados
  ✓ Índices da coleção 'shifts' criados

...

✅ BANCO DE DADOS INICIALIZADO COM SUCESSO!
============================================================
```

### Método 2: MongoDB Shell Manual

Se preferir configurar manualmente:

```bash
# 1. Conecte ao MongoDB
mongosh mongodb://localhost:27017

# 2. Selecione o banco de dados
use efetivo_db

# 3. Crie os índices
db.companies.createIndex({ "company_code": 1 }, { unique: true })
db.companies.createIndex({ "name": 1 })

db.users.createIndex({ "email": 1, "company_id": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

db.employees.createIndex({ "company_id": 1, "chapa": 1 }, { unique: true })
db.employees.createIndex({ "company_id": 1, "active": 1 })
db.employees.createIndex({ "company_id": 1, "turno": 1 })

db.attendance.createIndex({ "company_id": 1, "date": 1, "employee_chapa": 1 }, { unique: true })
db.attendance.createIndex({ "company_id": 1, "date": 1 })
db.attendance.createIndex({ "company_id": 1, "employee_chapa": 1 })

db.shifts.createIndex({ "company_id": 1, "name": 1 }, { unique: true })

# 4. Insira dados manualmente (opcional)
# Use o arquivo database_seed.json como referência
```

---

## 💾 Backup e Restore

### Script de Backup/Restore

Um script shell completo está disponível em `/app/backend/backup_restore.sh`.

#### Criar Backup

```bash
# Backup padrão
cd /app/backend
./backup_restore.sh backup

# Backup com URL personalizada
MONGO_URL=mongodb://user:pass@host:27017 ./backup_restore.sh backup

# Backup com diretório personalizado
BACKUP_DIR=/meu/backup ./backup_restore.sh backup
```

**O script irá:**
1. Criar dump completo do banco
2. Compactar em arquivo .tar.gz
3. Salvar com timestamp no nome
4. Manter apenas os últimos 7 backups

#### Listar Backups Disponíveis

```bash
./backup_restore.sh list
```

#### Restaurar Backup

```bash
# Listar backups disponíveis primeiro
./backup_restore.sh list

# Restaurar backup específico
./backup_restore.sh restore /backup/efetivo_db_20241201_120000.tar.gz
```

⚠️ **ATENÇÃO:** O restore irá sobrescrever todos os dados atuais!

#### Verificar Status do MongoDB

```bash
./backup_restore.sh check
```

Exibe estatísticas do banco:
- Número de empresas
- Número de usuários
- Número de funcionários
- Número de registros de presença
- Número de turnos

---

## ✅ Verificação

### Verificar se o Banco foi Criado Corretamente

```bash
# Conectar ao MongoDB
mongosh mongodb://localhost:27017/efetivo_db

# Contar documentos
db.companies.countDocuments()    // Deve retornar 2
db.users.countDocuments()        // Deve retornar 4 (1 super admin + 3 usuários)
db.employees.countDocuments()    // Deve retornar 6
db.shifts.countDocuments()       // Deve retornar 3

# Verificar índices
db.companies.getIndexes()
db.users.getIndexes()
db.employees.getIndexes()
db.attendance.getIndexes()
db.shifts.getIndexes()

# Ver empresas cadastradas
db.companies.find({}, { name: 1, company_code: 1, active: 1 })
```

### Testar Autenticação via API

```bash
# Testar login do Super Admin
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.com","password":"admin123"}'

# Testar login da empresa REVAP
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@revap.com","password":"revap123","company_code":"REVAP2024"}'
```

---

## 🔐 Credenciais de Acesso

### Super Admin (Gestor da Plataforma)
```
URL: /login/admin
Email: admin@system.com
Senha: admin123
Função: Gerenciar todas as empresas, assinaturas e usuários
```

### Empresa REVAP
```
Código: REVAP2024
URL Pública: /public/REVAP2024

Admin:
  URL: /login/empresa
  Email: admin@revap.com
  Senha: revap123
  Função: CRUD completo de funcionários e presença

Viewer:
  URL: /login/empresa
  Email: viewer@revap.com
  Senha: viewer123
  Função: Visualização e reativação de funcionários
```

### Empresa PETROBRAS
```
Código: PETRO2024
URL Pública: /public/PETRO2024

Admin:
  URL: /login/empresa
  Email: admin@petrobras.com
  Senha: petro123
  Função: CRUD completo de funcionários e presença
```

---

## 🗂️ Estrutura das Coleções

### companies
- `id`: UUID único
- `name`: Nome da empresa
- `company_code`: Código único (ex: REVAP2024)
- `active`: Status ativo/inativo
- `subscription_type`: monthly | annual
- `subscription_expires_at`: Data de expiração

### users
- `id`: UUID único
- `email`: Email do usuário
- `password`: Hash bcrypt
- `role`: super_admin | company_admin | company_viewer
- `company_id`: Referência à empresa (null para super_admin)

### employees
- `id`: UUID único
- `chapa`: Matrícula do funcionário
- `nome`: Nome completo
- `funcao`: Cargo/função
- `turno`: DIA | NOITE
- `grupo`: Grupo de trabalho
- `mo`: M.O.D | M.O.I (Mão de obra direta/indireta)
- `company_id`: Referência à empresa
- `active`: Status ativo/desmobilizado

### attendance
- `id`: UUID único
- `company_id`: Referência à empresa
- `employee_chapa`: Matrícula do funcionário
- `date`: Data do registro (YYYY-MM-DD)
- `status`: P | PN | FALTA | FO | ATE
- `hora_batida`: Hora de entrada (opcional)

### shifts
- `id`: UUID único
- `name`: Nome do turno
- `start_time`: Hora de início (HH:MM)
- `end_time`: Hora de término (HH:MM)
- `company_id`: Referência à empresa

---

## 🔄 Manutenção

### Recriar Índices

Se por algum motivo os índices precisarem ser recriados:

```javascript
// Conectar ao MongoDB
mongosh mongodb://localhost:27017/efetivo_db

// Remover índices antigos (exceto _id)
db.companies.dropIndexes()
db.users.dropIndexes()
db.employees.dropIndexes()
db.attendance.dropIndexes()
db.shifts.dropIndexes()

// Recriar índices (execute os comandos de criação novamente)
```

### Limpar Todos os Dados

⚠️ **CUIDADO:** Isso irá apagar todos os dados!

```javascript
mongosh mongodb://localhost:27017/efetivo_db

db.companies.deleteMany({})
db.users.deleteMany({})
db.employees.deleteMany({})
db.attendance.deleteMany({})
db.shifts.deleteMany({})
```

Depois execute o script de inicialização novamente:
```bash
python init_database.py
```

---

## 📞 Suporte

Para mais informações sobre a estrutura do banco de dados, consulte:
- `/app/DATABASE_STRUCTURE.md` - Documentação completa da estrutura
- `/app/backend/database_seed.json` - Dados de exemplo em formato JSON
- `/app/backend/init_database.py` - Script de inicialização

---

**Última Atualização:** Dezembro 2024  
**Versão do Banco:** 1.0

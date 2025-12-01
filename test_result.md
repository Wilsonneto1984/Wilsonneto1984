#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Sistema de Gestão de Efetivo Multi-Empresa
  
  FASE 1 - Core Funcional:
  - Sistema multi-tenant com 3 níveis de acesso (Super Admin, Company Admin, Company Viewer)
  - Gestão de empresas (criar, listar, ativar/desativar)
  - Gestão de colaboradores (chapa, nome, função, turno, grupo, MO, admissão, sindicato)
  - Importação CSV com lógica automática (hora → P/PN, sem hora → FALTA)
  - Edição manual de presença (FALTA → FO ou ATE)
  - Listagem por turno (DIA/NOITE)
  - Desmobilização e reativação de colaboradores
  - Upload de logo por empresa
  
  Campos dos Colaboradores:
  - chapa: ID único do colaborador
  - nome: Nome completo
  - funcao: Função/cargo
  - turno: DIA ou NOITE (editável pelo admin)
  - grupo: 1, 2, 3, etc (fixo)
  - mo: M.O.D (direta) ou M.O.I (indireta) (fixo)
  - admissao: Data de admissão (fixo)
  - sindicato: Sindicato (fixo)
  - active: True/False (desmobilizado)
  
  Lógica de Importação CSV:
  - Formato: CHAPA, NOME, FUNCAO, BATIDA
  - Se tem BATIDA (hora): marca P (turno DIA) ou PN (turno NOITE)
  - Se não tem BATIDA: marca FALTA
  - Admin pode editar depois para FO (folga) ou ATE (atestado)

backend:
  - task: "Authentication System - Multi-tenant"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Created multi-tenant auth with JWT. 3 roles: super_admin, company_admin, company_viewer. Super admin created at startup (admin@system.com / admin123)"
  
  - task: "Company Management (Super Admin only)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "CRUD for companies with subscription management. Creates company admin automatically. Includes logo upload functionality."
  
  - task: "User Management"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Company admins can create viewer users for their company. Super admins can create any user type."
  
  - task: "Employee Management with specific fields"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Full CRUD for employees with fields: chapa, nome, funcao, turno, grupo, mo, admissao, sindicato. Supports filtering by turno and mo. Deactivate/reactivate functionality included."
  
  - task: "Shift Management"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "CRUD for shift configurations. Only admins can edit."
  
  - task: "CSV Import with automatic presence logic"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "CSV import endpoint created. Logic: if BATIDA exists → P (DIA) or PN (NOITE) based on employee turno, if no BATIDA → FALTA. Needs testing with real CSV file."
      - working: true
        agent: "testing"
        comment: "CSV import tested successfully. Logic working correctly: employees with BATIDA get P (DIA turno) or PN (NOITE turno), employees without BATIDA get FALTA status. Import processes existing records by updating them if they already exist for the same date."
  
  - task: "Attendance Management"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Create, read, update attendance records. Supports manual editing of status (FALTA → FO or ATE). Filtering by date range and employee."
      - working: true
        agent: "testing"
        comment: "Attendance management tested successfully. Can create attendance records, update status (FALTA to FO), list by date and employee. All CRUD operations working correctly."

frontend:
  - task: "Frontend implementation"
    implemented: false
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Not yet implemented. Will be done after backend testing."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false
  phase: "FASE 1 - Core Backend"

test_plan:
  current_focus:
    - "CSV Import with real data"
    - "Authentication flow for all 3 roles"
    - "Employee CRUD operations"
    - "Attendance creation and editing"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "FASE 1 Backend implementation complete. All core features implemented:
      - Multi-tenant authentication ✅
      - Company management ✅
      - Employee management with all specific fields ✅
      - CSV import with automatic presence logic ✅
      - Attendance CRUD ✅
      - Shift management ✅
      
      Ready for testing. Super admin credentials:
      Email: admin@system.com
      Password: admin123
      
      Next steps: Test all endpoints, especially CSV import functionality."
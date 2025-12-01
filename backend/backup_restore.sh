#!/bin/bash

# Script de Backup e Restore do Banco de Dados MongoDB
# Sistema de Controle de Efetivo

set -e

# Configurações
MONGO_URL="${MONGO_URL:-mongodb://localhost:27017}"
DATABASE_NAME="${DATABASE_NAME:-efetivo_db}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/${DATABASE_NAME}_$TIMESTAMP"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Função de Backup
backup_database() {
    print_header "BACKUP DO BANCO DE DADOS"
    
    print_info "Banco de dados: $DATABASE_NAME"
    print_info "Destino: $BACKUP_PATH"
    
    # Criar diretório de backup se não existir
    mkdir -p "$BACKUP_DIR"
    
    # Executar backup
    print_info "Iniciando backup..."
    
    if mongodump --uri="$MONGO_URL/$DATABASE_NAME" --out="$BACKUP_PATH" 2>&1; then
        print_success "Backup concluído com sucesso!"
        
        # Compactar backup
        print_info "Compactando backup..."
        cd "$BACKUP_DIR"
        tar -czf "${DATABASE_NAME}_${TIMESTAMP}.tar.gz" "$(basename $BACKUP_PATH)"
        rm -rf "$BACKUP_PATH"
        
        print_success "Backup compactado: ${DATABASE_NAME}_${TIMESTAMP}.tar.gz"
        print_info "Tamanho: $(du -h ${DATABASE_NAME}_${TIMESTAMP}.tar.gz | cut -f1)"
        
        # Limpar backups antigos (manter últimos 7)
        print_info "Limpando backups antigos (mantendo últimos 7)..."
        ls -t ${DATABASE_NAME}_*.tar.gz | tail -n +8 | xargs -r rm -f
        
        print_success "Processo de backup finalizado!"
        
        # Listar backups disponíveis
        echo ""
        print_info "Backups disponíveis:"
        ls -lh ${DATABASE_NAME}_*.tar.gz 2>/dev/null || print_warning "Nenhum backup encontrado"
        
    else
        print_error "Falha no backup!"
        exit 1
    fi
}

# Função de Restore
restore_database() {
    local backup_file=$1
    
    print_header "RESTORE DO BANCO DE DADOS"
    
    if [ -z "$backup_file" ]; then
        print_error "Nenhum arquivo de backup especificado!"
        echo "Uso: $0 restore <arquivo-backup.tar.gz>"
        echo ""
        print_info "Backups disponíveis:"
        ls -lh $BACKUP_DIR/${DATABASE_NAME}_*.tar.gz 2>/dev/null || print_warning "Nenhum backup encontrado"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Arquivo de backup não encontrado: $backup_file"
        exit 1
    fi
    
    print_warning "ATENÇÃO: Este processo irá substituir o banco de dados atual!"
    read -p "Deseja continuar? (sim/nao): " confirm
    
    if [ "$confirm" != "sim" ]; then
        print_info "Restore cancelado pelo usuário."
        exit 0
    fi
    
    print_info "Arquivo: $backup_file"
    print_info "Banco de dados destino: $DATABASE_NAME"
    
    # Extrair backup
    print_info "Extraindo backup..."
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$backup_file" -C "$TEMP_DIR"
    
    # Executar restore
    print_info "Iniciando restore..."
    
    if mongorestore --uri="$MONGO_URL" --db="$DATABASE_NAME" --drop "$TEMP_DIR/$DATABASE_NAME" 2>&1; then
        print_success "Restore concluído com sucesso!"
        
        # Limpar diretório temporário
        rm -rf "$TEMP_DIR"
        
        print_success "Processo de restore finalizado!"
        
    else
        print_error "Falha no restore!"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
}

# Função para listar backups
list_backups() {
    print_header "BACKUPS DISPONÍVEIS"
    
    if ls $BACKUP_DIR/${DATABASE_NAME}_*.tar.gz 1> /dev/null 2>&1; then
        ls -lh $BACKUP_DIR/${DATABASE_NAME}_*.tar.gz
    else
        print_warning "Nenhum backup encontrado em: $BACKUP_DIR"
    fi
}

# Função para verificar status do MongoDB
check_mongodb() {
    print_header "VERIFICAÇÃO DO MONGODB"
    
    print_info "Tentando conectar em: $MONGO_URL"
    
    if mongosh "$MONGO_URL" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB está acessível!"
        
        # Mostrar estatísticas do banco
        print_info "Estatísticas do banco de dados:"
        mongosh "$MONGO_URL/$DATABASE_NAME" --quiet --eval "
            print('  • Empresas: ' + db.companies.countDocuments());
            print('  • Usuários: ' + db.users.countDocuments());
            print('  • Funcionários: ' + db.employees.countDocuments());
            print('  • Presença: ' + db.attendance.countDocuments());
            print('  • Turnos: ' + db.shifts.countDocuments());
        "
    else
        print_error "Não foi possível conectar ao MongoDB!"
        exit 1
    fi
}

# Menu principal
show_help() {
    echo "Uso: $0 [comando] [opções]"
    echo ""
    echo "Comandos:"
    echo "  backup              Criar backup do banco de dados"
    echo "  restore <arquivo>   Restaurar banco de dados a partir de backup"
    echo "  list                Listar backups disponíveis"
    echo "  check               Verificar status do MongoDB"
    echo "  help                Mostrar esta ajuda"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  MONGO_URL           URL de conexão do MongoDB (padrão: mongodb://localhost:27017)"
    echo "  DATABASE_NAME       Nome do banco de dados (padrão: efetivo_db)"
    echo "  BACKUP_DIR          Diretório de backups (padrão: /backup)"
    echo ""
    echo "Exemplos:"
    echo "  $0 backup"
    echo "  $0 restore /backup/efetivo_db_20241201_120000.tar.gz"
    echo "  $0 list"
    echo "  MONGO_URL=mongodb://user:pass@host:27017 $0 backup"
}

# Processar comando
case "$1" in
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    list)
        list_backups
        ;;
    check)
        check_mongodb
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando inválido ou não especificado!"
        echo ""
        show_help
        exit 1
        ;;
esac

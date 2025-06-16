#!/bin/bash

# Скрипт автоматического деплоя dela - системы управления сотрудниками
# Использование: ./deploy.sh [production|staging]

set -e

# Переменные конфигурации
APP_NAME="dela"
APP_DIR="/var/www/dela"
LOG_DIR="/var/log/dela"
BACKUP_DIR="/opt/dela/backups"
USER="www-data"
GROUP="www-data"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Проверка прав доступа
check_permissions() {
    log "Проверка прав доступа..."
    
    if [[ $EUID -ne 0 ]]; then
        error "Скрипт должен быть запущен с правами root"
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm не установлен"
    fi
    
    if ! command -v pm2 &> /dev/null; then
        error "PM2 не установлен. Установите: npm install -g pm2"
    fi
    
    if ! command -v nginx &> /dev/null; then
        error "nginx не установлен"
    fi
}

# Создание необходимых директорий
setup_directories() {
    log "Создание директорий..."
    
    mkdir -p $APP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $BACKUP_DIR
    
    chown -R $USER:$GROUP $APP_DIR
    chown -R $USER:$GROUP $LOG_DIR
    chmod -R 755 $APP_DIR
    chmod -R 755 $LOG_DIR
}

# Резервное копирование
backup_current() {
    log "Создание резервной копии..."
    
    if [ -d "$APP_DIR" ]; then
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" . 2>/dev/null || true
        log "Резервная копия создана: $BACKUP_NAME.tar.gz"
    fi
}

# Остановка приложения
stop_app() {
    log "Остановка приложения..."
    
    pm2 stop $APP_NAME 2>/dev/null || warn "Приложение не было запущено"
    pm2 delete $APP_NAME 2>/dev/null || warn "Приложение не найдено в PM2"
}

# Получение кода
deploy_code() {
    local environment=${1:-production}
    
    log "Деплой кода для окружения: $environment"
    
    cd $APP_DIR
    
    # Получение обновлений из git
    if [ -d ".git" ]; then
        log "Получение обновлений из git..."
        git fetch origin
        
        if [ "$environment" = "staging" ]; then
            git checkout develop
            git pull origin develop
        else
            git checkout main
            git pull origin main
        fi
    else
        error "Git репозиторий не найден в $APP_DIR"
    fi
    
    # Установка зависимостей
    log "Установка зависимостей..."
    npm ci --production=false
    
    # Сборка приложения
    log "Сборка приложения..."
    npm run build
    
    # Установка продакшен зависимостей
    log "Установка продакшен зависимостей..."
    npm ci --only=production
    
    # Применение миграций базы данных
    log "Применение миграций базы данных..."
    npm run db:migrate || warn "Миграции не выполнены"
    
    # Установка прав доступа
    chown -R $USER:$GROUP $APP_DIR
    chmod -R 755 $APP_DIR
}

# Конфигурация nginx
configure_nginx() {
    log "Настройка nginx..."
    
    # Копирование конфигурации nginx
    if [ -f "$APP_DIR/deploy/nginx.conf" ]; then
        cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$APP_NAME"
        
        # Активация сайта
        ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
        
        # Проверка конфигурации nginx
        nginx -t || error "Ошибка в конфигурации nginx"
        
        # Перезагрузка nginx
        systemctl reload nginx
        log "nginx перезагружен"
    else
        warn "Конфигурация nginx не найдена"
    fi
}

# Запуск приложения
start_app() {
    local environment=${1:-production}
    
    log "Запуск приложения в режиме: $environment"
    
    cd $APP_DIR
    
    # Запуск через PM2
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env $environment
    else
        # Простой запуск если нет конфигурации PM2
        pm2 start server/index.js --name $APP_NAME --env $environment
    fi
    
    # Сохранение конфигурации PM2
    pm2 save
    
    # Настройка автозапуска PM2
    pm2 startup || warn "Не удалось настроить автозапуск PM2"
    
    log "Приложение запущено"
}

# Проверка работоспособности
health_check() {
    log "Проверка работоспособности..."
    
    sleep 5
    
    # Проверка статуса PM2
    if pm2 show $APP_NAME > /dev/null 2>&1; then
        log "PM2 процесс запущен"
    else
        error "PM2 процесс не запущен"
    fi
    
    # Проверка HTTP ответа
    if curl -f -s http://localhost:5000/api/auth/me > /dev/null; then
        log "HTTP сервер отвечает"
    else
        warn "HTTP сервер не отвечает или возвращает ошибку"
    fi
    
    # Показать статус
    pm2 status
}

# Очистка старых файлов
cleanup() {
    log "Очистка старых файлов..."
    
    # Удаление старых логов (старше 30 дней)
    find $LOG_DIR -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Удаление старых резервных копий (старше 30 дней)
    find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    
    # Очистка npm кеша
    npm cache clean --force 2>/dev/null || true
    
    log "Очистка завершена"
}

# Откат к предыдущей версии
rollback() {
    log "Откат к предыдущей версии..."
    
    stop_app
    
    # Поиск последней резервной копии
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log "Восстановление из: $LATEST_BACKUP"
        
        # Очистка текущей директории
        rm -rf $APP_DIR/*
        
        # Восстановление из резервной копии
        tar -xzf "$LATEST_BACKUP" -C "$APP_DIR"
        
        # Установка прав доступа
        chown -R $USER:$GROUP $APP_DIR
        chmod -R 755 $APP_DIR
        
        start_app
        log "Откат завершен"
    else
        error "Резервная копия не найдена"
    fi
}

# Показать помощь
show_help() {
    echo "Использование: $0 [команда] [окружение]"
    echo ""
    echo "Команды:"
    echo "  deploy [production|staging]  - Полный деплой приложения"
    echo "  start [production|staging]   - Запуск приложения"
    echo "  stop                         - Остановка приложения"
    echo "  restart [production|staging] - Перезапуск приложения"
    echo "  status                       - Статус приложения"
    echo "  logs                         - Просмотр логов"
    echo "  rollback                     - Откат к предыдущей версии"
    echo "  cleanup                      - Очистка старых файлов"
    echo "  help                         - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 deploy production"
    echo "  $0 restart staging"
    echo "  $0 rollback"
}

# Основная логика
main() {
    local command=${1:-deploy}
    local environment=${2:-production}
    
    case $command in
        deploy)
            check_permissions
            setup_directories
            backup_current
            stop_app
            deploy_code $environment
            configure_nginx
            start_app $environment
            health_check
            cleanup
            log "Деплой завершен успешно!"
            ;;
        start)
            check_permissions
            start_app $environment
            health_check
            ;;
        stop)
            stop_app
            ;;
        restart)
            stop_app
            start_app $environment
            health_check
            ;;
        status)
            pm2 status
            ;;
        logs)
            pm2 logs $APP_NAME
            ;;
        rollback)
            check_permissions
            rollback
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Неизвестная команда: $command. Используйте '$0 help' для справки."
            ;;
    esac
}

# Запуск скрипта
main "$@"
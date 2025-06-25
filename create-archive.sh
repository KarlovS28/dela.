
#!/bin/bash

# Скрипт для создания архива проекта dela
# Использование: ./create-archive.sh

set -e

PROJECT_NAME="dela"
ARCHIVE_NAME="${PROJECT_NAME}-$(date +%Y%m%d_%H%M%S).zip"
TEMP_DIR="/tmp/${PROJECT_NAME}_archive"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"
}

# Проверка наличия zip
if ! command -v zip &> /dev/null; then
    echo "Ошибка: zip не установлен. Установите его: apt-get install zip"
    exit 1
fi

log "Начинаю создание архива проекта..."

# Создание временной директории
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

log "Копирование файлов проекта..."

# Копирование основных файлов и директорий
cp -r client "$TEMP_DIR/"
cp -r server "$TEMP_DIR/"
cp -r shared "$TEMP_DIR/"
cp -r deploy "$TEMP_DIR/"
cp -r drizzle "$TEMP_DIR/"

# Копирование конфигурационных файлов
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tailwind.config.ts "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp components.json "$TEMP_DIR/"
cp drizzle.config.ts "$TEMP_DIR/"
cp ecosystem.config.js "$TEMP_DIR/"
cp .env.example "$TEMP_DIR/"
cp .gitignore "$TEMP_DIR/"

# Копирование документации
cp README.md "$TEMP_DIR/"
[ -f "README1.md" ] && cp README1.md "$TEMP_DIR/"

log "Удаление ненужных файлов..."

# Удаление ненужных файлов и директорий
rm -rf "$TEMP_DIR/client/node_modules" 2>/dev/null || true
rm -rf "$TEMP_DIR/server/node_modules" 2>/dev/null || true
rm -rf "$TEMP_DIR/node_modules" 2>/dev/null || true
rm -rf "$TEMP_DIR/.git" 2>/dev/null || true
rm -rf "$TEMP_DIR/dist" 2>/dev/null || true
rm -rf "$TEMP_DIR/build" 2>/dev/null || true
rm -rf "$TEMP_DIR/.next" 2>/dev/null || true
rm -rf "$TEMP_DIR/.cache" 2>/dev/null || true
rm -rf "$TEMP_DIR/coverage" 2>/dev/null || true
rm -rf "$TEMP_DIR/.nyc_output" 2>/dev/null || true
rm -rf "$TEMP_DIR/logs" 2>/dev/null || true
rm -rf "$TEMP_DIR/*.log" 2>/dev/null || true
rm -rf "$TEMP_DIR/.DS_Store" 2>/dev/null || true
rm -rf "$TEMP_DIR/Thumbs.db" 2>/dev/null || true

# Создание файла с инструкциями по установке
cat > "$TEMP_DIR/INSTALL.md" << 'EOF'
# Установка dela - Системы управления сотрудниками

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных
Создайте файл `.env` на основе `.env.example` и настройте подключение к PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SESSION_SECRET=your_secure_session_secret
PORT=5000
NODE_ENV=development
```

### 3. Инициализация базы данных
```bash
npm run db:generate
npm run db:migrate
```

### 4. Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5000

### 5. Сборка для продакшена
```bash
npm run build
npm run start
```

## Пользователь по умолчанию
- Email: admin@admin.com
- Пароль: POik09MN!

**Обязательно смените пароль после первого входа!**

## Подробная документация
Смотрите README.md для полной документации по установке и настройке.
EOF

log "Создание архива..."

# Переход в временную директорию и создание архива
cd "$TEMP_DIR"
zip -r "../$ARCHIVE_NAME" . -x "*.DS_Store" "*/Thumbs.db" > /dev/null

# Перемещение архива в текущую директорию
mv "/tmp/$ARCHIVE_NAME" ./

# Очистка временной директории
rm -rf "$TEMP_DIR"

# Получение размера архива
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

log "Архив создан успешно!"
echo ""
echo "📦 Файл: $ARCHIVE_NAME"
echo "📏 Размер: $ARCHIVE_SIZE"
echo "📍 Расположение: $(pwd)/$ARCHIVE_NAME"
echo ""
warn "Архив готов для скачивания!"

# Создание символической ссылки в папку client/public для скачивания через веб
mkdir -p client/public/downloads
ln -sf "../../$ARCHIVE_NAME" "client/public/downloads/$ARCHIVE_NAME"

echo "🌐 Также доступен для скачивания по ссылке: /downloads/$ARCHIVE_NAME"

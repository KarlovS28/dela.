
#!/bin/bash

# Скрипт быстрого запуска dela

set -e

echo "🚀 Запуск dela - системы управления сотрудниками"
echo ""

# Создание директории для логов
mkdir -p logs

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден!"
    echo "📋 Создайте файл .env на основе .env.example"
    echo ""
    echo "Пример содержимого .env:"
    echo "DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    echo "SESSION_SECRET=your_secure_session_secret_min_32_chars"
    echo "PORT=5000"
    echo "NODE_ENV=production"
    echo ""
    exit 1
fi

# Проверка установки зависимостей
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Проверка сборки
if [ ! -d "dist" ]; then
    echo "🔨 Сборка приложения..."
    npm run build
fi

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
fi

# Остановка предыдущего процесса (если есть)
pm2 stop dela 2>/dev/null || true
pm2 delete dela 2>/dev/null || true

# Запуск приложения
echo "🎯 Запуск через PM2..."
npm run pm2:start

echo ""
echo "✅ dela запущена успешно!"
echo "🌐 Приложение доступно по адресу: http://localhost:5000"
echo ""
echo "Полезные команды:"
echo "  npm run pm2:logs     - просмотр логов"
echo "  npm run pm2:restart  - перезапуск"
echo "  npm run pm2:stop     - остановка"
echo "  pm2 monit           - мониторинг"
echo ""

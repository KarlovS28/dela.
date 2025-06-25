# dela - Система управления сотрудниками

Комплексная система управления сотрудниками с ролевым доступом, инвентаризацией и документооборотом.
```

```
## 🚀 Быстрый старт

### Требования
- Node.js >= 18.0.0
- PostgreSQL >= 13
- PM2 (для продакшена): `npm install -g pm2`

### Установка и запуск

```bash
# 1. Клонирование проекта
git clone <your-repository-url>
cd dela

# 2. Установка зависимостей
npm install

# 3. Настройка базы данных
# Создайте базу данных PostgreSQL и пользователя
# Скопируйте .env.example в .env и заполните настройки

# 4. Сборка проекта
npm run build

# 5. Запуск в режиме разработки
npm run dev

# ИЛИ запуск в продакшене через PM2
pm2 start ecosystem.config.js --env production
```

## ⚙️ Настройка

### 1. База данных PostgreSQL

#### Для Replit:
1. Откройте новую вкладку и введите "Database"
2. Нажмите "create a database" 
3. В разделе "Secrets" автоматически появится `DATABASE_URL`
4. Скопируйте значение `DATABASE_URL` в ваш `.env` файл

#### Для локального сервера:
Создайте базу данных и пользователя:

```sql
-- Подключитесь к PostgreSQL как суперпользователь
sudo -u postgres psql

-- Создайте базу данных и пользователя
CREATE DATABASE dela_db;
CREATE USER dela_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dela_db TO dela_user;

-- Предоставьте права на схему public (для PostgreSQL 15+)
\c dela_db
GRANT ALL ON SCHEMA public TO dela_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dela_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dela_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dela_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dela_user;
```

### 2. Переменные окружения

Скопируйте файл `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# Обязательные настройки
DATABASE_URL=postgresql://dela_user:your_secure_password@localhost:5432/dela_db
SESSION_SECRET=your_very_secure_session_secret_key_min_32_chars_here

# Настройки сервера
PORT=5000
NODE_ENV=production
```

## 🏗️ Команды сборки и запуска

```bash
# Разработка
npm run dev              # Запуск в режиме разработки

# Продакшен
npm run build            # Сборка проекта
npm start               # Запуск собранного проекта

# База данных
npm run db:generate     # Генерация миграций
npm run db:migrate      # Применение миграций
npm run db:studio       # Веб-интерфейс для БД (опционально)
```

## 🚀 Развертывание на сервере

### Автоматический деплой

```bash
# Используйте готовый скрипт деплоя
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh deploy production
```

### Ручной деплой

```bash
# 1. Подготовка сервера
sudo apt update
sudo apt install nodejs npm postgresql nginx

# 2. Установка PM2
sudo npm install -g pm2

# 3. Создание пользователя для приложения
sudo useradd -m -s /bin/bash dela
sudo usermod -aG www-data dela

# 4. Клонирование и настройка
sudo mkdir -p /var/www/dela
sudo chown dela:dela /var/www/dela
cd /var/www/dela
git clone <your-repository-url> .

# 5. Установка зависимостей и сборка
npm install
npm run build

# 6. Настройка .env файла
cp .env.example .env
nano .env  # Заполните настройки

# 7. Инициализация базы данных
npm run db:migrate

# 8. Запуск через PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 9. Настройка nginx (опционально)
sudo cp deploy/nginx.conf /etc/nginx/sites-available/dela
sudo ln -s /etc/nginx/sites-available/dela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Технические характеристики

### Технологический стек
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **База данных**: PostgreSQL + Drizzle ORM
- **Аутентификация**: Session-based с bcrypt
- **Файлы**: multer для загрузки файлов

### Системные требования
- **RAM**: минимум 1GB, рекомендуется 2GB+
- **Диск**: минимум 500MB
- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 13

## 📱 Возможности системы

- **Управление сотрудниками**: добавление, редактирование, архивирование
- **Департаменты**: организация по отделам
- **Инвентаризация**: учет оборудования и материальных ценностей
- **Excel импорт/экспорт**: 3 типа шаблонов
- **Ролевая система**: Admin, System Admin, Accountant
- **Печать документов**: акты материальной ответственности, обходные листы
- **Уведомления**: система оповещений об изменениях
- **История изменений**: аудит всех операций

## 👤 Пользователь по умолчанию

После первого запуска:
- **Email**: admin@dela.com
- **Пароль**: admin123
- **Роль**: admin

⚠️ **Обязательно смените пароль после первого входа!**

## 🛠️ Управление процессами

```bash
# PM2 команды
pm2 start dela          # Запуск
pm2 stop dela           # Остановка
pm2 restart dela        # Перезапуск
pm2 status              # Статус
pm2 logs dela           # Логи
pm2 monit               # Мониторинг

# Обновление приложения
git pull origin main
npm install
npm run build
pm2 restart dela
```

## 🔍 Устранение неполадок

### Проблемы с базой данных

```bash
# Проверка подключения к PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Проверка настроек в .env
cat .env | grep DATABASE_URL

# Тест подключения
npm run db:migrate
```

### Проблемы с правами доступа

```bash
# Установка правильных прав
sudo chown -R dela:dela /var/www/dela
sudo chmod -R 755 /var/www/dela
```

### Логи для отладки

```bash
# Логи приложения
pm2 logs dela

# Логи системы
sudo journalctl -u nginx -f
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔒 Безопасность

1. **Используйте сильные пароли** для всех учетных записей
2. **Регулярно обновляйте зависимости**: `npm audit && npm update`
3. **Настройте firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```
4. **SSL сертификаты**: используйте Let's Encrypt для HTTPS

## 📄 Лицензия

MIT License - свободное использование и модификация.
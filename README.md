# dela. - Система управления сотрудниками

Комплексная система управления сотрудниками с ролевым доступом, инвентаризацией и документооборотом.

## Возможности системы

- **Управление сотрудниками**: добавление, редактирование, архивирование сотрудников
- **Департаменты**: организация сотрудников по отделам
- **Инвентаризация**: учет оборудования и материальных ценностей
- **Экспорт/Импорт Excel**: 3 типа шаблонов для обмена данными
- **Ролевая система**: Admin, System Admin, Accountant с разными правами доступа
- **Печать документов**: акты материальной ответственности, обходные листы
- **Карточки сотрудников**: полная информация с паспортными данными

## Технологический стек

### Frontend
- React 18 + TypeScript
- Vite для сборки
- TanStack Query для управления состоянием сервера
- shadcn/ui + Tailwind CSS для интерфейса
- React Hook Form + Zod для форм и валидации
- Wouter для маршрутизации

### Backend
- Node.js + Express.js + TypeScript
- Drizzle ORM для работы с базой данных
- PostgreSQL для хранения данных
- bcrypt для хеширования паролей
- express-session для сессий
- multer для загрузки файлов
- xlsx для работы с Excel файлами

## Установка на сервер

### Требования

- Node.js >= 18.0.0
- PostgreSQL >= 13
- nginx (для продакшена)
- Git

### 1. Клонирование репозитория

```bash
git clone <your-repository-url>
cd dela
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE dela_db;
CREATE USER dela_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dela_db TO dela_user;
```

### 4. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DATABASE_URL=postgresql://dela_user:your_secure_password@localhost:5432/dela_db

# Сессии
SESSION_SECRET=your_very_secure_session_secret_key_here

# Порт приложения
PORT=5000

# Окружение
NODE_ENV=production
```

### 5. Инициализация базы данных

```bash
# Генерация и применение миграций
npm run db:generate
npm run db:migrate
```

### 6. Сборка проекта

```bash
# Сборка frontend
npm run build

# Сборка backend (если требуется)
npm run build:server
```

### 7. Запуск в продакшене

#### Вариант 1: PM2 (рекомендуется)

```bash
# Установка PM2 глобально
npm install -g pm2

# Запуск приложения через PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

#### Вариант 2: systemd

Создайте файл службы `/etc/systemd/system/dela.service`:

```ini
[Unit]
Description=dela Employee Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/dela
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активируйте службу:

```bash
sudo systemctl enable dela
sudo systemctl start dela
sudo systemctl status dela
```

### 8. Настройка nginx

Создайте конфигурацию nginx `/etc/nginx/sites-available/dela`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL сертификаты (получите через Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Статические файлы
    location / {
        try_files $uri $uri/ @proxy;
    }

    # Проксирование на Node.js приложение
    location @proxy {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Загрузка файлов (ограничение размера)
    client_max_body_size 50M;

    # Кеширование статических ресурсов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/dela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

## Разработка

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5000`

### Структура проекта

```
dela/
├── client/           # Frontend React приложение
│   ├── src/
│   │   ├── components/  # Компоненты UI
│   │   ├── hooks/      # React хуки
│   │   ├── lib/        # Утилиты
│   │   └── pages/      # Страницы приложения
├── server/           # Backend Express сервер
│   ├── index.ts       # Точка входа сервера
│   ├── routes.ts      # API маршруты
│   ├── storage.ts     # Логика работы с данными
│   └── vite.ts        # Настройки Vite
├── shared/           # Общие типы и схемы
│   └── schema.ts      # Drizzle схемы и типы
└── config files      # Конфигурация проектов
```

### База данных

#### Миграции

```bash
# Создание новой миграции
npm run db:generate

# Применение миграций
npm run db:migrate

# Просмотр схемы
npm run db:studio
```

#### Подключение к базе

```bash
# Через psql
psql postgresql://dela_user:password@localhost:5432/dela_db

# Или через pgAdmin/другие GUI инструменты
```

## Пользователи по умолчанию

После первого запуска создается администратор:

- **Email**: admin@dela.com
- **Пароль**: admin123
- **Роль**: admin

**Обязательно смените пароль после первого входа!**

## Резервное копирование

### Автоматическое резервное копирование базы данных

Создайте скрипт `/opt/dela/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/dela/backups"
DB_NAME="dela_db"
DB_USER="dela_user"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Создание резервной копии
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Удаление старых копий (старше 30 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql"
```

Добавьте в crontab:

```bash
# Резервное копирование каждый день в 2:00
0 2 * * * /opt/dela/backup.sh
```

## Мониторинг и логи

### Логи приложения

```bash
# PM2 логи
pm2 logs dela

# systemd логи
sudo journalctl -u dela -f

# nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Мониторинг производительности

```bash
# Статус PM2
pm2 status

# Мониторинг PM2
pm2 monit

# Системные ресурсы
htop
iostat
```

## Обновление

### Обновление приложения

```bash
# Остановка приложения
pm2 stop dela

# Получение обновлений
git pull origin main

# Установка зависимостей
npm install

# Сборка
npm run build

# Миграции (если есть)
npm run db:migrate

# Запуск
pm2 start dela
```

## Устранение неполадок

### Частые проблемы

1. **Ошибка подключения к базе данных**
   ```bash
   # Проверка статуса PostgreSQL
   sudo systemctl status postgresql
   
   # Проверка подключения
   psql postgresql://dela_user:password@localhost:5432/dela_db
   ```

2. **Ошибки разрешений файлов**
   ```bash
   # Установка правильных разрешений
   sudo chown -R www-data:www-data /path/to/dela
   sudo chmod -R 755 /path/to/dela
   ```

3. **Проблемы с nginx**
   ```bash
   # Проверка конфигурации
   sudo nginx -t
   
   # Перезапуск nginx
   sudo systemctl restart nginx
   ```

### Логи для отладки

```bash
# Логи приложения
tail -f /var/log/dela/app.log

# Логи базы данных
tail -f /var/log/postgresql/postgresql-13-main.log

# Системные логи
sudo journalctl -xe
```

## Безопасность

### Рекомендации

1. **Регулярно обновляйте зависимости**:
   ```bash
   npm audit
   npm update
   ```

2. **Используйте strong passwords** для всех учетных записей

3. **Настройте firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

4. **Регулярно создавайте резервные копии**

5. **Мониторинг безопасности**:
   ```bash
   # Установка fail2ban
   sudo apt install fail2ban
   ```

## Поддержка

При возникновении проблем:

1. Проверьте логи приложения и сервера
2. Убедитесь, что все сервисы запущены
3. Проверьте переменные окружения
4. Обратитесь к документации или создайте issue в репозитории

## Лицензия

[Укажите лицензию проекта]
# Инструкция по развертыванию dela. на стороннем сервере

## Системные требования

### Минимальные требования
- **ОС**: Ubuntu 20.04 LTS / CentOS 8+ / Debian 11+
- **RAM**: 2 GB (рекомендуется 4 GB)
- **Диск**: 10 GB свободного места
- **CPU**: 2 ядра (рекомендуется 4 ядра)

### Необходимое ПО

#### 1. Node.js и npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Проверка версии (должна быть 20.x)
node --version
npm --version
```

#### 2. PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE dela_db;
CREATE USER dela_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dela_db TO dela_user;
\q
```

#### 3. PM2 для управления процессами
```bash
npm install -g pm2
```

#### 4. Nginx (опционально, для продакшена)
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

## Установка приложения

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-repo/dela.git
cd dela
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```bash
# Настройки базы данных
DATABASE_URL="postgresql://dela_user:your_secure_password@localhost:5432/dela_db"

# Настройки сессий
SESSION_SECRET="your_very_secure_random_string_min_32_chars"

# Настройки сервера
PORT=5000
NODE_ENV=production

# Настройки CORS (если фронтенд на другом домене)
CORS_ORIGIN="https://your-domain.com"
```

### 4. Инициализация базы данных
```bash
# Генерация миграций
npm run db:generate

# Применение миграций
npm run db:migrate
```

### 5. Сборка приложения
```bash
npm run build
```

## Запуск в продакшене

### Вариант 1: PM2 (рекомендуется)
```bash
# Создание конфигурации PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'dela-app',
    script: './dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Создание директории для логов
mkdir -p logs

# Запуск приложения
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Вариант 2: systemd service
```bash
# Создание service файла
sudo tee /etc/systemd/system/dela.service > /dev/null << EOF
[Unit]
Description=dela Employee Management System
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/dela
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

# Запуск service
sudo systemctl daemon-reload
sudo systemctl enable dela
sudo systemctl start dela
```

## Настройка Nginx (опционально)

### Создание конфигурации
```bash
sudo tee /etc/nginx/sites-available/dela << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Перенаправление на HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL сертификаты (настройте Let's Encrypt)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Проксирование к Node.js приложению
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Статические файлы
    location /assets/ {
        alias /path/to/dela/dist/client/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Загрузка файлов
    client_max_body_size 10M;
}
EOF

# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/dela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL сертификат с Let's Encrypt
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логи

### PM2 мониторинг
```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs

# Мониторинг в реальном времени
pm2 monit

# Перезапуск
pm2 restart dela-app
```

### Системные логи
```bash
# Логи приложения (systemd)
sudo journalctl -u dela -f

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Резервное копирование

### База данных
```bash
# Создание бэкапа
pg_dump -h localhost -U dela_user -d dela_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
psql -h localhost -U dela_user -d dela_db < backup_20231215_120000.sql

# Автоматическое резервное копирование (cron)
# Добавьте в crontab:
0 2 * * * pg_dump -h localhost -U dela_user -d dela_db > /backups/dela_$(date +\%Y\%m\%d).sql
```

### Файлы приложения
```bash
# Бэкап uploaded файлов
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Бэкап конфигурации
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env ecosystem.config.js
```

## Безопасность

### Firewall (ufw)
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 5000  # Закрыть прямой доступ к Node.js
```

### Обновления безопасности
```bash
# Регулярные обновления системы
sudo apt update && sudo apt upgrade

# Обновление зависимостей Node.js
npm audit
npm audit fix
```

## Отладка и решение проблем

### Проверка портов
```bash
# Проверка занятых портов
sudo netstat -tlnp | grep :5000
sudo ss -tlnp | grep :5000
```

### Проверка подключения к БД
```bash
# Подключение к PostgreSQL
psql -h localhost -U dela_user -d dela_db

# Проверка статуса PostgreSQL
sudo systemctl status postgresql
```

### Проверка логов ошибок
```bash
# Логи приложения
pm2 logs dela-app --lines 100

# Системные ошибки
dmesg | tail -20
```

## Производительность

### Настройка PostgreSQL
Отредактируйте `/etc/postgresql/*/main/postgresql.conf`:
```
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### Настройка Node.js
```bash
# Увеличение лимитов для файлов
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

## Контакты для поддержки

При возникновении проблем с развертыванием:
1. Проверьте логи приложения
2. Убедитесь в правильности настройки переменных окружения
3. Проверьте доступность базы данных
4. Обратитесь к документации PostgreSQL и Node.js

---

**Важно**: Замените все примеры паролей, доменных имен и путей на ваши реальные значения перед развертыванием.
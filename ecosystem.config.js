// PM2 конфигурация для dela - системы управления сотрудниками
module.exports = {
  apps: [
    {
      // Основное приложение
      name: 'dela',
      script: 'server/index.js',
      cwd: '/var/www/dela',
      instances: 'max', // Использовать все доступные CPU
      exec_mode: 'cluster',
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Переменные для разработки
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      
      // Переменные для продакшена
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Настройки автоперезапуска
      watch: false, // В продакшене не следим за файлами
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Настройки логирования
      log_file: '/var/log/dela/combined.log',
      out_file: '/var/log/dela/out.log',
      error_file: '/var/log/dela/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Настройки памяти и производительности
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Автоперезапуск при сбоях
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Мониторинг
      monitoring: true,
      pmx: true,
    }
  ],
  
  // Настройки деплоя
  deploy: {
    // Продакшен деплой
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:username/dela.git',
      path: '/var/www/dela',
      
      // Команды перед деплоем
      'pre-deploy-local': '',
      
      // Команды после получения кода
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      
      // Команды перед началом
      'pre-setup': 'mkdir -p /var/log/dela'
    },
    
    // Staging деплой
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:username/dela.git',
      path: '/var/www/dela-staging',
      
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'mkdir -p /var/log/dela-staging',
      
      env: {
        NODE_ENV: 'staging',
        PORT: 5001,
      }
    }
  }
};
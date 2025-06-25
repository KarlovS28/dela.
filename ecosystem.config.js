
// PM2 конфигурация для dela - системы управления сотрудниками
module.exports = {
  apps: [
    {
      name: 'dela',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      
      // Переменные окружения
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Настройки автоперезапуска
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',
      
      // Логирование
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      
      // Создание директории для логов
      merge_logs: true,
      
      // Переменные для автозагрузки .env
      env_file: '.env',
    }
  ]
};

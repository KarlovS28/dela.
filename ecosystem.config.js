
module.exports = {
  apps: [
    {
      name: 'dela',
      script: 'dist/index.js',
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
      
      // Автоперезапуск
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      
      // Логирование
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      
      // Создание директории для логов
      time: true
    }
  ]
};

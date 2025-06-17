// Главный серверный файл системы управления сотрудниками DELA
// Инициализирует Express сервер, настраивает middleware, маршруты и запускает приложение

// Импорт Express.js и необходимых типов
import express, { type Request, Response, NextFunction } from "express";
// Импорт функции регистрации API маршрутов
import { registerRoutes } from "./routes";
// Импорт функций для настройки Vite в разработке и статической раздачи в продакшене
import { setupVite, serveStatic, log } from "./vite";

// Создание экземпляра Express приложения
const app = express();

// Настройка middleware для парсинга JSON и URL-encoded данных
app.use(express.json());                        // Парсинг JSON тел запросов
app.use(express.urlencoded({ extended: false })); // Парсинг форм (application/x-www-form-urlencoded)

// Middleware для логирования API запросов с измерением времени выполнения
app.use((req, res, next) => {
  const start = Date.now(); // Время начала обработки запроса
  const path = req.path;    // Путь запроса
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Перехватываем оригинальный метод res.json для логирования ответов
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson; // Сохраняем тело ответа
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Обработчик события завершения ответа
  res.on("finish", () => {
    const duration = Date.now() - start; // Вычисляем время выполнения
    // Логируем только API запросы (начинающиеся с /api)
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Добавляем тело ответа к логу, если оно есть
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Обрезаем слишком длинные строки лога
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next(); // Передаем управление следующему middleware
});

// Асинхронная функция инициализации сервера
(async () => {
  // Регистрация API маршрутов и получение HTTP сервера
  const server = await registerRoutes(app);

  // Глобальный обработчик ошибок
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err; // Повторно выбрасываем ошибку для дополнительного логирования
  });

  // Настройка среды выполнения
  // ВАЖНО: Vite настраивается только в разработке и после настройки всех API маршрутов,
  // чтобы catch-all маршрут не конфликтовал с API маршрутами
  if (app.get("env") === "development") {
    // В режиме разработки используем Vite dev server с HMR
    await setupVite(app, server);
  } else {
    // В продакшене раздаем статические файлы
    serveStatic(app);
  }

  // Определение порта из переменной окружения или используем 5000 по умолчанию
  // Этот сервер обслуживает как API, так и клиентскую часть
  const port = process.env.PORT || 5000;
  
  // Запуск сервера на всех интерфейсах (0.0.0.0) для доступности извне
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

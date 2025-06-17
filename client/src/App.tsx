// Главный компонент приложения системы управления сотрудниками DELA
// Содержит основную логику маршрутизации и провайдеры для всего приложения

// Импорт библиотек для маршрутизации
import { Switch, Route } from "wouter";
// Импорт React Query для управления состоянием и кешированием данных
import { QueryClientProvider } from "@tanstack/react-query";
// Импорт компонентов темы и UI
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Импорт хука для работы с аутентификацией
import { useAuth } from "@/hooks/use-auth";
// Импорт клиента для запросов к API
import { queryClient } from "@/lib/queryClient";
// Импорт страниц приложения
import Home from "@/pages/home";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

/**
 * Компонент Router - отвечает за маршрутизацию в приложении
 * Показывает разные страницы в зависимости от статуса аутентификации пользователя
 */
function Router() {
  // Получаем статус аутентификации пользователя
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем индикатор загрузки во время проверки аутентификации
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          {/* Анимированный спиннер загрузки */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Маршрутизация: если пользователь авторизован - показываем главную страницу, иначе - страницу входа
  return (
    <Switch>
      {isAuthenticated ? (
        <Route path="/" component={Home} />
      ) : (
        <Route path="/" component={Login} />
      )}
    </Switch>
  );
}

/**
 * Главный компонент App - корневой компонент приложения
 * Настраивает все провайдеры: React Query, тему, уведомления, подсказки
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Провайдер темы для переключения между светлой и темной темами */}
      <ThemeProvider defaultTheme="light" storageKey="dela-ui-theme">
        {/* Провайдер для отображения всплывающих подсказок */}
        <TooltipProvider>
          {/* Компонент для отображения уведомлений (toast) */}
          <Toaster />
          {/* Основной роутер приложения */}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

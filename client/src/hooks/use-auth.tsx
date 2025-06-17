// Хук и контекст для управления аутентификацией пользователей
// Обеспечивает глобальное состояние аутентификации, вход, выход и регистрацию
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// React Query для управления асинхронными запросами и кешированием
//import { useToast } from '@/hooks/use-toast';
//import { isUnauthorizedError } from '@/lib/auth-utils';
import type { User } from "@shared/schema";

// Интерфейс пользователя системы
// Интерфейс контекста аутентификации
interface AuthContextType {
  user: User | null;                    // Текущий пользователь
  isAuthenticated: boolean;             // Статус аутентификации
  isLoading: boolean;                   // Индикатор загрузки
  login: (email: string, password: string) => Promise<void>;        // Метод входа в систему
  register: (email: string, password: string, fullName: string) => Promise<void>;  // Метод регистрации
  logout: () => Promise<void>;          // Метод выхода из системы
}

// Создание контекста для аутентификации
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Провайдер аутентификации - оборачивает приложение и предоставляет контекст аутентификации
 * @param children - дочерние компоненты
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Локальное состояние пользователя
  const [user, setUser] = useState<User | null>(null);
  // Клиент React Query для управления кешем
  const queryClient = useQueryClient();

  // Запрос для получения данных текущего пользователя при загрузке приложения
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',  // Включаем cookies для сессии
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null;  // Пользователь не авторизован
        }
        throw new Error('Failed to fetch user');
      }
      return response.json() as Promise<User>;
    },
    retry: false,  // Не повторяем запрос при ошибке 401
  });

  // Обновляем локальное состояние при изменении данных пользователя
  useEffect(() => {
    setUser(userData || null);
  }, [userData]);

  // Мутация для входа в систему
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Включаем cookies для сохранения сессии
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json() as Promise<User>;
    },
    onSuccess: (data) => {
      setUser(data);
      // Обновляем кеш React Query после успешного входа
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Мутация для регистрации нового пользователя
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, role: 'office-manager' }),  // По умолчанию роль офис-менеджера
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return response.json() as Promise<User>;
    },
    onSuccess: (data) => {
      setUser(data);
      // Обновляем кеш после успешной регистрации
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Мутация для выхода из системы
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      // Очищаем весь кеш React Query после выхода
      queryClient.clear();
    },
  });

  // Обертки для методов аутентификации
  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, fullName: string) => {
    await registerMutation.mutateAsync({ email, password, fullName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Возвращаем провайдер контекста с методами и состоянием аутентификации
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Хук для использования контекста аутентификации
 * Должен использоваться внутри AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
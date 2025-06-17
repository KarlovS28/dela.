// Конфигурация клиента React Query для управления состоянием и кешированием данных
// Настраивает поведение запросов, повторы при ошибках и время актуальности кеша

import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async (context) => {
    // Строим URL из массива queryKey
    let url = context.queryKey[0] as string;
    if (context.queryKey.length > 1) {
      // Для запросов типа ["/api/employees", 1] создаем "/api/employees/1"
      url = context.queryKey.join('/');
    }

    const res = await fetch(url, {
      credentials: "include",
      signal: context.signal,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Создание и экспорт клиента React Query с настройками по умолчанию
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Настройка логики повторных запросов при ошибках
      retry: (failureCount, error: any) => {
        // Не повторяем запросы при ошибке 401 (неавторизован)
        if (error?.status === 401) {
          return false;
        }
        // Повторяем до 3 раз для других ошибок
        return failureCount < 3;
      },
      // Время актуальности кеша - 5 минут
      // После этого времени данные считаются устаревшими и будут обновлены при следующем использовании
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
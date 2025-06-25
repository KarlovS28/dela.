import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: {
    method: string;
    body?: string;
  }
): Promise<Response> {
  const res = await fetch(url, {
    method: options.method,
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body,
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: (context) => {
        // For auth endpoint, return null on 401 instead of throwing
        if (context.queryKey[0] === "/api/auth/me") {
          return getQueryFn({ on401: "returnNull" })(context);
        }
        return getQueryFn({ on401: "throw" })(context);
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

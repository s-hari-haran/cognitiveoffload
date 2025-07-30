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
    method?: string;
    body?: unknown;
    on401?: "returnNull" | "throw";
  } = {}
): Promise<any> {
  const { method = "GET", body, on401 = "throw" } = options;
  
  // Get token from localStorage
  const token = localStorage.getItem('workos_token');
  
  console.log('🌐 API Request:', {
    url,
    method,
    hasToken: !!token,
    on401
  });

  const headers: Record<string, string> = {};
  
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (on401 === "returnNull" && res.status === 401) {
    console.log('❌ API Request: 401 Unauthorized, returning null');
    return null;
  }

  await throwIfResNotOk(res);
  
  // Return the parsed JSON data instead of the Response object
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Get token from localStorage
    const token = localStorage.getItem('workos_token');
    
    console.log('🔍 Query Function:', {
      url,
      hasToken: !!token,
      on401: unauthorizedBehavior
    });

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('❌ Query Function: 401 Unauthorized, returning null');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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

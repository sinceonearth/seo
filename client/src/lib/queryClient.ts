import { QueryClient, QueryFunction } from "@tanstack/react-query";

/* -------------------------------------------------------------------------- */
/* 🔑 Token Management                                                        */
/* -------------------------------------------------------------------------- */

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error("❌ Failed to save auth token:", err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("❌ Failed to clear auth token:", err);
  }
}

/* -------------------------------------------------------------------------- */
/* 🪪 Header Utility                                                          */
/* -------------------------------------------------------------------------- */

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/* -------------------------------------------------------------------------- */
/* 🚨 Response Validator                                                      */
/* -------------------------------------------------------------------------- */

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message: string;
    try {
      const text = await res.text();
      message = text || res.statusText;
    } catch {
      message = res.statusText;
    }
    console.error(`❌ API ${res.status}: ${message}`);
    throw new Error(`${res.status}: ${message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* 🌍 Universal API Request Helper                                            */
/* -------------------------------------------------------------------------- */

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  token?: string
): Promise<Response> {
  const authToken = token || getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/* -------------------------------------------------------------------------- */
/* 🌐 API Base URL                                                            */
/* -------------------------------------------------------------------------- */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5050"
    : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5050`);

/* -------------------------------------------------------------------------- */
/* 🧭 Query Function for TanStack Query                                       */
/* -------------------------------------------------------------------------- */

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>({ on401 = "throw" }: { on401?: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const token = getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    // Gracefully handle missing token or unauthorized
    if (res.status === 401) {
      console.warn("⚠️ Unauthorized — returning null");
      if (on401 === "returnNull") return null as T;
      throw new Error("401: Unauthorized");
    }

    await throwIfResNotOk(res);
    return res.json();
  };

/* -------------------------------------------------------------------------- */
/* ⚙️ Default QueryClient Configuration                                       */
/* -------------------------------------------------------------------------- */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Default should not always call getQueryFn with /api/auth/user
      // Leave queryFn undefined so each useQuery defines its own getQueryFn
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

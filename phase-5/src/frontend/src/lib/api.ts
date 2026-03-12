const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

let cachedJwt: string | null = null;

async function getJwtToken(): Promise<string | null> {
  if (cachedJwt) return cachedJwt;

  try {
    // Method 1: Call the JWT plugin's /token endpoint directly
    const tokenRes = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      const jwt = tokenData?.token;
      if (jwt) {
        cachedJwt = jwt;
        setTimeout(() => { cachedJwt = null; }, 6 * 60 * 1000);
        return jwt;
      }
    }
  } catch {
    // Fall through to method 2
  }

  try {
    // Method 2: Get JWT from set-auth-jwt header on get-session
    const res = await fetch("/api/auth/get-session", {
      credentials: "include",
    });
    if (!res.ok) return null;

    const jwt = res.headers.get("set-auth-jwt");
    if (jwt) {
      cachedJwt = jwt;
      setTimeout(() => { cachedJwt = null; }, 6 * 60 * 1000);
      return jwt;
    }
  } catch {
    // No token available
  }

  return null;
}

export function clearAuthCache() {
  cachedJwt = null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getJwtToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    cachedJwt = null;
    window.location.href = "/sign-in";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

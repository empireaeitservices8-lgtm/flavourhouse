// API client for connecting frontend to native Next.js API routes
export const BACKEND_URL =
  typeof window !== "undefined"
    ? "" // In browser, always make relative requests to same-origin Next.js routes
    : (process.env.NEXT_PUBLIC_BACKEND_URL && !process.env.NEXT_PUBLIC_BACKEND_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_BACKEND_URL
        : "");

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fh_admin_token");
}

export function setAdminToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("fh_admin_token", token);
  }
}

export function removeAdminToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fh_admin_token");
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Customer Authentication Storage & Headers ───────────────────────────────────
export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fh_customer_token");
}

export function setCustomerToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("fh_customer_token", token);
  }
}

export function removeCustomerToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fh_customer_token");
  }
}

export function getCustomerAuthHeaders(): Record<string, string> {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function checkBackendHealth(timeoutMs = 3500): Promise<{ online: boolean; message?: string; status?: number }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { online: true, message: data.message || "Backend operational", status: res.status };
    }
    return { online: false, message: `Server returned error (${res.status})`, status: res.status };
  } catch (err: any) {
    return {
      online: false,
      message: err.name === "AbortError" ? "Connection timed out" : (err.message || "Backend unreachable"),
      status: 0,
    };
  }
}

export async function fetchFromBackend<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  try {
    // If signal not provided, use default 4000ms timeout
    let signal = options.signal;
    let timer: NodeJS.Timeout | null = null;
    if (!signal) {
      const controller = new AbortController();
      signal = controller.signal;
      timer = setTimeout(() => controller.abort(), 4000);
    }

    const res = await fetch(url, {
      ...options,
      headers,
      signal,
    });

    if (timer) clearTimeout(timer);

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error: any) {
    console.error(`Backend fetch failed for ${endpoint}:`, error);
    const isTimeout = error.name === "AbortError";
    return {
      ok: false,
      status: isTimeout ? 408 : 503,
      data: {
        error: isTimeout
          ? "Request timed out waiting for backend response"
          : (error.message || "Failed to connect to backend server"),
      } as any,
    };
  }
}


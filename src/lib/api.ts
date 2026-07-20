import { env } from "@/lib/env";
import { clearSession, getAccessToken, isAccessTokenExpired } from "@/lib/auth-storage";
import type { ApiErrorPayload } from "@/types/auth";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function errorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) return payload.detail.map((item) => item.msg).filter(Boolean).join(" ") || fallback;
  return payload.message ?? fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (token && isAccessTokenExpired(token)) {
    clearSession();
    throw new ApiRequestError("Tu sesión expiró. Inicia sesión nuevamente.", 401);
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const target = path.startsWith("/api/") ? path : `${env.apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(target, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiRequestError("No se pudo conectar con el servidor. Verifica que el backend esté encendido.", 0);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (response.status === 401) clearSession();
    throw new ApiRequestError(errorMessage(payload, `Error ${response.status}`), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

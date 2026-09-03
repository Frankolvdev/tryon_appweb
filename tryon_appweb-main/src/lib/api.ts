import { env } from "@/lib/env";
import { clearSession } from "@/lib/auth-storage";
import { getUsableAccessToken, refreshAccessToken } from "@/lib/session-refresh";
import type { ApiErrorPayload } from "@/types/auth";

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
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

function targetFor(path: string): string {
  return path.startsWith("/api/v1/")
    ? `${env.apiBaseUrl}${path}`
    : path.startsWith("/api/")
      ? path
      : `${env.apiBaseUrl}${path}`;
}

async function request(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 30_000);
  const abortFromCaller = () => timeoutController.abort();
  init.signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    return await fetch(targetFor(path), {
      ...init,
      headers,
      cache: "no-store",
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("La solicitud tardó demasiado. Intenta nuevamente.", 0);
    }
    throw new ApiRequestError("No se pudo conectar con el servidor. Verifica que el backend esté encendido.", 0);
  } finally {
    window.clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token: string | null;
  try {
    token = await getUsableAccessToken();
  } catch {
    throw new ApiRequestError("No se pudo renovar la sesión porque el servidor no está disponible.", 0);
  }

  let response = await request(path, init, token);
  if (response.status === 401 && token) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) response = await request(path, init, refreshed);
    } catch {
      throw new ApiRequestError("No se pudo renovar la sesión porque el servidor no está disponible.", 0);
    }
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

export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  let token: string | null;
  try {
    token = await getUsableAccessToken();
  } catch {
    throw new ApiRequestError("No se pudo renovar la sesión porque el servidor no está disponible.", 0);
  }

  let response = await request(path, init, token);
  if (response.status === 401 && token) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) response = await request(path, init, refreshed);
    } catch {
      throw new ApiRequestError("No se pudo renovar la sesión porque el servidor no está disponible.", 0);
    }
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (response.status === 401) clearSession();
    throw new ApiRequestError(errorMessage(payload, `Error ${response.status}`), response.status);
  }
  return response.blob();
}

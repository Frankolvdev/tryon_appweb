import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/auth-storage";
import type { ApiErrorPayload } from "@/types/auth";

function errorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) return payload.detail.map((item) => item.msg).filter(Boolean).join(" ") || fallback;
  return payload.message ?? fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try { payload = await response.json(); } catch { payload = null; }
    throw new Error(errorMessage(payload, `Error ${response.status}`));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

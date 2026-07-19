import { apiFetch } from "@/lib/api";
import type { CurrentUser, TokenResponse } from "@/types/auth";

type RegisterInput = { email: string; password: string; full_name?: string; accept_terms: boolean };

async function parseError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as { detail?: string | Array<{ msg?: string }>; message?: string } | null;
  if (typeof payload?.detail === "string") return new Error(payload.detail);
  if (Array.isArray(payload?.detail)) {
    const message = payload.detail.map((item) => item.msg).filter(Boolean).join(" ");
    if (message) return new Error(message);
  }
  return new Error(payload?.message ?? fallback);
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, mfa_code: null }),
  });
  if (!response.ok) throw await parseError(response, "No fue posible iniciar sesión.");
  return response.json() as Promise<TokenResponse>;
}

export async function register(input: RegisterInput): Promise<CurrentUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response, "No fue posible crear la cuenta.");
  return response.json() as Promise<CurrentUser>;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/auth/me");
}

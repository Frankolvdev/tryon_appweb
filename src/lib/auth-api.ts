import { apiFetch } from "@/lib/api";
import { env } from "@/lib/env";
import type { CurrentUser, TokenResponse } from "@/types/auth";

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({ username: email, password });
  const response = await fetch(`${env.apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(payload?.detail ?? "No fue posible iniciar sesión.");
  }
  return response.json() as Promise<TokenResponse>;
}

export async function register(input: { email: string; password: string; full_name?: string }): Promise<unknown> {
  return apiFetch("/api/v1/users/", { method: "POST", body: JSON.stringify(input) });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/users/me");
}

import { env } from "@/lib/env";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  saveSession,
} from "@/lib/auth-storage";
import type { TokenResponse } from "@/types/auth";

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // A temporary backend/network failure is not proof that the session expired.
    throw new Error("SESSION_REFRESH_UNAVAILABLE");
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      clearSession();
      return null;
    }
    throw new Error("SESSION_REFRESH_UNAVAILABLE");
  }

  const tokens = (await response.json()) as TokenResponse;
  if (!tokens.access_token) {
    clearSession();
    return null;
  }

  saveSession(tokens.access_token, tokens.refresh_token ?? refreshToken);
  return tokens.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function getUsableAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token && !isAccessTokenExpired(token)) return token;
  return refreshAccessToken();
}

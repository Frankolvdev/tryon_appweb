const ACCESS_TOKEN_KEY = "tryon_access_token";
const REFRESH_TOKEN_KEY = "tryon_refresh_token";
const SESSION_UPDATED_EVENT = "tryon:session-updated";

export type SessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

type JwtPayload = {
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function emitSessionUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiresAt(token = getAccessToken()): number | null {
  if (typeof window === "undefined" || !token) return null;
  const expiration = decodeJwtPayload(token)?.exp;
  return typeof expiration === "number" ? expiration * 1000 : null;
}

export function isAccessTokenExpired(token = getAccessToken(), clockSkewMs = 15_000): boolean {
  if (!token) return true;
  const expiresAt = getTokenExpiresAt(token);
  return expiresAt !== null && Date.now() + clockSkewMs >= expiresAt;
}

export function getSessionSnapshot(): SessionSnapshot {
  const accessToken = getAccessToken();
  return {
    accessToken,
    refreshToken: getRefreshToken(),
    expiresAt: getTokenExpiresAt(accessToken),
  };
}

export function hasSession(): boolean {
  const token = getAccessToken();
  return Boolean(token && !isAccessTokenExpired(token));
}

export function saveSession(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  emitSessionUpdate();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  emitSessionUpdate();
}

export function subscribeToSessionChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY || event.key === null) {
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SESSION_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SESSION_UPDATED_EVENT, callback);
  };
}

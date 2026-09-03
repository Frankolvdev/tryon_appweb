const OAUTH_RETURN_TO_KEY = "tryon_oauth_return_to";

function isSafeInternalPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"));
}

export function normalizeReturnTo(value: string | null | undefined, fallback = "/dashboard"): string {
  return isSafeInternalPath(value) ? value : fallback;
}

export function rememberOAuthReturnTo(value: string | null | undefined): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OAUTH_RETURN_TO_KEY, normalizeReturnTo(value));
}

export function consumeOAuthReturnTo(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const stored = window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
  return normalizeReturnTo(stored, fallback);
}

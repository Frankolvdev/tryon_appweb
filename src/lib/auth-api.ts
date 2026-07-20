import { apiFetch } from "@/lib/api";
import type {
  CurrentUser,
  OAuthAuthorizationResponse,
  OAuthProvidersResponse,
  TokenResponse,
} from "@/types/auth";

type RegisterInput = {
  email: string;
  password: string;
  full_name?: string;
  terms_accepted: boolean;
  terms_version?: string;
  age_confirmed: boolean;
};

export type VerificationResponse = {
  success: boolean;
  message: string;
  verification_method: string;
  expires_at?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response, fallback: string): Promise<ApiError> {
  const payload = await response.json().catch(() => null) as {
    detail?: string | Array<{ msg?: string }>;
    message?: string;
  } | null;

  if (typeof payload?.detail === "string") {
    return new ApiError(payload.detail, response.status);
  }

  if (Array.isArray(payload?.detail)) {
    const message = payload.detail.map((item) => item.msg).filter(Boolean).join(" ");
    if (message) return new ApiError(message, response.status);
  }

  return new ApiError(payload?.message ?? fallback, response.status);
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

export async function requestVerification(email: string): Promise<VerificationResponse> {
  const response = await fetch("/api/auth/verification/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "registration" }),
  });
  if (!response.ok) throw await parseError(response, "No fue posible enviar el correo de verificación.");
  return response.json() as Promise<VerificationResponse>;
}

export async function resendVerification(email: string): Promise<VerificationResponse> {
  const response = await fetch("/api/auth/verification/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "registration" }),
  });
  if (!response.ok) throw await parseError(response, "No fue posible reenviar el correo de verificación.");
  return response.json() as Promise<VerificationResponse>;
}

export async function confirmVerification(
  email: string,
  token: string,
): Promise<{ success: boolean; verified: boolean; message: string }> {
  const response = await fetch("/api/auth/verification/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, purpose: "registration", otp: null }),
  });
  if (!response.ok) throw await parseError(response, "No fue posible verificar la cuenta.");
  return response.json() as Promise<{ success: boolean; verified: boolean; message: string }>;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/auth/me");
}


export async function getOAuthProviders(): Promise<OAuthProvidersResponse> {
  const response = await fetch("/api/auth/oauth/providers", { cache: "no-store" });
  if (!response.ok) throw await parseError(response, "No fue posible consultar los proveedores de acceso.");
  return response.json() as Promise<OAuthProvidersResponse>;
}

export async function startGoogleOAuth(input: {
  redirect_uri: string;
  terms_accepted: boolean;
  terms_version?: string | null;
  age_confirmed: boolean;
}): Promise<OAuthAuthorizationResponse> {
  const response = await fetch("/api/auth/oauth/google/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response, "No fue posible iniciar el acceso con Google.");
  return response.json() as Promise<OAuthAuthorizationResponse>;
}

export async function exchangeOAuthCode(code: string): Promise<TokenResponse> {
  const response = await fetch("/api/auth/oauth/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response, "No fue posible completar el acceso con Google.");
  return response.json() as Promise<TokenResponse>;
}

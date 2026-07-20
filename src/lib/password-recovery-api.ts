export type PasswordRecoveryRequestResponse = {
  success: boolean;
  message: string;
  verification_method?: string | null;
  challenge_id?: number | string | null;
  expires_at?: string | null;
};

export type PasswordRecoveryConfirmResponse = {
  success: boolean;
  message: string;
};

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
};

export class PasswordRecoveryApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PasswordRecoveryApiError";
  }
}

async function parseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  if (typeof payload?.detail === "string") {
    return new PasswordRecoveryApiError(payload.detail, response.status);
  }
  if (Array.isArray(payload?.detail)) {
    const message = payload.detail.map((item) => item.msg).filter(Boolean).join(" ");
    if (message) return new PasswordRecoveryApiError(message, response.status);
  }
  return new PasswordRecoveryApiError(payload?.message ?? fallback, response.status);
}

export async function requestPasswordRecovery(
  email: string,
): Promise<PasswordRecoveryRequestResponse> {
  const response = await fetch("/api/auth/password-recovery/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw await parseError(response, "No fue posible enviar las instrucciones.");
  }
  return response.json() as Promise<PasswordRecoveryRequestResponse>;
}

export async function confirmPasswordRecovery(input: {
  email: string;
  token?: string | null;
  otp?: string | null;
  newPassword: string;
}): Promise<PasswordRecoveryConfirmResponse> {
  const response = await fetch("/api/auth/password-recovery/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      token: input.token || null,
      otp: input.otp || null,
      new_password: input.newPassword,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, "No fue posible cambiar la contraseña.");
  }
  return response.json() as Promise<PasswordRecoveryConfirmResponse>;
}

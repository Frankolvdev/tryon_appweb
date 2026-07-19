export type TokenResponse = { access_token: string; token_type: string; refresh_token?: string | null; expires_in?: number; requires_mfa?: boolean; };
export type UserRole = { id?: string | number; name?: string; slug?: string; code?: string; };
export type CurrentUser = { id: string | number; email: string; full_name?: string | null; is_active?: boolean; is_verified?: boolean; is_superuser?: boolean; is_admin?: boolean; role?: string | UserRole | null; roles?: Array<string | UserRole>; token_balance?: number; };
export type ApiErrorPayload = { detail?: string | Array<{ msg?: string }>; message?: string; };

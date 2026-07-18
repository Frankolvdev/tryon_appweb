export type TokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string | null;
};

export type CurrentUser = {
  id: string | number;
  email: string;
  full_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  token_balance?: number;
};

export type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
};

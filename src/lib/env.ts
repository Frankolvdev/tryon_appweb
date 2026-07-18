export const env = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001").replace(/\/$/, ""),
  landingUrl: process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  googleOAuthStartUrl: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_START_URL ?? "",
};

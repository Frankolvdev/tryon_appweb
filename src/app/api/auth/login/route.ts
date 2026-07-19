import { proxyBackend } from "@/lib/server/backend-proxy";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBackend("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") ?? "tryon-appweb" },
    body,
  });
}

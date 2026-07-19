import { proxyBackend } from "@/lib/server/backend-proxy";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  return proxyBackend("/api/v1/users/me", {
    method: "GET",
    headers: authorization ? { Authorization: authorization } : {},
  });
}

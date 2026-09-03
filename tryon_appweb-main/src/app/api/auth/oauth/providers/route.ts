import { proxyBackend } from "@/lib/server/backend-proxy";

export async function GET() {
  return proxyBackend("/api/v1/oauth/providers", { method: "GET" });
}

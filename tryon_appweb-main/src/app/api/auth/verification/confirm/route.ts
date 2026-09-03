import { proxyBackend } from "@/lib/server/backend-proxy";

export async function POST(request: Request) {
  return proxyBackend("/api/v1/account-verification/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "tryon-appweb",
    },
    body: await request.text(),
  });
}

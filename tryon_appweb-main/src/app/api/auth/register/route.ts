import { proxyBackend } from "@/lib/server/backend-proxy";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBackend("/api/v1/users/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": request.headers.get("user-agent") ?? "tryon-appweb",
      ...(request.headers.get("x-device-id") ? { "X-Device-ID": request.headers.get("x-device-id")! } : {}),
    },
    body,
  });
}

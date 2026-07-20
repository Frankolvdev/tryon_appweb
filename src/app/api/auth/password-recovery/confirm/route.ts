function backendBaseUrl() {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");
}

async function proxyJson(path: string, request: Request) {
  const body = await request.text();
  const response = await fetch(`${backendBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(request: Request) {
  return proxyJson("/api/v1/password-recovery/confirm", request);
}

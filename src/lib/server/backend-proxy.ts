import { NextResponse } from "next/server";

const backendBaseUrl = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001").replace(/\/$/, "");

export async function proxyBackend(path: string, init: RequestInit): Promise<NextResponse> {
  try {
    const response = await fetch(`${backendBaseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "application/json";
    return new NextResponse(text || null, { status: response.status, headers: { "content-type": contentType } });
  } catch (error) {
    console.error(`Backend unavailable for ${path}`, error);
    return NextResponse.json(
      { detail: "No se pudo conectar con el backend. Verifica que FastAPI esté ejecutándose en el puerto configurado." },
      { status: 503 },
    );
  }
}

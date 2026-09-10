import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBaseUrl = (
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001"
).replace(/\/$/, "");

async function backendError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { detail?: unknown; message?: unknown };
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.message === "string") return payload.message;
  } catch {}
  return fallback;
}

export async function POST(request: Request) {
  const internalKey = (process.env.APPWEB_INTERNAL_KEY ?? "").trim();
  if (!internalKey) {
    return NextResponse.json({ detail: "APPWEB_INTERNAL_KEY no está configurada." }, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  if (!authorization) return NextResponse.json({ detail: "Sesión requerida." }, { status: 401 });

  let body: { module_id?: unknown; inputs?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ detail: "Solicitud inválida." }, { status: 400 }); }

  const moduleId = Number(body.module_id);
  if (moduleId !== 8 || !body.inputs || typeof body.inputs !== "object" || Array.isArray(body.inputs)) {
    return NextResponse.json({ detail: "Contrato Create Model inválido." }, { status: 400 });
  }

  const privateHeaders = { "X-AppWeb-Internal-Key": internalKey, "Cache-Control": "no-store" };
  const countResponse = await fetch(`${backendBaseUrl}/api/v1/model-generation-assets/private/facial-structures/count`, {
    headers: privateHeaders,
    cache: "no-store",
  });
  if (!countResponse.ok) {
    return NextResponse.json({ detail: await backendError(countResponse, "No se pudo consultar el banco facial.") }, { status: 502 });
  }
  const countPayload = await countResponse.json() as { total?: number };
  const total = Math.max(0, Math.trunc(Number(countPayload.total) || 0));
  if (total < 1) {
    return NextResponse.json({ detail: "No hay estructuras faciales activas configuradas." }, { status: 409 });
  }

  // Fresh independent selection for every execution. Only one reference is read.
  const index = randomInt(total);
  const faceResponse = await fetch(`${backendBaseUrl}/api/v1/model-generation-assets/private/facial-structures/reference?index=${index}`, {
    headers: privateHeaders,
    cache: "no-store",
  });
  if (!faceResponse.ok) {
    return NextResponse.json({ detail: await backendError(faceResponse, "No se pudo obtener la estructura facial privada.") }, { status: 502 });
  }
  const faceBytes = await faceResponse.arrayBuffer();
  const faceType = faceResponse.headers.get("content-type") || "image/webp";

  const form = new FormData();
  form.append("file_keys", "input_21");
  form.append("files", new Blob([faceBytes], { type: faceType }), "face-reference.webp");
  form.append("payload", JSON.stringify({ inputs: body.inputs }));

  const executionResponse = await fetch(`${backendBaseUrl}/api/v1/generation-modules/${moduleId}/executions`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: form,
    cache: "no-store",
  });
  if (!executionResponse.ok) {
    return NextResponse.json(
      { detail: await backendError(executionResponse, `Error ${executionResponse.status}`) },
      { status: executionResponse.status },
    );
  }
  const execution = await executionResponse.json();
  return NextResponse.json(execution, { headers: { "Cache-Control": "no-store, private" } });
}

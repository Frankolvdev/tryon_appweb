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

  if (total < 2) {
    return NextResponse.json({ detail: "Se requieren al menos dos estructuras faciales activas para Create Model." }, { status: 409 });
  }

  // Cryptographically-random pair without replacement. The second index is
  // guaranteed to be different from the first, while every ordered pair has
  // the same probability. With a large bank this makes exact pair repetition
  // naturally very unlikely without keeping client-visible selection state.
  const firstIndex = randomInt(total);
  let secondIndex = randomInt(total - 1);
  if (secondIndex >= firstIndex) secondIndex += 1;

  const fetchPrivateFace = async (index: number) => {
    const response = await fetch(
      `${backendBaseUrl}/api/v1/model-generation-assets/private/facial-structures/reference?index=${index}`,
      { headers: privateHeaders, cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(await backendError(response, "No se pudo obtener la estructura facial privada."));
    }
    return {
      bytes: await response.arrayBuffer(),
      type: response.headers.get("content-type") || "image/webp",
    };
  };

  let firstFace: { bytes: ArrayBuffer; type: string };
  let secondFace: { bytes: ArrayBuffer; type: string };
  try {
    [firstFace, secondFace] = await Promise.all([
      fetchPrivateFace(firstIndex),
      fetchPrivateFace(secondIndex),
    ]);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudieron obtener las estructuras faciales privadas." },
      { status: 502 },
    );
  }

  const form = new FormData();
  form.append("file_keys", "input_21");
  form.append("files", new Blob([firstFace.bytes], { type: firstFace.type }), "face-reference.webp");
  form.append("file_keys", "input_24");
  form.append("files", new Blob([secondFace.bytes], { type: secondFace.type }), "face-reference2.webp");
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

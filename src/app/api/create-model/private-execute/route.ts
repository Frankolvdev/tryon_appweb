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

  let body: {
    module_id?: unknown;
    inputs?: unknown;
    face_reference_token?: unknown;
    previous_face_reference_token?: unknown;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ detail: "Solicitud inválida." }, { status: 400 }); }

  const moduleId = Number(body.module_id);
  if (moduleId !== 8 || !body.inputs || typeof body.inputs !== "object" || Array.isArray(body.inputs)) {
    return NextResponse.json({ detail: "Contrato Create Model inválido." }, { status: 400 });
  }

  const historyToken = typeof body.face_reference_token === "string"
    ? body.face_reference_token
    : typeof body.previous_face_reference_token === "string"
      ? body.previous_face_reference_token
      : undefined;
  const pairResponse = await fetch(`${backendBaseUrl}/api/v1/model-generation-assets/private/facial-structures/select`, {
    method: "POST",
    headers: {
      "X-AppWeb-Internal-Key": internalKey,
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(historyToken ? { history_token: historyToken } : {}),
      reuse_current_pair: typeof body.face_reference_token === "string",
    }),
    cache: "no-store",
  });
  if (!pairResponse.ok) {
    return NextResponse.json(
      { detail: await backendError(pairResponse, "No se pudieron seleccionar las referencias faciales.") },
      { status: pairResponse.status },
    );
  }

  try {
    const pairForm = await pairResponse.formData();
    const firstFace = pairForm.get("face_reference");
    const secondFace = pairForm.get("face_reference2");
    const nextHistoryToken = pairForm.get("history_token");
    if (!(firstFace instanceof Blob) || !(secondFace instanceof Blob) || typeof nextHistoryToken !== "string") {
      throw new Error("El backend devolvió un par facial incompleto.");
    }

    const form = new FormData();
    form.append("file_keys", "input_21");
    form.append("files", firstFace, "face-reference.webp");
    form.append("file_keys", "input_24");
    form.append("files", secondFace, "face-reference2.webp");
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
    return NextResponse.json(
      { ...execution, private_face_reference_token: nextHistoryToken },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "No se pudo procesar el par facial privado." },
      { status: 502 },
    );
  }
}

import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
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

function faceReferenceToken(firstIndex: number, secondIndex: number, secret: string) {
  const payload = `v1.${firstIndex}.${secondIndex}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function faceReferencePairFromToken(token: unknown, secret: string, total: number) {
  if (typeof token !== "string" || !token) return null;
  const match = /^v1\.(\d+)\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!match) throw new Error("La base facial anterior no es válida.");
  const firstIndex = Number(match[1]);
  const secondIndex = Number(match[2]);
  const payload = `v1.${firstIndex}.${secondIndex}`;
  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
  const received = Buffer.from(match[3]);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received) ||
    !Number.isInteger(firstIndex) ||
    !Number.isInteger(secondIndex) ||
    firstIndex < 0 ||
    secondIndex < 0 ||
    firstIndex >= total ||
    secondIndex >= total ||
    firstIndex === secondIndex
  ) {
    throw new Error("La base facial anterior no es válida.");
  }
  return { firstIndex, secondIndex };
}

function shuffledIndexes(total: number) {
  const indexes = Array.from({ length: total }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

function fileDigest(bytes: ArrayBuffer) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
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

  let reusedPair: { firstIndex: number; secondIndex: number } | null;
  let previousPair: { firstIndex: number; secondIndex: number } | null = null;
  try {
    reusedPair = faceReferencePairFromToken(body.face_reference_token, internalKey, total);
    if (!reusedPair && body.previous_face_reference_token) {
      previousPair = faceReferencePairFromToken(body.previous_face_reference_token, internalKey, total);
    }
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "La base facial anterior no es válida." },
      { status: 400 },
    );
  }

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

  const randomized = shuffledIndexes(total);
  let candidateIndexes: number[];
  if (reusedPair) {
    candidateIndexes = [
      reusedPair.firstIndex,
      reusedPair.secondIndex,
      ...randomized.filter((index) => index !== reusedPair.firstIndex && index !== reusedPair.secondIndex),
    ];
  } else if (previousPair && total >= 4) {
    const previousIndexes = new Set([previousPair.firstIndex, previousPair.secondIndex]);
    candidateIndexes = [
      ...randomized.filter((index) => !previousIndexes.has(index)),
      ...randomized.filter((index) => previousIndexes.has(index)),
    ];
  } else if (previousPair && total === 3) {
    const previousIndexes = new Set([previousPair.firstIndex, previousPair.secondIndex]);
    candidateIndexes = [
      ...randomized.filter((index) => !previousIndexes.has(index)),
      ...randomized.filter((index) => previousIndexes.has(index)),
    ];
  } else {
    candidateIndexes = randomized;
  }

  const firstIndex = candidateIndexes[0];
  let firstFace: { bytes: ArrayBuffer; type: string };
  let secondFace: { bytes: ArrayBuffer; type: string };
  let secondIndex = -1;
  try {
    firstFace = await fetchPrivateFace(firstIndex);
    const firstDigest = fileDigest(firstFace.bytes);
    let distinctFace: { bytes: ArrayBuffer; type: string } | null = null;
    for (const candidateIndex of candidateIndexes.slice(1)) {
      const candidateFace = await fetchPrivateFace(candidateIndex);
      if (fileDigest(candidateFace.bytes) === firstDigest) continue;
      secondIndex = candidateIndex;
      distinctFace = candidateFace;
      break;
    }
    if (!distinctFace || secondIndex < 0) {
      throw new Error("El banco facial no contiene dos imágenes de referencia distintas.");
    }
    secondFace = distinctFace;
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
  return NextResponse.json(
    {
      ...execution,
      private_face_reference_token: faceReferenceToken(firstIndex, secondIndex, internalKey),
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}

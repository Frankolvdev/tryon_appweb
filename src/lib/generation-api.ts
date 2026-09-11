import { apiFetch, apiStream } from "@/lib/api";
import type { GenerationExecution, GenerationModule, GenerationModuleList } from "@/types/generation";

const generationModulesCache = new Map<string, { at: number; value: GenerationModuleList }>();
const generationModulesInflight = new Map<string, Promise<GenerationModuleList>>();
const GENERATION_MODULES_CACHE_MS = 30_000;

export const listGenerationModules = (category?: string) => {
  const key = category || "__all__";
  const cached = generationModulesCache.get(key);
  if (cached && Date.now() - cached.at < GENERATION_MODULES_CACHE_MS) {
    return Promise.resolve(cached.value);
  }
  const pending = generationModulesInflight.get(key);
  if (pending) return pending;
  const request = apiFetch<GenerationModuleList>(`/api/v1/generation-modules/${category ? `?category=${encodeURIComponent(category)}` : ""}`)
    .then((value) => {
      generationModulesCache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => generationModulesInflight.delete(key));
  generationModulesInflight.set(key, request);
  return request;
};
export const getGenerationModule = (id: number) => apiFetch<GenerationModule>(`/api/v1/generation-modules/${id}`);
export const executeGenerationModule = (
  id: number,
  inputs: Record<string, unknown>,
) => {
  const form = new FormData();
  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (value instanceof File) {
      form.append("file_keys", key);
      form.append("files", value, value.name);
    } else {
      serialized[key] = value;
    }
  }
  form.append("payload", JSON.stringify({ inputs: serialized }));
  return apiFetch<GenerationExecution>(`/api/v1/generation-modules/${id}/executions`, { method: "POST", body: form });
};
const generationExecutionInflight = new Map<string, Promise<GenerationExecution>>();
export const executeCreateModelWithPrivateFaceReference = (
  id: number,
  inputs: Record<string, unknown>,
  faceReferenceToken?: string,
) => apiFetch<GenerationExecution>("/api/create-model/private-execute", {
  method: "POST",
  body: JSON.stringify({
    module_id: id,
    inputs,
    ...(faceReferenceToken ? { face_reference_token: faceReferenceToken } : {}),
  }),
});

export const getGenerationExecution = (id: string) => {
  const pending = generationExecutionInflight.get(id);
  if (pending) return pending;
  const request = apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/status`)
    .finally(() => generationExecutionInflight.delete(id));
  generationExecutionInflight.set(id, request);
  return request;
};
export const cancelGenerationExecution = (id: string) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/cancel`, { method: "POST" });
export const settlePendingGenerationBilling = (id: string) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/settle-pending-billing`, { method: "POST" });
export const listGenerationExecutions = (params?: { moduleId?: number; status?: string; skip?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.moduleId) query.set("module_id", String(params.moduleId));
  if (params?.status) query.set("status", params.status);
  query.set("skip", String(params?.skip ?? 0));
  query.set("limit", String(params?.limit ?? 100));
  return apiFetch<import("@/types/generation").GenerationExecutionList>(`/api/v1/generation-modules/execution-history?${query.toString()}`);
};
export const retryGenerationExecution = (id: string) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/retry`, { method: "POST", body: JSON.stringify({}) });
const activeExecutionsInflight = new Map<string, Promise<import("@/types/generation").GenerationExecutionList>>();
export const listActiveGenerationExecutions = (moduleId?: number) => {
  const query = moduleId ? `?module_id=${moduleId}` : "";
  const key = query || "__all__";
  const pending = activeExecutionsInflight.get(key);
  if (pending) return pending;
  const request = apiFetch<import("@/types/generation").GenerationExecutionList>(`/api/v1/generation-modules/active-executions${query}`)
    .finally(() => activeExecutionsInflight.delete(key));
  activeExecutionsInflight.set(key, request);
  return request;
};

export type GenerationLoadingProgressMode = "backend" | "elapsed_estimate";

type PublicFrontendConfig = {
  public_settings?: Record<string, unknown>;
};

let loadingProgressModeCache: { at: number; value: GenerationLoadingProgressMode } | null = null;
let loadingProgressModeInflight: Promise<GenerationLoadingProgressMode> | null = null;

export async function getGenerationLoadingProgressMode(): Promise<GenerationLoadingProgressMode> {
  if (loadingProgressModeCache && Date.now() - loadingProgressModeCache.at < 60_000) {
    return loadingProgressModeCache.value;
  }
  if (loadingProgressModeInflight) return loadingProgressModeInflight;
  loadingProgressModeInflight = apiFetch<PublicFrontendConfig>("/api/v1/system/config")
    .then((config) => {
      const value: GenerationLoadingProgressMode = config.public_settings?.generation_loading_progress_mode === "backend"
        ? "backend"
        : "elapsed_estimate";
      loadingProgressModeCache = { at: Date.now(), value };
      return value;
    })
    .finally(() => { loadingProgressModeInflight = null; });
  return loadingProgressModeInflight;
}


export type GenerationExecutionRealtimeEvent = {
  id: string;
  module_id: number;
  module_key: string;
  status: GenerationExecution["status"];
  progress: number;
  cancel_requested: boolean;
  provider_status?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  queue_name?: string | null;
  queue_position?: number | null;
  heartbeat_at?: string | null;
  recovery_count?: number;
  recovered_at?: string | null;
};

export type GenerationRealtimeHandlers = {
  signal: AbortSignal;
  onExecution: (event: GenerationExecutionRealtimeEvent) => void;
  onTransport: (crossProcess: boolean) => void;
};

export async function consumeGenerationExecutionEvents({ signal, onExecution, onTransport }: GenerationRealtimeHandlers) {
  const response = await apiStream("/api/v1/generation-modules/execution-events", signal);
  if (!response.body) throw new Error("El servidor no devolvió un stream de ejecuciones.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
      if (!block || block.startsWith(":")) continue;

      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (!dataLines.length) continue;
      try {
        const payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
        if (eventName === "transport") {
          onTransport(payload.cross_process === true);
        } else if (eventName === "execution" && payload.execution && typeof payload.execution === "object") {
          onExecution(payload.execution as GenerationExecutionRealtimeEvent);
        }
      } catch {}
    }
  }
}

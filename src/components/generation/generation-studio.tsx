"use client";

import "./generation-studio.css";
import { useEffect, useMemo, useState } from "react";
import {
  cancelGenerationExecution,
  executeGenerationModule,
  getGenerationExecution,
  listGenerationExecutions,
  listGenerationModules,
} from "@/lib/generation-api";
import type {
  GenerationExecution,
  GenerationInput,
  GenerationModule,
} from "@/types/generation";
import { normalizeGenerationError } from "@/lib/generation-errors";
import {
  DynamicGenerationForm,
  initialGenerationValues,
  validateGenerationValues,
} from "@/components/generation/dynamic-generation-form";
import { GenerationResults } from "@/components/generation/generation-results";
import { useGenerationJobs } from "@/components/generation/generation-jobs-provider";

const ACTIVE = ["queued", "running"];
const EXECUTION_HISTORY_LIMIT = 20;

const STATUS_LABELS: Record<string, string> = {
  queued: "En cola",
  running: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

type StoredInputFile = {
  __generation_file__?: boolean;
  storage_file_id?: number;
  public_url?: string | null;
  preview_url?: string | null;
  download_url?: string | null;
  filename?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
};

function isStoredInputFile(value: unknown): value is StoredInputFile {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("__generation_file__" in value ||
        "storage_file_id" in value ||
        "filename" in value),
  );
}

function inputFileUrl(file: StoredInputFile): string | null {
  const url = file.preview_url ?? file.public_url ?? file.download_url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

function ExecutionInputAssets({
  execution,
  definitions,
}: {
  execution: GenerationExecution;
  definitions: GenerationInput[];
}) {
  const definitionByKey = new Map(
    definitions.map((definition) => [definition.key, definition]),
  );
  const files = Object.entries(execution.inputs)
    .filter(([, value]) => isStoredInputFile(value))
    .map(([key, value]) => ({
      key,
      file: value as StoredInputFile,
      label: definitionByKey.get(key)?.name ?? key,
      inputType: definitionByKey.get(key)?.input_type,
    }));

  if (files.length === 0) return null;

  return (
    <section className="generationExecutionAssets">
      <small>ASSETS UTILIZADOS</small>
      <div className="generationExecutionAssetsGrid">
        {files.map(({ key, file, label, inputType }) => {
          const url = inputFileUrl(file);
          const isImage =
            inputType === "image" || file.content_type?.startsWith("image/");
          return (
            <article key={key} className="generationExecutionAsset">
              {url && isImage ? (
                <img src={url} alt={label} />
              ) : (
                <div className="generationExecutionAssetFile">ARCHIVO</div>
              )}
              <div>
                <strong>{label}</strong>
                <span>
                  {file.filename ?? `Archivo #${file.storage_file_id ?? "—"}`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function executionEngineLabel(engine: GenerationExecution["engine"]) {
  if (engine === "modal") return "Modal";
  if (engine === "beam") return "Beam";
  if (engine === "local_docker") return "Local";
  if (engine === "runpod_serverless") return "RunPod Serverless";
  return "Simulado";
}

function executionStatusLabel(execution: GenerationExecution) {
  if (execution.cancel_requested && ACTIVE.includes(execution.status)) {
    return "Cancelando…";
  }
  return STATUS_LABELS[execution.status] ?? execution.status;
}

function formatDuration(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const rounded = Math.max(0, Math.round(seconds));
  if (rounded < 60) return `${rounded} s`;
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder > 0 ? `${minutes} min ${remainder} s` : `${minutes} min`;
}

function estimationSourceLabel(source?: string | null) {
  return source === "historical_average"
    ? "Promedio de ejecuciones recientes"
    : "Estimación inicial configurada";
}

function upsertExecution(
  current: GenerationExecution[],
  incoming: GenerationExecution,
): GenerationExecution[] {
  const withoutIncoming = current.filter((item) => item.id !== incoming.id);
  return [incoming, ...withoutIncoming].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function ExecutionCard({
  execution,
  definitions,
  cancelling,
  onCancel,
}: {
  execution: GenerationExecution;
  definitions: GenerationInput[];
  cancelling: boolean;
  onCancel: (execution: GenerationExecution) => Promise<void>;
}) {
  return (
    <article className="generationExecutionCard">
      <header className="generationExecutionCardHeader">
        <div>
          <small>{new Date(execution.created_at).toLocaleString()}</small>
          <strong>{executionStatusLabel(execution)}</strong>
        </div>
        <span>{execution.progress}%</span>
      </header>

      <div className="generationProgress">
        <i style={{ width: `${execution.progress}%` }} />
      </div>

      <div className="generationQueueMeta">
        <div>
          <span>Proveedor</span>
          <strong>{executionEngineLabel(execution.engine)}</strong>
        </div>
        <div>
          <span>Ejecución</span>
          <strong>{execution.id}</strong>
        </div>
        {execution.provider_job_id && (
          <div>
            <span>Job remoto</span>
            <strong>{execution.provider_job_id}</strong>
          </div>
        )}
      </div>

      <ExecutionInputAssets execution={execution} definitions={definitions} />

      <div className="generationLogs">
        {execution.logs.slice(-6).map((log, index) => (
          <p key={`${log.timestamp}-${index}`}>
            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            {log.message}
          </p>
        ))}
      </div>

      {ACTIVE.includes(execution.status) && (
        <button
          disabled={cancelling || execution.cancel_requested}
          onClick={() => void onCancel(execution)}
        >
          {cancelling || execution.cancel_requested ? "Cancelando…" : "Cancelar"}
        </button>
      )}

      {execution.status === "completed" && (
        <GenerationResults outputs={execution.outputs} />
      )}

      {!ACTIVE.includes(execution.status) && (
        <section className="generationFinalCost" aria-label="Resultado de tiempo y tokens">
          <small>RESULTADO DE LA EJECUCIÓN</small>
          <div>
            <span>Tiempo real</span>
            <strong>{formatDuration(
              execution.billing_breakdown?.real_provider_seconds ??
                (execution.real_provider_duration_ms != null
                  ? execution.real_provider_duration_ms / 1000
                  : execution.duration_ms != null
                    ? execution.duration_ms / 1000
                    : null),
            )}</strong>
          </div>
          <div>
            <span>Tokens finales</span>
            <strong>{execution.billing_breakdown?.final_tokens ?? execution.tokens_charged} ✦</strong>
          </div>
          {execution.billing_breakdown?.estimated_tokens_before_execution != null && (
            <p>
              Estimación inicial: {execution.billing_breakdown.estimated_tokens_before_execution} tokens.
              {Number(execution.billing_breakdown.tokens_refunded || 0) > 0
                ? ` Se devolvieron ${execution.billing_breakdown.tokens_refunded} tokens.`
                : Number(execution.billing_breakdown.extra_tokens_debited || 0) > 0
                  ? ` Se ajustaron ${execution.billing_breakdown.extra_tokens_debited} tokens adicionales.`
                  : " No fue necesario ajustar el cobro."}
            </p>
          )}
        </section>
      )}

      {execution.error && <div className="generationError">{execution.error}</div>}
    </article>
  );
}

export function GenerationStudio() {
  const { track } = useGenerationJobs();
  const [modules, setModules] = useState<GenerationModule[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [executions, setExecutions] = useState<GenerationExecution[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollFailures, setPollFailures] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    listGenerationModules()
      .then((response) => {
        setModules(response.items);
        setSelectedId(response.items[0]?.id ?? null);
      })
      .catch((cause) => setError(normalizeGenerationError(cause)))
      .finally(() => setBusy(false));
  }, []);

  const selected = useMemo(
    () => modules.find((module) => module.id === selectedId) ?? null,
    [modules, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setValues(initialGenerationValues(selected.inputs));
    setExecutions([]);
    setRestoring(true);
    listGenerationExecutions({ moduleId: selected.id, limit: EXECUTION_HISTORY_LIMIT })
      .then((response) => setExecutions(response.items))
      .catch((cause) => setError(normalizeGenerationError(cause)))
      .finally(() => setRestoring(false));
  }, [selected]);

  const activeExecutionIds = useMemo(
    () => executions.filter((item) => ACTIVE.includes(item.status)).map((item) => item.id),
    [executions],
  );
  const activeExecutionKey = activeExecutionIds.join("|");

  useEffect(() => {
    const ids = activeExecutionKey ? activeExecutionKey.split("|") : [];
    if (ids.length === 0) return;

    const refresh = () => {
      Promise.allSettled(ids.map((id) => getGenerationExecution(id))).then(
        (results) => {
          let hadFailure = false;
          results.forEach((result) => {
            if (result.status === "fulfilled") {
              setExecutions((current) => upsertExecution(current, result.value));
              track(result.value);
            } else {
              hadFailure = true;
            }
          });
          setPollFailures((value) => (hadFailure ? value + 1 : 0));
        },
      );
    };

    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, [activeExecutionKey, track]);

  async function run() {
    if (!selected) return;
    const validationError = validateGenerationValues(selected.inputs, values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const normalized = { ...values };
      for (const input of selected.inputs.filter(
        (item) => item.input_type === "json",
      )) {
        if (typeof normalized[input.key] === "string") {
          normalized[input.key] = JSON.parse(normalized[input.key] as string);
        }
      }
      // The Backend is the only source of truth for the execution engine.
      // AppWeb sends only the inputs and displays the engine returned in the job.
      const job = await executeGenerationModule(selected.id, normalized);
      setExecutions((current) => upsertExecution(current, job));
      track(job);
      setValues(initialGenerationValues(selected.inputs));
    } catch (cause) {
      setError(normalizeGenerationError(cause));
    } finally {
      setBusy(false);
    }
  }

  if (busy && !modules.length) {
    return <div className="generationEmpty">Cargando módulos de generación…</div>;
  }

  return (
    <div className="generationStudio">
      <section className="generationHero">
        <span>MÓDULOS DINÁMICOS</span>
        <h1>Genera desde la configuración real del BackOffice.</h1>
        <p>
          Las ejecuciones se conservan aunque recargues, cierres el navegador o
          vuelvas a iniciar sesión.
        </p>
      </section>

      {error && (
        <div className="generationError" role="alert">
          {error}
        </div>
      )}

      {pollFailures >= 3 && (
        <div className="generationError" role="status">
          La conexión está inestable. Seguiremos intentando automáticamente.
        </div>
      )}

      <div className="generationLayout">
        <aside className="generationModules">
          <small>MÓDULO</small>
          {modules.map((module) => (
            <button
              key={module.id}
              className={module.id === selectedId ? "active" : ""}
              onClick={() => setSelectedId(module.id)}
            >
              <strong>{module.name}</strong>
              <span>
                {module.category} · v{module.version}
              </span>
            </button>
          ))}
        </aside>

        <main className="generationPanel">
          {selected && (
            <>
              <div className="generationTitle">
                <div>
                  <small>{selected.key}</small>
                  <h2>{selected.name}</h2>
                  <p>{selected.description || "Sin descripción."}</p>
                </div>
                <div>
                  <span className="generationBadge">
                    {selected.default_execution_engine.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <DynamicGenerationForm
                inputs={selected.inputs}
                values={values}
                onChange={setValues}
                disabled={busy || restoring}
              />

              {selected.pricing?.is_active && (
                <section className="generationEstimate" aria-label="Estimación de la ejecución">
                  <div>
                    <span>Tiempo estimado</span>
                    <strong>{formatDuration(selected.pricing.estimated_duration_seconds)}</strong>
                    <small>{estimationSourceLabel(selected.pricing.estimated_duration_source)}</small>
                  </div>
                  <div>
                    <span>Tokens estimados</span>
                    <strong>{selected.pricing.required_tokens} ✦</strong>
                    <small>El cobro final se ajusta al tiempo real.</small>
                  </div>
                  <div>
                    <span>Infraestructura</span>
                    <strong>{selected.pricing.provider ? executionEngineLabel(selected.pricing.provider as GenerationExecution["engine"]) : executionEngineLabel(selected.default_execution_engine)}</strong>
                    <small>{selected.pricing.gpu_key || "GPU definida por el proveedor"}</small>
                  </div>
                </section>
              )}

              <button
                className="primaryButton generationRun"
                disabled={busy || restoring || !selected.pricing?.is_active}
                onClick={run}
              >
                {restoring
                  ? "Recuperando ejecución…"
                  : selected.pricing?.is_active
                    ? `${activeExecutionIds.length > 0 ? "Agregar otro a la cola" : "Ejecutar"} por ${selected.pricing.required_tokens} tokens ✦`
                    : "Precio no configurado"}
              </button>
            </>
          )}
        </main>

        <aside className="generationExecution generationExecutionStack">
          <div className="generationExecutionStackTitle">
            <small>EJECUCIONES</small>
            <span>{executions.length}</span>
          </div>
          {restoring ? (
            <p>Recuperando ejecuciones recientes…</p>
          ) : executions.length > 0 ? (
            <div className="generationExecutionCards">
              {executions.map((item) => (
                <ExecutionCard
                  key={item.id}
                  execution={item}
                  definitions={selected?.inputs ?? []}
                  cancelling={cancellingIds.has(item.id)}
                  onCancel={async (target) => {
                    setCancellingIds((current) => new Set(current).add(target.id));
                    setError(null);
                    try {
                      const updated = await cancelGenerationExecution(target.id);
                      setExecutions((current) => upsertExecution(current, updated));
                      track(updated);
                    } catch (cause) {
                      setError(normalizeGenerationError(cause));
                      try {
                        const latest = await getGenerationExecution(target.id);
                        setExecutions((current) => upsertExecution(current, latest));
                        track(latest);
                      } catch {
                        // Keep the last known execution when status refresh also fails.
                      }
                    } finally {
                      setCancellingIds((current) => {
                        const next = new Set(current);
                        next.delete(target.id);
                        return next;
                      });
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <p>No hay ejecuciones previas para este módulo.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

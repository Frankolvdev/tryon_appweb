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
  if (engine === "local_docker") return "Local";
  if (engine === "runpod_serverless") return "RunPod Serverless";
  return "Simulado";
}

function executionStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function GenerationStudio() {
  const { track } = useGenerationJobs();
  const [modules, setModules] = useState<GenerationModule[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [execution, setExecution] = useState<GenerationExecution | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollFailures, setPollFailures] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
    setRestoring(true);
    listGenerationExecutions({ moduleId: selected.id, limit: 1 })
      .then((response) => setExecution(response.items[0] ?? null))
      .catch((cause) => setError(normalizeGenerationError(cause)))
      .finally(() => setRestoring(false));
  }, [selected]);

  useEffect(() => {
    if (!execution || !ACTIVE.includes(execution.status)) return;
    track(execution);
    const timer = window.setInterval(() => {
      getGenerationExecution(execution.id)
        .then((item) => {
          setExecution(item);
          track(item);
          setPollFailures(0);
        })
        .catch(() => setPollFailures((value) => value + 1));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [execution?.id, execution?.status, track]);

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
      setExecution(job);
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

              <button
                className="primaryButton generationRun"
                disabled={busy || restoring || !selected.pricing?.is_active}
                onClick={run}
              >
                {restoring
                  ? "Recuperando ejecución…"
                  : selected.pricing?.is_active
                    ? `${execution && ACTIVE.includes(execution.status) ? "Agregar otro a la cola" : "Ejecutar"} por ${selected.pricing.required_tokens} tokens ✦`
                    : "Precio no configurado"}
              </button>
            </>
          )}
        </main>

        <aside className="generationExecution">
          <small>EJECUCIÓN</small>
          {restoring ? (
            <p>Recuperando el estado más reciente…</p>
          ) : execution ? (
            <>
              <div className="generationStatus">
                <strong>{executionStatusLabel(execution.status)}</strong>
                <span>{execution.progress}%</span>
              </div>
              <div className="generationProgress">
                <i style={{ width: `${execution.progress}%` }} />
              </div>
              <div className="generationQueueMeta">
                <div>
                  <span>Proveedor</span>
                  <strong>{executionEngineLabel(execution.engine)}</strong>
                </div>
                {execution.provider_job_id && (
                  <div>
                    <span>Job remoto</span>
                    <strong>{execution.provider_job_id}</strong>
                  </div>
                )}
              </div>
              <ExecutionInputAssets
                execution={execution}
                definitions={selected?.inputs ?? []}
              />
              <div className="generationLogs">
                {execution.logs.slice(-8).map((log, index) => (
                  <p key={`${log.timestamp}-${index}`}>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    {log.message}
                  </p>
                ))}
              </div>
              {ACTIVE.includes(execution.status) && (
                <button
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    setError(null);
                    try {
                      const item = await cancelGenerationExecution(execution.id);
                      setExecution(item);
                      track(item);
                    } catch (cause) {
                      setError(normalizeGenerationError(cause));
                      try {
                        const latest = await getGenerationExecution(execution.id);
                        setExecution(latest);
                        track(latest);
                      } catch {
                        // Keep the last known execution when status refresh also fails.
                      }
                    } finally {
                      setCancelling(false);
                    }
                  }}
                >
                  {cancelling ? "Cancelando en Modal…" : "Cancelar"}
                </button>
              )}
              {execution.status === "completed" && (
                <GenerationResults outputs={execution.outputs} />
              )}
              {execution.error && (
                <div className="generationError">{execution.error}</div>
              )}
            </>
          ) : (
            <p>No hay ejecuciones previas para este módulo.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

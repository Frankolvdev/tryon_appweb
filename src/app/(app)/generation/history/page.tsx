"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelGenerationExecution,
  listGenerationExecutions,
  retryGenerationExecution,
} from "@/lib/generation-api";
import type { GenerationExecution } from "@/types/generation";
import { GenerationResults } from "@/components/generation/generation-results";

const terminal = new Set(["completed", "failed", "cancelled"]);
const active = new Set(["queued", "running"]);

function providerLabel(engine: GenerationExecution["engine"]) {
  if (engine === "modal") return "Modal";
  if (engine === "beam") return "Beam";
  if (engine === "local_docker") return "Docker Local";
  if (engine === "owner_local") return "Owner Local";
  if (engine === "runpod_serverless") return "RunPod Serverless";
  return "Simulado";
}

function queueLabel(item: GenerationExecution) {
  if (item.queue_position) return `${item.queue_name ?? "Cola"} · posición ${item.queue_position}`;
  if (item.provider_status === "IN_QUEUE") return "En cola de RunPod";
  if (item.status === "queued" && (item.engine === "local_docker" || item.engine === "owner_local")) return "Esperando GPU local";
  return item.queue_name ?? item.provider_status ?? "—";
}

export default function GenerationHistoryPage() {
  const [items, setItems] = useState<GenerationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listGenerationExecutions({ status: status || undefined, limit: 100 });
      setItems(result.items ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!items.some((item) => active.has(item.status))) return;
    const timer = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(timer);
  }, [items, load]);

  async function retry(id: string) {
    await retryGenerationExecution(id);
    await load();
  }

  async function cancel(id: string) {
    setCancellingIds((current) => new Set(current).add(id));
    setError("");
    try {
      await cancelGenerationExecution(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible solicitar la cancelación.");
    } finally {
      setCancellingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-red-400">Generaciones</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Historial unificado de trabajos</h1>
          <p className="mt-2 text-sm text-zinc-500">Docker Local, Owner Local, RunPod Serverless, Modal, Beam y Simulado comparten el mismo historial, control y recuperación.</p>
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white">
            <option value="">Todos</option>
            <option value="queued">En cola</option>
            <option value="running">Ejecutando</option>
            <option value="completed">Completados</option>
            <option value="failed">Fallidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white">Actualizar</button>
        </div>
      </div>

      {error && <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}

      <section className="mt-7 space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-white/10 p-10 text-center text-zinc-500">Cargando historial…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 p-10 text-center text-zinc-500">Todavía no hay trabajos.</div>
        ) : items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-white">{item.module_key}</h2>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase text-zinc-400">
                    {item.cancel_requested && active.has(item.status) ? "cancelando" : item.status}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-500">{providerLabel(item.engine)}</span>
                </div>
                <p className="mt-2 font-mono text-xs text-zinc-600">{item.id}</p>
                <p className="mt-1 text-xs text-zinc-600">{new Date(item.created_at).toLocaleString()}{item.duration_ms != null ? ` · ${Math.round(item.duration_ms / 1000)} s` : ""}</p>
                <p className="mt-1 text-xs text-zinc-500">Cola: {queueLabel(item)}</p>
                {item.provider_job_id && <p className="mt-1 font-mono text-xs text-zinc-600">Remoto: {item.provider_job_id}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {active.has(item.status) && (
                  <button
                    disabled={cancellingIds.has(item.id) || item.cancel_requested}
                    onClick={() => void cancel(item.id)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancellingIds.has(item.id) || item.cancel_requested ? "Cancelando…" : "Cancelar"}
                  </button>
                )}
                {terminal.has(item.status) && <button onClick={() => void retry(item.id)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">Reintentar</button>}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-red-600" style={{ width: `${item.progress}%` }} /></div>
            {item.tokens_charged > 0 && <p className="mt-4 text-xs text-zinc-500">{item.tokens_refunded ? `${item.tokens_charged} tokens reembolsados` : `${item.tokens_charged} tokens cobrados`}</p>}
            {(item.logs?.length ?? 0) > 0 && <p className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-zinc-400">Último evento: {item.logs[item.logs.length - 1]?.message}</p>}
            {item.error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{item.error}</p>}
            {Object.keys(item.outputs || {}).length > 0 && <div className="mt-4"><GenerationResults outputs={item.outputs} /></div>}
          </article>
        ))}
      </section>
    </main>
  );
}

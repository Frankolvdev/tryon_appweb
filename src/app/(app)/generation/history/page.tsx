"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelGenerationExecution, listGenerationExecutions, retryGenerationExecution } from "@/lib/generation-api";
import type { GenerationExecution } from "@/types/generation";

const terminal = new Set(["completed", "failed", "cancelled"]);

export default function GenerationHistoryPage() {
  const [items, setItems] = useState<GenerationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listGenerationExecutions({ status: status || undefined, limit: 100 });
      setItems(result.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!items.some((item) => !terminal.has(item.status))) return;
    const timer = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(timer);
  }, [items, load]);

  const retry = async (id: string) => { await retryGenerationExecution(id); await load(); };
  const cancel = async (id: string) => { await cancelGenerationExecution(id); await load(); };

  return <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.28em] text-red-400">Generaciones</p><h1 className="mt-2 text-3xl font-semibold text-white">Historial de trabajos</h1><p className="mt-2 text-sm text-zinc-500">Consulta progreso, resultados, errores y reintenta ejecuciones anteriores.</p></div>
      <div className="flex gap-2"><select value={status} onChange={(event)=>setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"><option value="">Todos</option><option value="queued">En cola</option><option value="running">Ejecutando</option><option value="completed">Completados</option><option value="failed">Fallidos</option><option value="cancelled">Cancelados</option></select><button onClick={()=>void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white">Actualizar</button></div>
    </div>
    {error && <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}
    <section className="mt-7 space-y-3">
      {loading ? <div className="rounded-3xl border border-white/10 p-10 text-center text-zinc-500">Cargando historial…</div> : items.length === 0 ? <div className="rounded-3xl border border-white/10 p-10 text-center text-zinc-500">Todavía no hay trabajos.</div> : items.map((item)=><article key={item.id} className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{item.module_key}</h2><span className="rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase text-zinc-400">{item.status}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-500">{item.engine}</span></div><p className="mt-2 font-mono text-xs text-zinc-600">{item.id}</p><p className="mt-1 text-xs text-zinc-600">{new Date(item.created_at).toLocaleString()}{item.duration_ms!=null?` · ${Math.round(item.duration_ms/1000)} s`:""}</p></div><div className="flex flex-wrap gap-2">{!terminal.has(item.status)&&<button onClick={()=>void cancel(item.id)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300">Cancelar</button>}{terminal.has(item.status)&&<button onClick={()=>void retry(item.id)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">Reintentar</button>}</div></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-red-600" style={{width:`${item.progress}%`}}/></div>
        {item.logs?.length>0&&<p className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-zinc-400">Último evento: {item.logs[item.logs.length-1]?.message}</p>}{item.error&&<p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{item.error}</p>}
        {Object.keys(item.outputs||{}).length>0&&<pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-zinc-400">{JSON.stringify(item.outputs,null,2)}</pre>}
      </article>)}
    </section>
  </main>;
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTryOnJob, listTryOnJobs } from "@/lib/tryon-api";
import type { TryOnJob } from "@/types/tryon";

const date = (value?: string) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";
const output = (job: TryOnJob) => job.result_url || job.output_url;
const active = (job: TryOnJob) => ["queued", "processing", "pending"].includes(job.status.toLowerCase());

export function HistoryList() {
  const [jobs, setJobs] = useState<TryOnJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TryOnJob | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try { setJobs(await listTryOnJobs()); setError(null); }
    catch (value) { setError(value instanceof Error ? value.message : "No fue posible cargar el historial."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(true); }, [load]);
  const hasActiveJobs = useMemo(() => jobs.some(active), [jobs]);

  useEffect(() => {
    if (!hasActiveJobs) return;
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs, load]);

  async function openJob(job: TryOnJob) {
    setSelected(job);
    try { setSelected(await getTryOnJob(job.id)); } catch { /* keep list version */ }
  }

  if (loading) return <div className="historyState"><span className="spinner"/><p>Cargando tus creaciones…</p></div>;
  if (error && !jobs.length) return <div className="historyState"><strong>No pudimos cargar el historial</strong><p>{error}</p><button className="primaryButton emptyAction" onClick={() => void load()}>Reintentar</button></div>;
  if (!jobs.length) return <div className="historyState"><span className="moduleGlyph">✦</span><h2>Tu estudio está listo</h2><p>Aún no tienes generaciones. Crea tu primer Try-On con imágenes reales.</p><Link className="primaryButton emptyAction" href="/try-on">Crear ahora</Link></div>;

  return <>
    <div className="historyToolbar"><span>{jobs.length} trabajos {hasActiveJobs && "· actualización automática activa"}</span><button className="ghostButton" disabled={refreshing} onClick={() => void load()}>{refreshing ? "Actualizando…" : "Actualizar"}</button></div>
    <div className="historyGrid">{jobs.map((job) => <button className="jobCard" key={job.id} onClick={() => void openJob(job)}>
      <div className="jobVisual">{output(job) ? <img src={output(job)!} alt={`Resultado ${job.id}`}/> : <span className={active(job) ? "jobPulse" : ""}>✦</span>}</div>
      <div className="jobBody"><div><span className={`jobStatus status-${job.status.toLowerCase()}`}>{job.status}</span><small>#{job.id}</small></div><strong>{job.item_type}</strong><p>{date(job.created_at)}</p><p>{job.tokens_cost} tokens · {job.quality_mode}</p>{job.error_message && <p className="jobError">{job.error_message}</p>}</div>
    </button>)}</div>
    {selected && <div className="jobModal" role="dialog" aria-modal="true" onClick={() => setSelected(null)}><article onClick={(event) => event.stopPropagation()}><button className="jobModalClose" onClick={() => setSelected(null)}>×</button><span className={`jobStatus status-${selected.status.toLowerCase()}`}>{selected.status}</span><h2>Trabajo #{selected.id}</h2>{output(selected) && <img src={output(selected)!} alt={`Resultado ${selected.id}`}/>}<div className="jobDetails"><span><small>Artículo</small><b>{selected.item_type}</b></span><span><small>Calidad</small><b>{selected.quality_mode}</b></span><span><small>Tokens</small><b>{selected.tokens_cost}</b></span><span><small>Creado</small><b>{date(selected.created_at)}</b></span>{selected.completed_at && <span><small>Completado</small><b>{date(selected.completed_at)}</b></span>}{selected.comfy_workflow_name && <span><small>Workflow</small><b>{selected.comfy_workflow_name}</b></span>}</div>{selected.prompt && <p className="jobPrompt">“{selected.prompt}”</p>}{selected.error_message && <p className="jobError">{selected.error_message}</p>}</article></div>}
  </>;
}

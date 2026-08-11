"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listTryOnJobs } from "@/lib/tryon-api";
import type { TryOnJob } from "@/types/tryon";

const date = (value?: string) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";
const output = (job: TryOnJob) => job.result_url || job.output_url;

export function HistoryList() {
  const [jobs, setJobs] = useState<TryOnJob[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { listTryOnJobs().then(setJobs).catch((e) => setError(e instanceof Error ? e.message : "No fue posible cargar el historial.")).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="historyState"><span className="spinner"/><p>Cargando tus creaciones…</p></div>;
  if (error) return <div className="historyState"><strong>No pudimos cargar el historial</strong><p>{error}</p></div>;
  if (!jobs.length) return <div className="historyState"><span className="moduleGlyph">✦</span><h2>Tu estudio está listo</h2><p>Aún no tienes generaciones. Crea tu primer Try-On con imágenes reales.</p><Link className="primaryButton emptyAction" href="/try-on">Crear ahora</Link></div>;
  return <div className="historyGrid">{jobs.map((job) => <article className="jobCard" key={job.id ?? job.job_id}>
    <div className="jobVisual">{output(job) ? <img src={output(job)!} alt={`Resultado ${job.id}`}/> : <span>✦</span>}</div>
    <div className="jobBody"><div><span className={`jobStatus status-${(job.status || "unknown").toLowerCase()}`}>{job.status || "Procesando"}</span><small>#{job.id}</small></div><strong>{job.item_type || "Try-On"}</strong><p>{date(job.created_at)}</p>{job.error_message && <p className="jobError">{job.error_message}</p>}</div>
  </article>)}</div>;
}

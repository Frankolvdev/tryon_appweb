"use client";
import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";
import { useGenerationJobs } from "./generation-jobs-provider";

function labelFor(count: number) {
  return `${count} ejecución${count === 1 ? "" : "es"} activa${count === 1 ? "" : "s"}`;
}

export function ActiveGenerationJobs() {
  const { jobs, navigationFor } = useGenerationJobs();
  if (!jobs.length) return null;

  // Preserve the compact historical pill. With one active execution it now
  // follows that execution's own navigation policy instead of a hardcoded page.
  if (jobs.length === 1) {
    const job = jobs[0];
    const navigation = navigationFor(job);
    const content = (
      <>
        <Activity size={16}/>
        <span>{labelFor(1)}</span>
        {navigation.clickable && navigation.href ? <ChevronRight size={15}/> : null}
      </>
    );
    if (!navigation.clickable || !navigation.href) {
      return <div className="activeJobsPill" title="La generación continúa en esta misma vista">{content}</div>;
    }
    return <Link href={navigation.href} className="activeJobsPill" title="Volver a esta generación">{content}</Link>;
  }

  // Several active jobs cannot safely share one destination. Keep the alert
  // informative and non-clickable instead of routing to an unrelated module.
  return <div className="activeJobsPill" title="Hay varias ejecuciones activas"><Activity size={16}/><span>{labelFor(jobs.length)}</span></div>;
}

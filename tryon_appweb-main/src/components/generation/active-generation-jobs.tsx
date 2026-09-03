"use client";

import { Activity, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import type { GenerationExecution } from "@/types/generation";
import { useGenerationJobs } from "./generation-jobs-provider";

type ModuleGroup = {
  moduleId: number;
  moduleKey: string;
  count: number;
  href: string | null;
  label: string;
  clickable: boolean;
};

export function ActiveGenerationJobs() {
  const { jobs, navigationFor } = useGenerationJobs();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayJobs, setDisplayJobs] = useState<GenerationExecution[]>(jobs);
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (jobs.length) {
      setLeaving(false);
      setDisplayJobs(jobs);
      return;
    }
    if (!displayJobs.length) return;
    setOpen(false);
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setDisplayJobs([]);
      setLeaving(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [jobs, displayJobs.length]);

  const groups = useMemo<ModuleGroup[]>(() => {
    const map = new Map<number, ModuleGroup>();
    for (const job of displayJobs) {
      const navigation = navigationFor(job);
      const current = map.get(job.module_id);
      if (current) { current.count += 1; continue; }
      map.set(job.module_id, {
        moduleId: job.module_id,
        moduleKey: job.module_key,
        count: 1,
        href: navigation.href,
        label: navigation.label || job.module_key.replaceAll("_", " "),
        clickable: navigation.clickable,
      });
    }
    return [...map.values()];
  }, [displayJobs, navigationFor]);

  if (!mounted || !displayJobs.length) return null;

  function openModule(group: ModuleGroup) {
    if (!group.clickable || !group.href) return;
    const targetPath = group.href.split("?")[0];
    if (pathname === targetPath || pathname.startsWith(`${targetPath}/`)) {
      setOpen(false);
      return;
    }
    setOpen(false);
    router.push(group.href);
  }

  return createPortal(
    <div className={`generationOrbDock${open ? " isOpen" : ""}${leaving ? " isLeaving" : ""}`}>
      {open ? (
        <>
          <button type="button" className="generationOrbBackdrop" aria-label="Cerrar ejecuciones activas" onClick={() => setOpen(false)} />
          <div className="generationOrbDisc" role="dialog" aria-label="Ejecuciones activas">
            <div className="generationOrbDiscCenter">
              <strong>{displayJobs.length}</strong><span>activas</span>
            </div>
            {groups.map((group,index)=>{
              const count=groups.length;
              const angle=count===1?-90:-90+(360/count)*index;
              const radius=count<=4?112:126;
              const x=Math.cos((angle*Math.PI)/180)*radius;
              const y=Math.sin((angle*Math.PI)/180)*radius;
              const targetPath=group.href?.split("?")[0]??"";
              const alreadyHere=Boolean(targetPath&&(pathname===targetPath||pathname.startsWith(`${targetPath}/`)));
              return (
                <button
                  key={group.moduleId}
                  type="button"
                  className={`generationOrbModule${alreadyHere ? " isCurrent" : ""}`}
                  style={{transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,animationDelay:`${index*45}ms`}}
                  onClick={()=>openModule(group)}
                  disabled={!group.clickable||!group.href}
                  title={alreadyHere?"Ya estás en esta vista":group.label}
                >
                  <span className="generationOrbSlice"><b>{group.count}</b><small>{group.label}</small></span>
                </button>
              );
            })}
            <button type="button" className="generationOrbClose" onClick={()=>setOpen(false)} aria-label="Cerrar"><X size={15}/></button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="generationOrbTrigger"
          onClick={()=>!leaving&&setOpen(true)}
          aria-expanded={false}
          aria-label={`${displayJobs.length} ejecuciones activas`}
        >
          <span className="generationOrbPulse"/><Activity size={20}/><strong>{displayJobs.length}</strong>
        </button>
      )}
    </div>,
    document.body,
  );
}

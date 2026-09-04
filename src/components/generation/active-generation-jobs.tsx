"use client";

import { Activity, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useGenerationJobs } from "./generation-jobs-provider";
import { generationExecutionStatusLabel, isGenerationCancellationPending } from "@/lib/generation-execution-contract";

type ModuleGroup = {
  moduleId: number;
  moduleKey: string;
  count: number;
  href: string | null;
  label: string;
  clickable: boolean;
  cancellingCount: number;
  statusLabel: string;
};

export function ActiveGenerationJobs() {
  const { jobs, navigationFor } = useGenerationJobs();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const groups = useMemo<ModuleGroup[]>(() => {
    const map = new Map<number, ModuleGroup>();

    for (const job of jobs) {
      const navigation = navigationFor(job);
      const current = map.get(job.module_id);
      if (current) {
        current.count += 1;
        if (!current.href && navigation.href) current.href = navigation.href;
        if (isGenerationCancellationPending(job)) current.cancellingCount += 1;
        current.statusLabel = current.cancellingCount === current.count
          ? "Cancelando…"
          : current.cancellingCount > 0
            ? `${current.cancellingCount} cancelando`
            : generationExecutionStatusLabel(job);
        continue;
      }

      const cancelling = isGenerationCancellationPending(job);
      map.set(job.module_id, {
        moduleId: job.module_id,
        moduleKey: job.module_key,
        count: 1,
        href: navigation.href,
        label: navigation.label || job.module_key.replaceAll("_", " "),
        clickable: navigation.clickable,
        cancellingCount: cancelling ? 1 : 0,
        statusLabel: cancelling ? "Cancelando…" : generationExecutionStatusLabel(job),
      });
    }

    return [...map.values()];
  }, [jobs, navigationFor]);

  if (!jobs.length) return null;

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

  return (
    <div className={`generationOrbDock${open ? " isOpen" : ""}`}>
      {open && (
        <>
          <button
            type="button"
            className="generationOrbBackdrop"
            aria-label="Cerrar ejecuciones activas"
            onClick={() => setOpen(false)}
          />
          <div className="generationOrbDisc" role="dialog" aria-label="Ejecuciones activas">
            <div className="generationOrbDiscCenter">
              <strong>{jobs.length}</strong>
              <span>activas</span>
            </div>

            {groups.map((group, index) => {
              const count = groups.length;
              const angle = count === 1 ? -90 : -90 + (360 / count) * index;
              const radius = count <= 4 ? 118 : 132;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const targetPath = group.href?.split("?")[0] ?? "";
              const alreadyHere = Boolean(
                targetPath && (pathname === targetPath || pathname.startsWith(`${targetPath}/`)),
              );
              const enabled = group.clickable && Boolean(group.href) && !alreadyHere;

              return (
                <button
                  key={group.moduleId}
                  type="button"
                  className={`generationOrbModule${enabled ? "" : " isCurrent"}`}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animationDelay: `${index * 45}ms`,
                  }}
                  onClick={() => openModule(group)}
                  disabled={!group.clickable || !group.href}
                  title={alreadyHere ? "Ya estás en esta vista" : group.label}
                >
                  <span className="generationOrbSlice">
                    <b>{group.count}</b>
                    <small>{group.label} · {group.statusLabel}</small>
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              className="generationOrbClose"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X size={15}/>
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        className="generationOrbTrigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${jobs.length} ejecuciones activas`}
      >
        <span className="generationOrbPulse"/>
        <Activity size={20}/>
        <strong>{jobs.length}</strong>
      </button>
    </div>
  );
}

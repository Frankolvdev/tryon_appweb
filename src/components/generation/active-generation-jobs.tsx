"use client";

import { Activity, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useGenerationJobs } from "./generation-jobs-provider";
import { generationExecutionStatusLabel, isGenerationCancellationPending } from "@/lib/generation-execution-contract";

type ExecutionItem = {
  executionId: string;
  moduleId: number;
  moduleKey: string;
  href: string | null;
  label: string;
  clickable: boolean;
  statusLabel: string;
};

export function ActiveGenerationJobs() {
  const { jobs, navigationFor } = useGenerationJobs();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = useMemo<ExecutionItem[]>(() =>
    jobs.map((job) => {
      const navigation = navigationFor(job);
      return {
        executionId: job.id,
        moduleId: job.module_id,
        moduleKey: job.module_key,
        href: navigation.href,
        label: navigation.label || job.module_key.replaceAll("_", " "),
        clickable: navigation.clickable,
        statusLabel: isGenerationCancellationPending(job)
          ? "Cancelando…"
          : generationExecutionStatusLabel(job),
      };
    }),
  [jobs, navigationFor]);

  if (!jobs.length) return null;

  function openExecution(item: ExecutionItem) {
    if (!item.clickable || !item.href) return;

    // If the user is already inside the target view, clicking the module
    // intentionally does nothing except close the disc.
    const targetPath = item.href.split("?")[0];
    if (pathname === targetPath || pathname.startsWith(`${targetPath}/`)) {
      setOpen(false);
      return;
    }

    setOpen(false);
    router.push(item.href);
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

            {items.map((item, index) => {
              const count = items.length;
              const angle = count === 1
                ? -90
                : -90 + (360 / count) * index;
              const radius = count <= 4 ? 118 : 132;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const targetPath = item.href?.split("?")[0] ?? "";
              const alreadyHere = Boolean(
                targetPath && (pathname === targetPath || pathname.startsWith(`${targetPath}/`)),
              );
              const enabled = item.clickable && Boolean(item.href) && !alreadyHere;

              return (
                <button
                  key={item.executionId}
                  type="button"
                  className={`generationOrbModule${enabled ? "" : " isCurrent"}`}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animationDelay: `${index * 45}ms`,
                  }}
                  onClick={() => openExecution(item)}
                  disabled={!item.clickable || !item.href}
                  title={alreadyHere ? "Ya estás en esta vista" : item.label}
                >
                  <span className="generationOrbSlice">
                    <b>1</b>
                    <small>{item.label} · {item.statusLabel}</small>
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

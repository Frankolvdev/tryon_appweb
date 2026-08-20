"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getGenerationExecution, listActiveGenerationExecutions } from "@/lib/generation-api";
import type { GenerationExecution } from "@/types/generation";

export type GenerationJobNavigation = {
  clickable?: boolean;
  href?: string | null;
};

type JobsContextValue = {
  jobs: GenerationExecution[];
  refresh: () => Promise<void>;
  track: (job: GenerationExecution, navigation?: GenerationJobNavigation) => void;
  getForModule: (moduleId: number) => GenerationExecution | null;
  navigationFor: (job: GenerationExecution) => Required<GenerationJobNavigation>;
};

const JobsContext = createContext<JobsContextValue | null>(null);
const ACTIVE = new Set(["queued", "running"]);
const POLL_INTERVAL_MS = 2000;

function defaultNavigation(job: GenerationExecution): Required<GenerationJobNavigation> {
  // Managed Create Model IA intentionally stays on the model builder while it
  // generates. Automatic modules return to their own generated tab.
  if (job.module_key === "create_model_woman") {
    return { clickable: false, href: null };
  }
  return { clickable: true, href: `/try-on/${job.module_id}` };
}

export function GenerationJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<GenerationExecution[]>([]);
  const [navigation, setNavigation] = useState<Record<string, GenerationJobNavigation>>({});
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await listActiveGenerationExecutions();
      if (mounted.current) setJobs(result.items);
    } catch {}
  }, []);

  const track = useCallback((job: GenerationExecution, options?: GenerationJobNavigation) => {
    setJobs((previous) => [job, ...previous.filter((item) => item.id !== job.id)].filter((item) => ACTIVE.has(item.status)));
    if (options) {
      setNavigation((previous) => ({ ...previous, [job.id]: options }));
    }
  }, []);

  const navigationFor = useCallback((job: GenerationExecution): Required<GenerationJobNavigation> => {
    const fallback = defaultNavigation(job);
    const explicit = navigation[job.id];
    return {
      clickable: explicit?.clickable ?? fallback.clickable,
      href: explicit?.href === undefined ? fallback.href : explicit.href,
    };
  }, [navigation]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const snapshot = jobs.filter((item) => ACTIVE.has(item.status));
      if (!snapshot.length) {
        void refresh();
        return;
      }
      const next = await Promise.all(
        snapshot.map(async (job) => {
          try { return await getGenerationExecution(job.id); }
          catch { return job; }
        }),
      );
      if (mounted.current) setJobs(next.filter((item) => ACTIVE.has(item.status)));
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [jobs, refresh]);

  const value = useMemo(
    () => ({
      jobs,
      refresh,
      track,
      navigationFor,
      getForModule: (moduleId: number) => jobs.find((item) => item.module_id === moduleId) ?? null,
    }),
    [jobs, refresh, track, navigationFor],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useGenerationJobs() {
  const value = useContext(JobsContext);
  if (!value) throw new Error("useGenerationJobs must be used inside GenerationJobsProvider");
  return value;
}

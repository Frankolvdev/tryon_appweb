"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getGenerationExecution, listActiveGenerationExecutions } from "@/lib/generation-api";
import type { GenerationExecution } from "@/types/generation";
import { isGenerationProviderPending, shouldPollGenerationExecution } from "@/lib/generation-execution-contract";

export type GenerationJobNavigation = {
  clickable?: boolean;
  href?: string | null;
  label?: string | null;
};

type ResolvedNavigation = {
  clickable: boolean;
  href: string | null;
  label: string | null;
};

type JobsContextValue = {
  jobs: GenerationExecution[];
  refresh: () => Promise<void>;
  track: (job: GenerationExecution, navigation?: GenerationJobNavigation) => void;
  getForModule: (moduleId: number) => GenerationExecution | null;
  navigationFor: (job: GenerationExecution) => ResolvedNavigation;
};

const JobsContext = createContext<JobsContextValue | null>(null);
const POLL_INTERVAL_MS = 2000;
const NAV_STORAGE_KEY = "tryon-generation-job-navigation-v1";
const JOBS_STORAGE_KEY = "tryon-generation-jobs-v1";

function readStoredNavigation(): Record<string, GenerationJobNavigation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NAV_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredNavigation(value: Record<string, GenerationJobNavigation>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}


function readStoredJobs(): GenerationExecution[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GenerationExecution =>
      Boolean(item && typeof item === "object" && typeof item.id === "string" && isGenerationProviderPending(item)),
    );
  } catch {
    return [];
  }
}

function writeStoredJobs(value: GenerationExecution[]) {
  if (typeof window === "undefined") return;
  try {
    const pending = value.filter((item) => isGenerationProviderPending(item));
    if (pending.length) {
      window.localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(pending));
    } else {
      window.localStorage.removeItem(JOBS_STORAGE_KEY);
    }
  } catch {}
}

function mergePendingJobs(...lists: GenerationExecution[][]): GenerationExecution[] {
  const byId = new Map<string, GenerationExecution>();
  for (const list of lists) {
    for (const item of list) {
      if (isGenerationProviderPending(item)) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

function defaultNavigation(job: GenerationExecution): ResolvedNavigation {
  // Never guess a generic Try-On route for executions that belong to a
  // dedicated product surface. Their exact href is persisted by track().
  // A missing explicit route is safer as non-clickable than sending the user
  // to a different studio.
  const dedicatedSurface = job.module_key === "create_model_woman" || job.module_key === "create_model_woman_from_head";
  if (dedicatedSurface) {
    return {
      clickable: false,
      href: null,
      label: "Create Model IA",
    };
  }
  return {
    clickable: true,
    href: `/try-on/${job.module_id}`,
    label: job.module_key.replaceAll("_", " "),
  };
}

export function GenerationJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<GenerationExecution[]>([]);
  const [navigation, setNavigation] = useState<Record<string, GenerationJobNavigation>>({});
  const mounted = useRef(true);

  useEffect(() => {
    setNavigation(readStoredNavigation());
    setJobs((current) => mergePendingJobs(current, readStoredJobs()));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await listActiveGenerationExecutions();
      if (mounted.current) {
        setJobs((current) => {
          const next = mergePendingJobs(current, result.items);
          writeStoredJobs(next);
          return next;
        });
      }
    } catch {}
  }, []);

  const track = useCallback((job: GenerationExecution, options?: GenerationJobNavigation) => {
    setJobs((previous) => {
      const next = [job, ...previous.filter((item) => item.id !== job.id)].filter((item) =>
        isGenerationProviderPending(item),
      );
      writeStoredJobs(next);
      return next;
    });

    if (options) {
      setNavigation((previous) => {
        const next = { ...previous, [job.id]: options };
        writeStoredNavigation(next);
        return next;
      });
    }
  }, []);

  const navigationFor = useCallback(
    (job: GenerationExecution): ResolvedNavigation => {
      const fallback = defaultNavigation(job);
      const explicit = navigation[job.id];
      return {
        clickable: explicit?.clickable ?? fallback.clickable,
        href: explicit?.href === undefined ? fallback.href : explicit.href,
        label: explicit?.label === undefined ? fallback.label : explicit.label,
      };
    },
    [navigation],
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const snapshot = jobs.filter((item) => shouldPollGenerationExecution(item));
      if (!snapshot.length) {
        void refresh();
        return;
      }

      const next = await Promise.all(
        snapshot.map(async (job) => {
          try {
            return await getGenerationExecution(job.id);
          } catch {
            return job;
          }
        }),
      );

      if (mounted.current) {
        const pending = next.filter((item) => isGenerationProviderPending(item));
        writeStoredJobs(pending);
        setJobs(pending);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [jobs, refresh]);

  const value = useMemo(
    () => ({
      jobs,
      refresh,
      track,
      navigationFor,
      getForModule: (moduleId: number) =>
        jobs.find((item) => item.module_id === moduleId) ?? null,
    }),
    [jobs, refresh, track, navigationFor],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useGenerationJobs() {
  const value = useContext(JobsContext);
  if (!value) {
    throw new Error("useGenerationJobs must be used inside GenerationJobsProvider");
  }
  return value;
}

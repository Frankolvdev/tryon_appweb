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
import {
  consumeGenerationExecutionEvents,
  getGenerationExecution,
  listActiveGenerationExecutions,
  type GenerationExecutionRealtimeEvent,
} from "@/lib/generation-api";
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

type ExecutionListener = (job: GenerationExecution) => void;

type JobsContextValue = {
  jobs: GenerationExecution[];
  refresh: () => Promise<void>;
  track: (job: GenerationExecution, navigation?: GenerationJobNavigation) => void;
  subscribe: (listener: ExecutionListener) => () => void;
  realtimeConnected: boolean;
  getForModule: (moduleId: number) => GenerationExecution | null;
  navigationFor: (job: GenerationExecution) => ResolvedNavigation;
};

const JobsContext = createContext<JobsContextValue | null>(null);
const FALLBACK_POLL_INTERVAL_MS = 2000;
const FALLBACK_DISCOVERY_INTERVAL_MS = 15000;
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
  const dedicatedSurface = job.module_key === "create_model_woman" || job.module_key === "create_model_woman_from_head";
  if (dedicatedSurface) {
    return { clickable: false, href: null, label: "Create Model IA" };
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
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const mounted = useRef(true);
  const jobsRef = useRef<GenerationExecution[]>([]);
  const listenersRef = useRef(new Set<ExecutionListener>());
  const transportReadyRef = useRef(false);

  const replaceJobs = useCallback((next: GenerationExecution[]) => {
    jobsRef.current = next;
    writeStoredJobs(next);
    if (mounted.current) setJobs(next);
  }, []);

  const notifyListeners = useCallback((job: GenerationExecution) => {
    for (const listener of listenersRef.current) {
      try { listener(job); } catch {}
    }
  }, []);

  const applyExecutionUpdate = useCallback((job: GenerationExecution) => {
    const pending = isGenerationProviderPending(job);
    const next = pending
      ? [job, ...jobsRef.current.filter((item) => item.id !== job.id)]
      : jobsRef.current.filter((item) => item.id !== job.id);
    replaceJobs(next);
    notifyListeners(job);
  }, [notifyListeners, replaceJobs]);

  useEffect(() => {
    setNavigation(readStoredNavigation());
    replaceJobs(mergePendingJobs(jobsRef.current, readStoredJobs()));
  }, [replaceJobs]);

  const refresh = useCallback(async () => {
    try {
      const result = await listActiveGenerationExecutions();
      if (!mounted.current) return;

      const discoveredIds = new Set(result.items.map((item) => item.id));
      const knownButMissing = jobsRef.current.filter((item) => !discoveredIds.has(item.id));
      const reconciled = await Promise.allSettled(
        knownButMissing.map((item) => getGenerationExecution(item.id)),
      );
      if (!mounted.current) return;

      const recovered = reconciled.flatMap((entry) =>
        entry.status === "fulfilled" ? [entry.value] : [],
      );
      const next = mergePendingJobs(result.items, recovered);
      replaceJobs(next);
      for (const job of [...result.items, ...recovered]) notifyListeners(job);
    } catch {}
  }, [notifyListeners, replaceJobs]);

  const track = useCallback((job: GenerationExecution, options?: GenerationJobNavigation) => {
    applyExecutionUpdate(job);
    if (options) {
      setNavigation((previous) => {
        const next = { ...previous, [job.id]: options };
        writeStoredNavigation(next);
        return next;
      });
    }
  }, [applyExecutionUpdate]);

  const subscribe = useCallback((listener: ExecutionListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
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
    return () => { mounted.current = false; };
  }, [refresh]);

  // Durable discovery is performed once on mount and whenever connectivity
  // returns. SSE is only a notification channel; SQL remains the source of truth.
  useEffect(() => {
    const handleOnline = () => void refresh();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refresh]);

  // One authenticated SSE stream per browser session. Redis supplies
  // cross-process fanout; reconnects automatically without changing job state.
  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;
    let backoffMs = 1000;

    const handleRealtimeEvent = async (event: GenerationExecutionRealtimeEvent) => {
      const existing = jobsRef.current.find((item) => item.id === event.id);
      if (existing && (event.status === "queued" || event.status === "running")) {
        applyExecutionUpdate({ ...existing, ...event });
        return;
      }
      try {
        const full = await getGenerationExecution(event.id);
        if (!stopped) applyExecutionUpdate(full);
      } catch {}
    };

    const run = async () => {
      while (!stopped && !controller.signal.aborted) {
        try {
          await consumeGenerationExecutionEvents({
            signal: controller.signal,
            onExecution: (event) => { void handleRealtimeEvent(event); },
            onTransport: (crossProcess) => {
              if (!stopped) {
                const becameReady = crossProcess && !transportReadyRef.current;
                transportReadyRef.current = crossProcess;
                setRealtimeConnected(crossProcess);
                if (crossProcess) backoffMs = 1000;
                // Reconcile durable SQL state exactly once when realtime transport
                // becomes available/reconnects. This is event-driven, not polling.
                if (becameReady) void refresh();
              }
            },
          });
          if (!stopped) {
            transportReadyRef.current = false;
            setRealtimeConnected(false);
          }
        } catch (error) {
          if (controller.signal.aborted) break;
          if (!stopped) {
            transportReadyRef.current = false;
            setRealtimeConnected(false);
          }
        }
        if (stopped) break;
        void refresh();
        await new Promise((resolve) => window.setTimeout(resolve, backoffMs));
        backoffMs = Math.min(backoffMs * 2, 15000);
      }
    };

    void run();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [applyExecutionUpdate, refresh]);

  // Existing status polling remains as a safety net only while cross-process
  // realtime is unavailable. There is no 2-second idle /active-executions loop.
  useEffect(() => {
    if (realtimeConnected) return;
    const pollKnown = async () => {
      const snapshot = jobsRef.current.filter((item) => shouldPollGenerationExecution(item));
      if (!snapshot.length) return;
      const results = await Promise.allSettled(snapshot.map((job) => getGenerationExecution(job.id)));
      for (const result of results) {
        if (result.status === "fulfilled") applyExecutionUpdate(result.value);
      }
    };
    const timer = window.setInterval(() => void pollKnown(), FALLBACK_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [applyExecutionUpdate, realtimeConnected]);

  // If SSE/Redis is unavailable, rediscover durable active work occasionally.
  // This is 7.5x less frequent than the old permanent idle 2-second request.
  useEffect(() => {
    if (realtimeConnected) return;
    const timer = window.setInterval(() => void refresh(), FALLBACK_DISCOVERY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [realtimeConnected, refresh]);

  const value = useMemo(
    () => ({
      jobs,
      refresh,
      track,
      subscribe,
      realtimeConnected,
      navigationFor,
      getForModule: (moduleId: number) => jobs.find((item) => item.module_id === moduleId) ?? null,
    }),
    [jobs, refresh, track, subscribe, realtimeConnected, navigationFor],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useGenerationJobs() {
  const value = useContext(JobsContext);
  if (!value) throw new Error("useGenerationJobs must be used inside GenerationJobsProvider");
  return value;
}

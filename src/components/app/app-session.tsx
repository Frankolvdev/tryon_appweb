"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-api";
import {
  clearSession,
  getAccessToken,
  isAccessTokenExpired,
  subscribeToSessionChanges,
} from "@/lib/auth-storage";
import type { CurrentUser } from "@/types/auth";

type AppSessionValue = {
  user: CurrentUser;
  refreshUser: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectToLogin = useCallback(() => {
    setUser(null);
    setLoading(false);
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token || isAccessTokenExpired(token)) {
      clearSession();
      redirectToLogin();
      return;
    }

    try {
      setUser(await getCurrentUser());
    } catch {
      clearSession();
      redirectToLogin();
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => subscribeToSessionChanges(() => {
    const token = getAccessToken();
    if (!token || isAccessTokenExpired(token)) redirectToLogin();
  }), [redirectToLogin]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === "visible") void loadUser();
    };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [loadUser]);

  const value = useMemo<AppSessionValue | null>(
    () => (user ? { user, refreshUser: loadUser } : null),
    [loadUser, user],
  );

  if (loading || !value) {
    return (
      <div className="pageLoading" role="status" aria-live="polite">
        <div className="spinner" />
        <p>Abriendo tu estudio…</p>
      </div>
    );
  }

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) throw new Error("useAppSession debe usarse dentro de AppSession.");
  return context;
}

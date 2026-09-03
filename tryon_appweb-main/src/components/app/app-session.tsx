"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-api";
import { getAccessToken, getRefreshToken, subscribeToSessionChanges } from "@/lib/auth-storage";
import { getUsableAccessToken } from "@/lib/session-refresh";
import { ApiRequestError } from "@/lib/api";
import type { CurrentUser } from "@/types/auth";

type AppSessionValue = { user: CurrentUser; refreshUser: () => Promise<void> };
const AppSessionContext = createContext<AppSessionValue | null>(null);

export function AppSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [temporaryError, setTemporaryError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    setUser(null);
    setLoading(false);
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  const fetchUser = useCallback(async (blocking: boolean) => {
    if (blocking) setLoading(true);
    setTemporaryError(null);
    try {
      const usableToken = await getUsableAccessToken();
      if (!usableToken) {
        redirectToLogin();
        return;
      }
      setUser(await getCurrentUser());
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setTemporaryError("No pudimos abrir tu estudio porque el servidor no está disponible.");
    } finally {
      if (blocking) setLoading(false);
    }
  }, [redirectToLogin]);

  const restoreSession = useCallback(() => fetchUser(true), [fetchUser]);
  const refreshUser = useCallback(() => fetchUser(false), [fetchUser]);

  useEffect(() => { void restoreSession(); }, [restoreSession]);
  useEffect(() => subscribeToSessionChanges(() => {
    if (!getAccessToken() && !getRefreshToken()) redirectToLogin();
  }), [redirectToLogin]);
  useEffect(() => {
    const revalidate = () => { if (document.visibilityState === "visible") void refreshUser(); };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [refreshUser]);

  const value = useMemo<AppSessionValue | null>(() => user ? { user, refreshUser } : null, [refreshUser, user]);

  if (loading) return <div className="pageLoading" role="status"><div className="spinner" /><p>Abriendo tu estudio…</p></div>;
  if (temporaryError && !value) return (
    <div className="pageLoading sessionRecoveryState" role="alert">
      <p>{temporaryError}</p>
      <button type="button" onClick={() => void restoreSession()}>Reintentar</button>
    </div>
  );
  if (!value) return null;
  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) throw new Error("useAppSession debe usarse dentro de AppSession.");
  return context;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-api";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
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

  async function loadUser() {
    const token = getAccessToken();
    if (!token) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      setUser(await getCurrentUser());
    } catch {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
    // La validación se realiza al montar el área privada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AppSessionValue | null>(
    () => (user ? { user, refreshUser: loadUser } : null),
    [user],
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

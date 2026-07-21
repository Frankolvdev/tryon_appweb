"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAppSession } from "@/components/app/app-session";
import { Brand } from "@/components/ui/brand";
import { clearSession } from "@/lib/auth-storage";

const items = [
  ["/dashboard", "Inicio", "⌂"],
  ["/try-on", "Crear Try-On", "✦"],
  ["/history", "Historial", "◫"],
  ["/gallery", "Galería", "▦"],
  ["/billing", "Tokens y plan", "◇"],
  ["/settings", "Configuración", "⚙"],
] as const;

function initials(name?: string | null) {
  const value = name?.trim() || "Usuario";

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSession();
  const [open, setOpen] = useState(false);

  function logout() {
    setOpen(false);
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="appFrame">
      <header className="mobileHeader">
        <Brand />

        <button
          type="button"
          className="menuButton"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir navegación"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {open && (
        <button
          type="button"
          className="sidebarBackdrop"
          onClick={() => setOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}

      <aside className={`sidebar${open ? " sidebarOpen" : ""}`}>
        <div className="desktopBrand">
          <Brand />
        </div>

        <div className="workspaceLabel">MI ESTUDIO</div>

        <nav aria-label="Navegación principal">
          {items.map(([href, label, icon]) => {
            const active =
              pathname === href ||
              pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={active ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">{icon}</span>
                <strong>{label}</strong>
              </Link>
            );
          })}
        </nav>

        <div className="sidebarBottom">
          <Link
            href="/settings"
            className="userMiniCard"
            onClick={() => setOpen(false)}
          >
            <span className="userAvatar">
              {initials(user.full_name)}
            </span>

            <span className="userMiniCopy">
              <strong>{user.full_name || "Mi cuenta"}</strong>
              <small>{user.email}</small>
            </span>
          </Link>

          <button
            type="button"
            className="logout"
            onClick={logout}
          >
            ↗ <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="appContent">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAppSession } from "@/components/app/app-session";
import { Brand } from "@/components/ui/brand";
import { clearSession } from "@/lib/auth-storage";

const items = [
  ["/dashboard", "Inicio", "home"],
  ["/try-on", "Crear Try-On", "spark"],
  ["/history", "Historial", "history"],
  ["/gallery", "Galería", "gallery"],
  ["/billing", "Tokens y plan", "wallet"],
  ["/settings", "Configuración", "settings"],
] as const;

type IconName = (typeof items)[number][2];

function AppIcon({ name }: { name: IconName }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
  }

  if (name === "spark") {
    return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>;
  }

  if (name === "history") {
    return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>;
  }

  if (name === "gallery") {
    return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>;
  }

  if (name === "wallet") {
    return <svg {...common}><path d="M3 7h15a3 3 0 0 1 3 3v8H6a3 3 0 0 1-3-3V7Z"/><path d="M3 7V6a2 2 0 0 1 2-2h12"/><path d="M16 12h5"/><circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none"/></svg>;
  }

  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
}

function initials(name?: string | null) {
  return (name?.trim() || "Usuario")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={`boShell${collapsed ? " boShellCollapsed" : ""}`}>
      {mobileOpen && (
        <button
          type="button"
          className="boOverlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`boSidebar${mobileOpen ? " boSidebarOpen" : ""}`}>
        <div className="boSidebarHeader">
          <div className="boBrandWrap">
            <Brand />
          </div>
          <button
            type="button"
            className="boMobileClose"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar navegación"
          >
            ×
          </button>
        </div>

        <div className="boWorkspaceLabel">MI ESTUDIO</div>

        <nav className="boNav" aria-label="Navegación principal">
          {items.map(([href, label, icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`boNavItem${active ? " boNavItemActive" : ""}`}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
              >
                <span className="boNavIcon"><AppIcon name={icon} /></span>
                <span className="boNavText">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="boSidebarFooter">
          <Link href="/settings" className="boUserCard" onClick={() => setMobileOpen(false)}>
            <span className="boAvatar">{initials(user.full_name)}</span>
            <span className="boUserCopy">
              <strong>{user.full_name || "Mi cuenta"}</strong>
              <small>{user.email}</small>
            </span>
          </Link>

          <button type="button" className="boLogout" onClick={logout}>
            <span aria-hidden="true">↗</span>
            <span className="boNavText">Cerrar sesión</span>
          </button>

          <button
            type="button"
            className="boCollapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir panel" : "Contraer panel"}
          >
            <span>{collapsed ? "›" : "‹"}</span>
            <span className="boNavText">Contraer panel</span>
          </button>
        </div>
      </aside>

      <section className="boMain">
        <header className="boTopbar">
          <button
            type="button"
            className="boMenuButton"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir navegación"
          >
            ☰
          </button>

          <div className="boSearch">
            <span aria-hidden="true">⌕</span>
            <span>Próximamente</span>
          </div>

          <div className="boTopbarActions">
            <button type="button" className="boLang">ES</button>
            <Link href="/settings" className="boTopUser">
              <span className="boAvatar boAvatarSmall">{initials(user.full_name)}</span>
              <span className="boTopUserCopy">
                <strong>{user.full_name || "Mi cuenta"}</strong>
                <small>{user.email}</small>
              </span>
            </Link>
          </div>
        </header>

        <main className="boContent">{children}</main>
      </section>
    </div>
  );
}

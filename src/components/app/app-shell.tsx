"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
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

function NavigationIcon({ name }: { name: IconName }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "gallery") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>;
  if (name === "wallet") return <svg {...common}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 8h16"/><path d="M15 13h3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
}

function initials(name?: string | null) {
  const value = name?.trim() || "Usuario";
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSession();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="appFrame orbitalFrame">
      <aside className="sidebar orbitalSidebar">
        <div className="desktopBrand orbitalBrand"><Brand /></div>
        <div className="orbitalAura" aria-hidden="true"><i/><i/><i/></div>
        <nav className="orbitalDock" aria-label="Navegación principal">
          {items.map(([href, label, icon], index) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={`orbitalItem${active ? " active" : ""}`} style={{ "--dock-index": index } as React.CSSProperties} aria-current={active ? "page" : undefined}>
                <span className="orbitalIcon"><NavigationIcon name={icon} /></span>
                <strong>{label}</strong>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </Link>
            );
          })}
        </nav>
        <div className="sidebarBottom orbitalAccount">
          <Link href="/settings" className="userMiniCard">
            <span className="userAvatar">{initials(user.full_name)}</span>
            <span className="userMiniCopy"><strong>{user.full_name || "Mi cuenta"}</strong><small>{user.email}</small></span>
          </Link>
          <button className="logout" onClick={logout} aria-label="Cerrar sesión"><span>↗</span><strong>Cerrar sesión</strong></button>
        </div>
      </aside>
      <header className="mobileHeader orbitalMobileHeader"><Brand /></header>
      <main className="appContent orbitalContent">{children}</main>
    </div>
  );
}

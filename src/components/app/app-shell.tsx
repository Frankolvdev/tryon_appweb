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
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "gallery") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>;
  if (name === "wallet") return <svg {...common}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 8h16"/><path d="M15 13h3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
}

function initials(name?: string | null) {
  return (name?.trim() || "Usuario").split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
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
    <div className={`boAppShell${collapsed ? " isCollapsed" : ""}`}>
      {mobileOpen && <button className="boSidebarOverlay" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />}
      <aside className={`boSidebar${mobileOpen ? " isOpen" : ""}`}>
        <div className="boSidebarBrand"><Brand /></div>
        <div className="boSidebarSectionLabel">MI ESTUDIO</div>
        <nav className="boSidebarNav" aria-label="Navegación principal">
          {items.map(([href, label, icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={active ? "active" : ""} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined}><span className="boNavIcon"><AppIcon name={icon} /></span><span className="boNavLabel">{label}</span></Link>;
          })}
        </nav>
        <div className="boSidebarFooter">
          <Link href="/settings" className="boUserCard"><span className="boAvatar">{initials(user.full_name)}</span><span className="boUserCopy"><strong>{user.full_name || "Mi cuenta"}</strong><small>{user.email}</small></span></Link>
          <button className="boCollapseButton" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expandir panel" : "Contraer panel"}><span>{collapsed ? "›" : "‹"}</span><span className="boNavLabel">Contraer panel</span></button>
          <button className="boLogoutButton" onClick={logout}><span>↗</span><span className="boNavLabel">Cerrar sesión</span></button>
        </div>
      </aside>
      <div className="boMainColumn">
        <header className="boTopbar">
          <button className="boMobileMenu" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">☰</button>
          <div className="boSearch"><span>⌕</span><input aria-label="Buscar" placeholder="Buscar en la plataforma" disabled /><small>Próximamente</small></div>
          <div className="boTopbarActions"><button className="boLanguage">ES</button><Link href="/settings" className="boTopbarProfile"><span className="boAvatar">{initials(user.full_name)}</span><span><strong>{user.full_name || "Mi cuenta"}</strong><small>{user.email}</small></span></Link></div>
        </header>
        <main className="boAppContent">{children}</main>
      </div>
    </div>
  );
}

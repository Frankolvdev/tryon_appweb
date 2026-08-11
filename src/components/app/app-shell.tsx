"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Coins, GalleryVerticalEnd, History, Home, LogOut, Menu, Settings, Sparkles, UserRound, X } from "lucide-react";
import { useAppSession } from "@/components/app/app-session";
import { clearSession } from "@/lib/auth-storage";
import { GenerationJobsProvider } from "@/components/generation/generation-jobs-provider";
import { ActiveGenerationJobs } from "@/components/generation/active-generation-jobs";

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/try-on", label: "Crear Try-On", icon: Sparkles },
  { href: "/models", label: "Create Model IA", icon: Sparkles },
  { href: "/generation/history", label: "Historial", icon: History },
  { href: "/gallery", label: "Galería", icon: GalleryVerticalEnd },
  { href: "/billing", label: "Tokens y plan", icon: Coins },
  { href: "/settings", label: "Configuración", icon: Settings },
] as const;

function initials(name?: string | null) {
  return (name?.trim() || "Usuario").split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function AppBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className={`appBrand${collapsed ? " appBrandCollapsed" : ""}`} aria-label="TryOn AI">
      <span className="appBrandMark"><Sparkles size={20} strokeWidth={1.8}/></span>
      {!collapsed && <span className="appBrandCopy"><strong>TRYON AI</strong><small>VIRTUAL STUDIO</small></span>}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    setMobileOpen(false);
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="appSidebarInner">
      <AppBrand collapsed={collapsed}/>
      <nav className="appNav" aria-label="Navegación principal">
        {!collapsed && <p className="appNavGroup">MI ESTUDIO</p>}
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} title={collapsed ? label : undefined} className={`appNavItem${active ? " appNavItemActive" : ""}`} onClick={()=>setMobileOpen(false)}><Icon size={17} strokeWidth={1.8}/>{!collapsed && <span>{label}</span>}</Link>;
        })}
      </nav>
      <div className="appSidebarBottom">
        <Link href="/settings" className={`appUserCard${collapsed ? " appUserCardCollapsed" : ""}`} onClick={()=>setMobileOpen(false)}>
          <span className="appAvatar">{initials(user.full_name)}</span>
          {!collapsed && <span className="appUserCopy"><strong>{user.full_name || "Mi cuenta"}</strong><small>{user.email}</small></span>}
        </Link>
        <button type="button" className={`appLogout${collapsed ? " appLogoutCollapsed" : ""}`} onClick={logout} title="Cerrar sesión"><LogOut size={17}/>{!collapsed && <span>Cerrar sesión</span>}</button>
        <button type="button" className="appCollapse" onClick={()=>setCollapsed((value)=>!value)}>{collapsed ? <ChevronRight size={16}/> : <><span>Contraer panel</span><ChevronLeft size={16}/></>}</button>
      </div>
    </div>
  );

  return (
    <GenerationJobsProvider>
    <div className={`appFrame${collapsed ? " appFrameCollapsed" : ""}`}>
      <header className="appMobileHeader"><AppBrand/><button type="button" className="appMenuButton" onClick={()=>setMobileOpen(true)} aria-label="Abrir navegación"><Menu size={20}/></button></header>
      <aside className="appDesktopSidebar">{sidebar}</aside>
      {mobileOpen && <div className="appMobileLayer"><button type="button" className="appSidebarBackdrop" onClick={()=>setMobileOpen(false)} aria-label="Cerrar navegación"/><aside className="appMobileSidebar"><button type="button" className="appMobileClose" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"><X size={18}/></button>{sidebar}</aside></div>}
      <main className="appContent"><ActiveGenerationJobs/>{children}</main>
    </div>
    </GenerationJobsProvider>
  );
}

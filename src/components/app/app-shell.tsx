"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";
import { clearSession } from "@/lib/auth-storage";

const items = [["/dashboard", "Inicio", "⌂"], ["/try-on", "Crear Try-On", "✦"], ["/history", "Historial", "◫"], ["/gallery", "Galería", "▦"], ["/billing", "Tokens y plan", "◇"], ["/settings", "Configuración", "⚙"]];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  return <div className="appFrame"><aside className="sidebar"><Brand /><nav>{items.map(([href,label,icon]) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><span>{icon}</span>{label}</Link>)}</nav><button className="logout" onClick={() => { clearSession(); router.replace("/login"); }}>↗ Cerrar sesión</button></aside><main className="appContent">{children}</main></div>;
}

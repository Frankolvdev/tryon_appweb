"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-api";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
import type { CurrentUser } from "@/types/auth";
export default function DashboardPage() {
  const router = useRouter(); const [user, setUser] = useState<CurrentUser | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!getAccessToken()) { router.replace("/login"); return; } getCurrentUser().then(setUser).catch(() => { clearSession(); router.replace("/login"); }).finally(() => setLoading(false)); }, [router]);
  if (loading) return <div className="pageLoading"><div className="spinner"/><p>Preparando tu estudio…</p></div>;
  return <div className="dashboard"><header className="topbar"><div><span className="eyebrow">ESTUDIO PERSONAL</span><h1>Hola, {user?.full_name?.split(" ")[0] || "creador"}</h1><p>Todo está listo para transformar tu próxima idea.</p></div><div className="tokenBadge"><span>◇</span><div><small>Tokens disponibles</small><strong>{user?.token_balance ?? "—"}</strong></div></div></header><section className="heroAction"><div><span className="statusPill">✦ NUEVA GENERACIÓN</span><h2>Tu próximo look empieza con una imagen.</h2><p>Sube una fotografía, elige una prenda y deja que la IA construya el resultado.</p><button className="primaryButton">Crear mi primer Try-On</button></div><div className="heroArt"><div className="artCard artA"/><div className="artCard artB"><span>BEFORE</span><strong>→</strong><span>AFTER</span></div></div></section><section className="statsGrid"><article><span>◫</span><small>Generaciones</small><strong>0</strong><p>Tu historial aparecerá aquí.</p></article><article><span>▦</span><small>Galería personal</small><strong>0</strong><p>Guarda tus mejores resultados.</p></article><article><span>◇</span><small>Plan actual</small><strong>Inicial</strong><p>Consulta tokens y beneficios.</p></article></section></div>;
}

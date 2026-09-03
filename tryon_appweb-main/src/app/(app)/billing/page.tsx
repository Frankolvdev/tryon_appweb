"use client";

import { Suspense } from "react";
import { BillingCenter } from "@/components/billing/billing-center";
import { useAppSession } from "@/components/app/app-session";
import { isOwnerAccount } from "@/lib/owner-account";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BillingPage() {
  const { user } = useAppSession();
  const router = useRouter();
  const owner = isOwnerAccount(user);
  useEffect(()=>{ if(owner) router.replace("/dashboard"); },[owner,router]);
  if(owner) return null;
  return <div className="sectionPage pageEnter"><header className="sectionHeader"><span className="eyebrow">CUENTA COMERCIAL</span><h1>Tokens, planes y pagos</h1><p>Administra tu saldo, suscripción, compras e historial con datos reales del backend.</p></header><Suspense fallback={<div className="historyState"><span className="spinner"/><p>Cargando facturación…</p></div>}><BillingCenter/></Suspense></div>;
}

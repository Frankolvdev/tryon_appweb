import { Suspense } from "react";
import { BillingCenter } from "@/components/billing/billing-center";

export default function BillingPage() {
  return <div className="sectionPage pageEnter"><header className="sectionHeader"><span className="eyebrow">CUENTA COMERCIAL</span><h1>Tokens, planes y pagos</h1><p>Administra tu saldo, suscripción, compras e historial con datos reales del backend.</p></header><Suspense fallback={<div className="historyState"><span className="spinner"/><p>Cargando facturación…</p></div>}><BillingCenter/></Suspense></div>;
}

"use client";

import Link from "next/link";
import { useAppSession } from "@/components/app/app-session";
import { isOwnerAccount } from "@/lib/owner-account";

export default function DashboardPage() {
  const { user } = useAppSession();
  const firstName = user.full_name?.trim().split(/\s+/)[0] || "creador";
  const owner = isOwnerAccount(user);

  return (
    <div className="dashboard pageEnter">
      <header className="topbar">
        <div>
          <span className="eyebrow">ESTUDIO PERSONAL</span>
          <h1>Hola, {firstName}</h1>
          <p>Tu espacio creativo está preparado para la próxima transformación.</p>
        </div>
        {owner ? (
          <div className="tokenBadge" aria-label="Cuenta de propietario">
            <span>◇</span>
            <div><small>Cuenta propietario</small><strong>Owner Local</strong></div>
          </div>
        ) : (
          <Link href="/billing" className="tokenBadge" aria-label="Consultar tokens y plan">
            <span>◇</span>
            <div><small>Tokens disponibles</small><strong>{user.token_balance ?? "—"}</strong></div>
          </Link>
        )}
      </header>

      <section className="heroAction">
        <div>
          <span className="statusPill">✦ NUEVA GENERACIÓN</span>
          <h2>Tu próximo look empieza con una imagen.</h2>
          <p>Sube tu fotografía, combina una prenda y prepara una transformación creada para ti.</p>
          <Link className="primaryButton heroButton" href="/try-on">Crear un Try-On</Link>
        </div>
        <div className="heroArt" aria-hidden="true">
          <div className="artCard artA"><span>ORIGINAL</span></div>
          <div className="artCard artB"><span>TRANSFORMACIÓN</span><strong>✦</strong><small>AI TRY-ON</small></div>
        </div>
      </section>

      <section className="quickGrid" aria-label="Accesos rápidos">
        <Link href="/try-on" className="quickCard quickPrimary"><span>01</span><div><small>CREAR</small><strong>Nueva transformación</strong><p>Inicia el flujo de generación.</p></div><b>→</b></Link>
        <Link href="/history" className="quickCard"><span>02</span><div><small>REVISAR</small><strong>Historial</strong><p>Consulta el estado de tus trabajos.</p></div><b>→</b></Link>
        <Link href="/gallery" className="quickCard"><span>03</span><div><small>INSPIRAR</small><strong>Galería</strong><p>Organiza tus resultados favoritos.</p></div><b>→</b></Link>
      </section>
    </div>
  );
}

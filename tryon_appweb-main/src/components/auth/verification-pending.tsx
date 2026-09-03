"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, resendVerification } from "@/lib/auth-api";

const DEFAULT_COOLDOWN = 60;

function hideEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

function extractSeconds(message: string): number | null {
  const match = message.match(/(\d+)\s+second/i);
  return match ? Number(match[1]) : null;
}

export function VerificationPending({ email }: { email: string }) {
  const [seconds, setSeconds] = useState(DEFAULT_COOLDOWN);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const maskedEmail = useMemo(() => hideEmail(email), [email]);

  async function resend() {
    if (!email || seconds > 0 || sending) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      await resendVerification(email);
      setNotice("Enlace reenviado correctamente. Revisa tu bandeja de entrada.");
      setSeconds(DEFAULT_COOLDOWN);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No fue posible reenviar el enlace.";
      setError(message);
      if (cause instanceof ApiError && cause.status === 409) {
        setSeconds(extractSeconds(message) ?? DEFAULT_COOLDOWN);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="verificationCard">
      <div className="verificationGlow" aria-hidden="true" />
      <div className="verificationIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 5.7L20 7" />
          <path d="M8 17h8" opacity=".45" />
        </svg>
      </div>

      <p className="verificationEyebrow">ACTIVA TU CUENTA</p>
      <h1>Revisa tu correo</h1>
      <p className="verificationLead">
        Enviamos un enlace de verificación a <strong>{maskedEmail || "tu correo electrónico"}</strong>.
        Ábrelo para confirmar que la dirección te pertenece.
      </p>

      <div className="verificationSteps">
        <div><span>1</span><p>Abre el mensaje de LUXIA</p></div>
        <div><span>2</span><p>Presiona “Verificar correo”</p></div>
        <div><span>3</span><p>Regresa e inicia sesión</p></div>
      </div>

      {notice && <div className="verificationMessage success" role="status">{notice}</div>}
      {error && <div className="verificationMessage error" role="alert">{error}</div>}

      <button
        type="button"
        className="exactSubmit verificationResend"
        disabled={!email || seconds > 0 || sending}
        onClick={resend}
      >
        {sending
          ? "Reenviando…"
          : seconds > 0
            ? `Reintentar en ${seconds}s`
            : "No recibí el correo · Reenviar"}
      </button>

      <p className="verificationHint">
        Revisa también spam, promociones y correo no deseado. El enlace tiene una vigencia limitada.
      </p>

      <div className="verificationLinks">
        <Link href="/login">Volver a iniciar sesión</Link>
        <Link href="/register">Usar otro correo</Link>
      </div>
    </div>
  );
}

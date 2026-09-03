"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./recovery-auth.module.css";

function Mail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [seconds]);

  async function send(target: string, resend = false) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await requestPasswordRecovery(target);
      setSentEmail(target);
      setSeconds(60);
      if (resend) setMessage("Enlace reenviado correctamente.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError("Escribe una dirección de correo válida.");
      return;
    }
    await send(normalized);
  }

  if (sentEmail) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}><Mail /></div>
        <h3>Revisa tu correo</h3>
        <p>
          Si existe una cuenta asociada, enviamos un enlace seguro para crear
          una nueva contraseña.
        </p>
        <div className={styles.emailBadge}><Mail /><span>{sentEmail}</span></div>
        {message ? <div className={styles.successMessage}>{message}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}
        <button
          className={styles.primaryButton}
          type="button"
          disabled={loading || seconds > 0}
          onClick={() => void send(sentEmail, true)}
        >
          {loading ? "Reenviando…" : seconds > 0 ? `Reintentar en ${seconds}s` : "Reenviar correo"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => {
            setSentEmail("");
            setSeconds(0);
            setError("");
            setMessage("");
          }}
        >
          Usar otro correo
        </button>
        <p className={styles.switchText}>
          <Link href="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>
        Correo electrónico
        <span className={styles.inputWrap}>
          <span className={styles.inputIcon}><Mail /></span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@correo.com"
            autoComplete="email"
            autoFocus
          />
        </span>
      </label>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.securityNote}>
        <Shield />
        <p>
          Por privacidad, verás la misma confirmación exista o no una cuenta
          asociada a ese correo.
        </p>
      </div>

      <button className={styles.primaryButton} disabled={loading}>
        {loading ? "Preparando enlace…" : "Enviar enlace de recuperación"}
      </button>

      <p className={styles.switchText}>
        ¿Ya recordaste tu contraseña? <Link href="/login">Iniciar sesión</Link>
      </p>
    </form>
  );
}

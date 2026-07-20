"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.75h16v10.5H4z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(normalized: string) {
    setLoading(true);
    setError("");
    try {
      await requestPasswordRecovery(normalized);
      setSentEmail(normalized);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible enviar las instrucciones.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Escribe una dirección de correo válida.");
      return;
    }
    await send(normalized);
  }

  if (sentEmail) {
    return (
      <div className={styles.successState}>
        <div className={styles.successMark}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6.5 12.5 3.4 3.4L18 7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3>Revisa tu correo</h3>
        <p>
          Si existe una cuenta asociada, enviamos un enlace seguro para crear una nueva contraseña.
        </p>
        <div className={styles.emailChip}>
          <MailIcon />
          {sentEmail}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.button}
            type="button"
            disabled={loading}
            onClick={() => send(sentEmail)}
          >
            {loading ? "Reenviando…" : "Reenviar enlace"}
          </button>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => {
              setSentEmail("");
              setError("");
            }}
          >
            Usar otro correo
          </button>
        </div>

        <p className={styles.secondary}>
          <Link href="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.label}>
        Correo electrónico
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@correo.com"
            autoComplete="email"
            autoFocus
          />
          <span className={styles.inputIcon}><MailIcon /></span>
        </span>
      </label>

      {error ? <div className={styles.error} role="alert">{error}</div> : null}

      <div className={styles.securityNote}>
        <LockIcon />
        <span>
          Por privacidad, verás la misma confirmación exista o no una cuenta asociada a ese correo.
        </span>
      </div>

      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Preparando enlace seguro…" : "Enviar enlace de recuperación"}
      </button>

      <p className={styles.secondary}>
        ¿Ya recordaste tu contraseña? <Link href="/login">Iniciar sesión</Link>
      </p>
    </form>
  );
}

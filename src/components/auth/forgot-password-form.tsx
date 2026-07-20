"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

const COOLDOWN = 60;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function send(normalized: string, resend = false) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await requestPasswordRecovery(normalized);
      setSentEmail(normalized);
      setSeconds(COOLDOWN);
      if (resend) {
        setNotice("Enlace reenviado correctamente. Revisa también spam y promociones.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible enviar las instrucciones.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
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
        <div className={styles.successMark}>✉</div>
        <h3>Revisa tu correo</h3>
        <p>
          Si existe una cuenta asociada, enviamos un enlace seguro para crear
          una nueva contraseña.
        </p>
        <div className={styles.emailChip}>{sentEmail}</div>

        {notice ? <div className={styles.notice}>{notice}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={loading || seconds > 0}
            onClick={() => send(sentEmail, true)}
          >
            {loading ? "Reenviando…" : seconds > 0 ? `Reintentar en ${seconds}s` : "No recibí el correo · Reenviar"}
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => {
              setSentEmail("");
              setError("");
              setNotice("");
              setSeconds(0);
            }}
          >
            Usar otro correo
          </button>
        </div>

        <p className={styles.secondary}><Link href="/login">← Volver al inicio de sesión</Link></p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        Correo electrónico
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@correo.com"
            autoComplete="email"
            autoFocus
          />
          <span className={styles.inputIcon}>✉</span>
        </span>
      </label>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.securityNote}>
        <span>◇</span>
        <span>
          Por privacidad, verás la misma confirmación exista o no una cuenta
          asociada a ese correo.
        </span>
      </div>

      <button className={styles.button} disabled={loading}>
        {loading ? "Preparando enlace seguro…" : "Enviar enlace de recuperación"}
      </button>

      <p className={styles.secondary}>
        ¿Ya recordaste tu contraseña? <Link href="/login">Iniciar sesión</Link>
      </p>
    </form>
  );
}

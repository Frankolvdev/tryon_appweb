"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

const RESEND_SECONDS = 60;

function Icon({ type }: { type: "mail" | "shield" | "check" | "alert" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "mail") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4 7 8 5.7L20 7" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg {...props}>
        <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.5-4" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.3 2.3 4.8-5" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}

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

  async function send(normalizedEmail: string, isResend = false) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      await requestPasswordRecovery(normalizedEmail);
      setSentEmail(normalizedEmail);
      setSeconds(RESEND_SECONDS);
      if (isResend) {
        setNotice("Enlace reenviado correctamente. Revisa también spam y promociones.");
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible enviar las instrucciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Escribe una dirección de correo válida.");
      return;
    }

    await send(normalizedEmail);
  }

  if (sentEmail) {
    return (
      <div className={styles.sentState}>
        <div className={styles.stateIcon}>
          <Icon type="mail" />
        </div>

        <h3>Revisa tu correo</h3>
        <p>
          Si existe una cuenta asociada, enviamos un enlace seguro para crear
          una nueva contraseña.
        </p>

        <div className={styles.emailValue}>
          <Icon type="mail" />
          <span>{sentEmail}</span>
        </div>

        {notice ? (
          <div className={styles.notice} role="status">
            <Icon type="check" />
            <p>{notice}</p>
          </div>
        ) : null}

        {error ? (
          <div className="exactError" role="alert">
            <Icon type="alert" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className={styles.actionStack}>
          <button
            type="button"
            className="exactSubmit"
            disabled={loading || seconds > 0}
            onClick={() => void send(sentEmail, true)}
          >
            {loading
              ? "Reenviando…"
              : seconds > 0
                ? `Reintentar en ${seconds}s`
                : "No recibí el correo · Reenviar"}
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
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

        <p className="exactSwitch">
          <Link href="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="exactLoginForm" onSubmit={submit}>
      <div>
        <label htmlFor="recovery-email">Correo electrónico</label>
        <div className="exactInput">
          <span><Icon type="mail" /></span>
          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@correo.com"
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      {error ? (
        <div className="exactError" role="alert">
          <Icon type="alert" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className={styles.securityNote}>
        <Icon type="shield" />
        <p>
          Por privacidad, mostraremos la misma confirmación exista o no una
          cuenta asociada a ese correo.
        </p>
      </div>

      <button type="submit" className="exactSubmit" disabled={loading}>
        {loading ? "Preparando enlace seguro…" : "Enviar enlace de recuperación"}
      </button>

      <p className="exactSwitch">
        ¿Ya recordaste tu contraseña? <Link href="/login">Iniciar sesión</Link>
      </p>
    </form>
  );
}

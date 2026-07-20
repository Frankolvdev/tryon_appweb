"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Escribe una dirección de correo válida.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordRecovery(normalized);
      setSentEmail(normalized);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible enviar las instrucciones.");
    } finally {
      setLoading(false);
    }
  }

  if (sentEmail) {
    return (
      <div className={`${styles.form} ${styles.center}`}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.notice}>
          Si existe una cuenta asociada a <strong>{sentEmail}</strong>, recibirás un enlace seguro para crear una nueva contraseña.
        </div>
        <button className={styles.button} type="button" disabled={loading} onClick={() => { setEmail(sentEmail); setSentEmail(""); }}>
          Reenviar instrucciones
        </button>
        <p className={styles.secondary}><Link href="/login">Volver al inicio de sesión</Link></p>
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
            placeholder="tu@correo.com"
            autoComplete="email"
            autoFocus
          />
          <span className={styles.icon}>✉</span>
        </span>
      </label>
      {error ? <div className={styles.error} role="alert">{error}</div> : null}
      <div className={styles.security}>
        <span>🔒</span>
        <span>Por seguridad, mostraremos la misma confirmación exista o no una cuenta con ese correo.</span>
      </div>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Enviando enlace seguro…" : "Enviar instrucciones"}
      </button>
      <p className={styles.secondary}>¿Recordaste tu contraseña? <Link href="/login">Iniciar sesión</Link></p>
    </form>
  );
}

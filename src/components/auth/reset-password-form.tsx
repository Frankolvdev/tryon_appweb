"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { confirmPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

export function ResetPasswordForm({ email, token, otp }: { email: string; token?: string; otp?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [password, confirmation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email || (!token && !otp)) {
      setError("El enlace está incompleto. Solicita uno nuevo.");
      return;
    }
    if (!rules.length || !rules.upper || !rules.lower || !rules.number || !rules.match) {
      setError("La contraseña todavía no cumple todos los requisitos.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordRecovery({ email, token, otp, newPassword: password });
      setCompleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "El enlace no es válido o ya expiró.");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className={`${styles.form} ${styles.center}`}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.notice}>Tu contraseña fue actualizada y las sesiones anteriores fueron cerradas.</div>
        <Link className={styles.button} style={{display:"grid",placeItems:"center",textDecoration:"none"}} href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>Nueva contraseña
        <span className={styles.inputWrap}>
          <input className={styles.input} type={show ? "text" : "password"} value={password}
            onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          <button className={styles.eye} type="button" onClick={() => setShow((value) => !value)} aria-label="Mostrar u ocultar contraseña">
            {show ? "◉" : "◎"}
          </button>
        </span>
      </label>
      <label className={styles.label}>Confirmar contraseña
        <span className={styles.inputWrap}>
          <input className={styles.input} type={show ? "text" : "password"} value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" />
        </span>
      </label>
      <div className={styles.requirements}>
        <span className={`${styles.rule} ${rules.length ? styles.ruleOk : ""}`}>✓ Mínimo 8 caracteres</span>
        <span className={`${styles.rule} ${rules.upper ? styles.ruleOk : ""}`}>✓ Una mayúscula</span>
        <span className={`${styles.rule} ${rules.lower ? styles.ruleOk : ""}`}>✓ Una minúscula</span>
        <span className={`${styles.rule} ${rules.number ? styles.ruleOk : ""}`}>✓ Un número</span>
        <span className={`${styles.rule} ${rules.match ? styles.ruleOk : ""}`}>✓ Ambas coinciden</span>
      </div>
      {error ? <div className={styles.error} role="alert">{error}</div> : null}
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Protegiendo tu cuenta…" : "Guardar nueva contraseña"}
      </button>
      <p className={styles.secondary}><Link href="/forgot-password">Solicitar un enlace nuevo</Link></p>
    </form>
  );
}

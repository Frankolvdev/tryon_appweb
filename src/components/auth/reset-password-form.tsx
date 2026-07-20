"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { confirmPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      {!open ? <path d="m5 5 14 14" stroke="currentColor" strokeWidth="1.7" /> : null}
    </svg>
  );
}

export function ResetPasswordForm({
  email,
  token,
  otp,
}: {
  email: string;
  token?: string;
  otp?: string;
}) {
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
    symbol: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [password, confirmation]);

  const passed = Object.values(rules).filter(Boolean).length;
  const strength = Math.round((passed / 6) * 100);
  const strengthLabel =
    strength >= 100 ? "Excelente" :
    strength >= 67 ? "Buena" :
    strength >= 34 ? "Media" : "Débil";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || (!token && !otp)) {
      setError("El enlace está incompleto o no es válido. Solicita uno nuevo.");
      return;
    }

    if (!Object.values(rules).every(Boolean)) {
      setError("Completa todos los requisitos antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordRecovery({
        email,
        token,
        otp,
        newPassword: password,
      });
      setCompleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "El enlace no es válido o ya expiró.");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className={styles.successState}>
        <div className={styles.successMark}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6.5 12.5 3.4 3.4L18 7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3>Contraseña actualizada</h3>
        <p>
          Tu cuenta vuelve a estar protegida. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.buttonLink}`} href="/login">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        Nueva contraseña
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Crea una contraseña segura"
            autoFocus
          />
          <button
            className={styles.eye}
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <EyeIcon open={show} />
          </button>
        </span>
      </label>

      <div className={styles.strength}>
        <div className={styles.strengthTop}>
          <span>Fortaleza de la contraseña</span>
          <span>{strengthLabel}</span>
        </div>
        <div className={styles.strengthTrack}>
          <div className={styles.strengthFill} style={{ width: `${strength}%` }} />
        </div>
      </div>

      <label className={styles.label}>
        Confirmar contraseña
        <span className={styles.inputWrap}>
          <input
            className={styles.input}
            type={show ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            placeholder="Repite la contraseña"
          />
        </span>
      </label>

      <div className={styles.requirements}>
        <span className={`${styles.rule} ${rules.length ? styles.ruleOk : ""}`}>8 caracteres</span>
        <span className={`${styles.rule} ${rules.upper ? styles.ruleOk : ""}`}>Una mayúscula</span>
        <span className={`${styles.rule} ${rules.lower ? styles.ruleOk : ""}`}>Una minúscula</span>
        <span className={`${styles.rule} ${rules.number ? styles.ruleOk : ""}`}>Un número</span>
        <span className={`${styles.rule} ${rules.symbol ? styles.ruleOk : ""}`}>Un símbolo</span>
        <span className={`${styles.rule} ${rules.match ? styles.ruleOk : ""}`}>Coinciden</span>
      </div>

      {error ? <div className={styles.error} role="alert">{error}</div> : null}

      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Actualizando protección…" : "Guardar nueva contraseña"}
      </button>

      <p className={styles.secondary}>
        <Link href="/forgot-password">Solicitar otro enlace</Link>
      </p>
    </form>
  );
}

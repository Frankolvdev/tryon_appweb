"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { confirmPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./recovery-auth.module.css";

function Lock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Eye({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {off ? <path d="m3 3 18 18" /> : null}
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
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [password, confirmation]);

  const score = Math.round((Object.values(rules).filter(Boolean).length / 6) * 100);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || (!token && !otp)) {
      setError("El enlace está incompleto o ya expiró.");
      return;
    }

    if (!Object.values(rules).every(Boolean)) {
      setError("Completa todos los requisitos de seguridad.");
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
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>✓</div>
        <h3>Contraseña actualizada</h3>
        <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <Link className={`${styles.primaryButton} ${styles.linkButton}`} href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const ruleClass = (valid: boolean) =>
    `${styles.rule}${valid ? ` ${styles.ruleValid}` : ""}`;

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>
        Nueva contraseña
        <span className={styles.inputWrap}>
          <span className={styles.inputIcon}><Lock /></span>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crea una contraseña segura"
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Eye off={show} />
          </button>
        </span>
      </label>

      <div className={styles.strength}>
        <div><span>Fortaleza</span><strong>{score === 100 ? "Excelente" : score >= 67 ? "Buena" : score >= 34 ? "Media" : "Débil"}</strong></div>
        <span className={styles.strengthTrack}>
          <span style={{ width: `${score}%` }} />
        </span>
      </div>

      <label>
        Confirmar contraseña
        <span className={styles.inputWrap}>
          <span className={styles.inputIcon}><Lock /></span>
          <input
            type={show ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />
        </span>
      </label>

      <div className={styles.rules}>
        <span className={ruleClass(rules.length)}>8 caracteres</span>
        <span className={ruleClass(rules.upper)}>Una mayúscula</span>
        <span className={ruleClass(rules.lower)}>Una minúscula</span>
        <span className={ruleClass(rules.number)}>Un número</span>
        <span className={ruleClass(rules.symbol)}>Un símbolo</span>
        <span className={ruleClass(rules.match)}>Coinciden</span>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button className={styles.primaryButton} disabled={loading}>
        {loading ? "Actualizando…" : "Guardar nueva contraseña"}
      </button>

      <p className={styles.switchText}>
        <Link href="/forgot-password">Solicitar otro enlace</Link>
      </p>
    </form>
  );
}

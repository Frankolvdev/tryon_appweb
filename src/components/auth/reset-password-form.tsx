"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { confirmPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email || (!token && !otp)) {
      setError("El enlace está incompleto o ya no es válido. Solicita uno nuevo.");
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError("Completa todos los requisitos antes de continuar.");
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
      <div className={styles.successState}>
        <div className={styles.successMark}>✓</div>
        <h3>Contraseña actualizada</h3>
        <p>Tu cuenta vuelve a estar protegida. Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.buttonLink}`} href="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const ruleClass = (ok: boolean) => `${styles.rule} ${ok ? styles.ruleOk : ""}`;

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
          <button type="button" className={styles.eye} onClick={() => setShow((value) => !value)}>
            {show ? "◉" : "◎"}
          </button>
        </span>
      </label>

      <div className={styles.strength}>
        <div className={styles.strengthTop}>
          <span>Fortaleza</span><span>{strength === 100 ? "Excelente" : strength >= 67 ? "Buena" : strength >= 34 ? "Media" : "Débil"}</span>
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
        <span className={ruleClass(rules.length)}>8 caracteres</span>
        <span className={ruleClass(rules.upper)}>Una mayúscula</span>
        <span className={ruleClass(rules.lower)}>Una minúscula</span>
        <span className={ruleClass(rules.number)}>Un número</span>
        <span className={ruleClass(rules.symbol)}>Un símbolo</span>
        <span className={ruleClass(rules.match)}>Coinciden</span>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button className={styles.button} disabled={loading}>
        {loading ? "Actualizando protección…" : "Guardar nueva contraseña"}
      </button>

      <p className={styles.secondary}><Link href="/forgot-password">Solicitar otro enlace</Link></p>
    </form>
  );
}

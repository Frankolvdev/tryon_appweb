"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { confirmPasswordRecovery } from "@/lib/password-recovery-api";
import styles from "./password-recovery.module.css";

function Icon({ type }: { type: "lock" | "eye" | "eyeoff" | "check" | "alert" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "lock") {
    return (
      <svg {...props}>
        <rect x="4" y="10" width="16" height="10" rx="2.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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

  if (type === "alert") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5h.01" />
      </svg>
    );
  }

  if (type === "eyeoff") {
    return (
      <svg {...props}>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-2 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7a10 10 0 0 0 4-.8" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="2.5" />
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(
    () => ({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
      match: password.length > 0 && password === confirmation,
    }),
    [password, confirmation],
  );

  const strength = Math.round(
    (Object.values(rules).filter(Boolean).length / 6) * 100,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      await confirmPasswordRecovery({
        email,
        token,
        otp,
        newPassword: password,
      });
      setCompleted(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "El enlace no es válido o ya expiró.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className={styles.sentState}>
        <div className={styles.successIcon}>
          <Icon type="check" />
        </div>
        <h3>Contraseña actualizada</h3>
        <p>
          Tu cuenta vuelve a estar protegida. Ya puedes iniciar sesión con tu
          nueva contraseña.
        </p>
        <Link className={`${styles.linkButton} exactSubmit`} href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const ruleClass = (valid: boolean) =>
    `${styles.rule} ${valid ? styles.ruleValid : ""}`;

  return (
    <form className="exactLoginForm" onSubmit={submit}>
      <div>
        <label htmlFor="new-password">Nueva contraseña</label>
        <div className="exactInput">
          <span><Icon type="lock" /></span>
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crea una contraseña segura"
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            className="exactEye"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Icon type={showPassword ? "eyeoff" : "eye"} />
          </button>
        </div>
      </div>

      <div className={styles.strength}>
        <div className={styles.strengthHeader}>
          <span>Fortaleza de la contraseña</span>
          <strong>
            {strength === 100
              ? "Excelente"
              : strength >= 67
                ? "Buena"
                : strength >= 34
                  ? "Media"
                  : "Débil"}
          </strong>
        </div>
        <div className={styles.strengthTrack}>
          <div
            className={styles.strengthValue}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <div className="exactInput">
          <span><Icon type="lock" /></span>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className={styles.requirements}>
        <span className={ruleClass(rules.length)}>8 caracteres</span>
        <span className={ruleClass(rules.upper)}>Una mayúscula</span>
        <span className={ruleClass(rules.lower)}>Una minúscula</span>
        <span className={ruleClass(rules.number)}>Un número</span>
        <span className={ruleClass(rules.symbol)}>Un símbolo</span>
        <span className={ruleClass(rules.match)}>Las contraseñas coinciden</span>
      </div>

      {error ? (
        <div className="exactError" role="alert">
          <Icon type="alert" />
          <p>{error}</p>
        </div>
      ) : null}

      <button type="submit" className="exactSubmit" disabled={loading}>
        {loading ? "Actualizando protección…" : "Guardar nueva contraseña"}
      </button>

      <p className="exactSwitch">
        <Link href="/forgot-password">Solicitar otro enlace</Link>
      </p>
    </form>
  );
}

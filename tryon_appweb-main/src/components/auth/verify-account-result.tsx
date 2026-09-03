"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { confirmVerification } from "@/lib/auth-api";

type State = "loading" | "success" | "error";

export function VerifyAccountResult({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("Estamos validando tu enlace de seguridad…");

  useEffect(() => {
    let active = true;
    async function confirm() {
      if (!email || !token) {
        setState("error");
        setMessage("El enlace de verificación está incompleto.");
        return;
      }
      try {
        const result = await confirmVerification(email, token);
        if (!active) return;
        setState(result.verified ? "success" : "error");
        setMessage(result.verified ? "Tu correo fue verificado correctamente." : result.message);
      } catch (cause) {
        if (!active) return;
        setState("error");
        setMessage(cause instanceof Error ? cause.message : "No fue posible verificar la cuenta.");
      }
    }
    void confirm();
    return () => { active = false; };
  }, [email, token]);

  return (
    <div className={`verificationCard verificationResult ${state}`}>
      <div className="verificationIcon" aria-hidden="true">
        {state === "loading" ? (
          <span className="verificationSpinner" />
        ) : state === "success" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" />
          </svg>
        )}
      </div>
      <p className="verificationEyebrow">VERIFICACIÓN DE CUENTA</p>
      <h1>{state === "loading" ? "Verificando…" : state === "success" ? "Cuenta activada" : "No pudimos verificar"}</h1>
      <p className="verificationLead">{message}</p>
      {state === "success" ? (
        <Link className="exactSubmit verificationPrimaryLink" href="/login">Iniciar sesión</Link>
      ) : state === "error" ? (
        <Link className="exactSubmit verificationPrimaryLink" href={`/verify-email?email=${encodeURIComponent(email)}`}>
          Solicitar un enlace nuevo
        </Link>
      ) : null}
    </div>
  );
}

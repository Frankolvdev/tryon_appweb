"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeOAuthCode } from "@/lib/auth-api";
import { saveSession } from "@/lib/auth-storage";

function OAuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState("Completando acceso seguro…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setFailed(true);
      setMessage(error);
      return;
    }

    if (!code) {
      setFailed(true);
      setMessage("El backend no devolvió un código OAuth válido.");
      return;
    }

    exchangeOAuthCode(code)
      .then((tokens) => {
        saveSession(tokens.access_token, tokens.refresh_token);
        router.replace("/dashboard");
        router.refresh();
      })
      .catch((caught) => {
        setFailed(true);
        setMessage(caught instanceof Error ? caught.message : "No fue posible completar el acceso con Google.");
      });
  }, [params, router]);

  return (
    <main className="callbackPage">
      {!failed && <div className="spinner" />}
      <h1>{message}</h1>
      <p>{failed ? "Puedes volver a intentarlo desde la pantalla de acceso." : "No cierres esta ventana."}</p>
      {failed && <Link href="/login">Volver a iniciar sesión</Link>}
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<main className="callbackPage"><div className="spinner"/><h1>Completando acceso seguro…</h1></main>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

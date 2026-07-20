"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeOAuthCode, getCurrentUser } from "@/lib/auth-api";
import { consumeOAuthReturnTo } from "@/lib/auth-redirect";
import { clearSession, saveSession } from "@/lib/auth-storage";

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

    async function completeOAuth() {
      try {
        const tokens = await exchangeOAuthCode(code!);
        saveSession(tokens.access_token, tokens.refresh_token);
        setMessage("Validando tu cuenta…");
        await getCurrentUser();
        const destination = consumeOAuthReturnTo();
        router.replace(destination);
        router.refresh();
      } catch (caught) {
        clearSession();
        setFailed(true);
        setMessage(caught instanceof Error ? caught.message : "No fue posible completar el acceso con Google.");
      }
    }

    void completeOAuth();
  }, [params, router]);

  return (
    <main className="callbackPage" aria-busy={!failed}>
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

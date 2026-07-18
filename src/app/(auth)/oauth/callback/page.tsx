"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSession } from "@/lib/auth-storage";

function OAuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completando acceso seguro…");

  useEffect(() => {
    const token = params.get("access_token") ?? params.get("token");
    const error = params.get("error");

    if (error) {
      setMessage(error);
      return;
    }

    if (!token) {
      setMessage("El backend no devolvió un token válido.");
      return;
    }

    saveSession(token, params.get("refresh_token"));
    router.replace("/dashboard");
  }, [params, router]);

  return (
    <main className="callbackPage">
      <div className="spinner" />
      <h1>{message}</h1>
      <p>No cierres esta ventana.</p>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<main className="callbackPage"><div className="spinner" /><h1>Completando acceso seguro…</h1></main>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

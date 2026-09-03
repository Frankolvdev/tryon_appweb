"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OAuthResultScreen } from "@/components/auth/oauth-result-screen";

function OAuthErrorContent() {
  const params = useSearchParams();
  const title = params.get("title") || "No pudimos completar el acceso";
  const message = params.get("message") || "El proveedor de autenticación devolvió un error.";
  const detail = params.get("detail") || "Vuelve a intentarlo desde la pantalla de acceso.";

  return (
    <OAuthResultScreen
      tone="error"
      title={title}
      message={message}
      detail={detail}
      primaryHref="/login"
      primaryLabel="Volver a iniciar sesión"
      secondaryHref="/register"
      secondaryLabel="Crear otra cuenta"
    />
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense
      fallback={
        <OAuthResultScreen
          tone="loading"
          title="Preparando el mensaje"
          message="Estamos procesando la respuesta del proveedor."
        />
      }
    >
      <OAuthErrorContent />
    </Suspense>
  );
}

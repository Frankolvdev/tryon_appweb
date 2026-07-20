"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeOAuthCode, getCurrentUser } from "@/lib/auth-api";
import { consumeOAuthReturnTo } from "@/lib/auth-redirect";
import { clearSession, saveSession } from "@/lib/auth-storage";
import { OAuthResultScreen } from "@/components/auth/oauth-result-screen";

type CallbackState = {
  tone: "loading" | "success" | "error" | "warning";
  title: string;
  message: string;
  detail?: string;
};

function friendlyOAuthError(rawMessage: string): CallbackState {
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (normalized.includes("terms and conditions") || normalized.includes("accept the terms")) {
    return {
      tone: "warning",
      title: "Necesitamos tu aceptación",
      message: "Debes aceptar los Términos de uso y la Política de privacidad antes de continuar.",
      detail: "Vuelve al acceso, selecciona las autorizaciones y repite el proceso con Google.",
    };
  }

  if (normalized.includes("administrative accounts") || normalized.includes("administrative account")) {
    return {
      tone: "warning",
      title: "Esta cuenta es administrativa",
      message: "Por seguridad, las cuentas administrativas no pueden vincularse mediante el acceso OAuth público.",
      detail: "Utiliza el acceso protegido del BackOffice con correo, contraseña y MFA.",
    };
  }

  if (normalized.includes("access_denied") || normalized.includes("denied") || normalized.includes("cancel")) {
    return {
      tone: "warning",
      title: "Autorización cancelada",
      message: "Google no concedió autorización para completar el acceso.",
      detail: "No se realizó ningún cambio en tu cuenta. Puedes intentarlo nuevamente cuando estés listo.",
    };
  }

  if (normalized.includes("disabled") || normalized.includes("not available") || normalized.includes("not configured")) {
    return {
      tone: "warning",
      title: "Google no está disponible",
      message: "El proveedor de acceso está temporalmente deshabilitado o todavía no está configurado.",
      detail: "Puedes entrar con correo y contraseña o intentarlo más tarde.",
    };
  }

  if (normalized.includes("state") || normalized.includes("expired") || normalized.includes("invalid code")) {
    return {
      tone: "error",
      title: "La autorización expiró",
      message: "La solicitud de acceso ya no es válida o fue utilizada anteriormente.",
      detail: "Por seguridad debes comenzar nuevamente desde la pantalla de acceso.",
    };
  }

  return {
    tone: "error",
    title: "No pudimos completar el acceso",
    message: "Se produjo un problema al validar tu cuenta con Google.",
    detail: message || "Vuelve a intentarlo desde la pantalla de acceso.",
  };
}

function OAuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<CallbackState>({
    tone: "loading",
    title: "Completando acceso seguro",
    message: "Estamos validando la autorización recibida de Google.",
    detail: "No cierres esta ventana.",
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setState(friendlyOAuthError(errorDescription || error));
      return;
    }

    if (!code) {
      setState({
        tone: "error",
        title: "Respuesta OAuth incompleta",
        message: "No recibimos el código necesario para finalizar el acceso.",
        detail: "Inicia el proceso nuevamente desde la pantalla de acceso.",
      });
      return;
    }

    async function completeOAuth() {
      try {
        const tokens = await exchangeOAuthCode(code!);
        saveSession(tokens.access_token, tokens.refresh_token);
        setState({
          tone: "loading",
          title: "Validando tu cuenta",
          message: "La autorización fue aceptada. Estamos preparando tu sesión.",
          detail: "Esto tomará solo un momento.",
        });
        await getCurrentUser();
        setState({
          tone: "success",
          title: "Acceso completado",
          message: "Tu cuenta fue validada correctamente.",
          detail: "Te estamos redirigiendo a LUXIA.",
        });
        const destination = consumeOAuthReturnTo();
        window.setTimeout(() => {
          router.replace(destination);
          router.refresh();
        }, 850);
      } catch (caught) {
        clearSession();
        setState(friendlyOAuthError(caught instanceof Error ? caught.message : "No fue posible completar el acceso con Google."));
      }
    }

    void completeOAuth();
  }, [params, router]);

  const failed = state.tone === "error" || state.tone === "warning";

  return (
    <OAuthResultScreen
      tone={state.tone}
      title={state.title}
      message={state.message}
      detail={state.detail}
      primaryHref={failed ? "/login" : undefined}
      primaryLabel={failed ? "Volver a iniciar sesión" : undefined}
      secondaryHref={failed ? "/register" : undefined}
      secondaryLabel={failed ? "Crear otra cuenta" : undefined}
    />
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <OAuthResultScreen
          tone="loading"
          title="Completando acceso seguro"
          message="Estamos preparando la validación de tu cuenta."
          detail="No cierres esta ventana."
        />
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getOAuthProviders, startGoogleOAuth } from "@/lib/auth-api";
import { rememberOAuthReturnTo, normalizeReturnTo } from "@/lib/auth-redirect";
import { hasSession } from "@/lib/auth-storage";
import { env } from "@/lib/env";

type SocialProvidersProps = {
  registration?: boolean;
};

export function SocialProviders({ registration = false }: SocialProvidersProps) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOAuthProviders()
      .then(({ providers }) => {
        if (!active) return;
        const google = providers.find((provider) => provider.provider === "google");
        setAvailable(Boolean(google?.available));
      })
      .catch(() => {
        if (active) setAvailable(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function startGoogle() {
    if (loading) return;
    setError("");

    if (hasSession()) {
      window.location.assign(normalizeReturnTo(new URLSearchParams(window.location.search).get("next")));
      return;
    }

    if (!available) {
      setError("Google OAuth todavía no está habilitado en el BackOffice.");
      return;
    }

    if (registration) {
      const accepted = window.confirm(
        "Al continuar con Google confirmas que eres mayor de 18 años y que aceptas los Términos de uso y la Política de privacidad.",
      );
      if (!accepted) return;
    }

    setLoading(true);
    rememberOAuthReturnTo(new URLSearchParams(window.location.search).get("next"));

    try {
      const response = await startGoogleOAuth({
        redirect_uri: `${env.appUrl}/oauth/callback`,
        terms_accepted: registration,
        terms_version: registration ? "v1" : null,
        age_confirmed: registration,
      });
      window.location.assign(response.authorization_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible iniciar el acceso con Google.");
      setLoading(false);
    }
  }

  return (
    <div className="exactSocial" aria-busy={checking || loading}>
      <button type="button" onClick={startGoogle} disabled={checking || loading || !available}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/>
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"/>
          <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-4V7.4H3.2a10 10 0 0 0 0 9.2L6.5 14Z"/>
          <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.8 5.4L6.5 10A5.8 5.8 0 0 1 12 6Z"/>
        </svg>
        <span>{loading ? "Conectando con Google…" : checking ? "Comprobando Google…" : "Continuar con Google"}</span>
      </button>
      {error && <p className="exactSocialError" role="alert">{error}</p>}
      <div><span>o continúa con correo</span></div>
    </div>
  );
}

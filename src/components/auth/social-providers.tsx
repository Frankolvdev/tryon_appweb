"use client";

import { env } from "@/lib/env";

export function SocialProviders() {
  const startGoogle = () => {
    if (!env.googleOAuthStartUrl) {
      window.alert("Google OAuth aún no está configurado. Completa NEXT_PUBLIC_GOOGLE_OAUTH_START_URL siguiendo GOOGLE_OAUTH_SETUP.md.");
      return;
    }
    const returnTo = encodeURIComponent(`${env.appUrl}/oauth/callback`);
    const separator = env.googleOAuthStartUrl.includes("?") ? "&" : "?";
    window.location.assign(`${env.googleOAuthStartUrl}${separator}return_to=${returnTo}`);
  };

  return (
    <div className="socialGroup">
      <button type="button" className="socialButton googleButton" onClick={startGoogle}>
        <span className="googleGlyph">G</span> Continuar con Google
      </button>
      <div className="futureProviders" aria-label="Proveedores preparados para futuras integraciones">
        <button type="button" disabled title="Próximamente: Apple">●</button>
        <button type="button" disabled title="Próximamente: GitHub">⌘</button>
        <button type="button" disabled title="Próximamente: Facebook">f</button>
        <span>Más opciones próximamente</span>
      </div>
    </div>
  );
}

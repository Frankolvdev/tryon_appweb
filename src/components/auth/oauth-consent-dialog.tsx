"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OAuthConsentDialogProps = {
  open: boolean;
  providerName: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function OAuthConsentDialog({
  open,
  providerName,
  loading = false,
  onCancel,
  onConfirm,
}: OAuthConsentDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    if (!open) {
      setTermsAccepted(false);
      setPrivacyAccepted(false);
      setAgeConfirmed(false);
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  const canContinue = termsAccepted && privacyAccepted && ageConfirmed && !loading;

  return (
    <div className="oauthConsentBackdrop" role="presentation" onMouseDown={() => !loading && onCancel()}>
      <section
        className="oauthConsentDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oauth-consent-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="oauthConsentClose"
          aria-label="Cerrar"
          onClick={onCancel}
          disabled={loading}
        >
          ×
        </button>

        <div className="oauthConsentIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <span className="oauthConsentEyebrow">ACCESO SEGURO</span>
        <h2 id="oauth-consent-title">Antes de continuar con {providerName}</h2>
        <p>
          Necesitamos tu autorización para crear o iniciar tu cuenta y mantener un registro válido de aceptación.
        </p>

        <div className="oauthConsentChecks">
          <label>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              disabled={loading}
            />
            <span>
              He leído y acepto los <Link href="/terms" target="_blank">Términos de uso</Link>.
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              disabled={loading}
            />
            <span>
              He leído y acepto la <Link href="/privacy" target="_blank">Política de privacidad</Link>.
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(event) => setAgeConfirmed(event.target.checked)}
              disabled={loading}
            />
            <span>Confirmo que tengo al menos 18 años.</span>
          </label>
        </div>

        <div className="oauthConsentActions">
          <button type="button" className="oauthConsentSecondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="oauthConsentPrimary"
            onClick={onConfirm}
            disabled={!canContinue}
          >
            {loading ? "Conectando…" : `Continuar con ${providerName}`}
          </button>
        </div>

        <small>Tu contraseña de {providerName} nunca se comparte con LUXIA.</small>
      </section>
    </div>
  );
}

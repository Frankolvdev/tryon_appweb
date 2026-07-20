import Link from "next/link";

type OAuthResultTone = "loading" | "success" | "error" | "warning";

type OAuthResultScreenProps = {
  tone: OAuthResultTone;
  eyebrow?: string;
  title: string;
  message: string;
  detail?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function OAuthResultScreen({
  tone,
  eyebrow = "AUTENTICACIÓN OAUTH",
  title,
  message,
  detail,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: OAuthResultScreenProps) {
  return (
    <main className="oauthResultPage">
      <div className="oauthResultAmbient oauthResultAmbientOne" />
      <div className="oauthResultAmbient oauthResultAmbientTwo" />

      <section className={`oauthResultCard oauthResultCard--${tone}`} aria-live="polite">
        <div className="oauthResultBrand">
          <span className="oauthResultBrandMark">L</span>
          <strong>LUXIA</strong>
        </div>

        <div className="oauthResultIcon" aria-hidden="true">
          {tone === "loading" && <span className="oauthResultSpinner" />}
          {tone === "success" && <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>}
          {tone === "warning" && <svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>}
          {tone === "error" && <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>}
        </div>

        <span className="oauthResultEyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{message}</p>
        {detail && <div className="oauthResultDetail">{detail}</div>}

        {(primaryHref || secondaryHref) && (
          <div className="oauthResultActions">
            {primaryHref && primaryLabel && <Link className="oauthResultPrimary" href={primaryHref}>{primaryLabel}</Link>}
            {secondaryHref && secondaryLabel && <Link className="oauthResultSecondary" href={secondaryHref}>{secondaryLabel}</Link>}
          </div>
        )}

        <small>Acceso protegido y procesado de forma segura.</small>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./recovery-auth.module.css";

function Sparkles() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.15 3.85A4.55 4.55 0 0 1 7.8 9.9L4 11l3.8 1.1a4.55 4.55 0 0 1 3.05 3.05L12 19l1.15-3.85a4.55 4.55 0 0 1 3.05-3.05L20 11l-3.8-1.1a4.55 4.55 0 0 1-3.05-3.05L12 3Z" />
      <path d="m19 3-.4 1.35L17.25 4.75l1.35.4L19 6.5l.4-1.35 1.35-.4-1.35-.4L19 3Z" />
    </svg>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z" />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Activity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function Database() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}

const security = [
  { icon: <Shield />, label: "Cuenta protegida" },
  { icon: <Lock />, label: "Sesión segura" },
  { icon: <Activity />, label: "Procesamiento privado" },
  { icon: <Database />, label: "Datos en tiempo real" },
];

export function RecoveryAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.root}>
      <div className={styles.grid} />
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <section className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}><Sparkles /></span>
          <span>
            <strong>LUXIA</strong>
            <small>AI Fashion Studio</small>
          </span>
        </div>

        <div className={styles.hero}>
          <span className={styles.heroIcon}><Sparkles /></span>
          <p className={styles.kicker}>Estudio creativo</p>
          <h1>Inteligencia,<br />estilo y creatividad.</h1>
          <p className={styles.heroText}>
            Transforma fotografías y prendas en experiencias visuales únicas
            desde una plataforma privada diseñada para crear.
          </p>

          <div className={styles.securityGrid}>
            {security.map((item) => (
              <div className={styles.securityItem} key={item.label}>
                <span>{item.icon}</span>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.copyright}>© 2026 LUXIA. Todos los derechos reservados.</p>
      </section>

      <section className={styles.right}>
        <div className={styles.mobileBrand}>
          <span className={styles.brandIcon}><Sparkles /></span>
          <span>
            <strong>LUXIA</strong>
            <small>AI Fashion Studio</small>
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardBrand}>
            <span className={styles.cardLogo}><Sparkles /></span>
            <strong>LUXIA</strong>
            <small>AI Fashion Studio</small>
          </div>

          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
          <p className={styles.description}>{description}</p>

          {children}

          <div className={styles.footerNote}>
            <Lock />
            <p>
              Tu sesión y tus operaciones quedan protegidas por los controles
              de seguridad de la plataforma.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./password-recovery.module.css";

function SecurityVisual() {
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.ring} />
      <div className={styles.ringTwo} />
      <div className={styles.ringThree} />
      <div className={styles.shield}><div className={styles.lock} /></div>
    </div>
  );
}

export function PasswordRecoveryLayout({
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
    <main className={styles.page}>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <section className={styles.shell}>
        <aside className={styles.brandSide}>
          <Link href="/login" className={styles.brand}>
            <span className={styles.brandMark}>L</span>
            <span>
              <span className={styles.brandName}>LUXIA</span>
              <span className={styles.brandSub}>AI Fashion Studio</span>
            </span>
          </Link>

          <div>
            <SecurityVisual />
            <div className={styles.brandContent}>
              <h2>Tu creatividad sigue siendo solo tuya.</h2>
              <p>
                Recupera el acceso mediante un enlace temporal, protegido y de
                un solo uso. Nunca te pediremos tu contraseña actual por correo.
              </p>
            </div>
          </div>

          <div className={styles.trustRow}>
            <div className={styles.trustItem}><b>◇</b><strong>Enlace temporal</strong><span>Caduca automáticamente.</span></div>
            <div className={styles.trustItem}><b>◎</b><strong>Un solo uso</strong><span>No puede reutilizarse.</span></div>
            <div className={styles.trustItem}><b>⌁</b><strong>Sesión protegida</strong><span>Cierra accesos anteriores.</span></div>
          </div>
        </aside>

        <section className={styles.formSide}>
          <div className={styles.formInner}>
            <div className={styles.step}><span className={styles.stepDot} />{eyebrow}</div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
            {children}
          </div>
        </section>
      </section>
    </main>
  );
}

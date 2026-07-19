import type { ReactNode } from "react";

const securityItems = [
  { icon: "shield", label: "Privacidad protegida" },
  { icon: "lock", label: "Sesión segura" },
  { icon: "activity", label: "Procesamiento privado" },
  { icon: "database", label: "Resultados en tiempo real" },
] as const;

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "sparkles") return <svg {...props}><path d="m12 3-1.3 5.2L5.5 9.5l5.2 1.3L12 16l1.3-5.2 5.2-1.3-5.2-1.3L12 3Z"/><path d="m19 15-.7 2.3L16 18l2.3.7L19 21l.7-2.3L22 18l-2.3-.7L19 15Z"/><path d="M5 3v4M3 5h4"/></svg>;
  if (name === "shield") return <svg {...props}><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "lock") return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  if (name === "activity") return <svg {...props}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
  return <svg {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/></svg>;
}

export function AuthShell({ title, description, children }: { eyebrow?: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="boAuthRoot">
      <div className="boAuthGrid" />
      <div className="boAuthGlow boAuthGlowTop" />
      <div className="boAuthGlow boAuthGlowBottom" />
      <div className="boAuthLayout">
        <section className="boAuthHero">
          <div>
            <div className="boAuthBrand">
              <div className="boAuthBrandMark"><Icon name="sparkles" size={24}/></div>
              <div><p>LUXIA</p><span>AI Fashion Studio</span></div>
            </div>
            <div className="boAuthHeroCopy">
              <p className="boAuthEyebrow">ESTUDIO CREATIVO</p>
              <h1>Imagina,<br/>crea y transforma.</h1>
              <p>Convierte tus fotografías y prendas en nuevas experiencias visuales desde una plataforma creativa y segura.</p>
            </div>
          </div>
          <div className="boAuthFeatures">
            {securityItems.map((item) => <div key={item.label}><Icon name={item.icon} size={17}/><span>{item.label}</span></div>)}
          </div>
        </section>
        <section className="boAuthFormArea">
          <div className="boAuthFormWrap">
            <div className="boAuthMobileBrand">
              <div className="boAuthBrandMark"><Icon name="sparkles" size={22}/></div>
              <div><p>LUXIA</p><span>AI FASHION STUDIO</span></div>
            </div>
            <div className="boAuthCard">
              <div className="boAuthLock"><Icon name="lock" size={23}/></div>
              <p className="boAuthAccess">ACCESO DE USUARIO</p>
              <h2>{title}</h2>
              <p className="boAuthLead">{description}</p>
              {children}
            </div>
            <p className="boAuthFootnote">Tu sesión y tus operaciones quedan protegidas por los controles de seguridad de la plataforma.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

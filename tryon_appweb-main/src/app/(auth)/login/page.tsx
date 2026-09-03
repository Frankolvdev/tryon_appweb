import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Acceso de usuario" };

const securityItems = [
  { icon: "shield", label: "Cuenta protegida" },
  { icon: "lock", label: "Sesión segura" },
  { icon: "activity", label: "Procesamiento privado" },
  { icon: "database", label: "Datos en tiempo real" },
] as const;

function Icon({ name, size = 17 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "sparkles") return <svg {...common}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0Z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>;
  if (name === "lock") return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "activity") return <svg {...common}><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>;
  return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>;
}

export default function LoginPage() {
  return (
    <main className="exactAuthRoot">
      <div className="exactGrid" />
      <div className="exactGlow exactGlowTop" />
      <div className="exactGlow exactGlowBottom" />
      <div className="exactAuthLayout">
        <section className="exactHero">
          <div>
            <div className="exactBrand">
              <div className="luxia-red-glow exactBrandIcon"><Icon name="sparkles" size={24} /></div>
              <div><p className="exactBrandName">LUXIA</p><p className="exactBrandSubtitle">AI Fashion Studio</p></div>
            </div>
            <div className="exactHeroCopy">
              <p className="exactKicker">Estudio creativo</p>
              <h1 className="luxia-text-gradient">Inteligencia,<br />estilo y creatividad.</h1>
              <p>Transforma fotografías y prendas en experiencias visuales únicas desde una plataforma privada diseñada para crear.</p>
            </div>
          </div>
          <div className="exactSecurityGrid">
            {securityItems.map((item) => <div key={item.label} className="exactSecurityItem"><Icon name={item.icon} /><span>{item.label}</span></div>)}
          </div>
        </section>
        <section className="exactFormSection">
          <div className="exactFormColumn">
            <div className="exactMobileBrand">
              <div className="luxia-red-glow exactMobileBrandIcon"><Icon name="sparkles" size={22} /></div>
              <div><p>LUXIA</p><small>AI Fashion Studio</small></div>
            </div>
            <div className="luxia-panel exactCard">
              <div className="exactLockIcon"><Icon name="lock" size={23} /></div>
              <p className="exactAccessLabel">Acceso de usuario</p>
              <h2>Bienvenido de nuevo</h2>
              <p className="exactCardDescription">Accede a tu estudio creativo para continuar generando y administrando tus looks.</p>
              <LoginForm />
            </div>
            <p className="exactAuditText">Tu sesión y tus operaciones quedan protegidas por los controles de seguridad de la plataforma.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

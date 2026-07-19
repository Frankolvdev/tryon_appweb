"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/lib/auth-api";
import { SocialProviders } from "@/components/auth/social-providers";

function SvgIcon({ type }: { type: "user" | "mail" | "lock" | "eye" | "eyeoff" | "alert" }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "user") return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if (type === "mail") return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (type === "lock") return <svg {...props}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (type === "alert") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>;
  if (type === "eyeoff") return <svg {...props}><path d="m3 3 18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a16 16 0 0 1-2.1 2.6M6.6 6.6C4.3 8 3 10 3 10s3.5 5 9 5a10 10 0 0 0 3.4-.6"/></svg>;
  return <svg {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (fullName.length < 2) { setError("Ingresa tu nombre completo."); return; }
    if (!email) { setError("Ingresa tu correo electrónico."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Ingresa un correo electrónico válido."); return; }
    if (!password) { setError("Crea una contraseña."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (!data.get("terms")) { setError("Debes aceptar los términos y la política de privacidad."); return; }

    setLoading(true);
    try {
      await register({ full_name: fullName, email, password, accept_terms: true });
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SocialProviders />
      <form className="exactLoginForm exactRegisterForm" onSubmit={submit} noValidate>
        {error && <div className="exactError" role="alert"><SvgIcon type="alert"/><p>{error}</p></div>}

        <div>
          <label htmlFor="fullName">Nombre completo</label>
          <div className="exactInput">
            <span><SvgIcon type="user"/></span>
            <input id="fullName" name="fullName" autoComplete="name" required placeholder="Tu nombre" disabled={loading}/>
          </div>
        </div>

        <div>
          <label htmlFor="registerEmail">Correo electrónico</label>
          <div className="exactInput">
            <span><SvgIcon type="mail"/></span>
            <input id="registerEmail" name="email" type="email" autoComplete="email" required placeholder="usuario@correo.com" disabled={loading}/>
          </div>
        </div>

        <div>
          <div className="exactLabelRow"><label htmlFor="registerPassword">Contraseña</label><small>Mínimo 8 caracteres</small></div>
          <div className="exactInput">
            <span><SvgIcon type="lock"/></span>
            <input id="registerPassword" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="••••••••••••" disabled={loading}/>
            <button type="button" className="exactEye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><SvgIcon type={showPassword ? "eyeoff" : "eye"}/></button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <div className="exactInput">
            <span><SvgIcon type="lock"/></span>
            <input id="confirmPassword" name="confirmPassword" type={showConfirmation ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="••••••••••••" disabled={loading}/>
            <button type="button" className="exactEye" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Ocultar contraseña" : "Mostrar contraseña"}><SvgIcon type={showConfirmation ? "eyeoff" : "eye"}/></button>
          </div>
        </div>

        <label className="exactTerms">
          <input name="terms" type="checkbox" disabled={loading}/>
          <span>Acepto los <Link href="/terms">Términos de uso</Link> y la <Link href="/privacy">Política de privacidad</Link>.</span>
        </label>

        <button className="exactSubmit" disabled={loading}>{loading ? "Creando cuenta…" : "Crear mi cuenta"}</button>
      </form>
      <p className="exactSwitch">¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p>
    </>
  );
}

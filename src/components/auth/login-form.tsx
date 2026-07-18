"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth-api";
import { saveSession } from "@/lib/auth-storage";
import { SocialProviders } from "@/components/auth/social-providers";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const token = await login(String(data.get("email")), String(data.get("password")));
      saveSession(token.access_token, token.refresh_token);
      router.replace("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "No fue posible iniciar sesión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="authCard">
      <div className="formHeading"><span className="eyebrow">Bienvenido de vuelta</span><h2>Entra a tu estudio</h2><p>Continúa creando looks que antes solo podías imaginar.</p></div>
      <SocialProviders />
      <div className="divider"><span>o usa tu correo</span></div>
      <form onSubmit={submit} className="authForm">
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••" /></label>
        <div className="formMeta"><label className="checkLabel"><input type="checkbox" /> Recordarme</label><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></div>
        {error && <p className="formError" role="alert">{error}</p>}
        <button className="primaryButton" disabled={loading}>{loading ? "Entrando…" : "Entrar a TryOn"}</button>
      </form>
      <p className="switchAuth">¿Aún no tienes cuenta? <Link href="/register">Crear cuenta</Link></p>
    </div>
  );
}

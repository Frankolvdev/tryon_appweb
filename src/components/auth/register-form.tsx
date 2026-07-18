"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/lib/auth-api";
import { env } from "@/lib/env";
import { SocialProviders } from "@/components/auth/social-providers";

export function RegisterForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) return setError("Las contraseñas no coinciden.");
    if (!data.get("terms")) return setError("Debes aceptar los términos y la política de privacidad.");
    setLoading(true);
    try { await register({ full_name: String(data.get("fullName")), email: String(data.get("email")), password: String(data.get("password")) }); router.push("/login?registered=1"); }
    catch (err) { setError(err instanceof Error ? err.message : "No fue posible crear la cuenta."); }
    finally { setLoading(false); }
  }
  return (
    <div className="authCard">
      <div className="formHeading"><span className="eyebrow">Tu próximo look comienza aquí</span><h2>Crea tu cuenta</h2><p>Un espacio personal para explorar, generar y guardar tus resultados.</p></div>
      <SocialProviders /><div className="divider"><span>o regístrate con correo</span></div>
      <form onSubmit={submit} className="authForm">
        <label>Nombre<input name="fullName" autoComplete="name" required placeholder="Tu nombre" /></label>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" /></label>
        <div className="twoCols"><label>Contraseña<input name="password" type="password" autoComplete="new-password" required minLength={8} /></label><label>Confirmar<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></label></div>
        <label className="checkLabel terms"><input name="terms" type="checkbox" /> Acepto los <a href={`${env.landingUrl}/terms`} target="_blank">Términos</a> y la <a href={`${env.landingUrl}/privacy`} target="_blank">Política de privacidad</a>.</label>
        {error && <p className="formError" role="alert">{error}</p>}
        <button className="primaryButton" disabled={loading}>{loading ? "Creando cuenta…" : "Crear mi espacio"}</button>
      </form>
      <p className="switchAuth">¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p>
    </div>
  );
}

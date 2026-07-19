"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "@/lib/auth-api";
import { SocialProviders } from "@/components/auth/social-providers";

function UserIcon(){return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>}
function MailIcon(){return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>}
function LockIcon(){return <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}

export function RegisterForm(){
 const router=useRouter();const[loading,setLoading]=useState(false);const[error,setError]=useState("");
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError("");const data=new FormData(event.currentTarget);if(data.get("password")!==data.get("confirmPassword"))return setError("Las contraseñas no coinciden.");if(!data.get("terms"))return setError("Debes aceptar los términos y la política de privacidad.");setLoading(true);try{await register({full_name:String(data.get("fullName")),email:String(data.get("email")),password:String(data.get("password"))});router.push("/login?registered=1")}catch(err){setError(err instanceof Error?err.message:"No fue posible crear la cuenta.")}finally{setLoading(false)}}
 return <>
  <SocialProviders/>
  <form className="luxiaAuthForm" onSubmit={submit}>
   {error&&<div className="luxiaAuthError" role="alert">{error}</div>}
   <label className="luxiaAuthField"><span>Nombre completo</span><div className="luxiaAuthInput"><i><UserIcon/></i><input name="fullName" required placeholder="Tu nombre"/></div></label>
   <label className="luxiaAuthField"><span>Correo electrónico</span><div className="luxiaAuthInput"><i><MailIcon/></i><input name="email" type="email" autoComplete="email" required placeholder="usuario@correo.com"/></div></label>
   <div className="luxiaRegisterTwoCols">
    <label className="luxiaAuthField"><span>Contraseña</span><div className="luxiaAuthInput"><i><LockIcon/></i><input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="••••••••"/></div></label>
    <label className="luxiaAuthField"><span>Confirmar</span><div className="luxiaAuthInput"><i><LockIcon/></i><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="••••••••"/></div></label>
   </div>
   <label className="luxiaAuthTerms"><input name="terms" type="checkbox"/><span>Acepto los <Link href="/terms">Términos</Link> y la <Link href="/privacy">Política de privacidad</Link>.</span></label>
   <button className="luxiaAuthSubmit" disabled={loading}>{loading?"Creando cuenta…":"Crear cuenta"}</button>
  </form>
  <p className="luxiaAuthSwitch">¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p>
 </>
}

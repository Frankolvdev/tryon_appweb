import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { RecoveryAuthShell } from "@/components/auth/recovery-auth-shell";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function ForgotPasswordPage() {
  return (
    <RecoveryAuthShell
      eyebrow="Recuperación de acceso"
      title="Recupera tu cuenta"
      description="Escribe el correo asociado a tu cuenta y te enviaremos un enlace seguro."
    >
      <ForgotPasswordForm />
    </RecoveryAuthShell>
  );
}

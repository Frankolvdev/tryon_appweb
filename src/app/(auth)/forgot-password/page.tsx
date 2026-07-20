import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recupera el acceso"
      title="Restablece tu contraseña."
      description="Te enviaremos un enlace privado y temporal para recuperar tu cuenta sin perder tus creaciones."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

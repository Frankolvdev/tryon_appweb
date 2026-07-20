import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recupera tu cuenta"
      description="Escribe el correo asociado a tu cuenta y te enviaremos un enlace seguro para crear una nueva contraseña."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

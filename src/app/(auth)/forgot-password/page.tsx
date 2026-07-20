import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PasswordRecoveryLayout } from "@/components/auth/password-recovery-layout";

export default function ForgotPasswordPage() {
  return (
    <PasswordRecoveryLayout
      eyebrow="RECUPERACIÓN DE ACCESO"
      title="Recupera tu cuenta"
      description="Escribe el correo asociado a tu cuenta y te enviaremos un enlace seguro para crear una nueva contraseña."
    >
      <ForgotPasswordForm />
    </PasswordRecoveryLayout>
  );
}

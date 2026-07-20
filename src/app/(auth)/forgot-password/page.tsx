import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PasswordRecoveryLayout } from "@/components/auth/password-recovery-layout";

export default function ForgotPasswordPage() {
  return (
    <PasswordRecoveryLayout
      eyebrow="Recuperación segura"
      title="Vuelve a entrar."
      description="Escribe el correo asociado a tu cuenta. Te enviaremos un enlace privado para crear una nueva contraseña."
    >
      <ForgotPasswordForm />
    </PasswordRecoveryLayout>
  );
}

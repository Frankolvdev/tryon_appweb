import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; otp?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Seguridad"
      title="Crea una nueva contraseña."
      description="Elige una contraseña segura. Al confirmarla, cerraremos las sesiones anteriores de tu cuenta."
    >
      <ResetPasswordForm email={params.email ?? ""} token={params.token} otp={params.otp} />
    </AuthShell>
  );
}

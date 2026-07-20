import { PasswordRecoveryLayout } from "@/components/auth/password-recovery-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; otp?: string }>;
}) {
  const params = await searchParams;

  return (
    <PasswordRecoveryLayout
      eyebrow="NUEVA CONTRASEÑA"
      title="Protege nuevamente tu cuenta"
      description="Crea una contraseña segura y diferente a las que hayas utilizado anteriormente."
    >
      <ResetPasswordForm
        email={(params.email ?? "").trim().toLowerCase()}
        token={params.token}
        otp={params.otp}
      />
    </PasswordRecoveryLayout>
  );
}

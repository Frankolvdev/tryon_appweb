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
      eyebrow="Nueva contraseña"
      title="Protege tu cuenta."
      description="Crea una contraseña fuerte y diferente a las anteriores. El enlace dejará de funcionar después de usarlo."
    >
      <ResetPasswordForm
        email={params.email ?? ""}
        token={params.token}
        otp={params.otp}
      />
    </PasswordRecoveryLayout>
  );
}

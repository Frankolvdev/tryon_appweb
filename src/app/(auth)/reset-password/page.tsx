import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { RecoveryAuthShell } from "@/components/auth/recovery-auth-shell";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    token?: string;
    otp?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <RecoveryAuthShell
      eyebrow="Nueva contraseña"
      title="Protege nuevamente tu cuenta"
      description="Crea una contraseña segura y diferente a las que hayas utilizado anteriormente."
    >
      <ResetPasswordForm
        email={(params.email ?? "").trim().toLowerCase()}
        token={params.token}
        otp={params.otp}
      />
    </RecoveryAuthShell>
  );
}

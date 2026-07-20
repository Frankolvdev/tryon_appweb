import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

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
    <AuthShell
      title="Crea una nueva contraseña"
      description="Protege nuevamente tu cuenta con una contraseña segura y diferente a las anteriores."
    >
      <ResetPasswordForm
        email={(params.email ?? "").trim().toLowerCase()}
        token={params.token}
        otp={params.otp}
      />
    </AuthShell>
  );
}

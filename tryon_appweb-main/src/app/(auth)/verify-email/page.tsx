import { VerificationPending } from "@/components/auth/verification-pending";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email = "" } = await searchParams;

  return (
    <main className="exactAuthRoot verificationRoot">
      <section className="verificationContainer">
        <VerificationPending email={email.trim().toLowerCase()} />
      </section>
    </main>
  );
}

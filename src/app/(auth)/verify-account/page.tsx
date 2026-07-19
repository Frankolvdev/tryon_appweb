import { VerifyAccountResult } from "@/components/auth/verify-account-result";

type Props = {
  searchParams: Promise<{ email?: string; token?: string; purpose?: string }>;
};

export default async function VerifyAccountPage({ searchParams }: Props) {
  const { email = "", token = "" } = await searchParams;

  return (
    <main className="exactAuthRoot verificationRoot">
      <section className="verificationContainer">
        <VerifyAccountResult email={email.trim().toLowerCase()} token={token} />
      </section>
    </main>
  );
}

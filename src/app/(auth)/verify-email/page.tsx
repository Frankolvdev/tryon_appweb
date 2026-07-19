import Link from "next/link";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <main className="exactAuthRoot">
      <section className="exactAuthContainer exactVerifyContainer">
        <div className="exactAuthCard exactVerifyCard">
          <div className="exactAuthIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>

          <p className="exactEyebrow">VERIFICACIÓN DE CUENTA</p>
          <h1>Revisa tu correo</h1>
          <p className="exactVerifyText">
            Enviamos las instrucciones de verificación
            {email ? <> a <strong>{email}</strong></> : null}. Abre el enlace del mensaje para activar tu cuenta.
          </p>

          <div className="exactVerifyNotice">
            Revisa también las carpetas de spam, promociones o correo no deseado.
          </div>

          <Link className="exactSubmit exactVerifyButton" href="/login">
            Volver a iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}

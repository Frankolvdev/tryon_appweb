import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050505", color: "#f5f5f5" }}>
      <section style={{ textAlign: "center" }}>
        <p style={{ color: "#e11d35", fontWeight: 800 }}>404</p>
        <h1>Página no encontrada</h1>
        <p style={{ color: "#a0a0a7" }}>La ruta solicitada no existe o ya no está disponible.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "12px 18px", borderRadius: 12, background: "#a5091d", color: "white", fontWeight: 700 }}>
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

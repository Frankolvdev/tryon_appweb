"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050505", color: "#f5f5f5" }}>
          <section style={{ width: "min(560px, 100%)", padding: 28, border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, background: "#0d0d0e" }}>
            <p style={{ margin: 0, color: "#e11d35", fontWeight: 700 }}>LUXIA</p>
            <h1 style={{ marginBottom: 8 }}>Ocurrió un error inesperado</h1>
            <p style={{ color: "#a0a0a7", lineHeight: 1.6 }}>La aplicación no pudo completar esta operación. Tus datos no se han enviado de nuevo automáticamente.</p>
            <button type="button" onClick={reset} style={{ marginTop: 16, padding: "12px 18px", border: 0, borderRadius: 12, background: "#a5091d", color: "white", fontWeight: 700 }}>
              Intentar nuevamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

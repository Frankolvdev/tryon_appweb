import Link from "next/link";

export function SectionPlaceholder({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: string }) {
  return (
    <div className="sectionPage pageEnter">
      <header className="sectionHeader"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>
      <section className="moduleCanvas">
        <div className="moduleGlyph" aria-hidden="true">{icon}</div>
        <span className="statusPill">MÓDULO EN CONSTRUCCIÓN</span>
        <h2>Esta sección será conectada al backend en su módulo correspondiente.</h2>
        <p>No se muestran datos simulados ni acciones falsas. La navegación ya está preparada para recibir la implementación funcional.</p>
        <Link href="/dashboard" className="secondaryButton">Volver al inicio</Link>
      </section>
    </div>
  );
}

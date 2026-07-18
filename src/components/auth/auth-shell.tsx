import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="authPage">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />
      <section className="authVisual">
        <Brand />
        <div className="visualCopy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="visualPreview" aria-hidden="true">
            <div className="previewCard previewBack" />
            <div className="previewCard previewFront"><span>AI</span><strong>Tu estilo. Reinventado.</strong></div>
          </div>
        </div>
        <p className="authFootnote">Experiencia privada · Procesamiento seguro · Resultados únicos</p>
      </section>
      <section className="authPanel">{children}</section>
    </main>
  );
}

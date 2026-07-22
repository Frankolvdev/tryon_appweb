import Link from "next/link";

/**
 * Compatibility component retained for old imports.
 * The canonical history is the unified generation execution history.
 */
export function HistoryList() {
  return (
    <div className="historyState">
      <span className="moduleGlyph">✦</span>
      <h2>Historial unificado</h2>
      <p>Todos tus trabajos de IA, sin importar el módulo o proveedor, están reunidos en un solo lugar.</p>
      <Link className="primaryButton emptyAction" href="/generation/history">
        Ver Trabajos IA
      </Link>
    </div>
  );
}

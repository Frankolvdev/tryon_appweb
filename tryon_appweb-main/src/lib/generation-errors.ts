export function normalizeGenerationError(error: unknown): string {
  if (!(error instanceof Error)) return "No se pudo completar la operación de generación.";
  const text = error.message.toLowerCase();
  if (text.includes("maximum number of active")) return "Ya tienes el máximo de generaciones activas. Espera a que termine una o cancélala desde tu historial.";
  if (text.includes("not available to end users")) return "Ese motor de ejecución no está disponible para usuarios finales.";
  if (text.includes("generation module is inactive")) return "Este módulo ya no está disponible.";
  return error.message;
}

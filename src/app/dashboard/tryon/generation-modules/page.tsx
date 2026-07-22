import { redirect } from "next/navigation";

/**
 * Compatibility route kept for links created by earlier incremental packages.
 * Generation Modules are managed in BackOffice; AppWeb users generate content
 * from the authenticated generation studio at /generation.
 */
export default function LegacyGenerationModulesPage(): never {
  redirect("/generation");
}

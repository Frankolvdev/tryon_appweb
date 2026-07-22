import { redirect } from "next/navigation";

/**
 * Compatibility route left by an earlier BackOffice-oriented package.
 * Generation Modules belong to the authenticated AppWeb area at /generation.
 */
export default function LegacyGenerationModulesPage(): never {
  redirect("/generation");
}

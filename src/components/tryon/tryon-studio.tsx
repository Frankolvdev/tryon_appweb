import { GenerationStudio } from "@/components/generation/generation-studio";

/**
 * Compatibility wrapper for the former Try-On screen.
 * All AI executions now go through the unified generation-module pipeline.
 */
export function TryOnStudio() {
  return <GenerationStudio />;
}

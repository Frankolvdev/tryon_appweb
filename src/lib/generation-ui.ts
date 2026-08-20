import type { GenerationModule } from "@/types/generation";

export type GenerationAppWebMode = "automatic" | "managed";

export function generationAppWebMode(module: GenerationModule): GenerationAppWebMode {
  return module.metadata?.appweb_mode === "managed" ? "managed" : "automatic";
}

export function generationTabTitle(module: GenerationModule): string {
  const configured = module.metadata?.appweb_tab_title;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  return module.name;
}

export function automaticGenerationModules(modules: GenerationModule[]): GenerationModule[] {
  return modules.filter((module) => generationAppWebMode(module) === "automatic");
}

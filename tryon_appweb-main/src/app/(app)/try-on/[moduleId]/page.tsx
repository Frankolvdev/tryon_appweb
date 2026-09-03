import { GenerationStudio } from "@/components/generation/generation-studio";

export default async function GenerationModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const parsed = Number(moduleId);
  return <GenerationStudio moduleId={Number.isInteger(parsed) && parsed > 0 ? parsed : null} />;
}

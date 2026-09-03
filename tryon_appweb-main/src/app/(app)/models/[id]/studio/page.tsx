import { FinalModelStudio } from "@/components/models/final-model-studio";

export default async function ModelStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FinalModelStudio modelId={Number(id)} />;
}

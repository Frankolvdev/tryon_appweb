import { ModelStudio } from "@/components/models/model-studio";
export default async function ModelPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ModelStudio modelId={Number(id)}/>;}

import { FaceStudio } from "@/components/models/face-studio";
export default async function FaceModelPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <FaceStudio modelId={Number(id)}/>;}

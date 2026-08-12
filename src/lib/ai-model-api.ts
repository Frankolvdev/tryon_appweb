import { apiFetch } from "@/lib/api";
import type { AiModelProfile, BodyVariantCatalog, BubbleButtVariantCatalog, ModelSex } from "@/types/ai-model";
export const listAiModels=()=>apiFetch<AiModelProfile[]>("/api/v1/ai-models/");
export const createAiModel=(name:string,sex:ModelSex)=>apiFetch<AiModelProfile>("/api/v1/ai-models/",{method:"POST",body:JSON.stringify({name,sex})});
export const getAiModel=(id:number)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}`);
export const listBodyVariants=(sex:ModelSex)=>apiFetch<BodyVariantCatalog>(`/api/v1/ai-models/body-variants?sex=${sex}`);
export const setAiModelBody=(id:number,presetId:number)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}/body`,{method:"PUT",body:JSON.stringify({body_proportion_preset_id:presetId})});

export const listBubbleButtVariants=(presetId:number)=>apiFetch<BubbleButtVariantCatalog>(`/api/v1/ai-models/body-variants/${presetId}/bubble-butt`);

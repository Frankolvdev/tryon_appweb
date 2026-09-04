import { apiFetch } from "@/lib/api";
import type { AiModelProfile, BodyVariantCatalog, BubbleButtVariantCatalog, ModelSex } from "@/types/ai-model";
export const listAiModels=()=>apiFetch<AiModelProfile[]>("/api/v1/ai-models/");
export const createAiModel=(name:string,sex:ModelSex)=>apiFetch<AiModelProfile>("/api/v1/ai-models/",{method:"POST",body:JSON.stringify({name,sex})});
export const getAiModel=(id:number)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}`);
export const listBodyVariants=(sex:ModelSex)=>apiFetch<BodyVariantCatalog>(`/api/v1/ai-models/body-variants?sex=${sex}`);
export const setAiModelBody=(id:number,presetId:number,bubbleButtPresetId:number)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}/body`,{method:"PUT",body:JSON.stringify({body_proportion_preset_id:presetId,bubble_butt_preset_id:bubbleButtPresetId})});

export const listBubbleButtVariants=(presetId:number)=>apiFetch<BubbleButtVariantCatalog>(`/api/v1/ai-models/body-variants/${presetId}/bubble-butt`);

export const saveAiModelDraft=(id:number,draft:Record<string,unknown>,name?:string)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}/draft`,{method:"PUT",body:JSON.stringify({draft,name})});
export const finalizeAiModel=(
  id:number,
  executionId:string,
  storageFileId:number,
  primaryOutputId?:number,
  identityFaceStorageFileId?:number,
  identityFaceOutputId?:number,
)=>apiFetch<AiModelProfile>(`/api/v1/ai-models/${id}/finalize`,{
  method:"PUT",
  body:JSON.stringify({
    execution_id:executionId,
    storage_file_id:storageFileId,
    primary_output_id:primaryOutputId,
    identity_face_storage_file_id:identityFaceStorageFileId,
    identity_face_output_id:identityFaceOutputId,
  }),
});
export const deleteAiModel=(id:number)=>apiFetch<void>(`/api/v1/ai-models/${id}`,{method:"DELETE"});


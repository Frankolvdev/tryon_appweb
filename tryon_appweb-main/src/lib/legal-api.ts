import {apiFetch} from "@/lib/api";import type {LegalPolicy,PublicTokenBag,LegalAcceptanceBundle,LegalAcceptanceStatus} from "@/types/legal";export const listLegalPolicies=()=>apiFetch<LegalPolicy[]>("/api/v1/legal/policies?language=es");export const listMyTokenBags=()=>apiFetch<PublicTokenBag[]>("/api/v1/legal/my-token-bags");

export const getLegalAcceptanceStatus=()=>apiFetch<LegalAcceptanceStatus>("/api/v1/legal/acceptance-status?language=es");
export const acceptLegalPolicies=(legal:LegalAcceptanceBundle)=>apiFetch<LegalAcceptanceStatus>("/api/v1/legal/accept",{method:"POST",body:JSON.stringify(legal)});

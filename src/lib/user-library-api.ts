import { apiFetch, apiFetchBlob } from "@/lib/api";
export type LibraryUsage={used_bytes:number;quota_bytes:number;available_bytes:number;percent_used:number;file_count:number};
export type LibraryFile={id:number;filename:string;content_type:string|null;size_bytes:number;provider:string;url:string;created_at:string};
export type LibraryResponse={items:LibraryFile[];usage:LibraryUsage};
export const listLibrary=()=>apiFetch<LibraryResponse>("/api/v1/user-library");
export const uploadLibraryFile=(file:File)=>{const body=new FormData();body.append("file",file);return apiFetch<LibraryFile>("/api/v1/user-library",{method:"POST",body});};
export const deleteLibraryFile=(id:number)=>apiFetch<void>(`/api/v1/user-library/${id}`,{method:"DELETE"});

export const downloadLibraryFile=(id:number)=>apiFetchBlob(`/api/v1/user-library/${id}/content`);

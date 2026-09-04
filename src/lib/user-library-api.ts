import { apiFetch, apiFetchBlob } from "@/lib/api";
export type LibraryUsage={used_bytes:number;quota_bytes:number;available_bytes:number;percent_used:number;file_count:number};
export type LibraryFile={id:number;filename:string;content_type:string|null;size_bytes:number;provider:string;url:string;created_at:string};
export type LibraryResponse={items:LibraryFile[];usage:LibraryUsage};
export const listLibrary=()=>apiFetch<LibraryResponse>("/api/v1/user-library");
export const uploadLibraryFile=(file:File)=>{const body=new FormData();body.append("file",file);return apiFetch<LibraryFile>("/api/v1/user-library",{method:"POST",body});};
export const deleteLibraryFile=(id:number)=>apiFetch<void>(`/api/v1/user-library/${id}`,{method:"DELETE"});

export const downloadLibraryFile=(id:number)=>apiFetchBlob(`/api/v1/user-library/${id}/content`);

export async function uploadLibraryFileWithProgress(file:File,onProgress:(percent:number)=>void):Promise<LibraryFile>{
  const [{env},{getUsableAccessToken}]=await Promise.all([import("@/lib/env"),import("@/lib/session-refresh")]);
  const token=await getUsableAccessToken();
  return new Promise<LibraryFile>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open("POST",`${env.apiBaseUrl}/api/v1/user-library`);
    if(token)xhr.setRequestHeader("Authorization",`Bearer ${token}`);
    xhr.upload.onprogress=(event)=>{
      if(event.lengthComputable&&event.total>0)onProgress(Math.max(1,Math.min(99,Math.round((event.loaded/event.total)*100))));
    };
    xhr.onerror=()=>reject(new Error("No se pudo conectar con el servidor para subir el rostro."));
    xhr.ontimeout=()=>reject(new Error("La subida tardó demasiado. Intenta nuevamente."));
    xhr.timeout=120000;
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300){
        try{onProgress(100);resolve(JSON.parse(xhr.responseText) as LibraryFile);}catch{reject(new Error("El servidor devolvió una respuesta inválida al subir el rostro."));}
        return;
      }
      let message=`Error ${xhr.status}`;
      try{const payload=JSON.parse(xhr.responseText);message=typeof payload?.detail==="string"?payload.detail:(payload?.message||message);}catch{}
      reject(new Error(message));
    };
    const body=new FormData();body.append("file",file);xhr.send(body);
  });
}

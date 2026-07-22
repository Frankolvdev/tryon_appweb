"use client";

function collectFiles(value: unknown, found: Array<Record<string, unknown>> = []) {
  if (Array.isArray(value)) value.forEach((item) => collectFiles(item, found));
  else if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    const url = item.download_url ?? item.public_url ?? item.preview_url;
    if (typeof url === "string" && !found.some((entry) => (entry.download_url ?? entry.public_url ?? entry.preview_url) === url)) found.push(item);
    Object.values(item).forEach((nested) => collectFiles(nested, found));
  }
  return found;
}

export function GenerationResults({ outputs }: { outputs: Record<string, unknown> }) {
  const files = collectFiles(outputs);
  if (!files.length) return <pre>{JSON.stringify(outputs, null, 2)}</pre>;
  return <div style={{display:"grid",gap:12}}>{files.map((file,index)=>{
    const url=String(file.download_url??file.public_url??file.preview_url);
    const type=String(file.content_type??"");
    const image=type.startsWith("image/")||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
    return <article key={`${url}-${index}`} style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:14,overflow:"hidden",background:"rgba(0,0,0,.25)"}}>
      {image&&<img src={url} alt={String(file.filename??`Resultado ${index+1}`)} style={{display:"block",width:"100%",maxHeight:360,objectFit:"contain",background:"#050505"}}/>}
      <div style={{padding:12,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis"}}>{String(file.filename??`Resultado ${index+1}`)}</span><a href={url} download target="_blank" rel="noreferrer" style={{fontSize:12,fontWeight:700}}>Descargar</a></div>
    </article>})}</div>;
}

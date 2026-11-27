const repo="https://api.github.com/repos/dentistaviajero/Revista-Bruja-Tianguera/contents/data/config.json";
const roles={admin:"dentista",angel:"angel",ambar:"ambar",annie:"partera"};
const sections=new Set("las-choapas coatzacoalcos sureste veracruz mexico internacional salud familia saberes ciencia asia-pop gamers belleza juegos espectaculos cultura deportes finanzas entrevistas negocios".split(" "));
const response=(d,status=200)=>Response.json(d,{status,headers:{"Cache-Control":"no-store"}});
const clean=(s,n)=>String(s||"").trim().slice(0,n);
const safe=(s,n)=>clean(s,n).replace(/[<>&]/g,c=>({"<":"＜",">":"＞","&":"＆"}[c]));
const https=s=>{try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password?u.href:""}catch{return ""}};
async function equal(a,b){const enc=new TextEncoder();const x=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(a))),y=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(b)));let v=0;for(let i=0;i<x.length;i++)v|=x[i]^y[i];return v===0}
export async function onRequestPost({request,env}){
try{
if(request.headers.get("Origin")!==new URL(request.url).origin)return response({error:"Origen no autorizado"},403);
if(!env.EDITORIAL_GITHUB_TOKEN)return response({error:"Configuración de producción pendiente: falta el secreto EDITORIAL_GITHUB_TOKEN"},503);
let user,password;try{const raw=new TextDecoder().decode(Uint8Array.from(atob((request.headers.get("Authorization")||"").replace(/^Basic /,"")),c=>c.charCodeAt(0)));const i=raw.indexOf(":");user=raw.slice(0,i);password=raw.slice(i+1)}catch{return response({error:"Acceso no autorizado"},401)}
const secret=Object.hasOwn(roles,user)&&env["EDITORIAL_PASSWORD_"+user.toUpperCase()];
if(!secret||secret.length<16||!await equal(password,secret))return response({error:"Acceso no autorizado"},401);
const raw=await request.text();if(raw.length>3000000)return response({error:"Solicitud demasiado grande"},413);
const input=JSON.parse(raw),admin=user==="admin",owner=roles[user];
const headers={Authorization:"Bearer "+env.EDITORIAL_GITHUB_TOKEN,Accept:"application/vnd.github+json","User-Agent":"BrujaEditorial","Content-Type":"application/json"};
const read=await fetch(repo+"?ref=main",{headers});if(!read.ok)return response({error:"No se pudo leer el archivo editorial"},503);
const file=await read.json();const d=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));
const articles=d.editorial_articles||[],can=a=>admin||a.editorial_owner===user;
const authors=Object.fromEntries(Object.entries(d.editorial_correspondents||{}).filter(([id])=>admin||id===owner).map(([id,v])=>[id,v.name]));
if(input.action.startsWith("commercial_")){
if(!["admin","angel","ambar"].includes(user))return response({error:"No autorizado"},403);
const records=d.commercial_records||[];if(input.action==="commercial_list")return response({records});
const v=input.record||{},old=records.find(x=>x.id===v.id);if(v.id&&!old)return response({error:"Registro inexistente"},404);
if(input.action==="commercial_remove"||input.action==="commercial_renew"){if(!old)return response({error:"Registro inexistente"},404);if(input.action==="commercial_remove")old.active=false;else{old.active=true;old.renewedAt=new Date().toISOString()}}
else if(input.action==="commercial_save"){if(!["colores","cupones","negocios","entrevistas","sponsors","anunciate"].includes(v.kind)||!clean(v.name,200))return response({error:"Completa nombre y sección"},400);
const item={...old,id:old?.id||crypto.randomUUID(),kind:v.kind,name:clean(v.name,200),category:clean(v.category,100),tier:clean(v.tier,30),title:clean(v.title,220),description:clean(v.description,30000),phone:clean(v.phone,30),facebook:https(v.facebook),instagram:https(v.instagram),social:https(v.social),video:https(v.video),destination:https(v.destination)||(/^\d{10}$/.test(v.destination||"")?"https://wa.me/52"+v.destination:""),image:https(v.image),createdAt:old?.createdAt||new Date().toISOString(),renewedAt:old?.renewedAt||new Date().toISOString(),active:true};
if(item.phone&&!/^\d{10}$/.test(item.phone))return response({error:"WhatsApp debe tener 10 dígitos"},400);
if(v.image_upload){const m=/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(v.image_upload);if(!m||m[2].length>2796204)return response({error:"Imagen inválida o mayor de 2 MB"},400);const b=atob(m[2]);if(!(m[1]==="jpeg"?b.startsWith("\xff\xd8\xff"):b.startsWith("\x89PNG\r\n\x1a\n")))return response({error:"Imagen inválida"},400);const path="assets/editorial/"+crypto.randomUUID()+"."+(m[1]==="jpeg"?"jpg":"png");const up=await fetch(repo.replace("data/config.json",path),{method:"PUT",headers,body:JSON.stringify({message:"Imagen comercial",branch:"main",content:m[2]})});if(!up.ok)return response({error:"No se pudo subir imagen"},502);item.image="https://brujarevista.pages.dev/"+path}
if(item.kind==="sponsors"&&(!item.image||!item.destination))return response({error:"Falta logo o destino"},400);
if(item.kind==="sponsors"&&records.filter(x=>x.kind==="sponsors"&&x.active&&x.id!==item.id).length>=3)return response({error:"Los tres espacios están ocupados"},400);
if(item.kind==="cupones"&&!item.image)return response({error:"Falta imagen del cupón"},400);
if(old)records[records.indexOf(old)]=item;else records.push(item);
if(item.kind==="entrevistas")for(const x of records.filter(x=>x.kind==="entrevistas"&&x.active).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(2))x.active=false;
}else return response({error:"Acción inválida"},400);
d.commercial_records=records;const bytes=new TextEncoder().encode(JSON.stringify(d,null,2)+"\n");let binary="";for(const b of bytes)binary+=String.fromCharCode(b);const write=await fetch(repo,{method:"PUT",headers,body:JSON.stringify({message:"Gestión comercial: "+user,branch:"main",sha:file.sha,content:btoa(binary)})});return write.ok?response({ok:true}):response({error:"No se pudo guardar; vuelve a intentar"},503);
}
if(input.action==="list")return response({user,authors,articles:articles.filter(can)});
if(!["save","archive"].includes(input.action))return response({error:"Acción desconocida"},400);
if(input.action==="archive"){const a=articles.find(x=>x.id===input.id);if(!a||!can(a))return response({error:"No autorizado"},403);a.published=false;a.archivedAt=new Date().toISOString()}
else{const v=input.article||{},existing=v.id?articles.find(x=>x.id===v.id):null;if(v.id&&(!existing||!can(existing)))return response({error:"No autorizado"},403);
const correspondent=admin?v.correspondent:owner;if(!Object.hasOwn(authors,correspondent)||!sections.has(v.section))return response({error:"Sección o autor inválido"},400);
const title=safe(v.title,220),summary=safe(v.summary,1000),body=safe(v.body,30000).split(/\n+/).map(x=>x.trim()).filter(Boolean);if(!title||!summary||!body.length)return response({error:"Completa título, resumen y texto"},400);
const id=existing?.id||crypto.randomUUID();let image=https(v.image);if(v.image&&(!image||/["\x27<>\s]/.test(v.image)))return response({error:"Imagen inválida"},400);
const media_url=https(v.media_url);if(v.media_url&&!media_url)return response({error:"Enlace multimedia inválido"},400);
if(v.image_upload){const m=/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(v.image_upload);if(!m||m[2].length>2796204)return response({error:"Imagen JPG o PNG de máximo 2 MB"},400);const b=atob(m[2]);if(b.length>2097152||!(m[1]==="jpeg"?b.startsWith("\xff\xd8\xff"):b.startsWith("\x89PNG\r\n\x1a\n")))return response({error:"Archivo de imagen inválido"},400);const path="assets/editorial/"+crypto.randomUUID()+"."+(m[1]==="jpeg"?"jpg":"png");const upload=await fetch(repo.replace("data/config.json",path),{method:"PUT",headers,body:JSON.stringify({message:"Imagen editorial: "+user,branch:"main",content:m[2]})});if(!upload.ok)return response({error:"No se pudo guardar la imagen"},502);image="https://brujarevista.pages.dev/"+path;}

const date=existing?.date||new Intl.DateTimeFormat("en-CA",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const article={...existing,id,section:v.section,title,summary,body,media_url,correspondent,author:"Redacción Bruja Tiangüera",editorial_owner:existing?(existing.editorial_owner||"admin"):user,date,published:true,url:"/articulo.html?id="+id,image,updatedAt:new Date().toISOString(),sources:existing?.sources||[]};if(existing)articles[articles.indexOf(existing)]=article;else articles.push(article);
const active=articles.filter(x=>x.section===v.section&&x.published!==false&&x.id!==id).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));for(const x of active.slice(4)){x.published=false;x.archivedAt=new Date().toISOString()}}
d.editorial_articles=articles;const bytes=new TextEncoder().encode(JSON.stringify(d,null,2)+"\n");let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
const write=await fetch(repo,{method:"PUT",headers,body:JSON.stringify({message:"Editorial: "+user+" "+input.action,branch:"main",sha:file.sha,content:btoa(binary)})});if(!write.ok)return response({error:write.status===409?"Otro editor guardó cambios; vuelve a intentar":"No se pudo guardar la publicación"},503);return response({ok:true});
}catch{return response({error:"No se pudo completar la operación"},500)}
}
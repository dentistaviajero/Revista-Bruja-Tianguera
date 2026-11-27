const repo="https://api.github.com/repos/dentistaviajero/Revista-Bruja-Tianguera/contents/data/config.json";
const roles={admin:"dentista",angel:"angel",ambar:"ambar",annie:"partera"};
const sections=new Set("las-choapas coatzacoalcos sureste veracruz mexico internacional salud familia saberes ciencia asia-pop gamers belleza juegos espectaculos cultura deportes finanzas entrevistas negocios".split(" "));
const response=(d,status=200)=>Response.json(d,{status,headers:{"Cache-Control":"no-store"}});
const clean=(s,n)=>String(s||"").trim().slice(0,n);
const safe=(s,n)=>clean(s,n).replace(/[<>]/g,"");
const https=s=>{try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password?u.href:""}catch{return ""}};
async function equal(a,b){const enc=new TextEncoder();const x=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(a))),y=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(b)));let v=0;for(let i=0;i<x.length;i++)v|=x[i]^y[i];return v===0}
export async function onRequestPost({request,env}){
try{
if(request.headers.get("Origin")!==new URL(request.url).origin)return response({error:"Origen no autorizado"},403);
if(!env.EDITORIAL_GITHUB_TOKEN)return response({error:"Portal pendiente de configuración privada"},503);
let user,password;try{const raw=new TextDecoder().decode(Uint8Array.from(atob((request.headers.get("Authorization")||"").replace(/^Basic /,"")),c=>c.charCodeAt(0)));const i=raw.indexOf(":");user=raw.slice(0,i);password=raw.slice(i+1)}catch{return response({error:"Acceso no autorizado"},401)}
const secret=Object.hasOwn(roles,user)&&env["EDITORIAL_PASSWORD_"+user.toUpperCase()];
if(!secret||secret.length<16||!await equal(password,secret))return response({error:"Acceso no autorizado"},401);
const raw=await request.text();if(raw.length>100000)return response({error:"Solicitud demasiado grande"},413);
const input=JSON.parse(raw),admin=user==="admin",owner=roles[user];
const headers={Authorization:"Bearer "+env.EDITORIAL_GITHUB_TOKEN,Accept:"application/vnd.github+json","User-Agent":"BrujaEditorial","Content-Type":"application/json"};
const read=await fetch(repo+"?ref=main",{headers});if(!read.ok)return response({error:"No se pudo leer el archivo editorial"},503);
const file=await read.json();const d=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,"")),c=>c.charCodeAt(0))));
const articles=d.editorial_articles||[],can=a=>admin||a.editorial_owner===user||(!a.editorial_owner&&a.correspondent===owner);
const authors=Object.fromEntries(Object.entries(d.editorial_correspondents||{}).filter(([id])=>admin||id===owner).map(([id,v])=>[id,v.name]));
if(input.action==="list")return response({user,authors,articles:articles.filter(can)});
if(!["save","archive"].includes(input.action))return response({error:"Acción desconocida"},400);
if(input.action==="archive"){const a=articles.find(x=>x.id===input.id);if(!a||!can(a))return response({error:"No autorizado"},403);a.published=false;a.archivedAt=new Date().toISOString()}
else{const v=input.article||{},existing=v.id?articles.find(x=>x.id===v.id):null;if(v.id&&(!existing||!can(existing)))return response({error:"No autorizado"},403);
const correspondent=admin?v.correspondent:owner;if(!Object.hasOwn(authors,correspondent)||!sections.has(v.section))return response({error:"Sección o autor inválido"},400);
const title=safe(v.title,220),summary=safe(v.summary,1000),body=safe(v.body,30000).split(/\n+/).map(x=>x.trim()).filter(Boolean);if(!title||!summary||!body.length)return response({error:"Completa título, resumen y texto"},400);
const id=existing?.id||crypto.randomUUID(),image=https(v.image);if(v.image&&!image)return response({error:"Imagen inválida"},400);
const date=existing?.date||new Intl.DateTimeFormat("en-CA",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const article={...existing,id,section:v.section,title,summary,body,correspondent,author:"Redacción Bruja Tiangüera",editorial_owner:existing?.editorial_owner||user,date,published:true,url:"/articulo.html?id="+id,image,updatedAt:new Date().toISOString(),sources:existing?.sources||[]};if(existing)articles[articles.indexOf(existing)]=article;else articles.push(article);
const active=articles.filter(x=>x.section===v.section&&x.published!==false&&x.id!==id).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));for(const x of active.slice(4)){x.published=false;x.archivedAt=new Date().toISOString()}}
d.editorial_articles=articles;const bytes=new TextEncoder().encode(JSON.stringify(d,null,2)+"\n");let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
const write=await fetch(repo,{method:"PUT",headers,body:JSON.stringify({message:"Editorial: "+user+" "+input.action,branch:"main",sha:file.sha,content:btoa(binary)})});if(!write.ok)return response({error:write.status===409?"Otro editor guardó cambios; vuelve a intentar":"No se pudo guardar la publicación"},503);return response({ok:true});
}catch{return response({error:"No se pudo completar la operación"},500)}
}
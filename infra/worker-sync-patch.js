// Añadir antes de export default en el Worker existente.
async function syncSection(env,key,path){
 const url=ORIGIN+path;
 try{
 const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{Accept:"application/json"}});
 if(!r.ok)throw Error("HTTP "+r.status);
 const d=await r.json();
 if(key==="municipio"&&(!d.ok||!Array.isArray(d.items)||!d.items.length))throw Error("Sin comunicados reconocidos; revisar fuente y filtro");
 if(key==="alertas"&&(!Array.isArray(d.sources)||!d.sources.some(s=>s.status==="consultado")))throw Error("Fuentes oficiales no disponibles");
 await env.NEWS_KV.put(key,JSON.stringify({...d,syncedAt:new Date().toISOString()}));
 await env.NEWS_KV.put(key+":status",JSON.stringify({ok:true,checkedAt:new Date().toISOString()}));
 }catch(e){await env.NEWS_KV.put(key+":status",JSON.stringify({ok:false,checkedAt:new Date().toISOString(),warning:String(e.message)}));}
}
async function storedSection(env,key){
 const data=await env.NEWS_KV.get(key,"json");
 const status=await env.NEWS_KV.get(key+":status","json");
 if(!data)return json({ok:false,status,warning:"Sin primera sincronización"},503);
 return json({...data,syncStatus:status,stale:!status?.ok||Date.now()-Date.parse(data.syncedAt)> (key==="alertas"?25:150)*60000});
}
// Añadir dentro de fetch, antes del return 404:
// if(path==="/api/municipio")return storedSection(env,"municipio");
// if(path==="/api/alertas")return storedSection(env,"alertas");
// Sustituir scheduled por:
// async scheduled(event,env,ctx){
// const local=new Date(event.scheduledTime-6*3600000);
// const minute=local.getUTCMinutes(),hour=local.getUTCHours();
// const jobs=[syncSection(env,"alertas","/api/alertas")];
// if(minute===0&&hour%2===0)jobs.push(syncSection(env,"municipio","/api/municipio"));
// if(minute===0&&hour===6)jobs.push(update(env));
// ctx.waitUntil(Promise.allSettled(jobs));
// }
// Cron: */10 * * * *
// Hora local Las Choapas UTC-6. RSS todas las secciones 06:00.
// Clima al abrir y cada 10 minutos en pestaña abierta.
// Contenido editorial y comercial manual independiente del RSS.
// No activar hasta integrar el Worker, conectar las vistas al KV y probar fuentes.

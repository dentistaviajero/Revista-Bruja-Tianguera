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
 return json({...data,syncStatus:status,stale:!status?.ok||Date.now()-Date.parse(data.syncedAt)> (key==="alertas"?25:90)*60000});
}
// Añadir dentro de fetch, antes del return 404:
// if(path==="/api/municipio")return storedSection(env,"municipio");
// if(path==="/api/alertas")return storedSection(env,"alertas");
// Sustituir scheduled por:
// async scheduled(event,env,ctx){
// const minute=new Date(event.scheduledTime).getUTCMinutes();
// const jobs=[syncSection(env,"alertas","/api/alertas")];
// if(minute===0)jobs.push(syncSection(env,"municipio","/api/municipio"));
// if(minute%30===0)jobs.push(update(env)); // PENDIENTE: separar feeds Al Día de feeds diarios antes de activar
// ctx.waitUntil(Promise.allSettled(jobs));
// }
// Cron: */10 * * * *

// Política editorial: Al Día cada 30 minutos; municipio cada hora;
// otras categorías una vez al día a las 06:00 America/Mexico_City.
// No activar el cron hasta separar update(env) por grupos y conectar las vistas al KV.

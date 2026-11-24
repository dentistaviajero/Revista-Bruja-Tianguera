// Bruja Noticias v2. Fuentes RSS/Atom y Google Noticias como índice de enlaces.
const ORIGIN="https://brujarevista.pages.dev";
// Fuentes editoriales regionales: Google Noticias indexa enlaces, no reproduce artículos.
// La disponibilidad de resultados depende de la indexación de cada medio.
const queries=[
["veracruz","site:xeu.mx/estado-de-veracruz Veracruz noticias"],
["coatzacoalcos","site:diariodelistmo.com Coatzacoalcos Veracruz"],
["sureste","(site:diariodelistmo.com Agua Dulce OR site:diariodelistmo.com Nanchital OR site:diariodelistmo.com Moloacán OR site:tabascohoy.com Tabasco)"],
["las-choapas","(site:presencia.mx Las Choapas OR site:diariodelistmo.com Las Choapas OR site:laschoapas.gob.mx Las Choapas)"],
["mexico","México noticias nacionales site:xeu.mx OR site:cnnespanol.cnn.com OR site:jornada.com.mx"],
["internacional","mundo noticias internacionales site:cnnespanol.cnn.com OR site:xeu.mx"],
["finanzas","economía dólar inflación México site:xeu.mx OR site:eleconomista.com.mx"],
["ciencia","ciencia tecnología inteligencia artificial IA site:xeu.mx OR site:unam.mx"],
["salud","salud investigación médica tratamientos vacunas site:unam.mx OR site:xeu.mx"],
["crianza","lactancia materna crianza infancia odontopediatría embarazo"],
["belleza","belleza cosmética dermatología moda tendencias cuidado de piel"],
["espectaculos","espectáculos música cine artistas site:xeu.mx OR site:xeva.com.mx"],
["deportes","deportes Liga MX Veracruz Tabasco site:xeudeportes.mx OR site:xeva.com.mx"],
["cultura","cartelera cultural Veracruz Coatzacoalcos eventos site:uv.mx"],
["viral","curiosidades viral cultura internet site:xeu.mx"],
["alertas","Protección Civil Veracruz CONAGUA frente frío lluvias sitio oficial"]
];
const feeds=queries.map(([section,q])=>({section,name:"Google Noticias · enlaces de medios",url:"https://news.google.com/rss/search?q="+encodeURIComponent(q+" when:3d")+"&hl=es-419&gl=MX&ceid=MX:es-419"}));
feeds.push({section:"internacional",name:"Noticias ONU",url:"https://news.un.org/feed/subscribe/es/news/all/rss.xml",limit:1});
const decode=s=>(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/\s+/g," ").trim();
function field(s,t){const m=s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"));return m?decode(m[1]):""}
function parse(xml,f){return (xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[]).slice(0,f.limit||8).map(x=>{let date=field(x,"pubDate");let ts=Date.parse(date);return {section:f.section,source:field(x,"source")||f.name,title:field(x,"title").slice(0,220),summary:"",url:field(x,"link"),date:Number.isFinite(ts)?new Date(ts).toISOString():null}}).filter(x=>x.title&&/^https:\/\//.test(x.url)&&x.date&&Date.now()-Date.parse(x.date)<7*864e5)}
async function update(env){if(!env.NEWS_KV)throw Error("NEWS_KV no vinculado");let results=await Promise.allSettled(feeds.map(async f=>{let r=await fetch(f.url,{headers:{"Accept":"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(f.section+" "+r.status);return parse(await r.text(),f)}));let old=await env.NEWS_KV.get("latest","json")||{items:[]};let successes=results.filter(x=>x.status==="fulfilled");if(!successes.length)throw Error("Ninguna fuente RSS respondió");let fresh=successes.flatMap(x=>x.value);let bySection=new Map(),seen=new Set();for(let n of [...fresh,...old.items]){if(!n.url||seen.has(n.url)||n.date&&Date.now()-Date.parse(n.date)>7*864e5)continue;seen.add(n.url);let list=bySection.get(n.section)||[];if(list.length<8){list.push(n);bySection.set(n.section,list)}}let items=[...bySection.values()].flat().sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0));let data={updatedAt:new Date().toISOString(),items,feedsOk:successes.length,feedsTotal:feeds.length};await env.NEWS_KV.put("latest",JSON.stringify(data));return data}
function json(o,status=200){return new Response(JSON.stringify(o),{status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":ORIGIN,"cache-control":"no-store"}})}
async function weather(){let u="https://api.open-meteo.com/v1/forecast?latitude=17.91&longitude=-94.09&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FMexico_City&forecast_days=3";let r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error("Clima "+r.status);let x=await r.json();return {place:"Las Choapas, Veracruz",provider:"Open-Meteo",updatedAt:x.current?.time,current:x.current,daily:x.daily,disclaimer:"Pronóstico, no alerta oficial de Protección Civil."}}
export default {async fetch(req,env,ctx){let path=new URL(req.url).pathname;if(path==="/")return json({service:"bruja-noticias",status:"activo",endpoints:["/api/noticias","/api/clima"]});if(path==="/api/clima"){try{return json(await weather())}catch(e){return json({error:"Pronóstico temporalmente no disponible"},503)}}if(path==="/api/noticias"){let d=await env.NEWS_KV?.get("latest","json");if(!d){try{d=await update(env)}catch(e){return json({updatedAt:null,items:[],warning:"Sin primera carga; revise cron y registros"})}}return json(d)}return json({error:"No encontrado"},404)},async scheduled(event,env,ctx){ctx.waitUntil(update(env).catch(e=>console.error("Noticias:",e.message)))}};
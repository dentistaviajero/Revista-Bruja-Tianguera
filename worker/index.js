// Motor de titulares: enlaces a fuentes, no republicación de artículos completos.
// Desplegar como Worker separado; configurar NEWS_KV y cron en wrangler.toml.
const SOURCES=[
 {section:"internacional",name:"Noticias ONU",url:"https://news.un.org/feed/subscribe/es/news/all/rss.xml"},
 {section:"ciencia",name:"NASA",url:"https://www.nasa.gov/feed/"},
 {section:"mexico",name:"Google Noticias · México (agregador)",url:"https://news.google.com/rss?hl=es-419&gl=MX&ceid=MX:es-419"},
 {section:"salud",name:"OMS",url:"https://www.who.int/rss-feeds/news-english.xml"}
];
function plain(s){return (s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim()}
function field(s,t){let m=s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"));return m?plain(m[1]):""}
function parse(xml,source){let blocks=xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[];return blocks.slice(0,12).map(b=>{let url=field(b,"link");let date=field(b,"pubDate");let timestamp=Date.parse(date);return {section:source.section,source:source.name,title:field(b,"title").slice(0,240),summary:field(b,"description").slice(0,280),url,date:Number.isFinite(timestamp)?new Date(timestamp).toISOString():null}}).filter(x=>x.title&&/^https:\/\//.test(x.url)&&(!x.date||Date.now()-Date.parse(x.date)<21*864e5))}
async function refresh(env){if(!env.NEWS_KV)throw Error("Falta binding NEWS_KV");let batches=await Promise.allSettled(SOURCES.map(async s=>{let r=await fetch(s.url,{headers:{"User-Agent":"BrujaTiangueraNews/1.0","Accept":"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error(s.name+": "+r.status);return parse(await r.text(),s)}));let ok=batches.filter(x=>x.status==="fulfilled").flatMap(x=>x.value);let old=await env.NEWS_KV.get("latest","json")||{items:[]};let seen=new Set();let items=[...ok,...old.items].filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true}).slice(0,120);if(!ok.length)throw Error("Ninguna fuente respondió; se conserva el último lote");let data={updatedAt:new Date().toISOString(),items};await env.NEWS_KV.put("latest",JSON.stringify(data));return data}
export default {
 async fetch(request,env){let u=new URL(request.url);if(u.pathname!=="/api/noticias")return new Response("Not found",{status:404});let data=await env.NEWS_KV?.get("latest","json");if(!data)data={updatedAt:null,items:[]};return new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"https://brujarevista.pages.dev","Cache-Control":"public, max-age=300"}})},
 async scheduled(event,env,ctx){ctx.waitUntil(refresh(env))}
};
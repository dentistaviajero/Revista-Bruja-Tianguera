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
["belleza","(site:vogue.mx/belleza OR site:vogue.mx/moda OR site:glamour.es/belleza OR site:glamour.es/moda) (cabello OR maquillaje OR moda OR piel OR uñas OR belleza)"],
["espectaculos","espectáculos música cine artistas site:xeu.mx OR site:xeva.com.mx"],
["deportes","(site:mediotiempo.com OR site:record.com.mx OR site:espn.com.mx OR site:as.com/mx OR site:tudn.com) (Liga MX OR futbol OR boxeo OR beisbol OR basquetbol OR deporte)"],
["cultura","cartelera cultural Veracruz Coatzacoalcos eventos site:uv.mx"],
["viral","curiosidades viral cultura internet site:xeu.mx"],
["alertas","Protección Civil Veracruz CONAGUA frente frío lluvias sitio oficial"]
];
const feeds=queries.map(([section,q])=>({section,name:"Google Noticias · enlaces de medios",url:"https://news.google.com/rss/search?q="+encodeURIComponent(q+" when:3d")+"&hl=es-419&gl=MX&ceid=MX:es-419"}));
// Fuentes en español especializadas: priorizar moda, maquillaje y cuidados personales.
feeds.push({section:"belleza",name:"Vogue México",url:"https://www.vogue.mx/feed/rss",limit:12});
feeds.push({section:"belleza",name:"Vogue España",url:"https://www.vogue.es/feed/rss",limit:12});
feeds.push({section:"belleza",name:"S Moda · El País",url:"https://feeds.elpais.com/mrss-s/list/ep/site/elpais.com/section/smoda",limit:12});
// Cine, series y streaming en español: Netflix, Disney+, Prime Video y HBO Max.
feeds.push({section:"espectaculos",name:"Espinof · Cine y streaming",url:"https://www.espinof.com/feedburner.xml",limit:16});
feeds.push({section:"espectaculos",name:"SensaCine · Cine y series",url:"https://www.sensacine.com/rss/noticias.xml",limit:16});
// Deportes: fuentes oficiales o RSS publicados; ESPN directo puede bloquear robots, por eso Google Noticias indexa sus notas.
feeds.push({section:"deportes",name:"Mediotiempo · RSS",url:"https://www.mediotiempo.com/rss/noticia.xml",limit:12});
feeds.push({section:"deportes",name:"Marca USA · Liga MX vía Google Noticias",url:"https://news.google.com/rss/search?q="+encodeURIComponent("site:us.marca.com futbol Liga MX when:3d")+"&hl=es-419&gl=MX&ceid=MX:es-419",limit:8});
feeds.push({section:"deportes",name:"BBC Sport · Internacional",url:"https://feeds.bbci.co.uk/sport/rss.xml",limit:8});
feeds.push({section:"deportes",name:"Formula 1 · Oficial",url:"https://www.formula1.com/en/latest/all.xml",limit:8});
feeds.push({section:"internacional",name:"Noticias ONU",url:"https://news.un.org/feed/subscribe/es/news/all/rss.xml",limit:1});
const decode=s=>(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/\s+/g," ").trim();
function field(s,t){const m=s.match(new RegExp("<"+t+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+t+">","i"));return m?decode(m[1]):""}
function parse(xml,f){return (xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[]).slice(0,f.limit||8).map(x=>{let date=field(x,"pubDate");let ts=Date.parse(date);return {section:f.section,source:field(x,"source")||f.name,title:field(x,"title").slice(0,220),summary:"",url:field(x,"link"),date:Number.isFinite(ts)?new Date(ts).toISOString():null}}).filter(x=>x.title&&/^https:\/\//.test(x.url)&&x.date&&Date.now()-Date.parse(x.date)<7*864e5)}
// Prioridad editorial de portada: comunidad -> ciudad vecina -> estado -> sureste -> nacional -> internacional.
// Una emergencia con impacto regional explícito puede adelantar a una nota ordinaria.
// No se interpreta el contenido como alerta oficial ni se certifica su veracidad.
const LOCAL_SECTIONS=["las-choapas","coatzacoalcos","veracruz","sureste"];
const IMPACT=/(inundaci[oó]n|desbordamiento|evacuaci[oó]n|alerta roja|emergencia|hurac[aá]n|tormenta tropical|sismo|terremoto|derrame|fuga de amoniaco|cierre de carretera|bloqueo carretero|corte de agua|apag[oó]n|suspensi[oó]n de clases|incendio forestal)/i;
const REACH=/(las choapas|coatzacoalcos|agua dulce|nanchital|moloac[aá]n|veracruz|tabasco|sur de veracruz|sureste)/i;
function chooseFeatured(items){
 const now=Date.now();
 const candidates=items.filter(n=>n.title&&/^https:\/\//.test(n.url||"")&&n.date&&now-Date.parse(n.date)<=72*3600000&&Date.parse(n.date)<=now+3600000);
 const regional=candidates.filter(n=>LOCAL_SECTIONS.includes(n.section));
 const impactful=regional.filter(n=>IMPACT.test(n.title)&&REACH.test(n.title));
 const rank=n=>LOCAL_SECTIONS.indexOf(n.section);
 const recent=(a,b)=>Date.parse(b.date)-Date.parse(a.date);
 // Una emergencia de alcance local/regional supera noticias ordinarias, con preferencia por cercanía.
 if(impactful.length){impactful.sort((a,b)=>rank(a)-rank(b)||recent(a,b));return {...impactful[0],priorityReason:"impacto-regional-potencial"}}
 if(regional.length){regional.sort((a,b)=>rank(a)-rank(b)||recent(a,b));return {...regional[0],priorityReason:"proximidad"}}
 const national=candidates.filter(n=>n.section==="mexico"||n.section==="alertas");
 if(national.length){national.sort(recent);return {...national[0],priorityReason:"respaldo-nacional"}}
 const international=candidates.filter(n=>n.section==="internacional");
 if(international.length){international.sort(recent);return {...international[0],priorityReason:"sin-noticias-regionales"}}
 return null;
}
async function update(env){if(!env.NEWS_KV)throw Error("NEWS_KV no vinculado");let results=await Promise.allSettled(feeds.map(async f=>{let r=await fetch(f.url,{headers:{"Accept":"application/rss+xml, application/xml, text/xml"},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(f.section+" "+r.status);return parse(await r.text(),f)}));let old=await env.NEWS_KV.get("latest","json")||{items:[]};let successes=results.filter(x=>x.status==="fulfilled");if(!successes.length)throw Error("Ninguna fuente RSS respondió");let fresh=successes.flatMap(x=>x.value);const ENTERTAINMENT=/(pel[ií]cula|cine|estreno|cartelera|taquilla|actor|actriz|director|serie|temporada|netflix|disney\+?|prime video|amazon|hbo|max|streaming|tr[aá]iler|marvel|avengers|televisi[oó]n|documental|animaci[oó]n|oscar|premio|rodaje|showrunner|spin.off)/i;fresh=fresh.filter(n=>n.section!=="espectaculos"||ENTERTAINMENT.test(n.title));const BEAUTY=/(belleza|maquillaje|cosm[eé]tic|cabello|pelo|peinado|corte de pelo|tinte|piel|facial|manicura|uñas|perfume|moda|tendencia|ropa|vestido|zapato|estilo|skincare|tratamiento|crema|serum|s[eé]rum|fragancia|labial)/i;fresh=fresh.filter(n=>n.section!=="belleza"||BEAUTY.test(n.title));let bySection=new Map(),seen=new Set();for(let n of [...fresh,...old.items]){if(!n.url||seen.has(n.url)||n.date&&Date.now()-Date.parse(n.date)>7*864e5)continue;seen.add(n.url);let list=bySection.get(n.section)||[];if(list.length<8){list.push(n);bySection.set(n.section,list)}}let items=[...bySection.values()].flat().sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0));let data={updatedAt:new Date().toISOString(),items,featured:chooseFeatured(items),feedsOk:successes.length,feedsTotal:feeds.length};await env.NEWS_KV.put("latest",JSON.stringify(data));return data}
function json(o,status=200){return new Response(JSON.stringify(o),{status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":ORIGIN,"cache-control":"no-store"}})}
async function weather(){let u="https://api.open-meteo.com/v1/forecast?latitude=17.91&longitude=-94.09&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FMexico_City&forecast_days=3";let r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error("Clima "+r.status);let x=await r.json();return {place:"Las Choapas, Veracruz",provider:"Open-Meteo",updatedAt:x.current?.time,current:x.current,daily:x.daily,disclaimer:"Pronóstico, no alerta oficial de Protección Civil."}}
export default {async fetch(req,env,ctx){let path=new URL(req.url).pathname;if(path==="/")return json({service:"bruja-noticias",status:"activo",endpoints:["/api/noticias","/api/clima"]});if(path==="/api/clima"){try{return json(await weather())}catch(e){return json({error:"Pronóstico temporalmente no disponible"},503)}}if(path==="/api/noticias"){let d=await env.NEWS_KV?.get("latest","json");if(!d){try{d=await update(env)}catch(e){return json({updatedAt:null,items:[],featured:null,warning:"Sin primera carga; revise cron y registros"})}}if(d&&!Object.prototype.hasOwnProperty.call(d,"featured"))d.featured=chooseFeatured(d.items||[]);return json(d)}return json({error:"No encontrado"},404)},async scheduled(event,env,ctx){ctx.waitUntil(update(env).catch(e=>console.error("Noticias:",e.message)))}};
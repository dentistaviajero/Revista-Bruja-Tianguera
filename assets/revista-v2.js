(()=>{'use strict';
const palette=['#9143d0','#e95b9b','#24a77d','#f1b83f','#428fe8','#f17845','#36b9c5'];let color=0;
function change(){color=(color+1+Math.floor(Math.random()*(palette.length-1)))%palette.length;document.querySelectorAll('.color-shell,.color-home-shell').forEach(x=>x.style.backgroundColor=palette[color]);}
document.querySelectorAll('[data-color-change]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();change()}));
const root=document.getElementById('directory-results');
if(root){const input=document.getElementById('directory-query');Promise.all([fetch('/data/directorio.json',{cache:'no-store'}).then(r=>r.json()),fetch('/data/config.json',{cache:'no-store'}).then(r=>r.json())]).then(([base,cfg])=>[...base,...(cfg.commercial_records||[]).filter(x=>x.active&&x.kind==='colores').map(x=>({nombre:x.name,categoria:x.category||'Otros',telefono:x.phone,subcategoria:x.tier==='especial'?'Especializado':'General'}))]).then(records=>{if(!Array.isArray(records))throw Error('Formato inválido');const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');const coll=new Intl.Collator('es',{sensitivity:'base'});function render(){root.replaceChildren();const q=norm(input?.value);const valid=records.filter(n=>n&&n.nombre&&n.categoria&&(!n.vigencia_fin||n.vigencia_fin>=new Date().toISOString().slice(0,10))).filter(n=>[n.nombre,n.categoria,n.subcategoria,n.especialidad].some(x=>norm(x).includes(q)));if(!valid.length){root.textContent=q?'No hay coincidencias en esta búsqueda.':'Todavía no hay negocios inscritos. Aquí aparecerán todos los que se registren.';return;}const groups=new Map();for(const n of valid){const cat=n.categoria.trim();const sub=(n.especialidad&&n.especialidad_verificada===true)?n.especialidad:(n.subcategoria||'General');if(!groups.has(cat))groups.set(cat,new Map());const sg=groups.get(cat);if(!sg.has(sub))sg.set(sub,[]);sg.get(sub).push(n)}for(const cat of [...groups.keys()].sort(coll.compare)){const section=document.createElement('section');section.className='directory-category';const h=document.createElement('h2');h.textContent=cat;section.append(h);const subs=groups.get(cat);for(const sub of [...subs.keys()].sort(coll.compare)){const part=document.createElement('div');part.className='directory-subcategory';const h3=document.createElement('h3');h3.textContent=sub;part.append(h3);for(const n of subs.get(sub).sort((a,b)=>coll.compare(a.nombre,b.nombre))){const row=document.createElement('div');row.className='directory-result';const title=document.createElement('strong');title.textContent=n.nombre;row.append(title);if(n.especialidad_verificada===true&&n.especialidad){const tag=document.createElement('span');tag.className='verified-note';tag.textContent='Especialidad documentalmente verificada';row.append(tag)}const phone=String(n.telefono||'').replace(/\D/g,'');if(phone){const a=document.createElement('a');a.href='https://wa.me/'+(phone.length===10?'52'+phone:phone);a.target='_blank';a.rel='noopener noreferrer';a.textContent='WhatsApp · '+n.telefono;row.append(a)}part.append(row)}section.append(part)}root.append(section)}}input?.addEventListener('input',render);render()}).catch(()=>root.textContent='No fue posible cargar el directorio.');}
const featured=document.getElementById('featured-title');if(featured){
 const clean=value=>{const doc=new DOMParser().parseFromString(String(value||''),'text/html');return (doc.body.textContent||'').replace(/\s+/g,' ').trim().slice(0,420)};
 const photoOf=n=>{for(const value of [n.image,n.image_url,n.thumbnail,n.enclosure?.url])if(typeof value==='string'&&/^(https:\/\/|\/assets\/)/i.test(value))return value;return ''};
 Promise.all([fetch('/data/destacada.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({})),fetch('/data/config.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}))]).then(async([manual,cfg])=>{
 let items=[];try{const r=await fetch(cfg.feed_url||'/data/noticias.json',{cache:'no-store'});if(!r.ok)throw Error('RSS');const d=await r.json();items=Array.isArray(d)?d:(d.items||[])}catch(e){}
 const date=x=>Date.parse(x.date||x.publishedAt||x.pubDate||'');
 const valid=x=>x&&x.title&&/^(https?:\/\/|\/articulo\.html\?)/.test(x.url||'')&&Number.isFinite(date(x))&&date(x)<=Date.now();
 let n=items.filter(valid).sort((a,b)=>date(b)-date(a))[0]||(cfg.editorial_articles||[]).filter(x=>x.published!==false&&valid(x)).sort((a,b)=>date(b)-date(a))[0]||null;
 if(n){featured.textContent=clean(n.title);document.getElementById('featured-summary').textContent=clean(n.summary_es||n.summary||n.description)||'Consulta los detalles en la fuente original.';const a=document.getElementById('featured-link');const map={'nacional':'actualidad','internacional':'actualidad','las-choapas':'actualidad','coatzacoalcos':'actualidad','veracruz':'actualidad','sureste':'actualidad','actualidad':'actualidad','economia':'finanzas','finanzas':'finanzas','tecnologia':'ciencia','ciencia':'ciencia','salud':'salud','familia':'salud','crianza':'salud','parteria':'saberes','maternidad':'saberes','saberes':'saberes','asia-pop':'asia-pop','gamers':'gamers','juegos':'juegos','tcg':'juegos','belleza':'belleza','moda':'belleza','espectaculos':'espectaculos','cultura':'cultura','deportes':'deportes'};const section=map[String(n.section||'').toLowerCase()]||'actualidad';a.href='/secciones/'+section+'.html?noticia='+encodeURIComponent(n.url)+'#noticia-portada';a.removeAttribute('target');a.removeAttribute('rel');a.textContent='Leer noticia →';const img=document.getElementById('featured-photo'),url=photoOf(n);if(url){img.style.backgroundImage='url('+JSON.stringify(url)+')';img.textContent=''}else{img.style.backgroundImage='';img.textContent='📰'}}
 const slots=document.querySelectorAll('.sponsor-slot');const sponsors=Array.isArray(cfg.sponsors)?cfg.sponsors.slice(0,3):[];sponsors.forEach((n,i)=>{if(!slots[i]||!/^https:\/\//.test(n.url||''))return;slots[i].href=n.url;slots[i].target='_blank';slots[i].rel='noopener noreferrer';slots[i].replaceChildren();if(/^https:\/\//.test(n.logo||'')||/^\/assets\//.test(n.logo||'')){const img=document.createElement('img');img.src=n.logo;img.alt='Logotipo de '+(n.nombre||'patrocinador');slots[i].append(img)}else slots[i].textContent=n.nombre||'Patrocinador'})
 })}

const submit=document.getElementById('article-submission');if(submit){submit.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(submit),images=[...submit.querySelector('input[type=file]').files];const msg=['PROPUESTA DE ARTÍCULO — BRUJA TIANGÜERA','Autor: '+f.get('autor'),'Contacto: '+f.get('contacto'),'Sección: '+f.get('seccion'),'Título: '+f.get('titulo'),'Lugar y fecha: '+f.get('lugar'),'Texto: '+f.get('texto'),'Fotos seleccionadas: '+images.map(x=>x.name).join(', '),'Envío para revisión editorial; NO autorizo publicación automática.'].join('\n\n');const status=document.getElementById('submission-status');let cfg={};try{cfg=await(await fetch('/data/config.json')).json()}catch(err){}const phone=String(cfg.admin_whatsapp||'').replace(/\D/g,'');if(phone){window.open('https://wa.me/'+(phone.length===10?'52'+phone:phone)+'?text='+encodeURIComponent(msg),'_blank','noopener');status.textContent='Se abrió WhatsApp con el texto. Presiona Enviar y adjunta manualmente las fotografías seleccionadas; los archivos NO se adjuntan automáticamente.'}else{try{await navigator.clipboard.writeText(msg);status.textContent='Texto copiado. Falta configurar el WhatsApp editorial. Conserva las fotografías y envíalas por separado cuando tengas el contacto.'}catch(err){status.textContent='Falta configurar WhatsApp editorial. Copia este texto y consérvalo: '+msg}}})}
})();

/* V4: portadas ilustradas y clima dinámico de Las Choapas. */
(()=>{
'use strict';
const sections=['actualidad','clima','salud','saberes','ciencia','asia-pop','gamers','belleza','juegos','espectaculos','cultura','deportes','finanzas','colores','cupones','entrevistas','negocios','colectivo','proximos-eventos','membresias','anunciate','participa'];
for(const key of sections){
 const card=document.querySelector('.mag-'+key);
 const visual=card?.querySelector('.mag-visual');
 if(!visual)continue;
 // Las ilustraciones son fondos CSS; no insertar emojis, imágenes duplicadas ni fallback.
 visual.replaceChildren();
}

const clima=document.querySelector('.mag-clima .mag-visual');
if(!clima)return;
function weatherImage(d){
 const w=Number(d.current?.weather_code),t=Number(d.current?.temperature_2m),v=Number(d.current?.wind_speed_10m);
 if([95,96,99].includes(w))return 'clima-tormenta';
 if(v>=70)return 'clima-viento';
 if(Number.isFinite(t)&&d.current?.temperature_2m!=null&&t<20)return 'clima-frio';
 if(Number(d.current?.precipitation)>0||[51,53,55,56,57,61,63,65,66,67,80,81,82].includes(w))return 'clima-lluvia';
 if(t>37)return 'clima-calor';
 if([1,2,3,45,48].includes(w))return 'clima-nublado';
 return 'clima-soleado';
}
fetch('https://api.open-meteo.com/v1/forecast?latitude=17.9118&longitude=-94.0965&current=temperature_2m,weather_code,wind_speed_10m,precipitation&wind_speed_unit=kmh&timezone=America%2FMexico_City',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('weather');return r.json()})
 .then(d=>{
 const state=weatherImage(d);
 clima.style.setProperty('background-image',`url('/assets/botones/${state}.webp')`,'important');
 if(state==='clima-lluvia'||state==='clima-tormenta'){
 const style=document.createElement('style');
 style.textContent='.mag-clima .mag-visual{position:relative;overflow:hidden}.chopa-rain{position:absolute;inset:0;pointer-events:none;overflow:hidden}.chopa-rain i{position:absolute;top:-30px;width:2px;height:24px;background:linear-gradient(transparent,rgba(220,245,255,.85));animation:chopa-rain-fall linear infinite}@keyframes chopa-rain-fall{to{transform:translate(-25px,400px)}}@media(prefers-reduced-motion:reduce){.chopa-rain{display:none}}';
 document.head.append(style);
 const layer=document.createElement('span');layer.className='chopa-rain';layer.setAttribute('aria-hidden','true');
 for(let i=0;i<24;i++){const drop=document.createElement('i');drop.style.left=(i*37%110)+'%';drop.style.animationDuration=(.65+(i%5)*.13)+'s';drop.style.animationDelay=(-i*.17)+'s';layer.append(drop)}clima.append(layer);
 }
 if(state==='clima-calor'){
 const style=document.createElement('style');
 style.textContent='.mag-clima .mag-visual{position:relative;overflow:hidden}.chopa-heat{position:absolute;inset:0;overflow:hidden;pointer-events:none}.chopa-heat i{position:absolute;bottom:-15%;width:15%;height:45%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,244,220,.65),transparent 70%);filter:blur(5px);animation:chopa-heat-rise 3s ease-out infinite}@keyframes chopa-heat-rise{0%{transform:translate(0,0) scale(.65);opacity:0}20%{opacity:.8}55%{transform:translate(12px,-100%) scale(1.1);opacity:.5}100%{transform:translate(-8px,-240%) scale(1.5);opacity:0}}@media(prefers-reduced-motion:reduce){.chopa-heat{display:none}}';
 document.head.append(style);
 const layer=document.createElement('span');layer.className='chopa-heat';layer.setAttribute('aria-hidden','true');
 for(let i=0;i<9;i++){const wave=document.createElement('i');wave.style.left=(i*11)+'%';wave.style.animationDelay=(-i*.37)+'s';wave.style.animationDuration=(2.5+(i%4)*.4)+'s';layer.append(wave)}clima.append(layer);
 }
 })
 .catch(()=>{});
})();

(()=>{'use strict';
const palette=['#9143d0','#e95b9b','#24a77d','#f1b83f','#428fe8','#f17845','#36b9c5'];let color=0;
function change(){color=(color+1+Math.floor(Math.random()*(palette.length-1)))%palette.length;document.querySelectorAll('.color-shell,.color-home-shell').forEach(x=>x.style.backgroundColor=palette[color]);}
document.querySelectorAll('[data-color-change]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();change()}));
const root=document.getElementById('directory-results');
if(root){const input=document.getElementById('directory-query');fetch('/data/directorio.json',{cache:'no-store'}).then(r=>r.json()).then(records=>{if(!Array.isArray(records))throw Error('Formato inválido');const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');const coll=new Intl.Collator('es',{sensitivity:'base'});function render(){root.replaceChildren();const q=norm(input?.value);const valid=records.filter(n=>n&&n.nombre&&n.categoria&&(!n.vigencia_fin||n.vigencia_fin>=new Date().toISOString().slice(0,10))).filter(n=>[n.nombre,n.categoria,n.subcategoria,n.especialidad].some(x=>norm(x).includes(q)));if(!valid.length){root.textContent=q?'No hay coincidencias en esta búsqueda.':'Todavía no hay negocios inscritos. Aquí aparecerán todos los que se registren.';return;}const groups=new Map();for(const n of valid){const cat=n.categoria.trim();const sub=(n.especialidad&&n.especialidad_verificada===true)?n.especialidad:(n.subcategoria||'General');if(!groups.has(cat))groups.set(cat,new Map());const sg=groups.get(cat);if(!sg.has(sub))sg.set(sub,[]);sg.get(sub).push(n)}for(const cat of [...groups.keys()].sort(coll.compare)){const section=document.createElement('section');section.className='directory-category';const h=document.createElement('h2');h.textContent=cat;section.append(h);const subs=groups.get(cat);for(const sub of [...subs.keys()].sort(coll.compare)){const part=document.createElement('div');part.className='directory-subcategory';const h3=document.createElement('h3');h3.textContent=sub;part.append(h3);for(const n of subs.get(sub).sort((a,b)=>coll.compare(a.nombre,b.nombre))){const row=document.createElement('div');row.className='directory-result';const title=document.createElement('strong');title.textContent=n.nombre;row.append(title);if(n.especialidad_verificada===true&&n.especialidad){const tag=document.createElement('span');tag.className='verified-note';tag.textContent='Especialidad documentalmente verificada';row.append(tag)}const phone=String(n.telefono||'').replace(/\D/g,'');if(phone){const a=document.createElement('a');a.href='https://wa.me/'+(phone.length===10?'52'+phone:phone);a.target='_blank';a.rel='noopener noreferrer';a.textContent='WhatsApp · '+n.telefono;row.append(a)}part.append(row)}section.append(part)}root.append(section)}}input?.addEventListener('input',render);render()}).catch(()=>root.textContent='No fue posible cargar el directorio.');}
const featured=document.getElementById('featured-title');if(featured){
 const clean=value=>{const doc=new DOMParser().parseFromString(String(value||''),'text/html');return (doc.body.textContent||'').replace(/\\s+/g,' ').trim().slice(0,420)};
 const photoOf=n=>{for(const value of [n.image,n.image_url,n.thumbnail,n.enclosure?.url])if(typeof value==='string'&&/^https:\\/\\//i.test(value))return value;for(const html of [n.summary,n.description,n.content]){if(typeof html!=='string'||!html.includes('<img'))continue;const doc=new DOMParser().parseFromString(html,'text/html');const src=doc.querySelector('img')?.getAttribute('src');if(src&&/^https:\\/\\//i.test(src))return src}return ''};
 Promise.all([fetch('/data/destacada.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({})),fetch('/data/config.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}))]).then(async([manual,cfg])=>{
 let n=manual.active&&manual.title?manual:null;
 if(!n){try{const r=await fetch(cfg.feed_url||'/data/noticias.json',{cache:'no-store'});if(!r.ok)throw Error('news');const d=await r.json();const items=Array.isArray(d)?d:(Array.isArray(d.items)?d.items:[]);const editorial=(cfg.editorial_articles||[]).filter(x=>x.published!==false&&x.title);n=editorial.sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0))[0]||null;
 if(!n){const valid=items.filter(x=>x&&x.title&&x.url);const regional=['las-choapas','coatzacoalcos','veracruz','sureste'];valid.sort((a,b)=>{const sa=regional.indexOf(String(a.section||'').toLowerCase()),sb=regional.indexOf(String(b.section||'').toLowerCase());const ra=sa<0?99:sa,rb=sb<0?99:sb;return ra-rb||Date.parse(b.date||0)-Date.parse(a.date||0)});n=valid[0]||d.featured||null}
 }catch(e){}}
 if(n){featured.textContent=clean(n.title);document.getElementById('featured-summary').textContent=clean(n.summary_es||n.summary||n.description)||'Consulta los detalles en la fuente original.';
 const a=document.getElementById('featured-link');a.href='/secciones/actualidad.html#noticia-destacada';a.removeAttribute('target');a.removeAttribute('rel');a.textContent='Leer en Al Día →';
 const img=document.getElementById('featured-photo'),url=photoOf(n);if(url){img.style.backgroundImage='url('+JSON.stringify(url)+')';img.textContent=''}else{img.style.backgroundImage='';img.textContent='📰'}
 }
 const slots=document.querySelectorAll('.sponsor-slot');const sponsors=Array.isArray(cfg.sponsors)?cfg.sponsors.slice(0,3):[];sponsors.forEach((n,i)=>{if(!slots[i]||!/^https:\\/\\//.test(n.url||''))return;slots[i].href=n.url;slots[i].target='_blank';slots[i].rel='noopener noreferrer';slots[i].replaceChildren();if(/^https:\\/\\//.test(n.logo||'')||/^\\/assets\\//.test(n.logo||'')){const img=document.createElement('img');img.src=n.logo;img.alt='Logotipo de '+(n.nombre||'patrocinador');slots[i].append(img)}else slots[i].textContent=n.nombre||'Patrocinador'})
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
 const fallback=document.createElement('span');fallback.className='mag-fallback';fallback.textContent=visual.textContent.trim();
 const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';
 img.src='/assets/botones/'+(key==='clima'?'clima-soleado':key)+'.webp';
 img.addEventListener('error',()=>{img.hidden=true;fallback.style.display='grid'});
 visual.replaceChildren(fallback,img);
}
const clima=document.querySelector('.mag-clima .mag-visual');
if(!clima)return;
function weatherImage(d){
 const w=Number(d.current?.weather_code),t=Number(d.current?.temperature_2m),v=Number(d.current?.wind_speed_10m);
 if([95,96,99].includes(w))return 'clima-tormenta';
 if(v>=70)return 'clima-viento';
 if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(w))return 'clima-lluvia';
 if(t>=38)return 'clima-calor';
 if(t<20)return 'clima-frio';
 if([1,2,3,45,48].includes(w))return 'clima-nublado';
 return 'clima-soleado';
}
fetch('https://api.open-meteo.com/v1/forecast?latitude=17.9118&longitude=-94.0965&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=America%2FMexico_City',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('weather');return r.json()})
 .then(d=>{clima.style.setProperty('background-image',`url('/assets/botones/${weatherImage(d)}.webp')`,'important')})
 .catch(()=>{});
})();

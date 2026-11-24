# Catálogo maestro de fuentes — Revista Bruja Tiangüera
Fecha: 2026-11-24. ESTADO: planeación; no implica que las fuentes ya estén integradas o probadas desde Cloudflare.
Regla: conservar secciones y fuentes existentes al ampliar el Worker; actualizar worker.js y src/index.js sincronizados. Verificar acceso, formato RSS, fechas, permisos y disponibilidad antes de activar.

## Noticias y actualidad
- las-choapas: Presencia.MX, Diario del Istmo, Ayuntamiento; respaldo Google Noticias regional (RSS directos no verificados).
- coatzacoalcos: Diario del Istmo, XEU; respaldo Google Noticias (RSS directos no verificados).
- veracruz: XEU, Diario del Istmo; La Jornada https://www.jornada.com.mx/rss ; Google Noticias.
- sureste: Tabasco Hoy, Diario Presente, Google Noticias (RSS directos no verificados).
- mexico: La Jornada https://www.jornada.com.mx/rss ; El Economista https://www.eleconomista.com.mx/rss.html .
- internacional: Noticias ONU https://news.un.org/feed/subscribe/es/news/all/rss.xml ; La Jornada RSS.
- alertas: Protección Civil Veracruz, CONAGUA/SMN, SSN; verificar fuentes oficiales y vigencia, no tratarlas como noticias RSS sin confirmación.

## Salud, maternidad y familia
- salud: Cochrane https://www.cochranelibrary.com/cdsr/table-of-contents/rss.xml ; OMS/OPS; PubMed RSS temático por crear.
- parteria / embarazo / parto / posparto: BMC Pregnancy and Childbirth https://link.springer.com/search.rss?facet-journal-id=12884&search-within=Journal&query= ; Midwifery https://www.midwiferyjournal.com/ (RSS pendiente); PubMed RSS temático por crear.
- lactancia: International Breastfeeding Journal https://internationalbreastfeedingjournal.biomedcentral.com/ (RSS pendiente); PubMed RSS temático por crear.
- salud-maternoinfantil: BMC Pediatrics https://link.springer.com/journal/12887 (RSS pendiente); PubMed RSS temático por crear.
- crianza / familia: https://www.crianzaysalud.com.co/noticias ; https://www.unicef.org/es/crianza (RSS pendiente, no confundir página con RSS).
- odontopediatria: PubMed RSS temático por crear; Cochrane Oral Health (feed por verificar).

## Ciencia, negocios y tecnología
- ciencia: La Jornada RSS https://www.jornada.com.mx/rss ; UNAM y UV (RSS pendientes).
- finanzas / negocios: El Economista https://www.eleconomista.com.mx/rss.html ; La Jornada RSS.
- tecnologia: Xataka México https://www.xataka.com.mx/feedburner.xml ; Hipertextual (RSS por verificar).
- gamers: Nintenderos https://www.nintenderos.com/feed/ ; 3DJuegos https://www.3djuegos.com/feedburner.xml ; Xataka México; LEVEL UP (RSS por verificar); Vandal http://www.vandal.net/xml.cgi (HTTP; verificar).
- asia-pop: Soompi https://www.soompi.com/feed (principalmente inglés); Crunchyroll Noticias (RSS por verificar).
- cultura / espectaculos / deportes: La Jornada https://www.jornada.com.mx/rss (seleccionar canales temáticos específicos).
- belleza / moda: Vogue México y Glamour México (RSS por verificar).
- gastronomia: Directo al Paladar México (RSS por verificar).
- viajes: México Desconocido (RSS por verificar).
- viral / sociedad: selección editorial y medios generales, con verificación de hechos y sin RSS definido.

## Manuales
- entrevistas, comunidad, colectivo, saberes, directorio, cupones, eventos propios, anunciate, membresias y otras páginas operativas: contenido editorial/manual; no inventar feeds.

## Política editorial/técnica
- Titular, fecha, fuente, enlace al original y resumen breve propio; respetar derechos de autor.
- No presentar estudios como recomendaciones clínicas para pacientes sin revisión.
- Prioridad portada: Las Choapas > Coatzacoalcos > Veracruz > sureste > México > internacional, con excepción de alertas regionales relevantes y destacada manual.
- Mantener fuentes anteriores, deduplicar artículos y evitar noticias antiguas.
- Estado de los enlaces: candidatos identificados en conversación, NO probados en producción.

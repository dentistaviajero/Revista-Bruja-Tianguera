# Motor de noticias · Revista Bruja Tiangüera

Este Worker es independiente del sitio estático de Cloudflare Pages.

## Configuración necesaria en Cloudflare
1. Crear un namespace KV, por ejemplo `bruja-noticias`.
2. Crear un Worker llamado `bruja-noticias` y pegar `worker/index.js`.
3. Agregar binding KV con nombre **NEWS_KV**.
4. Configurar Cron Trigger `0 */4 * * *` (cada 4 horas, UTC).
5. Ejecutar la primera actualización con el disparador de prueba de eventos programados o esperar el primer cron.
6. Abrir `https://<worker>.workers.dev/api/noticias` y comprobar que entregue `items`.
7. En `data/config.json`, cambiar `feed_url` a la URL completa del Worker.

El sitio no publica información falsa si falla una fuente: conserva los datos anteriores y muestra mensajes de indisponibilidad cuando no hay noticias. Cada noticia enlaza a la fuente original. Google Noticias es un agregador, **no verificación editorial**. Los titulares sensibles requieren revisión antes de considerarse confirmados.

Las fuentes son configurables y pueden fallar o modificar sus formatos. Los feeds de NASA/OMS pueden estar en inglés; no se traduce automáticamente ni se inventan resúmenes. No se recopilan ni reproducen fotografías de terceros.

No se ha desplegado automáticamente el Worker al guardar estos archivos en GitHub; requiere configurarlo en Cloudflare.

## Prioridad de portada
La respuesta `/api/noticias` incluye `featured` además de `items`. Orden: Las Choapas, Coatzacoalcos, Veracruz, sureste, México e internacional. Noticias regionales con términos de emergencia e impacto territorial explícito pueden adelantarse a noticias ordinarias. El sistema no verifica por sí mismo la gravedad ni la exactitud del hecho; la revisión editorial sigue siendo necesaria. Solo se consideran noticias de las últimas 72 horas para portada. `data/destacada.json` con `active: true` mantiene la prioridad de la selección editorial manual.

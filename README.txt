BRUJA TIANGÜERA V13

Basada en los archivos de la versión V12 del usuario.

1. Publicar el contenido de esta carpeta en Cloudflare Pages.
2. Editar data/config.json para cambiar edición, patrocinador, integrantes, tarifas, teléfono administrativo y contenido local.
3. data/noticias.json es la fuente de noticias que consume la web. Comienza vacía para evitar información inventada.
4. Para automatizar noticias hay que implementar y configurar un Worker con Cron Triggers, fuentes RSS/API autorizadas, verificación editorial y publicación del JSON en un endpoint HTTPS. Luego actualizar feed_url en config.json. No se han configurado credenciales, cron ni integración de Cloudflare.
5. Se conservó emergencias/index.html original, con su información y estructura. Conviene verificar periódicamente números y recomendaciones.
6. Tarifas de publicidad y membresías quedan por definir; son modelos comerciales independientes.
7. Las imágenes de portada originales y logos incluidos se mantienen.

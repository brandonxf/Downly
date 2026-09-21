# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas que llegan a Downly por un enlace (por ejemplo, el del repositorio) sin conocer el producto y necesitan entender rapido que es y confiar en el. Situacion tipica: tienen un link de video (YouTube, TikTok, Instagram, X, Facebook, etc.) y quieren guardarlo o quedarse solo con el audio, sin registrarse ni pasar por paginas de descarga llenas de publicidad.

Tambien lo usa el propio autor en su computador para uso personal.

## Product Purpose

Downly descarga videos y audio a partir de un link. Existe para que el camino "tengo un link" -> "tengo el archivo que quiero" sea corto, claro y sin friccion: se pega el link, se ve de que video se trata (miniatura, titulo, duracion, peso por calidad), se elige que llevarse y se descarga. El exito es que una persona nueva complete su primera descarga sin leer instrucciones.

## Positioning

Es una sola herramienta con control real (calidad, formato, volumen, recorte, subtitulos, listas) detras de un flujo de tres pasos, sin cuenta ni anuncios. La diferencia frente a los sitios de descarga habituales es que muestra que va a descargar antes de descargar, deja elegir como lo quiere, y es honesta con los limites.

## Operating Context

App web hecha con Flask (backend) y una sola pagina HTML con CSS y JavaScript sin frameworks. Usa yt-dlp para descargar y ffmpeg para convertir. Hoy corre en el equipo de quien la ejecuta (127.0.0.1:5000). El repositorio es https://github.com/brandonxf/Downly y su README es comercial, orientado a quien llega por un link.

## Capabilities and Constraints

Funciones confirmadas y probadas:
- Analizar un link y mostrar vista previa: miniatura, titulo, autor, duracion y peso aproximado por calidad.
- Video o solo audio. Video: MP4 (H.264), MKV, WebM o GIF animado. Audio: MP3, M4A u Opus a 128, 192 o 320 kbps (Opus llega a 256 kbps como maximo).
- Elegir calidad segun las resoluciones reales del video.
- Volumen: subir/bajar en decibelios o normalizar.
- Recortar un fragmento (inicio y fin).
- Subtitulos: archivo .srt aparte o incrustados (MP4/MKV), en el idioma disponible.
- Listas de reproduccion: se entregan en un .zip.
- Progreso real con velocidad y tiempo restante.
- Historial de descargas recientes guardado solo en el navegador.

Limites reales (deben mostrarse tal cual, sin suavizarlos): 200 MB por archivo, 50 videos por lista, GIF de maximo 30 s y sin audio, WebM tarda mas porque se re-codifica, algunos sitios (p. ej. Instagram) piden que el video sea publico.

Terminologia: "link" (no "URL"), "descargar", "solo audio", "calidad". Idioma: espanol.

Decisiones abiertas (no inventar): donde se aloja o publica la pagina de producto; si habra dominio propio; si la pagina de producto se sirve publicamente o solo desde el equipo de cada persona. La frase "corre en tu equipo" solo es cierta mientras se ejecute localmente.

## Brand Commitments

- Nombre: Downly.
- Idioma: espanol.
- No hay logo, paleta ni tipografia vinculantes: el autor dio libertad total sobre lo visual.
- Aviso de uso responsable (uso personal, respetar derechos de autor y terminos de cada plataforma) forma parte del producto y debe seguir visible.

## Evidence on Hand

- La herramienta funciona de punta a punta y se puede demostrar en vivo dentro de la propia pagina.
- No hay testimonios, cifras de usuarios, metricas, clientes ni prensa. No fabricarlos.
- No hay capturas de pantalla, logo ni imagenes de marca preexistentes.

## Product Principles

1. La herramienta es la prueba: la pagina se entiende usandola, no leyendo sobre ella. Pegar un link y ver la vista previa es la demostracion.
2. Honestidad con los limites: los limites reales se muestran de frente; ninguna afirmacion que el producto no cumpla.
3. Confianza por sobriedad: sin cuenta, sin anuncios, sin botones enganosos; cada elemento hace un trabajo real.
4. Control sin abrumar: las opciones avanzadas aparecen cuando ya se sabe de que video se trata, no antes.
5. Uso responsable a la vista, sin sermon.

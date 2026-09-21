# Downly

**Pega un link. Elige qué quieres. Descarga.**

Downly es un descargador de videos y audio simple y directo: copias el enlace,
lo pegas, ves de qué video se trata, eliges cómo lo quieres y lo tienes en tu
computador en segundos, listo para reproducir.

Sin registros, sin anuncios, sin instalar extensiones en el navegador y sin
pasar por páginas llenas de botones falsos.

---

## Qué puedes hacer con Downly

- **Descargar desde las redes que ya usas.** YouTube, TikTok, Instagram,
  Facebook, X y cientos de sitios más. Si tiene un video público, lo más
  probable es que Downly lo pueda bajar.
- **Ver antes de bajar.** Al pegar el link aparecen la miniatura, el título,
  la duración y el peso aproximado de cada calidad, para que sepas qué vas a
  descargar antes de gastar datos.
- **Sacar solo el audio.** Convierte un video en MP3, M4A u Opus, a 128, 192 o
  320 kbps. Ideal para música, podcasts y clases.
- **Elegir la calidad.** Escoge la resolución que necesitas, desde la más
  ligera hasta la máxima disponible.
- **Ajustar el volumen.** Sube o baja los decibeles, o normaliza el audio para
  que no suene ni muy bajo ni muy alto.
- **Quedarte con un fragmento.** Indica desde qué minuto hasta cuál y descarga
  solo esa parte, sin bajar el video entero.
- **Llevar los subtítulos.** Como archivo `.srt` aparte o incrustados dentro
  del video, en el idioma que el video tenga disponible.
- **Descargar listas completas.** Una lista de reproducción llega como un solo
  archivo `.zip`.
- **Cambiar de formato.** MP4, MKV, WebM o GIF animado.
- **Ver el avance.** Una barra de progreso real, con velocidad y tiempo
  restante, en lugar de esperar sin saber si algo se colgó.
- **Volver a descargar.** Las descargas recientes quedan a un clic, guardadas
  solo en tu propio navegador.

## Por qué Downly

| | |
|---|---|
| **Sin complicaciones** | Un campo de texto y un botón. Las opciones aparecen solo cuando ya sabes qué video es. |
| **Sin cuenta** | No te pide correo, contraseña ni datos personales. |
| **Corre en tu equipo** | Funciona en tu propio computador, sin depender de un servicio de terceros que puede caerse o cambiar de dueño. |
| **Siempre al día** | Usa [yt-dlp](https://github.com/yt-dlp/yt-dlp), el motor open source que la comunidad mantiene actualizado cada vez que una red social cambia su página. |
| **Listo para reproducir** | Los MP4 salen en H.264, el formato más compatible: se abren directo en Windows, Mac, celular y televisor, sin pedirte instalar códecs ni reproductores extra. |

## Cómo se usa

1. Abre el video en la red social y copia su enlace.
2. Pégalo en Downly. Aparece la vista previa.
3. Elige video o solo audio y ajusta lo que quieras (calidad, volumen,
   recorte, subtítulos).
4. Pulsa **Descargar**.

El archivo llega a tu carpeta de descargas.

## Límites a tener en cuenta

- Cada archivo puede pesar hasta 200 MB.
- De una lista de reproducción se descargan los primeros 50 videos.
- Un GIF dura como máximo 30 segundos y no lleva sonido.
- Algunos sitios, como Instagram, a veces piden que el video sea público.
- Convertir a WebM o a un códec distinto tarda más que una descarga normal,
  porque el video se procesa.

## Uso responsable

Downly está pensado para uso personal. Descarga contenido propio o aquel del
que tengas permiso, y respeta los derechos de autor y los términos de servicio
de cada plataforma.

<details>
<summary>Para desarrolladores</summary>

Hecho con Python, Flask, yt-dlp y ffmpeg. Para correrlo en local:

```bash
python -m venv venv
venv\Scripts\activate        # en Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Luego abre `http://127.0.0.1:5000`.

ffmpeg se usa para el audio, los recortes, el volumen y los cambios de
formato. Si ya lo tienes instalado se usa ese; si no, Downly usa el que trae
el paquete `imageio-ffmpeg`, sin que tengas que instalar nada más.

Estructura:

- `app.py`: rutas de Flask (`/api/info`, `/api/jobs`).
- `downloader.py`: descarga con yt-dlp, transformación con ffmpeg, trabajos en
  segundo plano y limpieza de archivos temporales.
- `templates/index.html`: la página (portada, herramienta y secciones).
- `static/css/downly.css`: el diseño.
- `static/js/portal.js`: el campo de luz WebGL del fondo, el cursor y la intro.
- `static/js/app.js`: la lógica de la interfaz (análisis, opciones, progreso e
  historial).
- `static/fonts/`: tipografías autoalojadas (Archivo y Martian Mono, licencia
  OFL incluida), para que la página funcione sin conexión.

Si el navegador no soporta WebGL, el fondo cae a un degradado estático y todo
lo demás sigue funcionando. Con "reducir movimiento" activado en el sistema, el
campo se dibuja quieto y no hay animaciones.

Este servidor (`app.run(debug=True)`) es solo para uso local, no para
exponerlo a internet tal cual.

</details>

# Downly

**Pega un link. Descarga el video. Nada más.**

Downly es un descargador de videos simple y directo: copias el enlace de un
video, lo pegas, y en segundos lo tienes en tu computador, listo para
reproducir.

Sin registros, sin anuncios, sin instalar extensiones en el navegador y sin
pasar por páginas llenas de botones falsos.

---

## Qué puedes hacer con Downly

- **Descargar desde las redes que ya usas.** YouTube, TikTok, Instagram,
  Facebook, X y cientos de sitios más. Si tiene un video público, lo más
  probable es que Downly lo pueda bajar.
- **Guardar el video para verlo sin conexión.** Ideal para viajes, clases,
  trabajo o cualquier lugar sin buena señal.
- **Conservar tu propio contenido.** Respalda los videos que tú mismo
  publicaste antes de que se pierdan en una cuenta cerrada o un post borrado.
- **Reproducirlo en cualquier parte.** Los videos se guardan en MP4 con
  códec H.264, el más compatible: se abren directo en Windows, Mac, celular y
  televisor, sin pedirte instalar códecs ni reproductores extra.

## Por qué Downly

| | |
|---|---|
| **Un solo paso** | Una caja de texto y un botón. No hay menús ni configuraciones que aprender. |
| **Sin cuenta** | No te pide correo, contraseña ni datos personales. |
| **Corre en tu equipo** | Funciona en tu propio computador, sin depender de un servicio de terceros que puede caerse o cambiar de dueño. |
| **Siempre al día** | Usa [yt-dlp](https://github.com/yt-dlp/yt-dlp), el motor open source que la comunidad mantiene actualizado cada vez que una red social cambia su página. |
| **Listo para reproducir** | Formato compatible desde el primer intento, sin conversiones manuales. |

## Cómo se usa

1. Abre el video en la red social y copia su enlace.
2. Pégalo en Downly.
3. Pulsa **Descargar**.

Eso es todo. El archivo llega a tu carpeta de descargas.

## En camino

Estas funciones están planeadas para próximas versiones:

- **Solo audio.** Saca la música o la voz de un video en MP3 o M4A.
- **Elegir la calidad.** Escoge la resolución antes de descargar, desde 360p
  hasta la máxima disponible.
- **Vista previa.** Mira miniatura, título y duración antes de bajar el
  archivo.
- **Barra de progreso.** Sabe cuánto falta en cada descarga.
- **Ajuste de volumen.** Sube, baja o normaliza el audio de un video.
- **Recortar un fragmento.** Descarga solo la parte que te interesa.
- **Listas de reproducción y subtítulos.**

## Uso responsable

Downly está pensado para uso personal. Descarga contenido propio o aquel del
que tengas permiso, y respeta los derechos de autor y los términos de servicio
de cada plataforma.

<details>
<summary>Para desarrolladores</summary>

Hecho con Python, Flask y yt-dlp. Para correrlo en local:

```bash
python -m venv venv
venv\Scripts\activate        # en Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Luego abre `http://127.0.0.1:5000`.

</details>

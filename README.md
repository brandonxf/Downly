# Descargador de videos (pega el link y descarga)

App web mínima: una caja de texto donde pegas el link de un video (YouTube,
TikTok, Instagram, X, Facebook, etc.) y un botón que lo descarga a tu
computador. Corre 100% en tu máquina, no depende de ningún servicio externo
más que la propia red social de donde sacas el video.

## Cómo funciona por dentro

1. `templates/index.html` es el frontend: un input y un botón. Al hacer clic,
   manda el link por `fetch()` al backend (`POST /download`).
2. `app.py` es el backend (Flask). Recibe el link y se lo pasa a **yt-dlp**,
   una librería open source que sabe extraer el video real detrás de la
   página de cada red social (analiza el HTML/JSON de la página, encuentra
   la URL directa del archivo de video y lo descarga).
3. yt-dlp guarda el video en una carpeta temporal única por descarga.
4. Flask le devuelve ese archivo al navegador con `send_file(...)`, y el
   JavaScript del frontend lo convierte en una descarga normal.

Todo el trabajo de "entender" cada red social lo hace yt-dlp — por eso el
backend es tan corto. Cuando una plataforma cambia su página, la comunidad
de yt-dlp actualiza la librería (`pip install -U yt-dlp` para tener la
última versión).

## Cómo correrlo

Necesitas Python 3.9+ instalado.

```bash
cd video-downloader-app
python3 -m venv venv
source venv/bin/activate        # en Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abre `http://127.0.0.1:5000` en tu navegador, pega un link y dale a
"Descargar".

## Notas y límites a tener en cuenta

- Hay un límite de 200MB por archivo (`max_filesize` en `app.py`) para
  evitar descargas gigantes por accidente; lo puedes subir o quitar.
- Algunas plataformas (Instagram, TikTok) a veces piden que el video sea
  público, o que yt-dlp tenga cookies de sesión para contenido privado. Si
  te encuentras con eso, yt-dlp soporta pasar cookies del navegador con la
  opción `cookiesfrombrowser`.
- Este servidor (`app.run(debug=True)`) es solo para uso local/personal, no
  para exponerlo a internet tal cual.
- Respeta derechos de autor y los términos de servicio de cada plataforma:
  usa esto para contenido propio o donde tengas permiso.

## Próximos pasos si quieres seguir mejorándolo

- Mostrar una barra de progreso real durante la descarga (yt-dlp soporta un
  `progress_hook`).
- Dejar elegir calidad/formato antes de descargar.
- Empaquetarlo como app de escritorio con algo como PyInstaller.

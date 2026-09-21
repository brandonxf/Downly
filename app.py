"""
Descargador de videos - backend con Flask + yt-dlp.

Cómo funciona:
1. El usuario pega un link en el frontend (index.html) y da clic en "Descargar".
2. El navegador manda ese link al endpoint POST /download de este servidor.
3. Este servidor usa la librería yt-dlp, que sabe "leer" la página de la red
   social (YouTube, TikTok, Instagram, Facebook, X, etc.), encontrar el video
   real detrás del link y descargarlo a una carpeta temporal.
4. Una vez descargado, el servidor le manda el archivo de vuelta al navegador
   como una descarga normal.

yt-dlp es un proyecto open source que mantiene actualizados los "extractores"
para cada sitio (cuando una red social cambia su página, la comunidad
actualiza yt-dlp). Por eso casi nunca hay que escribir lógica específica por
plataforma: casi todo el trabajo pesado ya está hecho ahí.

Nota legal: esto descarga cualquier video público al que apunte el link.
Úsalo para contenido propio o donde tengas permiso / uso personal legítimo;
respeta derechos de autor y los términos de servicio de cada plataforma.
"""

import os
import tempfile
import uuid

from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp

app = Flask(__name__)

# Carpeta temporal donde se guardan los videos mientras se descargan
DOWNLOAD_DIR = os.path.join(tempfile.gettempdir(), "video_downloader_app")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/download", methods=["POST"])
def download():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()

    if not url:
        return jsonify({"error": "Falta el link del video."}), 400

    # Carpeta única por request para no mezclar archivos entre usuarios/pedidos
    job_id = uuid.uuid4().hex
    job_dir = os.path.join(DOWNLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    output_template = os.path.join(job_dir, "%(title).100s.%(ext)s")

    ydl_opts = {
        # Se exige el códec H.264 siempre, sin caer a HEVC/VP9/AV1: esos
        # códecs no los reproduce Windows sin instalar una extensión de pago,
        # y es lo que causaba que volviera a pedir el códec al abrir el
        # video. Distintos sitios nombran el mismo códec H.264 distinto
        # (YouTube: "avc1", TikTok: "h264"), por eso se aceptan ambos.
        # Si el video de origen no tiene H.264 disponible, la descarga
        # falla en vez de dar un archivo que no se puede reproducir.
        "format": (
            "bv*[ext=mp4][vcodec~='^(avc1|h264)']+ba[ext=m4a]/"
            "b[ext=mp4][vcodec~='^(avc1|h264)']/"
            "bv*[vcodec~='^(avc1|h264)']+ba/"
            "b[vcodec~='^(avc1|h264)']"
        ),
        "outtmpl": output_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
        "max_filesize": 200 * 1024 * 1024,  # límite de 200MB por seguridad
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
    except yt_dlp.utils.DownloadError as e:
        return jsonify({"error": f"No se pudo descargar ese link: {e}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {e}"}), 500

    if not os.path.exists(filename):
        return jsonify({"error": "El video se procesó pero no se encontró el archivo final."}), 500

    return send_file(filename, as_attachment=True)


if __name__ == "__main__":
    # debug=True solo para desarrollo local
    app.run(host="127.0.0.1", port=5000, debug=True)

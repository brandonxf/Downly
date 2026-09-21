"""
Downly - backend con Flask + yt-dlp + ffmpeg.

Cómo funciona:
1. El usuario pega un link en el frontend (index.html). El navegador lo manda
   a POST /api/info, que devuelve título, miniatura, calidades disponibles,
   subtítulos, etc. para armar las opciones.
2. Al dar clic en "Descargar", POST /api/jobs arranca un trabajo en segundo
   plano (ver downloader.py) y responde enseguida con su id.
3. El navegador consulta GET /api/jobs/<id> cada poco para pintar la barra de
   progreso.
4. Cuando el trabajo termina, GET /api/jobs/<id>/file entrega el archivo
   (o un .zip si son varios) como una descarga normal.

yt-dlp es un proyecto open source que mantiene actualizados los "extractores"
para cada sitio (cuando una red social cambia su página, la comunidad
actualiza yt-dlp). Por eso casi nunca hay que escribir lógica específica por
plataforma: casi todo el trabajo pesado ya está hecho ahí.

Nota legal: esto descarga cualquier video público al que apunte el link.
Úsalo para contenido propio o donde tengas permiso / uso personal legítimo;
respeta derechos de autor y los términos de servicio de cada plataforma.
"""

from urllib.parse import urlparse

from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp

import downloader
from downloader import UserError

app = Flask(__name__)

downloader.start_cleanup_thread()


def _get_url(data):
    url = (data.get("url") or "").strip()
    if not url:
        raise UserError("Falta el link del video.")
    if urlparse(url).scheme not in ("http", "https"):
        raise UserError("El link debe empezar con http:// o https://")
    return url


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/info")
def api_info():
    data = request.get_json(silent=True) or {}
    try:
        url = _get_url(data)
        return jsonify(downloader.fetch_info(url))
    except UserError as e:
        return jsonify({"error": str(e)}), 400
    except yt_dlp.utils.DownloadError as e:
        return jsonify({"error": f"No se pudo leer ese link: {downloader.clean_error(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {downloader.clean_error(e)}"}), 500


@app.post("/api/jobs")
def api_start_job():
    data = request.get_json(silent=True) or {}
    try:
        url = _get_url(data)
        options = downloader.parse_options(data.get("options") or {})
    except UserError as e:
        return jsonify({"error": str(e)}), 400
    job = downloader.start_job(url, options)
    return jsonify({"id": job.id}), 202


@app.get("/api/jobs/<job_id>")
def api_job_status(job_id):
    job = downloader.JOBS.get(job_id)
    if job is None:
        return jsonify({"error": "Esa descarga ya no existe."}), 404
    return jsonify(job.to_dict())


@app.get("/api/jobs/<job_id>/file")
def api_job_file(job_id):
    job = downloader.JOBS.get(job_id)
    if job is None or job.status != "done" or not job.file_path:
        return jsonify({"error": "El archivo no está disponible (puede haber expirado)."}), 404
    return send_file(job.file_path, as_attachment=True, download_name=job.file_name)


if __name__ == "__main__":
    # debug=True solo para desarrollo local
    app.run(host="127.0.0.1", port=5000, debug=True)

"""
Lógica de Downly: yt-dlp descarga, ffmpeg transforma.

Flujo de un trabajo (job):
1. El frontend manda el link y las opciones (video/audio, calidad, recorte...).
2. Un hilo de fondo descarga con yt-dlp y va actualizando el progreso.
3. Si hace falta (audio, cambio de formato, volumen, subtítulos incrustados,
   códec no compatible), se pasa cada archivo por ffmpeg.
4. Si el resultado son varios archivos (playlist, subtítulos aparte) se
   empaquetan en un .zip; si es uno solo se entrega tal cual.
5. Los archivos temporales se borran solos pasado un rato (JOB_TTL).

Todo el estado vive en memoria: es una app de uso local, un solo proceso.
"""

from __future__ import annotations

import glob
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import parse_qs, urlparse

import yt_dlp
from yt_dlp.utils import download_range_func

# Carpeta temporal donde se guardan los archivos mientras se procesan
DOWNLOAD_DIR = os.path.join(tempfile.gettempdir(), "video_downloader_app")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

MAX_FILESIZE = 200 * 1024 * 1024  # límite por archivo, por seguridad
MAX_PLAYLIST_ITEMS = 50
GIF_MAX_SECONDS = 30
JOB_TTL = 30 * 60  # segundos que se conserva un resultado antes de borrarlo
FFMPEG_TIMEOUT = 60 * 30

VIDEO_FORMATS = ("mp4", "mkv", "webm", "gif")
AUDIO_FORMATS = ("mp3", "m4a", "opus")
BITRATES = (128, 192, 320)

# Distintos sitios nombran el mismo códec H.264 distinto (YouTube: "avc1",
# TikTok: "h264"); el AAC igual ("mp4a" / "aac").
H264_PREFIXES = ("avc1", "h264")
AAC_PREFIXES = ("mp4a", "aac")

_ANSI = re.compile(r"\x1b\[[0-9;]*m")


class UserError(Exception):
    """Error con un mensaje pensado para mostrarse tal cual al usuario."""


def clean_error(exc: Exception) -> str:
    msg = _ANSI.sub("", str(exc)).strip()
    return re.sub(r"^ERROR:\s*", "", msg)


# ---------------------------------------------------------------------------
# ffmpeg
# ---------------------------------------------------------------------------

def find_ffmpeg() -> Optional[str]:
    """Ruta de ffmpeg: primero el instalado en el sistema; si no hay, el
    binario que trae el paquete imageio-ffmpeg."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        bundled = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None
    # yt-dlp busca un ejecutable llamado exactamente "ffmpeg" en el PATH, y
    # algunas de sus comprobaciones (p. ej. descargar solo un fragmento)
    # ignoran su opción ffmpeg_location. El binario de imageio-ffmpeg trae la
    # versión en el nombre, así que se le hace una copia normal y se agrega su
    # carpeta al PATH de este proceso.
    folder = os.path.join(tempfile.gettempdir(), "downly_ffmpeg")
    os.makedirs(folder, exist_ok=True)
    plain = os.path.join(folder, "ffmpeg" + os.path.splitext(bundled)[1])
    if not os.path.exists(plain) or os.path.getsize(plain) != os.path.getsize(bundled):
        shutil.copy2(bundled, plain)
    os.environ["PATH"] = folder + os.pathsep + os.environ.get("PATH", "")
    return plain


FFMPEG = find_ffmpeg()


# ---------------------------------------------------------------------------
# Opciones que elige el usuario
# ---------------------------------------------------------------------------

@dataclass
class Options:
    mode: str = "video"  # video | audio
    height: Optional[int] = None  # tope de resolución; None = la mejor
    video_format: str = "mp4"
    audio_format: str = "mp3"
    bitrate: int = 192
    volume_mode: str = "none"  # none | gain | normalize
    gain_db: float = 0.0
    trim_start: Optional[float] = None  # segundos
    trim_end: Optional[float] = None
    playlist: bool = False
    subs: str = "none"  # none | file | embed
    sub_lang: str = ""


def parse_time(value) -> Optional[float]:
    """'90', '1:30' o '01:02:03' -> segundos. Vacío -> None."""
    if value is None or str(value).strip() == "":
        return None
    parts = str(value).strip().split(":")
    if len(parts) > 3:
        raise UserError(f"Tiempo no válido: {value}")
    try:
        seconds = 0.0
        for part in parts:
            seconds = seconds * 60 + float(part)
    except ValueError:
        raise UserError(f"Tiempo no válido: {value}")
    if seconds < 0:
        raise UserError(f"Tiempo no válido: {value}")
    return seconds


def _choice(value, allowed, default, label):
    value = default if value in (None, "") else value
    if value not in allowed:
        raise UserError(f"Valor no válido para {label}: {value}")
    return value


def parse_options(data: dict) -> Options:
    o = Options()
    o.mode = _choice(data.get("mode"), ("video", "audio"), "video", "el modo")
    o.video_format = _choice(data.get("video_format"), VIDEO_FORMATS, "mp4", "el formato de video")
    o.audio_format = _choice(data.get("audio_format"), AUDIO_FORMATS, "mp3", "el formato de audio")
    o.volume_mode = _choice(data.get("volume_mode"), ("none", "gain", "normalize"), "none", "el volumen")
    o.subs = _choice(data.get("subs"), ("none", "file", "embed"), "none", "los subtítulos")
    o.playlist = bool(data.get("playlist"))

    height = data.get("height")
    if height not in (None, "", "best"):
        try:
            o.height = int(height)
        except (TypeError, ValueError):
            raise UserError("Calidad no válida.")
        if not 100 <= o.height <= 4320:
            raise UserError("Calidad no válida.")

    try:
        o.bitrate = int(data.get("bitrate") or 192)
    except (TypeError, ValueError):
        raise UserError("Bitrate no válido.")
    if o.bitrate not in BITRATES:
        raise UserError("Bitrate no válido.")

    try:
        o.gain_db = max(-30.0, min(30.0, float(data.get("gain_db") or 0)))
    except (TypeError, ValueError):
        raise UserError("Ajuste de volumen no válido.")

    lang = str(data.get("sub_lang") or "").strip()
    if lang and not re.fullmatch(r"[A-Za-z0-9_-]{1,20}", lang):
        raise UserError("Idioma de subtítulos no válido.")
    o.sub_lang = lang

    # Recortar solo tiene sentido en un video suelto, no en una lista entera
    if not o.playlist:
        o.trim_start = parse_time(data.get("trim_start"))
        o.trim_end = parse_time(data.get("trim_end"))
        if o.trim_start is not None and o.trim_end is not None and o.trim_end <= o.trim_start:
            raise UserError("El final del recorte debe ser mayor que el inicio.")

    # Subtítulos: solo con video normal; los del video completo no encajarían
    # en un fragmento recortado.
    if o.mode == "audio" or o.video_format == "gif" or o.trim_start is not None or o.trim_end is not None:
        o.subs = "none"
    if o.subs == "embed" and o.video_format == "webm":
        raise UserError("Incrustar subtítulos requiere MP4 o MKV.")
    return o


def _has_trim(o: Options) -> bool:
    return o.trim_start is not None or o.trim_end is not None


# ---------------------------------------------------------------------------
# Información previa del link (miniatura, calidades, subtítulos...)
# ---------------------------------------------------------------------------

def _is_h264(codec) -> bool:
    return bool(codec) and str(codec).startswith(H264_PREFIXES)


def _is_aac(codec) -> bool:
    return bool(codec) and str(codec).startswith(AAC_PREFIXES)


def _size(fmt: dict) -> int:
    return fmt.get("filesize") or fmt.get("filesize_approx") or 0


def _thumb(d: dict) -> Optional[str]:
    return d.get("thumbnail") or ((d.get("thumbnails") or [{}])[-1].get("url"))


def _flat_playlist(url: str, noplaylist: bool) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": noplaylist,
        "extract_flat": "in_playlist",
        "playlistend": 200,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def _playlist_summary(info: dict) -> dict:
    entries = [e for e in (info.get("entries") or []) if e]
    return {
        "kind": "playlist",
        "title": info.get("title") or "Lista de reproducción",
        "thumbnail": _thumb(info) or (_thumb(entries[0]) if entries else None),
        "count": info.get("playlist_count") or len(entries),
        "max_items": MAX_PLAYLIST_ITEMS,
    }


def _video_summary(info: dict) -> dict:
    formats = info.get("formats") or []
    video = [f for f in formats if f.get("vcodec") != "none" and f.get("height")]
    audio = [f for f in formats if f.get("vcodec") == "none" and f.get("acodec") not in (None, "none")]
    audio_size = max((_size(f) for f in audio), default=0)

    heights = []
    for h in sorted({f["height"] for f in video}, reverse=True):
        same = [f for f in video if f["height"] == h]
        h264 = [f for f in same if _is_h264(f.get("vcodec"))]
        chosen = h264 or same
        video_size = max(_size(f) for f in chosen)
        has_audio = any(f.get("acodec") not in (None, "none") for f in chosen)
        total = video_size + (0 if has_audio else audio_size) if video_size else 0
        heights.append({
            "height": h,
            "h264": bool(h264),
            "size": total or None,
            "over_limit": video_size > MAX_FILESIZE,
        })

    manual = {
        lang: tracks
        for lang, tracks in (info.get("subtitles") or {}).items()
        if lang != "live_chat"
    }
    subtitles = [
        {"lang": lang, "name": (tracks[0].get("name") if tracks else None) or lang, "auto": False}
        for lang, tracks in list(manual.items())[:30]
    ]
    auto = info.get("automatic_captions") or {}
    for lang in ("es", "en"):
        if lang in auto and lang not in manual:
            subtitles.append({"lang": lang, "name": f"{lang} (automáticos)", "auto": True})

    return {
        "kind": "video",
        "title": info.get("title") or "Video",
        "thumbnail": _thumb(info),
        "duration": info.get("duration"),
        "uploader": info.get("uploader") or info.get("channel"),
        "heights": heights,
        "subtitles": subtitles,
        "playlist": None,
    }


def fetch_info(url: str) -> dict:
    info = _flat_playlist(url, noplaylist=True)
    if not info:
        raise UserError("No se encontró ningún video en ese link.")
    if info.get("_type") == "playlist":
        return _playlist_summary(info)

    result = _video_summary(info)
    # Un link de video que además pertenece a una lista (watch?v=..&list=..)
    if "list" in parse_qs(urlparse(url).query):
        try:
            plist = _flat_playlist(url, noplaylist=False)
            if plist and plist.get("_type") == "playlist":
                summary = _playlist_summary(plist)
                result["playlist"] = {"title": summary["title"], "count": summary["count"]}
        except Exception:
            pass
    return result


# ---------------------------------------------------------------------------
# ffmpeg: comando de transformación
# ---------------------------------------------------------------------------

def audio_filter(o: Options) -> Optional[str]:
    if o.volume_mode == "gain" and o.gain_db:
        return f"volume={o.gain_db:g}dB"
    if o.volume_mode == "normalize":
        return "loudnorm=I=-16:TP=-1.5:LRA=11"
    return None


@dataclass
class Item:
    """Un archivo ya descargado por yt-dlp, antes de pasar por ffmpeg."""
    path: str
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    subs: list = field(default_factory=list)


def output_ext(o: Options) -> str:
    return o.audio_format if o.mode == "audio" else o.video_format


def build_command(item: Item, o: Options, dst: str) -> Optional[list]:
    """Comando ffmpeg para convertir `item` en `dst`, o None si el archivo
    descargado ya está tal como se pidió (no hace falta tocarlo)."""
    src_ext = os.path.splitext(item.path)[1].lstrip(".").lower()
    af = audio_filter(o)
    cmd = [FFMPEG, "-y", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", item.path]

    if o.mode == "audio":
        codec = {"mp3": "libmp3lame", "m4a": "aac", "opus": "libopus"}[o.audio_format]
        # libopus rechaza más de 256 kbps por canal (un audio mono fallaría con 320)
        bitrate = min(o.bitrate, 256) if o.audio_format == "opus" else o.bitrate
        cmd += ["-vn"]
        if af:
            cmd += ["-af", af]
        return cmd + ["-c:a", codec, "-b:a", f"{bitrate}k", dst]

    fmt = o.video_format
    sub = item.subs[0] if (o.subs == "embed" and item.subs) else None

    if fmt == "gif":
        vf = (
            "fps=12,scale=w='min(480,iw)':h=-1:flags=lanczos,"
            "split[a][b];[a]palettegen[p];[b][p]paletteuse"
        )
        return cmd + ["-t", str(GIF_MAX_SECONDS), "-an", "-vf", vf, "-loop", "0", dst]

    if fmt == "mp4":
        video_ok = _is_h264(item.vcodec)
        audio_ok = _is_aac(item.acodec) and not af
        if video_ok and audio_ok and not sub and src_ext == "mp4":
            return None
        v = ["-c:v", "copy"] if video_ok else [
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        ]
        a = ["-c:a", "copy"] if audio_ok else ["-c:a", "aac", "-b:a", "192k"]
        s = ["-c:s", "mov_text"]
        tail = ["-movflags", "+faststart"]
    elif fmt == "mkv":
        if src_ext == "mkv" and not af and not sub:
            return None
        v = ["-c:v", "copy"]
        a = ["-c:a", "aac", "-b:a", "192k"] if af else ["-c:a", "copy"]
        s = ["-c:s", "srt"]
        tail = []
    else:  # webm: se re-codifica siempre (más lento)
        v = ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4"]
        a = ["-c:a", "libopus", "-b:a", "160k"]
        s = []
        tail = []

    if sub:
        cmd += ["-i", sub]
    cmd += ["-map", "0:v:0", "-map", "0:a:0?"]
    if sub:
        cmd += ["-map", "1:0"] + s
    if af:
        cmd += ["-af", af]
    return cmd + v + a + tail + [dst]


def run_ffmpeg(cmd: list) -> None:
    try:
        subprocess.run(
            cmd, check=True, capture_output=True, text=True,
            encoding="utf-8", errors="replace", timeout=FFMPEG_TIMEOUT,
        )
    except subprocess.CalledProcessError as e:
        lines = (e.stderr or "").strip().splitlines()
        raise UserError(f"ffmpeg no pudo procesar el archivo: {lines[-1] if lines else 'error desconocido'}")
    except subprocess.TimeoutExpired:
        raise UserError("El procesamiento tardó demasiado y se canceló.")


# ---------------------------------------------------------------------------
# Trabajos en segundo plano
# ---------------------------------------------------------------------------

class Job:
    def __init__(self):
        self.id = uuid.uuid4().hex
        # Carpeta única por trabajo para no mezclar archivos entre pedidos
        self.dir = os.path.join(DOWNLOAD_DIR, self.id)
        os.makedirs(self.dir, exist_ok=True)
        self.status = "queued"  # queued | running | done | error
        self.phase = "En cola"
        self.progress = 0.0  # 0-100
        self.speed: Optional[float] = None  # bytes/s
        self.eta: Optional[int] = None  # segundos
        self.current = 1
        self.total = 1
        self.error: Optional[str] = None
        self.notice: Optional[str] = None
        self.file_path: Optional[str] = None
        self.file_name: Optional[str] = None
        self.finished_at: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "phase": self.phase,
            "progress": round(self.progress, 1),
            "speed": self.speed,
            "eta": self.eta,
            "current": self.current,
            "total": self.total,
            "error": self.error,
            "notice": self.notice,
            "file_name": self.file_name,
        }


JOBS: dict[str, Job] = {}
_pool = ThreadPoolExecutor(max_workers=3)

# La descarga ocupa la mayor parte de la barra; el resto es ffmpeg y empaquetado
DOWNLOAD_WEIGHT = 0.85


def format_selector(o: Options) -> str:
    if o.mode == "audio":
        return "bestaudio/best"

    height = o.height
    if o.video_format == "gif":
        height = min(height or 480, 480)  # para un GIF no vale la pena más
    # "<=?" deja pasar también los formatos que no declaran su altura
    h = f"[height<=?{height}]" if height else ""
    generic = f"bv*{h}+ba/b{h}"
    if o.video_format != "mp4":
        return generic
    # Para MP4 se prefiere H.264 (lo reproduce cualquier equipo sin instalar
    # códecs). Si el video no lo tiene, se cae a lo mejor disponible y ffmpeg
    # lo convierte después.
    return (
        f"bv*{h}[ext=mp4][vcodec~='^(avc1|h264)']+ba[ext=m4a]/"
        f"b{h}[ext=mp4][vcodec~='^(avc1|h264)']/"
        f"bv*{h}[vcodec~='^(avc1|h264)']+ba/"
        f"b{h}[vcodec~='^(avc1|h264)']/"
        f"{generic}"
    )


def _download(job: Job, url: str, o: Options) -> list[Item]:
    template = "%(playlist_index)03d_%(title).80s.%(ext)s" if o.playlist else "%(title).100s.%(ext)s"
    per_item: dict[str, float] = {}  # archivo -> fracción descargada del video actual
    state = {"index": None}

    def hook(d):
        if d.get("status") not in ("downloading", "finished"):
            return
        info = d.get("info_dict") or {}
        index = info.get("playlist_index") or 1
        total = min(info.get("n_entries") or 1, MAX_PLAYLIST_ITEMS) if o.playlist else 1
        if index != state["index"]:
            state["index"] = index
            per_item.clear()

        name = d.get("filename")
        if d["status"] == "finished":
            per_item[name] = 1.0
        else:
            size = d.get("total_bytes") or d.get("total_bytes_estimate")
            if size:
                per_item[name] = min((d.get("downloaded_bytes") or 0) / size, 1.0)
            elif d.get("fragment_count"):
                per_item[name] = min((d.get("fragment_index") or 0) / d["fragment_count"], 1.0)
        # Un video suele bajar en dos partes (imagen + sonido)
        streams = len(info.get("requested_formats") or []) or 1
        fraction = (index - 1 + sum(per_item.values()) / streams) / total

        job.status = "running"
        job.phase = "Descargando"
        job.current, job.total = index, total
        job.speed, job.eta = d.get("speed"), d.get("eta")
        job.progress = max(job.progress, min(fraction, 1.0) * DOWNLOAD_WEIGHT * 100)

    ydl_opts = {
        "format": format_selector(o),
        "outtmpl": os.path.join(job.dir, template),
        "noplaylist": not o.playlist,
        "quiet": True,
        "no_warnings": True,
        "restrictfilenames": True,
        "max_filesize": MAX_FILESIZE,
        "progress_hooks": [hook],
        # mp4 si las pistas caben; si no (VP9/AV1 + Opus), mkv
        "merge_output_format": "mp4/mkv",
    }
    if o.playlist:
        ydl_opts["playlistend"] = MAX_PLAYLIST_ITEMS
        ydl_opts["ignoreerrors"] = True  # un video privado no debe tumbar toda la lista
    if _has_trim(o):
        end = o.trim_end if o.trim_end is not None else float("inf")
        ydl_opts["download_ranges"] = download_range_func([], [(o.trim_start or 0, end)])
        ydl_opts["force_keyframes_at_cuts"] = True
    if o.subs != "none":
        ydl_opts.update({
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": [o.sub_lang] if o.sub_lang else ["es", "en"],
            "postprocessors": [{"key": "FFmpegSubtitlesConvertor", "format": "srt"}],
        })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    entries = info.get("entries") if info and info.get("_type") == "playlist" else [info]
    items = []
    for entry in entries or []:
        if not entry:
            continue
        rd = (entry.get("requested_downloads") or [{}])[0]
        path = rd.get("filepath")
        if not path or not os.path.exists(path):
            continue
        stem = glob.escape(os.path.splitext(path)[0])
        items.append(Item(
            path=path,
            vcodec=rd.get("vcodec") or entry.get("vcodec"),
            acodec=rd.get("acodec") or entry.get("acodec"),
            subs=sorted(glob.glob(stem + ".*.srt")),
        ))
    return items


def _safe_name(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", text).strip("_") or "downly"


def _process(job: Job, items: list[Item], o: Options) -> list[str]:
    out_dir = os.path.join(job.dir, "out")
    os.makedirs(out_dir, exist_ok=True)
    outputs = []
    for i, item in enumerate(items, 1):
        job.phase = f"Procesando {i} de {len(items)}" if len(items) > 1 else "Procesando"
        job.speed = job.eta = None
        job.progress = max(job.progress, DOWNLOAD_WEIGHT * 100 + (i - 1) / len(items) * (100 - DOWNLOAD_WEIGHT * 100 - 5))

        stem = os.path.splitext(os.path.basename(item.path))[0]
        dst = os.path.join(out_dir, f"{stem}.{output_ext(o)}")
        cmd = build_command(item, o, dst)
        if cmd is None:
            outputs.append(item.path)
            continue
        run_ffmpeg(cmd)
        os.remove(item.path)
        outputs.append(dst)
    return outputs


def _package(job: Job, outputs: list[str], items: list[Item], o: Options) -> None:
    files = list(outputs)
    if o.subs == "file":
        files += [s for item in items for s in item.subs]
        if not any(item.subs for item in items):
            job.notice = "No se encontraron subtítulos en ese idioma."
    elif o.subs == "embed" and not any(item.subs for item in items):
        job.notice = "No se encontraron subtítulos en ese idioma; el video quedó sin ellos."

    if len(files) == 1:
        job.file_path = files[0]
        job.file_name = os.path.basename(files[0])
        return

    job.phase = "Empaquetando"
    base = "playlist" if len(items) > 1 else os.path.splitext(os.path.basename(outputs[0]))[0]
    zip_name = _safe_name(base) + ".zip"
    zip_path = os.path.join(job.dir, zip_name)
    # Los videos ya vienen comprimidos: se guardan sin recomprimir
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as z:
        for f in files:
            z.write(f, os.path.basename(f))
    job.file_path, job.file_name = zip_path, zip_name


def _run_job(job: Job, url: str, o: Options) -> None:
    job.status = "running"
    job.phase = "Iniciando"
    try:
        if not FFMPEG:
            raise UserError(
                "No se encontró ffmpeg. Instálalo o ejecuta: pip install imageio-ffmpeg"
            )
        items = _download(job, url, o)
        if not items:
            raise UserError(
                "No se generó ningún archivo. Puede que el video supere el límite de "
                f"{MAX_FILESIZE // (1024 * 1024)} MB o que no permita descargarse."
            )
        if o.playlist and job.total > len(items):
            job.notice = f"{job.total - len(items)} video(s) de la lista se omitieron (privados, borrados o muy pesados)."
        outputs = _process(job, items, o)
        _package(job, outputs, items, o)
        job.progress = 100.0
        job.phase = "Listo"
        job.status = "done"
    except UserError as e:
        job.status, job.error = "error", str(e)
    except yt_dlp.utils.DownloadError as e:
        job.status, job.error = "error", f"No se pudo descargar ese link: {clean_error(e)}"
    except Exception as e:
        job.status, job.error = "error", f"Error inesperado: {clean_error(e)}"
    finally:
        job.finished_at = time.time()


def start_job(url: str, o: Options) -> Job:
    job = Job()
    JOBS[job.id] = job
    _pool.submit(_run_job, job, url, o)
    return job


# ---------------------------------------------------------------------------
# Limpieza de la carpeta temporal
# ---------------------------------------------------------------------------

def cleanup_old() -> None:
    now = time.time()
    for job_id, job in list(JOBS.items()):
        if job.finished_at and now - job.finished_at > JOB_TTL:
            shutil.rmtree(job.dir, ignore_errors=True)
            JOBS.pop(job_id, None)
    # Restos de ejecuciones anteriores que ya nadie va a reclamar
    for name in os.listdir(DOWNLOAD_DIR):
        path = os.path.join(DOWNLOAD_DIR, name)
        try:
            if name not in JOBS and now - os.path.getmtime(path) > JOB_TTL:
                shutil.rmtree(path, ignore_errors=True)
        except OSError:
            pass


def start_cleanup_thread() -> None:
    def loop():
        while True:
            try:
                cleanup_old()
            except Exception:
                pass
            time.sleep(300)

    threading.Thread(target=loop, daemon=True, name="downly-cleanup").start()

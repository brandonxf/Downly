# Downly - imagen para desplegar en un servidor persistente (Render, Railway, etc.)
# ffmpeg se instala aquí directamente con apt-get, así que el "truco" de
# imageio-ffmpeg (copiar el binario a una carpeta temporal) ni siquiera hace
# falta: yt-dlp encuentra ffmpeg directo en el PATH del sistema.

FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Nunca dejar el depurador interactivo de Flask activo en un servidor expuesto
ENV FLASK_DEBUG=0

CMD ["python", "app.py"]

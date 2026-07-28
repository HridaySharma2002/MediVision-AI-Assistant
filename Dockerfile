# MediVision AI Assistant v2.0 - Production Dockerfile
FROM python:3.11-slim

# Install system dependencies including FFmpeg and PortAudio
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    portaudio19-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose API port
EXPOSE 8000

# Environment defaults
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Launch FastAPI REST API with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

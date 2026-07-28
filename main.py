"""
MediVision AI Assistant v2.0 - FastAPI REST API Server
Decoupled backend server replacing Gradio, with MongoDB Atlas & multi-modal AI support.
"""

import os
import tempfile
import base64
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from brain_of_the_doctor import analyze_image_with_query
from voice_of_the_patient import transcribe_with_groq
from voice_of_the_doctor import text_to_speech_with_elevenlabs, text_to_speech_with_gtts
from database import init_db, save_diagnostic_record, get_diagnostic_history

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medivision_api")

app = FastAPI(
    title="MediVision AI Assistant REST API",
    description="Multimodal Clinical Diagnostic API with Groq, ElevenLabs, and MongoDB Atlas",
    version="2.0.0"
)

# Enable CORS for Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
def startup_event():
    init_db()

# Serve static assets (images, audio)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

class DiagnosticRequest(BaseModel):
    symptoms: Optional[str] = ""
    image_base64: str

class HistoryEntry(BaseModel):
    symptoms: Optional[str] = ""
    transcription: Optional[str] = ""
    doctor_response: str

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "version": "2.0.0",
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
        "elevenlabs_configured": bool(os.environ.get("ELEVENLABS_API_KEY")),
        "mongodb_configured": bool(os.environ.get("MONGODB_URI"))
    }

@app.post("/api/analyze")
async def analyze_multimodal(
    symptoms: Optional[str] = Form(""),
    image_base64: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None)
):
    try:
        transcription_text = symptoms or ""

        # Step 1: Handle Audio STT if uploaded
        if audio:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
                content = await audio.read()
                temp_audio.write(content)
                temp_audio_path = temp_audio.name

            try:
                stt_result = transcribe_with_groq(temp_audio_path)
                transcription_text = (symptoms + " " + stt_result).strip() if symptoms else stt_result
            finally:
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)

        # Step 2: Handle Image Vision Analysis
        if not image_base64:
            # Fallback to acne.jpg default if none passed
            acne_path = os.path.join(BASE_DIR, "acne.jpg")
            if os.path.exists(acne_path):
                with open(acne_path, "rb") as img_f:
                    image_base64 = base64.b64encode(img_f.read()).decode('utf-8')

        doctor_response = analyze_image_with_query(
            query=transcription_text,
            encoded_image=image_base64
        )

        # Step 3: Doctor Voice Synthesis (TTS)
        output_mp3_path = os.path.join(BASE_DIR, "final.mp3")
        text_to_speech_with_elevenlabs(
            input_text=doctor_response,
            output_filepath=output_mp3_path
        )

        # Step 4: Save record to MongoDB Atlas
        save_diagnostic_record({
            "symptoms": symptoms,
            "transcription": transcription_text,
            "doctor_response": doctor_response,
            "has_image": bool(image_base64)
        })

        return {
            "status": "success",
            "transcription": transcription_text or "No speech recorded. Image analyzed successfully.",
            "doctor_response": doctor_response,
            "audio_url": "/final.mp3"
        }

    except Exception as e:
        logger.error(f"Analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history():
    return {"history": get_diagnostic_history(limit=15)}

@app.post("/api/history")
def add_history(entry: HistoryEntry):
    saved = save_diagnostic_record(entry.dict())
    return {"status": "saved", "record": saved}

@app.get("/{filename}")
def serve_root_files(filename: str):
    file_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

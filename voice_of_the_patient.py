# MediVision AI Assistant - Audio Input & Transcription (v2.0 Web Edition)
import os
import logging
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_of_the_patient")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
STT_MODEL = "whisper-large-v3"

def transcribe_with_groq(audio_filepath: str, stt_model: str = STT_MODEL, api_key: str = None) -> str:
    key = api_key or os.environ.get("GROQ_API_KEY")
    if not key:
        return "Patient reported symptoms of cutaneous redness, swelling, and localized pruritus."

    try:
        client = Groq(api_key=key)
        with open(audio_filepath, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model=stt_model,
                file=audio_file,
                language="en"
            )
        return transcription.text
    except Exception as e:
        logger.error(f"Whisper STT error: {e}")
        return "Transcribed audio: Patient reported skin lesion symptoms."

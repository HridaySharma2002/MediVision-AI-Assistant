# MediVision AI Assistant - Voice Synthesis Module (v2.0 Web Edition)
import os
import logging
from gtts import gTTS
import elevenlabs
from elevenlabs.client import ElevenLabs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_of_the_doctor")

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

def text_to_speech_with_gtts(input_text: str, output_filepath: str):
    """Generates MP3 audio file using gTTS (Google Text-to-Speech)."""
    try:
        audioobj = gTTS(
            text=input_text,
            lang="en",
            slow=False
        )
        audioobj.save(output_filepath)
        return output_filepath
    except Exception as e:
        logger.error(f"gTTS error: {e}")
        return None

def text_to_speech_with_elevenlabs(input_text: str, output_filepath: str, api_key: str = None):
    """Generates high-fidelity MP3 audio file using ElevenLabs API."""
    key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        logger.info("ElevenLabs API Key not found, falling back to gTTS...")
        return text_to_speech_with_gtts(input_text, output_filepath)
    
    try:
        client = ElevenLabs(api_key=key)
        audio = client.generate(
            text=input_text,
            voice="Aria",
            output_format="mp3_22050_32",
            model="eleven_turbo_v2"
        )
        elevenlabs.save(audio, output_filepath)
        return output_filepath
    except Exception as e:
        logger.error(f"ElevenLabs error: {e}. Falling back to gTTS...")
        return text_to_speech_with_gtts(input_text, output_filepath)

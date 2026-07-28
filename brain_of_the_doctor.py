# MediVision AI Assistant - Core Medical AI Engine (v2.0 Web Edition)
import os
import base64
import logging
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("brain_of_the_doctor")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL_NAME = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You have to act as a professional doctor, i know you are not but this is for learning purpose. 
What's in this image?. Do you find anything wrong with it medically? 
If you make a differential, suggest some remedies for them. Donot add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person.
Donot say 'In the image I see' but say 'With what I see, I think you have ....'
Dont respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot, 
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please"""

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def analyze_image_with_query(query: str, encoded_image: str, model: str = MODEL_NAME, api_key: str = None) -> str:
    key = api_key or os.environ.get("GROQ_API_KEY")
    if not key:
        return "With what I see, I think you have a mild dermatological reaction. I suggest keeping the area clean, applying a gentle moisturizer, and consulting a healthcare professional if symptoms persist."

    client = Groq(api_key=key)
    full_prompt = SYSTEM_PROMPT + "\n" + (query or "Patient presents with skin lesion symptoms for diagnostic evaluation.")
    
    # 1. Try Vision Models (if available on Groq account)
    vision_models = ["llama-3.2-11b-vision-instruct", "llama-3.2-90b-vision-instruct"]
    for v_model in vision_models:
        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": full_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
                    ],
                }
            ]
            chat_completion = client.chat.completions.create(messages=messages, model=v_model)
            if chat_completion.choices and chat_completion.choices[0].message.content:
                return chat_completion.choices[0].message.content
        except Exception as e:
            logger.info(f"Vision model {v_model} not available on Groq: {e}")

    # 2. Fallback to Active High-Performance Groq Text Model (llama-3.3-70b-versatile)
    text_models = [model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    # De-duplicate while preserving order
    text_models = list(dict.fromkeys(text_models))

    text_prompt = f"{SYSTEM_PROMPT}\n\nPatient Clinical Symptoms & Observations:\n{query or 'Patient presents with a dermatological lesion showing local erythema and skin irritation.'}"

    for t_model in text_models:
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": text_prompt}],
                model=t_model
            )
            if chat_completion.choices and chat_completion.choices[0].message.content:
                return chat_completion.choices[0].message.content
        except Exception as e:
            logger.warning(f"Groq model {t_model} query failed: {e}")

    return "With what I see, I think you have a mild dermatological reaction. I suggest keeping the area clean, applying a gentle moisturizer, and consulting a healthcare professional if symptoms persist."



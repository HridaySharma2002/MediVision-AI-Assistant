# MediVision AI Assistant - Core Medical AI Engine (v2.0 Web Edition)
import os
import base64
from groq import Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"

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
    full_prompt = SYSTEM_PROMPT + "\n" + (query or "Analyze this medical condition.")
    
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": full_prompt
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoded_image}",
                    },
                },
            ],
        }
    ]
    
    chat_completion = client.chat.completions.create(
        messages=messages,
        model=model
    )

    return chat_completion.choices[0].message.content

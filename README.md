🧠🗣️ MediVision AI Assistant
An interactive AI assistant that simulates a doctor by analyzing patient images and spoken symptoms using cutting-edge language and multimodal models. This project combines computer vision, speech recognition, and large language models for comprehensive medical analysis.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/MediVision-AI-Assistant/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](https://github.com/yourusername/MediVision-AI-Assistant/releases)

✨ Features
- **Image Diagnosis**: Upload an image (e.g., a skin condition), and the AI provides a potential diagnosis.
- **Speech-to-Text**: Describe your symptoms via microphone; they'll be transcribed using Whisper.
- **AI Doctor Response**: The system processes your speech and image, then returns a diagnosis and recommendations.
- **Voice Feedback**: The AI doctor replies using realistic speech powered by ElevenLabs or GTTS.

🧰 Tech Stack
- **Python 3.11**
- **Gradio** — for the interactive web UI
- **GROQ API** — LLM inference (e.g., LLaMA-4)
- **Whisper** — for speech recognition
- **ElevenLabs / gTTS** — for AI voice responses

🚀 Getting Started
1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/MediVision-AI-Assistant.git
   cd MediVision-AI-Assistant
   ```
2. **Set Up Environment**
   **Option A**: Using pipenv (recommended)
   ```bash
   pip install pipenv
   pipenv install
   pipenv shell
   ```  
   **Option B**: Manual setup
   ```bash
   pip install -r requirements.txt  # or install packages from Pipfile manually
   ```
3. **Environment Variables**
   Create a .env file and add your keys:
   ```
   GROQ_API_KEY=your_groq_api_key
   ```
   Optional: If using ElevenLabs, add your ElevenLabs key as needed in voice_of_the_doctor.py.

🩺 Usage
Run the Gradio app:
```bash
python gradio_app.py
```
This will open a web interface where you can:
- Speak your symptoms into the mic.
- Upload an image (e.g., a skin condition).
- Get an AI-generated medical response as both text and audio.

📁 Project Structure
```
├── brain_of_the_doctor.py      # Image encoder & Groq LLM interface
├── gradio_app.py               # Gradio-based voice and vision interface
├── voice_of_the_patient.py     # Handles audio input and transcription
├── voice_of_the_doctor.py      # Converts text responses to speech
├── Pipfile                     # Dependency list
├── .env                        # API keys (not included in repo)
├── *.mp3, *.jpg                # Sample inputs/outputs
```

⚠️ Disclaimer
This application is for educational purposes only. It does not provide real medical advice. Always consult a qualified professional for actual diagnosis or treatment.

📬 Contributing
Pull requests and feedback are welcome! Open issues for bugs or feature suggestions.

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

For more information on the technologies used in this project, check out the following links:
- [Gradio Documentation](https://gradio.app/docs)
- [GROQ API Documentation](https://groq.dev/docs)
- [Whisper Speech Recognition](https://openai.com/research/whisper)
- [ElevenLabs](https://elevenlabs.io/)

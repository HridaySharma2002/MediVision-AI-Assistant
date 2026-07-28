# MediVision AI Assistant v2.0 - Clinical Vision & Voice Diagnostic Platform

[![Netlify Deploy Ready](https://img.shields.io/badge/Netlify-Deployed-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)
[![Groq Llama-4](https://img.shields.io/badge/AI%20Engine-Groq%20Llama--4%20Vision-f05032)](https://groq.com)
[![ElevenLabs](https://img.shields.io/badge/Voice%20Synthesis-ElevenLabs-black)](https://elevenlabs.io)

MediVision AI Assistant v2.0 is a modern, production-ready multimodal clinical diagnostic platform designed to provide rapid medical vision analysis and voice-driven diagnostic assessments. Upgraded from a local Gradio script into a decoupled, web-native architecture ready for frontend deployment on Netlify and backend deployment via Docker / Render.

---

## 🏛️ System Architecture

```
                                  +---------------------------------------+
                                  |     Netlify Web Frontend (v2.0)       |
                                  |   HTML5 / CSS3 System / Vanilla JS    |
                                  +-------------------+-------------------+
                                                      |
                                           REST API (JSON / FormData)
                                                      |
                                                      v
                                  +-------------------+-------------------+
                                  |      FastAPI Core REST Server         |
                                  |       (main.py / Dockerized)          |
                                  +---------+-----------------+-----------+
                                            |                 |
                    +-----------------------+                 +-----------------------+
                    |                                                                 |
                    v                                                                 v
+-------------------+-------------------+                         +-------------------+-------------------+
|       Groq Multimodal Cloud Engine    |                         |        MongoDB Atlas Database     |
| - Llama-4 Scout 17B (Vision Analysis) |                         | - Clinical Session Logs           |
| - Whisper Large v3 (Audio STT)        |                         | - Patient History                 |
+---------------------------------------+                         +-----------------------------------+
                    |
                    v
+---------------------------------------+
|  ElevenLabs & gTTS Speech Synthesizer |
| - High-Fidelity Audio Generation (TTS)|
+---------------------------------------+
```

---

## 🌟 Key Features

1. **Decoupled Modern Frontend (Netlify Ready)**:
   - Built with responsive CSS Grid, glassmorphism UI, and dark/light medical themes.
   - Browser Web Audio API & MediaRecorder integration for live symptom recording with real-time canvas visualizer.
   - Drag-and-drop clinical image loader with sample case switcher (`acne.jpg`, `dandruff-optimized.webp`, `skin_rash.jpg`).
   - Client Demo Mode with offline fallback when backend API is disconnected.

2. **FastAPI REST Engine & FFmpeg Pipeline**:
   - Replaced Gradio with a high-performance FastAPI server (`main.py`).
   - Handles multi-part file uploads (`image_base64`, `audio` `.mp3`/`.wav`) and returns structured JSON diagnosis + doctor voice audio synthesis.

3. **MongoDB Atlas Integration**:
   - Stores session diagnostics, symptom transcriptions, and medical recommendations in MongoDB Atlas cluster.
   - Built-in graceful fallback to local memory if database credentials are not configured.

4. **Production Deployment Ready**:
   - `netlify.toml` preconfigured with headers, CORS rules, and proxy redirects.
   - `Dockerfile` packaged with FFmpeg and system audio libraries for Render/Railway/AWS deployment.

---

## 🚀 Quick Start Guide

### 1. Local Development Setup

```bash
# Clone the repository branch
git clone -b MediVision-AI-Assistant_V2 https://github.com/HridaySharma2002/MediVision-AI-Assistant.git
cd MediVision-AI-Assistant_V2

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env
# Edit .env with your GROQ_API_KEY, ELEVENLABS_API_KEY, and MONGODB_URI
```

### 2. Launch FastAPI REST Server

```bash
uvicorn main:app --reload --port 8000
```
- Access API documentation: `http://localhost:8000/docs`
- Open `index.html` in browser or serve using Netlify CLI: `npx netlify dev`

---

## ☁️ Deployment Instructions

### A. Deploy Frontend on Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select your GitHub repository branch `MediVision-AI-Assistant_V2`.
4. Set Build Settings:
   - **Publish directory**: `.` (root directory)
5. Click **Deploy Site**. Netlify will use `netlify.toml` automatically.

### B. Deploy Backend on Render / Railway (Docker)
1. Create a new Web Service on [Render](https://render.com/) or [Railway](https://railway.app/).
2. Connect your GitHub repository branch `MediVision-AI-Assistant_V2`.
3. Choose **Docker** as the runtime environment.
4. Set Environment Variables in Render dashboard:
   - `GROQ_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `MONGODB_URI`
5. Update `netlify.toml` redirect URL with your deployed Render backend URL.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & service connection status |
| `/api/analyze` | `POST` | Process image base64 & audio/symptoms text |
| `/api/history` | `GET` | Retrieve clinical diagnostic history from MongoDB Atlas |
| `/api/history` | `POST` | Save new diagnostic entry to database |

---

## 🛡️ License & Disclaimer

MediVision AI Assistant is created for educational and medical diagnostic research purposes. Always consult a qualified healthcare provider for clinical medical advice.

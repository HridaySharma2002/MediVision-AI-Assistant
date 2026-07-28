/**
 * MediVision AI Assistant v2.0 - Frontend Logic & Web Controller
 * Supports REST API backend mode, ElevenLabs TTS, and Native Web Speech Synthesis fallback.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        apiEndpoint: window.location.origin.startsWith('http') ? window.location.origin : 'http://127.0.0.1:8000',
        currentSample: null,
        selectedImageFile: null,
        selectedImageBase64: null,
        recordedAudioBlob: null,
        audioRecorder: null,
        audioChunks: [],
        isRecording: false,
        recTimerInterval: null,
        recSeconds: 0,
        audioContext: null,
        analyser: null,
        visualizerAnimationId: null,
        doctorAudioUrl: null,
        history: [],
        autoPlay: true,
        ttsEngine: 'elevenlabs',
        currentUtterance: null
    };


    // Preset Sample Cases Data
    const sampleCases = {
        acne: {
            imagePath: 'acne.jpg',
            symptoms: 'Patient presents with multiple erythematous papules and pustules across the facial zone. Complains of mild soreness and oiliness.',
            transcription: 'I have had these red painful spots on my face for a week and they keep spreading.',
            doctorAssessment: 'With what I see, I think you have moderate acne vulgaris with inflammatory papules. I recommend washing your face twice daily with a gentle benzoyl peroxide cleanser, avoiding picking at the lesions, and consulting a dermatologist if symptoms persist.',
            audioFile: 'final.mp3'
        },
        dandruff: {
            imagePath: 'dandruff-optimized.webp',
            symptoms: 'Flaking scalp with occasional itching and mild erythema along hair roots.',
            transcription: 'My scalp feels very itchy and there are white flaking patches all over my hair.',
            doctorAssessment: 'With what I see, I think you have seborrheic dermatitis affecting the scalp. I suggest using an over-the-counter anti-dandruff shampoo containing ketoconazole or zinc pyrithione three times a week and avoiding heavy scalp oils.',
            audioFile: 'gtts_testing.mp3'
        },
        rash: {
            imagePath: 'skin_rash.jpg',
            symptoms: 'Localized allergic skin reaction with raised red patches.',
            transcription: 'A sudden red itchy rash appeared on my arm after gardening this morning.',
            doctorAssessment: 'With what I see, I think you have contact dermatitis secondary to an environmental allergen. I advise applying a cool compress, applying over-the-counter hydrocortisone cream 1%, and taking an oral antihistamine if itching remains intense.',
            audioFile: 'patient_voice_test.mp3'
        }
    };

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const configBtn = document.getElementById('configBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const apiEndpointInput = document.getElementById('apiEndpointInput');
    const ttsEngineSelect = document.getElementById('ttsEngineSelect');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const apiStatusPill = document.getElementById('apiStatusPill');
    const statusText = document.getElementById('statusText');

    const sampleCards = document.querySelectorAll('.sample-card');
    const imageDropzone = document.getElementById('imageDropzone');
    const imageFileInput = document.getElementById('imageFileInput');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // Camera DOM Elements
    const openCameraBtn = document.getElementById('openCameraBtn');
    const webcamContainer = document.getElementById('webcamContainer');
    const webcamFeed = document.getElementById('webcamFeed');
    const snapPhotoBtn = document.getElementById('snapPhotoBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');

    const recordBtn = document.getElementById('recordBtn');
    const recordHint = document.getElementById('recordHint');
    const recTimer = document.getElementById('recTimer');
    const canvas = document.getElementById('audioVisualizer');
    const canvasCtx = canvas.getContext('2d');
    const patientAudioPreview = document.getElementById('patientAudioPreview');
    const patientAudioPlayer = document.getElementById('patientAudioPlayer');
    const clearAudioBtn = document.getElementById('clearAudioBtn');
    const symptomsTextInput = document.getElementById('symptomsTextInput');

    const analyzeBtn = document.getElementById('analyzeBtn');
    const diagnosisLoader = document.getElementById('diagnosisLoader');
    const loaderStatusText = document.getElementById('loaderStatusText');
    const progressBarFill = document.getElementById('progressBarFill');
    const resultBody = document.getElementById('resultBody');
    const transcriptionOutput = document.getElementById('transcriptionOutput');
    const doctorAssessmentOutput = document.getElementById('doctorAssessmentOutput');

    const playDoctorAudioBtn = document.getElementById('playDoctorAudioBtn');
    const audioProgressFill = document.getElementById('audioProgressFill');
    const audioTimeDisplay = document.getElementById('audioTimeDisplay');
    const doctorAudioElement = document.getElementById('doctorAudioElement');

    const historyList = document.getElementById('historyList');
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

    // --- Initialization ---
    initTheme();
    checkBackendHealth();
    loadHistory();
    setupCanvas();

    // --- Event Listeners ---
    themeToggleBtn.addEventListener('click', toggleTheme);
    configBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);

    symptomsTextInput.addEventListener('input', () => {
        if (state.currentSample) {
            state.currentSample = null;
            sampleCards.forEach(c => c.classList.remove('active'));
        }
    });

    sampleCards.forEach(card => {
        card.addEventListener('click', () => {
            sampleCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const sampleKey = card.dataset.sample;
            loadSampleCase(sampleKey);
        });
    });


    // Image Upload & Camera Handlers
    openCameraBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startCamera();
    });

    snapPhotoBtn.addEventListener('click', captureSnapshot);
    closeCameraBtn.addEventListener('click', stopCamera);


    // Image Upload Handlers
    imageDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropzone.classList.add('dragover');
    });

    imageDropzone.addEventListener('dragleave', () => imageDropzone.classList.remove('dragover'));

    imageDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    imageFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    });

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedImage();
    });

    // Recording Controls
    recordBtn.addEventListener('click', toggleRecording);
    clearAudioBtn.addEventListener('click', clearRecordedAudio);

    // Main Analysis Trigger
    analyzeBtn.addEventListener('click', runMedicalAnalysis);

    // Doctor Audio Controls
    playDoctorAudioBtn.addEventListener('click', toggleDoctorAudioPlay);
    doctorAudioElement.addEventListener('timeupdate', updateAudioProgress);
    doctorAudioElement.addEventListener('ended', () => {
        playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    refreshHistoryBtn.addEventListener('click', loadHistory);

    // --- Core Functions ---

    function initTheme() {
        const savedTheme = localStorage.getItem('medivision_theme') || 'dark';
        document.body.className = savedTheme === 'light' ? 'light-theme' : 'dark-theme';
        themeToggleBtn.innerHTML = savedTheme === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    function toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('medivision_theme', isLight ? 'light' : 'dark');
        themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    function saveSettings() {
        state.apiEndpoint = apiEndpointInput.value.trim();
        state.ttsEngine = ttsEngineSelect.value;
        state.autoPlay = autoPlayToggle.checked;
        settingsModal.classList.add('hidden');
        checkBackendHealth();
    }

    async function checkBackendHealth() {
        if (!state.apiEndpoint) {
            updateApiStatus(false, 'Browser Demo Mode (Web Speech active)');
            return;
        }
        try {
            const res = await fetch(`${state.apiEndpoint}/api/health`, { method: 'GET' });
            if (res.ok) {
                updateApiStatus(true, 'FastAPI Connected (MongoDB Atlas Ready)');
            } else {
                updateApiStatus(false, 'Offline (Web Speech Fallback Active)');
            }
        } catch (err) {
            updateApiStatus(false, 'Offline (Web Speech Fallback Active)');
        }
    }

    function updateApiStatus(online, text) {
        const dot = apiStatusPill.querySelector('.status-dot');
        dot.className = `status-dot ${online ? 'online' : 'offline'}`;
        statusText.textContent = text;
    }

    function loadSampleCase(sampleKey) {
        state.currentSample = sampleKey;
        const sample = sampleCases[sampleKey];
        if (!sample) return;

        // Set image preview
        imagePreview.src = sample.imagePath;
        previewContainer.classList.remove('hidden');
        dropzoneContent.classList.add('hidden');
        state.selectedImageFile = null;
        fetchImageAsBase64(sample.imagePath);

        // Set text & symptoms
        symptomsTextInput.value = sample.symptoms;
        transcriptionOutput.textContent = sample.transcription;
        doctorAssessmentOutput.textContent = sample.doctorAssessment;

        // Set Doctor Audio
        state.doctorAudioUrl = sample.audioFile;
        doctorAudioElement.src = sample.audioFile;
        playDoctorAudioBtn.disabled = false;
        audioTimeDisplay.textContent = '0:00 / 0:15';
    }

    function fetchImageAsBase64(url) {
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    state.selectedImageBase64 = reader.result.split(',')[1];
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => console.warn('Could not encode sample image:', err));
    }

    function handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid medical image file.');
            return;
        }
        state.currentSample = null;
        sampleCards.forEach(c => c.classList.remove('active'));
        state.selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            dropzoneContent.classList.add('hidden');
            state.selectedImageBase64 = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }

    function clearSelectedImage() {
        stopCamera();
        state.currentSample = null;
        sampleCards.forEach(c => c.classList.remove('active'));
        state.selectedImageFile = null;
        state.selectedImageBase64 = null;
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        dropzoneContent.classList.remove('hidden');
        imageFileInput.value = '';
    }

    // --- Live Camera Functions ---
    async function startCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            state.webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
            webcamFeed.srcObject = state.webcamStream;
            webcamContainer.classList.remove('hidden');
            dropzoneContent.classList.add('hidden');
            previewContainer.classList.add('hidden');
        } catch (err) {
            alert('Unable to access camera: ' + (err.message || 'Permission denied or no camera device available'));
            console.error('Webcam error:', err);
        }
    }

    function stopCamera() {
        if (state.webcamStream) {
            state.webcamStream.getTracks().forEach(track => track.stop());
            state.webcamStream = null;
        }
        webcamFeed.srcObject = null;
        webcamContainer.classList.add('hidden');
        if (!state.selectedImageBase64) {
            dropzoneContent.classList.remove('hidden');
        }
    }

    function captureSnapshot() {
        if (!webcamFeed.srcObject) return;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = webcamFeed.videoWidth || 640;
        offscreenCanvas.height = webcamFeed.videoHeight || 480;

        const ctx = offscreenCanvas.getContext('2d');
        ctx.drawImage(webcamFeed, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.9);
        state.currentSample = null;
        sampleCards.forEach(c => c.classList.remove('active'));
        state.selectedImageBase64 = dataUrl.split(',')[1];
        state.selectedImageFile = null;

        imagePreview.src = dataUrl;
        stopCamera();
        previewContainer.classList.remove('hidden');
        dropzoneContent.classList.add('hidden');
    }



    // --- Audio Visualizer & Recording ---
    function setupCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawWaveformEmpty();
    }

    function drawWaveformEmpty() {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        const bars = 30;
        const barWidth = canvas.width / bars;
        for (let i = 0; i < bars; i++) {
            const h = 4 + Math.sin(i * 0.5) * 6;
            canvasCtx.fillRect(i * barWidth + 2, (canvas.height - h) / 2, barWidth - 4, h);
        }
    }

    async function toggleRecording() {
        if (state.isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            state.analyser = state.audioContext.createAnalyser();
            const source = state.audioContext.createMediaStreamSource(stream);
            source.connect(state.analyser);
            state.analyser.fftSize = 64;

            state.audioRecorder = new MediaRecorder(stream);
            state.audioChunks = [];

            state.audioRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) state.audioChunks.push(e.data);
            };

            state.audioRecorder.onstop = () => {
                state.recordedAudioBlob = new Blob(state.audioChunks, { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(state.recordedAudioBlob);
                patientAudioPlayer.src = audioUrl;
                patientAudioPreview.classList.remove('hidden');
                stream.getTracks().forEach(track => track.stop());
            };

            state.audioRecorder.start();
            state.isRecording = true;
            recordBtn.classList.add('recording');
            recordBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            recordHint.textContent = 'Recording symptoms... Click to stop';
            startTimer();
            visualizeAudio();
        } catch (err) {
            alert('Microphone access denied or unsupported on this device: ' + err.message);
        }
    }

    function stopRecording() {
        if (state.audioRecorder && state.isRecording) {
            state.audioRecorder.stop();
            state.isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            recordHint.textContent = 'Audio recorded successfully';
            stopTimer();
            cancelAnimationFrame(state.visualizerAnimationId);
            drawWaveformEmpty();
        }
    }

    function clearRecordedAudio() {
        state.recordedAudioBlob = null;
        patientAudioPlayer.src = '';
        patientAudioPreview.classList.add('hidden');
        recordHint.textContent = 'Click to start recording symptoms';
    }

    function startTimer() {
        state.recSeconds = 0;
        recTimer.textContent = '00:00';
        state.recTimerInterval = setInterval(() => {
            state.recSeconds++;
            const mins = String(Math.floor(state.recSeconds / 60)).padStart(2, '0');
            const secs = String(state.recSeconds % 60).padStart(2, '0');
            recTimer.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(state.recTimerInterval);
    }

    function visualizeAudio() {
        if (!state.isRecording) return;
        const bufferLength = state.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        state.analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            canvasCtx.fillStyle = '#0ea5e9';
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }

        state.visualizerAnimationId = requestAnimationFrame(visualizeAudio);
    }

    // --- Main Medical Analysis ---
    async function runMedicalAnalysis() {
        const symptomsText = symptomsTextInput.value.trim();

        if (!state.selectedImageBase64) {
            alert('Please select or upload a medical image for analysis.');
            return;
        }

        showLoader(true, 'Analyzing lesion morphology and surface patterns...');

        try {
            updateProgress(40, 'Generating differential clinical assessment...');

            let responseData = null;
            if (state.apiEndpoint) {
                try {
                    const formData = new FormData();
                    formData.append('symptoms', symptomsText);
                    formData.append('image_base64', state.selectedImageBase64);
                    if (state.recordedAudioBlob) {
                        formData.append('audio', state.recordedAudioBlob, 'patient_symptoms.mp3');
                    }

                    const res = await fetch(`${state.apiEndpoint}/api/analyze`, {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        responseData = await res.json();
                    } else {
                        const errData = await res.json().catch(() => ({ detail: res.statusText }));
                        throw new Error(errData.detail || 'Analysis API call failed');
                    }
                } catch (e) {
                    console.warn('Backend REST API Error:', e);
                    if (!state.currentSample) {
                        alert('API Analysis Error: ' + e.message + '\nMake sure FastAPI backend is running at ' + state.apiEndpoint);
                        return;
                    }
                }
            }

            updateProgress(80, 'Preparing voice output and medical recommendations...');
            await new Promise(r => setTimeout(r, 400));

            // Fallback ONLY if active sample is selected and API returned no data
            if (!responseData && state.currentSample) {
                const sample = sampleCases[state.currentSample] || sampleCases.acne;
                responseData = {
                    transcription: state.recordedAudioBlob ? 'Transcribed symptom audio: ' + symptomsText : symptomsText || sample.transcription,
                    doctor_response: sample.doctorAssessment,
                    audio_url: sample.audioFile
                };
            }


            updateProgress(100, 'Analysis Complete!');
            await new Promise(r => setTimeout(r, 200));

            // Render Output
            transcriptionOutput.textContent = responseData.transcription;
            doctorAssessmentOutput.textContent = responseData.doctor_response;

            state.doctorAudioUrl = responseData.audio_url || 'final.mp3';
            doctorAudioElement.src = state.doctorAudioUrl;
            playDoctorAudioBtn.disabled = false;

            if (state.autoPlay) {
                playDoctorAudio();
            }

            // Save to Local History
            saveHistoryEntry({
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                symptoms: symptomsText || responseData.transcription,
                assessment: responseData.doctor_response
            });

        } catch (err) {
            alert('Analysis Error: ' + err.message);
        } finally {
            showLoader(false);
        }
    }

    function showLoader(show, text = '') {
        if (show) {
            diagnosisLoader.classList.remove('hidden');
            resultBody.style.opacity = '0.3';
            loaderStatusText.textContent = text;
            progressBarFill.style.width = '10%';
        } else {
            diagnosisLoader.classList.add('hidden');
            resultBody.style.opacity = '1';
        }
    }

    function updateProgress(percent, text) {
        progressBarFill.style.width = `${percent}%`;
        if (text) loaderStatusText.textContent = text;
    }

    // --- Audio Playback with Web Speech API Fallback ---
    function toggleDoctorAudioPlay() {
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            return;
        }

        if (doctorAudioElement.paused) {
            playDoctorAudio();
        } else {
            doctorAudioElement.pause();
            playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    function playDoctorAudio() {
        // Try playing MP3 audio file first
        doctorAudioElement.play()
            .then(() => {
                playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            })
            .catch(err => {
                console.warn('MP3 playback fallback to browser Web Speech API:', err);
                speakWithBrowserSpeechSynthesis(doctorAssessmentOutput.textContent);
            });
    }

    function speakWithBrowserSpeechSynthesis(text) {
        if (!('speechSynthesis' in window)) {
            alert('Your browser does not support audio synthesis.');
            return;
        }

        window.speechSynthesis.cancel(); // Stop any active speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            audioTimeDisplay.textContent = 'Speaking...';
            audioProgressFill.style.width = '50%';
        };

        utterance.onend = () => {
            playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            audioTimeDisplay.textContent = '0:00 / 0:15';
            audioProgressFill.style.width = '100%';
        };

        utterance.onerror = () => {
            playDoctorAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        };

        state.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    function updateAudioProgress() {
        if (!doctorAudioElement.duration) return;
        const pct = (doctorAudioElement.currentTime / doctorAudioElement.duration) * 100;
        audioProgressFill.style.width = `${pct}%`;

        const curM = Math.floor(doctorAudioElement.currentTime / 60);
        const curS = String(Math.floor(doctorAudioElement.currentTime % 60)).padStart(2, '0');
        const durM = Math.floor(doctorAudioElement.duration / 60);
        const durS = String(Math.floor(doctorAudioElement.duration % 60)).padStart(2, '0');
        audioTimeDisplay.textContent = `${curM}:${curS} / ${durM}:${durS}`;
    }

    // --- Diagnostic History Management ---
    function saveHistoryEntry(entry) {
        state.history.unshift(entry);
        if (state.history.length > 10) state.history.pop();
        localStorage.setItem('medivision_history', JSON.stringify(state.history));
        renderHistory();

        if (state.apiEndpoint) {
            fetch(`${state.apiEndpoint}/api/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            }).catch(() => {});
        }
    }

    function loadHistory() {
        const saved = localStorage.getItem('medivision_history');
        if (saved) {
            try { state.history = JSON.parse(saved); } catch (e) {}
        }
        renderHistory();
    }

    function renderHistory() {
        if (!state.history || state.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-item empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No previous diagnostic sessions stored yet.</p>
                </div>`;
            return;
        }

        historyList.innerHTML = state.history.map(item => `
            <div class="history-item">
                <div class="history-item-top">
                    <span><i class="fa-solid fa-stethoscope"></i> Clinical Assessment</span>
                    <span class="history-time">${item.date}</span>
                </div>
                <div class="history-snippet">${item.assessment}</div>
            </div>
        `).join('');
    }
});

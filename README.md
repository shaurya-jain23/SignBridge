# SignBridge Pro 🤟

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)](https://tensorflow.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-00B2A9?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![Lingo.dev](https://img.shields.io/badge/Lingo.dev-Translation-blue?style=for-the-badge)](https://lingo.dev/)

SignBridge Pro is a state-of-the-art, real-time sign language translation web application. Built to bridge the communication gap, it utilizes your webcam to capture both static hand letters (ISL alphabets) and complex dynamic body gestures intuitively in the browser.

The application offers a fully localized experience powered by the **Lingo.dev SDK**, providing real-time multingual text translations and native Text-to-Speech (TTS) auditory playback across 10+ languages.

## Features ✨

- **Tri-Mode Recognition:**
  - **Static Mode:** Spells out sentences letter-by-letter (A-Z) using an ultra-fast TFLite keypoint classifier.
  - **Dynamic Mode:** Recognizes continuous multi-frame phrases (e.g., "Hello", "Thanks", "I love you") using a custom trained LSTM sequential model.
  - **Hybrid Mode:** Intelligently routes between both networks simultaneously based on movement cadence.
- **Multilingual Two-Way Translation:** Translates the generated English sentences into various global locales (Spanish, Hindi, French, Japanese, etc.) via the Lingo.dev API.
- **Audio Synthesis (TTS):** Speaks out the translated texts natively using browser Web Speech API bound to locale-specific BCP-47 voice tags.
- **Phrase Library & History:** Automatically maps raw ML gesture outputs to conversational, grammatically-correct sentences and logs them in a scrollable history timeline.

## Technology Stack 🛠️

| Category               | Technology         | Purpose                                                                                                       |
| :--------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend Framework** | React (Vite)       | Lightning-fast component architecture and state management for the UI.                                        |
| **Styling**            | Tailwind CSS       | Utility-first CSS framework used for the glassmorphism dark-mode aesthetic.                                   |
| **Backend Server**     | Python (FastAPI)   | High-performance async Python backend serving the WebSocket connection.                                       |
| **Real-time Protocol** | WebSockets         | Bidirectional low-latency streaming of webcam frames (Base64) and predictions.                                |
| **Machine Learning**   | TensorFlow / Keras | Used to train and run inference on the Static (Dense) and Dynamic (LSTM) neural networks.                     |
| **Computer Vision**    | Google MediaPipe   | Re-implemented **Tasks API** extracting 1662 features (`HandLandmarker`, `PoseLandmarker`, `FaceLandmarker`). |
| **Localization APIs**  | Lingo.dev SDK      | Powers the cross-language LLM text translation layer on the backend proxy.                                    |
| **Audio**              | Web Speech API     | Native browser SpeechSynthesis and SpeechRecognition engine.                                                  |

## Data & Machine Learning Models 🧠

The application relies heavily on two completely distinct gesture recognition pipelines running simultaneously on the backend:

### 1. Static Keypoint Classifier (TFLite)

- **Purpose:** Recognizes static, single-frame hand shapes (The Alphabet A-Z, "Good", "Bad", "Name").
- **Architecture:** Lightweight multi-layer perceptron (Dense Network) optimized into a `.tflite` flatbuffer.
- **Training Data:** Trained on a pre-processed 21-point `(x, y)` coordinate CSV mapping dataset derived from the **Kaggle Indian Sign Language (ISL)** dataset.

### 2. Dynamic Sequence Classifier (LSTM Keras)

- **Purpose:** Recognizes smooth, continuous multi-frame motions where the _time and sequence_ are the delineating factor (e.g. "I love you", "Happy", "Sad", "Thanks").
- **Architecture:** A heavily customized Long Short-Term Memory (LSTM) sequential model exported as a `.h5` model. It evaluates a sliding window `deque` of the last 30 frames.
- **Feature Extraction:** Unlike the original MediaPipe `Holistic` pipeline (deprecated on Python 3.13 macOS), this uses highly tuned Task API components to extract a massive array of **1662 coordinates** (Face, Pose, Left Hand, Right Hand) per frame.
- **Training Data:** Trained on the **Kaggle Sign Language for LSTM** sequential `Numpy` arrays.

## Getting Started 🚀

### Prerequisites

- **Python** 3.10+ (tested on 3.13)
- **Node.js** 18+ and npm
- A [Lingo.dev](https://lingo.dev/) API key (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/shaurya-jain23/SignBridge.git
cd SignBridge
```

### 2. Download MediaPipe Model Files

The `.task` model binaries are not included in the repo (they are ~10-30 MB each). Download them into `backend/`:

```bash
cd backend

# Hand Landmarker
curl -L -o hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

# Pose Landmarker (Full)
curl -L -o pose_landmarker_full.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task

# Face Landmarker
curl -L -o face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

### 3. Backend Setup

```bash
# From the backend/ directory
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
pip install lingodotdev python-dotenv   # Additional required packages

# Create your environment file
cp .env.example .env
# Edit .env and add your Lingo.dev API key
```

### 4. Frontend Setup

```bash
cd ../frontend

npm install

# Create your environment file
cp .env.example .env
# Edit .env and add your Lingo.dev API key
```

### 5. Run the Application

**Start the backend** (from `backend/`):

```bash
cd ../backend
source venv/bin/activate
python server.py
# Backend runs on http://localhost:8000
```

**Start the frontend** (in a separate terminal, from `frontend/`):

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser and allow camera access.

### Regenerating Training Data (Optional)

The large static training CSV (`keypoint.csv`, ~70 MB) is excluded from the repo. To regenerate it from the Kaggle ISL dataset:

```bash
cd backend
python scripts/convert_kaggle_to_keypoint_csv.py
```

To retrain the LSTM model, see the Jupyter notebooks in `backend/training_lstm/`.

## Project Structure 📁

```
SignBridge/
├── backend/
│   ├── server.py                  # FastAPI + WebSocket entry point
│   ├── services/
│   │   ├── gesture_service.py     # Static A-Z classifier orchestrator
│   │   ├── dynamic_gesture_service.py  # LSTM dynamic gesture pipeline
│   │   ├── phrase_mapper.py       # Raw label → readable phrase mapping
│   │   ├── stt_service.py         # STT stub (handled client-side)
│   │   └── tts_service.py         # TTS stub (handled client-side)
│   ├── model/
│   │   ├── keypoint_classifier/   # TFLite static A-Z model + labels
│   │   ├── lstm_classifier/       # Keras LSTM model (action.h5) + labels
│   │   └── point_history_classifier/  # Point history model (from upstream)
│   ├── scripts/                   # Dataset download, conversion, training
│   ├── training_lstm/             # LSTM training notebooks + model output
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component + state management
│   │   ├── components/
│   │   │   ├── WebcamFeed.jsx     # Camera capture + landmark overlay
│   │   │   ├── GestureDisplay.jsx # Detected gesture label + confidence
│   │   │   ├── SentenceBuilder.jsx # Active sentence editing UI
│   │   │   ├── LanguageSwitcher.jsx # Target language dropdown
│   │   │   ├── TranslationOutput.jsx # Lingo.dev translation + TTS
│   │   │   ├── TwoWayChat.jsx     # Speech-to-Text for hearing users
│   │   │   └── PhraseHistory.jsx  # Conversation history log
│   │   └── hooks/
│   │       └── useWebSocket.js    # WebSocket lifecycle hook
│   ├── package.json
│   └── vite.config.js
├── hand-gesture-recognition-mediapipe/  # Original upstream reference project
│   ├── app.py                     # Standalone MediaPipe demo
│   ├── keypoint_classification.ipynb
│   ├── point_history_classification.ipynb
│   └── model/                     # Original 3-class models
└── README.md
```

## References & Credits 🔗

- **Original Foundation:** This project was heavily inspired and scaffolded off [kinivi's Hand Gesture Recognition MediaPipe](https://github.com/kinivi/hand-gesture-recognition-mediapipe) pipeline. The original codebase is included in `hand-gesture-recognition-mediapipe/` for reference.
- **Dynamic Gesture Foundation:** Deeply inspired by the LSTM sequence prediction tutorial from [nicknochnack's ActionDetectionforSignLanguage](https://github.com/nicknochnack/ActionDetectionforSignLanguage).
- **Translation AI:** Made possible by the [Lingo.dev Translation SDK](https://lingo.dev/).
- **ISL Dataset (Static):** Available on [Kaggle](https://www.kaggle.com/datasets/eraakash/indian-sign-language-hand-landmarks-dataset).
- **Sentence/Word Dataset (Dynamic LSTM):** Available on [Kaggle](https://www.kaggle.com/datasets/engamohammed/sign-language-for-lstm/data).
- **MediaPipe Tasks Guide:** [Google Vision API Upgrades](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/python).

---

_Built during the Lingo.dev Hackathon._

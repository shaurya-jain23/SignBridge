# SignBridge Pro 🤟

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)](https://tensorflow.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-00B2A9?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![Lingo.dev](https://img.shields.io/badge/Lingo.dev-Translation-blue?style=for-the-badge)](https://lingo.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

SignBridge Pro is a real-time, **bi-directional** sign language communication platform. A **Signer** (deaf/hard-of-hearing user) and a **Listener** (hearing user) join a shared room and converse seamlessly — the signer uses their webcam to sign, the listener reads translated text and replies by typing or speaking.

The application offers a fully localized experience powered by the **Lingo.dev SDK**, providing real-time multilingual text translations and native Text-to-Speech (TTS) / Speech-to-Text (STT) across 10+ languages.

## Features ✨

### Room-Based Communication
- **Session Lobby:** Create or join a named room with a shareable room code. Pick your role (Signer or Listener) and preferred language.
- **Bi-Directional Chat:** Signer signs → message appears in the listener's language. Listener types or speaks → message appears for the signer. All in one unified conversation timeline.
- **Presence Indicators:** Real-time "Listener is typing…" / "Signer is active…" notifications.

### Gesture Recognition (Tri-Mode)
- **Static Mode:** Spells out sentences letter-by-letter (A-Z) using an ultra-fast TFLite keypoint classifier.
- **Dynamic Mode:** Recognizes continuous multi-frame phrases (e.g., "Hello", "Thanks", "I love you") using a custom-trained LSTM sequential model.
- **Hybrid Mode:** Intelligently routes between both networks simultaneously based on movement cadence.

### Multilingual Translation & Audio
- **Lingo.dev-Powered Translation:** Every message is translated server-side into multiple locales (en, hi, es, fr and more) and delivered to each user in their preferred language.
- **Text-to-Speech (TTS):** Any message in the timeline can be spoken aloud using locale-specific BCP-47 voice tags via the browser Web Speech API.
- **Speech-to-Text (STT):** The Listener can dictate replies using the browser microphone — transcribed text is sent as a chat message.

### Resilience & Persistence
- **Session Persistence:** Room, role, and display name are saved to `localStorage` (4-hour expiry) so a page refresh doesn't lose your session.
- **Message Persistence:** Conversation history is cached client-side _and_ stored server-side per room (capped at 200 messages). On reconnect, the client fetches server history and merges it with local cache — no messages lost.
- **WebSocket Reconnection:** Exponential backoff (2s → 10s, max 10 attempts) with toast notifications for disconnect/reconnect events.
- **Toast Notifications:** `react-hot-toast` provides consistent feedback for validation errors, connection state, clipboard actions, and more.

### Cloud-Ready Architecture
- **Environment-Driven URLs:** All backend URLs (`API_BASE`, `WS_BASE`) are derived from `VITE_API_URL` / `VITE_WS_URL` env vars, with an automatic fallback to `window.location` for same-origin deploys.
- **Dynamic CORS:** The backend reads a `CORS_ORIGINS` env var (comma-separated) and merges it with localhost defaults.
- **Optimized Frame Streaming:** Webcam frames are captured at 320×240 @ JPEG quality 0.5 (~75% smaller than raw 640×480) to stay viable over real-world networks.

## Technology Stack 🛠️

| Category               | Technology                   | Purpose                                                                                                       |
| :--------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend Framework** | React 19 + Vite 7            | Component architecture, routing (`react-router-dom` v7), and fast HMR development.                           |
| **Styling**            | Tailwind CSS 4               | Utility-first CSS with custom `@theme` tokens for the glassmorphism dark-mode aesthetic.                      |
| **Notifications**      | react-hot-toast              | Lightweight toast system for validation, connection, and action feedback.                                     |
| **Backend Server**     | Python (FastAPI)             | High-performance async backend serving WebSocket connections and REST APIs.                                   |
| **Real-time Protocol** | WebSockets (room-based)      | Bidirectional low-latency streaming of webcam frames and chat messages within rooms.                          |
| **Machine Learning**   | TensorFlow / Keras           | Trains and runs inference on the Static (Dense) and Dynamic (LSTM) neural networks.                          |
| **Computer Vision**    | Google MediaPipe Tasks API   | Extracts 1662 features per frame (`HandLandmarker`, `PoseLandmarker`, `FaceLandmarker`).                     |
| **Localization**       | Lingo.dev SDK                | Server-side multilingual translation for every chat message (en, hi, es, fr, ja, ko, etc.).                  |
| **Audio**              | Web Speech API               | Native browser `SpeechSynthesis` (TTS) and `SpeechRecognition` (STT) engines.                               |
| **Persistence**        | localStorage + Server Memory | Client-side session/message cache + server-side per-room message history.                                    |

## Data & Machine Learning Models 🧠

The application relies on two distinct gesture recognition pipelines running simultaneously on the backend:

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
# Edit .env and add your Lingo.dev API key:
#   LINGODOTDEV_API_KEY=your_key_here
#   CORS_ORIGINS=https://your-frontend.com   (optional, for cloud deploys)
```

### 4. Frontend Setup

```bash
cd ../frontend

npm install

# Create your environment file
cp .env.example .env
# Edit .env and configure:
#   VITE_LINGO_API_KEY=your_key_here
#   VITE_API_URL=http://localhost:8000       (change for cloud)
#   VITE_WS_URL=ws://localhost:8000          (change for cloud — use wss:// for HTTPS)
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

Open [http://localhost:5173](http://localhost:5173) in your browser, create a room, share the code with another user, and start signing!

### Cloud Deployment

When deploying to a cloud platform (Railway, Render, Vercel, etc.), set these environment variables:

**Frontend (build-time):**
```bash
VITE_API_URL=https://your-backend.up.railway.app
VITE_WS_URL=wss://your-backend.up.railway.app
```

**Backend (runtime):**
```bash
LINGODOTDEV_API_KEY=your_key_here
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

If no `VITE_*` env vars are set, the frontend automatically derives URLs from `window.location` — so it works out of the box when the frontend is served by the same backend.

### Docker Deployment (Backend)

Run the backend in a container — zero dependency conflicts on any OS (Linux, macOS, Windows + Docker Desktop).

**Quick start with Docker Compose:**

```bash
cd SignBridge

# Make sure backend/.env exists with your API key
cp backend/.env.example backend/.env
# Edit backend/.env → LINGODOTDEV_API_KEY=your_key_here

docker compose up --build        # build & run (first time)
docker compose up -d             # detached mode (subsequent runs)
docker compose down              # stop
```

**Standalone Docker (no Compose):**

```bash
cd backend

docker build -t signbridge-backend .

docker run --env-file .env -p 8000:8000 signbridge-backend
```

The backend API will be available at `http://localhost:8000`. Point the frontend's `VITE_API_URL` and `VITE_WS_URL` at this address.

> **Note:** The three `.task` model files (`hand_landmarker.task`, `pose_landmarker_full.task`, `face_landmarker.task`) must exist in `backend/` before building the image. Download them with the curl commands in **step 2** above.

### Regenerating Training Data (Optional)

The large static training CSV (`keypoint.csv`, ~70 MB) is excluded from the repo. To regenerate it from the Kaggle ISL dataset:

```bash
cd backend
python scripts/convert_kaggle_to_keypoint_csv.py
```

To retrain the LSTM model, see the Jupyter notebooks in `backend/training_lstm/`.

## Application Flow 🔄

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Session Lobby                                │
│  User enters name → creates/joins a room → picks Signer/Listener   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌──────────────────┐     ┌───────────────────┐
   │  Signer Dashboard │     │ Listener Dashboard │
   │                   │     │                    │
   │  📷 Webcam Feed   │     │  💬 Unified        │
   │  🤖 Gesture AI    │     │     Timeline       │
   │  🔤 Sentence      │ WS  │  ⌨️  Type reply    │
   │     Builder    ◄──┼─────┼──► 🎤 Speak reply  │
   │  🌍 Translation   │     │  🔊 TTS playback   │
   │  💬 Timeline      │     │  🌍 Language pick   │
   └──────────────────┘     └───────────────────┘
              │                         │
              └────────────┬────────────┘
                           ▼
            ┌──────────────────────────┐
            │     FastAPI Backend      │
            │                          │
            │  WebSocket /ws/{room_id} │
            │  ├─ frame → inference    │
            │  ├─ chat → translate →   │
            │  │   broadcast           │
            │  └─ presence → broadcast │
            │                          │
            │  REST APIs               │
            │  ├─ POST /api/rooms      │
            │  ├─ GET  /api/rooms/:id  │
            │  ├─ GET  /api/rooms/:id/ │
            │  │       messages        │
            │  ├─ POST /api/translate  │
            │  └─ GET  /api/health     │
            └──────────────────────────┘
```

## Project Structure 📁

```
SignBridge/
├── backend/
│   ├── server.py                       # FastAPI entry point — WebSocket + REST endpoints
│   ├── services/
│   │   ├── gesture_service.py          # Static A-Z classifier orchestrator
│   │   ├── dynamic_gesture_service.py  # LSTM dynamic gesture pipeline
│   │   ├── phrase_mapper.py            # Raw label → readable phrase mapping
│   │   ├── stt_service.py              # STT stub (handled client-side)
│   │   └── tts_service.py              # TTS stub (handled client-side)
│   ├── model/
│   │   ├── keypoint_classifier/        # TFLite static A-Z model + labels
│   │   ├── lstm_classifier/            # Keras LSTM model (action.h5) + labels
│   │   └── point_history_classifier/   # Point history model (from upstream)
│   ├── scripts/                        # Dataset download, conversion, training
│   ├── training_lstm/                  # LSTM training notebooks + model output
│   ├── .env.example                    # Backend env template
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── config.js                   # Centralised API_BASE + WS_BASE from env
│   │   ├── App.jsx                     # Root layout — Navbar + Outlet + Toaster
│   │   ├── main.jsx                    # React Router routes
│   │   ├── index.css                   # Tailwind @theme tokens + global styles
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx         # Marketing landing page
│   │   │   ├── SessionLobby.jsx        # Create/Join room + role selection
│   │   │   ├── AppPage.jsx             # Route resolver → Signer or Listener
│   │   │   ├── SignerDashboard.jsx     # Webcam + gesture + sentence + timeline
│   │   │   └── ListenerDashboard.jsx   # Timeline + typed/spoken reply bar
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Fixed nav — role-aware, anchor links
│   │   │   ├── WebcamFeed.jsx          # Camera capture + landmark overlay
│   │   │   ├── GestureDisplay.jsx      # Detected gesture label + confidence
│   │   │   ├── SentenceBuilder.jsx     # Active sentence editing UI
│   │   │   ├── LanguageSwitcher.jsx    # Target language dropdown (10 locales)
│   │   │   ├── UnifiedTimeline.jsx     # Conversation stream with TTS + clear
│   │   │   ├── TranslationOutput.jsx   # Lingo.dev translation + TTS output
│   │   │   ├── TwoWayChat.jsx          # Legacy Speech-to-Text component
│   │   │   └── PhraseHistory.jsx       # Legacy conversation history log
│   │   └── hooks/
│   │       ├── useWebSocket.js         # Room WebSocket + reconnect + persistence
│   │       └── useSessionStorage.js    # localStorage helpers (session + messages)
│   ├── .env.example                    # Frontend env template
│   ├── package.json
│   └── vite.config.js
├── hand-gesture-recognition-mediapipe/ # Original upstream reference project
│   ├── app.py                          # Standalone MediaPipe demo
│   ├── keypoint_classification.ipynb
│   ├── point_history_classification.ipynb
│   └── model/                          # Original 3-class models
└── README.md
```

## API Reference 📡

| Method | Endpoint                         | Description                                       |
| :----- | :------------------------------- | :------------------------------------------------ |
| GET    | `/`                              | Root status check                                 |
| GET    | `/api/health`                    | Health check — model loaded status                |
| POST   | `/api/rooms`                     | Create a new room (`{ room_id }`)                 |
| GET    | `/api/rooms/{room_id}`           | Check if a room exists                            |
| GET    | `/api/rooms/{room_id}/messages`  | Fetch message history for a room (reconnect sync) |
| POST   | `/api/translate`                 | Translate text via Lingo.dev SDK                   |
| POST   | `/api/clear-sentence`            | Clear the gesture sentence buffer                 |
| WS     | `/ws/{room_id}`                  | Real-time WebSocket — frames, chat, presence      |

## References & Credits 🔗

- **Original Foundation:** This project was heavily inspired and scaffolded off [kinivi's Hand Gesture Recognition MediaPipe](https://github.com/kinivi/hand-gesture-recognition-mediapipe) pipeline. The original codebase is included in `hand-gesture-recognition-mediapipe/` for reference.
- **Dynamic Gesture Foundation:** Deeply inspired by the LSTM sequence prediction tutorial from [nicknochnack's ActionDetectionforSignLanguage](https://github.com/nicknochnack/ActionDetectionforSignLanguage).
- **Translation AI:** Made possible by the [Lingo.dev Translation SDK](https://lingo.dev/).
- **ISL Dataset (Static):** Available on [Kaggle](https://www.kaggle.com/datasets/eraakash/indian-sign-language-hand-landmarks-dataset).
- **Sentence/Word Dataset (Dynamic LSTM):** Available on [Kaggle](https://www.kaggle.com/datasets/engamohammed/sign-language-for-lstm/data).
- **MediaPipe Tasks Guide:** [Google Vision API Upgrades](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/python).

---

_Built during the Lingo.dev Hackathon._

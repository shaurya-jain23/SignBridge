# ──────────────────────────────────────────────────────────────
# SignBridge Pro — Backend Dockerfile
#
# Runs the FastAPI backend with MediaPipe + TensorFlow inference.
# Designed for deployment on any system (Linux / Windows+Docker).
#
# Build:   docker build -t signbridge-backend .
# Run:     docker run --env-file .env -p 8000:8000 signbridge-backend
# ──────────────────────────────────────────────────────────────

# ---------- Stage 1: builder (install Python deps) ----------
FROM python:3.12-slim AS builder

# Avoid interactive prompts & set Python to unbuffered mode
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System libs required at build time for compiling wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Install Python dependencies into a virtual-env so we can copy it cleanly
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements-docker.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements-docker.txt


# ---------- Stage 2: runtime (lean image) ----------
FROM python:3.12-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Runtime system libraries
#   libgl1          — OpenCV (headless still links to libGL on some paths)
#   libglib2.0-0    — OpenCV / GLib
#   libsm6 / libxext6 / libxrender1 — X11 stubs MediaPipe may probe
#   libgomp1        — OpenMP (TensorFlow / scikit-learn threading)
#   libusb-1.0-0    — MediaPipe USB camera abstraction
#   libportaudio2   — sounddevice (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
        libusb-1.0-0 \
        libportaudio2 \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built virtual-env from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Working directory inside the container
WORKDIR /app

# ---- Copy application code & models ----
# MediaPipe .task model files (must be present at build time)
COPY hand_landmarker.task .
COPY pose_landmarker_full.task .
COPY face_landmarker.task .

# ML models (TFLite, Keras H5, label CSVs)
COPY model/ model/

# Application source
COPY server.py .
COPY services/ services/
COPY utils/ utils/

# Expose the API port
EXPOSE 8000

# Health-check (Docker / orchestrators can use this)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Default command — production mode (no --reload)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]

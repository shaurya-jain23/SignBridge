#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SignBridge Pro — FastAPI Backend Server (Phase 1)

WebSocket endpoint receives base64 webcam frames from the frontend,
runs real MediaPipe + TFLite inference, returns gesture predictions.

Usage:
    cd backend
    source venv/bin/activate
    python server.py
"""

import json
import logging
from typing import Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from services.gesture_service import GestureService

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("signbridge")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SignBridge Pro API",
    description="Real-time sign language detection and translation backend",
    version="0.2.0",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Gesture Service (singleton — loaded once at startup)
# ---------------------------------------------------------------------------
gesture_service: Optional[GestureService] = None


@app.on_event("startup")
async def startup():
    global gesture_service
    logger.info("Loading GestureService (MediaPipe + TFLite)...")
    gesture_service = GestureService()
    logger.info("GestureService ready.")


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"status": "ok", "message": "SignBridge Pro API is running"}


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "phase": 1,
        "model_loaded": gesture_service is not None,
        "description": "Phase 1 — Real MediaPipe + TFLite inference",
    }


@app.post("/api/clear-sentence")
async def clear_sentence():
    """Clear the sentence buffer."""
    if gesture_service:
        gesture_service.clear_sentence()
    return {"status": "ok", "sentence": ""}


# ---------------------------------------------------------------------------
# WebSocket — Real-time video frame processing
# ---------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            data = await ws.receive_text()

            try:
                message = json.loads(data)
                frame_data: Optional[str] = message.get("frame")

                if frame_data is None:
                    await ws.send_json({"error": "No frame data received"})
                    continue

                # Real inference via GestureService
                prediction = gesture_service.process_frame(frame_data)

                response = {
                    "type": "prediction",
                    "data": prediction,
                }

                await ws.send_json(response)

            except json.JSONDecodeError:
                try:
                    await ws.send_json({"error": "Invalid JSON"})
                except RuntimeError:
                    break
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                try:
                    await ws.send_json({"error": str(e)})
                except RuntimeError:
                    break

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

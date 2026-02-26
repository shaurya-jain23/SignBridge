#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SignBridge Pro — FastAPI Backend Server (Phase 2)

WebSocket endpoint receives base64 webcam frames from the frontend,
runs real MediaPipe + TFLite inference, returns gesture predictions.
REST endpoint translates sentences via Lingo.dev SDK.

Usage:
    cd backend
    source venv/bin/activate
    python server.py
"""

import asyncio
import json
import logging
import os
from typing import Optional

from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.gesture_service import GestureService

# Load environment variables from .env
load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("signbridge")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SignBridge Pro API",
    description="Real-time sign language detection and translation backend",
    version="0.3.0",
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
        "phase": 2,
        "model_loaded": gesture_service is not None,
        "description": "Phase 2 — Gesture Recognition + Lingo.dev Translation",
    }


@app.post("/api/clear-sentence")
async def clear_sentence():
    """Clear the sentence buffer."""
    if gesture_service:
        gesture_service.clear_sentence()
    return {"status": "ok", "sentence": ""}


# ---------------------------------------------------------------------------
# Translation Endpoint (Lingo.dev SDK)
# ---------------------------------------------------------------------------
class TranslateRequest(BaseModel):
    text: str
    target_locale: str
    source_locale: str = "en"


@app.post("/api/translate")
async def translate_text(req: TranslateRequest):
    """Translate text using Lingo.dev SDK."""
    api_key = os.getenv("LINGODOTDEV_API_KEY")
    if not api_key:
        return {"error": "LINGODOTDEV_API_KEY not set", "translated_text": req.text}

    if not req.text.strip():
        return {"translated_text": "", "source_locale": req.source_locale, "target_locale": req.target_locale}

    if req.target_locale == req.source_locale:
        return {"translated_text": req.text, "source_locale": req.source_locale, "target_locale": req.target_locale}

    try:
        from lingodotdev.engine import LingoDotDevEngine

        translated = await LingoDotDevEngine.quick_translate(
            req.text,
            api_key=api_key,
            source_locale=req.source_locale,
            target_locale=req.target_locale,
        )
        logger.info(f"Translated '{req.text}' → '{translated}' ({req.source_locale}→{req.target_locale})")
        return {
            "translated_text": translated,
            "source_locale": req.source_locale,
            "target_locale": req.target_locale,
        }
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return {"error": str(e), "translated_text": req.text}


# ---------------------------------------------------------------------------
# Room Validation Endpoints
# ---------------------------------------------------------------------------
class RoomCreateRequest(BaseModel):
    room_id: str

@app.post("/api/rooms")
async def create_room_api(req: RoomCreateRequest):
    """Register a new room."""
    manager.create_room(req.room_id)
    return {"status": "ok", "room_id": req.room_id}

@app.get("/api/rooms/{room_id}")
async def check_room_api(room_id: str):
    """Check if a room exists."""
    if manager.room_exists(room_id):
        return {"status": "ok", "exists": True}
    return {"status": "error", "exists": False, "message": "Room not found"}


# ---------------------------------------------------------------------------
# Room-Based WebSocket Connection Manager
# ---------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        # room_id -> list of WebSockets
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.created_rooms = set()  # Store valid room IDs

    def create_room(self, room_id: str):
        self.created_rooms.add(room_id)

    def room_exists(self, room_id: str) -> bool:
        return room_id in self.created_rooms

    async def connect(self, ws: WebSocket, room_id: str):
        if not self.room_exists(room_id):
            await ws.close(code=4004, reason="Room not found")
            raise WebSocketDisconnect(code=4004, reason="Room not found")
            
        await ws.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(ws)
        logger.info(f"Client joined room: {room_id}. Total clients: {len(self.active_connections[room_id])}")

    def disconnect(self, ws: WebSocket, room_id: str):
        if room_id in self.active_connections and ws in self.active_connections[room_id]:
            self.active_connections[room_id].remove(ws)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
            logger.info(f"Client left room: {room_id}")

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")

manager = ConnectionManager()

# ---------------------------------------------------------------------------
# WebSocket — Real-time video frame processing & Chat sync
# ---------------------------------------------------------------------------
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(ws: WebSocket, room_id: str):
    await manager.connect(ws, room_id)

    try:
        while True:
            data = await ws.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type", "frame")

                if msg_type == "chat":
                    # A completed message sent from Signer or Listener
                    # We should translate it right here before broadcasting
                    payload = message.get("payload", {})
                    # payload should have: id, senderRole, senderName, inputType, originalText, originalLocale, translations
                    original_text = payload.get("originalText", "")
                    original_locale = payload.get("originalLocale", "en")
                    
                    # We will dynamically translate into standard locales for simplicity 
                    # (in production this would be targeted based on room preferences)
                    api_key = os.getenv("LINGODOTDEV_API_KEY")
                    target_locales = ["en", "hi", "es", "fr"]
                    translations = {}
                    
                    if api_key and original_text:
                        from lingodotdev.engine import LingoDotDevEngine
                        # Translate for a few major languages asynchronously
                        import asyncio
                        
                        async def fetch_trans(t_loc):
                            if t_loc == original_locale:
                                return t_loc, original_text
                            try:
                                res = await LingoDotDevEngine.quick_translate(
                                    original_text,
                                    api_key=api_key,
                                    source_locale=original_locale,
                                    target_locale=t_loc,
                                )
                                return t_loc, res
                            except Exception:
                                return t_loc, original_text

                        tasks = [fetch_trans(l) for l in target_locales]
                        results = await asyncio.gather(*tasks)
                        for loc, txt in results:
                            translations[loc] = txt
                    else:
                        translations[original_locale] = original_text

                    payload["translations"] = translations
                    payload["status"] = "sent"
                    
                    # Broadcast the full Message object to everyone in the room
                    await manager.broadcast({
                        "type": "chat_sync",
                        "data": payload
                    }, room_id)

                elif msg_type == "presence":
                    # Broadcast typing/signing status
                    payload = message.get("payload", {})
                    await manager.broadcast({
                        "type": "presence_sync",
                        "data": payload
                    }, room_id)


                elif msg_type == "frame":
                    # Video frame processing path
                    frame_data: Optional[str] = message.get("frame")
                    mode: str = message.get("mode", "hybrid")

                    if frame_data is None:
                        await ws.send_json({"error": "No frame data received"})
                        continue

                    # Real inference via GestureService with Mode routing
                    prediction = gesture_service.process_frame(frame_data, mode)

                    response = {
                        "type": "prediction",
                        "data": prediction,
                    }

                    # Send predictions ONLY to the client that sent the frame (the signer)
                    await ws.send_json(response)

            except json.JSONDecodeError:
                try:
                    await ws.send_json({"error": "Invalid JSON"})
                except RuntimeError:
                    break
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing frame/chat: {e}")
                try:
                    await ws.send_json({"error": str(e)})
                except RuntimeError:
                    break

    except WebSocketDisconnect:
        manager.disconnect(ws, room_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(ws, room_id)


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

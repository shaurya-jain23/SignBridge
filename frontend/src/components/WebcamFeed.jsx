import { useRef, useEffect, useCallback, useState } from "react";

const FRAME_INTERVAL_MS = 100; // ~10 fps

/**
 * WebcamFeed — captures camera frames and sends them to backend via WebSocket.
 * Draws hand landmarks on a canvas overlay when received from the server.
 * Styled with Tailwind utility classes based on Stitch's generated HTML.
 */
export default function WebcamFeed({
  sendFrame,
  landmarks,
  poseLandmarks,
  isConnected,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Start camera
  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Unable to access camera. Please grant permission.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture frames and send to backend
  useEffect(() => {
    if (!cameraReady || !isConnected) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = 640;
    captureCanvas.height = 480;
    captureCanvasRef.current = captureCanvas;

    intervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const ctx = captureCanvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const base64 = captureCanvas.toDataURL("image/jpeg", 0.6);
      sendFrame(base64.split(",")[1]);
    }, FRAME_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, isConnected, sendFrame]);

  // Draw landmarks on overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw pose landmarks (Upper body skeleton)
    if (poseLandmarks && poseLandmarks.length > 0) {
      // Helper to find specific point
      const getPosePt = (idx) => poseLandmarks.find((p) => p.index === idx);

      const lShoulder = getPosePt(11);
      const rShoulder = getPosePt(12);
      const lElbow = getPosePt(13);
      const rElbow = getPosePt(14);
      const lWrist = getPosePt(15);
      const rWrist = getPosePt(16);

      const drawBone = (pt1, pt2) => {
        if (!pt1 || !pt2 || pt1.visibility < 0.5 || pt2.visibility < 0.5)
          return;
        ctx.beginPath();
        ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
        ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
        ctx.strokeStyle = "rgba(167, 139, 250, 0.4)"; // Purple-400 transparent
        ctx.lineWidth = 4;
        ctx.stroke();
      };

      // Connect skeleton
      drawBone(lShoulder, rShoulder);
      drawBone(lShoulder, lElbow);
      drawBone(lElbow, lWrist);
      drawBone(rShoulder, rElbow);
      drawBone(rElbow, rWrist);

      // Draw joints
      poseLandmarks.forEach((point) => {
        if (point.visibility < 0.5) return;
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          5,
          0,
          2 * Math.PI,
        );
        ctx.fillStyle = "#a855f7"; // Purple-500
        ctx.fill();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    if (!landmarks || landmarks.length === 0) return;

    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        4,
        0,
        2 * Math.PI,
      );
      ctx.fillStyle = "#14b8a5"; // Primary teal
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 165, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [landmarks, poseLandmarks]);

  if (cameraError) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center p-8 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-4 text-red-500 block">
            videocam_off
          </span>
          <p className="text-sm font-medium">{cameraError}</p>
        </div>
      </div>
    );
  }

  const handDetected = landmarks && landmarks.length > 0;

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
      {/* Camera Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] animate-pulse">
            fiber_manual_record
          </span>
          <span className="text-xs font-mono text-white/90">LIVE FEED</span>
        </div>
      </div>

      {/* Main Video Element */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${!cameraReady ? "opacity-0" : "opacity-80"} -scale-x-100`}
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          }}
        />

        {/* Render canvas on top of video */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none drop-shadow-[0_0_8px_rgba(20,184,165,0.8)]"
        />

        {/* Decorative Scanning Grid */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(20,184,165,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,165,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-3 text-slate-400 animate-spin">
                refresh
              </span>
              <p className="text-slate-400 text-sm font-mono tracking-widest uppercase">
                Initializing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 flex justify-between items-end bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-widest">
              FPS
            </span>
            <span className="text-lg font-mono font-bold text-white">~10</span>
          </div>
          <div className="flex flex-col border-l border-white/20 pl-4">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-widest">
              Resolution
            </span>
            <span className="text-sm font-mono font-medium text-white pt-1">
              640x480
            </span>
          </div>
        </div>

        {/* Dynamic Detection Badge */}
        {handDetected ? (
          <div className="flex items-center gap-2 bg-[#14b8a5]/20 backdrop-blur-md border border-[#14b8a5]/30 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(20,184,165,0.2)] animate-pulse">
            <span className="material-symbols-outlined text-[#14b8a5]">
              back_hand
            </span>
            <span className="text-[#14b8a5] font-bold tracking-wide text-sm">
              Hand Detected
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-slate-500">
              visibility
            </span>
            <span className="text-slate-500 font-bold tracking-wide text-sm">
              Scanning...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

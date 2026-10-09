/**
 * IEEE Cyber Clash - Real-Time Webcam & MediaPipe Hand Input Engine
 * Uses @mediapipe/tasks-vision GestureRecognizer with 2 hands tracking,
 * horizontal mirroring, spatial left/right zone partitioning, and Picture-in-Picture display.
 */

class HandInputEngine {
  constructor() {
    this.video = null;
    this.stream = null;
    this.recognizer = null;
    this.isReady = false;
    this.isCameraActive = false;
    this.isLoading = false;
    this.lastVideoTime = -1;
    this.lastDetectionTimestamp = 0;

    // Detection Cadence (runs at ~30 FPS to preserve 60 FPS for Canvas physics)
    this.detectionIntervalMs = 33; 

    // Raw results from last frame
    this.latestResults = null;

    // Player Hands (0 = P1 Left Zone, 1 = P2 Right Zone)
    this.players = [
      {
        detected: false,
        sign: 'None',
        score: 0,
        wrist: { x: 0.25, y: 0.5 },
        landmarks: null,
        lastSeenTime: 0
      },
      {
        detected: false,
        sign: 'None',
        score: 0,
        wrist: { x: 0.75, y: 0.5 },
        landmarks: null,
        lastSeenTime: 0
      }
    ];

    // Hand connections for skeleton drawing (MediaPipe standard 21 landmarks)
    this.HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];

    // Pip visibility
    this.pipVisible = true;
    this.debugVisible = false;
  }

  async init() {
    if (this.isReady || this.isLoading) return;
    this.isLoading = true;

    try {
      console.log("⚡ [HandInput] Initializing MediaPipe Tasks Vision...");

      // Dynamic ESM import from CDN
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const { FilesetResolver, GestureRecognizer } = vision;

      const wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      // Check if local model exists in /models/gesture_recognizer.task
      let modelPath = "./models/gesture_recognizer.task";
      try {
        const resp = await fetch(modelPath, { method: "HEAD" });
        if (!resp.ok) {
          modelPath = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
        }
      } catch (e) {
        modelPath = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
      }

      console.log(`⚡ [HandInput] Loading GestureRecognizer model from: ${modelPath}`);

      // Attempt with GPU delegate first, fallback to CPU
      try {
        this.recognizer = await GestureRecognizer.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (gpuErr) {
        console.warn("⚡ [HandInput] GPU delegate failed, falling back to CPU:", gpuErr);
        this.recognizer = await GestureRecognizer.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      this.isReady = true;
      this.isLoading = false;
      console.log("✅ [HandInput] MediaPipe GestureRecognizer successfully loaded!");
    } catch (err) {
      this.isLoading = false;
      console.error("❌ [HandInput] Error initializing MediaPipe:", err);
      // Keyboard fallback will remain active seamlessly
    }
  }

  async startCamera() {
    if (this.isCameraActive) return true;

    if (!this.video) {
      this.video = document.createElement("video");
      this.video.setAttribute("playsinline", "");
      this.video.setAttribute("muted", "");
      this.video.autoplay = true;
      this.video.style.display = "none";
      document.body.appendChild(this.video);
    }

    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });

      this.isCameraActive = true;
      console.log("📷 [HandInput] Webcam stream started (640x480).");
      return true;
    } catch (err) {
      console.warn("⚠️ [HandInput] Webcam access failed or denied:", err);
      this.isCameraActive = false;
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isCameraActive = false;
  }

  /**
   * Called in animation loop. Runs GestureRecognizer inference if a new video frame is ready
   */
  processFrame() {
    if (!this.isReady || !this.isCameraActive || !this.video || !this.recognizer) {
      return;
    }

    const now = performance.now();
    if (now - this.lastDetectionTimestamp < this.detectionIntervalMs) {
      return;
    }

    if (this.video.currentTime === this.lastVideoTime || this.video.readyState < 2) {
      return;
    }

    this.lastVideoTime = this.video.currentTime;
    this.lastDetectionTimestamp = now;

    try {
      const safeTimestamp = Math.max(Math.floor(now), (this.lastVideoFrameTimestamp || 0) + 1);
      this.lastVideoFrameTimestamp = safeTimestamp;
      const results = this.recognizer.recognizeForVideo(this.video, safeTimestamp);
      this.latestResults = results;
      this.partitionHands(results, now);
    } catch (err) {
      console.warn("⚠️ [HandInput] Detection frame error:", err);
    }
  }

  /**
   * Partition hands into P1 (Left Zone) and P2 (Right Zone).
   * Video is horizontally mirrored:
   * mirrorX = 1 - landmark.x
   * Left Zone: mirrorX < 0.50 (Player 1)
   * Right Zone: mirrorX >= 0.50 (Player 2)
   */
  partitionHands(results, now) {
    const rawHands = [];

    if (results && results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const rawLm = results.landmarks[i];
        const gestures = results.gestures[i] || [];
        const topGesture = gestures.length > 0 ? gestures[0] : null;

        // Wrist is landmark 0
        const wristRaw = rawLm[0];
        const mirrorWristX = 1 - wristRaw.x;
        const wristY = wristRaw.y;

        // Mirrored landmarks array
        const mirroredLm = rawLm.map(pt => ({
          x: 1 - pt.x,
          y: pt.y,
          z: pt.z
        }));

        rawHands.push({
          mirrorWristX: mirrorWristX,
          wristY: wristY,
          sign: topGesture ? topGesture.categoryName : 'None',
          score: topGesture ? topGesture.score : 0,
          landmarks: mirroredLm
        });
      }
    }

    // Assign to P1: hands with mirrorWristX < 0.50
    // If multiple hands, pick the one closest to zone center (0.25)
    const p1Candidates = rawHands.filter(h => h.mirrorWristX < 0.50);
    if (p1Candidates.length > 0) {
      p1Candidates.sort((a, b) => Math.abs(a.mirrorWristX - 0.25) - Math.abs(b.mirrorWristX - 0.25));
      const chosen = p1Candidates[0];
      this.players[0].detected = true;
      this.players[0].sign = chosen.sign;
      this.players[0].score = chosen.score;
      this.players[0].wrist = { x: chosen.mirrorWristX, y: chosen.wristY };
      this.players[0].landmarks = chosen.landmarks;
      this.players[0].lastSeenTime = now;
    } else {
      this.players[0].detected = false;
    }

    // Assign to P2: hands with mirrorWristX >= 0.50
    // If multiple hands, pick the one closest to zone center (0.75)
    const p2Candidates = rawHands.filter(h => h.mirrorWristX >= 0.50);
    if (p2Candidates.length > 0) {
      p2Candidates.sort((a, b) => Math.abs(a.mirrorWristX - 0.75) - Math.abs(b.mirrorWristX - 0.75));
      const chosen = p2Candidates[0];
      this.players[1].detected = true;
      this.players[1].sign = chosen.sign;
      this.players[1].score = chosen.score;
      this.players[1].wrist = { x: chosen.mirrorWristX, y: chosen.wristY };
      this.players[1].landmarks = chosen.landmarks;
      this.players[1].lastSeenTime = now;
    } else {
      this.players[1].detected = false;
    }
  }

  getPlayerHand(playerIndex) {
    const p = this.players[playerIndex];
    const now = performance.now();
    // 350ms smoothing buffer: avoids 1-frame detection drops from breaking continuous tracking
    const isRecent = (now - p.lastSeenTime < 350);
    return {
      ...p,
      detected: p.detected || isRecent
    };
  }

  /**
   * Renders Picture-in-Picture webcam canvas with neon skeleton overlays
   */
  renderPip(canvas) {
    if (!canvas || !this.pipVisible) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If video active, draw mirrored webcam frame
    if (this.isCameraActive && this.video && this.video.readyState >= 2) {
      ctx.save();
      // Mirror horizontally
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.restore();

      // Dark translucent tint for neon contrast
      ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
      ctx.fillRect(0, 0, w, h);
    } else {
      // Camera standby background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#64748b";
      ctx.font = "12px 'Rajdhani', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.isLoading ? "Loading MediaPipe..." : "Camera Offline (Keyboard Mode)", w / 2, h / 2);
    }

    // Center zone dividing line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone Labels
    ctx.font = "bold 11px 'Orbitron', sans-serif";
    ctx.fillStyle = "#0284c7";
    ctx.textAlign = "left";
    ctx.fillText("P1 ZONE", 8, 16);

    ctx.fillStyle = "#f97316";
    ctx.textAlign = "right";
    ctx.fillText("P2 ZONE", w - 8, 16);

    // Draw Skeletons
    this.drawHandSkeleton(ctx, this.players[0], w, h, "#00f0ff", "#0284c7");
    this.drawHandSkeleton(ctx, this.players[1], w, h, "#fb923c", "#f97316");
  }

  drawHandSkeleton(ctx, player, w, h, jointColor, boneColor) {
    if (!player.detected || !player.landmarks) return;

    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = boneColor;
    ctx.shadowColor = jointColor;
    ctx.shadowBlur = 8;

    // Draw bones
    for (const [startIdx, endIdx] of this.HAND_CONNECTIONS) {
      const p1 = player.landmarks[startIdx];
      const p2 = player.landmarks[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    // Draw joints
    ctx.fillStyle = jointColor;
    for (const pt of player.landmarks) {
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sign Badge above wrist
    const wrist = player.landmarks[0];
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(player.sign, wrist.x * w, Math.max(16, wrist.y * h - 12));

    ctx.restore();
  }
}

// Global instance
window.handInput = new HandInputEngine();

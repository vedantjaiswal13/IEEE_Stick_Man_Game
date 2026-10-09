# ⚡ IEEE SB VIT Pune: Cyber Clash (Stickman Showdown)
## Comprehensive Technical Architecture & Live Hand-Sign Combat System

> **Project Identity:** Official interactive tech fest and publicity booth exhibition game designed for the **IEEE Student Branch at Vishwakarma Institute of Technology (VIT), Pune**.  
> **Official IEEE SB VIT Pune Website:** [ieeesbvitpune.vercel.app](https://ieeesbvitpune.vercel.app/)  
> **Repository Type:** Zero-dependency, pure client-side Web Application (HTML5, Vanilla ES6+ JavaScript, Canvas 2D API, Vanilla CSS, Web Audio API, LocalStorage).  
> **Hosting & Deployment:** Vercel Static Web App (`vercel.json` rewrite rule to `index.html`).

---

## 1. Executive Summary & Design Transformation

**IEEE Cyber Clash: Stickman Showdown** has evolved from an automated loadout simulation into an **active, crowd-thrilling, 2-player fighting game controlled entirely by HAND SIGNS captured via the laptop webcam**.

### Core Architecture Pillars
1. **Zero Predetermined Outcomes:** Completely skill-driven. Hits only register when a player maneuvers within reach and executes an unblocked strike.
2. **First to 5 Clean Hits Rule:** Fast, intense, tournament-ready pacing for tech fest booth crowds. Each fighter starts with 5 visible stamina pips on the HUD.
3. **Google MediaPipe Tasks Vision:** Client-side skeletal gesture recognition via `@mediapipe/tasks-vision` `GestureRecognizer` (`numHands: 2`, VIDEO running mode, GPU delegate with CPU fallback).
4. **Offline Model Cache:** Models cached in `/models/gesture_recognizer.task` (~8.3 MB) for seamless booth operation without internet dependency.
5. **Procedural Physics Stickmen:** Damped spring skeletal physics on the head, torso, and limbs; procedural foot-planting walk cycles; lunge attacks; verlet ragdoll knockdown flopping on heavy hits.
6. **Juicy Fighting Game Game-Feel:** Dynamic hit-stop freeze frames (60–120ms), distance-based camera zooming, screen shake, reactive crowd silhouettes bouncing on hits, and 100% procedural Web Audio sound synthesis.
7. **Official VIT Pune Department Rivalry:** Features all 15 official academic departments of Vishwakarma Institute of Technology, Pune (`vit.edu`).

---

## 2. Hand Sign Controls & Mapping Table

Two players stand side-by-side in front of one laptop webcam (1.0 to 1.5 m away). The video feed is horizontally mirrored, splitting the screen into:
- **Left 50% ($X < 0.50$):** Player 1 (IEEE Blue)
- **Right 50% ($X \ge 0.50$):** Player 2 (IEEE Orange)

| Sign | MediaPipe Label | In-Game Action | Execution Type | P1 Key Fallback | P2 Key Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ✊ **Closed Fist** | `Closed_Fist` | **LIGHT ATTACK** (Quick jab/slash, 350ms cooldown) | Edge-triggered | `A` | `J` / `Num 4` / `Enter` |
| ✌️ **Victory** | `Victory` | **HEAVY ATTACK** (Slow windup, breaks block, causes knockdown) | Edge-triggered | `S` | `K` / `Num 5` / `ShiftRight` |
| ✋ **Open Palm** | `Open_Palm` | **BLOCK GUARD** (Held guard, negates light hits, builds meter) | Held active | `D` | `L` / `Num 6` / `ArrowDown` |
| ☝️ **Pointing Up** | `Pointing_Up` | **MOVE FORWARD** (Step toward opponent) | Held active | `F` | `I` / `Num 8` / `ArrowRight` |
| 👍 **Thumbs Up** | `Thumb_Up` | **MOVE BACK** (Tactical retreat) | Held active | `G` | `O` / `Num 2` / `ArrowLeft` |
| 🤟 **I Love You** | `ILoveYou` | **SPECIAL OVERDRIVE** (Weapon super move, ignores block, needs 100% meter) | Edge-triggered | `H` | `P` / `Num 9` / `Slash` |
| 🖐️ **Hand Raised High** | Wrist $Y < 0.22$ | **HOP / DODGE** (Jump into air to avoid low sweeps) | Trigger | `W` / `Space` | `U` / `Num 0` / `ArrowUp` |

---

## 3. Subsystem Architecture & File Breakdown

### A. Hand Vision Engine (`hand-input.js`)
- Initializes `@mediapipe/tasks-vision` via dynamic ESM import from CDN.
- Loads `gesture_recognizer.task` locally from `./models/gesture_recognizer.task` or falls back to Google Cloud Storage.
- Captures webcam stream via `getUserMedia({ video: { width: 640, height: 480, ideal: 30 } })`.
- Runs inference asynchronously at ~30 FPS (`detectionIntervalMs: 33`) without blocking the 60 FPS Canvas render loop.
- Performs spatial left/right partitioning on mirrored wrist coordinates:
  - Hands with $X < 0.50$ assigned to Player 1.
  - Hands with $X \ge 0.50$ assigned to Player 2.
  - If multiple hands appear in a zone, selects the hand closest to the zone center ($X = 0.25$ or $X = 0.75$).
- Renders a Picture-in-Picture (PiP) mirrored webcam overlay with neon skeletal hand bones (`#00f0ff` for P1, `#f97316` for P2) and confirmed sign badges.

### B. Gesture & Action Pipeline (`gestures.js`)
- Debounces raw recognizer output across 2–3 consecutive frames (`DEBOUNCE_FRAMES: 2`, `MIN_CONFIDENCE: 0.52`).
- Distinguishes between:
  - **Edge-triggered actions:** Attacks fire once when the sign enters, then enforce cooldowns (`LIGHT_COOLDOWN_MS: 350`, `HEAVY_COOLDOWN_MS: 1100`, `SPECIAL_COOLDOWN_MS: 1800`). Players must release or switch signs to strike again, preventing fist spam.
  - **Held actions:** Movement and guard stay active while the sign is held, with a 150ms grace period (`GRACE_PERIOD_MS: 150`) to absorb dropped detection frames.
- Lost tracking supervisor:
  - If hand is missing for $>1.5$s, displays on-screen alert: `"Player X: Show your hand!"`.
  - If hand is missing for $>5.0$s, flags duel as paused.
- Real-time Cheat-Sheet HUD synchronization: Highlights the active sign badge on each player's on-screen cheat sheet in real time.
- Integrated keyboard fallback: Maps standard keys directly into the action pipeline.
- Hidden debug overlay: Toggled with the **`[D]`** key to show FPS, hand landmarks, raw confidence scores, and zone dividers.

### C. Procedural Physics Stickman Engine (`stickman.js`)
- Replaces scripted tweens with a mathematical **14-joint skeletal spring-damper rig** (`k: 0.28`, `damp: 0.72`):
  - Head and spine have inertia, overshoot, and follow-through.
  - Weapon is attached to the hand with angular lag, velocity trails, and glowing ghost outlines.
- **Procedural Walk Cycle:**
  - Alternating foot-planting kinematics.
  - Torso leans into movement direction ($\text{lean} \propto v_x$).
  - Vertical hip bobbing.
- **Spatial Positioning & Collision:**
  - Fighters have real arena coordinates ($x \in [130, 1150]$).
  - Spatial collision prevents fighters from passing through each other ($\Delta x \ge 75\text{px}$).
- **Combat Mechanics:**
  - Strikes lunge forward and require the opponent to be within the weapon's reach.
  - Guard Stance (`BLOCK`): Negates light attack damage (0 hits) and charges the defender's special meter. If guard starts within 180ms of incoming impact, triggers `"PERFECT BLOCK!"`.
  - Heavy attacks break through partial guards and trigger a **verlet ragdoll knockdown flop** (~0.85s on the ground bouncing off the floor before standing up).
  - Special Overdrive (🤟): Needs 100% meter; bypasses blocks completely.

### D. Combat Arena & Camera FX (`arena.js`)
- **Hit-Stop Freeze Frame:** Freezes game simulation for 60ms (light hits) or 110ms (heavy hits) upon connection, delivering authentic fighting game impact.
- **Dynamic Camera Tracking:**
  - Follows the midpoint between fighters: $x_{\text{cam}} = (x_1 + x_2) / 2$.
  - Scales zoom based on fighter distance: punches in to $1.12\times$ during close clashes; pulls back to $0.92\times$ during retreats.
- **Reactive Audience Silhouettes:** 28 stylized silhouettes along the bottom that bounce and cheer on hits.
- **Visual FX:** Decaying screen shake, ground cracks after heavy hammer slams, quantum laser beams, spark bursts, and floating combat text popups.

### E. Procedural Audio Engine (`audio.js`)
Uses the browser's native **Web Audio API** to generate all sounds algorithmically:
- `playWhoosh()`: Bandpass-filtered noise sweep on weapon attacks.
- `playRouletteTick()`: High-frequency sine click for slot machine cycling.
- `playHeavyThud()`: Sub-bass punch (200Hz $\to$ 25Hz) with crackle noise for heavy slams.
- `playParryClang()`: Triple-oscillator chord (1050Hz, 1580Hz, 2450Hz) for parries.
- `playPerfectBlock()`: 3-note ascending harmonic chime (880Hz, 1320Hz, 1760Hz).
- `playKoSting()`: Dramatic low-pass filtered sub drone on decisive knockouts.
- `playCountdownBeep()`: Pure sine tones for 3-2-1 countdowns.
- `playCrowdCheer()`: Low-pass filtered noise swell for festival atmosphere.

### F. Master Game Coordinator (`game.js`)
Manages screen transitions and tournament flow:
1. `WELCOME`: Player registration (Names + official VIT Pune departments).
2. `CALIBRATE`: Dual-player webcam calibration; split left/right zones. Requires both hands stable for 1s to start a 3-2-1 countdown.
3. `WEAPON_ROLL`: Slot machine roulette reveal with dramatic audio ticks. Each player gets 1 strategic re-roll.
4. `FIGHT`: Real-time 60 FPS combat loop; 5 hit pips; sudden death rule (if tied 4–4 for $>60$s, next hit wins).
5. `KO`: Slow-mo finish, winner pose, celebratory confetti, and KO sting.
6. `RESULT`: Displays champion stats, updates leaderboard, and provides Rematch / New Match options.

---

## 4. Booth Setup Guide for Organizers

Follow these guidelines for optimal tracking at festival exhibition booths:

```
+---------------------------------------------------------------+
|                      WEBCAM VIEWPORT (16:9)                   |
|                                                               |
|   +-----------------------+   |   +-----------------------+   |
|   |                       |   |   |                       |   |
|   |      PLAYER 1         |   |   |      PLAYER 2         |   |
|   |    (CHALLENGER 1)     | : |   |    (CHALLENGER 2)     |   |
|   |                       | : |   |                       |   |
|   |     [IEEE BLUE]       |   |   |    [IEEE ORANGE]      |   |
|   |   (X: 0.0 to 0.5)     |   |   |   (X: 0.5 to 1.0)     |   |
|   +-----------------------+   |   +-----------------------+   |
+---------------------------------------------------------------+
```

1. **Physical Setup:**
   - Place the laptop on a stable table with the webcam at chest or shoulder height (~1.1 to 1.3 meters).
   - Both challengers stand side-by-side **1.0 to 1.5 meters** from the webcam.
2. **Lighting:**
   - Ensure direct, even front lighting on players' hands.
   - Avoid placing the setup in front of open sunlit windows or strong stage spotlights that create backlighting silhouettes.
3. **Player Orientation:**
   - Player 1 stands on the **left side**; Player 2 on the **right side**.
   - Keep hands open and palms angled toward the camera when executing signs.
   - Use one dominant hand; do not cross the center dividing line into the other player's zone.
4. **Debug Mode:**
   - Press **`[D]`** on the keyboard at any time to open the real-time skeletal debug panel showing hand tracking status, confidence scores, and FPS.
5. **Keyboard Backup Mode:**
   - If booth lighting is challenging or camera permissions are blocked, the game automatically allows full keyboard play:
     - Player 1: `A` (Light), `S` (Heavy), `D` (Block), `F` (Forward), `G` (Back), `H` (Special), `W` (Hop).
     - Player 2: `J` (Light), `K` (Heavy), `L` (Block), `I` (Forward), `O` (Back), `P` (Special), `U` (Hop) or Arrow Keys / Numpad.

---

## 5. Offline Model Setup Instructions

The game comes pre-cached with the MediaPipe `gesture_recognizer.task` model file stored in `models/gesture_recognizer.task` (~8.3 MB).

If setting up the project from scratch on a new machine:
```powershell
# PowerShell download command
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" -OutFile "d:\IEEE\Stick man game\models\gesture_recognizer.task"
```
Or via curl:
```bash
curl -L -o ./models/gesture_recognizer.task "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
```

---

## 6. Tunable Thresholds in `gestures.js`

All gesture recognition and combat timing parameters are consolidated at the top of [`gestures.js`](file:///d:/IEEE/Stick%20man%20game/gestures.js):

| Parameter | Default | Purpose |
| :--- | :--- | :--- |
| `DEBOUNCE_FRAMES` | `2` | Number of consecutive matching frames required to register a new sign. |
| `MIN_CONFIDENCE` | `0.52` | Minimum MediaPipe confidence score required (0.0 to 1.0). |
| `LIGHT_COOLDOWN_MS` | `350` | Cooldown in milliseconds after a light strike before another can fire. |
| `HEAVY_COOLDOWN_MS` | `1100` | Cooldown in milliseconds after a heavy strike. |
| `SPECIAL_COOLDOWN_MS` | `1800` | Cooldown in milliseconds after a special super move. |
| `GRACE_PERIOD_MS` | `150` | Window in milliseconds to maintain held actions (movement/guard) during brief tracking drops. |
| `LOST_TRACKING_WARN_MS`| `1500` | Inactivity threshold before the on-screen `"Show your hand!"` alert triggers. |
| `LOST_TRACKING_PAUSE_MS`| `5000` | Stalled duel pause threshold if a player leaves the frame. |
| `HOP_THRESHOLD_Y` | `0.22` | Normalized wrist $Y$-coordinate in the top 22% of the frame that triggers a jump/dodge. |

---

## 7. Known Limitations & Technical Notes

1. **Two Hands in One Zone:** If a player raises both hands, the engine automatically selects the hand whose wrist $X$ is closest to their zone center ($X = 0.25$ for P1, $X = 0.75$ for P2) and ignores the second hand.
2. **Webcam Permissions:** Modern browsers require HTTPS (or `localhost`) to access `navigator.mediaDevices.getUserMedia`. The Vercel deployment provides HTTPS automatically.
3. **GPU Delegate Fallback:** On laptops with integrated or older graphics chips where WebGL GPU acceleration fails, `hand-input.js` automatically catches the exception and falls back to the CPU delegate seamlessly.

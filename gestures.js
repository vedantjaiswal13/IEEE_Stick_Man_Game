/**
 * IEEE Cyber Clash - Gesture Recognition & Action Pipeline Engine
 * Evaluates MediaPipe signs, debounces input, manages attack cooldowns,
 * provides continuous movement/guard states with grace periods,
 * and maintains seamless keyboard fallback.
 */

const GESTURE_CONFIG = {
  DEBOUNCE_FRAMES: 2,         // Consecutive frames required to confirm a sign
  MIN_CONFIDENCE: 0.52,       // Minimum gesture recognizer confidence score
  LIGHT_COOLDOWN_MS: 350,     // Cooldown after Light Attack before another can trigger
  HEAVY_COOLDOWN_MS: 1100,    // Cooldown after Heavy Attack
  SPECIAL_COOLDOWN_MS: 1800,  // Cooldown after Special Attack
  GRACE_PERIOD_MS: 150,       // Grace window for dropped frames on held actions
  LOST_TRACKING_WARN_MS: 1500,// Hand missing warning threshold
  LOST_TRACKING_PAUSE_MS: 5000,// Stalled duel pause threshold
  HOP_THRESHOLD_Y: 0.22       // Normalized wrist Y high in frame triggers a hop
};

// Sign to Action Mapping
const SIGN_ACTION_MAP = {
  'Closed_Fist': { action: 'LIGHT_ATTACK', type: 'trigger' },
  'Victory':     { action: 'HEAVY_ATTACK', type: 'trigger' },
  'Open_Palm':   { action: 'BLOCK',        type: 'held'    },
  'Pointing_Up': { action: 'MOVE_FORWARD', type: 'held'    },
  'Thumb_Up':    { action: 'MOVE_BACK',    type: 'held'    },
  'ILoveYou':    { action: 'SPECIAL',      type: 'trigger' }
};

class GestureEngine {
  constructor() {
    this.config = GESTURE_CONFIG;

    // Per-player state (0 = P1, 1 = P2)
    this.players = [
      this.createPlayerState(0),
      this.createPlayerState(1)
    ];

    // Debug panel toggle (Press 'D')
    this.debugActive = false;
    this.fps = 60;
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;

    this.initKeyboardFallback();
    this.initDebugKey();
  }

  createPlayerState(index) {
    return {
      index: index,
      // Debounce tracking
      candidateSign: 'None',
      candidateFrames: 0,
      confirmedSign: 'None',
      previousConfirmedSign: 'None',

      // Real-time Action Flags
      actions: {
        isMovingForward: false,
        isMovingBack: false,
        isBlocking: false,
        isHopping: false
      },

      // Cooldown timestamps
      lastLightAttackTime: 0,
      lastHeavyAttackTime: 0,
      lastSpecialTime: 0,
      lastHopTime: 0,

      // Dropped frame grace timers
      graceTimer: 0,

      // Tracking state
      handDetected: false,
      lastSeenTimestamp: performance.now(),
      isWarningActive: false,
      isPausedActive: false,

      // Keyboard overrides
      keyboardActive: false
    };
  }

  initDebugKey() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        // Only toggle if not typing in an input
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        this.debugActive = !this.debugActive;
        const debugOverlay = document.getElementById('gesture-debug-overlay');
        if (debugOverlay) {
          debugOverlay.style.display = this.debugActive ? 'block' : 'none';
        }
      }
    });
  }

  initKeyboardFallback() {
    // Keyboard key down
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const code = e.code;
      const now = performance.now();

      // PLAYER 1: A (Light), S (Heavy), D (Block), F (Move Forward), G (Move Back), H (Special), W/Space (Hop)
      if (code === 'KeyA') {
        this.triggerAttack(0, 'LIGHT_ATTACK', now);
        this.highlightCheatSign(0, 'Closed_Fist');
      } else if (code === 'KeyS') {
        this.triggerAttack(0, 'HEAVY_ATTACK', now);
        this.highlightCheatSign(0, 'Victory');
      } else if (code === 'KeyD') {
        this.players[0].actions.isBlocking = true;
        this.highlightCheatSign(0, 'Open_Palm');
      } else if (code === 'KeyF') {
        this.players[0].actions.isMovingForward = true;
        this.highlightCheatSign(0, 'Pointing_Up');
      } else if (code === 'KeyG') {
        this.players[0].actions.isMovingBack = true;
        this.highlightCheatSign(0, 'Thumb_Up');
      } else if (code === 'KeyH') {
        this.triggerAttack(0, 'SPECIAL', now);
        this.highlightCheatSign(0, 'ILoveYou');
      } else if (code === 'KeyW' || code === 'Space') {
        this.triggerHop(0, now);
      }

      // PLAYER 2: J/Numpad4 (Light), K/Numpad5 (Heavy), L/Numpad6 (Block), I/Numpad8 (Forward), O/Numpad2 (Back), P/Numpad9 (Special), U/Numpad0 (Hop)
      if (code === 'KeyJ' || code === 'Numpad4' || code === 'Enter') {
        this.triggerAttack(1, 'LIGHT_ATTACK', now);
        this.highlightCheatSign(1, 'Closed_Fist');
      } else if (code === 'KeyK' || code === 'Numpad5' || code === 'ShiftRight') {
        this.triggerAttack(1, 'HEAVY_ATTACK', now);
        this.highlightCheatSign(1, 'Victory');
      } else if (code === 'KeyL' || code === 'Numpad6' || code === 'ArrowDown') {
        this.players[1].actions.isBlocking = true;
        this.highlightCheatSign(1, 'Open_Palm');
      } else if (code === 'KeyI' || code === 'Numpad8' || code === 'ArrowRight') {
        this.players[1].actions.isMovingForward = true;
        this.highlightCheatSign(1, 'Pointing_Up');
      } else if (code === 'KeyO' || code === 'Numpad2' || code === 'ArrowLeft') {
        this.players[1].actions.isMovingBack = true;
        this.highlightCheatSign(1, 'Thumb_Up');
      } else if (code === 'KeyP' || code === 'Numpad9' || code === 'Slash') {
        this.triggerAttack(1, 'SPECIAL', now);
        this.highlightCheatSign(1, 'ILoveYou');
      } else if (code === 'KeyU' || code === 'Numpad0' || code === 'ArrowUp') {
        this.triggerHop(1, now);
      }
    });

    // Keyboard key up (cancels held movement and blocks)
    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const code = e.code;

      // P1 Releases
      if (code === 'KeyD') {
        this.players[0].actions.isBlocking = false;
        this.unhighlightCheatSign(0, 'Open_Palm');
      } else if (code === 'KeyF') {
        this.players[0].actions.isMovingForward = false;
        this.unhighlightCheatSign(0, 'Pointing_Up');
      } else if (code === 'KeyG') {
        this.players[0].actions.isMovingBack = false;
        this.unhighlightCheatSign(0, 'Thumb_Up');
      }

      // P2 Releases
      if (code === 'KeyL' || code === 'Numpad6' || code === 'ArrowDown') {
        this.players[1].actions.isBlocking = false;
        this.unhighlightCheatSign(1, 'Open_Palm');
      } else if (code === 'KeyI' || code === 'Numpad8' || code === 'ArrowRight') {
        this.players[1].actions.isMovingForward = false;
        this.unhighlightCheatSign(1, 'Pointing_Up');
      } else if (code === 'KeyO' || code === 'Numpad2' || code === 'ArrowLeft') {
        this.players[1].actions.isMovingBack = false;
        this.unhighlightCheatSign(1, 'Thumb_Up');
      }
    });
  }

  /**
   * Main update function called every animation frame.
   * Reads from handInput engine, applies debounce, cooldowns, and updates action flags.
   */
  update(fighter1, fighter2) {
    const now = performance.now();

    // Measure FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Process both players
    this.processPlayer(0, fighter1, now);
    this.processPlayer(1, fighter2, now);

    // Render debug overlay if active
    if (this.debugActive) {
      this.renderDebug();
    }
  }

  processPlayer(playerIdx, fighter, now) {
    const pState = this.players[playerIdx];
    const hand = window.handInput ? window.handInput.getPlayerHand(playerIdx) : null;

    if (hand && hand.detected) {
      pState.handDetected = true;
      pState.lastSeenTimestamp = now;

      // Clear lost tracking alerts
      if (pState.isWarningActive) {
        this.hideWarning(playerIdx);
        pState.isWarningActive = false;
      }

      // 1. Check for Hop / Dodge bonus if hand is raised high in the frame
      if (hand.wrist.y < this.config.HOP_THRESHOLD_Y) {
        this.triggerHop(playerIdx, now, fighter);
      }

      // 2. Filter by minimum confidence
      const rawSign = (hand.score >= this.config.MIN_CONFIDENCE) ? hand.sign : 'None';

      // 3. Debounce Sign Recognition (2-3 consecutive frames required)
      if (rawSign === pState.candidateSign) {
        pState.candidateFrames++;
      } else {
        pState.candidateSign = rawSign;
        pState.candidateFrames = 1;
      }

      if (pState.candidateFrames >= this.config.DEBOUNCE_FRAMES) {
        if (pState.confirmedSign !== pState.candidateSign) {
          pState.previousConfirmedSign = pState.confirmedSign;
          pState.confirmedSign = pState.candidateSign;
          this.onSignTransition(playerIdx, pState.confirmedSign, fighter, now);
        }
      }

      // 4. Update held actions (Movement & Block)
      this.updateHeldActions(playerIdx, pState.confirmedSign, fighter);

    } else {
      // Hand missing this frame
      pState.handDetected = false;
      const elapsedSinceSeen = now - pState.lastSeenTimestamp;

      // Dropped frame grace window (~150ms) prevents instantaneous cancellation
      if (elapsedSinceSeen > this.config.GRACE_PERIOD_MS) {
        pState.actions.isMovingForward = false;
        pState.actions.isMovingBack = false;
        pState.actions.isBlocking = false;
        pState.confirmedSign = 'None';
        this.unhighlightAllCheatSigns(playerIdx);
      }

      // Lost tracking warning after 1.5s
      if (elapsedSinceSeen > this.config.LOST_TRACKING_WARN_MS && !pState.isWarningActive) {
        pState.isWarningActive = true;
        this.showWarning(playerIdx, `Player ${playerIdx + 1}: Show your hand!`);
      }
    }
  }

  /**
   * Edge-triggered entry into a sign.
   * Attacks fire ONCE on entry, respecting cooldowns.
   */
  onSignTransition(playerIdx, newSign, fighter, now) {
    this.updateCheatSheetHighlight(playerIdx, newSign);

    const mapping = SIGN_ACTION_MAP[newSign];
    if (!mapping) return;

    if (mapping.type === 'trigger') {
      if (mapping.action === 'LIGHT_ATTACK') {
        this.triggerAttack(playerIdx, 'LIGHT_ATTACK', now, fighter);
      } else if (mapping.action === 'HEAVY_ATTACK') {
        this.triggerAttack(playerIdx, 'HEAVY_ATTACK', now, fighter);
      } else if (mapping.action === 'SPECIAL') {
        this.triggerAttack(playerIdx, 'SPECIAL', now, fighter);
      }
    }
  }

  updateHeldActions(playerIdx, sign, fighter) {
    const pState = this.players[playerIdx];

    // Held Actions
    pState.actions.isMovingForward = (sign === 'Pointing_Up');
    pState.actions.isMovingBack = (sign === 'Thumb_Up');
    pState.actions.isBlocking = (sign === 'Open_Palm');
  }

  triggerAttack(playerIdx, attackType, now, fighter = null) {
    const pState = this.players[playerIdx];

    // Resolve fighter instance if not passed
    if (!fighter && window.gameApp) {
      fighter = (playerIdx === 0) ? window.gameApp.fighter1 : window.gameApp.fighter2;
    }
    if (!fighter) return;

    if (attackType === 'LIGHT_ATTACK') {
      if (now - pState.lastLightAttackTime < this.config.LIGHT_COOLDOWN_MS) return;
      pState.lastLightAttackTime = now;
      fighter.executeLightAttack();
    } else if (attackType === 'HEAVY_ATTACK') {
      if (now - pState.lastHeavyAttackTime < this.config.HEAVY_COOLDOWN_MS) return;
      pState.lastHeavyAttackTime = now;
      fighter.executeHeavyAttack();
    } else if (attackType === 'SPECIAL') {
      if (now - pState.lastSpecialTime < this.config.SPECIAL_COOLDOWN_MS) return;
      if (fighter.specialMeter < 100) {
        // Meter not full feedback
        if (window.sounds) window.sounds.playBeep(false);
        return;
      }
      pState.lastSpecialTime = now;
      fighter.executeSpecialAttack();
    }
  }

  triggerHop(playerIdx, now, fighter = null) {
    const pState = this.players[playerIdx];
    if (now - pState.lastHopTime < 600) return; // hop cooldown
    pState.lastHopTime = now;

    if (!fighter && window.gameApp) {
      fighter = (playerIdx === 0) ? window.gameApp.fighter1 : window.gameApp.fighter2;
    }
    if (fighter) {
      fighter.executeHop();
    }
  }

  // UI Cheat Sheet highlight sync
  updateCheatSheetHighlight(playerIdx, sign) {
    const prefix = (playerIdx === 0) ? 'p1' : 'p2';
    const container = document.getElementById(`${prefix}-cheatsheet`);
    if (!container) return;

    container.querySelectorAll('.sign-badge').forEach(badge => {
      const bSign = badge.getAttribute('data-sign');
      if (bSign === sign) {
        badge.classList.add('active-sign');
      } else {
        badge.classList.remove('active-sign');
      }
    });
  }

  highlightCheatSign(playerIdx, sign) {
    this.updateCheatSheetHighlight(playerIdx, sign);
  }

  unhighlightCheatSign(playerIdx, sign) {
    const prefix = (playerIdx === 0) ? 'p1' : 'p2';
    const badge = document.querySelector(`#${prefix}-cheatsheet .sign-badge[data-sign="${sign}"]`);
    if (badge) badge.classList.remove('active-sign');
  }

  unhighlightAllCheatSigns(playerIdx) {
    const prefix = (playerIdx === 0) ? 'p1' : 'p2';
    const container = document.getElementById(`${prefix}-cheatsheet`);
    if (container) {
      container.querySelectorAll('.sign-badge').forEach(b => b.classList.remove('active-sign'));
    }
  }

  showWarning(playerIdx, text) {
    const warnEl = document.getElementById(playerIdx === 0 ? 'p1-hand-alert' : 'p2-hand-alert');
    if (warnEl) {
      warnEl.innerText = text;
      warnEl.classList.add('active');
    }
  }

  hideWarning(playerIdx) {
    const warnEl = document.getElementById(playerIdx === 0 ? 'p1-hand-alert' : 'p2-hand-alert');
    if (warnEl) {
      warnEl.classList.remove('active');
    }
  }

  renderDebug() {
    const canvas = document.getElementById('gesture-debug-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, 0, w, h);

    // Header info
    ctx.font = "bold 12px 'Orbitron', monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText(`GESTURE DEBUG (FPS: ${this.fps})`, 10, 20);

    // Zone divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(w / 2, 30);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Player 1 stats (Left)
    const p1 = this.players[0];
    const h1 = window.handInput ? window.handInput.getPlayerHand(0) : null;
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("PLAYER 1 (LEFT ZONE)", 10, 45);
    ctx.font = "11px monospace";
    ctx.fillText(`Hand: ${h1 && h1.detected ? 'DETECTED' : 'LOST'}`, 10, 65);
    ctx.fillText(`Raw Sign: ${h1 ? h1.sign : 'None'} (${(h1 ? h1.score * 100 : 0).toFixed(0)}%)`, 10, 85);
    ctx.fillText(`Confirmed: ${p1.confirmedSign}`, 10, 105);
    ctx.fillText(`Block: ${p1.actions.isBlocking} | Fwd: ${p1.actions.isMovingForward}`, 10, 125);
    ctx.fillText(`Back: ${p1.actions.isMovingBack} | Hop: ${p1.actions.isHopping}`, 10, 145);

    // Player 2 stats (Right)
    const p2 = this.players[1];
    const h2 = window.handInput ? window.handInput.getPlayerHand(1) : null;
    ctx.font = "bold 12px 'Orbitron', monospace";
    ctx.fillStyle = "#fb923c";
    ctx.fillText("PLAYER 2 (RIGHT ZONE)", w / 2 + 10, 45);
    ctx.font = "11px monospace";
    ctx.fillText(`Hand: ${h2 && h2.detected ? 'DETECTED' : 'LOST'}`, w / 2 + 10, 65);
    ctx.fillText(`Raw Sign: ${h2 ? h2.sign : 'None'} (${(h2 ? h2.score * 100 : 0).toFixed(0)}%)`, w / 2 + 10, 85);
    ctx.fillText(`Confirmed: ${p2.confirmedSign}`, w / 2 + 10, 105);
    ctx.fillText(`Block: ${p2.actions.isBlocking} | Fwd: ${p2.actions.isMovingForward}`, w / 2 + 10, 125);
    ctx.fillText(`Back: ${p2.actions.isMovingBack} | Hop: ${p2.actions.isHopping}`, w / 2 + 10, 145);
  }
}

// Global instance
window.gestures = new GestureEngine();

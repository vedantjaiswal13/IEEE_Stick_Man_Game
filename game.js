/**
 * IEEE Cyber Clash - Master Game Controller & State Machine
 * Live 2-Player Hand-Sign Controlled Combat Engine:
 * WELCOME -> CALIBRATE -> WEAPON_ROLL -> FIGHT -> KO -> RESULT
 */

class GameApp {
  constructor() {
    // Challenger 1 & 2 Identity
    this.p1 = {
      id: 'p1',
      name: 'Rohan Deshmukh',
      dept: 'Electronics & Telecommunication (E&TC)',
      color: '#0284c7', // IEEE Blue
      weaponId: 'plasma_katana',
      energyModId: 'ion_overclock',
      rerollsLeft: 1
    };

    this.p2 = {
      id: 'p2',
      name: 'Tanvi Kulkarni',
      dept: 'Computer Engineering (CE)',
      color: '#f97316', // IEEE Orange
      weaponId: 'tesla_hammer',
      energyModId: 'plasma_thermal',
      rerollsLeft: 1
    };

    // State: 'WELCOME', 'CALIBRATE', 'WEAPON_ROLL', 'FIGHT', 'KO', 'RESULT'
    this.currentState = 'WELCOME';
    this.animationFrameId = null;

    // Calibration Tracking
    this.calibrationStableStart = 0;
    this.calibrationCountdown = -1;
    this.calibrationTimer = null;

    // Sudden death timer
    this.tied44Timestamp = 0;
    this.isSuddenDeath = false;

    // Canvas & Arena
    this.canvas = document.getElementById('fight-canvas');
    this.arena = new CombatArena(this.canvas);
    this.pipCanvas = document.getElementById('pip-webcam-canvas');

    // Fighters
    this.fighter1 = null;
    this.fighter2 = null;

    // Winner/Loser Cache
    this.winner = null;
    this.loser = null;

    // Slot machine roulette state
    this.rouletteInterval = null;
    this.isRolling = false;

    this.initEventListeners();
  }

  initEventListeners() {
    // Sound Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = window.sounds.toggleSound();
        const stat = document.getElementById('sound-status');
        const ico = document.getElementById('sound-icon');
        if (stat) stat.innerText = isEnabled ? 'ON' : 'OFF';
        if (ico) ico.innerText = isEnabled ? '🔊' : '🔇';
      });
    }

    // Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // PiP Camera Toggle
    const pipToggleBtn = document.getElementById('btn-toggle-pip');
    if (pipToggleBtn) {
      pipToggleBtn.addEventListener('click', () => {
        if (window.handInput) {
          window.handInput.pipVisible = !window.handInput.pipVisible;
          const pipBox = document.getElementById('pip-container');
          if (pipBox) {
            pipBox.style.display = window.handInput.pipVisible ? 'block' : 'none';
          }
        }
      });
    }

    // Leaderboard Open/Close
    const lbBtn = document.getElementById('btn-open-leaderboard');
    if (lbBtn) {
      lbBtn.addEventListener('click', () => {
        if (window.leaderboard) window.leaderboard.open();
      });
    }

    // Screen 1: Proceed to Calibration
    const toCalibBtn = document.getElementById('btn-to-calibration');
    if (toCalibBtn) {
      toCalibBtn.addEventListener('click', () => {
        this.readPlayerInputs();
        this.goToCalibration();
      });
    }

    // Screen 2: Skip Calibration directly to Weapons
    const forceStartCalibBtn = document.getElementById('btn-force-start-calib');
    if (forceStartCalibBtn) {
      forceStartCalibBtn.addEventListener('click', () => {
        this.triggerInstantCalibrationCountdown();
      });
    }

    const skipCalibBtn = document.getElementById('btn-skip-calibration');
    if (skipCalibBtn) {
      skipCalibBtn.addEventListener('click', () => {
        this.goToWeaponRoll();
      });
    }

    // Screen 3: Reroll Buttons
    const p1RerollBtn = document.getElementById('btn-p1-reroll');
    if (p1RerollBtn) {
      p1RerollBtn.addEventListener('click', () => {
        if (this.p1.rerollsLeft > 0) {
          this.p1.rerollsLeft--;
          p1RerollBtn.disabled = true;
          this.spinRouletteSingle('p1');
        }
      });
    }

    const p2RerollBtn = document.getElementById('btn-p2-reroll');
    if (p2RerollBtn) {
      p2RerollBtn.addEventListener('click', () => {
        if (this.p2.rerollsLeft > 0) {
          this.p2.rerollsLeft--;
          p2RerollBtn.disabled = true;
          this.spinRouletteSingle('p2');
        }
      });
    }

    // Screen 3: Start Fight from Weapons
    const startFightBtn = document.getElementById('btn-start-fight');
    if (startFightBtn) {
      startFightBtn.addEventListener('click', () => {
        if (this.autoStartFightTimer) clearInterval(this.autoStartFightTimer);
        this.startMatchCountdown();
      });
    }

    // Spacebar / Enter Shortcut to advance screens effortlessly
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.currentState === 'CALIBRATE') {
          e.preventDefault();
          this.triggerInstantCalibrationCountdown();
        } else if (this.currentState === 'WEAPON_ROLL') {
          e.preventDefault();
          if (this.autoStartFightTimer) clearInterval(this.autoStartFightTimer);
          this.startMatchCountdown();
        }
      }
    });

    // Screen 4: Restart Fight
    const restartBtn = document.getElementById('btn-restart-fight');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.resetArenaFight();
      });
    }

    // Screen 5: Rematch & New Match
    const rematchBtn = document.getElementById('btn-rematch');
    if (rematchBtn) {
      rematchBtn.addEventListener('click', () => {
        this.p1.rerollsLeft = 1;
        this.p2.rerollsLeft = 1;
        this.goToWeaponRoll();
      });
    }

    const newPlayersBtn = document.getElementById('btn-new-challengers');
    if (newPlayersBtn) {
      newPlayersBtn.addEventListener('click', () => {
        this.showScreen('screen-welcome');
        this.currentState = 'WELCOME';
      });
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    if (screenId === 'screen-arena') {
      document.body.classList.add('in-battle');
    } else {
      document.body.classList.remove('in-battle');
    }
  }

  readPlayerInputs() {
    const p1Name = document.getElementById('p1-name').value.trim() || 'Rohan';
    const p1Dept = document.getElementById('p1-dept').value;
    const p2Name = document.getElementById('p2-name').value.trim() || 'Tanvi';
    const p2Dept = document.getElementById('p2-dept').value;

    this.p1.name = p1Name.slice(0, 16);
    this.p1.dept = p1Dept;
    this.p2.name = p2Name.slice(0, 16);
    this.p2.dept = p2Dept;
  }

  // ================= 1. CALIBRATION =================

  async goToCalibration() {
    this.showScreen('screen-calibration');
    this.currentState = 'CALIBRATE';
    this.calibrationStableStart = 0;
    this.calibrationCountdown = -1;
    this.isCalibrationLocked = false;

    // Start Webcam & MediaPipe
    if (window.handInput) {
      await window.handInput.init();
      await window.handInput.startCamera();
    }

    this.runCalibrationLoop();
  }

  triggerInstantCalibrationCountdown() {
    if (this.isCalibrationLocked) return;
    this.isCalibrationLocked = true;
    this.startCalibrationCountdownSequence();
  }

  startCalibrationCountdownSequence() {
    const countOverlay = document.getElementById('calib-countdown-overlay');
    this.calibrationCountdown = 3;
    if (countOverlay) {
      countOverlay.style.display = 'block';
      countOverlay.innerText = '3';
    }
    try { window.sounds?.playCountdownBeep?.(false); } catch (e) {}

    if (this.calibrationTimer) clearInterval(this.calibrationTimer);

    this.calibrationTimer = setInterval(() => {
      this.calibrationCountdown--;
      if (this.calibrationCountdown > 0) {
        try { window.sounds?.playCountdownBeep?.(false); } catch (e) {}
        if (countOverlay) countOverlay.innerText = `${this.calibrationCountdown}`;
      } else if (this.calibrationCountdown === 0) {
        try { window.sounds?.playCountdownBeep?.(true); } catch (e) {}
        if (countOverlay) countOverlay.innerText = "FIGHT READY!";
        clearInterval(this.calibrationTimer);
        setTimeout(() => {
          if (countOverlay) countOverlay.style.display = 'none';
          this.goToWeaponRoll();
        }, 600);
      }
    }, 900);
  }

  runCalibrationLoop() {
    if (this.currentState !== 'CALIBRATE') return;

    if (window.handInput) {
      window.handInput.processFrame();
      const calibCanvas = document.getElementById('calibration-canvas');
      if (calibCanvas) {
        window.handInput.renderPip(calibCanvas);
      }
    }

    const h1 = window.handInput ? window.handInput.getPlayerHand(0) : null;
    const h2 = window.handInput ? window.handInput.getPlayerHand(1) : null;

    const p1Ready = h1 && h1.detected;
    const p2Ready = h2 && h2.detected;

    const p1Badge = document.getElementById('calib-p1-status');
    const p2Badge = document.getElementById('calib-p2-status');

    if (p1Badge) {
      p1Badge.className = `calib-status-badge ${p1Ready ? 'status-ready' : 'status-waiting'}`;
      p1Badge.innerText = p1Ready ? `✓ READY (${h1.sign})` : 'Show hand in Left Zone...';
    }
    if (p2Badge) {
      p2Badge.className = `calib-status-badge ${p2Ready ? 'status-ready' : 'status-waiting'}`;
      p2Badge.innerText = p2Ready ? `✓ READY (${h2.sign})` : 'Show hand in Right Zone...';
    }

    const now = performance.now();

    // Check if both hands are detected
    if (!this.isCalibrationLocked) {
      if (p1Ready && p2Ready) {
        if (this.calibrationStableStart === 0) {
          this.calibrationStableStart = now;
        }

        const stableDuration = now - this.calibrationStableStart;
        // After 400ms of stable presence, lock in calibration and begin countdown
        if (stableDuration >= 400) {
          this.isCalibrationLocked = true;
          this.startCalibrationCountdownSequence();
        }
      } else {
        // Brief grace window against minor flicker
        if (now - this.calibrationStableStart > 500) {
          this.calibrationStableStart = 0;
        }
      }
    }

    requestAnimationFrame(() => this.runCalibrationLoop());
  }

  // ================= 2. WEAPON ROULETTE =================

  goToWeaponRoll() {
    this.showScreen('screen-roulette');
    this.currentState = 'WEAPON_ROLL';
    if (this.autoStartFightTimer) clearInterval(this.autoStartFightTimer);

    // Update names on cards
    const p1NameEl = document.getElementById('roulette-p1-name');
    const p1DeptEl = document.getElementById('roulette-p1-dept');
    const p2NameEl = document.getElementById('roulette-p2-name');
    const p2DeptEl = document.getElementById('roulette-p2-dept');

    if (p1NameEl) p1NameEl.innerText = this.p1.name;
    if (p1DeptEl) p1DeptEl.innerText = this.p1.dept;
    if (p2NameEl) p2NameEl.innerText = this.p2.name;
    if (p2DeptEl) p2DeptEl.innerText = this.p2.dept;

    const b1 = document.getElementById('btn-p1-reroll');
    const b2 = document.getElementById('btn-p2-reroll');
    if (b1) { b1.disabled = false; b1.innerText = '🎲 Re-roll (1)'; }
    if (b2) { b2.disabled = false; b2.innerText = '🎲 Re-roll (1)'; }

    const startFightBtn = document.getElementById('btn-start-fight');
    if (startFightBtn) startFightBtn.innerText = '⚔️ Enter The Clash →';

    this.spinRouletteBoth();
  }

  spinRouletteBoth() {
    const weaponKeys = Object.keys(window.WEAPONS_DATA);
    const modKeys = Object.keys(window.ENERGY_MODS);
    let spins = 0;
    const maxSpins = 18;

    if (this.rouletteInterval) clearInterval(this.rouletteInterval);

    this.rouletteInterval = setInterval(() => {
      spins++;
      const randW1 = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      const randW2 = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      const randM1 = modKeys[Math.floor(Math.random() * modKeys.length)];
      const randM2 = modKeys[Math.floor(Math.random() * modKeys.length)];

      this.updateRouletteCard('p1', randW1, randM1);
      this.updateRouletteCard('p2', randW2, randM2);

      if (window.sounds) window.sounds.playRouletteTick(1.0 + spins * 0.04);

      if (spins >= maxSpins) {
        clearInterval(this.rouletteInterval);
        this.p1.weaponId = randW1;
        this.p1.energyModId = randM1;
        this.p2.weaponId = randW2;
        this.p2.energyModId = randM2;
        if (window.sounds) window.sounds.playSelect();

        // Start Auto-Advance Timer into Fight (3 seconds countdown)
        this.startRouletteAutoAdvance(3);
      }
    }, 75);
  }

  spinRouletteSingle(playerKey) {
    if (this.autoStartFightTimer) clearInterval(this.autoStartFightTimer);
    const weaponKeys = Object.keys(window.WEAPONS_DATA);
    const modKeys = Object.keys(window.ENERGY_MODS);
    let spins = 0;

    const interval = setInterval(() => {
      spins++;
      const randW = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      const randM = modKeys[Math.floor(Math.random() * modKeys.length)];
      this.updateRouletteCard(playerKey, randW, randM);
      if (window.sounds) window.sounds.playRouletteTick(1.2);

      if (spins >= 14) {
        clearInterval(interval);
        this[playerKey].weaponId = randW;
        this[playerKey].energyModId = randM;
        if (window.sounds) window.sounds.playSelect();

        // Resume auto-advance after reroll
        this.startRouletteAutoAdvance(3);
      }
    }, 70);
  }

  startRouletteAutoAdvance(seconds = 3) {
    if (this.autoStartFightTimer) clearInterval(this.autoStartFightTimer);
    let remaining = seconds;
    const startFightBtn = document.getElementById('btn-start-fight');

    if (startFightBtn) {
      startFightBtn.innerText = `⚔️ Enter The Clash (Auto-start in ${remaining}s) →`;
    }

    this.autoStartFightTimer = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        if (startFightBtn) {
          startFightBtn.innerText = `⚔️ Enter The Clash (Auto-start in ${remaining}s) →`;
        }
      } else {
        clearInterval(this.autoStartFightTimer);
        this.autoStartFightTimer = null;
        this.startMatchCountdown();
      }
    }, 1000);
  }

  updateRouletteCard(playerKey, weaponId, modId) {
    const w = window.WEAPONS_DATA[weaponId];
    const m = window.ENERGY_MODS[modId];
    if (!w || !m) return;

    document.getElementById(`${playerKey}-weapon-icon`).innerText = w.icon;
    document.getElementById(`${playerKey}-weapon-title`).innerText = w.name.toUpperCase();
    document.getElementById(`${playerKey}-mod-badge`).innerText = `${m.icon} ${m.name}`;
    document.getElementById(`${playerKey}-special-move`).innerText = `Super: ${w.specialMove}`;
  }

  // ================= 3. COUNTDOWN & FIGHT =================

  startMatchCountdown() {
    this.showScreen('screen-arena');
    this.currentState = 'FIGHT';
    this.initFighters();
    this.updatePipPlayerHUD();

    // Reset Sudden Death
    this.tied44Timestamp = 0;
    this.isSuddenDeath = false;

    // Announce 3-2-1
    let count = 3;
    try { window.sounds?.playCountdownBeep?.(false); } catch (e) {}
    if (this.arena) this.arena.showBanner("3", "#00B5E2");

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        try { window.sounds?.playCountdownBeep?.(false); } catch (e) {}
        if (this.arena) this.arena.showBanner(`${count}`, "#00B5E2");
      } else {
        clearInterval(timer);
        try { window.sounds?.playCountdownBeep?.(true); } catch (e) {}
        if (this.arena) this.arena.showBanner("FIRST TO 5 CLEAN HITS • FIGHT!", "#facc15");
      }
    }, 900);

    this.startFightLoop();
  }

  initFighters() {
    this.fighter1 = new StickmanFighter(
      'p1',
      this.p1.name,
      this.p1.dept,
      this.p1.color,
      true, // Facing right
      this.p1.weaponId,
      this.p1.energyModId
    );

    this.fighter2 = new StickmanFighter(
      'p2',
      this.p2.name,
      this.p2.dept,
      this.p2.color,
      false, // Facing left
      this.p2.weaponId,
      this.p2.energyModId
    );

    this.updatePipPlayerHUD();
  }

  resetArenaFight() {
    if (this.fighter1) this.fighter1.reset(true);
    if (this.fighter2) this.fighter2.reset(false);
    this.tied44Timestamp = 0;
    this.isSuddenDeath = false;
    this.arena.showBanner("FIGHT RESTARTED!", "#38bdf8");
  }

  updatePipPlayerHUD() {
    // P1 HUD
    const p1NameEl = document.getElementById('hud-p1-name');
    const p1DeptEl = document.getElementById('hud-p1-dept');
    const p1WeapEl = document.getElementById('hud-p1-weapon');
    if (p1NameEl) p1NameEl.innerText = this.p1.name;
    if (p1DeptEl) p1DeptEl.innerText = this.p1.dept;
    if (p1WeapEl && this.fighter1) p1WeapEl.innerText = this.fighter1.weapon.name;

    // P2 HUD
    const p2NameEl = document.getElementById('hud-p2-name');
    const p2DeptEl = document.getElementById('hud-p2-dept');
    const p2WeapEl = document.getElementById('hud-p2-weapon');
    if (p2NameEl) p2NameEl.innerText = this.p2.name;
    if (p2DeptEl) p2DeptEl.innerText = this.p2.dept;
    if (p2WeapEl && this.fighter2) p2WeapEl.innerText = this.fighter2.weapon.name;
  }

  startFightLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      if (this.currentState !== 'FIGHT' && this.currentState !== 'KO') return;

      const dt = Math.min(currentTime - lastTime, 40);
      lastTime = currentTime;

      // 1. Process MediaPipe Hand Recognition
      if (window.handInput) {
        window.handInput.processFrame();
        if (this.pipCanvas) {
          window.handInput.renderPip(this.pipCanvas);
        }
      }

      // 2. Process Gestures & Actions
      if (window.gestures) {
        window.gestures.update(this.fighter1, this.fighter2);
      }

      // 3. Update Fighters
      const g1 = window.gestures ? window.gestures.players[0].actions : null;
      const g2 = window.gestures ? window.gestures.players[1].actions : null;

      this.fighter1.update(dt, this.fighter2, g1);
      this.fighter2.update(dt, this.fighter1, g2);

      // 4. Sudden Death Rule: Tied at 4-4 for >60s
      if (this.fighter1.hitsTaken === 4 && this.fighter2.hitsTaken === 4) {
        if (this.tied44Timestamp === 0) this.tied44Timestamp = currentTime;
        if (!this.isSuddenDeath && currentTime - this.tied44Timestamp > 60000) {
          this.isSuddenDeath = true;
          this.arena.showBanner("⚡ SUDDEN DEATH: NEXT HIT WINS! ⚡", "#ef4444");
          if (window.sounds) window.sounds.playSuperMove();
        }
      } else {
        this.tied44Timestamp = 0;
      }

      // 5. Update Arena & Camera
      this.arena.update(dt, this.fighter1, this.fighter2);

      // 6. Render Canvas Scene
      this.renderCanvas();

      // 7. Update HUD hit pips & special meters
      this.updateCombatHUD();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(loop);
  }

  renderCanvas() {
    if (!this.arena || !this.arena.ctx) return;
    const ctx = this.arena.ctx;
    const w = this.arena.width || 1280;
    const h = this.arena.height || 720;

    ctx.clearRect(0, 0, w, h);

    const zoom = (!isNaN(this.arena.cameraZoom) && this.arena.cameraZoom > 0.1) ? this.arena.cameraZoom : 1;
    const sx = isNaN(this.arena.shakeX) ? 0 : this.arena.shakeX;
    const sy = isNaN(this.arena.shakeY) ? 0 : this.arena.shakeY;

    ctx.save();
    // Camera shake & zoom
    ctx.translate(sx, sy);
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);

    try {
      // Draw arena background
      this.arena.drawBackground();
    } catch (bgErr) {
      console.warn("Error drawing arena background:", bgErr);
    }

    try {
      // Render fighters
      if (this.fighter1) this.fighter1.render(ctx);
      if (this.fighter2) this.fighter2.render(ctx);
    } catch (fErr) {
      console.warn("Error rendering fighters:", fErr);
    }

    try {
      // Draw arena foreground (particles, text, crowd)
      this.arena.drawForeground();
    } catch (fgErr) {
      console.warn("Error drawing arena foreground:", fgErr);
    }

    ctx.restore();
  }

  updateCombatHUD() {
    // Update Hit Pips (5 pips per player)
    // p1 pips
    const p1Pips = document.querySelectorAll('#p1-pips .hit-pip');
    p1Pips.forEach((pip, idx) => {
      if (idx < this.fighter1.hitsTaken) {
        pip.classList.add('pip-lost');
      } else {
        pip.classList.remove('pip-lost');
      }
    });

    // p2 pips
    const p2Pips = document.querySelectorAll('#p2-pips .hit-pip');
    p2Pips.forEach((pip, idx) => {
      if (idx < this.fighter2.hitsTaken) {
        pip.classList.add('pip-lost');
      } else {
        pip.classList.remove('pip-lost');
      }
    });

    // Special meter bars (0 to 100%)
    const p1SpecialFill = document.getElementById('p1-special-fill');
    if (p1SpecialFill) p1SpecialFill.style.width = `${this.fighter1.specialMeter}%`;

    const p2SpecialFill = document.getElementById('p2-special-fill');
    if (p2SpecialFill) p2SpecialFill.style.width = `${this.fighter2.specialMeter}%`;
  }

  // ================= 4. MATCH FINISH & VICTORY =================

  onFighterKnockedOut(loser, winner) {
    if (this.currentState === 'KO' || this.currentState === 'RESULT') return;
    this.currentState = 'KO';

    this.winner = winner;
    this.loser = loser;

    // Slow-mo cinematic KO finish
    this.arena.triggerSlowmo(35);
    this.arena.shake(25);
    this.arena.showBanner("KNOCKOUT!", "#ef4444");

    if (window.sounds) {
      window.sounds.playKoSting();
      setTimeout(() => {
        window.sounds.playFanfare();
        window.sounds.playCrowdCheer();
      }, 700);
    }

    // Winner celebratory pose
    winner.state = 'VICTORY';
    winner.vx = 0;

    // Transition to victory result screen after 2.4s
    setTimeout(() => {
      this.showVictoryScreen();
    }, 2400);
  }

  showVictoryScreen() {
    this.currentState = 'RESULT';
    this.showScreen('screen-victory');

    document.getElementById('winner-name-text').innerText = `${this.winner.name.toUpperCase()} WINS!`;
    document.getElementById('winner-dept-text').innerText = `${this.winner.dept} • VIT PUNE`;
    document.getElementById('win-weapon-val').innerText = this.winner.weapon.name;
    document.getElementById('win-finish-move').innerText = this.winner.currentMoveTitle;
    document.getElementById('win-score-val').innerText = `5 - ${this.loser.hitsTaken} CLEAN HITS`;

    // Confetti burst
    this.triggerConfetti();

    // Record duel to tournament leaderboard
    if (window.leaderboard) {
      window.leaderboard.addMatchResult({
        id: `match-${Date.now()}`,
        winnerName: this.winner.name,
        winnerDept: this.winner.dept,
        loserName: this.loser.name,
        loserDept: this.loser.dept,
        weaponName: this.winner.weapon.name,
        finishMove: this.winner.currentMoveTitle,
        damage: (this.loser.hitsTaken) * 200 + 1000,
        hitsScore: `5 - ${this.loser.hitsTaken}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }

  triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#00B5E2', '#fbbf24', '#f97316', '#10b981', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      const bit = document.createElement('div');
      bit.className = 'confetti-bit';
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      bit.style.animationDelay = `${Math.random() * 1.5}s`;
      bit.style.animationDuration = `${Math.random() * 2 + 2}s`;
      container.appendChild(bit);
    }
  }
}

// Global initialization on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});

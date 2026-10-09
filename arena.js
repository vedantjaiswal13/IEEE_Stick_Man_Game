/**
 * IEEE Cyber Clash - Combat Arena, Particles & Camera FX Engine
 * Features:
 * - Dynamic hit-stop freeze frames on impacts (60-120ms)
 * - Distance-based camera zooming & midpoint tracking
 * - Screen shake scaled by damage
 * - Reactive audience crowd silhouettes bouncing on hits
 * - Ground fissures, sparks, laser beams & floating popups
 */

class CombatArena {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Particles & FX
    this.particles = [];
    this.groundCracks = [];
    this.floatingTexts = [];
    this.beams = [];

    // Screen Shake & Camera
    this.shakeMag = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.cameraZoom = 1;
    this.targetZoom = 1;
    this.cameraX = canvas.width / 2;
    this.cameraY = canvas.height / 2;

    // Hit-Stop Freeze Frame (ms)
    this.hitStopMs = 0;

    // Slow-mo
    this.slowmoFrames = 0;
    this.timeScale = 1;

    // Light flash
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';

    // Grid animation
    this.gridOffset = 0;

    // Reactive Crowd Silhouettes
    this.crowdHype = 0;
    this.crowdSilhouettes = this.initCrowdSilhouettes();
  }

  initCrowdSilhouettes() {
    const crowd = [];
    const count = 28;
    const spacing = this.width / count;
    for (let i = 0; i < count; i++) {
      crowd.push({
        x: i * spacing + Math.random() * 15,
        baseY: this.height - 10,
        height: Math.random() * 25 + 30,
        width: Math.random() * 10 + 16,
        bounceY: 0,
        cheerOffset: Math.random() * Math.PI * 2
      });
    }
    return crowd;
  }

  shake(amount = 12) {
    this.shakeMag = Math.max(this.shakeMag, amount);
  }

  triggerHitStop(ms = 80) {
    this.hitStopMs = Math.max(this.hitStopMs, ms);
    this.crowdHype = Math.min(100, this.crowdHype + 35);
  }

  triggerSlowmo(frames = 20) {
    this.slowmoFrames = frames;
    const overlay = document.getElementById('slowmo-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), frames * 28);
    }
  }

  flash(color = '#ffffff', alpha = 0.4) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  showPopup(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 20,
      text: text,
      color: color,
      alpha: 1,
      vy: -2.4,
      scale: 1.3
    });
  }

  showBanner(text, color = '#ffffff') {
    const el = document.getElementById('battle-announcer');
    if (!el) return;
    el.innerText = text;
    el.style.color = color;
    el.style.textShadow = '0 2px 10px rgba(0, 0, 0, 0.7)';
    el.classList.add('active');
    setTimeout(() => {
      el.classList.remove('active');
    }, 1600);
  }

  announceMove(fighterId, fighterName, moveTitle, color = '#00B5E2') {
    const cardId = fighterId === 'p1' ? 'p1-move-card' : 'p2-move-card';
    const textId = fighterId === 'p1' ? 'p1-move-text' : 'p2-move-text';
    const cardEl = document.getElementById(cardId);
    const textEl = document.getElementById(textId);

    if (textEl) {
      textEl.innerText = moveTitle;
      textEl.style.color = color;
    }
    if (cardEl) {
      cardEl.classList.add('highlight');
      setTimeout(() => cardEl.classList.remove('highlight'), 1200);
    }
  }

  createImpact(x, y, color, isHeavy = false) {
    const count = isHeavy ? 32 : 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isHeavy ? 13 : 7) + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isHeavy ? 3 : 1),
        size: Math.random() * (isHeavy ? 5 : 3) + 1.5,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.35,
        type: 'spark'
      });
    }
  }

  createGroundCrack(x, groundY = 530) {
    this.groundCracks.push({
      x: x,
      y: groundY,
      radius: 8,
      maxRadius: 70,
      color: '#fbbf24',
      alpha: 0.95
    });
  }

  /**
   * Update camera focus, zoom, particles, and effects
   */
  update(dt, fighter1, fighter2) {
    // 1. Hit-Stop check
    if (this.hitStopMs > 0) {
      this.hitStopMs -= dt;
      return; // Freeze visual simulation for punchy hit-stop effect!
    }

    // 2. Slow-mo control
    if (this.slowmoFrames > 0) {
      this.slowmoFrames--;
      this.timeScale = 0.35;
    } else {
      this.timeScale = 1;
    }

    // 3. Dynamic Camera Tracking (Midpoint & Distance-based Zoom)
    if (fighter1 && fighter2) {
      const midX = (fighter1.x + fighter2.x) / 2;
      const dist = Math.abs(fighter1.x - fighter2.x);

      // Smooth tracking to midpoint
      this.cameraX += (midX - this.cameraX) * 0.08;

      // Distance zoom: closer = punch in (up to 1.15), far = zoom out (down to 0.92)
      if (dist < 320) {
        this.targetZoom = 1.12;
      } else if (dist > 700) {
        this.targetZoom = 0.92;
      } else {
        this.targetZoom = 1.0;
      }
      this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.05;
      if (isNaN(this.cameraZoom) || this.cameraZoom <= 0.1) {
        this.cameraZoom = 1;
      }
    }

    // 4. Screen Shake decay
    if (this.shakeMag > 0) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeMag *= 0.86;
      if (this.shakeMag < 0.5) {
        this.shakeMag = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    // 5. Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.035;
    }

    // 6. Crowd hype decay & bounce
    if (this.crowdHype > 0) {
      this.crowdHype *= 0.94;
    }
    const t = performance.now() * 0.005;
    this.crowdSilhouettes.forEach(person => {
      person.bounceY = Math.sin(t + person.cheerOffset) * (person.height * 0.15) * (this.crowdHype / 50 + 0.2);
    });

    // 7. Ground cracks
    for (let i = this.groundCracks.length - 1; i >= 0; i--) {
      const c = this.groundCracks[i];
      c.radius += 3;
      c.alpha -= 0.025;
      if (c.alpha <= 0) this.groundCracks.splice(i, 1);
    }

    // 8. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * this.timeScale;
      p.y += p.vy * this.timeScale;
      p.vy += p.gravity * this.timeScale;
      p.alpha -= p.decay * this.timeScale;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // 9. Floating popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * this.timeScale;
      ft.alpha -= 0.02 * this.timeScale;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    this.gridOffset = (this.gridOffset + 1.2 * this.timeScale) % 40;
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Deep Cyber Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.65, '#0b1129');
    skyGrad.addColorStop(1, '#020308');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Distant Cyber City Skyline
    ctx.fillStyle = '#060a1e';
    const buildings = [
      { x: 40, w: 90, h: 220 },
      { x: 150, w: 70, h: 280 },
      { x: 240, w: 110, h: 190 },
      { x: 380, w: 80, h: 320 },
      { x: 480, w: 120, h: 240 },
      { x: 620, w: 95, h: 300 },
      { x: 740, w: 130, h: 210 },
      { x: 890, w: 85, h: 290 },
      { x: 1000, w: 110, h: 230 },
      { x: 1130, w: 90, h: 270 }
    ];

    buildings.forEach(b => {
      ctx.fillRect(b.x, 530 - b.h, b.w, b.h);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      for (let wy = 530 - b.h + 20; wy < 520; wy += 25) {
        for (let wx = b.x + 10; wx < b.x + b.w - 15; wx += 18) {
          if (Math.sin(wx * wy) > 0) ctx.fillRect(wx, wy, 8, 12);
        }
      }
      ctx.fillStyle = '#060a1e';
    });

    // 3. Central IEEE SB VIT Pune Billboard
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#00B5E2';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(400, 85, 480, 130);
    ctx.fillRect(400, 85, 480, 130);

    // IEEE Kite Diamond Logo
    ctx.strokeStyle = '#00B5E2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(640, 92);
    ctx.lineTo(655, 107);
    ctx.lineTo(640, 122);
    ctx.lineTo(625, 107);
    ctx.closePath();
    ctx.stroke();

    ctx.font = '900 24px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('IEEE SB VIT PUNE', 640, 152);

    ctx.font = '700 13px Rajdhani';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('CYBER CLASH: LIVE HAND SIGN COMBAT', 640, 178);

    ctx.font = '600 11px Rajdhani';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ieeesbvitpune.vercel.app • FIRST TO 5 HITS WINS', 640, 198);
    ctx.restore();

    // 4. Cyber Platform Ground
    const groundY = 530;
    const platGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    platGrad.addColorStop(0, '#0f172a');
    platGrad.addColorStop(0.3, '#070b16');
    platGrad.addColorStop(1, '#020308');
    ctx.fillStyle = platGrad;
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // Ground Edge Line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // 5. 3D Perspective Neon Floor Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 1.2;

    for (let y = groundY + 15; y < this.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    const vpX = this.width / 2;
    for (let x = -200; x <= this.width + 200; x += 60) {
      ctx.beginPath();
      ctx.moveTo(vpX + (x - vpX) * 0.2, groundY);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // 6. Ground Cracks
    for (const c of this.groundCracks) {
      ctx.save();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = c.alpha;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.radius * 1.5, c.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawForeground() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Reactive Crowd Silhouettes at the bottom
    ctx.fillStyle = 'rgba(4, 7, 20, 0.88)';
    for (const p of this.crowdSilhouettes) {
      const y = p.baseY - p.bounceY;
      ctx.beginPath();
      ctx.arc(p.x, y - p.height, p.width * 0.35, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.fillRect(p.x - p.width * 0.5, y - p.height * 0.7, p.width, p.height); // body
    }

    // 2. Impact Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Floating Popups ("CLEAN HIT", "PERFECT BLOCK!", "CRITICAL!")
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `800 ${Math.floor(22 * ft.scale)}px 'Orbitron', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 4. Fullscreen Impact Flash
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.CombatArena = CombatArena;

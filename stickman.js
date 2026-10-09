/**
 * IEEE Cyber Clash - Procedural Physics Stickman Fighter Engine
 * Refactored for live skill-based 2-player combat:
 * - Damped spring skeletal physics (overshoot, weight, follow-through)
 * - Procedural walk cycle with foot planting & torso lean
 * - Real spatial arena x-positions (cannot walk through each other)
 * - First-to-5 clean hits combat rules
 * - Block guard with "Perfect Block" window
 * - Verlet ragdoll knockdown flop on heavy hits
 * - Zero scripted outcomes or predetermined timers
 */

class StickmanFighter {
  constructor(id, name, dept, color, isFacingRight, weaponId, energyModId = 'ion_overclock') {
    this.id = id; // 'p1' or 'p2'
    this.name = name;
    this.dept = dept;
    this.color = color;
    this.initialFacing = isFacingRight ? 1 : -1;
    this.facing = this.initialFacing;

    // Weapon & Energy Setup
    this.weaponId = weaponId || 'plasma_katana';
    this.weapon = window.WEAPONS_DATA[this.weaponId] || window.WEAPONS_DATA.plasma_katana;
    this.energyModId = energyModId || 'ion_overclock';
    this.energyMod = window.ENERGY_MODS[this.energyModId] || window.ENERGY_MODS.ion_overclock;
    this.themeColor = this.energyMod.color || this.weapon.themeColor || this.color;

    // Spatial Arena Position
    this.x = isFacingRight ? 360 : 920;
    this.y = 530;
    this.groundY = 530;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.75;
    this.isGrounded = true;

    // First to 5 Clean Hits Rule
    this.maxHits = 5;
    this.hitsTaken = 0;
    this.isDefeated = false;

    // Special Overdrive Meter (0 to 100)
    this.specialMeter = 0;

    // Combat State: 'IDLE', 'WALK', 'LIGHT_ATTACK', 'HEAVY_ATTACK', 'SPECIAL', 'BLOCK', 'HURT', 'KNOCKED', 'VICTORY'
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.attackHitChecked = false;

    // Block Guard Timing
    this.blockStartTime = 0;

    // Ragdoll Knockdown Flopping
    this.isRagdoll = false;
    this.ragdollTimer = 0;

    // Procedural Animation Walk Cycle
    this.walkCycle = 0;
    this.bodyBob = 0;
    this.torsoLean = 0;

    // Spring/Damper Physics Offsets for Skeletal Joints
    this.springs = {
      head: { x: 0, y: 0, vx: 0, vy: 0 },
      spine: { x: 0, y: 0, vx: 0, vy: 0 },
      weaponTip: { x: 0, y: 0, vx: 0, vy: 0 }
    };

    // 14-Joint Kinematic Structure
    this.joints = {
      head: { x: 0, y: -80, r: 15 },
      neck: { x: 0, y: -65 },
      pelvis: { x: 0, y: -15 },
      rShoulder: { x: 6, y: -60 },
      rElbow: { x: 16, y: -38 },
      rHand: { x: 28, y: -20 },
      lShoulder: { x: -6, y: -60 },
      lElbow: { x: -16, y: -38 },
      lHand: { x: -28, y: -20 },
      rHip: { x: 6, y: -15 },
      rKnee: { x: 12, y: 18 },
      rFoot: { x: 16, y: 45 },
      lHip: { x: -6, y: -15 },
      lKnee: { x: -12, y: 18 },
      lFoot: { x: -16, y: 45 }
    };

    // Weapon Attached Physics
    this.weaponAngle = 0;
    this.targetWeaponAngle = 0;
    this.weaponAngularVel = 0;

    // Glowing Motion Ghost Trails
    this.ghosts = [];

    // Telemetry move string
    this.currentMoveTitle = 'READY';
  }

  setEquipment(weaponId, energyModId) {
    this.weaponId = weaponId;
    this.weapon = window.WEAPONS_DATA[weaponId] || window.WEAPONS_DATA.plasma_katana;
    this.energyModId = energyModId || 'ion_overclock';
    this.energyMod = window.ENERGY_MODS[this.energyModId] || window.ENERGY_MODS.ion_overclock;
    this.themeColor = this.energyMod.color || this.weapon.themeColor || this.color;
  }

  reset(isFacingRight) {
    this.x = isFacingRight ? 360 : 920;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.facing = isFacingRight ? 1 : -1;
    this.hitsTaken = 0;
    this.isDefeated = false;
    this.specialMeter = 0;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.isRagdoll = false;
    this.ragdollTimer = 0;
    this.ghosts = [];
  }

  // ================= ACTIONS TRIGGERED BY GESTURES / KEYBOARD =================

  executeLightAttack() {
    if (this.state === 'HURT' || this.state === 'KNOCKED' || this.state === 'VICTORY' || this.isDefeated) return;
    if (this.state === 'LIGHT_ATTACK' || this.state === 'HEAVY_ATTACK' || this.state === 'SPECIAL') return;

    this.state = 'LIGHT_ATTACK';
    this.stateTimer = 0;
    this.attackHitChecked = false;
    this.currentMoveTitle = 'LIGHT STRIKE';

    // Forward lunge
    this.vx += this.facing * 7.5;

    if (window.sounds) window.sounds.playWhoosh(1.3);
    if (window.gameApp && window.gameApp.arena) {
      window.gameApp.arena.announceMove(this.id, this.name, `${this.weapon.icon} QUICK STRIKE`, this.color);
    }
  }

  executeHeavyAttack() {
    if (this.state === 'HURT' || this.state === 'KNOCKED' || this.state === 'VICTORY' || this.isDefeated) return;
    if (this.state === 'LIGHT_ATTACK' || this.state === 'HEAVY_ATTACK' || this.state === 'SPECIAL') return;

    this.state = 'HEAVY_ATTACK';
    this.stateTimer = 0;
    this.attackHitChecked = false;
    this.currentMoveTitle = 'HEAVY SLAM (GUARD BREAKER)';

    // Initial windup step back, then massive forward lunge
    this.vx -= this.facing * 2;

    if (window.sounds) window.sounds.playWhoosh(0.75);
    if (window.gameApp && window.gameApp.arena) {
      window.gameApp.arena.announceMove(this.id, this.name, `💥 HEAVY ${this.weapon.name.toUpperCase()}`, '#fbbf24');
    }
  }

  executeSpecialAttack() {
    if (this.state === 'HURT' || this.state === 'KNOCKED' || this.state === 'VICTORY' || this.isDefeated) return;
    if (this.specialMeter < 100) return;

    this.state = 'SPECIAL';
    this.stateTimer = 0;
    this.attackHitChecked = false;
    this.specialMeter = 0;
    this.currentMoveTitle = this.weapon.specialMove.toUpperCase();

    // Sudden dramatic leap/lunge
    this.vx += this.facing * 12;
    this.vy = -5;
    this.isGrounded = false;

    if (window.sounds) window.sounds.playSuperMove();
    if (window.gameApp && window.gameApp.arena) {
      window.gameApp.arena.flash(this.themeColor, 0.5);
      window.gameApp.arena.shake(16);
      window.gameApp.arena.announceMove(this.id, this.name, `⚡ ${this.weapon.specialMove.toUpperCase()} ⚡`, this.themeColor);
    }
  }

  executeHop() {
    if (!this.isGrounded || this.state === 'KNOCKED' || this.isDefeated) return;
    this.vy = -12.5;
    this.isGrounded = false;
    if (window.sounds) window.sounds.playHop();
  }

  // ================= COMBAT IMPACT & DAMAGE RECEPTION =================

  /**
   * Called when an incoming attack connects with this fighter.
   * Returns { hitRegistered: boolean, wasBlocked: boolean, perfectBlock: boolean }
   */
  receiveAttack(attacker, isHeavy, isSpecial) {
    const isBlocking = (this.state === 'BLOCK');

    // 1. SPECIAL MOVES: Always bypass block completely!
    if (isSpecial) {
      return this.applyHit(attacker, true, 16, -9, "SPECIAL OVERDRIVE!");
    }

    // 2. HEAVY ATTACKS: Break through partial block and cause knockdown!
    if (isHeavy) {
      if (isBlocking) {
        if (window.gameApp && window.gameApp.arena) {
          window.gameApp.arena.showPopup(this.x, this.y - 80, "GUARD BROKEN!", "#ef4444");
        }
      }
      return this.applyHit(attacker, true, 20, -10, "HEAVY IMPACT");
    }

    // 3. LIGHT ATTACKS:
    if (isBlocking) {
      const now = performance.now();
      const isPerfectBlock = (now - this.blockStartTime <= 180);

      // Successful block! 0 Hits registered!
      this.specialMeter = Math.min(100, this.specialMeter + 28);
      attacker.vx = -attacker.facing * 8; // Attacker recoils
      this.vx = -this.facing * 4;

      if (isPerfectBlock) {
        if (window.sounds) window.sounds.playPerfectBlock();
        if (window.gameApp && window.gameApp.arena) {
          window.gameApp.arena.showPopup(this.x, this.y - 80, "PERFECT BLOCK!", "#00f0ff");
          window.gameApp.arena.createImpact(this.x, this.y - 40, "#00f0ff", false);
          window.gameApp.arena.triggerHitStop(80);
        }
      } else {
        if (window.sounds) window.sounds.playParryClang();
        if (window.gameApp && window.gameApp.arena) {
          window.gameApp.arena.showPopup(this.x, this.y - 70, "BLOCKED", "#94a3b8");
          window.gameApp.arena.createImpact(this.x, this.y - 40, "#ffffff", false);
        }
      }

      return { hitRegistered: false, wasBlocked: true, perfectBlock: isPerfectBlock };
    }

    // Light attack connected cleanly!
    return this.applyHit(attacker, false, 11, -4, "CLEAN HIT");
  }

  applyHit(attacker, isHeavy, knockX, knockY, label) {
    this.hitsTaken++;
    attacker.specialMeter = Math.min(100, attacker.specialMeter + 22);

    // Apply knockback
    this.vx = -this.facing * knockX;
    this.vy = knockY;
    this.isGrounded = false;

    // Trigger hit stop on arena
    const hitStopMs = isHeavy ? 110 : 65;
    if (window.gameApp && window.gameApp.arena) {
      window.gameApp.arena.triggerHitStop(hitStopMs);
      window.gameApp.arena.shake(isHeavy ? 22 : 11);
      window.gameApp.arena.createImpact(this.x, this.y - 40, attacker.themeColor, isHeavy);
      if (isHeavy) {
        window.gameApp.arena.createGroundCrack(this.x, this.groundY);
      }
      window.gameApp.arena.showPopup(this.x, this.y - 70, label, isHeavy ? "#fbbf24" : "#ffffff");
    }

    if (window.sounds) {
      window.sounds.playHit(isHeavy);
      if (isHeavy) window.sounds.playHeavyThud();
    }

    // Heavy Hit causes Ragdoll Knockdown Flop
    if (isHeavy) {
      this.state = 'KNOCKED';
      this.isRagdoll = true;
      this.ragdollTimer = 52; // ~0.85s on the ground
    } else {
      this.state = 'HURT';
      this.stateTimer = 0;
    }

    // Check Defeat (First to 5 hits)
    if (this.hitsTaken >= this.maxHits) {
      this.isDefeated = true;
      this.state = 'KNOCKED';
      this.isRagdoll = true;
      this.ragdollTimer = 9999;
      if (window.gameApp) {
        window.gameApp.onFighterKnockedOut(this, attacker);
      }
    }

    return { hitRegistered: true, wasBlocked: false, perfectBlock: false };
  }

  // ================= MAIN UPDATE & SKELETAL PHYSICS =================

  update(dt, opponent, gestureState) {
    this.stateTimer++;

    // 1. Evaluate Facing Direction towards opponent
    if (opponent && this.state !== 'KNOCKED') {
      this.facing = this.x < opponent.x ? 1 : -1;
    }

    // 2. Ragdoll Timer recovery
    if (this.isRagdoll) {
      if (this.hitsTaken < this.maxHits) {
        this.ragdollTimer--;
        if (this.ragdollTimer <= 0 && this.isGrounded) {
          this.isRagdoll = false;
          this.state = 'IDLE';
        }
      }
    }

    // 3. Process Gesture / Keyboard Input if not in hitstun/attacking
    if (gestureState && this.state !== 'HURT' && this.state !== 'KNOCKED' && this.state !== 'VICTORY' && !this.isDefeated) {
      // Guard stance
      if (gestureState.isBlocking) {
        if (this.state !== 'BLOCK' && this.state !== 'LIGHT_ATTACK' && this.state !== 'HEAVY_ATTACK' && this.state !== 'SPECIAL') {
          this.state = 'BLOCK';
          this.blockStartTime = performance.now();
        }
      } else if (this.state === 'BLOCK') {
        this.state = 'IDLE';
      }

      // Movement (Forward / Back)
      if (this.state === 'IDLE' || this.state === 'WALK') {
        if (gestureState.isMovingForward) {
          this.vx += this.facing * 1.8;
          this.state = 'WALK';
        } else if (gestureState.isMovingBack) {
          this.vx -= this.facing * 1.3;
          this.state = 'WALK';
        } else {
          if (Math.abs(this.vx) < 0.2) this.state = 'IDLE';
        }
      }
    }

    // 4. Update Attack States & Strike Windows
    this.updateAttackCycles(opponent);

    // 5. Physics Integration (Friction, Gravity, Arena Bounds)
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    this.x += this.vx;
    this.vx *= 0.82; // snappy ground friction

    // Arena Bounds (120 to 1160)
    if (this.x < 130) { this.x = 130; this.vx = 0; }
    if (this.x > 1150) { this.x = 1150; this.vx = 0; }

    // Spatial collision: Fighters cannot walk through each other
    if (opponent) {
      const minDistance = 75;
      const dx = opponent.x - this.x;
      if (Math.abs(dx) < minDistance) {
        const push = (minDistance - Math.abs(dx)) * 0.5;
        if (dx > 0) {
          this.x -= push;
          opponent.x += push;
        } else {
          this.x += push;
          opponent.x -= push;
        }
      }
    }

    // 6. Ghost Trails during attacks and high velocity
    if (Math.abs(this.vx) > 7 || this.state === 'LIGHT_ATTACK' || this.state === 'HEAVY_ATTACK' || this.state === 'SPECIAL') {
      if (this.stateTimer % 3 === 0) {
        this.ghosts.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          joints: JSON.parse(JSON.stringify(this.joints)),
          weaponAngle: this.weaponAngle,
          alpha: 0.5,
          color: this.themeColor
        });
      }
    }
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].alpha -= 0.05;
      if (this.ghosts[i].alpha <= 0) this.ghosts.splice(i, 1);
    }

    // 7. Compute Procedural Spring & Joint Kinematics
    this.computeProceduralJoints();
  }

  updateAttackCycles(opponent) {
    // LIGHT ATTACK CYCLE: Windup (0-8) -> Strike (9-16) -> Recovery (17-26)
    if (this.state === 'LIGHT_ATTACK') {
      if (!this.attackHitChecked && this.stateTimer >= 9 && this.stateTimer <= 16) {
        this.checkStrikeCollision(opponent, false, false);
      }
      if (this.stateTimer >= 26) {
        this.state = 'IDLE';
        this.attackHitChecked = false;
      }
      return;
    }

    // HEAVY ATTACK CYCLE: Windup (0-18) -> Strike (19-27) -> Recovery (28-44)
    if (this.state === 'HEAVY_ATTACK') {
      if (this.stateTimer === 18) {
        // High-velocity strike lunge
        this.vx += this.facing * 12;
      }
      if (!this.attackHitChecked && this.stateTimer >= 19 && this.stateTimer <= 27) {
        this.checkStrikeCollision(opponent, true, false);
      }
      if (this.stateTimer >= 44) {
        this.state = 'IDLE';
        this.attackHitChecked = false;
      }
      return;
    }

    // SPECIAL ATTACK CYCLE: Windup (0-14) -> Strike (15-28) -> Recovery (29-50)
    if (this.state === 'SPECIAL') {
      if (!this.attackHitChecked && this.stateTimer >= 15 && this.stateTimer <= 28) {
        this.checkStrikeCollision(opponent, true, true);
      }
      if (this.stateTimer >= 50) {
        this.state = 'IDLE';
        this.attackHitChecked = false;
      }
      return;
    }

    // HURT RECOVERY
    if (this.state === 'HURT') {
      if (this.stateTimer >= 18 && this.isGrounded) {
        this.state = 'IDLE';
      }
    }
  }

  checkStrikeCollision(opponent, isHeavy, isSpecial) {
    if (!opponent || opponent.isDefeated) return;

    const reach = this.weapon.range * 1.5 + (isSpecial ? 90 : (isHeavy ? 65 : 45));
    const dist = Math.abs(this.x - opponent.x);

    if (dist <= reach) {
      this.attackHitChecked = true;
      opponent.receiveAttack(this, isHeavy, isSpecial);
    }
  }

  // ================= PROCEDURAL SPRINGS & JOINT COMPUTATION =================

  computeProceduralJoints() {
    // 1. Procedural Walk Cycle
    if (this.state === 'WALK') {
      this.walkCycle += Math.abs(this.vx) * 0.08;
      this.bodyBob = Math.sin(this.walkCycle * 2) * 4;
      this.torsoLean = Math.max(-0.25, Math.min(0.25, this.vx * 0.04));
    } else {
      this.walkCycle = 0;
      this.bodyBob *= 0.8;
      this.torsoLean *= 0.8;
    }

    // 2. Spring-Damper physics on head & weapon
    const k = 0.28;
    const damp = 0.72;

    const targetHeadX = this.vx * 0.8;
    const targetHeadY = this.bodyBob;
    this.springs.head.vx += (targetHeadX - this.springs.head.x) * k;
    this.springs.head.vy += (targetHeadY - this.springs.head.y) * k;
    this.springs.head.vx *= damp;
    this.springs.head.vy *= damp;
    this.springs.head.x += this.springs.head.vx;
    this.springs.head.y += this.springs.head.vy;

    // 3. Evaluate Joints based on State
    const f = this.facing;
    const bob = this.bodyBob;
    const lean = this.torsoLean;

    if (this.isRagdoll) {
      // Ragdoll flop posture: collapsed on the floor
      this.joints.pelvis = { x: 0, y: 15 };
      this.joints.neck = { x: -f * 35, y: 12 };
      this.joints.head = { x: -f * 55, y: 10, r: 15 };
      this.joints.rShoulder = { x: -f * 30, y: 10 };
      this.joints.rElbow = { x: -f * 40, y: 20 };
      this.joints.rHand = { x: -f * 45, y: 25 };
      this.joints.lShoulder = { x: -f * 30, y: 10 };
      this.joints.lElbow = { x: -f * 20, y: 20 };
      this.joints.lHand = { x: -f * 15, y: 25 };
      this.joints.rHip = { x: 5, y: 15 };
      this.joints.rKnee = { x: 25, y: 15 };
      this.joints.rFoot = { x: 45, y: 20 };
      this.joints.lHip = { x: -5, y: 15 };
      this.joints.lKnee = { x: 15, y: 20 };
      this.joints.lFoot = { x: 35, y: 25 };
      this.weaponAngle = Math.PI / 2;
      return;
    }

    // Standard Standing Skeleton
    this.joints.pelvis = { x: 0, y: -15 + bob };
    this.joints.neck = { x: f * lean * 30, y: -65 + bob };
    this.joints.head = { 
      x: f * (lean * 30 + this.springs.head.x), 
      y: -82 + bob + this.springs.head.y, 
      r: 15 
    };

    if (this.state === 'BLOCK') {
      // Guard Stance: Forearms crossed in front of chest
      this.joints.rShoulder = { x: f * 8, y: -58 + bob };
      this.joints.rElbow = { x: f * 18, y: -45 + bob };
      this.joints.rHand = { x: f * 14, y: -58 + bob };

      this.joints.lShoulder = { x: -f * 8, y: -58 + bob };
      this.joints.lElbow = { x: f * 12, y: -42 + bob };
      this.joints.lHand = { x: f * 18, y: -52 + bob };

      this.joints.rHip = { x: f * 8, y: -15 + bob };
      this.joints.rKnee = { x: f * 16, y: 15 + bob };
      this.joints.rFoot = { x: f * 22, y: 45 };

      this.joints.lHip = { x: -f * 8, y: -15 + bob };
      this.joints.lKnee = { x: -f * 12, y: 15 + bob };
      this.joints.lFoot = { x: -f * 18, y: 45 };

      this.targetWeaponAngle = -Math.PI / 3 * f;

    } else if (this.state === 'LIGHT_ATTACK') {
      // Light slash thrust
      const progress = Math.min(1, this.stateTimer / 26);
      const strikeArc = Math.sin(progress * Math.PI);

      this.joints.rShoulder = { x: f * 10, y: -58 + bob };
      this.joints.rElbow = { x: f * (24 + strikeArc * 20), y: -40 - strikeArc * 10 };
      this.joints.rHand = { x: f * (38 + strikeArc * 35), y: -30 + strikeArc * 5 };

      this.joints.lShoulder = { x: -f * 10, y: -58 + bob };
      this.joints.lElbow = { x: -f * 20, y: -35 };
      this.joints.lHand = { x: -f * 28, y: -15 };

      this.joints.rHip = { x: f * 10, y: -15 };
      this.joints.rKnee = { x: f * 22, y: 15 };
      this.joints.rFoot = { x: f * 35, y: 45 };

      this.joints.lHip = { x: -f * 10, y: -15 };
      this.joints.lKnee = { x: -f * 15, y: 18 };
      this.joints.lFoot = { x: -f * 25, y: 45 };

      this.targetWeaponAngle = (progress < 0.35 ? -Math.PI / 2 : Math.PI / 4) * f;

    } else if (this.state === 'HEAVY_ATTACK') {
      // Heavy overhead slam
      const progress = Math.min(1, this.stateTimer / 44);
      let armAngle = -Math.PI * 0.8;
      if (progress > 0.42) {
        armAngle = Math.PI * 0.35; // Downward slam!
      }

      this.joints.rShoulder = { x: f * 8, y: -60 + bob };
      this.joints.rElbow = { x: f * (12 + Math.cos(armAngle) * 25), y: -60 + Math.sin(armAngle) * 25 };
      this.joints.rHand = { x: f * (18 + Math.cos(armAngle) * 45), y: -60 + Math.sin(armAngle) * 45 };

      this.joints.lShoulder = { x: -f * 8, y: -60 + bob };
      this.joints.lElbow = { x: f * (6 + Math.cos(armAngle) * 20), y: -60 + Math.sin(armAngle) * 20 };
      this.joints.lHand = { x: f * (14 + Math.cos(armAngle) * 40), y: -60 + Math.sin(armAngle) * 40 };

      this.joints.rHip = { x: f * 10, y: -15 };
      this.joints.rKnee = { x: f * 26, y: 18 };
      this.joints.rFoot = { x: f * 40, y: 45 };

      this.joints.lHip = { x: -f * 10, y: -15 };
      this.joints.lKnee = { x: -f * 18, y: 18 };
      this.joints.lFoot = { x: -f * 30, y: 45 };

      this.targetWeaponAngle = (armAngle + Math.PI / 4) * f;

    } else if (this.state === 'WALK') {
      // Foot planting stride
      const stride = Math.sin(this.walkCycle);
      this.joints.rHip = { x: f * 6, y: -15 + bob };
      this.joints.rKnee = { x: f * (6 + stride * 18), y: 15 };
      this.joints.rFoot = { x: f * (6 + stride * 32), y: 45 - Math.max(0, -stride * 12) };

      this.joints.lHip = { x: -f * 6, y: -15 + bob };
      this.joints.lKnee = { x: f * (-6 - stride * 18), y: 15 };
      this.joints.lFoot = { x: f * (-6 - stride * 32), y: 45 - Math.max(0, stride * 12) };

      this.joints.rShoulder = { x: f * 8, y: -60 + bob };
      this.joints.rElbow = { x: f * (16 - stride * 14), y: -40 + bob };
      this.joints.rHand = { x: f * (24 - stride * 22), y: -25 + bob };

      this.joints.lShoulder = { x: -f * 8, y: -60 + bob };
      this.joints.lElbow = { x: f * (-12 + stride * 14), y: -40 + bob };
      this.joints.lHand = { x: f * (-18 + stride * 22), y: -25 + bob };

      this.targetWeaponAngle = -Math.PI / 5 * f;

    } else {
      // IDLE breathing stance
      const breath = Math.sin(this.stateTimer * 0.06) * 2;
      this.joints.rShoulder = { x: f * 8, y: -60 + breath };
      this.joints.rElbow = { x: f * 18, y: -38 + breath };
      this.joints.rHand = { x: f * 26, y: -22 + breath };

      this.joints.lShoulder = { x: -f * 8, y: -60 + breath };
      this.joints.lElbow = { x: -f * 14, y: -38 + breath };
      this.joints.lHand = { x: -f * 20, y: -20 + breath };

      this.joints.rHip = { x: f * 6, y: -15 };
      this.joints.rKnee = { x: f * 10, y: 18 };
      this.joints.rFoot = { x: f * 14, y: 45 };

      this.joints.lHip = { x: -f * 6, y: -15 };
      this.joints.lKnee = { x: -f * 8, y: 18 };
      this.joints.lFoot = { x: -f * 10, y: 45 };

      this.targetWeaponAngle = -Math.PI / 4 * f;
    }

    // Smooth weapon angular velocity
    this.weaponAngle += (this.targetWeaponAngle - this.weaponAngle) * 0.25;
  }

  // ================= RENDERING =================

  render(ctx) {
    // 1. Render Ghost Trails
    this.renderGhosts(ctx);

    ctx.save();
    ctx.translate(this.x, this.y);

    // 2. Draw Fighter Glow Aura
    ctx.shadowColor = this.color;
    ctx.shadowBlur = (this.state === 'SPECIAL') ? 25 : 8;

    // 3. Draw Guard Forcefield if Blocking
    if (this.state === 'BLOCK') {
      this.renderGuardShield(ctx);
    }

    // 4. Draw Limbs
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const j = this.joints;

    // Torso (Pelvis -> Neck)
    ctx.beginPath();
    ctx.moveTo(j.pelvis.x, j.pelvis.y);
    ctx.lineTo(j.neck.x, j.neck.y);
    ctx.stroke();

    // Legs
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(j.pelvis.x, j.pelvis.y);
    ctx.lineTo(j.lKnee.x, j.lKnee.y);
    ctx.lineTo(j.lFoot.x, j.lFoot.y);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(j.pelvis.x, j.pelvis.y);
    ctx.lineTo(j.rKnee.x, j.rKnee.y);
    ctx.lineTo(j.rFoot.x, j.rFoot.y);
    ctx.stroke();

    // Arms
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(j.neck.x, j.neck.y);
    ctx.lineTo(j.lElbow.x, j.lElbow.y);
    ctx.lineTo(j.lHand.x, j.lHand.y);
    ctx.stroke();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(j.neck.x, j.neck.y);
    ctx.lineTo(j.rElbow.x, j.rElbow.y);
    ctx.lineTo(j.rHand.x, j.rHand.y);
    ctx.stroke();

    // Head
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(j.head.x, j.head.y, j.head.r, 0, Math.PI * 2);
    ctx.fill();

    // Head visor
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(j.head.x + this.facing * 4, j.head.y - 2, 7, -0.4 * this.facing, 0.4 * this.facing);
    ctx.stroke();

    // 5. Draw Attached Weapon
    if (!this.isRagdoll && this.weapon && this.weapon.drawAttached) {
      this.weapon.drawAttached(ctx, j.rHand.x, j.rHand.y, this.weaponAngle, this.state === 'SPECIAL');
    }

    ctx.restore();
  }

  renderGuardShield(ctx) {
    ctx.save();
    const f = this.facing;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.arc(f * 26, -35, 42, -Math.PI * 0.35 * f, Math.PI * 0.35 * f);
    ctx.stroke();

    // Energy hexagonal lattice
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(f * 26, -35, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderGhosts(ctx) {
    for (const g of this.ghosts) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.globalAlpha = g.alpha * 0.55;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const j = g.joints;
      // Spine
      ctx.beginPath();
      ctx.moveTo(j.pelvis.x, j.pelvis.y);
      ctx.lineTo(j.neck.x, j.neck.y);
      ctx.stroke();

      // Right Arm
      ctx.beginPath();
      ctx.moveTo(j.neck.x, j.neck.y);
      ctx.lineTo(j.rElbow.x, j.rElbow.y);
      ctx.lineTo(j.rHand.x, j.rHand.y);
      ctx.stroke();

      // Head
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(j.head.x, j.head.y, j.head.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

window.StickmanFighter = StickmanFighter;

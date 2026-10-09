/**
 * IEEE Cyber Clash - Weapons Registry, Official VIT Pune Departments, and Sub-Variants
 */

// Official Academic Departments of Vishwakarma Institute of Technology (VIT), Pune
// Sourced directly from official vit.edu university catalog
const VIT_DEPARTMENTS = [
  { code: 'CE', name: 'Computer Engineering (CE)', icon: '💻', color: '#00B5E2' },
  { code: 'IT', name: 'Information Technology (IT)', icon: '🌐', color: '#38bdf8' },
  { code: 'ENTC', name: 'Electronics & Telecommunication (E&TC)', icon: '📡', color: '#818cf8' },
  { code: 'AIDS', name: 'AI & Data Science (AIDS)', icon: '🧠', color: '#c026d3' },
  { code: 'CSE-AI', name: 'CSE - Artificial Intelligence', icon: '🤖', color: '#ec4899' },
  { code: 'CSE-AIML', name: 'CSE - AI & Machine Learning', icon: '⚡', color: '#f43f5e' },
  { code: 'CSE-DS', name: 'CSE - Data Science', icon: '📊', color: '#a855f7' },
  { code: 'CSE-IOT', name: 'CSE - IoT & Cyber Security with Blockchain', icon: '🔐', color: '#06b6d4' },
  { code: 'CSE-SE', name: 'Computer Engg - Software Engineering', icon: '⚙️', color: '#3b82f6' },
  { code: 'ME', name: 'Mechanical Engineering (ME)', icon: '🏎️', color: '#f97316' },
  { code: 'CHEM', name: 'Chemical Engineering', icon: '🧪', color: '#10b981' },
  { code: 'CIVIL', name: 'Civil Engineering', icon: '🏗️', color: '#eab308' },
  { code: 'INST', name: 'Instrumentation Engineering', icon: '🎛️', color: '#14b8a6' },
  { code: 'DESH', name: 'Engineering, Science & Humanities (DESH)', icon: '🔬', color: '#6366f1' },
  { code: 'IEEE', name: 'IEEE SB VIT Pune Member', icon: '⭐', color: '#fbbf24' }
];

const WEAPONS_DATA = {
  plasma_katana: {
    id: 'plasma_katana',
    name: 'Plasma Katana',
    role: 'Cyber Energy Slicer',
    icon: '🗡️',
    speed: 92,
    damage: 78,
    range: 68,
    specialMove: 'Sonic Blade Dash',
    description: 'Forged in the IEEE SB VIT Pune Computer Society (CS) lab using ion plasma matrix algorithms. Rapid slashes and sonic dashes.',
    themeColor: '#00f0ff',
    trailColor: 'rgba(0, 240, 255, 0.6)',
    weaponType: 'blade',
    subVariants: [
      {
        id: 'katana_dual',
        name: 'Dual HF Edge',
        icon: '⚔️',
        bonus: '+15% Attack Speed & Crit',
        speedMult: 1.15,
        damageMult: 1.0,
        rangeBonus: 0,
        parryBonus: 0.05,
        critBonus: 0.15,
        desc: 'High-frequency dual vibration edges slice through nanotech armor with surgical precision.'
      },
      {
        id: 'katana_odachi',
        name: 'Odachi Greatblade',
        icon: '🗡️',
        bonus: '+25% Reach & Heavy Cleave',
        speedMult: 0.92,
        damageMult: 1.20,
        rangeBonus: 22,
        parryBonus: 0,
        critBonus: 0.05,
        desc: 'Extended cyber blade delivering devastating sweeping cleaves at longer tactical reach.'
      },
      {
        id: 'katana_wakizashi',
        name: 'Nanotech Wakizashi',
        icon: '⚡',
        bonus: '+25% Parry Counter Window',
        speedMult: 1.10,
        damageMult: 0.95,
        rangeBonus: -5,
        parryBonus: 0.25,
        critBonus: 0.10,
        desc: 'Compact defensive sidearm tailored for lightning parry deflections and quick counters.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Handle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, 20, 8, 30);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-5, 18, 10, 4);

      // Guard
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 18, 10, 0, Math.PI * 2);
      ctx.fill();

      // Blade Glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(-4, 18);
      ctx.lineTo(4, 18);
      ctx.lineTo(2, -70);
      ctx.lineTo(-2, -70);
      ctx.closePath();
      ctx.fill();

      // Inner white core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -66, 3, 80);

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false) {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(angle);

      // Handle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-3, 0, 6, 16);

      // Guard
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-7, -2, 14, 4);

      // Glow & Blade
      ctx.shadowColor = isSpecial ? '#ffffff' : '#00f0ff';
      ctx.shadowBlur = isSpecial ? 25 : 12;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(3, -2);
      ctx.lineTo(1.5, -60);
      ctx.lineTo(-1.5, -60);
      ctx.closePath();
      ctx.fill();

      // Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -56, 2, 54);

      ctx.restore();
    }
  },

  tesla_hammer: {
    id: 'tesla_hammer',
    name: 'Tesla Thunder Hammer',
    role: 'Electromagnetic Slammer',
    icon: '🔨',
    speed: 52,
    damage: 96,
    range: 58,
    specialMove: 'Giga-Volt Ground Slam',
    description: 'Constructed by IEEE Circuits & E&TC hardware division. Channels immense voltage into catastrophic ground-pounding shockwaves.',
    themeColor: '#fbbf24',
    trailColor: 'rgba(251, 191, 36, 0.6)',
    weaponType: 'heavy',
    subVariants: [
      {
        id: 'hammer_mjolnir',
        name: 'Mjolnir Shock-Coil',
        icon: '⚡',
        bonus: '+25% Shockwave Stun Radius',
        speedMult: 1.0,
        damageMult: 1.15,
        rangeBonus: 6,
        parryBonus: 0.05,
        critBonus: 0.10,
        desc: 'Overcharged capacitor coils discharge thunderous stun shockwaves on ground impact.'
      },
      {
        id: 'hammer_seismic',
        name: 'Seismic Kinetic Ram',
        icon: '💥',
        bonus: '+30% Heavy Impact Force',
        speedMult: 0.88,
        damageMult: 1.30,
        rangeBonus: 10,
        parryBonus: 0,
        critBonus: 0.15,
        desc: 'Crushing hydraulic kinetic head sends ground-shattering fissures across the arena.'
      },
      {
        id: 'hammer_piston',
        name: 'Rocket Piston Head',
        icon: '🚀',
        bonus: '+20% Swing Acceleration',
        speedMult: 1.18,
        damageMult: 1.05,
        rangeBonus: 0,
        parryBonus: 0,
        critBonus: 0.05,
        desc: 'Hydraulic booster thrusters accelerate heavy hammer swings to alarming velocity.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Shaft
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, -30, 8, 70);

      // Grip
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-5, 10, 10, 25);

      // Hammer Head
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-22, -55, 44, 28);

      // Energy Coils
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-20, -50, 6, 18);
      ctx.fillRect(14, -50, 6, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-10, -48, 20, 14);

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false) {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(angle);

      // Shaft
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-3, -25, 6, 50);

      // Head
      ctx.shadowColor = isSpecial ? '#ffffff' : '#facc15';
      ctx.shadowBlur = isSpecial ? 25 : 12;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -48, 36, 24);

      // Electric Plates
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-16, -44, 5, 16);
      ctx.fillRect(11, -44, 5, 16);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-8, -42, 16, 12);

      ctx.restore();
    }
  },

  quantum_railgun: {
    id: 'quantum_railgun',
    name: 'Quantum Railgun',
    role: 'Precision Laser Blaster',
    icon: '🔫',
    speed: 74,
    damage: 86,
    range: 96,
    specialMove: 'Hyper-Beam Annihilator',
    description: 'High-tech particle accelerator. Fires hyper-accelerated laser lances and penetrating quantum bursts.',
    themeColor: '#c026d3',
    trailColor: 'rgba(192, 38, 211, 0.6)',
    weaponType: 'ranged',
    subVariants: [
      {
        id: 'railgun_sniper',
        name: 'Hyper-Beam Lance',
        icon: '🎯',
        bonus: '+35% Piercing Beam DMG',
        speedMult: 0.90,
        damageMult: 1.35,
        rangeBonus: 30,
        parryBonus: 0,
        critBonus: 0.20,
        desc: 'Focuses quantum photons into an inescapable armor-piercing long lance.'
      },
      {
        id: 'railgun_burst',
        name: 'Dual Chrono-Burst',
        icon: '⚡',
        bonus: 'Rapid 2-Round Salvo',
        speedMult: 1.25,
        damageMult: 1.05,
        rangeBonus: 10,
        parryBonus: 0,
        critBonus: 0.10,
        desc: 'Accelerates dual particle salvos in rapid succession with minimal recoil.'
      },
      {
        id: 'railgun_scatter',
        name: 'Vortex Scatter Cones',
        icon: '💥',
        bonus: 'Close-Range Blast Cone',
        speedMult: 1.10,
        damageMult: 1.20,
        rangeBonus: -15,
        parryBonus: 0.10,
        critBonus: 0.15,
        desc: 'Releases a wide-spread electromagnetic shockwave to repel close rushing opponents.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Stock & Handle
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-6, 0, 12, 35);

      // Chassis
      ctx.shadowColor = '#c026d3';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-8, -45, 16, 50);

      // Dual Rails
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(-10, -70, 5, 35);
      ctx.fillRect(5, -70, 5, 35);

      // Energy Core
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, -25, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false) {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(angle);

      // Body
      ctx.shadowColor = isSpecial ? '#ffffff' : '#c026d3';
      ctx.shadowBlur = isSpecial ? 20 : 10;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-5, -5, 10, 22);

      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-6, -38, 12, 38);

      // Rails
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(-7, -56, 4, 25);
      ctx.fillRect(3, -56, 4, 25);

      // Muzzle glow
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-2, -58, 4, 6);

      ctx.restore();
    }
  },

  dual_daggers: {
    id: 'dual_daggers',
    name: 'Dual Cyber Daggers',
    role: 'Acrobatic Sonic Blades',
    icon: '⚔️',
    speed: 98,
    damage: 66,
    range: 48,
    specialMove: 'Vortex Cyclone Spin',
    description: 'Twin high-frequency energy daggers. Allows rapid multi-hit flurries, backflips, and sonic slice spirals.',
    themeColor: '#10b981',
    trailColor: 'rgba(16, 185, 129, 0.6)',
    weaponType: 'dual',
    subVariants: [
      {
        id: 'daggers_phase',
        name: 'Phantom Phase Edges',
        icon: '🔮',
        bonus: '+25% Teleport Dash & Crit',
        speedMult: 1.25,
        damageMult: 1.0,
        rangeBonus: 6,
        parryBonus: 0.10,
        critBonus: 0.20,
        desc: 'Phase-shifts behind targets during combo rushes for surprise rear strikes.'
      },
      {
        id: 'daggers_cryo',
        name: 'Glacial Frost Claws',
        icon: '❄️',
        bonus: '+Slow & Freeze Hit-Stun',
        speedMult: 1.10,
        damageMult: 1.10,
        rangeBonus: 0,
        parryBonus: 0.15,
        critBonus: 0.10,
        desc: 'Inflicts sub-zero frostbite that freezes opponent recovery and movement frames.'
      },
      {
        id: 'daggers_cyclone',
        name: 'Sonic Cyclone Blades',
        icon: '🌪️',
        bonus: '+35% Multi-Hit Spin Rate',
        speedMult: 1.30,
        damageMult: 0.95,
        rangeBonus: -4,
        parryBonus: 0,
        critBonus: 0.15,
        desc: 'Acrobatic aerial rotation unleashing devastating multi-hit hurricanes.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Dagger 1
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(-15, 10);
      ctx.lineTo(-5, -45);
      ctx.lineTo(-12, -45);
      ctx.closePath();
      ctx.fill();

      // Dagger 2
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(15, 10);
      ctx.lineTo(5, -45);
      ctx.lineTo(12, -45);
      ctx.closePath();
      ctx.fill();

      // Grips
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, 10, 6, 18);
      ctx.fillRect(10, 10, 6, 18);

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false, isOffhand = false) {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(angle + (isOffhand ? 0.3 : 0));

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, 0, 4, 12);

      ctx.shadowColor = isSpecial ? '#ffffff' : '#10b981';
      ctx.shadowBlur = isSpecial ? 20 : 10;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(0.5, -34);
      ctx.lineTo(-0.5, -34);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  },

  emp_gauntlets: {
    id: 'emp_gauntlets',
    name: 'IEEE EMP Gauntlets',
    role: 'Cybernetic Impact Fists',
    icon: '🥊',
    speed: 82,
    damage: 88,
    range: 52,
    specialMove: 'Overclocked Shockwave Uppercut',
    description: 'Engineered by IEEE SB VIT Pune Robotics & Automation Society (RAS). Channels high-voltage capacitor surges into devastating kinetic shockwaves.',
    themeColor: '#00B5E2',
    trailColor: 'rgba(0, 181, 226, 0.6)',
    weaponType: 'fist',
    subVariants: [
      {
        id: 'gauntlets_piston',
        name: 'Hydraulic Piston Fists',
        icon: '🥊',
        bonus: '+30% Heavy Wall-Slam Knockdown',
        speedMult: 0.95,
        damageMult: 1.25,
        rangeBonus: 6,
        parryBonus: 0.10,
        critBonus: 0.15,
        desc: 'Piston-driven knuckles generate explosive kinetic concussive impacts that wallop targets.'
      },
      {
        id: 'gauntlets_arc',
        name: 'Arc Surge Knuckles',
        icon: '⚡',
        bonus: '+50kV Electric Arc Combos',
        speedMult: 1.20,
        damageMult: 1.10,
        rangeBonus: 0,
        parryBonus: 0.05,
        critBonus: 0.20,
        desc: 'Discharges 50,000-volt arcs connecting rapid jab combinations in blinding bursts.'
      },
      {
        id: 'gauntlets_thruster',
        name: 'Rocket Superman Core',
        icon: '🚀',
        bonus: 'Flying Gap-Closer Dash',
        speedMult: 1.15,
        damageMult: 1.15,
        rangeBonus: 16,
        parryBonus: 0.05,
        critBonus: 0.10,
        desc: 'Nano-boosted thrusters power high-velocity flying superman punches across the arena.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-20, -25, 40, 50);

      // IEEE Circuit Decals
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-18, -23, 36, 46);

      // Knuckle Core
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-14, -18, 28, 12);

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false) {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(angle);

      ctx.shadowColor = isSpecial ? '#ffffff' : '#00f0ff';
      ctx.shadowBlur = isSpecial ? 22 : 12;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  aegis_shield_spear: {
    id: 'aegis_shield_spear',
    name: 'Aegis Shield & Glaive',
    role: 'Kinetic Fortress & Spear',
    icon: '🛡️',
    speed: 64,
    damage: 84,
    range: 78,
    specialMove: 'Titan Aegis Bastion Slam',
    description: 'Impenetrable force-field buckler paired with an elongated plasma polearm. Balances ironclad defense with lethal reach.',
    themeColor: '#f97316',
    trailColor: 'rgba(249, 115, 22, 0.6)',
    weaponType: 'polearm_shield',
    subVariants: [
      {
        id: 'aegis_phalanx',
        name: 'Titan Phalanx Tower',
        icon: '🛡️',
        bonus: '+40% Shield Defense & Ram',
        speedMult: 0.90,
        damageMult: 1.10,
        rangeBonus: 6,
        parryBonus: 0.30,
        critBonus: 0.05,
        desc: 'Reinforced ballistic bulwark with impenetrable defensive stance and brutal shield charges.'
      },
      {
        id: 'aegis_reflector',
        name: 'Laser Beam Deflector',
        icon: '✨',
        bonus: 'Reflects Energy Projectiles',
        speedMult: 1.05,
        damageMult: 1.15,
        rangeBonus: 10,
        parryBonus: 0.25,
        critBonus: 0.10,
        desc: 'Mirror-finish force barrier that absorbs, parries, and deflects ranged projectiles.'
      },
      {
        id: 'aegis_halberd',
        name: 'Spartan Halberd Blade',
        icon: '🔱',
        bonus: '+30% Sweeping Reach Cleaves',
        speedMult: 1.10,
        damageMult: 1.25,
        rangeBonus: 26,
        parryBonus: 0.10,
        critBonus: 0.15,
        desc: 'Elongated polearm with curved razor crescent for sweeping crowd control cleaves.'
      }
    ],
    drawPreview: function(ctx, x, y, scale = 1, angle = -Math.PI / 4) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Shield
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(26, -20);
      ctx.lineTo(20, 20);
      ctx.lineTo(0, 35);
      ctx.lineTo(-20, 20);
      ctx.lineTo(-26, -20);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Spear across
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-2, -60, 4, 120);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-6, -60);
      ctx.lineTo(6, -60);
      ctx.lineTo(0, -80);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
    drawAttached: function(ctx, handX, handY, angle, isSpecial = false, isShield = false) {
      ctx.save();
      ctx.translate(handX, handY);
      if (isShield) {
        // Draw shield on offhand
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = isSpecial ? 24 : 10;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(14, -10);
        ctx.lineTo(10, 12);
        ctx.lineTo(0, 20);
        ctx.lineTo(-10, 12);
        ctx.lineTo(-14, -10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Draw spear on main hand
        ctx.rotate(angle);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-2, -20, 4, 80);

        ctx.shadowColor = isSpecial ? '#ffffff' : '#f97316';
        ctx.shadowBlur = isSpecial ? 22 : 12;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-5, -20);
        ctx.lineTo(5, -20);
        ctx.lineTo(0, -55);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
};

const ENERGY_MODS = {
  ion_overclock: {
    id: 'ion_overclock',
    name: 'Overclocked Ion',
    element: 'Electric Blue',
    icon: '⚡',
    color: '#00f0ff',
    bonusText: '+15% Attack Speed',
    speedMult: 1.15,
    damageMult: 1.0,
    desc: 'Supercharges weapon conductors with high-frequency ion pulses for lightning-quick windups.'
  },
  plasma_thermal: {
    id: 'plasma_thermal',
    name: 'Superheated Plasma',
    element: 'Solar Gold',
    icon: '🔥',
    color: '#fbbf24',
    bonusText: '+20% Impact Damage',
    speedMult: 0.95,
    damageMult: 1.20,
    desc: 'Thermal plasma coils supercharge weapon hits with massive explosive impact force.'
  },
  void_quantum: {
    id: 'void_quantum',
    name: 'Void Quantum Flux',
    element: 'Cosmic Violet',
    icon: '🔮',
    color: '#c026d3',
    bonusText: '+25% Critical Hit Chance',
    speedMult: 1.05,
    damageMult: 1.10,
    desc: 'Infuses attacks with quantum phase shifting to bypass shields and land critical blows.'
  },
  cryo_conductor: {
    id: 'cryo_conductor',
    name: 'Cryo-Superconductor',
    element: 'Glacial Cyan',
    icon: '❄️',
    color: '#38bdf8',
    bonusText: '+High Stagger & Stun',
    speedMult: 1.0,
    damageMult: 1.05,
    desc: 'Zero-Kelvin cooling field creates extended hit-stun and shivering frost shockwaves.'
  }
};

const COMBAT_STANCES = {
  assault: {
    id: 'assault',
    name: 'Hyper Assault',
    role: 'Aggressive Rushdown',
    icon: '⚔️',
    desc: 'Relentless forward momentum with rapid chain combos and close-quarter pressure.'
  },
  bastion: {
    id: 'bastion',
    name: 'Titan Bastion',
    role: 'Defensive Counter',
    icon: '🛡️',
    desc: 'High parry rate and kinetic posture. Absorbs blows and retaliates with devastating counter strikes.'
  },
  sonic_flow: {
    id: 'sonic_flow',
    name: 'Sonic Acrobatics',
    role: 'Evasive Mobility',
    icon: '🌪️',
    desc: 'Fluid movement with dynamic backflips, airborne somersaults, and unpredictable attack angles.'
  },
  overdrive: {
    id: 'overdrive',
    name: 'IEEE Overdrive',
    role: 'Special Move Focus',
    icon: '⚡',
    desc: 'Charges the Hype Gauge at double speed to unleash cinematic super moves more frequently.'
  }
};

const TECH_GADGETS = {
  emp_pulse: {
    id: 'emp_pulse',
    name: 'EMP Stun Burst',
    icon: '📡',
    desc: 'Releases electromagnetic bursts that temporarily stagger and freeze the opponent.'
  },
  kinetic_barrier: {
    id: 'kinetic_barrier',
    name: 'Kinetic Deflector',
    icon: '🛡️',
    desc: 'Creates a magnetic barrier that dampens incoming damage and deflects projectile lasers.'
  },
  nano_thrusters: {
    id: 'nano_thrusters',
    name: 'Nano Rocket Boots',
    icon: '🚀',
    desc: 'Provides instant aerial recovery and high-speed jump dashes.'
  },
  surge_capacitor: {
    id: 'surge_capacitor',
    name: 'Surge Capacitor',
    icon: '🔋',
    desc: 'Converts opponent hits into immediate Hype power for rapid counter-attacks.'
  }
};

window.VIT_DEPARTMENTS = VIT_DEPARTMENTS;
window.WEAPONS_DATA = WEAPONS_DATA;
window.ENERGY_MODS = ENERGY_MODS;
window.COMBAT_STANCES = COMBAT_STANCES;
window.TECH_GADGETS = TECH_GADGETS;

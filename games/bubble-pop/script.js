/**
 * BUBBLE POP ARCADE - COMPLETE ENGINE
 * High-performance HTML5 Canvas physics, procedural Web Audio synthesizer,
 * multi-tier bubble types, power-ups, particle bursts, and combo state machine.
 */

// ==========================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================================
class BubbleAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return !this.muted;
  }

  // Classic juicy bubble pop sound (FM synthesis pop)
  playPop(pitchMod = 1.0) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 480 * pitchMod;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.4, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.09);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Golden / Rainbow bubble special pop chime
  playGoldPop() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [659.25, 880, 1174.66]; // E5, A5, D6
      notes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.25, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.15);
      });
    } catch (e) {}
  }

  // Mega Pop AOE Explosion Boom
  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) {}
  }

  // Power-Up Activation Fanfare
  playPowerUp() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.3, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch (e) {}
  }

  // Combo Chime
  playComboChime(multiplier) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 523.25 * (1 + Math.min(multiplier * 0.1, 0.8));
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Game Start & Over
  playGameStart() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 554, 659].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.16);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 370, 311, 247].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);
        gain.gain.setValueAtTime(0.22, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.22);
      });
    } catch (e) {}
  }
}

// ==========================================================
// 2. BUBBLE DEFINITIONS & TYPES
// ==========================================================
const STANDARD_BUBBLE_PALETTES = [
  { name: 'cyan', base: '#00f2fe', edge: '#0077b6', points: 10 },
  { name: 'pink', base: '#ff007f', edge: '#b5179e', points: 10 },
  { name: 'green', base: '#00e676', edge: '#008b44', points: 15 },
  { name: 'purple', base: '#9d4edd', edge: '#5a189a', points: 15 },
  { name: 'orange', base: '#ff922b', edge: '#d9480f', points: 20 },
  { name: 'blue', base: '#4facfe', edge: '#0052cc', points: 10 }
];

const POWERUP_TYPES = [
  { type: 'slow', name: 'Slow-Mo', icon: '⏱️', duration: 6000, desc: 'Bubbles slowed by 50%!' },
  { type: 'booster', name: '2x Score Booster', icon: '⭐', duration: 7000, desc: 'Double Points active!' },
  { type: 'mega', name: 'Mega Pop', icon: '💥', duration: 0, desc: 'Chain Reaction AOE Blast!' },
  { type: 'time', name: '+8 Seconds', icon: '⏳', duration: 0, desc: '+8s Added to clock!' }
];

// ==========================================================
// 3. BUBBLE ENTITY CLASS
// ==========================================================
class Bubble {
  constructor(canvasWidth, canvasHeight, currentDifficulty = 1.0, forcedPalette = null) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Roll Bubble Kind (Normal, Gold, Rainbow, or PowerUp)
    const roll = Math.random();
    if (roll < 0.08) {
      // Golden Bubble (8% chance)
      this.kind = 'gold';
      this.radius = 28 + Math.random() * 8;
      this.points = 50;
      this.color = '#ffb800';
    } else if (roll < 0.12) {
      // Rainbow Bubble (4% chance)
      this.kind = 'rainbow';
      this.radius = 34 + Math.random() * 8;
      this.points = 100;
      this.color = '#ff007f';
    } else if (roll < 0.19) {
      // Power-Up Bubble (7% chance)
      this.kind = 'powerup';
      const power = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.powerup = power;
      this.radius = 32;
      this.points = 30;
      this.color = '#00f2fe';
    } else {
      // Standard Bubble (81% chance)
      this.kind = 'normal';
      const palette = forcedPalette || STANDARD_BUBBLE_PALETTES[Math.floor(Math.random() * STANDARD_BUBBLE_PALETTES.length)];
      this.palette = palette;
      this.radius = 26 + Math.random() * 18; // Varied sizes (smaller = faster)
      this.points = palette.points;
      this.color = palette.base;
    }

    // Position & Float Physics
    const margin = this.radius + 10;
    this.x = margin + Math.random() * (canvasWidth - margin * 2);
    this.y = canvasHeight + this.radius + 15;

    // Rising Velocity & Horizontal Drift
    const baseSpeed = 1.4 + Math.random() * 1.8;
    this.vy = -baseSpeed * currentDifficulty;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.driftWobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.03 + Math.random() * 0.03;

    // 3D Bubble Sheen & Reflection Angle
    this.sheenAngle = Math.random() * Math.PI;

    this.popped = false;
  }

  update(speedModifier = 1.0) {
    this.driftWobble += this.wobbleSpeed;
    this.x += (this.vx + Math.sin(this.driftWobble) * 0.8) * speedModifier;
    this.y += this.vy * speedModifier;

    // Despawn when floated off screen
    if (this.y < -this.radius - 20) {
      return false;
    }
    return true;
  }

  draw(ctx) {
    const r = this.radius;

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Soft glowing outer shadow
    ctx.save();
    ctx.shadowBlur = 12;
    if (this.kind === 'gold') {
      ctx.shadowColor = '#ffb800';
    } else if (this.kind === 'rainbow') {
      ctx.shadowColor = '#00f2fe';
    } else if (this.kind === 'powerup') {
      ctx.shadowColor = '#ff007f';
    } else {
      ctx.shadowColor = this.color;
    }

    // 2. Outer translucent sphere
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);

    let grad;
    if (this.kind === 'gold') {
      grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.3, 'rgba(255, 215, 0, 0.7)');
      grad.addColorStop(0.8, 'rgba(212, 140, 0, 0.5)');
      grad.addColorStop(1, 'rgba(180, 100, 0, 0.85)');
    } else if (this.kind === 'rainbow') {
      grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, 'rgba(255, 0, 127, 0.75)');
      grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.75)');
      grad.addColorStop(1, 'rgba(255, 230, 0, 0.75)');
    } else if (this.kind === 'powerup') {
      grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.7)');
      grad.addColorStop(1, 'rgba(157, 78, 221, 0.85)');
    } else {
      grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.4, this.color + 'aa');
      grad.addColorStop(0.85, this.palette.edge + '55');
      grad.addColorStop(1, this.palette.edge + 'bb');
    }

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // 3. Glossy 3D Highlight Curvature (Realistic soap bubble reflection)
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    // Subtle bottom counter-reflection
    ctx.beginPath();
    ctx.arc(r * 0.3, r * 0.3, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // 4. Power-Up or Special Icon In Center
    if (this.kind === 'powerup') {
      ctx.font = `${r * 0.8}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.powerup.icon, 0, 2);
    } else if (this.kind === 'gold') {
      ctx.font = `bold ${r * 0.7}px "Outfit", sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
    } else if (this.kind === 'rainbow') {
      ctx.font = `bold ${r * 0.75}px "Outfit", sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', 0, 1);
    }

    ctx.restore();
  }
}

// ==========================================================
// 4. POP PARTICLE SYSTEM & FLOATING SCORES
// ==========================================================
class PopParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2 + Math.random() * 4;
    this.life = 1.0;
    this.decay = 0.025 + Math.random() * 0.035;
    this.gravity = 0.18;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingScore {
  constructor(x, y, text, color = '#ffd43b') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.vy = -2.2;
  }

  update() {
    this.y += this.vy;
    this.life -= 0.03;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 22px "Fredoka One", cursive, sans-serif';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#050a14';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class ShockwaveRing {
  constructor(x, y, color = '#00f2fe') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 10;
    this.maxRadius = 140;
    this.life = 1.0;
    this.decay = 0.04;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.22;
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 6 * this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ==========================================================
// 5. MAIN GAME ENGINE CONTROLLER
// ==========================================================
class BubblePopGame {
  constructor() {
    this.canvas = document.getElementById('bubble-canvas');
    this.ctx = this.canvas.getContext('2d');

    // UI Elements
    this.scoreDisplay = document.getElementById('score-display');
    this.timerDisplay = document.getElementById('timer-display');
    this.timerContainer = document.getElementById('timer-container');
    this.timerLabel = document.getElementById('timer-label');
    this.objectiveContainer = document.getElementById('objective-container');
    this.objectiveDisplay = document.getElementById('objective-display');
    this.comboPill = document.getElementById('combo-pill');
    this.comboDisplay = document.getElementById('combo-display');
    this.comboBanner = document.getElementById('combo-banner');
    this.comboTextVal = document.getElementById('combo-text-val');
    this.comboSubVal = document.getElementById('combo-sub-val');
    this.hudToast = document.getElementById('hud-toast');

    // Power-Up Bar
    this.powerupBar = document.getElementById('powerup-bar');
    this.powerupIcon = document.getElementById('powerup-icon');
    this.powerupName = document.getElementById('powerup-name');
    this.powerupTimerFill = document.getElementById('powerup-timer-fill');

    // Overlays
    this.overlayStart = document.getElementById('overlay-start');
    this.overlayPause = document.getElementById('overlay-pause');
    this.overlayGameOver = document.getElementById('overlay-gameover');
    this.modeInfo = document.getElementById('mode-info');
    this.modeTabs = document.querySelectorAll('.mode-tab');

    // Summary Elements
    this.pauseScoreVal = document.getElementById('pause-score-val');
    this.pauseTimeVal = document.getElementById('pause-time-val');
    this.finalScoreVal = document.getElementById('final-score-val');
    this.gameoverTitle = document.getElementById('gameover-title');
    this.gameoverReason = document.getElementById('gameover-reason');
    this.gameoverEmoji = document.getElementById('gameover-emoji');
    this.statPoppedTotal = document.getElementById('stat-popped-total');
    this.statMaxStreak = document.getElementById('stat-max-streak');
    this.statHighRecord = document.getElementById('stat-high-record');
    this.newHighTag = document.getElementById('new-high-tag');

    // Buttons
    this.btnStart = document.getElementById('btn-start-game');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume-game');
    this.btnRestart = document.getElementById('btn-restart-game');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnChangeMode = document.getElementById('btn-change-mode');
    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');

    // Audio Engine
    this.audio = new BubbleAudio();

    // Game State Variables
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.gameMode = 'classic'; // 'classic', 'endless', 'challenge'
    this.score = 0;
    this.timeLeft = 60;
    this.timerInterval = null;
    this.difficulty = 1.0;

    // Challenge Mode Objectives
    this.targetColor = 'pink';
    this.challengeTargetCount = 20;
    this.challengeCurrentCount = 0;

    // Statistics & High Scores
    this.poppedCount = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.streakResetTimeout = null;
    this.highScores = {
      classic: parseInt(localStorage.getItem('bubblepop_high_classic') || '0', 10),
      endless: parseInt(localStorage.getItem('bubblepop_high_endless') || '0', 10),
      challenge: parseInt(localStorage.getItem('bubblepop_high_challenge') || '0', 10)
    };

    // Active Power-Up State
    this.activePowerUp = null;
    this.powerUpEndTime = 0;
    this.scoreMultiplier = 1.0;
    this.speedModifier = 1.0;

    // Entity Lists
    this.bubbles = [];
    this.particles = [];
    this.floatingScores = [];
    this.shockwaves = [];

    // Spawning Timing
    this.spawnTimer = 0;
    this.spawnInterval = 38;

    // Binds
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    this.setupListeners();
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  setupListeners() {
    // Mode Selection Tabs
    const modeDescriptions = {
      classic: '<strong>Classic Mode:</strong> Pop as many bubbles as you can before the 60-second timer expires. Watch for Golden & Rainbow bubbles!',
      endless: '<strong>Endless Mode:</strong> Play at your own pace with continuous rising bubbles and progressively increasing speed!',
      challenge: '<strong>Challenge Mode:</strong> Objective: Pop 20 Pink Neon bubbles before the 45s timer expires!'
    };

    this.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.gameMode = tab.getAttribute('data-mode');
        this.modeInfo.innerHTML = modeDescriptions[this.gameMode];
      });
    });

    // Start / Restart / Resume
    this.btnStart.addEventListener('click', () => {
      this.audio.init();
      this.audio.playGameStart();
      this.startGame();
    });

    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnRestart.addEventListener('click', () => this.startGame());
    this.btnPlayAgain.addEventListener('click', () => this.startGame());

    this.btnChangeMode.addEventListener('click', () => {
      this.overlayGameOver.classList.add('hidden');
      this.overlayStart.classList.remove('hidden');
      this.state = 'START';
    });

    this.btnSound.addEventListener('click', () => {
      this.audio.init();
      const on = this.audio.toggleMute();
      this.soundIcon.textContent = on ? '🔊' : '🔇';
      this.showToast(on ? 'Sound On' : 'Sound Muted');
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
      }
    });

    // CLICK & TOUCH POPPING LOGIC WITH ACCIDENTAL SCROLL SUPPRESSION
    const handlePopInput = (clientX, clientY) => {
      if (this.state !== 'PLAYING') return;
      this.audio.init();

      const rect = this.canvas.getBoundingClientRect();
      const tapX = clientX - rect.left;
      const tapY = clientY - rect.top;

      let hit = false;
      // Search top-most bubbles first (reverse order)
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (b.popped) continue;

        const dist = Math.hypot(b.x - tapX, b.y - tapY);
        if (dist <= b.radius * 1.15) { // Generous, responsive touch radius
          b.popped = true;
          this.popBubble(b, i);
          hit = true;
          break; // Pop one bubble per tap/click to avoid double scoring
        }
      }

      if (!hit) {
        // Tapped empty space -> break combo streak
        this.resetStreak();
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      handlePopInput(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault(); // Prevent accidental mobile scroll
      const t = e.touches[0];
      handlePopInput(t.clientX, t.clientY);
    }, { passive: false });
  }

  startGame() {
    this.overlayStart.classList.add('hidden');
    this.overlayPause.classList.add('hidden');
    this.overlayGameOver.classList.add('hidden');

    this.score = 0;
    this.poppedCount = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.difficulty = 1.0;
    this.scoreMultiplier = 1.0;
    this.speedModifier = 1.0;
    this.activePowerUp = null;

    this.bubbles = [];
    this.particles = [];
    this.floatingScores = [];
    this.shockwaves = [];
    this.powerupBar.classList.add('hidden');
    this.comboPill.classList.add('hidden');

    if (this.gameMode === 'classic') {
      this.timeLeft = 60;
      this.timerLabel.textContent = 'TIME';
      this.timerContainer.classList.remove('hidden');
      this.objectiveContainer.classList.add('hidden');
    } else if (this.gameMode === 'endless') {
      this.timeLeft = 0;
      this.timerLabel.textContent = 'SURVIVE';
      this.timerContainer.classList.remove('hidden');
      this.objectiveContainer.classList.add('hidden');
    } else if (this.gameMode === 'challenge') {
      this.timeLeft = 45;
      this.targetColor = 'pink';
      this.challengeTargetCount = 20;
      this.challengeCurrentCount = 0;
      this.timerLabel.textContent = 'TIME';
      this.timerContainer.classList.remove('hidden');
      this.objectiveContainer.classList.remove('hidden');
      this.updateObjectiveUI();
    }

    this.updateScoreUI();
    this.updateTimerUI();

    this.state = 'PLAYING';

    // Timer Interval
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;

      if (this.gameMode === 'classic' || this.gameMode === 'challenge') {
        this.timeLeft--;
        this.updateTimerUI();
        if (this.timeLeft <= 0) {
          if (this.gameMode === 'challenge' && this.challengeCurrentCount < this.challengeTargetCount) {
            this.triggerGameOver('Time Expired! Objective incomplete.', false);
          } else {
            this.triggerGameOver("Time's Up! Spectacular run!", true);
          }
        }
      } else if (this.gameMode === 'endless') {
        this.timeLeft++;
        this.updateTimerUI();
        // Difficulty smoothly climbs over time
        this.difficulty = Math.min(3.5, 1.0 + (this.timeLeft / 45) * 0.4);
      }
    }, 1000);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseScoreVal.textContent = this.score;
      this.pauseTimeVal.textContent = this.gameMode.toUpperCase();
      this.overlayPause.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.overlayPause.classList.add('hidden');
    }
  }

  popBubble(bubble, index) {
    this.bubbles.splice(index, 1);
    this.poppedCount++;
    this.currentStreak++;
    if (this.currentStreak > this.maxStreak) {
      this.maxStreak = this.currentStreak;
    }

    // Refresh streak timer
    clearTimeout(this.streakResetTimeout);
    this.streakResetTimeout = setTimeout(() => this.resetStreak(), 2200);

    // Audio & Feedback
    const pitch = 0.9 + Math.min(this.currentStreak * 0.08, 1.6);
    if (bubble.kind === 'gold' || bubble.kind === 'rainbow') {
      this.audio.playGoldPop();
    } else {
      this.audio.playPop(pitch);
    }

    // Spawn Juicy Bubble Pop Particles
    const particleCount = bubble.kind === 'rainbow' ? 24 : 14;
    for (let p = 0; p < particleCount; p++) {
      this.particles.push(new PopParticle(bubble.x, bubble.y, bubble.color));
    }

    // Compute Base & Combo Multiplied Score
    const comboMultiplier = this.currentStreak >= 3 ? Math.min(4, Math.floor(this.currentStreak / 2)) : 1;
    const earnedPoints = Math.round(bubble.points * this.scoreMultiplier * comboMultiplier);
    this.score += earnedPoints;
    this.updateScoreUI();

    // Floating Score Indicators
    const label = comboMultiplier > 1 ? `+${earnedPoints} (${comboMultiplier}x)` : `+${earnedPoints}`;
    const scoreColor = bubble.kind === 'gold' ? '#ffb800' : (comboMultiplier > 1 ? '#ff007f' : '#ffffff');
    this.floatingScores.push(new FloatingScore(bubble.x, bubble.y - 12, label, scoreColor));

    // Combo Milestone Banner
    if (this.currentStreak >= 3) {
      this.comboPill.classList.remove('hidden');
      this.comboDisplay.textContent = `x${comboMultiplier}`;
      if (this.currentStreak % 5 === 0) {
        this.showComboBanner(this.currentStreak, earnedPoints * 2);
        this.audio.playComboChime(comboMultiplier);
      }
    }

    // Handle Challenge Mode Progress
    if (this.gameMode === 'challenge' && bubble.kind === 'normal' && bubble.palette.name === this.targetColor) {
      this.challengeCurrentCount++;
      this.updateObjectiveUI();
      if (this.challengeCurrentCount >= this.challengeTargetCount) {
        this.triggerGameOver('CHALLENGE ACCOMPLISHED! ⭐', true);
        return;
      }
    }

    // Power-Up Handler
    if (bubble.kind === 'powerup') {
      this.activatePowerUp(bubble.powerup, bubble.x, bubble.y);
    }
  }

  activatePowerUp(power, x, y) {
    this.audio.playPowerUp();
    this.showToast(`${power.icon} ${power.name}: ${power.desc}`);

    if (power.type === 'mega') {
      // Mega Pop: AOE Blast popping all nearby bubbles
      this.audio.playExplosion();
      this.shockwaves.push(new ShockwaveRing(x, y, '#ff007f'));

      const aoeRadius = 180;
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (Math.hypot(b.x - x, b.y - y) <= aoeRadius) {
          b.popped = true;
          this.popBubble(b, i);
        }
      }
    } else if (power.type === 'time') {
      // Time Bonus
      this.timeLeft += 8;
      this.updateTimerUI();
      this.floatingScores.push(new FloatingScore(x, y - 20, '+8 SECONDS!', '#00f2fe'));
    } else {
      // Timed Power-Up (Slow-Mo or Score Booster)
      this.activePowerUp = power;
      this.powerUpEndTime = Date.now() + power.duration;
      this.powerupIcon.textContent = power.icon;
      this.powerupName.textContent = power.name.toUpperCase();
      this.powerupBar.classList.remove('hidden');

      if (power.type === 'slow') {
        this.speedModifier = 0.5;
      } else if (power.type === 'booster') {
        this.scoreMultiplier = 2.0;
      }
    }
  }

  resetStreak() {
    this.currentStreak = 0;
    this.comboPill.classList.add('hidden');
  }

  triggerGameOver(reason, isWin) {
    this.state = 'GAMEOVER';
    clearInterval(this.timerInterval);
    this.powerupBar.classList.add('hidden');
    this.comboPill.classList.add('hidden');

    this.audio.playGameOver();

    // Check & persist high score
    const currentHigh = this.highScores[this.gameMode];
    const isNewRecord = this.score > currentHigh;
    if (isNewRecord) {
      this.highScores[this.gameMode] = this.score;
      localStorage.setItem(`bubblepop_high_${this.gameMode}`, this.score.toString());
      this.newHighTag.classList.remove('hidden');
    } else {
      this.newHighTag.classList.add('hidden');
    }

    // Modal Details
    this.gameoverTitle.textContent = isWin ? 'VICTORY!' : "GAME OVER";
    this.gameoverEmoji.textContent = isWin ? '🏆' : '🫧';
    this.gameoverReason.textContent = reason;
    this.finalScoreVal.textContent = this.score;
    this.statPoppedTotal.textContent = this.poppedCount;
    this.statMaxStreak.textContent = `${this.maxStreak}x`;
    this.statHighRecord.textContent = this.highScores[this.gameMode];

    this.overlayGameOver.classList.remove('hidden');
  }

  updateScoreUI() {
    this.scoreDisplay.textContent = this.score;
  }

  updateTimerUI() {
    if (this.gameMode === 'endless') {
      const mins = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const secs = (this.timeLeft % 60).toString().padStart(2, '0');
      this.timerDisplay.textContent = `${mins}:${secs}`;
    } else {
      this.timerDisplay.textContent = `${this.timeLeft}s`;
      this.timerDisplay.style.color = this.timeLeft <= 10 ? '#ff007f' : '';
    }
  }

  updateObjectiveUI() {
    this.objectiveDisplay.textContent = `${this.challengeCurrentCount} / ${this.challengeTargetCount}`;
  }

  showComboBanner(combo, bonus) {
    this.comboTextVal.textContent = `${combo}x POP COMBO!`;
    this.comboSubVal.textContent = `+${bonus} BONUS PTS`;
    this.comboBanner.classList.remove('hidden');

    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboBanner.classList.add('hidden');
    }, 750);
  }

  showToast(msg) {
    this.hudToast.textContent = msg;
    this.hudToast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.hudToast.classList.add('hidden');
    }, 1900);
  }

  spawnBubble() {
    // Dynamic difficulty: adjust spawn count & intervals
    const b = new Bubble(this.width, this.height, this.difficulty);
    this.bubbles.push(b);
  }

  // ==========================================================
  // 6. RENDER & SIMULATION LOOP
  // ==========================================================
  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === 'PLAYING') {
      // Update Timed Power-Up
      if (this.activePowerUp) {
        const remaining = this.powerUpEndTime - Date.now();
        if (remaining <= 0) {
          this.activePowerUp = null;
          this.speedModifier = 1.0;
          this.scoreMultiplier = 1.0;
          this.powerupBar.classList.add('hidden');
        } else {
          const pct = Math.max(0, (remaining / this.activePowerUp.duration) * 100);
          this.powerupTimerFill.style.width = `${pct}%`;
        }
      }

      // Spawning Bubbles
      this.spawnTimer++;
      const currentInterval = Math.max(16, this.spawnInterval - Math.floor(this.difficulty * 6));
      if (this.spawnTimer >= currentInterval) {
        this.spawnBubble();
        this.spawnTimer = 0;
      }

      // Update Bubbles
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const alive = this.bubbles[i].update(this.speedModifier);
        if (!alive) this.bubbles.splice(i, 1);
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const alive = this.particles[i].update();
        if (!alive) this.particles.splice(i, 1);
      }

      // Update Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const alive = this.shockwaves[i].update();
        if (!alive) this.shockwaves.splice(i, 1);
      }

      // Update Floating Scores
      for (let i = this.floatingScores.length - 1; i >= 0; i--) {
        const alive = this.floatingScores[i].update();
        if (!alive) this.floatingScores.splice(i, 1);
      }
    }

    // DRAW ENTITIES
    // 1. Shockwaves
    this.shockwaves.forEach(sw => sw.draw(this.ctx));

    // 2. Active Bubbles
    this.bubbles.forEach(b => b.draw(this.ctx));

    // 3. Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // 4. Floating Scores
    this.floatingScores.forEach(fs => fs.draw(this.ctx));

    requestAnimationFrame(this.loop);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.bubbleGameApp = new BubblePopGame();
});

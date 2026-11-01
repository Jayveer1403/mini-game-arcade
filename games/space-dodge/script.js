/**
 * Space Dodge - Space Survival Arcade Game
 * Built with HTML5 Canvas 60FPS physics, procedural vector graphics, and Web Audio API.
 * Features:
 * - Spaceship with momentum, thruster trail particles, and multi-directional velocity.
 * - Dynamic Starfield: 3-layer parallax stars, colorful nebulae, and shooting stars.
 * - Varied Hazards: Small fast asteroids, massive slow asteroids, explosive space mines, laser beams, UFO hunter drones.
 * - Power-ups: Shields, Speed Boost, Slow-Mo, Magnet, Energy Orbs, Score Booster.
 * - Special Ability: Energy Pulse (clears nearby hazards) with cooldown indicator.
 * - Near-Miss Detection: Grants bonus points & combo multiplier when skimming past hazards.
 * - Mobile Virtual Joystick & Touch and Drag controls with scroll prevention.
 * - 4 Modes: Classic Survival, Endless Space, Time Blitz (60s), and Mission Mode.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. WEB AUDIO SYNTHESIZER
     ========================================================================== */
  class SpaceAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('spacedodge_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('spacedodge_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playEngine() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      // Soft gentle thrust puff
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playNearMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    playPulse() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    }

    playPowerup() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.14, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.15);
      });
    }

    playExplosion() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    }
  }

  /* ==========================================================================
     2. GAME ENGINE CLASS
     ========================================================================== */
  class SpaceDodgeGame {
    constructor() {
      this.audio = new SpaceAudio();

      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      // Modes & Difficulty
      this.mode = 'classic'; // 'classic' | 'endless' | 'time' | 'mission'
      this.difficulty = 'medium'; // 'easy' | 'medium' | 'hard'
      this.state = 'idle'; // 'idle' | 'playing' | 'paused' | 'over'

      // Metrics & Stats
      this.score = 0;
      this.bestScore = 0;
      this.survivalTime = 0; // seconds
      this.distance = 0; // km
      this.nearMisses = 0;
      this.powerupsCollected = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.lives = 1;

      // Player State
      this.player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 18,
        speed: 5.5,
        angle: 0,
        shield: false,
        shieldTime: 0,
        boostTime: 0,
        slowTime: 0,
        magnetTime: 0,
        scoreBoostTime: 0,
        invulnerableTime: 0
      };

      // Ability Cooldown
      this.pulseCooldown = 0; // seconds
      this.maxPulseCooldown = 8.0;

      // Entities Collections
      this.stars = [];
      this.nebulae = [];
      this.asteroids = [];
      this.lasers = [];
      this.powerups = [];
      this.orbs = [];
      this.particles = [];
      this.floatingTexts = [];

      // Timers & Spawners
      this.lastFrameTime = performance.now();
      this.asteroidSpawnTimer = 0;
      this.powerupSpawnTimer = 0;
      this.orbSpawnTimer = 0;
      this.laserSpawnTimer = 0;

      // Keyboard & Virtual Touch Inputs
      this.keys = {};
      this.joystick = {
        active: false,
        touchId: null,
        startX: 0,
        startY: 0,
        currX: 0,
        currY: 0,
        dx: 0,
        dy: 0
      };

      // DOM Cache
      this.dom = {
        scoreVal: document.getElementById('score-val'),
        timeVal: document.getElementById('time-val'),
        livesVal: document.getElementById('lives-val'),
        comboPill: document.getElementById('combo-pill'),
        comboVal: document.getElementById('combo-val'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnPause: document.getElementById('btn-pause'),
        powerupsDock: document.getElementById('powerups-dock'),
        gameToast: document.getElementById('game-toast'),
        btnAbility: document.getElementById('btn-ability'),
        abilityCooldownOverlay: document.getElementById('ability-cooldown-overlay'),
        joystickBase: document.getElementById('joystick-base'),
        joystickThumb: document.getElementById('joystick-thumb'),
        // Modals
        modalStart: document.getElementById('modal-start'),
        btnStartGame: document.getElementById('btn-start-game'),
        modeTabs: document.querySelectorAll('.mode-btn'),
        diffChips: document.querySelectorAll('.diff-chip'),
        modeInfoBox: document.getElementById('mode-info'),
        modalPause: document.getElementById('modal-pause'),
        btnResume: document.getElementById('btn-resume'),
        btnRestart: document.getElementById('btn-restart'),
        pauseScoreNum: document.getElementById('pause-score-num'),
        pauseTimeNum: document.getElementById('pause-time-num'),
        modalGameover: document.getElementById('modal-gameover'),
        gameoverTitle: document.getElementById('gameover-title'),
        ratingBadge: document.getElementById('rating-badge'),
        newRecordRibbon: document.getElementById('new-record-ribbon'),
        rScoreVal: document.getElementById('r-score-val'),
        rTimeVal: document.getElementById('r-time-val'),
        rDistVal: document.getElementById('r-dist-val'),
        rNearmissVal: document.getElementById('r-nearmiss-val'),
        rComboVal: document.getElementById('r-combo-val'),
        rPowerupsVal: document.getElementById('r-powerups-val'),
        btnPlayAgain: document.getElementById('btn-play-again'),
        btnChangeMode: document.getElementById('btn-change-mode')
      };

      this.initCanvasSize();
      this.initBackgroundStars();
      this.initEvents();
      this.updateSoundIcon();
      this.loadBestScore();

      // Start rendering loop
      requestAnimationFrame((t) => this.gameLoop(t));
    }

    /* ==========================================================================
       INITIALIZATION & RESIZING
       ========================================================================== */
    initCanvasSize() {
      const container = document.getElementById('canvas-container');
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.logicalWidth = rect.width;
      this.logicalHeight = rect.height;

      // Position player at lower third center
      if (this.state === 'idle') {
        this.player.x = this.logicalWidth / 2;
        this.player.y = this.logicalHeight * 0.75;
      }
    }

    initBackgroundStars() {
      this.stars = [];
      const count = 120;
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.logicalWidth,
          y: Math.random() * this.logicalHeight,
          radius: Math.random() * 1.8 + 0.4,
          speed: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.7 + 0.3,
          color: Math.random() < 0.2 ? '#00f2fe' : (Math.random() < 0.4 ? '#ec4899' : '#ffffff')
        });
      }

      this.nebulae = [
        { x: this.logicalWidth * 0.2, y: this.logicalHeight * 0.3, r: 160, color: 'rgba(168, 85, 247, 0.08)' },
        { x: this.logicalWidth * 0.8, y: this.logicalHeight * 0.7, r: 200, color: 'rgba(0, 242, 254, 0.08)' }
      ];
    }

    initEvents() {
      window.addEventListener('resize', () => {
        this.initCanvasSize();
        this.initBackgroundStars();
      });

      // Sound Toggle
      this.dom.btnSound.addEventListener('click', () => {
        const on = this.audio.toggle();
        this.updateSoundIcon();
        this.showToast(on ? 'Sound ON 🔊' : 'Sound OFF 🔇');
      });

      // Pause & Resume
      this.dom.btnPause.addEventListener('click', () => this.togglePause());
      this.dom.btnResume.addEventListener('click', () => this.togglePause());
      this.dom.btnRestart.addEventListener('click', () => {
        this.dom.modalPause.classList.add('hidden');
        this.startSession();
      });

      // Mode Selection Tabs
      this.dom.modeTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.dom.modeTabs.forEach(b => b.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.mode = target.dataset.mode;
          this.updateModeExplanation();
        });
      });

      // Difficulty Chips
      this.dom.diffChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          this.dom.diffChips.forEach(c => c.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.difficulty = target.dataset.diff;
        });
      });

      // Start Button
      this.dom.btnStartGame.addEventListener('click', () => {
        this.audio.init();
        this.dom.modalStart.classList.add('hidden');
        this.startSession();
      });

      // Results Modal Actions
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.modalGameover.classList.add('hidden');
        this.startSession();
      });
      this.dom.btnChangeMode.addEventListener('click', () => {
        this.dom.modalGameover.classList.add('hidden');
        this.dom.modalStart.classList.remove('hidden');
      });

      // Special Ability Button
      this.dom.btnAbility.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.triggerAbility();
      });

      // Keyboard Listeners
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (!this.dom.modalStart.classList.contains('hidden') ||
              !this.dom.modalGameover.classList.contains('hidden')) return;
          this.togglePause();
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          this.triggerAbility();
          return;
        }

        this.keys[e.key.toLowerCase()] = true;
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });

      // Virtual Joystick Touch Handling
      const base = this.dom.joystickBase;
      const thumb = this.dom.joystickThumb;

      base.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.joystick.active = true;
        this.joystick.touchId = e.pointerId;
        const rect = base.getBoundingClientRect();
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;
        base.setPointerCapture(e.pointerId);
      });

      base.addEventListener('pointermove', (e) => {
        if (!this.joystick.active) return;
        e.preventDefault();
        const maxDist = 38;
        let dx = e.clientX - this.joystick.startX;
        let dy = e.clientY - this.joystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joystick.dx = dx / maxDist;
        this.joystick.dy = dy / maxDist;
      });

      const releaseJoystick = (e) => {
        if (!this.joystick.active) return;
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        thumb.style.transform = 'translate(0px, 0px)';
      };

      base.addEventListener('pointerup', releaseJoystick);
      base.addEventListener('pointercancel', releaseJoystick);

      // Direct Canvas Touch Drag Navigation
      let dragActive = false;
      this.canvas.addEventListener('pointerdown', (e) => {
        dragActive = true;
        this.updateTouchPos(e);
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (dragActive) this.updateTouchPos(e);
      });
      window.addEventListener('pointerup', () => { dragActive = false; });
      window.addEventListener('pointercancel', () => { dragActive = false; });
    }

    updateTouchPos(e) {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      // Smooth interpolation toward target
      this.player.x += (targetX - this.player.x) * 0.22;
      this.player.y += (targetY - this.player.y) * 0.22;
    }

    updateSoundIcon() {
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    updateModeExplanation() {
      const descriptions = {
        classic: '<strong>1. Classic Survival:</strong> Pilot your ship in all directions. Survive incoming asteroid belts, space mines, and laser sweeps. Near-misses grant massive bonus combo points!',
        endless: '<strong>2. Endless Space:</strong> Uncapped cosmic voyage. Obstacles increase in variety, speed, and aggression the further you travel into the void.',
        time: '<strong>3. Time Blitz:</strong> Can you endure 60 seconds of concentrated meteor showers and enemy laser arrays? Reach the timer limit to win!',
        mission: '<strong>4. Mission Mode:</strong> Accomplish critical mission objectives: perform 8 near-misses, collect 5 energy orbs, and survive without hull breaches.'
      };
      this.dom.modeInfoBox.innerHTML = descriptions[this.mode] || descriptions.classic;
    }

    showToast(msg) {
      const toast = this.dom.gameToast;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 1500);
    }

    loadBestScore() {
      const saved = localStorage.getItem(`spacedodge_high_${this.mode}`);
      this.bestScore = saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
      const key = `spacedodge_high_${this.mode}`;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(key, this.bestScore);
        return true;
      }
      return false;
    }

    togglePause() {
      if (this.state === 'over' || this.state === 'idle') return;
      if (this.state === 'paused') {
        this.state = 'playing';
        this.dom.modalPause.classList.add('hidden');
        this.lastFrameTime = performance.now();
      } else {
        this.state = 'paused';
        this.dom.pauseScoreNum.textContent = this.score;
        this.dom.pauseTimeNum.textContent = this.formatTime(this.survivalTime);
        this.dom.modalPause.classList.remove('hidden');
      }
    }

    formatTime(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    /* ==========================================================================
       SESSION LIFECYCLE
       ========================================================================== */
    startSession() {
      this.state = 'playing';
      this.score = 0;
      this.survivalTime = 0;
      this.distance = 0;
      this.nearMisses = 0;
      this.powerupsCollected = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.lives = 1;

      // Reset Player
      this.player.x = this.logicalWidth / 2;
      this.player.y = this.logicalHeight * 0.75;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.shield = false;
      this.player.shieldTime = 0;
      this.player.boostTime = 0;
      this.player.slowTime = 0;
      this.player.magnetTime = 0;
      this.player.scoreBoostTime = 0;
      this.player.invulnerableTime = 2.0; // 2 seconds initial grace
      this.pulseCooldown = 0;

      // Clear Entities
      this.asteroids = [];
      this.lasers = [];
      this.powerups = [];
      this.orbs = [];
      this.particles = [];
      this.floatingTexts = [];

      this.asteroidSpawnTimer = 0;
      this.powerupSpawnTimer = 0;
      this.orbSpawnTimer = 0;
      this.laserSpawnTimer = 0;

      this.dom.scoreVal.textContent = '0';
      this.dom.timeVal.textContent = '00:00';
      this.dom.livesVal.textContent = '🛡️ x1';
      this.dom.comboPill.classList.add('hidden');
      this.loadBestScore();
      this.lastFrameTime = performance.now();
    }

    triggerAbility() {
      if (this.state !== 'playing' || this.pulseCooldown > 0) return;
      this.pulseCooldown = this.maxPulseCooldown;
      this.audio.playPulse();

      // Clear nearby asteroids within 220px
      const pulseRadius = 220;
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        const dist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
        if (dist <= pulseRadius) {
          this.createExplosion(a.x, a.y, a.color || '#a855f7', 14);
          this.asteroids.splice(i, 1);
          this.score += 50;
        }
      }

      // Visual pulse ring
      this.createPulseRing(this.player.x, this.player.y);
      this.showToast('ENERGY PULSE ACTIVATED! ⚡');
    }

    createPulseRing(x, y) {
      this.particles.push({
        type: 'ring',
        x,
        y,
        r: 10,
        maxR: 240,
        alpha: 1,
        color: '#00f2fe'
      });
    }

    createExplosion(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.particles.push({
          type: 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 3 + 1.5,
          alpha: 1,
          color
        });
      }
    }

    addFloatingText(text, x, y, color = '#facc15') {
      this.floatingTexts.push({
        text,
        x,
        y,
        vy: -1.2,
        alpha: 1,
        color
      });
    }

    /* ==========================================================================
       GAME LOOP & PHYSICS UPDATES
       ========================================================================== */
    gameLoop(now) {
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      if (this.state === 'playing') {
        this.updateGame(dt);
      }
      this.render();

      requestAnimationFrame((t) => this.gameLoop(t));
    }

    updateGame(dt) {
      this.survivalTime += dt;
      this.distance += dt * (this.player.boostTime > 0 ? 80 : 40);
      this.score += Math.round(dt * (this.player.scoreBoostTime > 0 ? 25 : 12));

      // Ability Cooldown Overlay
      if (this.pulseCooldown > 0) {
        this.pulseCooldown = Math.max(0, this.pulseCooldown - dt);
        const ratio = this.pulseCooldown / this.maxPulseCooldown;
        this.dom.abilityCooldownOverlay.style.transform = `scaleY(${ratio})`;
      }

      // Decrement Power-up Timers
      if (this.player.boostTime > 0) this.player.boostTime -= dt;
      if (this.player.slowTime > 0) this.player.slowTime -= dt;
      if (this.player.magnetTime > 0) this.player.magnetTime -= dt;
      if (this.player.scoreBoostTime > 0) this.player.scoreBoostTime -= dt;
      if (this.player.invulnerableTime > 0) this.player.invulnerableTime -= dt;

      this.updatePowerupsDock();

      // Update Player Velocity from Keyboard and Joystick
      let inputX = 0;
      let inputY = 0;

      if (this.keys['arrowleft'] || this.keys['a']) inputX -= 1;
      if (this.keys['arrowright'] || this.keys['d']) inputX += 1;
      if (this.keys['arrowup'] || this.keys['w']) inputY -= 1;
      if (this.keys['arrowdown'] || this.keys['s']) inputY += 1;

      if (this.joystick.active) {
        inputX = this.joystick.dx;
        inputY = this.joystick.dy;
      }

      const moveSpeed = this.player.speed * (this.player.boostTime > 0 ? 1.6 : 1.0);
      this.player.vx += (inputX * moveSpeed - this.player.vx) * 0.2;
      this.player.vy += (inputY * moveSpeed - this.player.vy) * 0.2;

      this.player.x += this.player.vx;
      this.player.y += this.player.vy;

      // Bound Player inside Canvas
      const pad = this.player.radius;
      this.player.x = Math.max(pad, Math.min(this.logicalWidth - pad, this.player.x));
      this.player.y = Math.max(pad, Math.min(this.logicalHeight - pad, this.player.y));

      // Thruster trail particles
      if (Math.hypot(this.player.vx, this.player.vy) > 0.5 || Math.random() < 0.4) {
        this.particles.push({
          type: 'spark',
          x: this.player.x + (Math.random() - 0.5) * 6,
          y: this.player.y + this.player.radius,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 3,
          r: Math.random() * 2.5 + 1,
          alpha: 0.8,
          color: this.player.boostTime > 0 ? '#ec4899' : '#00f2fe'
        });
      }

      // Spawners based on Difficulty & Time Progression
      this.updateSpawners(dt);

      // Entities Updates & Collisions
      this.updateAsteroids(dt);
      this.updateLasers(dt);
      this.updatePowerupItems(dt);
      this.updateOrbs(dt);
      this.updateParticles(dt);

      // HUD Stats
      this.dom.scoreVal.textContent = this.score;
      this.dom.timeVal.textContent = this.formatTime(this.survivalTime);
      this.dom.livesVal.textContent = `🛡️ x${this.lives}`;

      // Time Blitz Mode Win Check
      if (this.mode === 'time' && this.survivalTime >= 60) {
        this.endGame('MISSION COMPLETE! You survived the 60s storm!');
      }
    }

    updatePowerupsDock() {
      const dock = this.dom.powerupsDock;
      dock.innerHTML = '';
      if (this.player.shield) {
        dock.appendChild(this.createPill('🛡️ SHIELD'));
      }
      if (this.player.boostTime > 0) {
        dock.appendChild(this.createPill(`⚡ SPEED (${Math.ceil(this.player.boostTime)}s)`));
      }
      if (this.player.slowTime > 0) {
        dock.appendChild(this.createPill(`⏳ SLOW-MO (${Math.ceil(this.player.slowTime)}s)`));
      }
      if (this.player.magnetTime > 0) {
        dock.appendChild(this.createPill(`🧲 MAGNET (${Math.ceil(this.player.magnetTime)}s)`));
      }
      if (this.player.scoreBoostTime > 0) {
        dock.appendChild(this.createPill(`⭐ 2X SCORE (${Math.ceil(this.player.scoreBoostTime)}s)`));
      }
    }

    createPill(text) {
      const pill = document.createElement('div');
      pill.className = 'powerup-pill';
      pill.textContent = text;
      return pill;
    }

    /* ==========================================================================
       SPAWNERS
       ========================================================================== */
    updateSpawners(dt) {
      const slowMod = this.player.slowTime > 0 ? 0.45 : 1.0;
      let spawnRate = 0.9;
      if (this.difficulty === 'hard') spawnRate = 0.6;
      else if (this.difficulty === 'easy') spawnRate = 1.3;

      // Progressive acceleration as survival time grows
      spawnRate = Math.max(0.35, spawnRate - (this.survivalTime / 240) * 0.4);

      this.asteroidSpawnTimer += dt * slowMod;
      if (this.asteroidSpawnTimer >= spawnRate) {
        this.asteroidSpawnTimer = 0;
        this.spawnAsteroid();
      }

      // Laser beams
      this.laserSpawnTimer += dt * slowMod;
      if (this.laserSpawnTimer >= 5.5) {
        this.laserSpawnTimer = 0;
        this.spawnLaser();
      }

      // Power-ups
      this.powerupSpawnTimer += dt;
      if (this.powerupSpawnTimer >= 10.0) {
        this.powerupSpawnTimer = 0;
        this.spawnPowerup();
      }

      // Energy Orbs
      this.orbSpawnTimer += dt;
      if (this.orbSpawnTimer >= 2.5) {
        this.orbSpawnTimer = 0;
        this.spawnOrb();
      }
    }

    spawnAsteroid() {
      const types = ['small', 'medium', 'large', 'mine'];
      const type = types[Math.floor(Math.random() * types.length)];
      let r = 16;
      let speed = Math.random() * 2.2 + 2.4;
      let color = '#94a3b8';

      if (type === 'small') {
        r = 11;
        speed = Math.random() * 2.5 + 4.2;
        color = '#38bdf8';
      } else if (type === 'large') {
        r = 32;
        speed = Math.random() * 1.2 + 1.8;
        color = '#64748b';
      } else if (type === 'mine') {
        r = 16;
        speed = Math.random() * 1.5 + 2.2;
        color = '#ef4444';
      }

      const x = Math.random() * (this.logicalWidth - r * 2) + r;
      this.asteroids.push({
        x,
        y: -r - 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: speed,
        r,
        type,
        color,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        nearMissAwarded: false
      });
    }

    spawnLaser() {
      const isHorizontal = Math.random() < 0.5;
      this.lasers.push({
        isHorizontal,
        pos: isHorizontal ? Math.random() * (this.logicalHeight - 80) + 40 : Math.random() * (this.logicalWidth - 80) + 40,
        phase: 'warning', // 'warning' -> 'firing'
        timer: 1.2,
        width: 14
      });
    }

    spawnPowerup() {
      const types = ['shield', 'boost', 'slow', 'magnet', 'score'];
      const type = types[Math.floor(Math.random() * types.length)];
      const x = Math.random() * (this.logicalWidth - 40) + 20;
      this.powerups.push({
        x,
        y: -20,
        vy: 2.2,
        r: 16,
        type
      });
    }

    spawnOrb() {
      const x = Math.random() * (this.logicalWidth - 30) + 15;
      this.orbs.push({
        x,
        y: -15,
        vy: 2.8,
        r: 8
      });
    }

    /* ==========================================================================
       ENTITY UPDATES & COLLISIONS
       ========================================================================== */
    updateAsteroids(dt) {
      const slowMod = this.player.slowTime > 0 ? 0.45 : 1.0;

      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i];
        a.x += a.vx * slowMod;
        a.y += a.vy * slowMod;
        a.angle += a.rotSpeed * slowMod;

        // Collision Check
        const dist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
        const minDist = a.r + this.player.radius;

        if (dist < minDist) {
          // Impact sustained
          if (this.player.invulnerableTime <= 0) {
            this.handlePlayerHit(a.x, a.y);
            this.createExplosion(a.x, a.y, a.color, 16);
            this.asteroids.splice(i, 1);
            continue;
          }
        } else if (!a.nearMissAwarded && dist < minDist + 28) {
          // NEAR MISS BONUS
          a.nearMissAwarded = true;
          this.nearMisses++;
          this.combo++;
          if (this.combo > this.bestCombo) this.bestCombo = this.combo;

          const bonus = 100 + (this.combo - 1) * 30;
          this.score += bonus;
          this.audio.playNearMiss();
          this.addFloatingText(`NEAR MISS! +${bonus}`, a.x, a.y - 10, '#00f2fe');

          if (this.combo >= 2) {
            this.dom.comboPill.classList.remove('hidden');
            this.dom.comboVal.textContent = `x${this.combo}`;
          }
        }

        // Cleanup off-screen
        if (a.y > this.logicalHeight + a.r + 20) {
          this.asteroids.splice(i, 1);
        }
      }
    }

    updateLasers(dt) {
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.timer -= dt;

        if (l.phase === 'warning') {
          if (l.timer <= 0) {
            l.phase = 'firing';
            l.timer = 0.8; // fires for 0.8s
          }
        } else if (l.phase === 'firing') {
          // Check collision with laser beam
          if (this.player.invulnerableTime <= 0) {
            if (l.isHorizontal) {
              if (Math.abs(this.player.y - l.pos) < this.player.radius + l.width / 2) {
                this.handlePlayerHit(this.player.x, l.pos);
              }
            } else {
              if (Math.abs(this.player.x - l.pos) < this.player.radius + l.width / 2) {
                this.handlePlayerHit(l.pos, this.player.y);
              }
            }
          }

          if (l.timer <= 0) {
            this.lasers.splice(i, 1);
          }
        }
      }
    }

    updatePowerupItems(dt) {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const p = this.powerups[i];
        p.y += p.vy;

        // Magnet suction
        if (this.player.magnetTime > 0) {
          const dx = this.player.x - p.x;
          const dy = this.player.y - p.y;
          p.x += dx * 0.08;
          p.y += dy * 0.08;
        }

        // Collection check
        if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.r + this.player.radius) {
          this.powerupsCollected++;
          this.score += 250;
          this.audio.playPowerup();

          if (p.type === 'shield') this.player.shield = true;
          else if (p.type === 'boost') this.player.boostTime = 7.0;
          else if (p.type === 'slow') this.player.slowTime = 6.0;
          else if (p.type === 'magnet') this.player.magnetTime = 8.0;
          else if (p.type === 'score') this.player.scoreBoostTime = 8.0;

          this.addFloatingText(`+250 ${p.type.toUpperCase()}`, p.x, p.y, '#22c55e');
          this.createExplosion(p.x, p.y, '#22c55e', 10);
          this.powerups.splice(i, 1);
          continue;
        }

        if (p.y > this.logicalHeight + 30) {
          this.powerups.splice(i, 1);
        }
      }
    }

    updateOrbs(dt) {
      for (let i = this.orbs.length - 1; i >= 0; i--) {
        const orb = this.orbs[i];
        orb.y += orb.vy;

        if (this.player.magnetTime > 0) {
          const dx = this.player.x - orb.x;
          const dy = this.player.y - orb.y;
          orb.x += dx * 0.12;
          orb.y += dy * 0.12;
        }

        if (Math.hypot(orb.x - this.player.x, orb.y - this.player.y) < orb.r + this.player.radius) {
          this.score += 40;
          this.addFloatingText('+40', orb.x, orb.y, '#facc15');
          this.orbs.splice(i, 1);
          continue;
        }

        if (orb.y > this.logicalHeight + 20) {
          this.orbs.splice(i, 1);
        }
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        if (p.type === 'ring') {
          p.r += 320 * dt;
          p.alpha = 1 - p.r / p.maxR;
          if (p.alpha <= 0) this.particles.splice(i, 1);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= dt * 1.8;
          if (p.alpha <= 0) this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const t = this.floatingTexts[i];
        t.y += t.vy;
        t.alpha -= dt * 1.5;
        if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    handlePlayerHit(hitX, hitY) {
      if (this.player.shield) {
        // Shield absorbs hit
        this.player.shield = false;
        this.player.invulnerableTime = 1.2;
        this.createExplosion(hitX, hitY, '#00f2fe', 16);
        this.showToast('SHIELD CRACKED! 🛡️');
        return;
      }

      this.lives--;
      this.audio.playExplosion();
      this.createExplosion(this.player.x, this.player.y, '#ef4444', 24);

      if (this.lives <= 0) {
        this.endGame('HULL DESTROYED! Asteroid collision.');
      } else {
        this.player.invulnerableTime = 2.0;
        this.combo = 0;
        this.dom.comboPill.classList.add('hidden');
      }
    }

    endGame(reason) {
      this.state = 'over';
      this.audio.playExplosion();

      const isNew = this.saveBestScore();

      let rating = 'ROOKIE 🚀';
      if (this.survivalTime >= 60 || this.score >= 5000) rating = 'ACE PILOT 🌟';
      else if (this.survivalTime >= 35 || this.score >= 2500) rating = 'VETERAN ⭐';
      else if (this.survivalTime >= 20) rating = 'PILOT 🎯';

      this.dom.gameoverTitle.textContent = reason.includes('COMPLETE') ? 'MISSION ACCOMPLISHED!' : 'HULL DESTROYED';
      this.dom.ratingBadge.textContent = rating;
      this.dom.rScoreVal.textContent = this.score;
      this.dom.rTimeVal.textContent = this.formatTime(this.survivalTime);
      this.dom.rDistVal.textContent = `${Math.round(this.distance)} km`;
      this.dom.rNearmissVal.textContent = this.nearMisses;
      this.dom.rComboVal.textContent = `x${this.bestCombo}`;
      this.dom.rPowerupsVal.textContent = this.powerupsCollected;

      if (isNew) {
        this.dom.newRecordRibbon.classList.remove('hidden');
      } else {
        this.dom.newRecordRibbon.classList.add('hidden');
      }

      this.dom.modalGameover.classList.remove('hidden');
    }

    /* ==========================================================================
       RENDERING ENGINE
       ========================================================================== */
    render() {
      const ctx = this.ctx;
      const w = this.logicalWidth;
      const h = this.logicalHeight;

      ctx.clearRect(0, 0, w, h);

      // Deep Space Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#040714');
      grad.addColorStop(1, '#020308');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw Nebulae
      this.nebulae.forEach(n => {
        const rad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
        rad.addColorStop(0, n.color);
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Stars
      this.stars.forEach(s => {
        s.y += s.speed * (this.player.boostTime > 0 ? 2.5 : 1.0);
        if (s.y > h) s.y = 0;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Lasers
      this.lasers.forEach(l => {
        if (l.phase === 'warning') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          if (l.isHorizontal) {
            ctx.moveTo(0, l.pos);
            ctx.lineTo(w, l.pos);
          } else {
            ctx.moveTo(l.pos, 0);
            ctx.lineTo(l.pos, h);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Firing beam
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = l.width;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          if (l.isHorizontal) {
            ctx.moveTo(0, l.pos);
            ctx.lineTo(w, l.pos);
          } else {
            ctx.moveTo(l.pos, 0);
            ctx.lineTo(l.pos, h);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Power-ups
      this.powerups.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Fredoka One';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type[0].toUpperCase(), 0, 1);
        ctx.restore();
      });

      // Draw Energy Orbs
      this.orbs.forEach(orb => {
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Asteroids
      this.asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);

        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        if (a.type === 'mine') {
          // Space Mine geometry
          ctx.arc(0, 0, a.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(0, 0, a.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Polygon rock
          const sides = a.type === 'small' ? 5 : 7;
          for (let s = 0; s < sides; s++) {
            const th = (s / sides) * Math.PI * 2;
            const rad = a.r * (0.8 + 0.2 * Math.sin(s * 3));
            const px = Math.cos(th) * rad;
            const py = Math.sin(th) * rad;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Draw Particles & Rings
      this.particles.forEach(p => {
        ctx.save();
        if (p.type === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Player Spaceship
      if (this.state === 'playing' || this.state === 'idle') {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);

        // Flash if invulnerable
        if (this.player.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }

        // Shield Bubble
        if (this.player.shield) {
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, this.player.radius + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Spaceship Vector Craft
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, -this.player.radius);
        ctx.lineTo(this.player.radius * 0.75, this.player.radius * 0.8);
        ctx.lineTo(0, this.player.radius * 0.4);
        ctx.lineTo(-this.player.radius * 0.75, this.player.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Cockpit canopy
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -this.player.radius * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Draw Floating Texts
      this.floatingTexts.forEach(t => {
        ctx.save();
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha;
        ctx.font = 'bold 12px Fredoka One';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });
    }
  }

  // Launch on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    window.spaceDodgeGame = new SpaceDodgeGame();
  });
})();

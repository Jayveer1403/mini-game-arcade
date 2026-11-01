/**
 * NEON BRICK BREAKER - COMPLETE GAME ENGINE
 * 10 Progressive Architectural Levels, 7 Dynamic Power-Ups,
 * Multi-Ball Physics, AOE Explosions, Lasers, and Web Audio Synthesis.
 */

// ==========================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================================
class BrickAudio {
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

  // Paddle Deflection Bounce
  playPaddleBounce() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Wall Bounce
  playWallBounce() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // Brick Smash Sound (Pitch scales with level & combos)
  playBrickSmash(pitchMod = 1.0) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const baseFreq = 480 * pitchMod;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.07);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Bomb Brick Explosion Boom
  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Power-Up Catch Fanfare
  playPowerUp() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.28, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.18);
      });
    } catch (e) {}
  }

  // Laser Blaster Pew
  playLaserShot() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.09);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  // Life Lost Alarm
  playLifeLost() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Level Clear Celebration
  playLevelClear() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554, 659, 880, 1108].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.3, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } catch (e) {}
  }
}

// ==========================================================
// 2. BRICK TYPES & POWER-UP DEFINITIONS
// ==========================================================
const BRICK_CONFIG = {
  1: { type: 'normal_1', hp: 1, points: 20, color: '#00f2fe', edge: '#0077b6' }, // Cyan
  2: { type: 'normal_2', hp: 1, points: 25, color: '#00e676', edge: '#008b44' }, // Green
  3: { type: 'normal_3', hp: 1, points: 30, color: '#ff922b', edge: '#d9480f' }, // Orange
  4: { type: 'strong',   hp: 2, points: 50, color: '#ff007f', edge: '#99004d' }, // Strong Pink (2 Hits)
  5: { type: 'gold',     hp: 1, points: 100, color: '#ffd700', edge: '#b8860b' }, // Gold Bonus
  6: { type: 'bomb',     hp: 1, points: 40, color: '#e60000', edge: '#800000' }, // Explosive Core
  9: { type: 'steel',    hp: Infinity, points: 0, color: '#495057', edge: '#212529' } // Unbreakable Steel
};

const POWERUP_DEFS = [
  { type: 'wide', icon: '↔️', name: 'Wide Paddle', duration: 9000 },
  { type: 'multi', icon: '⚽', name: 'Multi-Ball', duration: 0 },
  { type: 'laser', icon: '🔴', name: 'Laser Cannon', duration: 8000 },
  { type: 'slow', icon: '⏱️', name: 'Slow Motion', duration: 8000 },
  { type: 'life', icon: '❤️', name: 'Extra Life', duration: 0 },
  { type: 'fire', icon: '🔥', name: 'Fireball', duration: 7000 },
  { type: 'double', icon: '⭐', name: '2x Score Boost', duration: 9000 }
];

// 10 Progressive Architectural Level Layouts
const LEVEL_LAYOUTS = [
  // Level 1: Classic Beginner Waves
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3, 3, 3, 3, 3]
  ],
  // Level 2: Checkerboard with Gold center
  [
    [1, 4, 1, 4, 4, 1, 4, 1],
    [4, 5, 4, 5, 5, 4, 5, 4],
    [1, 4, 1, 4, 4, 1, 4, 1],
    [2, 2, 2, 2, 2, 2, 2, 2]
  ],
  // Level 3: Explosive Core Vault
  [
    [3, 3, 3, 6, 6, 3, 3, 3],
    [2, 4, 4, 5, 5, 4, 4, 2],
    [1, 1, 6, 1, 1, 6, 1, 1],
    [3, 3, 3, 3, 3, 3, 3, 3]
  ],
  // Level 4: The Fortress (Steel Obstacles)
  [
    [9, 1, 2, 3, 3, 2, 1, 9],
    [4, 4, 5, 6, 6, 5, 4, 4],
    [9, 2, 9, 1, 1, 9, 2, 9],
    [3, 3, 3, 3, 3, 3, 3, 3]
  ],
  // Level 5: Diamond Gateway
  [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [0, 0, 4, 6, 6, 4, 0, 0],
    [0, 3, 1, 9, 9, 1, 3, 0],
    [2, 1, 4, 5, 5, 4, 1, 2],
    [0, 3, 1, 9, 9, 1, 3, 0],
    [0, 0, 4, 6, 6, 4, 0, 0]
  ],
  // Level 6: Steel Columns of Olympus
  [
    [4, 9, 5, 9, 9, 5, 9, 4],
    [3, 9, 6, 9, 9, 6, 9, 3],
    [2, 9, 1, 9, 9, 1, 9, 2],
    [1, 9, 2, 9, 9, 2, 9, 1],
    [5, 4, 3, 6, 6, 3, 4, 5]
  ],
  // Level 7: Neon Pyramid
  [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [0, 0, 4, 4, 4, 4, 0, 0],
    [0, 6, 3, 3, 3, 3, 6, 0],
    [2, 2, 9, 2, 2, 9, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ],
  // Level 8: Double Bunker
  [
    [9, 6, 9, 5, 5, 9, 6, 9],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [3, 1, 3, 9, 9, 3, 1, 3],
    [2, 2, 2, 6, 6, 2, 2, 2],
    [1, 5, 1, 1, 1, 1, 5, 1]
  ],
  // Level 9: Minefield Maze
  [
    [6, 4, 6, 4, 4, 6, 4, 6],
    [9, 5, 9, 5, 5, 9, 5, 9],
    [3, 6, 3, 6, 6, 3, 6, 3],
    [4, 9, 4, 9, 9, 4, 9, 4],
    [2, 1, 5, 1, 1, 5, 1, 2]
  ],
  // Level 10: The Citadel Core (Final Apex Challenge)
  [
    [9, 9, 9, 9, 9, 9, 9, 9],
    [9, 5, 6, 4, 4, 6, 5, 9],
    [9, 4, 5, 6, 6, 5, 4, 9],
    [9, 3, 4, 5, 5, 4, 3, 9],
    [9, 2, 3, 4, 4, 3, 2, 9],
    [9, 1, 2, 3, 3, 2, 1, 9]
  ]
];

// ==========================================================
// 3. MAIN GAME CONTROLLER CLASS
// ==========================================================
class NeonBrickBreaker {
  constructor() {
    this.canvas = document.getElementById('brick-canvas');
    this.ctx = this.canvas.getContext('2d');

    // UI elements
    this.scoreDisplay = document.getElementById('score-display');
    this.levelDisplay = document.getElementById('level-display');
    this.levelLabel = document.getElementById('level-label');
    this.livesRow = document.getElementById('lives-row');
    this.multiPill = document.getElementById('multi-pill');
    this.launchPrompt = document.getElementById('launch-prompt');
    this.gameToast = document.getElementById('game-toast');

    // Powerup bar
    this.powerupStatusBar = document.getElementById('powerup-status-bar');
    this.statusIcon = document.getElementById('status-icon');
    this.statusText = document.getElementById('status-text');
    this.statusTimerFill = document.getElementById('status-timer-fill');

    // Overlays
    this.modalStart = document.getElementById('modal-start');
    this.modalPause = document.getElementById('modal-pause');
    this.modalLevelClear = document.getElementById('modal-level-clear');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modeDetailsBox = document.getElementById('mode-details');
    this.levelChipsContainer = document.getElementById('level-chips');

    // Stats
    this.pauseScoreNum = document.getElementById('pause-score-num');
    this.pauseLevelNum = document.getElementById('pause-level-num');
    this.clearScoreVal = document.getElementById('clear-score-val');
    this.clearMessage = document.getElementById('clear-message');
    this.gameoverScoreVal = document.getElementById('gameover-score-val');
    this.gameoverTitle = document.getElementById('gameover-title');
    this.gameoverReason = document.getElementById('gameover-reason');
    this.statBricksBroken = document.getElementById('stat-bricks-broken');
    this.statHighestLevel = document.getElementById('stat-highest-level');
    this.statBestRecord = document.getElementById('stat-best-record');
    this.newRecordBadge = document.getElementById('new-record-badge');

    // Buttons
    this.btnStartPlay = document.getElementById('btn-start-play');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnMenu = document.getElementById('btn-menu');
    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');

    // Audio Engine
    this.audio = new BrickAudio();

    // Game Core State
    this.state = 'START'; // 'START', 'READY_LAUNCH', 'PLAYING', 'PAUSED', 'CLEAR', 'GAMEOVER'
    this.gameMode = 'classic'; // 'classic', 'endless', 'time'
    this.score = 0;
    this.currentLevelIndex = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.timeChallengeRemaining = 90;
    this.challengeInterval = null;

    // High score
    this.bestScore = parseInt(localStorage.getItem('neonbreaker_high') || '0', 10);
    this.totalBricksBroken = 0;

    // Paddle
    this.paddle = {
      x: 0,
      y: 0,
      width: 100,
      baseWidth: 100,
      height: 14,
      speed: 8,
      isLaser: false,
      isWide: false
    };

    // Balls list (multi-ball support)
    this.balls = [];
    this.baseBallSpeed = 6.0;

    // Bricks grid
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.floatingTexts = [];

    // Active power-up timers
    this.activePowerups = {
      wide: 0,
      laser: 0,
      fire: 0,
      double: 0
    };

    // Keyboard keys state
    this.keys = { Left: false, Right: false, Space: false };

    // Delta time tracking
    this.lastTime = 0;

    // Binds
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    this.setupListeners();
    this.buildLevelSelectorChips();
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

    // Keep paddle bounded & positioned
    this.paddle.y = this.height - 34;
    this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
  }

  buildLevelSelectorChips() {
    this.levelChipsContainer.innerHTML = '';
    for (let i = 0; i < LEVEL_LAYOUTS.length; i++) {
      const chip = document.createElement('div');
      chip.className = `lvl-chip ${i === 0 ? 'active' : ''}`;
      chip.textContent = `${i + 1}`;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.lvl-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentLevelIndex = i;
      });
      this.levelChipsContainer.appendChild(chip);
    }
  }

  setupListeners() {
    // Mode tabs
    const descriptions = {
      classic: '<strong>Classic Mode:</strong> Conquer 10 progressively designed architectural brick levels featuring unbreakable steel and explosive core bricks!',
      endless: '<strong>Endless Mode:</strong> Non-stop action! Destroy bricks as new waves continuously descend toward your paddle.',
      time: '<strong>Time Attack Mode:</strong> 90 seconds on the clock! Score as high as possible before the countdown timer hits zero.'
    };

    document.querySelectorAll('.mode-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.gameMode = tab.getAttribute('data-mode');
        this.modeDetailsBox.innerHTML = descriptions[this.gameMode];
      });
    });

    // Start Button
    this.btnStartPlay.addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnRestart.addEventListener('click', () => this.restartLevel());
    this.btnNextLevel.addEventListener('click', () => this.advanceToNextLevel());
    this.btnPlayAgain.addEventListener('click', () => this.startGame());
    this.btnMenu.addEventListener('click', () => {
      this.modalGameOver.classList.add('hidden');
      this.modalStart.classList.remove('hidden');
      this.state = 'START';
    });

    this.btnSound.addEventListener('click', () => {
      this.audio.init();
      const on = this.audio.toggleMute();
      this.soundIcon.textContent = on ? '🔊' : '🔇';
      this.showToast(on ? 'Sound On' : 'Sound Muted');
    });

    // Desktop Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.keys.Left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.keys.Right = true;
      } else if (e.key === ' ' || e.code === 'Space') {
        if (this.state === 'READY_LAUNCH') {
          this.launchBall();
        } else if (this.state === 'PLAYING') {
          // Shoot lasers if active
          this.shootLasers();
        }
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
          this.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.keys.Left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.keys.Right = false;
      }
    });

    // Desktop Mouse movement
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.state === 'PLAYING' || this.state === 'READY_LAUNCH') {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, mouseX - this.paddle.width / 2));
      }
    });

    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.state === 'READY_LAUNCH') {
        this.launchBall();
      } else if (this.state === 'PLAYING') {
        this.shootLasers();
      }
    });

    // Mobile Touch controls with non-passive preventDefault
    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault(); // Stop mobile pull-to-refresh & screen scrolling
      if (this.state === 'PLAYING' || this.state === 'READY_LAUNCH') {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, touchX - this.paddle.width / 2));
      }
    };

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault();
      this.audio.init();
      if (this.state === 'READY_LAUNCH') {
        this.launchBall();
      } else if (this.state === 'PLAYING') {
        this.shootLasers();
      }
      handleTouchMove(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  }

  startGame() {
    this.modalStart.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.modalLevelClear.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');

    this.score = 0;
    this.lives = this.maxLives;
    this.totalBricksBroken = 0;
    this.updateHeartsUI();
    this.updateScoreUI();

    if (this.gameMode === 'time') {
      this.timeChallengeRemaining = 90;
      this.levelLabel.textContent = 'TIMER';
      this.levelDisplay.textContent = '90s';
      clearInterval(this.challengeInterval);
      this.challengeInterval = setInterval(() => {
        if (this.state === 'PLAYING') {
          this.timeChallengeRemaining--;
          this.levelDisplay.textContent = `${this.timeChallengeRemaining}s`;
          if (this.timeChallengeRemaining <= 0) {
            this.triggerGameOver(true, "Time's Up! Fantastic Blitz!");
          }
        }
      }, 1000);
    } else if (this.gameMode === 'endless') {
      this.levelLabel.textContent = 'MODE';
      this.levelDisplay.textContent = 'Endless';
    } else {
      this.levelLabel.textContent = 'LEVEL';
      this.levelDisplay.textContent = `${this.currentLevelIndex + 1}/10`;
    }

    this.loadLevel(this.currentLevelIndex);
  }

  loadLevel(levelIdx) {
    this.currentLevelIndex = levelIdx;
    if (this.gameMode === 'classic') {
      this.levelDisplay.textContent = `${this.currentLevelIndex + 1}/10`;
    }

    // Reset paddle position & state
    this.paddle.width = this.paddle.baseWidth;
    this.paddle.x = (this.width - this.paddle.width) / 2;
    this.paddle.y = this.height - 34;
    this.paddle.isLaser = false;

    // Reset active powerup buffs
    this.activePowerups = { wide: 0, laser: 0, fire: 0, double: 0 };
    this.powerupStatusBar.classList.add('hidden');
    this.multiPill.classList.add('hidden');

    // Build Bricks Grid
    const layout = LEVEL_LAYOUTS[levelIdx % LEVEL_LAYOUTS.length];
    const rows = layout.length;
    const cols = layout[0].length;
    const brickMargin = 6;
    const topOffset = 70;
    const availableWidth = this.width - 24;
    const brickWidth = (availableWidth - (cols - 1) * brickMargin) / cols;
    const brickHeight = Math.min(26, (this.height * 0.32) / rows);

    this.bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = layout[r][c];
        if (val === 0) continue;

        const config = BRICK_CONFIG[val] || BRICK_CONFIG[1];
        const bx = 12 + c * (brickWidth + brickMargin);
        const by = topOffset + r * (brickHeight + brickMargin);

        this.bricks.push({
          x: bx,
          y: by,
          w: brickWidth,
          h: brickHeight,
          type: config.type,
          hp: config.hp,
          maxHp: config.hp,
          points: config.points,
          color: config.color,
          edge: config.edge,
          isSteel: val === 9,
          isBomb: val === 6
        });
      }
    }

    // Prepare ball docked to paddle
    this.resetBallToPaddle();
  }

  resetBallToPaddle() {
    this.balls = [{
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 10,
      radius: 8,
      vx: 0,
      vy: 0,
      speed: this.baseBallSpeed + this.currentLevelIndex * 0.25,
      isFire: false
    }];

    this.state = 'READY_LAUNCH';
    this.launchPrompt.classList.remove('hidden');
  }

  launchBall() {
    if (this.state !== 'READY_LAUNCH') return;
    this.launchPrompt.classList.add('hidden');
    this.state = 'PLAYING';

    const b = this.balls[0];
    const angle = -Math.PI / 3 + (Math.random() - 0.5) * 0.4; // Launch upwards at ~60 degrees
    b.vx = Math.cos(angle) * b.speed;
    b.vy = Math.sin(angle) * b.speed;
    this.audio.playPaddleBounce();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseScoreNum.textContent = this.score;
      this.pauseLevelNum.textContent = `Level ${this.currentLevelIndex + 1}`;
      this.modalPause.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.modalPause.classList.add('hidden');
    }
  }

  restartLevel() {
    this.modalPause.classList.add('hidden');
    this.loadLevel(this.currentLevelIndex);
  }

  shootLasers() {
    if (!this.paddle.isLaser || this.state !== 'PLAYING') return;
    this.audio.playLaserShot();
    this.lasers.push({
      x: this.paddle.x + 10,
      y: this.paddle.y - 6,
      w: 4,
      h: 14,
      vy: -12
    });
    this.lasers.push({
      x: this.paddle.x + this.paddle.width - 14,
      y: this.paddle.y - 6,
      w: 4,
      h: 14,
      vy: -12
    });
  }

  // ==========================================================
  // 4. POWER-UP ENGINE
  // ==========================================================
  spawnPowerup(x, y) {
    if (Math.random() < 0.28) { // 28% drop chance on brick break
      const p = POWERUP_DEFS[Math.floor(Math.random() * POWERUP_DEFS.length)];
      this.powerups.push({
        x: x,
        y: y,
        type: p.type,
        icon: p.icon,
        name: p.name,
        duration: p.duration,
        vy: 2.6,
        radius: 14
      });
    }
  }

  collectPowerup(p) {
    this.audio.playPowerUp();
    this.showToast(`POWER-UP: ${p.icon} ${p.name}!`);

    if (p.type === 'wide') {
      this.paddle.width = this.paddle.baseWidth * 1.45;
      this.activePowerups.wide = Date.now() + p.duration;
      this.updatePowerupStatusBar(p.icon, 'WIDE PADDLE ACTIVE', p.duration);
    } else if (p.type === 'laser') {
      this.paddle.isLaser = true;
      this.activePowerups.laser = Date.now() + p.duration;
      this.updatePowerupStatusBar(p.icon, 'LASER CANNON (TAP / SPACE)', p.duration);
    } else if (p.type === 'fire') {
      this.balls.forEach(b => b.isFire = true);
      this.activePowerups.fire = Date.now() + p.duration;
      this.updatePowerupStatusBar(p.icon, 'FIREAL BALL CLEAVING', p.duration);
    } else if (p.type === 'double') {
      this.activePowerups.double = Date.now() + p.duration;
      this.multiPill.classList.remove('hidden');
      this.updatePowerupStatusBar(p.icon, '2X SCORE MULTIPLIER', p.duration);
    } else if (p.type === 'slow') {
      this.balls.forEach(b => {
        b.vx *= 0.65;
        b.vy *= 0.65;
      });
      this.updatePowerupStatusBar(p.icon, 'SLOW MOTION ACTIVE', p.duration);
    } else if (p.type === 'multi') {
      // Duplicate balls
      const newBalls = [];
      this.balls.forEach(b => {
        const copy1 = { ...b, vx: b.vx * 0.9 - 2, vy: b.vy * 0.9 };
        const copy2 = { ...b, vx: b.vx * 0.9 + 2, vy: b.vy * 0.9 };
        newBalls.push(copy1, copy2);
      });
      this.balls.push(...newBalls);
    } else if (p.type === 'life') {
      if (this.lives < this.maxLives) {
        this.lives++;
        this.updateHeartsUI();
      }
    }
  }

  updatePowerupStatusBar(icon, text, duration) {
    this.statusIcon.textContent = icon;
    this.statusText.textContent = text;
    this.powerupStatusBar.classList.remove('hidden');
  }

  showToast(msg) {
    this.gameToast.textContent = msg;
    this.gameToast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.gameToast.classList.add('hidden');
    }, 1800);
  }

  updateScoreUI() {
    this.scoreDisplay.textContent = this.score;
  }

  updateHeartsUI() {
    const hearts = this.livesRow.querySelectorAll('.heart-icon');
    hearts.forEach((h, idx) => {
      if (idx < this.lives) {
        h.classList.add('active');
        h.classList.remove('lost');
      } else {
        h.classList.remove('active');
        h.classList.add('lost');
      }
    });
  }

  // ==========================================================
  // 5. COLLISION & PHYSICS
  // ==========================================================
  update(dt) {
    // 1. Move Paddle via keyboard
    if (this.keys.Left) {
      this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
    }
    if (this.keys.Right) {
      this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddle.speed);
    }

    // 2. Ready Launch state: pin ball to paddle center
    if (this.state === 'READY_LAUNCH') {
      if (this.balls.length > 0) {
        this.balls[0].x = this.paddle.x + this.paddle.width / 2;
        this.balls[0].y = this.paddle.y - this.balls[0].radius - 2;
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    // 3. Power-Up Timers check
    const now = Date.now();
    if (this.activePowerups.wide && now > this.activePowerups.wide) {
      this.activePowerups.wide = 0;
      this.paddle.width = this.paddle.baseWidth;
    }
    if (this.activePowerups.laser && now > this.activePowerups.laser) {
      this.activePowerups.laser = 0;
      this.paddle.isLaser = false;
    }
    if (this.activePowerups.fire && now > this.activePowerups.fire) {
      this.activePowerups.fire = 0;
      this.balls.forEach(b => b.isFire = false);
    }
    if (this.activePowerups.double && now > this.activePowerups.double) {
      this.activePowerups.double = 0;
      this.multiPill.classList.add('hidden');
    }
    if (!this.activePowerups.wide && !this.activePowerups.laser && !this.activePowerups.fire && !this.activePowerups.double) {
      this.powerupStatusBar.classList.add('hidden');
    }

    // 4. Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;

      // Laser to Brick collision
      for (let b = this.bricks.length - 1; b >= 0; b--) {
        const br = this.bricks[b];
        if (l.x + l.w >= br.x && l.x <= br.x + br.w && l.y <= br.y + br.h && l.y + l.h >= br.y) {
          if (!br.isSteel) {
            this.damageBrick(br, b);
          }
          this.lasers.splice(i, 1);
          break;
        }
      }

      if (l.y < -20) this.lasers.splice(i, 1);
    }

    // 5. Update Falling Power-Ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy;

      // Check collision with paddle
      if (p.y + p.radius >= this.paddle.y && p.y - p.radius <= this.paddle.y + this.paddle.height &&
          p.x >= this.paddle.x && p.x <= this.paddle.x + this.paddle.width) {
        this.collectPowerup(p);
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.height + 30) this.powerups.splice(i, 1);
    }

    // 6. Update Balls & Collision
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall Bounce (Left & Right)
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        this.audio.playWallBounce();
      } else if (ball.x + ball.radius >= this.width) {
        ball.x = this.width - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        this.audio.playWallBounce();
      }

      // Ceiling Bounce
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        this.audio.playWallBounce();
      }

      // Paddle Collision (Angle reflection based on hit point)
      if (ball.y + ball.radius >= this.paddle.y && ball.y - ball.radius <= this.paddle.y + this.paddle.height) {
        if (ball.x >= this.paddle.x - 4 && ball.x <= this.paddle.x + this.paddle.width + 4) {
          ball.y = this.paddle.y - ball.radius;

          // Hit position normalized (-1 to +1)
          const hitOffset = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
          const maxBounceAngle = Math.PI * 0.42; // Up to ~75 degrees
          const bounceAngle = hitOffset * maxBounceAngle - Math.PI / 2;

          const currentSpeed = Math.hypot(ball.vx, ball.vy);
          ball.vx = Math.cos(bounceAngle) * currentSpeed;
          ball.vy = Math.sin(bounceAngle) * currentSpeed;

          this.audio.playPaddleBounce();
        }
      }

      // Brick Collision Check
      for (let b = this.bricks.length - 1; b >= 0; b--) {
        const br = this.bricks[b];

        // AABB vs Circle collision
        const closestX = Math.max(br.x, Math.min(ball.x, br.x + br.w));
        const closestY = Math.max(br.y, Math.min(ball.y, br.y + br.h));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;

        if (distX * distX + distY * distY <= ball.radius * ball.radius) {
          // HIT!
          if (!ball.isFire || br.isSteel) {
            // Determine collision normal to reflect ball
            const overlapX = ball.radius - Math.abs(distX);
            const overlapY = ball.radius - Math.abs(distY);
            if (overlapX < overlapY) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }
          }

          if (br.isSteel) {
            this.audio.playWallBounce();
          } else {
            this.damageBrick(br, b);
          }
          break;
        }
      }

      // Ball Fell Out Below Paddle
      if (ball.y - ball.radius > this.height) {
        this.balls.splice(i, 1);
      }
    }

    // Check if all balls were lost
    if (this.balls.length === 0) {
      this.handleBallLoss();
    }

    // 7. Check Level Cleared (Non-steel bricks eliminated)
    const remainingDestructibles = this.bricks.filter(b => !b.isSteel).length;
    if (remainingDestructibles === 0 && this.bricks.length > 0) {
      this.handleLevelVictory();
    }
  }

  damageBrick(br, index) {
    br.hp--;
    if (br.hp <= 0) {
      // Break brick
      this.bricks.splice(index, 1);
      this.totalBricksBroken++;

      // Points calculation
      const mult = this.activePowerups.double ? 2 : 1;
      const pts = br.points * mult;
      this.score += pts;
      this.updateScoreUI();

      this.audio.playBrickSmash(1 + (this.currentLevelIndex * 0.08));

      // Spawn Destruction Particles
      for (let p = 0; p < 12; p++) {
        this.particles.push({
          x: br.x + br.w / 2,
          y: br.y + br.h / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: br.color,
          size: 3 + Math.random() * 4,
          life: 1.0,
          decay: 0.035
        });
      }

      // Spawn Powerup chance
      this.spawnPowerup(br.x + br.w / 2, br.y + br.h / 2);

      // Explosive Brick AOE blast
      if (br.isBomb) {
        this.triggerBombBlast(br.x + br.w / 2, br.y + br.h / 2);
      }
    } else {
      // Crack effect for strong brick
      this.audio.playWallBounce();
      br.color = '#ff66a3'; // Dimmed cracked color
    }
  }

  triggerBombBlast(bx, by) {
    this.audio.playExplosion();
    const blastRadius = 90;

    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const target = this.bricks[i];
      if (target.isSteel) continue;

      const dist = Math.hypot(target.x + target.w / 2 - bx, target.y + target.h / 2 - by);
      if (dist <= blastRadius) {
        this.damageBrick(target, i);
      }
    }
  }

  handleBallLoss() {
    this.audio.playLifeLost();
    this.lives--;
    this.updateHeartsUI();

    if (this.lives <= 0) {
      this.triggerGameOver(false, "Out of Lives! Keep practicing!");
    } else {
      this.resetBallToPaddle();
    }
  }

  handleLevelVictory() {
    this.audio.playLevelClear();
    this.state = 'CLEAR';

    if (this.currentLevelIndex >= LEVEL_LAYOUTS.length - 1 && this.gameMode === 'classic') {
      // Beat all 10 levels!
      this.triggerGameOver(true, "Congratulations! You crushed all 10 levels!");
    } else {
      this.clearScoreVal.textContent = this.score;
      this.clearMessage.textContent = `Level ${this.currentLevelIndex + 1} Cleared with Style!`;
      this.modalLevelClear.classList.remove('hidden');
    }
  }

  advanceToNextLevel() {
    this.modalLevelClear.classList.add('hidden');
    this.currentLevelIndex++;
    this.loadLevel(this.currentLevelIndex);
  }

  triggerGameOver(isVictory, reason) {
    this.state = 'GAMEOVER';
    clearInterval(this.challengeInterval);

    // Save high score
    const isNewRecord = this.score > this.bestScore;
    if (isNewRecord) {
      this.bestScore = this.score;
      localStorage.setItem('neonbreaker_high', this.bestScore.toString());
      this.newRecordBadge.classList.remove('hidden');
    } else {
      this.newRecordBadge.classList.add('hidden');
    }

    this.gameoverTitle.textContent = isVictory ? "CHAMPION!" : "GAME OVER";
    this.gameoverReason.textContent = reason;
    this.gameoverScoreVal.textContent = this.score;
    this.statBricksBroken.textContent = this.totalBricksBroken;
    this.statHighestLevel.textContent = this.currentLevelIndex + 1;
    this.statBestRecord.textContent = this.bestScore;

    this.modalGameOver.classList.remove('hidden');
  }

  // ==========================================================
  // 6. RENDER LOOP
  // ==========================================================
  loop() {
    this.update();

    // Canvas Clear
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Bricks
    this.bricks.forEach(b => {
      this.ctx.save();
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.isSteel ? '#495057' : b.color;
      this.ctx.shadowBlur = b.isSteel ? 0 : 8;

      // Rounded neon brick
      this.ctx.beginPath();
      this.ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      this.ctx.fill();

      // Top gloss highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      this.ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h * 0.35);

      // Icon for Bomb or Gold
      if (b.isBomb) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💣', b.x + b.w / 2, b.y + b.h * 0.75);
      } else if (b.type === 'gold') {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('★', b.x + b.w / 2, b.y + b.h * 0.75);
      } else if (b.isSteel) {
        this.ctx.fillStyle = '#adb5bd';
        this.ctx.fillRect(b.x + b.w / 2 - 6, b.y + 4, 12, b.h - 8);
      }

      this.ctx.restore();
    });

    // 2. Draw Lasers
    this.lasers.forEach(l => {
      this.ctx.save();
      this.ctx.fillStyle = '#ff007f';
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(l.x, l.y, l.w, l.h);
      this.ctx.restore();
    });

    // 3. Draw Power-Ups
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(14, 20, 36, 0.9)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = '16px "Outfit", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.icon, p.x, p.y + 1);
      this.ctx.restore();
    });

    // 4. Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      this.ctx.restore();
    }

    // 5. Draw Paddle
    this.ctx.save();
    this.ctx.fillStyle = this.paddle.isLaser ? '#ff007f' : '#00f2fe';
    this.ctx.shadowColor = this.paddle.isLaser ? '#ff007f' : '#00f2fe';
    this.ctx.shadowBlur = 14;
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
    this.ctx.fill();

    // Paddle Center Core
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x + this.paddle.width * 0.25, this.paddle.y + 3, this.paddle.width * 0.5, this.paddle.height - 6, 4);
    this.ctx.fill();
    this.ctx.restore();

    // 6. Draw Balls
    this.balls.forEach(b => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.isFire ? '#ff3b00' : '#ffffff';
      this.ctx.shadowColor = b.isFire ? '#ff007f' : '#00f2fe';
      this.ctx.shadowBlur = 16;
      this.ctx.fill();
      this.ctx.restore();
    });

    requestAnimationFrame(this.loop);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.brickGame = new NeonBrickBreaker();
});

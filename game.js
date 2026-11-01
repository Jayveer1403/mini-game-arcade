/**
 * FRUIT BLADE - CORE GAME ENGINE
 * Complete physics, vector geometry slicing, combo system,
 * touch gestures & mouse trails, particle effects and juice splatters.
 */

// ==========================================================
// 1. DATA DEFINITIONS & TYPES
// ==========================================================
const FRUIT_TYPES = [
  {
    type: 'watermelon',
    label: 'Watermelon',
    radius: 46,
    skinColor: '#2b8a3e',
    innerColor: '#ff2a5f',
    seedColor: '#1a1a1a',
    points: 10,
    hasSeeds: true,
    juiceColor: '#ff2a5f',
  },
  {
    type: 'orange',
    label: 'Orange',
    radius: 38,
    skinColor: '#ff922b',
    innerColor: '#ffa94d',
    seedColor: '#ffe066',
    points: 15,
    hasSeeds: false,
    juiceColor: '#ff922b',
  },
  {
    type: 'kiwi',
    label: 'Kiwi',
    radius: 32,
    skinColor: '#8c6747',
    innerColor: '#8ce99a',
    seedColor: '#2b2b2b',
    points: 20,
    hasSeeds: true,
    juiceColor: '#51cf66',
  },
  {
    type: 'lemon',
    label: 'Lemon',
    radius: 34,
    skinColor: '#ffd43b',
    innerColor: '#ffe066',
    seedColor: '#fff3bf',
    points: 15,
    hasSeeds: false,
    juiceColor: '#ffd43b',
  },
  {
    type: 'dragonfruit',
    label: 'Dragon Fruit',
    radius: 42,
    skinColor: '#e64980',
    innerColor: '#f8f9fa',
    seedColor: '#212529',
    points: 30,
    hasSeeds: true,
    juiceColor: '#f783ac',
  },
  {
    type: 'blueberry',
    label: 'Blueberry',
    radius: 28,
    skinColor: '#4263eb',
    innerColor: '#748ffc',
    seedColor: '#364fc7',
    points: 25,
    hasSeeds: false,
    juiceColor: '#4c6ef5',
  }
];

// ==========================================================
// 2. HELPER MATH FUNCTIONS
// ==========================================================
function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return distance(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}

// ==========================================================
// 3. TARGET OBJECTS (FRUITS & BOMBS)
// ==========================================================
class Target {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 15% chance to be a bomb
    this.isBomb = Math.random() < 0.16;

    if (this.isBomb) {
      this.radius = 36;
      this.points = 0;
      this.fusePhase = 0;
    } else {
      const proto = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
      Object.assign(this, proto);
    }

    // Launch Physics
    const spawnMargin = 80;
    this.x = spawnMargin + Math.random() * (canvasWidth - spawnMargin * 2);
    this.y = canvasHeight + this.radius + 10;

    // Arc velocity
    const targetApexX = canvasWidth * 0.2 + Math.random() * (canvasWidth * 0.6);
    const speedX = (targetApexX - this.x) / (35 + Math.random() * 15);
    
    // Vertical velocity calculated to reach roughly top 20%-35% of screen
    const apexY = canvasHeight * 0.15 + Math.random() * (canvasHeight * 0.25);
    const gravity = 0.42;
    const heightDiff = this.y - apexY;
    const speedY = -Math.sqrt(2 * gravity * heightDiff) * (0.95 + Math.random() * 0.1);

    this.vx = speedX;
    this.vy = speedY;
    this.gravity = gravity;

    // Rotation
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.08;

    this.sliced = false;
    this.missed = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.angle += this.rotationSpeed;

    if (this.isBomb) {
      this.fusePhase += 0.2;
    }

    // Check if fallen below screen
    if (this.vy > 0 && this.y > this.canvasHeight + this.radius + 30) {
      return false; // Despawn
    }
    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.isBomb) {
      this.drawBomb(ctx);
    } else {
      this.drawFruit(ctx);
    }

    ctx.restore();
  }

  drawFruit(ctx) {
    const r = this.radius;

    // Soft drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Outer skin
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = this.skinColor;
    ctx.fill();
    ctx.restore();

    // Subtle 3D highlight on peel
    const peelGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    peelGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    peelGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
    peelGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = peelGrad;
    ctx.fill();

    // Stem or top leaf detail
    ctx.beginPath();
    ctx.ellipse(0, -r + 2, 4, 8, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#37b24d';
    ctx.fill();
  }

  drawBomb(ctx) {
    const r = this.radius;

    // Glowing danger aura
    ctx.save();
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 16 + Math.sin(this.fusePhase) * 6;

    // Bomb body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 4, 0, 0, r);
    grad.addColorStop(0, '#495057');
    grad.addColorStop(0.5, '#212529');
    grad.addColorStop(1, '#0b0c10');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Skull or Danger symbol in center
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 2);

    // Fuse connector cap
    ctx.fillStyle = '#868e96';
    ctx.fillRect(-6, -r - 5, 12, 6);

    // Fuse rope curve
    ctx.beginPath();
    ctx.moveTo(0, -r - 5);
    ctx.quadraticCurveTo(8, -r - 18, 16, -r - 14);
    ctx.strokeStyle = '#d9480f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Animated Fuse Spark
    const sparkX = 16;
    const sparkY = -r - 14;
    ctx.save();
    ctx.translate(sparkX, sparkY);
    ctx.fillStyle = '#ffec99';
    ctx.shadowColor = '#ff922b';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 4 + Math.sin(this.fusePhase * 2) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Spark stars
    for (let i = 0; i < 4; i++) {
      const sparkAngle = this.fusePhase + (i * Math.PI) / 2;
      const sx = Math.cos(sparkAngle) * 7;
      const sy = Math.sin(sparkAngle) * 7;
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    }
    ctx.restore();
  }
}

// ==========================================================
// 4. SLICED HALF ENTITIES (FRUIT HALVES FLYING APART)
// ==========================================================
class SlicedHalf {
  constructor(fruit, side, sliceAngle) {
    this.type = fruit.type;
    this.radius = fruit.radius;
    this.skinColor = fruit.skinColor;
    this.innerColor = fruit.innerColor;
    this.seedColor = fruit.seedColor;
    this.hasSeeds = fruit.hasSeeds;

    this.x = fruit.x;
    this.y = fruit.y;
    this.side = side; // -1 (left) or 1 (right)
    this.sliceAngle = sliceAngle;

    // Push halves apart perpendicular to the cut
    const perpAngle = sliceAngle + (Math.PI / 2) * side;
    const burstSpeed = 4.5 + Math.random() * 3.5;
    this.vx = fruit.vx * 0.4 + Math.cos(perpAngle) * burstSpeed;
    this.vy = fruit.vy * 0.4 + Math.sin(perpAngle) * burstSpeed - 2.5;

    this.gravity = 0.52;
    this.angle = fruit.angle;
    this.rotSpeed = side * (0.08 + Math.random() * 0.08);
    this.canvasHeight = fruit.canvasHeight;
    this.opacity = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.angle += this.rotSpeed;

    if (this.y > this.canvasHeight + 100) {
      return false;
    }
    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const r = this.radius;

    ctx.save();
    ctx.beginPath();
    // Clip half circle based on side
    if (this.side === -1) {
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
    } else {
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    }
    ctx.closePath();
    ctx.clip();

    // Peel
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = this.skinColor;
    ctx.fill();

    // Inner juicy pulp
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
    ctx.fillStyle = this.innerColor;
    ctx.fill();

    // Seeds / Core detail
    if (this.hasSeeds) {
      ctx.fillStyle = this.seedColor;
      for (let s = -2; s <= 2; s++) {
        const sx = this.side * (r * 0.35);
        const sy = s * (r * 0.22);
        ctx.beginPath();
        ctx.ellipse(sx, sy, 2, 4, Math.PI / 6 * this.side, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Highlight flat slice face
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}

// ==========================================================
// 5. JUICY PARTICLES & SPLATTERS
// ==========================================================
class JuiceParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5;
    this.size = 3 + Math.random() * 5;
    this.gravity = 0.35;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.03;
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
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class BombExplosionEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.maxRadius = 160;
    this.life = 1.0;
    this.decay = 0.035;
    this.particles = [];

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 7,
        color: ['#ff3366', '#ff922b', '#ffd43b', '#ffffff'][Math.floor(Math.random() * 4)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.18;
    this.life -= this.decay;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    // Shockwave ring
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 8 * this.life;
    ctx.stroke();

    // Center flash
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 146, 43, 0.6)');
    grad.addColorStop(1, 'rgba(255, 51, 102, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    this.particles.forEach(p => {
      if (p.life <= 0) return;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

// Floating Score Popups
class FloatingText {
  constructor(x, y, text, color = '#ffd43b', size = 26) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1.0;
    this.vy = -2.2;
  }

  update() {
    this.y += this.vy;
    this.life -= 0.025;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = `900 ${this.size}px "Outfit", sans-serif`;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ==========================================================
// 6. MAIN GAME ENGINE CONTROLLER
// ==========================================================
class FruitBladeGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // UI elements
    this.scoreValEl = document.getElementById('score-val');
    this.timerValEl = document.getElementById('timer-val');
    this.livesRowEl = document.getElementById('lives-icons');
    this.comboBannerEl = document.getElementById('combo-banner');
    this.comboTextEl = document.getElementById('combo-text');
    this.comboBonusEl = document.getElementById('combo-bonus');
    this.gameToastEl = document.getElementById('game-toast');

    // Modals
    this.modalInstructions = document.getElementById('modal-instructions');
    this.modalPause = document.getElementById('modal-pause');
    this.modalGameOver = document.getElementById('modal-gameover');

    // Summary Elements
    this.pauseScoreEl = document.getElementById('pause-score');
    this.pauseTimeEl = document.getElementById('pause-time');
    this.finalScoreEl = document.getElementById('final-score-val');
    this.statSlicedCountEl = document.getElementById('stat-sliced-count');
    this.statMaxComboEl = document.getElementById('stat-max-combo');
    this.statBestScoreEl = document.getElementById('stat-best-score');
    this.newHighBadgeEl = document.getElementById('new-high-badge');

    // Buttons
    this.btnStart = document.getElementById('btn-start');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPaused = document.getElementById('btn-restart-paused');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnSound = document.getElementById('btn-sound');

    // Game State Variables
    this.gameState = 'INSTRUCTIONS'; // 'INSTRUCTIONS', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.score = 0;
    this.totalTime = 60; // 60 seconds arcade timer
    this.timeLeft = 60;
    this.lives = 3;
    this.maxLives = 3;

    // Statistics
    this.slicedCount = 0;
    this.maxCombo = 0;
    this.highScore = parseInt(localStorage.getItem('fruitblade_highscore') || '0', 10);

    // Dynamic Game Entities
    this.targets = [];
    this.slicedHalves = [];
    this.particles = [];
    this.explosions = [];
    this.floatingTexts = [];

    // Spawning Timing
    this.spawnTimer = 0;
    this.spawnInterval = 75; // Frames between waves

    // Blade / Swipe Trail Tracking
    this.isSwiping = false;
    this.trail = [];
    this.maxTrailPoints = 14;

    // Current swipe combo detector
    this.currentSwipeCutCount = 0;
    this.swipeResetTimer = null;

    // Screen Shake effect
    this.screenShakeTime = 0;

    // Binds
    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    this.setupEventListeners();
    this.updateHeartsUI();

    requestAnimationFrame(this.loop);
  }

  handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  setupEventListeners() {
    // Button Clicks
    this.btnStart.addEventListener('click', () => {
      window.soundSystem.init();
      window.soundSystem.playGameStart();
      this.startGame();
    });

    this.btnPause.addEventListener('click', () => {
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameState === 'PAUSED') {
        this.resumeGame();
      }
    });

    this.btnResume.addEventListener('click', () => this.resumeGame());
    this.btnRestartPaused.addEventListener('click', () => this.startGame());
    this.btnPlayAgain.addEventListener('click', () => this.startGame());

    this.btnSound.addEventListener('click', () => {
      window.soundSystem.init();
      const isSoundOn = window.soundSystem.toggleMute();
      this.btnSound.querySelector('.btn-icon').textContent = isSoundOn ? '🔊' : '🔇';
      this.showToast(isSoundOn ? 'Sound On' : 'Sound Muted');
    });

    // Keyboard Shortcuts (P = Pause, Space = Restart)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.gameState === 'PLAYING') this.pauseGame();
        else if (this.gameState === 'PAUSED') this.resumeGame();
      }
    });

    // POINTER & TOUCH CONTROLS WITH SCROLL SUPPRESSION
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startSwipe = (e) => {
      // Prevent accidental scrolling on mobile while slicing
      if (e.cancelable) e.preventDefault();
      window.soundSystem.init();
      this.isSwiping = true;
      this.trail = [];
      const pos = getPos(e);
      this.addTrailPoint(pos.x, pos.y);
      this.currentSwipeCutCount = 0;
    };

    const moveSwipe = (e) => {
      if (!this.isSwiping) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      this.addTrailPoint(pos.x, pos.y);
      this.checkSliceCollisions();
    };

    const endSwipe = (e) => {
      if (!this.isSwiping) return;
      this.isSwiping = false;
      this.finishSwipeCombo();
    };

    // Canvas Mouse Listeners
    this.canvas.addEventListener('mousedown', startSwipe);
    window.addEventListener('mousemove', moveSwipe);
    window.addEventListener('mouseup', endSwipe);

    // Canvas Touch Listeners with non-passive preventDefault
    this.canvas.addEventListener('touchstart', startSwipe, { passive: false });
    window.addEventListener('touchmove', moveSwipe, { passive: false });
    window.addEventListener('touchend', endSwipe, { passive: false });
    window.addEventListener('touchcancel', endSwipe, { passive: false });
  }

  startGame() {
    this.modalInstructions.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');

    this.score = 0;
    this.timeLeft = this.totalTime;
    this.lives = this.maxLives;
    this.slicedCount = 0;
    this.maxCombo = 0;

    this.targets = [];
    this.slicedHalves = [];
    this.particles = [];
    this.explosions = [];
    this.floatingTexts = [];
    this.trail = [];
    this.spawnTimer = 40;

    this.updateScoreUI();
    this.updateHeartsUI();
    this.updateTimerUI();

    this.gameState = 'PLAYING';

    // Start 1-second interval timer
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.gameInterval = setInterval(() => {
      if (this.gameState === 'PLAYING') {
        this.timeLeft--;
        this.updateTimerUI();
        if (this.timeLeft <= 0) {
          this.triggerGameOver('Time ran out! Fantastic slicing!');
        }
      }
    }, 1000);
  }

  pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.pauseScoreEl.textContent = this.score;
    this.pauseTimeEl.textContent = `${this.timeLeft}s`;
    this.modalPause.classList.remove('hidden');
  }

  resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.modalPause.classList.add('hidden');
    this.gameState = 'PLAYING';
  }

  triggerGameOver(reason = 'Game Over!') {
    this.gameState = 'GAMEOVER';
    if (this.gameInterval) clearInterval(this.gameInterval);

    window.soundSystem.playGameOver();

    // High score check
    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('fruitblade_highscore', this.highScore.toString());
    }

    // Populate modal
    document.getElementById('gameover-reason').textContent = reason;
    this.finalScoreEl.textContent = this.score;
    this.statSlicedCountEl.textContent = this.slicedCount;
    this.statMaxComboEl.textContent = `${this.maxCombo}x`;
    this.statBestScoreEl.textContent = this.highScore;

    if (isNewHigh && this.score > 0) {
      this.newHighBadgeEl.classList.remove('hidden');
    } else {
      this.newHighBadgeEl.classList.add('hidden');
    }

    this.modalGameOver.classList.remove('hidden');
  }

  addTrailPoint(x, y) {
    this.trail.push({ x, y, age: 0 });
    if (this.trail.length > this.maxTrailPoints) {
      this.trail.shift();
    }
  }

  checkSliceCollisions() {
    if (this.gameState !== 'PLAYING' || this.trail.length < 2) return;

    const p1 = this.trail[this.trail.length - 2];
    const p2 = this.trail[this.trail.length - 1];

    // Whoosh audio check
    const strokeDist = distance(p1.x, p1.y, p2.x, p2.y);
    if (strokeDist > 24) {
      window.soundSystem.playSwoosh();
    }

    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      if (target.sliced) continue;

      const d = distToSegment(target.x, target.y, p1.x, p1.y, p2.x, p2.y);
      if (d < target.radius * 0.95) {
        // HIT!
        target.sliced = true;
        this.targets.splice(i, 1);

        if (target.isBomb) {
          // BOMB DETONATION!
          this.handleBombHit(target);
        } else {
          // FRUIT SLICED!
          this.handleFruitCut(target, cutAngle);
        }
      }
    }
  }

  handleFruitCut(fruit, cutAngle) {
    this.slicedCount++;
    this.currentSwipeCutCount++;

    // Audio & Pitch scaling
    const pitch = 0.9 + Math.min(this.currentSwipeCutCount * 0.15, 1.8);
    window.soundSystem.playSlice(pitch);

    // Split fruit into two halves
    this.slicedHalves.push(new SlicedHalf(fruit, -1, cutAngle));
    this.slicedHalves.push(new SlicedHalf(fruit, 1, cutAngle));

    // Splatter particles
    for (let i = 0; i < 18; i++) {
      this.particles.push(new JuiceParticle(fruit.x, fruit.y, fruit.juiceColor));
    }

    // Points
    const pts = fruit.points;
    this.score += pts;
    this.updateScoreUI();

    // Floating text
    this.floatingTexts.push(new FloatingText(fruit.x, fruit.y - 10, `+${pts}`, '#fff', 24));
  }

  handleBombHit(bomb) {
    window.soundSystem.playBomb();
    this.screenShakeTime = 22; // Trigger intense screen shake

    // Explosion visual effect
    this.explosions.push(new BombExplosionEffect(bomb.x, bomb.y));

    // Floating alert
    this.floatingTexts.push(new FloatingText(bomb.x, bomb.y - 20, 'BOOM! 💥', '#ff3366', 32));

    this.lives--;
    this.updateHeartsUI();

    if (this.lives <= 0) {
      setTimeout(() => {
        this.triggerGameOver('BOOM! You sliced a lethal bomb!');
      }, 350);
    } else {
      this.showToast(`Bomb Exploded! ${this.lives} ${this.lives === 1 ? 'Life' : 'Lives'} Left!`);
    }
  }

  finishSwipeCombo() {
    if (this.currentSwipeCutCount >= 3) {
      // 3 or more fruits cut in a single swipe stroke!
      const combo = this.currentSwipeCutCount;
      const bonusPts = combo * 15;
      this.score += bonusPts;
      this.updateScoreUI();

      if (combo > this.maxCombo) {
        this.maxCombo = combo;
      }

      window.soundSystem.playCombo(combo);
      this.showComboBanner(combo, bonusPts);
    }
    this.currentSwipeCutCount = 0;
  }

  showComboBanner(combo, bonus) {
    this.comboTextEl.textContent = `${combo}x COMBO!`;
    this.comboBonusEl.textContent = `+${bonus} BONUS PTS`;
    this.comboBannerEl.classList.remove('hidden');

    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboBannerEl.classList.add('hidden');
    }, 700);
  }

  showToast(msg) {
    this.gameToastEl.textContent = msg;
    this.gameToastEl.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.gameToastEl.classList.add('hidden');
    }, 1800);
  }

  updateScoreUI() {
    this.scoreValEl.textContent = this.score;
  }

  updateTimerUI() {
    this.timerValEl.textContent = `${this.timeLeft}s`;
    if (this.timeLeft <= 10) {
      this.timerValEl.style.color = '#ff3366';
    } else {
      this.timerValEl.style.color = '';
    }
  }

  updateHeartsUI() {
    const hearts = this.livesRowEl.querySelectorAll('.heart');
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

  spawnWave() {
    // Dynamic difficulty: spawn 2-4 items at once depending on progress
    const itemsCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < itemsCount; i++) {
      this.targets.push(new Target(this.width, this.height));
    }
  }

  // ==========================================================
  // 7. RENDER & UPDATE LOOP
  // ==========================================================
  loop() {
    // Canvas Clear
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Apply Screen Shake
    if (this.screenShakeTime > 0) {
      this.screenShakeTime--;
      const shakeX = (Math.random() - 0.5) * 14;
      const shakeY = (Math.random() - 0.5) * 14;
      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);
    }

    if (this.gameState === 'PLAYING') {
      // Wave Spawning
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnWave();
        this.spawnTimer = 0;
        // Accelerate slightly over time
        this.spawnInterval = Math.max(45, 75 - Math.floor((60 - this.timeLeft) * 0.5));
      }

      // Update Targets
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const alive = this.targets[i].update();
        if (!alive) {
          // If a non-bomb fruit falls off un-sliced, deduct a life
          if (!this.targets[i].isBomb && !this.targets[i].sliced) {
            this.handleMissedFruit();
          }
          this.targets.splice(i, 1);
        }
      }

      // Update Halves
      for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
        const alive = this.slicedHalves[i].update();
        if (!alive) this.slicedHalves.splice(i, 1);
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const alive = this.particles[i].update();
        if (!alive) this.particles.splice(i, 1);
      }

      // Update Explosions
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const alive = this.explosions[i].update();
        if (!alive) this.explosions.splice(i, 1);
      }

      // Update Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const alive = this.floatingTexts[i].update();
        if (!alive) this.floatingTexts.splice(i, 1);
      }
    }

    // DRAW ENTITIES
    // 1. Sliced Halves
    this.slicedHalves.forEach(h => h.draw(this.ctx));

    // 2. Active Targets
    this.targets.forEach(t => t.draw(this.ctx));

    // 3. Particles & Juices
    this.particles.forEach(p => p.draw(this.ctx));

    // 4. Explosions
    this.explosions.forEach(exp => exp.draw(this.ctx));

    // 5. Floating Text Scores
    this.floatingTexts.forEach(ft => ft.draw(this.ctx));

    // 6. Blade Swipe Trail
    this.drawBladeTrail();

    if (this.screenShakeTime > 0) {
      this.ctx.restore();
    }

    requestAnimationFrame(this.loop);
  }

  handleMissedFruit() {
    this.lives--;
    this.updateHeartsUI();
    window.soundSystem.playMiss();
    if (this.lives <= 0) {
      this.triggerGameOver('3 Fruits missed! Keep your blade sharp!');
    }
  }

  drawBladeTrail() {
    // Fade trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].age += 1;
    }
    this.trail = this.trail.filter(pt => pt.age < 12);

    if (this.trail.length < 2) return;

    this.ctx.save();
    // Neon Blade Glow
    for (let i = 1; i < this.trail.length; i++) {
      const p1 = this.trail[i - 1];
      const p2 = this.trail[i];
      const progress = i / this.trail.length;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);

      // Outer vibrant glow
      this.ctx.strokeStyle = `rgba(0, 242, 254, ${progress * 0.85})`;
      this.ctx.lineWidth = progress * 10;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();

      // Inner sharp core
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${progress})`;
      this.ctx.lineWidth = progress * 4;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}

// Expose to window for testing / global access
window.FruitBladeGame = FruitBladeGame;

// Start game instance on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new FruitBladeGame();
});

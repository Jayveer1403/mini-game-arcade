(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('snakeretro_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playEat() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playGold() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [587, 880, 1174];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.12);
      });
    }

    playCrash() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    playTurn() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('snakeretro_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Grid Configuration
  const GRID_SIZE = 20;

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-val');
  const lengthEl = document.getElementById('length-val');
  const applesEl = document.getElementById('apples-val');

  const modalStart = document.getElementById('modal-start');
  const modalPause = document.getElementById('modal-pause');
  const modalGameOver = document.getElementById('modal-gameover');

  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnPauseRestart = document.getElementById('btn-pause-restart');
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');

  const startBestScore = document.getElementById('start-best-score');
  const finalScore = document.getElementById('final-score');
  const finalLength = document.getElementById('final-length');
  const finalApples = document.getElementById('final-apples');
  const finalBest = document.getElementById('final-best');
  const gameoverReason = document.getElementById('gameover-reason');

  // D-Pad buttons
  const dpadUp = document.getElementById('dpad-up');
  const dpadDown = document.getElementById('dpad-down');
  const dpadLeft = document.getElementById('dpad-left');
  const dpadRight = document.getElementById('dpad-right');

  // State
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('snakeretro_best_score') || '0', 10);

  let score = 0;
  let applesCount = 0;
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };

  let apple = { x: 5, y: 5 };
  let goldenApple = null; // { x, y, timeLeft: 300 }
  let applesEatenSinceGold = 0;

  let moveTimer = 0;
  let moveInterval = 120; // ms per grid step
  let lastTime = 0;
  let particles = [];

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resizeCanvas);

  function spawnFood() {
    let valid = false;
    let newApple;
    while (!valid) {
      newApple = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      valid = !snake.some(segment => segment.x === newApple.x && segment.y === newApple.y);
      if (goldenApple && newApple.x === goldenApple.x && newApple.y === goldenApple.y) valid = false;
    }
    return newApple;
  }

  function spawnGoldenApple() {
    let valid = false;
    let pos;
    while (!valid) {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        timeLeft: 360 // ~6 seconds at 60fps
      };
      valid = !snake.some(s => s.x === pos.x && s.y === pos.y) &&
              !(apple.x === pos.x && apple.y === pos.y);
    }
    goldenApple = pos;
  }

  function initGame() {
    score = 0;
    applesCount = 0;
    applesEatenSinceGold = 0;
    goldenApple = null;
    particles = [];

    const mid = Math.floor(GRID_SIZE / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid }
    ];

    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    moveInterval = 130;
    apple = spawnFood();

    scoreEl.textContent = '0';
    lengthEl.textContent = snake.length;
    applesEl.textContent = '🍎 0';
  }

  function spawnBurst(gx, gy, color, count = 8) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;
    const px = (gx + 0.5) * cellSize;
    const py = (gy + 0.5) * cellSize;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x: px, y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function gameOver(reason) {
    gameState = 'GAMEOVER';
    sound.playCrash();

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('snakeretro_best_score', bestScore);
    }

    gameoverReason.textContent = reason;
    finalScore.textContent = score;
    finalLength.textContent = snake.length;
    finalApples.textContent = applesCount;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function changeDirection(dx, dy) {
    if (gameState !== 'PLAYING') return;
    // Prevent 180 reverse turns
    if (dx !== 0 && dir.x !== 0) return;
    if (dy !== 0 && dir.y !== 0) return;

    nextDir = { x: dx, y: dy };
    sound.playTurn();
  }

  function update(deltaTime) {
    if (gameState !== 'PLAYING') return;

    // Golden apple timer
    if (goldenApple) {
      goldenApple.timeLeft--;
      if (goldenApple.timeLeft <= 0) {
        goldenApple = null;
      }
    }

    // Step motion
    moveTimer += deltaTime;
    if (moveTimer >= moveInterval) {
      moveTimer = 0;
      dir = nextDir;

      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver('You crashed straight into the perimeter wall!');
        return;
      }

      // Self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver('You coiled into your own tail!');
        return;
      }

      snake.unshift(head);

      // Check apple collision
      if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        applesCount++;
        applesEatenSinceGold++;
        sound.playEat();
        spawnBurst(head.x, head.y, '#ef4444', 10);

        apple = spawnFood();
        // Speed up slightly
        moveInterval = Math.max(75, 130 - Math.floor(snake.length * 1.5));

        if (applesEatenSinceGold >= 5 && !goldenApple) {
          applesEatenSinceGold = 0;
          spawnGoldenApple();
        }
      } else if (goldenApple && head.x === goldenApple.x && head.y === goldenApple.y) {
        score += 50;
        sound.playGold();
        spawnBurst(head.x, head.y, '#eab308', 16);
        goldenApple = null;
      } else {
        snake.pop(); // Remove tail if no food eaten
      }

      scoreEl.textContent = score;
      lengthEl.textContent = snake.length;
      applesEl.textContent = `🍎 ${applesCount}`;
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const cellSize = size / GRID_SIZE;

    ctx.clearRect(0, 0, size, size);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Normal Apple
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    const ax = (apple.x + 0.5) * cellSize;
    const ay = (apple.y + 0.5) * cellSize;
    ctx.beginPath();
    ctx.arc(ax, ay, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(ax + 2, ay - cellSize * 0.4, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Golden Apple
    if (goldenApple) {
      ctx.save();
      const blink = goldenApple.timeLeft < 100 ? (Math.floor(goldenApple.timeLeft / 8) % 2 === 0) : true;
      if (blink) {
        ctx.fillStyle = '#eab308';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 16;
        const gx = (goldenApple.x + 0.5) * cellSize;
        const gy = (goldenApple.y + 0.5) * cellSize;
        ctx.beginPath();
        ctx.arc(gx, gy, cellSize * 0.44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - 2, gy - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Snake Body
    snake.forEach((seg, index) => {
      ctx.save();
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;

      if (index === 0) {
        // Head
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#064e3b';
        const eyeOffset = cellSize * 0.25;
        let eye1 = { x: sx + cellSize * 0.5 + dir.y * eyeOffset, y: sy + cellSize * 0.5 - dir.x * eyeOffset };
        let eye2 = { x: sx + cellSize * 0.5 - dir.y * eyeOffset, y: sy + cellSize * 0.5 + dir.x * eyeOffset };
        eye1.x += dir.x * eyeOffset;
        eye1.y += dir.y * eyeOffset;
        eye2.x += dir.x * eyeOffset;
        eye2.y += dir.y * eyeOffset;

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segments
        const alpha = Math.max(0.4, 1 - (index / snake.length) * 0.6);
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3, 4);
        ctx.fill();
      }
      ctx.restore();
    });

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function gameLoop(time) {
    const deltaTime = time - lastTime;
    lastTime = time;
    update(deltaTime || 16);
    render();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    sound.init();
    gameState = 'PLAYING';
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    initGame();
  }

  function pauseGame() {
    if (gameState !== 'PLAYING') return;
    gameState = 'PAUSED';
    modalPause.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'PAUSED') return;
    gameState = 'PLAYING';
    modalPause.classList.add('hidden');
  }

  // Event Listeners
  btnStart.addEventListener('click', startGame);
  btnResume.addEventListener('click', resumeGame);
  btnRestart.addEventListener('click', startGame);
  btnPauseRestart.addEventListener('click', startGame);
  btnPause.addEventListener('click', () => {
    if (gameState === 'PLAYING') pauseGame();
    else if (gameState === 'PAUSED') resumeGame();
  });

  btnSound.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      changeDirection(0, -1);
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      changeDirection(0, 1);
    } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      e.preventDefault();
      changeDirection(-1, 0);
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      changeDirection(1, 0);
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Mobile D-Pad listeners
  dpadUp.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection(0, -1); });
  dpadDown.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection(0, 1); });
  dpadLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection(-1, 0); });
  dpadRight.addEventListener('pointerdown', (e) => { e.preventDefault(); changeDirection(1, 0); });

  // Swipe detection
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 30) changeDirection(1, 0);
      else if (diffX < -30) changeDirection(-1, 0);
    } else {
      if (diffY > 30) changeDirection(0, 1);
      else if (diffY < -30) changeDirection(0, -1);
    }
  }, { passive: true });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  requestAnimationFrame(gameLoop);
})();

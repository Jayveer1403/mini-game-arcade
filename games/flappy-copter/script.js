(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('flappycopter_muted') === 'true';
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

    playThrust() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playScore() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.setValueAtTime(780, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }

    playCrash() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('flappycopter_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-val');
  const medalEl = document.getElementById('medal-val');

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
  const finalMedal = document.getElementById('final-medal');
  const finalBest = document.getElementById('final-best');
  const finalThrusts = document.getElementById('final-thrusts');
  const gameoverReason = document.getElementById('gameover-reason');

  // Game state
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('flappycopter_best_score') || '0', 10);

  let score = 0;
  let thrustCount = 0;
  let rotorPhase = 0;

  const copter = {
    x: 80,
    y: 200,
    vy: 0,
    gravity: 0.35,
    lift: -6.8,
    width: 32,
    height: 22,
    rot: 0
  };

  let pipes = [];
  let particles = [];
  let nextPipeTimer = 0;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    copter.x = rect.width * 0.25;
  }

  window.addEventListener('resize', resizeCanvas);

  function getMedal(s) {
    if (s >= 100) return '💎 Platinum';
    if (s >= 50) return '🥇 Gold';
    if (s >= 25) return '🥈 Silver';
    if (s >= 10) return '🥉 Bronze';
    return 'None';
  }

  function spawnPipe() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const gap = Math.max(120, 150 - Math.floor(score * 0.8));
    const minHeight = 50;
    const maxHeight = rect.height - gap - minHeight;
    const topHeight = minHeight + Math.random() * (maxHeight - minHeight);

    pipes.push({
      x: rect.width + 20,
      width: 52,
      topHeight,
      bottomY: topHeight + gap,
      passed: false
    });
  }

  function initGame() {
    const rect = canvas.parentElement.getBoundingClientRect();
    score = 0;
    thrustCount = 0;
    copter.y = rect.height * 0.4;
    copter.vy = 0;
    copter.rot = 0;
    pipes = [];
    particles = [];
    nextPipeTimer = 30;

    scoreEl.textContent = '0';
    medalEl.textContent = '🥉 None';
  }

  function thrust() {
    if (gameState !== 'PLAYING') return;
    copter.vy = copter.lift;
    thrustCount++;
    sound.playThrust();

    // Thruster exhaust particles
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: copter.x - 16,
        y: copter.y + 6,
        vx: -3 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        color: Math.random() > 0.5 ? '#f97316' : '#a855f7',
        size: 3 + Math.random() * 3
      });
    }
  }

  function spawnSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 2.5 + Math.random() * 3
      });
    }
  }

  function gameOver(reason) {
    gameState = 'GAMEOVER';
    sound.playCrash();
    spawnSparks(copter.x, copter.y, '#f43f5e', 24);

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('flappycopter_best_score', bestScore);
    }

    gameoverReason.textContent = reason;
    finalScore.textContent = score;
    finalMedal.textContent = getMedal(score);
    finalBest.textContent = bestScore;
    finalThrusts.textContent = thrustCount;

    modalGameOver.classList.remove('hidden');
  }

  function update() {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.parentElement.getBoundingClientRect();

    // Copter physics
    copter.vy += copter.gravity;
    copter.y += copter.vy;

    // Rotation angle
    if (copter.vy < 0) {
      copter.rot = Math.max(-0.4, copter.rot - 0.1);
    } else {
      copter.rot = Math.min(1.1, copter.rot + 0.04);
    }
    rotorPhase += 0.8;

    // Ceiling / Floor collision
    if (copter.y - copter.height / 2 <= 0) {
      copter.y = copter.height / 2;
      copter.vy = 0;
    } else if (copter.y + copter.height / 2 >= rect.height - 10) {
      gameOver('Crash landed on the floor grid!');
      return;
    }

    // Pipe generation
    nextPipeTimer--;
    if (nextPipeTimer <= 0) {
      spawnPipe();
      nextPipeTimer = 85;
    }

    // Move pipes
    const pipeSpeed = 2.6;
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;

      // Score check
      if (!p.passed && p.x + p.width < copter.x) {
        p.passed = true;
        score++;
        scoreEl.textContent = score;
        medalEl.textContent = getMedal(score);
        sound.playScore();
        spawnSparks(copter.x, copter.y, '#38bdf8', 8);
      }

      // Collision check
      const cx = copter.x;
      const cy = copter.y;
      const hitRadius = 12;

      // Top pipe box: [p.x, 0, p.width, p.topHeight]
      const hitTop = (cx + hitRadius > p.x && cx - hitRadius < p.x + p.width && cy - hitRadius < p.topHeight);
      // Bottom pipe box: [p.x, p.bottomY, p.width, rect.height - p.bottomY]
      const hitBottom = (cx + hitRadius > p.x && cx - hitRadius < p.x + p.width && cy + hitRadius > p.bottomY);

      if (hitTop || hitBottom) {
        gameOver('Struck an energized laser barrier!');
        return;
      }

      // Clean off-screen pipes
      if (p.x + p.width < -20) {
        pipes.splice(i, 1);
      }
    }

    // Particle update
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Grid Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, rect.height - 10, rect.width, 10);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, rect.height - 10);
    ctx.lineTo(rect.width, rect.height - 10);
    ctx.stroke();

    // Pipes / Laser Barriers
    pipes.forEach(p => {
      ctx.save();

      // Top Barrier
      const gradTop = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      gradTop.addColorStop(0, '#6366f1');
      gradTop.addColorStop(0.5, '#a855f7');
      gradTop.addColorStop(1, '#4338ca');
      ctx.fillStyle = gradTop;
      ctx.fillRect(p.x, 0, p.width, p.topHeight);

      // Top Barrier Cap
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - 3, p.topHeight - 12, p.width + 6, 12);
      ctx.shadowBlur = 0;

      // Bottom Barrier
      const gradBot = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      gradBot.addColorStop(0, '#6366f1');
      gradBot.addColorStop(0.5, '#a855f7');
      gradBot.addColorStop(1, '#4338ca');
      ctx.fillStyle = gradBot;
      ctx.fillRect(p.x, p.bottomY, p.width, rect.height - p.bottomY);

      // Bottom Barrier Cap
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 12);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // Particles
    particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Copter
    ctx.save();
    ctx.translate(copter.x, copter.y);
    ctx.rotate(copter.rot);

    // Copter Body
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 20, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cockpit window
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(6, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Tail boom
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(-24, -3, 10, 5);
    ctx.fillRect(-26, -8, 4, 12);

    // Top Rotor Mast & Blade
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2, -14, 4, 5);
    const bladeW = Math.cos(rotorPhase) * 26;
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillRect(-bladeW / 2, -16, bladeW, 3);
    ctx.shadowBlur = 0;

    // Landing skids
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 10); ctx.lineTo(-10, 13);
    ctx.moveTo(8, 10); ctx.lineTo(8, 13);
    ctx.moveTo(-14, 13); ctx.lineTo(14, 13);
    ctx.stroke();

    ctx.restore();
  }

  function gameLoop() {
    update();
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

  // Action input: Click / Pointer / Space
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') thrust();
    else if (gameState === 'START') startGame();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === 'PLAYING') thrust();
      else if (gameState === 'START') startGame();
      else if (gameState === 'GAMEOVER') startGame();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  gameLoop();
})();

(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('aimtrainer_muted') === 'true';
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

    playBullseye() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1760, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    playHit() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playMiss() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('aimtrainer_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-val');
  const timeEl = document.getElementById('time-val');
  const accEl = document.getElementById('acc-val');

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
  const finalAcc = document.getElementById('final-acc');
  const finalLatency = document.getElementById('final-latency');
  const finalBest = document.getElementById('final-best');

  // Game state
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('aimtrainer_best_score') || '0', 10);

  let score = 0;
  let timeLeft = 30;
  let totalClicks = 0;
  let hits = 0;
  let latencies = [];

  let targets = [];
  let particles = [];
  let clockTimer = null;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resizeCanvas);

  function spawnTarget() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const radius = 24;
    const padding = 50;

    let valid = false;
    let x, y;
    let tries = 0;
    while (!valid && tries < 30) {
      x = padding + Math.random() * (rect.width - padding * 2);
      y = padding + Math.random() * (rect.height - padding * 2);
      valid = targets.every(t => Math.hypot(t.x - x, t.y - y) > radius * 2.8);
      tries++;
    }

    return {
      x,
      y,
      radius,
      spawnTime: Date.now(),
      pulse: 0
    };
  }

  function spawnBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function handleClick(clientX, clientY) {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    totalClicks++;
    let hitIndex = -1;
    let isBullseye = false;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const dist = Math.hypot(clickX - t.x, clickY - t.y);
      if (dist <= t.radius) {
        hitIndex = i;
        if (dist <= t.radius * 0.35) {
          isBullseye = true;
        }
        break;
      }
    }

    if (hitIndex !== -1) {
      hits++;
      const t = targets[hitIndex];
      const latency = Date.now() - t.spawnTime;
      latencies.push(latency);

      if (isBullseye) {
        score += 150;
        sound.playBullseye();
        spawnBurst(t.x, t.y, '#facc15', 16);
      } else {
        score += 100;
        sound.playHit();
        spawnBurst(t.x, t.y, '#ec4899', 10);
      }

      targets.splice(hitIndex, 1);
      targets.push(spawnTarget());
    } else {
      sound.playMiss();
    }

    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    timeEl.textContent = `${timeLeft}s`;
    const acc = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
    accEl.textContent = `${acc}%`;
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    clearInterval(clockTimer);

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('aimtrainer_best_score', bestScore);
    }

    const acc = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    finalScore.textContent = score;
    finalAcc.textContent = `${acc}%`;
    finalLatency.textContent = `${avgLatency}ms`;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    score = 0;
    timeLeft = 30;
    totalClicks = 0;
    hits = 0;
    latencies = [];
    particles = [];
    targets = [];

    for (let i = 0; i < 3; i++) {
      targets.push(spawnTarget());
    }

    updateHUD();
    clearInterval(clockTimer);

    clockTimer = setInterval(() => {
      if (gameState === 'PLAYING') {
        timeLeft--;
        timeEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
          gameOver();
        }
      }
    }, 1000);
  }

  function update() {
    if (gameState !== 'PLAYING') return;

    // Target pulse animation
    targets.forEach(t => {
      t.pulse += 0.06;
    });

    // Particle updates
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
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Subtle cross grid
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Targets
    targets.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);

      // Outer glow ring
      const scale = 1 + Math.sin(t.pulse) * 0.04;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner White Ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, t.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Dead Center Bullseye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, t.radius * 0.32, 0, Math.PI * 2);
      ctx.fill();

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

  canvas.addEventListener('pointerdown', (e) => {
    handleClick(e.clientX, e.clientY);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
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

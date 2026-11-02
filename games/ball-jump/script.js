(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('balljump_muted') === 'true';
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

    playBounce() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playSpring() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }

    playGem() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.setValueAtTime(980, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }

    playBreak() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    playFall() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('balljump_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-val');
  const gemsEl = document.getElementById('gems-val');

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
  const finalGems = document.getElementById('final-gems');
  const finalSprings = document.getElementById('final-springs');
  const finalBest = document.getElementById('final-best');

  // Game state
  let gameState = 'START';
  let bestAltitude = parseInt(localStorage.getItem('balljump_best_alt') || '0', 10);

  let cameraY = 0;
  let maxAltitude = 0;
  let gemsCount = 0;
  let springsHit = 0;

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    color: '#38bdf8'
  };

  const keys = { left: false, right: false };
  let platforms = [];
  let particles = [];
  let nextPlatformY = 0;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resizeCanvas);

  function spawnPlatform(y) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = 68;
    const height = 14;
    const x = Math.random() * (rect.width - width);

    // Platform types
    const r = Math.random();
    let type = 'standard';
    let vx = 0;
    let hasSpring = false;
    let hasGem = false;

    if (maxAltitude > 50 && r < 0.28) {
      type = 'moving';
      vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.min(2.5, maxAltitude * 0.005));
    } else if (maxAltitude > 30 && r < 0.45) {
      type = 'fragile';
    }

    if (type !== 'fragile') {
      if (Math.random() < 0.12) hasSpring = true;
      else if (Math.random() < 0.2) hasGem = true;
    }

    platforms.push({
      x,
      y,
      width,
      height,
      type,
      vx,
      broken: false,
      hasSpring,
      springCoiled: false,
      hasGem,
      gemCollected: false
    });
  }

  function initGame() {
    const rect = canvas.parentElement.getBoundingClientRect();
    cameraY = 0;
    maxAltitude = 0;
    gemsCount = 0;
    springsHit = 0;
    platforms = [];
    particles = [];

    player.x = rect.width / 2;
    player.y = rect.height - 120;
    player.vx = 0;
    player.vy = -10;

    // Base start platform right below player
    platforms.push({
      x: rect.width / 2 - 45,
      y: rect.height - 60,
      width: 90,
      height: 14,
      type: 'standard',
      vx: 0,
      broken: false,
      hasSpring: false,
      springCoiled: false,
      hasGem: false,
      gemCollected: false
    });

    nextPlatformY = rect.height - 130;
    while (nextPlatformY > -rect.height) {
      spawnPlatform(nextPlatformY);
      nextPlatformY -= 55 + Math.random() * 25;
    }

    scoreEl.textContent = '0m';
    gemsEl.textContent = '💎 0';
  }

  function spawnBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
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

  function gameOver() {
    gameState = 'GAMEOVER';
    sound.playFall();

    if (maxAltitude > bestAltitude) {
      bestAltitude = maxAltitude;
      localStorage.setItem('balljump_best_alt', bestAltitude);
    }

    finalScore.textContent = `${maxAltitude}m`;
    finalGems.textContent = gemsCount;
    finalSprings.textContent = springsHit;
    finalBest.textContent = `${bestAltitude}m`;

    modalGameOver.classList.remove('hidden');
  }

  function update() {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.parentElement.getBoundingClientRect();

    // Input steering
    const moveSpeed = 0.8;
    if (keys.left) player.vx -= moveSpeed;
    if (keys.right) player.vx += moveSpeed;
    player.vx *= 0.88; // friction

    player.x += player.vx;
    player.vy += 0.38; // gravity
    player.y += player.vy;

    // Screen wrap
    if (player.x < -player.radius) player.x = rect.width + player.radius;
    if (player.x > rect.width + player.radius) player.x = -player.radius;

    // Platform collisions (only when moving downwards)
    if (player.vy > 0) {
      for (const p of platforms) {
        if (p.broken) continue;

        // Check if player feet hit top edge of platform
        const feetY = player.y + player.radius;
        const prevFeetY = feetY - player.vy;

        if (prevFeetY <= p.y + 4 && feetY >= p.y - 4 &&
            player.x + player.radius * 0.6 >= p.x &&
            player.x - player.radius * 0.6 <= p.x + p.width) {

          if (p.type === 'fragile') {
            p.broken = true;
            sound.playBreak();
            spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#fb923c', 10);
            player.vy = -7; // small weak bounce
          } else if (p.hasSpring && !p.springCoiled) {
            p.springCoiled = true;
            player.vy = -18.5; // super spring bounce
            springsHit++;
            sound.playSpring();
            spawnBurst(p.x + p.width / 2, p.y, '#38bdf8', 14);
          } else {
            player.vy = -11.5; // normal bounce
            sound.playBounce();
            spawnBurst(player.x, feetY, '#38bdf8', 6);
          }
          break;
        }
      }
    }

    // Gem pickup
    platforms.forEach(p => {
      if (p.hasGem && !p.gemCollected) {
        const gx = p.x + p.width / 2;
        const gy = p.y - 14;
        const dist = Math.hypot(player.x - gx, player.y - gy);
        if (dist < player.radius + 12) {
          p.gemCollected = true;
          gemsCount++;
          gemsEl.textContent = `💎 ${gemsCount}`;
          sound.playGem();
          spawnBurst(gx, gy, '#a855f7', 12);
        }
      }
    });

    // Update moving platforms
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.vx;
        if (p.x <= 0 || p.x + p.width >= rect.width) {
          p.vx = -p.vx;
        }
      }
    });

    // Camera scrolling (smoothly track player when rising above midpoint)
    const midY = rect.height * 0.45;
    if (player.y < midY) {
      const diff = midY - player.y;
      player.y = midY;
      cameraY += diff;

      // Move all platforms down
      platforms.forEach(p => { p.y += diff; });
      particles.forEach(pt => { pt.y += diff; });
      nextPlatformY += diff;

      const currentAlt = Math.floor(cameraY / 10);
      if (currentAlt > maxAltitude) {
        maxAltitude = currentAlt;
        scoreEl.textContent = `${maxAltitude}m`;
      }
    }

    // Spawn new platforms as camera scrolls up
    while (nextPlatformY > -60) {
      spawnPlatform(nextPlatformY);
      nextPlatformY -= 55 + Math.random() * 30;
    }

    // Clean up platforms that have fallen off bottom
    platforms = platforms.filter(p => p.y < rect.height + 80);

    // Particle updates
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.03;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Check fall off bottom
    if (player.y - player.radius > rect.height) {
      gameOver();
    }
  }

  function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw background stars / grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 123 + 45) % rect.width);
      const sy = ((i * 231 + cameraY * 0.2) % rect.height);
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Draw platforms
    platforms.forEach(p => {
      if (p.broken) return;

      ctx.save();
      if (p.type === 'standard') {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
        ctx.shadowBlur = 8;
      } else if (p.type === 'moving') {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        ctx.shadowBlur = 10;
      } else if (p.type === 'fragile') {
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 7);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Platform details
      if (p.type === 'fragile') {
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x + 15, p.y + 2);
        ctx.lineTo(p.x + 25, p.y + 12);
        ctx.lineTo(p.x + 40, p.y + 4);
        ctx.stroke();
      }

      // Spring
      if (p.hasSpring) {
        ctx.fillStyle = '#e2e8f0';
        const sx = p.x + p.width / 2;
        const sy = p.y - (p.springCoiled ? 4 : 10);
        ctx.fillRect(sx - 6, sy, 12, p.springCoiled ? 4 : 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx - 8, sy - 3, 16, 3);
      }

      // Gem
      if (p.hasGem && !p.gemCollected) {
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 8;
        const gx = p.x + p.width / 2;
        const gy = p.y - 12;
        ctx.beginPath();
        ctx.moveTo(gx, gy - 7);
        ctx.lineTo(gx + 6, gy);
        ctx.lineTo(gx, gy + 7);
        ctx.lineTo(gx - 6, gy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

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

    // Draw Player Ball
    if (gameState === 'PLAYING') {
      ctx.save();
      ctx.translate(player.x, player.y);

      // Glowing ball
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, player.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;

      // Squash and stretch based on velocity
      const stretch = Math.min(1.3, Math.max(0.7, 1 - player.vy * 0.02));
      const squash = 1 / stretch;
      ctx.scale(squash, stretch);

      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cute eyes
      ctx.fillStyle = '#0f172a';
      const lookDir = Math.sign(player.vx) || 1;
      ctx.beginPath();
      ctx.arc(lookDir * 4 - 3, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(lookDir * 4 + 3, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
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

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });

  // Touch / Mouse dragging steer
  let pointerDown = false;
  canvas.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < player.x) {
      keys.left = true;
      keys.right = false;
    } else {
      keys.right = true;
      keys.left = false;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < player.x - 10) {
      keys.left = true;
      keys.right = false;
    } else if (clickX > player.x + 10) {
      keys.right = true;
      keys.left = false;
    } else {
      keys.left = false;
      keys.right = false;
    }
  });

  window.addEventListener('pointerup', () => {
    pointerDown = false;
    keys.left = false;
    keys.right = false;
  });

  // Init
  startBestScore.textContent = `${bestAltitude}m`;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  gameLoop();
})();

(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('spaceshooter_muted') === 'true';
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

    playLaser() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playHit() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playExplosion() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    playPowerup() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [400, 600, 800, 1200].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.1);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('spaceshooter_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-val');
  const waveEl = document.getElementById('wave-val');
  const livesEl = document.getElementById('lives-val');

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
  const finalWave = document.getElementById('final-wave');
  const finalKills = document.getElementById('final-kills');
  const finalBest = document.getElementById('final-best');
  const gameoverReason = document.getElementById('gameover-reason');

  // Game state
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('spaceshooter_best_score') || '0', 10);

  let score = 0;
  let wave = 1;
  let lives = 3;
  let totalKills = 0;

  const player = {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    speed: 5.5,
    shield: false,
    tripleShotTimer: 0,
    invulnTimer: 0
  };

  let lasers = [];
  let enemies = [];
  let enemyBullets = [];
  let powerups = [];
  let particles = [];
  let stars = [];

  let shootTimer = 0;
  let waveEnemiesLeft = 0;
  let waveSpawnTimer = 0;

  const keys = { left: false, right: false, up: false, down: false };

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    player.x = rect.width / 2;
    player.y = rect.height - 70;

    // Stars
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: 1 + Math.random() * 2,
        speed: 0.5 + Math.random() * 2
      });
    }
  }

  window.addEventListener('resize', resizeCanvas);

  function startWave(w) {
    wave = w;
    waveEl.textContent = wave;
    enemies = [];
    enemyBullets = [];

    const isBoss = (wave % 5 === 0);
    if (isBoss) {
      const rect = canvas.parentElement.getBoundingClientRect();
      enemies.push({
        type: 'boss',
        x: rect.width / 2,
        y: -60,
        targetY: 80,
        vx: 1.8,
        width: 80,
        height: 60,
        hp: 35 + wave * 5,
        maxHp: 35 + wave * 5,
        shootCooldown: 40
      });
      waveEnemiesLeft = 1;
    } else {
      waveEnemiesLeft = 8 + wave * 2;
      waveSpawnTimer = 30;
    }
  }

  function spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
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
    sound.playExplosion();

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('spaceshooter_best_score', bestScore);
    }

    finalScore.textContent = score;
    finalWave.textContent = wave;
    finalKills.textContent = totalKills;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    const rect = canvas.parentElement.getBoundingClientRect();
    score = 0;
    lives = 3;
    totalKills = 0;
    player.x = rect.width / 2;
    player.y = rect.height - 70;
    player.shield = false;
    player.tripleShotTimer = 0;
    player.invulnTimer = 0;
    lasers = [];
    enemyBullets = [];
    powerups = [];
    particles = [];

    scoreEl.textContent = '0';
    livesEl.textContent = '❤️ x3';
    startWave(1);
  }

  function update() {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.parentElement.getBoundingClientRect();

    // Starfield scroll
    stars.forEach(st => {
      st.y += st.speed;
      if (st.y > rect.height) {
        st.y = 0;
        st.x = Math.random() * rect.width;
      }
    });

    // Player Movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    if (keys.up) player.y -= player.speed;
    if (keys.down) player.y += player.speed;

    player.x = Math.max(player.width / 2, Math.min(rect.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(rect.height - player.height / 2, player.y));

    if (player.invulnTimer > 0) player.invulnTimer--;
    if (player.tripleShotTimer > 0) player.tripleShotTimer--;

    // Automatic Laser Shooting
    shootTimer++;
    if (shootTimer >= 10) {
      shootTimer = 0;
      sound.playLaser();

      if (player.tripleShotTimer > 0) {
        lasers.push({ x: player.x, y: player.y - 16, vx: 0, vy: -12 });
        lasers.push({ x: player.x - 10, y: player.y - 12, vx: -2.5, vy: -11 });
        lasers.push({ x: player.x + 10, y: player.y - 12, vx: 2.5, vy: -11 });
      } else {
        lasers.push({ x: player.x - 8, y: player.y - 16, vx: 0, vy: -12 });
        lasers.push({ x: player.x + 8, y: player.y - 16, vx: 0, vy: -12 });
      }
    }

    // Move Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      if (l.y < -20 || l.x < -20 || l.x > rect.width + 20) {
        lasers.splice(i, 1);
      }
    }

    // Spawn regular enemies in wave
    if (waveEnemiesLeft > 0 && enemies.length < 5) {
      waveSpawnTimer--;
      if (waveSpawnTimer <= 0) {
        waveSpawnTimer = 40 + Math.random() * 30;
        waveEnemiesLeft--;

        const isCruiser = Math.random() < 0.35;
        enemies.push({
          type: isCruiser ? 'cruiser' : 'drone',
          x: 40 + Math.random() * (rect.width - 80),
          y: -30,
          vx: (Math.random() - 0.5) * 3,
          vy: isCruiser ? 1.5 : 2.6,
          width: isCruiser ? 36 : 24,
          height: isCruiser ? 30 : 22,
          hp: isCruiser ? 3 : 1,
          shootCooldown: 60 + Math.random() * 60,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // Update Enemies
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];

      if (e.type === 'boss') {
        if (e.y < e.targetY) e.y += 1.5;
        e.x += e.vx;
        if (e.x - e.width / 2 <= 20 || e.x + e.width / 2 >= rect.width - 20) {
          e.vx = -e.vx;
        }

        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 45;
          // Fire spread of plasma balls
          [-2, 0, 2].forEach(vx => {
            enemyBullets.push({ x: e.x, y: e.y + e.height / 2, vx, vy: 4.5 });
          });
        }
      } else {
        e.phase += 0.05;
        if (e.type === 'drone') {
          e.x += Math.sin(e.phase) * 2.5;
          e.y += e.vy;
        } else {
          e.x += e.vx;
          e.y += e.vy;
          if (e.x - e.width / 2 <= 10 || e.x + e.width / 2 >= rect.width - 10) e.vx = -e.vx;

          e.shootCooldown--;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 90;
            enemyBullets.push({ x: e.x, y: e.y + e.height / 2, vx: 0, vy: 4 });
          }
        }
      }

      // Check collision with player lasers
      for (let li = lasers.length - 1; li >= 0; li--) {
        const l = lasers[li];
        if (Math.abs(l.x - e.x) < e.width / 2 && Math.abs(l.y - e.y) < e.height / 2) {
          lasers.splice(li, 1);
          e.hp--;
          sound.playHit();
          spawnBurst(l.x, l.y, '#06b6d4', 4);

          if (e.hp <= 0) {
            // Alien destroyed!
            sound.playExplosion();
            spawnBurst(e.x, e.y, e.type === 'boss' ? '#a855f7' : '#f43f5e', e.type === 'boss' ? 30 : 14);
            enemies.splice(ei, 1);
            totalKills++;

            const pts = (e.type === 'boss') ? 500 : (e.type === 'cruiser' ? 60 : 20);
            score += pts;
            scoreEl.textContent = score;

            // Chance to drop power-up
            if (Math.random() < 0.2 || e.type === 'boss') {
              powerups.push({
                x: e.x,
                y: e.y,
                type: Math.random() > 0.5 ? 'triple' : 'shield',
                vy: 2
              });
            }
            break;
          }
        }
      }

      // Alien body collision with player
      if (player.invulnTimer <= 0 &&
          Math.abs(player.x - e.x) < (player.width + e.width) / 2.5 &&
          Math.abs(player.y - e.y) < (player.height + e.height) / 2.5) {
        takeDamage();
      }

      // Remove off-screen non-boss enemies
      if (e.type !== 'boss' && e.y > rect.height + 40) {
        enemies.splice(ei, 1);
      }
    }

    // Check if wave is cleared
    if (waveEnemiesLeft <= 0 && enemies.length === 0) {
      startWave(wave + 1);
    }

    // Update Enemy Bullets
    for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
      const b = enemyBullets[bi];
      b.x += b.vx;
      b.y += b.vy;

      if (player.invulnTimer <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 16) {
        enemyBullets.splice(bi, 1);
        takeDamage();
      } else if (b.y > rect.height + 20) {
        enemyBullets.splice(bi, 1);
      }
    }

    // Update Powerups
    for (let pi = powerups.length - 1; pi >= 0; pi--) {
      const p = powerups[pi];
      p.y += p.vy;

      if (Math.hypot(p.x - player.x, p.y - player.y) < 24) {
        sound.playPowerup();
        if (p.type === 'shield') {
          player.shield = true;
        } else {
          player.tripleShotTimer = 480; // 8 seconds
        }
        spawnBurst(p.x, p.y, '#38bdf8', 12);
        powerups.splice(pi, 1);
      } else if (p.y > rect.height + 20) {
        powerups.splice(pi, 1);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }

  function takeDamage() {
    if (player.shield) {
      player.shield = false;
      player.invulnTimer = 60;
      sound.playHit();
      spawnBurst(player.x, player.y, '#38bdf8', 15);
      return;
    }

    lives--;
    livesEl.textContent = `❤️ x${lives}`;
    player.invulnTimer = 90;
    sound.playExplosion();
    spawnBurst(player.x, player.y, '#f43f5e', 20);

    if (lives <= 0) {
      gameOver();
    }
  }

  function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Stars
    stars.forEach(st => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });

    // Lasers
    lasers.forEach(l => {
      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x - 2, l.y - 8, 4, 16);
      ctx.restore();
    });

    // Enemy Bullets
    enemyBullets.forEach(b => {
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Powerups
    powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowBlur = 10;
      if (p.type === 'shield') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('🛡️', -6, 4);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('🔱', -6, 4);
      }
      ctx.restore();
    });

    // Enemies
    enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.type === 'boss') {
        // Boss ship
        ctx.fillStyle = '#7e22ce';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, e.height / 2);
        ctx.lineTo(e.width / 2, -e.height / 2);
        ctx.lineTo(-e.width / 2, -e.height / 2);
        ctx.closePath();
        ctx.fill();

        // Boss Health Bar
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#374151';
        ctx.fillRect(-35, -e.height / 2 - 12, 70, 6);
        ctx.fillStyle = '#22c55e';
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillRect(-35, -e.height / 2 - 12, 70 * hpPct, 6);
      } else if (e.type === 'cruiser') {
        // Cruiser
        ctx.fillStyle = '#e11d48';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, e.height / 2);
        ctx.lineTo(e.width / 2, -e.height / 3);
        ctx.lineTo(0, -e.height / 2);
        ctx.lineTo(-e.width / 2, -e.height / 3);
        ctx.closePath();
        ctx.fill();
      } else {
        // Drone
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, e.height / 2);
        ctx.lineTo(e.width / 2, -e.height / 2);
        ctx.lineTo(-e.width / 2, -e.height / 2);
        ctx.closePath();
        ctx.fill();
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

    // Draw Player Ship
    if (gameState === 'PLAYING') {
      if (player.invulnTimer % 8 < 4) {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Shield Bubble
        if (player.shield) {
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Hull
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(16, 14);
        ctx.lineTo(0, 8);
        ctx.lineTo(-16, 14);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-5, 9);
        ctx.lineTo(0, 16 + Math.random() * 6);
        ctx.lineTo(5, 9);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
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

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
    if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
    if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = true;
    if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = true;

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
    if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
    if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = false;
    if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = false;
  });

  // Touch / Pointer drag navigation
  let isDragging = false;
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging || gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
  });

  window.addEventListener('pointerup', () => { isDragging = false; });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  gameLoop();
})();

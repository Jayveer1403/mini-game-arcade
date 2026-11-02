(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('knifehit_muted') === 'true';
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

    playThrow() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
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
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playApple() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    playDeflect() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    playShatter() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [220, 330, 440, 660].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.2);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('knifehit_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const knifeInventoryEl = document.getElementById('knife-inventory');

  const scoreEl = document.getElementById('score-val');
  const stageEl = document.getElementById('stage-val');
  const appleEl = document.getElementById('apple-val');

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
  const startBestStage = document.getElementById('start-best-stage');
  const finalScore = document.getElementById('final-score');
  const finalStage = document.getElementById('final-stage');
  const finalApples = document.getElementById('final-apples');
  const finalBest = document.getElementById('final-best');
  const gameoverReason = document.getElementById('gameover-reason');

  // Game State
  let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
  let score = 0;
  let stage = 1;
  let apples = 0;
  let bestScore = parseInt(localStorage.getItem('knifehit_best_score') || '0', 10);
  let bestStage = parseInt(localStorage.getItem('knifehit_best_stage') || '1', 10);

  let target = {
    x: 0,
    y: 0,
    radius: 72,
    angle: 0,
    speed: 0.025,
    speedTimer: 0,
    speedPattern: 0,
    shattering: false,
    shatterPieces: []
  };

  let totalKnivesForStage = 7;
  let knivesRemaining = 7;
  let embeddedKnives = []; // angles relative to target.angle
  let applesOnTarget = []; // { angle, sliced }
  let activeFlyingKnife = null; // { y, speed }
  let deflectedKnife = null; // { x, y, vx, vy, rot, vrot }
  let particles = [];
  let screenShake = 0;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    target.x = rect.width / 2;
    target.y = rect.height * 0.28;
  }

  window.addEventListener('resize', resizeCanvas);

  function updateHUD() {
    scoreEl.textContent = score;
    stageEl.textContent = stage;
    appleEl.textContent = `🍎 ${apples}`;

    // Update knife inventory
    knifeInventoryEl.innerHTML = '';
    for (let i = 0; i < totalKnivesForStage; i++) {
      const slot = document.createElement('div');
      slot.className = 'knife-slot' + (i >= knivesRemaining ? ' used' : '');
      knifeInventoryEl.appendChild(slot);
    }
  }

  function setupStage(newStage) {
    stage = newStage;
    target.shattering = false;
    target.shatterPieces = [];
    embeddedKnives = [];
    applesOnTarget = [];
    activeFlyingKnife = null;
    deflectedKnife = null;

    const isBoss = (stage % 5 === 0);
    totalKnivesForStage = isBoss ? 10 : Math.min(12, 6 + Math.floor(stage / 2));
    knivesRemaining = totalKnivesForStage;

    // Initial pre-embedded knives on higher stages
    const preKnives = Math.min(4, Math.floor((stage - 1) / 3));
    const step = (Math.PI * 2) / Math.max(preKnives, 1);
    for (let i = 0; i < preKnives; i++) {
      embeddedKnives.push(i * step + Math.random() * 0.4);
    }

    // Apples on target
    if (Math.random() < 0.65 || isBoss) {
      const count = isBoss ? 2 : 1;
      for (let i = 0; i < count; i++) {
        let appleAngle;
        let safe = false;
        let tries = 0;
        while (!safe && tries < 20) {
          appleAngle = Math.random() * Math.PI * 2;
          safe = embeddedKnives.every(k => Math.abs(normalizeAngle(k - appleAngle)) > 0.4);
          tries++;
        }
        if (safe) applesOnTarget.push({ angle: appleAngle, sliced: false });
      }
    }

    target.speedPattern = Math.floor(Math.random() * 4);
    target.speed = (Math.random() > 0.5 ? 1 : -1) * (0.025 + Math.min(0.03, stage * 0.003));
    updateHUD();
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function throwKnife() {
    if (gameState !== 'PLAYING') return;
    if (activeFlyingKnife || deflectedKnife || target.shattering || knivesRemaining <= 0) return;

    sound.playThrow();
    const rect = canvas.parentElement.getBoundingClientRect();
    activeFlyingKnife = {
      y: rect.height - 70,
      targetY: target.y + target.radius - 10,
      speed: 28
    };
  }

  function shatterTarget() {
    target.shattering = true;
    sound.playShatter();
    screenShake = 15;

    // Create shattering pieces
    target.shatterPieces = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      target.shatterPieces.push({
        x: target.x,
        y: target.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.2,
        size: 16 + Math.random() * 14
      });
    }

    setTimeout(() => {
      setupStage(stage + 1);
    }, 700);
  }

  function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.03,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function gameOver(reason) {
    gameState = 'GAMEOVER';
    sound.playDeflect();
    screenShake = 20;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('knifehit_best_score', bestScore);
    }
    if (stage > bestStage) {
      bestStage = stage;
      localStorage.setItem('knifehit_best_stage', bestStage);
    }

    gameoverReason.textContent = reason;
    finalScore.textContent = score;
    finalStage.textContent = stage;
    finalApples.textContent = apples;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function update() {
    if (gameState !== 'PLAYING') return;

    // Rotate target with dynamic variation
    target.speedTimer += 0.02;
    if (target.speedPattern === 1) {
      // sinusoidal speed
      target.angle += target.speed * (1 + 0.8 * Math.sin(target.speedTimer * 2));
    } else if (target.speedPattern === 2) {
      // intermittent pause / burst
      const phase = Math.sin(target.speedTimer);
      target.angle += target.speed * (phase > 0.5 ? 1.8 : 0.3);
    } else if (target.speedPattern === 3) {
      // Periodic direction switch
      if (Math.sin(target.speedTimer) > 0.98) target.speed = -target.speed;
      target.angle += target.speed;
    } else {
      target.angle += target.speed;
    }

    // Update shatter pieces
    if (target.shattering) {
      target.shatterPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rot += p.vrot;
      });
    }

    // Flying knife motion
    if (activeFlyingKnife) {
      activeFlyingKnife.y -= activeFlyingKnife.speed;

      if (activeFlyingKnife.y <= activeFlyingKnife.targetY) {
        // Knife reached the target!
        const hitAngle = Math.PI / 2 - target.angle; // Bottom of target corresponds to +PI/2 in screen space
        const normalizedHit = normalizeAngle(hitAngle);

        // Check collision against embedded knives
        let collision = false;
        for (const kAngle of embeddedKnives) {
          const diff = Math.abs(normalizeAngle(kAngle - normalizedHit));
          if (diff < 0.26) { // ~15 degrees collision arc
            collision = true;
            break;
          }
        }

        if (collision) {
          // Deflect knife!
          deflectedKnife = {
            x: target.x,
            y: activeFlyingKnife.targetY,
            vx: (Math.random() - 0.5) * 6,
            vy: 6,
            rot: 0,
            vrot: 0.3
          };
          activeFlyingKnife = null;
          gameOver('You struck another blade!');
        } else {
          // Embed knife successfully!
          sound.playHit();
          screenShake = 6;
          spawnParticles(target.x, target.y + target.radius, '#00f2fe', 12);
          embeddedKnives.push(normalizedHit);
          knivesRemaining--;
          score++;

          // Check apple slice
          applesOnTarget.forEach(apple => {
            if (!apple.sliced) {
              const diff = Math.abs(normalizeAngle(apple.angle - normalizedHit));
              if (diff < 0.3) {
                apple.sliced = true;
                apples++;
                score += 5;
                sound.playApple();
                spawnParticles(target.x, target.y + target.radius, '#ef4444', 16);
              }
            }
          });

          activeFlyingKnife = null;
          updateHUD();

          if (knivesRemaining <= 0) {
            shatterTarget();
          }
        }
      }
    }

    // Deflected knife physics
    if (deflectedKnife) {
      deflectedKnife.x += deflectedKnife.vx;
      deflectedKnife.y += deflectedKnife.vy;
      deflectedKnife.vy += 0.5;
      deflectedKnife.rot += deflectedKnife.vrot;
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
  }

  function drawKnife(x, y, angle = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Blade
    const bladeGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    bladeGrad.addColorStop(0, '#e2e8f0');
    bladeGrad.addColorStop(0.5, '#ffffff');
    bladeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bladeGrad;

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(6, -6);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.lineTo(-6, -6);
    ctx.closePath();
    ctx.fill();

    // Crossguard
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.fillRect(-10, 6, 20, 4);
    ctx.shadowBlur = 0;

    // Handle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, 10, 8, 18);
    // Pommel
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(0, 30, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawApple(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(3, -11, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function render() {
    const rect = canvas.parentElement.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    // Draw Target Log or Shatter Pieces
    if (target.shattering) {
      ctx.fillStyle = stage % 5 === 0 ? '#ff007f' : '#b45309';
      target.shatterPieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
    } else {
      ctx.save();
      ctx.translate(target.x, target.y);
      ctx.rotate(target.angle);

      // Outer Glow
      const isBoss = (stage % 5 === 0);
      ctx.shadowColor = isBoss ? '#ff007f' : 'rgba(0, 242, 254, 0.4)';
      ctx.shadowBlur = 20;

      // Base log circle
      const logGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, target.radius);
      if (isBoss) {
        logGrad.addColorStop(0, '#831843');
        logGrad.addColorStop(0.7, '#be185d');
        logGrad.addColorStop(1, '#ff007f');
      } else {
        logGrad.addColorStop(0, '#78350f');
        logGrad.addColorStop(0.7, '#92400e');
        logGrad.addColorStop(1, '#b45309');
      }
      ctx.fillStyle = logGrad;
      ctx.beginPath();
      ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wood rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, target.radius * 0.68, 0, Math.PI * 2);
      ctx.arc(0, 0, target.radius * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Core Target Emblem
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isBoss ? '#ff007f' : '#00f2fe';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Embedded Knives
      embeddedKnives.forEach(kAngle => {
        const kx = Math.cos(kAngle) * target.radius;
        const ky = Math.sin(kAngle) * target.radius;
        // Knife sticking outward
        drawKnife(kx, ky, kAngle - Math.PI / 2, 0.95);
      });

      // Rotating Apples
      applesOnTarget.forEach(apple => {
        if (!apple.sliced) {
          const ax = Math.cos(apple.angle) * (target.radius + 12);
          const ay = Math.sin(apple.angle) * (target.radius + 12);
          drawApple(ax, ay, apple.angle);
        }
      });

      ctx.restore();
    }

    // Ready Knife waiting to be thrown
    if (gameState === 'PLAYING' && !activeFlyingKnife && knivesRemaining > 0) {
      drawKnife(target.x, rect.height - 70, 0, 1.05);
    }

    // Active Flying Knife
    if (activeFlyingKnife) {
      drawKnife(target.x, activeFlyingKnife.y, 0, 1.05);
    }

    // Deflected Knife
    if (deflectedKnife) {
      drawKnife(deflectedKnife.x, deflectedKnife.y, deflectedKnife.rot, 1.05);
    }

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

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
    score = 0;
    apples = 0;
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    setupStage(1);
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

  // Action input: click or tap on canvas or spacebar
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') throwKnife();
    else if (gameState === 'START') startGame();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === 'PLAYING') throwKnife();
      else if (gameState === 'START') startGame();
      else if (gameState === 'GAMEOVER') startGame();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  startBestScore.textContent = bestScore;
  startBestStage.textContent = bestStage;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  gameLoop();
})();

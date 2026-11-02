(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const wrapper = document.getElementById('canvas-wrapper');

  const scoreVal = document.getElementById('score-val');
  const bestVal = document.getElementById('best-val');
  const comboVal = document.getElementById('combo-val');
  const comboBanner = document.getElementById('combo-banner');
  const soundBtn = document.getElementById('sound-btn');

  const startOverlay = document.getElementById('start-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  const finalScore = document.getElementById('final-score');
  const finalBest = document.getElementById('final-best');
  const finalCombo = document.getElementById('final-combo');

  // Audio setup
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playPerfectChord(count) {
    if (!soundEnabled || !audioCtx) return;
    const baseFreq = 300 + (count % 15) * 35;
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((f, idx) => {
      setTimeout(() => playTone(f, 'triangle', 0.25, 0.15), idx * 40);
    });
  }

  function playGameOverSound() {
    if (!soundEnabled || !audioCtx) return;
    [320, 280, 240, 180].forEach((f, idx) => {
      setTimeout(() => playTone(f, 'sawtooth', 0.25, 0.2), idx * 100);
    });
  }

  // Canvas resize & DPR
  let width, height;
  function resize() {
    const rect = wrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // Game state
  let state = 'START'; // START, PLAYING, GAMEOVER
  let score = 0;
  let best = parseInt(localStorage.getItem('arcade_tower_stack_best') || '0', 10);
  let combo = 0;
  let maxCombo = 0;

  bestVal.textContent = best;

  const BLOCK_HEIGHT = 28;
  const INITIAL_WIDTH = Math.min(220, width * 0.6);
  let blocks = [];
  let fallingSlices = [];
  let particles = [];
  let currentBlock = null;
  let cameraY = 0;
  let targetCameraY = 0;

  function getColor(index) {
    const hue = (index * 14 + 180) % 360;
    return `hsl(${hue}, 85%, 55%)`;
  }

  function getSliceColor(index) {
    const hue = (index * 14 + 180) % 360;
    return `hsl(${hue}, 70%, 45%)`;
  }

  function resetGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    scoreVal.textContent = '0';
    comboVal.textContent = '0x';
    blocks = [];
    fallingSlices = [];
    particles = [];
    cameraY = 0;
    targetCameraY = 0;

    // Base block
    const baseW = INITIAL_WIDTH;
    const baseX = (width - baseW) / 2;
    const baseY = height - 120;
    blocks.push({
      x: baseX,
      y: baseY,
      w: baseW,
      h: BLOCK_HEIGHT,
      color: getColor(0)
    });

    spawnMovingBlock();
    state = 'PLAYING';
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
  }

  function spawnMovingBlock() {
    const prevBlock = blocks[blocks.length - 1];
    const y = prevBlock.y - BLOCK_HEIGHT;
    const w = prevBlock.w;
    const speed = 3.5 + Math.min(score * 0.15, 6.5);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = direction === 1 ? -w : width;

    currentBlock = {
      x,
      y,
      w,
      h: BLOCK_HEIGHT,
      speed: speed * direction,
      color: getColor(blocks.length)
    };

    targetCameraY = Math.max(0, (blocks.length - 5) * BLOCK_HEIGHT);
  }

  function handlePlacement() {
    if (state !== 'PLAYING' || !currentBlock) return;
    initAudio();

    const prev = blocks[blocks.length - 1];
    const diff = currentBlock.x - prev.x;

    // Check perfect placement (within 3.5px)
    if (Math.abs(diff) <= 3.5) {
      currentBlock.x = prev.x;
      blocks.push(currentBlock);
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      score += 1 + combo;

      scoreVal.textContent = score;
      comboVal.textContent = `${combo}x`;
      triggerComboBanner(`PERFECT! +${combo * 5}`);
      playPerfectChord(combo);
      createSparks(prev.x + prev.w / 2, currentBlock.y, '#ffd700', 20);

      currentBlock = null;
      spawnMovingBlock();
      return;
    }

    // Check overlap
    if (diff > 0) {
      // Overhang is on the right
      const overlap = prev.w - diff;
      if (overlap <= 0) {
        // Complete miss!
        sliceFullMiss(currentBlock);
        triggerGameOver();
        return;
      }

      // Cut block
      currentBlock.w = overlap;
      blocks.push(currentBlock);

      // Sliced overhang piece
      const sliceX = prev.x + overlap;
      const sliceW = diff;
      createFallingSlice(sliceX, currentBlock.y, sliceW, BLOCK_HEIGHT, currentBlock.color, 2);
      createSparks(sliceX, currentBlock.y + BLOCK_HEIGHT / 2, currentBlock.color, 10);
    } else {
      // Overhang is on the left (diff is negative)
      const absDiff = Math.abs(diff);
      const overlap = prev.w - absDiff;
      if (overlap <= 0) {
        // Complete miss!
        sliceFullMiss(currentBlock);
        triggerGameOver();
        return;
      }

      // Cut block
      currentBlock.x = prev.x;
      currentBlock.w = overlap;
      blocks.push(currentBlock);

      // Sliced overhang piece
      const sliceX = prev.x - absDiff;
      const sliceW = absDiff;
      createFallingSlice(sliceX, currentBlock.y, sliceW, BLOCK_HEIGHT, currentBlock.color, -2);
      createSparks(prev.x, currentBlock.y + BLOCK_HEIGHT / 2, currentBlock.color, 10);
    }

    combo = 0;
    comboVal.textContent = '0x';
    score += 1;
    scoreVal.textContent = score;
    playTone(280 + (blocks.length % 20) * 18, 'sine', 0.12, 0.2);

    currentBlock = null;
    spawnMovingBlock();
  }

  function sliceFullMiss(block) {
    createFallingSlice(block.x, block.y, block.w, block.h, block.color, block.speed > 0 ? 3 : -3);
    currentBlock = null;
  }

  function createFallingSlice(x, y, w, h, color, vx) {
    fallingSlices.push({
      x,
      y,
      w,
      h,
      color,
      vx,
      vy: 1,
      vr: (Math.random() - 0.5) * 0.1,
      angle: 0,
      opacity: 1
    });
  }

  function createSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 2 + Math.random() * 3,
        life: 1
      });
    }
  }

  function triggerComboBanner(text) {
    comboBanner.textContent = text;
    comboBanner.classList.add('show');
    setTimeout(() => {
      comboBanner.classList.remove('show');
    }, 700);
  }

  function triggerGameOver() {
    state = 'GAMEOVER';
    playGameOverSound();

    if (score > best) {
      best = score;
      localStorage.setItem('arcade_tower_stack_best', best.toString());
      bestVal.textContent = best;
    }

    finalScore.textContent = score;
    finalBest.textContent = best;
    finalCombo.textContent = `${maxCombo}x`;

    setTimeout(() => {
      gameOverOverlay.classList.remove('hidden');
    }, 600);
  }

  // Animation Loop
  let lastTime = performance.now();
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    // Camera smoothing
    cameraY += (targetCameraY - cameraY) * 0.1;

    // Clear
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(0, cameraY);

    // Draw stacked blocks
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(b.x, b.y, b.w, 4);

      // Shadow underside
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);
    }

    // Update & draw moving block
    if (currentBlock && state === 'PLAYING') {
      currentBlock.x += currentBlock.speed;
      if (currentBlock.speed > 0 && currentBlock.x + currentBlock.w > width + 40) {
        currentBlock.speed = -Math.abs(currentBlock.speed);
      } else if (currentBlock.speed < 0 && currentBlock.x < -40) {
        currentBlock.speed = Math.abs(currentBlock.speed);
      }

      ctx.fillStyle = currentBlock.color;
      ctx.beginPath();
      ctx.roundRect(currentBlock.x, currentBlock.y, currentBlock.w, currentBlock.h, 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, 4);
    }

    // Update & draw falling slices
    for (let i = fallingSlices.length - 1; i >= 0; i--) {
      const s = fallingSlices[i];
      s.vy += 0.45; // gravity
      s.x += s.vx;
      s.y += s.vy;
      s.angle += s.vr;
      s.opacity -= 0.015;

      if (s.opacity <= 0 || s.y > height + 200 + cameraY) {
        fallingSlices.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, s.opacity);
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate(s.angle);
      ctx.fillStyle = s.color;
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }

    // Update & draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.03;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // Input bindings
  wrapper.addEventListener('pointerdown', (e) => {
    if (state === 'PLAYING') {
      e.preventDefault();
      handlePlacement();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state === 'PLAYING') {
        handlePlacement();
      } else if (state === 'START') {
        initAudio();
        resetGame();
      } else if (state === 'GAMEOVER' && !gameOverOverlay.classList.contains('hidden')) {
        initAudio();
        resetGame();
      }
    }
  });

  startBtn.addEventListener('click', () => {
    initAudio();
    resetGame();
  });

  restartBtn.addEventListener('click', () => {
    initAudio();
    resetGame();
  });

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  });
})();

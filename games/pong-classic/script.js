(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('pongclassic_muted') === 'true';
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

    playPaddleHit() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playWallBounce() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }

    playScore() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    playWin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.18);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('pongclassic_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playerScoreEl = document.getElementById('player-score');
  const cpuScoreEl = document.getElementById('cpu-score');
  const rallyValEl = document.getElementById('rally-val');
  const opponentLbl = document.getElementById('opponent-lbl');

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

  const startBestStreak = document.getElementById('start-best-streak');
  const finalPlayerScore = document.getElementById('final-player-score');
  const finalCpuScore = document.getElementById('final-cpu-score');
  const finalRally = document.getElementById('final-rally');
  const finalStreak = document.getElementById('final-streak');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');
  const gameoverIcon = document.getElementById('gameover-icon');

  const modeButtons = document.querySelectorAll('.mode-btn');

  // Game Settings & State
  const WINNING_SCORE = 7;
  let gameMode = '1p-med'; // '1p-med', '1p-hard', '2p'
  let gameState = 'START';
  let bestStreak = parseInt(localStorage.getItem('pongclassic_best_streak') || '0', 10);
  let currentStreak = 0;

  let scoreP1 = 0;
  let scoreP2 = 0;
  let currentRally = 0;
  let maxRally = 0;

  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 72;

  const p1 = { x: 20, y: 150, vy: 0, speed: 6 };
  const p2 = { x: 0, y: 150, vy: 0, speed: 5 };

  const ball = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 5.5,
    baseSpeed: 5.5,
    radius: 7,
    trail: []
  };

  const keys = { w: false, s: false, up: false, down: false };
  let particles = [];

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    p2.x = rect.width - 20 - PADDLE_WIDTH;
  }

  window.addEventListener('resize', resizeCanvas);

  function resetBall(servingToP1 = true) {
    const rect = canvas.parentElement.getBoundingClientRect();
    ball.x = rect.width / 2;
    ball.y = rect.height / 2;
    ball.speed = ball.baseSpeed;
    ball.trail = [];

    const angle = (Math.random() * 0.6 - 0.3); // slight angle
    const dir = servingToP1 ? -1 : 1;
    ball.vx = Math.cos(angle) * ball.speed * dir;
    ball.vy = Math.sin(angle) * ball.speed;

    currentRally = 0;
    rallyValEl.textContent = '0';
  }

  function initMatch() {
    scoreP1 = 0;
    scoreP2 = 0;
    currentRally = 0;
    maxRally = 0;

    const rect = canvas.parentElement.getBoundingClientRect();
    p1.y = rect.height / 2 - PADDLE_HEIGHT / 2;
    p2.y = rect.height / 2 - PADDLE_HEIGHT / 2;

    opponentLbl.textContent = (gameMode === '2p') ? 'P2' : 'CPU';
    playerScoreEl.textContent = '0';
    cpuScoreEl.textContent = '0';
    rallyValEl.textContent = '0';

    resetBall(Math.random() > 0.5);
  }

  function spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 2 + Math.random() * 2.5
      });
    }
  }

  function endMatch(winnerIsP1) {
    gameState = 'GAMEOVER';
    sound.playWin();

    if (winnerIsP1) {
      currentStreak++;
      if (currentStreak > bestStreak && gameMode !== '2p') {
        bestStreak = currentStreak;
        localStorage.setItem('pongclassic_best_streak', bestStreak);
      }
      gameoverIcon.textContent = '🏆';
      gameoverTitle.textContent = (gameMode === '2p') ? 'PLAYER 1 VICTORY!' : 'YOU WON THE MATCH!';
      gameoverReason.textContent = 'Spectacular agility and table dominance!';
    } else {
      currentStreak = 0;
      gameoverIcon.textContent = '🥈';
      gameoverTitle.textContent = (gameMode === '2p') ? 'PLAYER 2 VICTORY!' : 'CPU DEFEATED YOU!';
      gameoverReason.textContent = 'A hard-fought rally battle!';
    }

    finalPlayerScore.textContent = scoreP1;
    finalCpuScore.textContent = scoreP2;
    finalRally.textContent = maxRally;
    finalStreak.textContent = currentStreak;

    modalGameOver.classList.remove('hidden');
  }

  function update() {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.parentElement.getBoundingClientRect();

    // Player 1 controls (W/S)
    if (keys.w) p1.y -= p1.speed;
    if (keys.s) p1.y += p1.speed;
    p1.y = Math.max(8, Math.min(rect.height - PADDLE_HEIGHT - 8, p1.y));

    // Player 2 or CPU controls
    if (gameMode === '2p') {
      if (keys.up) p2.y -= p2.speed;
      if (keys.down) p2.y += p2.speed;
    } else {
      // AI movement
      const targetY = ball.y - PADDLE_HEIGHT / 2;
      const aiSpeed = (gameMode === '1p-hard') ? 5.8 : 4.4;
      // Add slight lag / reaction delay for realism
      if (p2.y + PADDLE_HEIGHT / 2 < ball.y - 12) {
        p2.y += aiSpeed;
      } else if (p2.y + PADDLE_HEIGHT / 2 > ball.y + 12) {
        p2.y -= aiSpeed;
      }
    }
    p2.y = Math.max(8, Math.min(rect.height - PADDLE_HEIGHT - 8, p2.y));

    // Ball movement & trail
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.6 });
    if (ball.trail.length > 8) ball.trail.shift();

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top / Bottom wall bounce
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
      sound.playWallBounce();
      spawnSparks(ball.x, ball.y, '#38bdf8', 6);
    } else if (ball.y + ball.radius >= rect.height) {
      ball.y = rect.height - ball.radius;
      ball.vy = -ball.vy;
      sound.playWallBounce();
      spawnSparks(ball.x, ball.y, '#38bdf8', 6);
    }

    // Paddle 1 (Left) collision
    if (ball.vx < 0 &&
        ball.x - ball.radius <= p1.x + PADDLE_WIDTH &&
        ball.x + ball.radius >= p1.x &&
        ball.y >= p1.y - 4 &&
        ball.y <= p1.y + PADDLE_HEIGHT + 4) {

      // Curve spin angle based on hit location
      const hitOffset = (ball.y - (p1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
      const angle = hitOffset * (Math.PI / 3.2); // max ~56 degrees
      ball.speed = Math.min(12, ball.speed + 0.35); // accelerate rally
      ball.vx = Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;
      ball.x = p1.x + PADDLE_WIDTH + ball.radius;

      currentRally++;
      if (currentRally > maxRally) maxRally = currentRally;
      rallyValEl.textContent = currentRally;

      sound.playPaddleHit();
      spawnSparks(ball.x, ball.y, '#38bdf8', 10);
    }

    // Paddle 2 (Right) collision
    if (ball.vx > 0 &&
        ball.x + ball.radius >= p2.x &&
        ball.x - ball.radius <= p2.x + PADDLE_WIDTH &&
        ball.y >= p2.y - 4 &&
        ball.y <= p2.y + PADDLE_HEIGHT + 4) {

      const hitOffset = (ball.y - (p2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
      const angle = hitOffset * (Math.PI / 3.2);
      ball.speed = Math.min(12, ball.speed + 0.35);
      ball.vx = -Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;
      ball.x = p2.x - ball.radius;

      currentRally++;
      if (currentRally > maxRally) maxRally = currentRally;
      rallyValEl.textContent = currentRally;

      sound.playPaddleHit();
      spawnSparks(ball.x, ball.y, '#f43f5e', 10);
    }

    // Score Check
    if (ball.x + ball.radius < 0) {
      // P2 / CPU scored
      scoreP2++;
      cpuScoreEl.textContent = scoreP2;
      sound.playScore();
      spawnSparks(20, ball.y, '#f43f5e', 18);

      if (scoreP2 >= WINNING_SCORE) {
        endMatch(false);
      } else {
        resetBall(true);
      }
    } else if (ball.x - ball.radius > rect.width) {
      // P1 scored
      scoreP1++;
      playerScoreEl.textContent = scoreP1;
      sound.playScore();
      spawnSparks(rect.width - 20, ball.y, '#38bdf8', 18);

      if (scoreP1 >= WINNING_SCORE) {
        endMatch(true);
      } else {
        resetBall(false);
      }
    }

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

    // Center dotted net line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(rect.width / 2, 0);
    ctx.lineTo(rect.width / 2, rect.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ball Trail
    ball.trail.forEach((t, i) => {
      const alpha = (i + 1) / ball.trail.length * 0.4;
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.radius * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });

    // Ball
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Paddle 1 (Left, Cyan)
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(p1.x, p1.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    ctx.restore();

    // Paddle 2 (Right, Pink)
    ctx.save();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(p2.x, p2.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    ctx.restore();

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
    initMatch();
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

  // Mode Selection
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameMode = btn.dataset.mode;
    });
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'ArrowDown') keys.down = true;

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'ArrowDown') keys.down = false;
  });

  // Touch / Pointer controls: Left half steers P1, Right half steers P2
  canvas.addEventListener('pointermove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    if (touchX < rect.width / 2) {
      p1.y = touchY - PADDLE_HEIGHT / 2;
    } else if (gameMode === '2p') {
      p2.y = touchY - PADDLE_HEIGHT / 2;
    }
  });

  // Init
  startBestStreak.textContent = bestStreak;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  resizeCanvas();
  gameLoop();
})();

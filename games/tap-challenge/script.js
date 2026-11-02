(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('tapchallenge_muted') === 'true';
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

    playClick() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playFinish() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [523, 659, 783, 1046].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.15);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('tapchallenge_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const tapZone = document.getElementById('tap-zone');
  const rippleContainer = document.getElementById('ripple-container');
  const tapPrompt = document.getElementById('tap-prompt');
  const cpsEl = document.getElementById('cps-val');
  const timeEl = document.getElementById('time-val');
  const clicksEl = document.getElementById('clicks-val');
  const modeButtons = document.querySelectorAll('.mode-btn');

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

  const startBestCps = document.getElementById('start-best-cps');
  const finalCps = document.getElementById('final-cps');
  const finalClicks = document.getElementById('final-clicks');
  const finalPeak = document.getElementById('final-peak');
  const finalBest = document.getElementById('final-best');
  const gameoverRank = document.getElementById('gameover-rank');

  // Game state
  let selectedDuration = 5;
  let gameState = 'START'; // START, READY, RUNNING, GAMEOVER, PAUSED
  let bestCPS = parseFloat(localStorage.getItem('tapchallenge_best_cps') || '0.0');

  let clicks = 0;
  let startTime = 0;
  let timerInterval = null;
  let clickTimestamps = [];
  let peakBurst = 0;

  function getRank(cps) {
    if (cps >= 13) return '⚡ Rank: Godlike Butterfly (13+ CPS)';
    if (cps >= 10) return '🐆 Rank: Lightning Jitter (10-13 CPS)';
    if (cps >= 7.5) return '🐇 Rank: Cheetah Sprint (7.5-10 CPS)';
    if (cps >= 5) return '🐾 Rank: Steady Rabbit (5-7.5 CPS)';
    return '🐢 Rank: Casual Walker (<5 CPS)';
  }

  function spawnRipple(clientX, clientY) {
    const rect = tapZone.getBoundingClientRect();
    const x = clientX ? clientX - rect.left : rect.width / 2;
    const y = clientY ? clientY - rect.top : rect.height / 2;

    const rip = document.createElement('div');
    rip.className = 'ripple-circle';
    rip.style.left = `${x}px`;
    rip.style.top = `${y}px`;
    rip.style.width = '100px';
    rip.style.height = '100px';

    rippleContainer.appendChild(rip);
    setTimeout(() => {
      rip.remove();
    }, 450);
  }

  function handleTap(e) {
    if (gameState === 'START') return;

    if (gameState === 'READY') {
      gameState = 'RUNNING';
      startTime = performance.now();
      tapPrompt.textContent = 'BURST SPEED!';
      startTimer();
    }

    if (gameState !== 'RUNNING') return;

    clicks++;
    clicksEl.textContent = clicks;

    const now = performance.now();
    clickTimestamps.push(now);

    // Calculate rolling peak 1-second burst
    while (clickTimestamps.length > 0 && now - clickTimestamps[0] > 1000) {
      clickTimestamps.shift();
    }
    const current1sBurst = clickTimestamps.length;
    if (current1sBurst > peakBurst) peakBurst = current1sBurst;

    // Real-time CPS
    const elapsedSec = Math.max(0.1, (now - startTime) / 1000);
    const liveCPS = (clicks / elapsedSec).toFixed(1);
    cpsEl.textContent = liveCPS;

    spawnRipple(e.clientX, e.clientY);
    sound.playClick();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameState !== 'RUNNING') return;

      const elapsed = (performance.now() - startTime) / 1000;
      const remaining = Math.max(0, selectedDuration - elapsed);
      timeEl.textContent = `${remaining.toFixed(1)}s`;

      if (remaining <= 0) {
        endChallenge();
      }
    }, 50);
  }

  function endChallenge() {
    gameState = 'GAMEOVER';
    clearInterval(timerInterval);
    sound.playFinish();

    const finalAvgCps = parseFloat((clicks / selectedDuration).toFixed(1));
    if (finalAvgCps > bestCPS) {
      bestCPS = finalAvgCps;
      localStorage.setItem('tapchallenge_best_cps', bestCPS.toFixed(1));
    }

    finalCps.textContent = `${finalAvgCps.toFixed(1)} CPS`;
    finalClicks.textContent = clicks;
    finalPeak.textContent = `${peakBurst.toFixed(1)} CPS`;
    finalBest.textContent = `${bestCPS.toFixed(1)} CPS`;
    gameoverRank.textContent = getRank(finalAvgCps);

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    clicks = 0;
    clickTimestamps = [];
    peakBurst = 0;
    clearInterval(timerInterval);

    clicksEl.textContent = '0';
    cpsEl.textContent = '0.0';
    timeEl.textContent = `${selectedDuration.toFixed(1)}s`;
    tapPrompt.textContent = 'TAP TO BEGIN!';
    gameState = 'READY';
  }

  function startGame() {
    sound.init();
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    initGame();
  }

  function pauseGame() {
    if (gameState !== 'RUNNING') return;
    gameState = 'PAUSED';
    clearInterval(timerInterval);
    modalPause.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'PAUSED') return;
    gameState = 'RUNNING';
    modalPause.classList.add('hidden');
    startTimer();
  }

  // Event Listeners
  btnStart.addEventListener('click', startGame);
  btnResume.addEventListener('click', resumeGame);
  btnRestart.addEventListener('click', startGame);
  btnPauseRestart.addEventListener('click', startGame);
  btnPause.addEventListener('click', () => {
    if (gameState === 'RUNNING') pauseGame();
    else if (gameState === 'PAUSED') resumeGame();
  });

  btnSound.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState === 'RUNNING') return;
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDuration = parseInt(btn.dataset.time, 10);
      initGame();
    });
  });

  tapZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handleTap(e);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleTap(e);
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'RUNNING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  startBestCps.textContent = bestCPS.toFixed(1);
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
})();

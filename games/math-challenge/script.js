(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('mathchallenge_muted') === 'true';
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

    playCorrect() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    }

    playWrong() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }

    playFinish() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.18);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('mathchallenge_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const equationEl = document.getElementById('equation-text');
  const optionsGrid = document.getElementById('options-grid');
  const scoreEl = document.getElementById('score-val');
  const timeEl = document.getElementById('time-val');
  const comboEl = document.getElementById('combo-val');

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
  const finalCorrect = document.getElementById('final-correct');
  const finalStreak = document.getElementById('final-streak');
  const finalBest = document.getElementById('final-best');

  // Game state
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('mathchallenge_best_score') || '0', 10);

  let score = 0;
  let timeLeft = 45;
  let combo = 1;
  let maxStreak = 1;
  let correctCount = 0;
  let currentAnswer = 0;
  let clockTimer = null;

  function generateQuestion() {
    const ops = ['+', '-', '*'];
    if (score > 1500) ops.push('/');
    const op = ops[Math.floor(Math.random() * ops.length)];

    let a, b, ans, eq;

    if (op === '+') {
      const max = Math.min(99, 20 + Math.floor(score / 150));
      a = Math.floor(Math.random() * max) + 5;
      b = Math.floor(Math.random() * max) + 5;
      ans = a + b;
      eq = `${a} + ${b} = ?`;
    } else if (op === '-') {
      const max = Math.min(99, 25 + Math.floor(score / 150));
      a = Math.floor(Math.random() * max) + 10;
      b = Math.floor(Math.random() * a) + 2;
      ans = a - b;
      eq = `${a} - ${b} = ?`;
    } else if (op === '*') {
      const maxA = Math.min(12, 6 + Math.floor(score / 400));
      a = Math.floor(Math.random() * maxA) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      ans = a * b;
      eq = `${a} × ${b} = ?`;
    } else {
      b = Math.floor(Math.random() * 10) + 2;
      ans = Math.floor(Math.random() * 12) + 2;
      a = b * ans;
      eq = `${a} ÷ ${b} = ?`;
    }

    currentAnswer = ans;
    equationEl.textContent = eq;

    // Generate 3 unique distractors
    const choices = new Set([ans]);
    while (choices.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      const fake = ans + delta;
      if (fake >= 0) choices.add(fake);
    }

    const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);

    optionsGrid.innerHTML = '';
    shuffled.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = val;
      btn.dataset.val = val;
      btn.addEventListener('click', () => handleAnswer(val, btn));
      optionsGrid.appendChild(btn);
    });
  }

  function handleAnswer(selectedVal, clickedBtn) {
    if (gameState !== 'PLAYING') return;

    if (selectedVal === currentAnswer) {
      // Correct!
      sound.playCorrect();
      clickedBtn.classList.add('correct');
      score += 100 * combo;
      correctCount++;
      combo = Math.min(5, combo + 1);
      if (combo > maxStreak) maxStreak = combo;

      updateHUD();
      setTimeout(generateQuestion, 200);
    } else {
      // Wrong!
      sound.playWrong();
      clickedBtn.classList.add('wrong');
      score = Math.max(0, score - 50);
      combo = 1;
      timeLeft = Math.max(0, timeLeft - 3);

      updateHUD();
      setTimeout(generateQuestion, 300);
    }
  }

  function updateHUD() {
    scoreEl.textContent = score;
    timeEl.textContent = `${timeLeft}s`;
    comboEl.textContent = `x${combo}`;
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    clearInterval(clockTimer);
    sound.playFinish();

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('mathchallenge_best_score', bestScore);
    }

    finalScore.textContent = score;
    finalCorrect.textContent = correctCount;
    finalStreak.textContent = `x${maxStreak}`;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    score = 0;
    timeLeft = 45;
    combo = 1;
    maxStreak = 1;
    correctCount = 0;
    clearInterval(clockTimer);

    updateHUD();
    generateQuestion();

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

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
})();

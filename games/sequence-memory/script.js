(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('sequencememory_muted') === 'true';
      this.frequencies = [329.63, 440.00, 261.63, 523.25]; // E4, A4, C4, C5
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

    playTone(padIndex, duration = 0.28) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const freq = this.frequencies[padIndex] || 440;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playError() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('sequencememory_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const pads = document.querySelectorAll('.simon-pad');
  const simonStatus = document.getElementById('simon-status');
  const levelEl = document.getElementById('level-val');
  const scoreEl = document.getElementById('score-val');

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
  const finalRounds = document.getElementById('final-rounds');
  const finalChain = document.getElementById('final-chain');
  const finalRating = document.getElementById('final-rating');
  const finalBest = document.getElementById('final-best');

  // State
  let gameState = 'START'; // START, WATCHING, PLAYER_TURN, PAUSED, GAMEOVER
  let bestScore = parseInt(localStorage.getItem('sequencememory_best_score') || '0', 10);

  let sequence = [];
  let playerStep = 0;
  let round = 1;
  let playSequenceTimeout = null;

  function lightPad(idx, duration = 300) {
    const pad = document.querySelector(`.simon-pad[data-id="${idx}"]`);
    if (pad) {
      pad.classList.add('active');
      sound.playTone(idx, duration / 1000);
      setTimeout(() => {
        pad.classList.remove('active');
      }, duration);
    }
  }

  function playSequence() {
    gameState = 'WATCHING';
    simonStatus.textContent = 'OBSERVE PATTERN...';
    simonStatus.style.color = '#38bdf8';

    let i = 0;
    const interval = Math.max(280, 500 - round * 15);

    function nextStep() {
      if (gameState !== 'WATCHING') return;
      if (i < sequence.length) {
        lightPad(sequence[i], interval * 0.7);
        i++;
        playSequenceTimeout = setTimeout(nextStep, interval);
      } else {
        gameState = 'PLAYER_TURN';
        playerStep = 0;
        simonStatus.textContent = 'YOUR TURN!';
        simonStatus.style.color = '#10b981';
      }
    }

    playSequenceTimeout = setTimeout(nextStep, 600);
  }

  function handlePadInput(idx) {
    if (gameState !== 'PLAYER_TURN') return;

    lightPad(idx, 200);

    if (sequence[playerStep] === idx) {
      playerStep++;
      if (playerStep === sequence.length) {
        // Round cleared!
        scoreEl.textContent = sequence.length;
        simonStatus.textContent = 'PERFECT! NEXT LEVEL...';
        simonStatus.style.color = '#f59e0b';
        round++;
        levelEl.textContent = round;
        sequence.push(Math.floor(Math.random() * 4));
        gameState = 'WATCHING';
        setTimeout(playSequence, 900);
      }
    } else {
      // Wrong pad clicked!
      gameOver();
    }
  }

  function getRating(len) {
    if (len >= 20) return 'Genius 🧠';
    if (len >= 14) return 'Master ⚡';
    if (len >= 9) return 'Sharp 🎯';
    if (len >= 5) return 'Adept 💡';
    return 'Novice 🌱';
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    sound.playError();
    clearTimeout(playSequenceTimeout);

    const longest = Math.max(0, sequence.length - 1);
    if (longest > bestScore) {
      bestScore = longest;
      localStorage.setItem('sequencememory_best_score', bestScore);
    }

    finalRounds.textContent = round - 1;
    finalChain.textContent = longest;
    finalRating.textContent = getRating(longest);
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    round = 1;
    sequence = [Math.floor(Math.random() * 4)];
    playerStep = 0;
    levelEl.textContent = '1';
    scoreEl.textContent = '0';
    clearTimeout(playSequenceTimeout);
    playSequence();
  }

  function startGame() {
    sound.init();
    gameState = 'WATCHING';
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    initGame();
  }

  function pauseGame() {
    if (gameState !== 'WATCHING' && gameState !== 'PLAYER_TURN') return;
    gameState = 'PAUSED';
    clearTimeout(playSequenceTimeout);
    modalPause.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'PAUSED') return;
    modalPause.classList.add('hidden');
    playSequence();
  }

  // Event Listeners
  btnStart.addEventListener('click', startGame);
  btnResume.addEventListener('click', resumeGame);
  btnRestart.addEventListener('click', startGame);
  btnPauseRestart.addEventListener('click', startGame);
  btnPause.addEventListener('click', () => {
    if (gameState === 'PAUSED') resumeGame();
    else pauseGame();
  });

  btnSound.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
  });

  pads.forEach(pad => {
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const id = parseInt(pad.dataset.id, 10);
      handlePadInput(id);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PAUSED') resumeGame();
      else pauseGame();
    }
  });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
})();

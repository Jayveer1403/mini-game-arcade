(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('slidingpuzzle_muted') === 'true';
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

    playSlide() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }

    playWin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [523, 659, 783, 1046].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.2);
      });
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('slidingpuzzle_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const gridEl = document.getElementById('puzzle-grid');
  const movesValEl = document.getElementById('moves-val');
  const timeValEl = document.getElementById('time-val');
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

  const finalMoves = document.getElementById('final-moves');
  const finalTime = document.getElementById('final-time');
  const finalGrid = document.getElementById('final-grid');
  const finalBestMoves = document.getElementById('final-best-moves');

  // Game state
  let size = 3;
  let tiles = []; // 0 represents empty slot
  let moves = 0;
  let timerSeconds = 0;
  let timerInterval = null;
  let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameState === 'PLAYING') {
        timerSeconds++;
        timeValEl.textContent = formatTime(timerSeconds);
      }
    }, 1000);
  }

  function shuffleSolvable() {
    // Start with solved array
    tiles = [];
    const count = size * size;
    for (let i = 1; i < count; i++) tiles.push(i);
    tiles.push(0); // empty slot at end

    let emptyIdx = count - 1;
    let prevMove = -1;

    // Perform 120 legal random slides from solved state
    for (let step = 0; step < 140; step++) {
      const neighbors = getNeighbors(emptyIdx);
      // Filter out immediate reverse move to prevent backtracking
      const valid = neighbors.filter(n => n !== prevMove);
      const chosen = valid.length > 0
        ? valid[Math.floor(Math.random() * valid.length)]
        : neighbors[0];

      tiles[emptyIdx] = tiles[chosen];
      tiles[chosen] = 0;
      prevMove = emptyIdx;
      emptyIdx = chosen;
    }
  }

  function getNeighbors(idx) {
    const n = [];
    const r = Math.floor(idx / size);
    const c = idx % size;

    if (r > 0) n.push(idx - size);        // Up
    if (r < size - 1) n.push(idx + size); // Down
    if (c > 0) n.push(idx - 1);           // Left
    if (c < size - 1) n.push(idx + 1);    // Right

    return n;
  }

  function renderGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridEl.innerHTML = '';

    tiles.forEach((val, idx) => {
      const tile = document.createElement('div');
      tile.className = 'puzzle-tile' + (val === 0 ? ' empty' : '');
      tile.textContent = val === 0 ? '' : val;
      tile.dataset.index = idx;
      tile.addEventListener('click', () => handleTileClick(idx));
      gridEl.appendChild(tile);
    });
  }

  function handleTileClick(idx) {
    if (gameState !== 'PLAYING') return;
    if (tiles[idx] === 0) return;

    const emptyIdx = tiles.indexOf(0);
    const neighbors = getNeighbors(emptyIdx);

    if (neighbors.includes(idx)) {
      // Valid slide!
      tiles[emptyIdx] = tiles[idx];
      tiles[idx] = 0;
      moves++;
      movesValEl.textContent = moves;
      sound.playSlide();
      renderGrid();

      checkSolved();
    }
  }

  function checkSolved() {
    const count = size * size;
    for (let i = 0; i < count - 1; i++) {
      if (tiles[i] !== i + 1) return;
    }
    if (tiles[count - 1] === 0) {
      // Solved!
      handleWin();
    }
  }

  function handleWin() {
    gameState = 'GAMEOVER';
    clearInterval(timerInterval);
    sound.playWin();

    const storageKey = `slidingpuzzle_best_moves_${size}`;
    let best = localStorage.getItem(storageKey);
    if (!best || moves < parseInt(best, 10)) {
      best = moves;
      localStorage.setItem(storageKey, best);
    }

    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(timerSeconds);
    finalGrid.textContent = `${size}x${size}`;
    finalBestMoves.textContent = `${best} moves`;

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 500);
  }

  function initGame() {
    moves = 0;
    timerSeconds = 0;
    movesValEl.textContent = '0';
    timeValEl.textContent = '00:00';
    clearInterval(timerInterval);

    shuffleSolvable();
    renderGrid();
    startTimer();
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

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      size = parseInt(btn.dataset.size, 10);
      initGame();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  shuffleSolvable();
  renderGrid();
})();

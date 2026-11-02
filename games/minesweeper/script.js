(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('minesweeper_muted') === 'true';
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playFlag() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }

    playExplosion() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    }

    playWin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [440, 554, 659, 880].forEach((freq, idx) => {
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
      localStorage.setItem('minesweeper_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const gridEl = document.getElementById('mine-grid');
  const minesValEl = document.getElementById('mines-val');
  const timeValEl = document.getElementById('time-val');
  const flagToggleBtn = document.getElementById('btn-flag-toggle');
  const flagModeIcon = document.getElementById('flag-mode-icon');
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

  const finalTime = document.getElementById('final-time');
  const finalDiff = document.getElementById('final-diff');
  const finalTiles = document.getElementById('final-tiles');
  const finalBest = document.getElementById('final-best');
  const gameoverIcon = document.getElementById('gameover-icon');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');

  // Config & State
  const CONFIGS = {
    easy: { size: 9, mines: 10 },
    med: { size: 12, mines: 20 }
  };

  let currentDiff = 'easy';
  let size = 9;
  let totalMines = 10;
  let flagMode = false;
  let gameState = 'START'; // START, READY, PLAYING, PAUSED, GAMEOVER

  let grid = [];
  let cellsDOM = [];
  let firstClick = true;
  let timer = 0;
  let timerInterval = null;
  let flagsCount = 0;
  let revealedCount = 0;

  function buildGridDOM() {
    const cfg = CONFIGS[currentDiff];
    size = cfg.size;
    totalMines = cfg.mines;

    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridEl.innerHTML = '';
    cellsDOM = [];

    for (let r = 0; r < size; r++) {
      cellsDOM[r] = [];
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        cell.addEventListener('click', (e) => handleCellClick(r, c));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c);
        });

        gridEl.appendChild(cell);
        cellsDOM[r][c] = cell;
      }
    }
  }

  function initGame() {
    firstClick = true;
    timer = 0;
    flagsCount = 0;
    revealedCount = 0;
    clearInterval(timerInterval);

    timeValEl.textContent = '000';
    minesValEl.textContent = totalMines;

    // Reset internal grid data
    grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        grid[r][c] = {
          mine: false,
          revealed: false,
          flagged: false,
          count: 0
        };
        cellsDOM[r][c].className = 'mine-cell';
        cellsDOM[r][c].textContent = '';
      }
    }
    gameState = 'READY';
  }

  function generateMines(safeR, safeC) {
    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);

      // Protect first click and its 8 neighbors
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;

      if (!grid[r][c].mine) {
        grid[r][c].mine = true;
        placed++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc].mine) {
                count++;
              }
            }
          }
          grid[r][c].count = count;
        }
      }
    }
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameState === 'PLAYING') {
        timer++;
        timeValEl.textContent = String(Math.min(999, timer)).padStart(3, '0');
      }
    }, 1000);
  }

  function handleCellClick(r, c) {
    if (gameState !== 'READY' && gameState !== 'PLAYING') return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    const cell = grid[r][c];
    if (cell.flagged || cell.revealed) return;

    if (firstClick) {
      firstClick = false;
      gameState = 'PLAYING';
      generateMines(r, c);
      startTimer();
    }

    if (cell.mine) {
      // Hit a mine!
      gameOver(false, r, c);
    } else {
      reveal(r, c);
      sound.playClick();
      checkWin();
    }
  }

  function toggleFlag(r, c) {
    if (gameState !== 'READY' && gameState !== 'PLAYING') return;
    const cell = grid[r][c];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    sound.playFlag();

    if (cell.flagged) {
      flagsCount++;
      cellsDOM[r][c].textContent = '🚩';
    } else {
      flagsCount--;
      cellsDOM[r][c].textContent = '';
    }

    minesValEl.textContent = Math.max(0, totalMines - flagsCount);
  }

  function reveal(r, c) {
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged || cell.mine) return;

    cell.revealed = true;
    revealedCount++;
    const dom = cellsDOM[r][c];
    dom.classList.add('revealed');

    if (cell.count > 0) {
      dom.textContent = cell.count;
      dom.dataset.count = cell.count;
    } else {
      dom.textContent = '';
      // Cascade flood fill 8 neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            reveal(nr, nc);
          }
        }
      }
    }
  }

  function checkWin() {
    const totalSafe = size * size - totalMines;
    if (revealedCount === totalSafe) {
      gameOver(true);
    }
  }

  function gameOver(won, triggerR, triggerC) {
    gameState = 'GAMEOVER';
    clearInterval(timerInterval);

    const storageKey = `minesweeper_best_time_${currentDiff}`;
    let best = localStorage.getItem(storageKey);

    if (won) {
      sound.playWin();
      if (!best || timer < parseInt(best, 10)) {
        best = timer;
        localStorage.setItem(storageKey, best);
      }
      gameoverIcon.textContent = '🏆';
      gameoverTitle.textContent = 'MINEFIELD SECURED!';
      gameoverReason.textContent = 'Flawless logic! Every explosive disarmed!';
    } else {
      sound.playExplosion();
      // Reveal all mines
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c].mine) {
            cellsDOM[r][c].classList.add('mine');
            cellsDOM[r][c].textContent = '💣';
          }
        }
      }
      if (triggerR !== undefined) {
        cellsDOM[triggerR][triggerC].style.background = '#b91c1c';
      }
      gameoverIcon.textContent = '💥';
      gameoverTitle.textContent = 'DETONATION TRIGGERED!';
      gameoverReason.textContent = 'Stepped on an active explosive mine!';
    }

    finalTime.textContent = `${timer}s`;
    finalDiff.textContent = `${size}x${size}`;
    finalTiles.textContent = `${revealedCount}/${size * size - totalMines}`;
    finalBest.textContent = best ? `${best}s` : '--';

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 800);
  }

  function startGame() {
    sound.init();
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

  flagToggleBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    if (flagMode) {
      flagToggleBtn.classList.add('flag-active');
      flagModeIcon.textContent = '🚩 Flag Mode';
    } else {
      flagToggleBtn.classList.remove('flag-active');
      flagModeIcon.textContent = '⛏️ Reveal';
    }
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDiff = btn.dataset.diff;
      buildGridDOM();
      initGame();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
      flagToggleBtn.click();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  buildGridDOM();
  initGame();
})();

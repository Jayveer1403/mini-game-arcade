(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('colorfill_muted') === 'true';
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

    playSplash() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
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
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
      });
    }

    playLose() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('colorfill_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  const SIZE = 12;
  const MAX_MOVES = 22;
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];

  // Elements
  const gridEl = document.getElementById('flood-grid');
  const movesValEl = document.getElementById('moves-val');
  const filledValEl = document.getElementById('filled-val');
  const paletteButtons = document.querySelectorAll('.palette-btn');

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
  const finalPct = document.getElementById('final-pct');
  const finalBest = document.getElementById('final-best');
  const gameoverIcon = document.getElementById('gameover-icon');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');

  // Game state
  let gameState = 'START';
  let bestMoves = localStorage.getItem('colorfill_best_moves');

  let grid = [];
  let cellsDOM = [];
  let moves = 0;

  function buildGridDOM() {
    gridEl.innerHTML = '';
    cellsDOM = [];
    for (let r = 0; r < SIZE; r++) {
      cellsDOM[r] = [];
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'flood-cell';
        gridEl.appendChild(cell);
        cellsDOM[r][c] = cell;
      }
    }
  }

  function getConnectedComponent() {
    const startColor = grid[0][0];
    const visited = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));
    const queue = [[0, 0]];
    visited[0][0] = true;
    const component = [[0, 0]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];

      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !visited[nr][nc]) {
          if (grid[nr][nc] === startColor) {
            visited[nr][nc] = true;
            component.push([nr, nc]);
            queue.push([nr, nc]);
          }
        }
      }
    }

    return component;
  }

  function renderGrid() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        cellsDOM[r][c].style.backgroundColor = COLORS[grid[r][c]];
      }
    }

    const component = getConnectedComponent();
    const pct = Math.round((component.length / (SIZE * SIZE)) * 100);
    movesValEl.textContent = `${moves} / ${MAX_MOVES}`;
    filledValEl.textContent = `${pct}%`;
  }

  function flood(newColorIndex) {
    if (gameState !== 'PLAYING') return;
    if (newColorIndex === grid[0][0]) return; // Same color

    const component = getConnectedComponent();
    component.forEach(([r, c]) => {
      grid[r][c] = newColorIndex;
    });

    moves++;
    sound.playSplash();
    renderGrid();

    const newComponent = getConnectedComponent();
    if (newComponent.length === SIZE * SIZE) {
      // Won!
      handleGameOver(true);
    } else if (moves >= MAX_MOVES) {
      // Out of moves!
      handleGameOver(false);
    }
  }

  function handleGameOver(won) {
    gameState = 'GAMEOVER';

    const component = getConnectedComponent();
    const pct = Math.round((component.length / (SIZE * SIZE)) * 100);

    if (won) {
      sound.playWin();
      if (!bestMoves || moves < parseInt(bestMoves, 10)) {
        bestMoves = moves;
        localStorage.setItem('colorfill_best_moves', bestMoves);
      }
      gameoverIcon.textContent = '🏆';
      gameoverTitle.textContent = 'GRID UNIFIED!';
      gameoverReason.textContent = 'Monochrome harmony achieved with tactical efficiency!';
    } else {
      sound.playLose();
      gameoverIcon.textContent = '⏱️';
      gameoverTitle.textContent = 'OUT OF MOVES!';
      gameoverReason.textContent = `Reached ${pct}% coverage before move reserves ran dry.`;
    }

    finalMoves.textContent = moves;
    finalPct.textContent = `${pct}%`;
    finalBest.textContent = bestMoves ? `${bestMoves} moves` : '--';

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 600);
  }

  function initGame() {
    moves = 0;
    grid = [];
    for (let r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c++) {
        grid[r][c] = Math.floor(Math.random() * COLORS.length);
      }
    }
    renderGrid();
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

  paletteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const colorIdx = parseInt(btn.dataset.color, 10);
      flood(colorIdx);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
      const idx = parseInt(e.key, 10) - 1;
      flood(idx);
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

(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('connectfour_muted') === 'true';
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

    playDrop() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
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

    playTie() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('connectfour_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  const ROWS = 6;
  const COLS = 7;

  // Elements
  const gridEl = document.getElementById('c4-grid');
  const dropButtons = document.querySelectorAll('.drop-btn');
  const turnIndicator = document.getElementById('turn-indicator');
  const winsEl = document.getElementById('wins-val');
  const lossesEl = document.getElementById('losses-val');
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

  const finalWins = document.getElementById('final-wins');
  const finalLosses = document.getElementById('final-losses');
  const finalTotal = document.getElementById('final-total');
  const finalRate = document.getElementById('final-rate');
  const gameoverIcon = document.getElementById('gameover-icon');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');

  // Stats
  let stats = JSON.parse(localStorage.getItem('connectfour_stats') || '{"wins":0,"losses":0,"draws":0}');

  // Game state
  let gameMode = 'ai'; // 'ai', '2p'
  let gameState = 'START';
  let grid = [];
  let currentTurn = 'red'; // 'red' or 'yellow'
  let cellsDOM = [];

  function setupBoardDOM() {
    gridEl.innerHTML = '';
    cellsDOM = [];
    for (let r = 0; r < ROWS; r++) {
      cellsDOM[r] = [];
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', () => handleColClick(c));
        gridEl.appendChild(cell);
        cellsDOM[r][c] = cell;
      }
    }
  }

  function updateHUD() {
    winsEl.textContent = stats.wins;
    lossesEl.textContent = stats.losses;
  }

  function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = Array(COLS).fill(null);
      for (let c = 0; c < COLS; c++) {
        cellsDOM[r][c].className = 'c4-cell';
      }
    }
    currentTurn = 'red';
    turnIndicator.textContent = "RED PLAYER's TURN";
    turnIndicator.style.color = '#ef4444';
    updateHUD();
  }

  function getAvailableRow(col, board = grid) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) return r;
    }
    return -1;
  }

  function checkWin(board = grid) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const p = board[r][c];
        if (p && p === board[r][c+1] && p === board[r][c+2] && p === board[r][c+3]) {
          return { winner: p, coords: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
        }
      }
    }

    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = board[r][c];
        if (p && p === board[r+1][c] && p === board[r+2][c] && p === board[r+3][c]) {
          return { winner: p, coords: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
        }
      }
    }

    // Diagonal Down-Right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const p = board[r][c];
        if (p && p === board[r+1][c+1] && p === board[r+2][c+2] && p === board[r+3][c+3]) {
          return { winner: p, coords: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
        }
      }
    }

    // Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const p = board[r][c];
        if (p && p === board[r-1][c+1] && p === board[r-2][c+2] && p === board[r-3][c+3]) {
          return { winner: p, coords: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
        }
      }
    }

    // Check Draw (all columns full)
    let full = true;
    for (let c = 0; c < COLS; c++) {
      if (board[0][c] === null) {
        full = false;
        break;
      }
    }
    if (full) return { winner: 'DRAW', coords: [] };

    return null;
  }

  function handleColClick(col) {
    if (gameState !== 'PLAYING') return;
    if (gameMode === 'ai' && currentTurn !== 'red') return;

    dropDisc(col, currentTurn);
  }

  function dropDisc(col, player) {
    const row = getAvailableRow(col);
    if (row === -1) return; // Column full

    grid[row][col] = player;
    cellsDOM[row][col].classList.add(player);
    sound.playDrop();

    const result = checkWin();
    if (result) {
      handleGameOver(result);
    } else {
      currentTurn = (player === 'red') ? 'yellow' : 'red';
      if (currentTurn === 'yellow') {
        turnIndicator.textContent = (gameMode === '2p') ? "YELLOW PLAYER's TURN" : "AI COMPUTING...";
        turnIndicator.style.color = '#eab308';
        if (gameMode === 'ai') {
          setTimeout(aiMove, 400);
        }
      } else {
        turnIndicator.textContent = "RED PLAYER's TURN";
        turnIndicator.style.color = '#ef4444';
      }
    }
  }

  function aiMove() {
    if (gameState !== 'PLAYING') return;

    // 1. Can AI win immediately?
    for (let c = 0; c < COLS; c++) {
      const r = getAvailableRow(c);
      if (r !== -1) {
        grid[r][c] = 'yellow';
        const win = checkWin();
        grid[r][c] = null;
        if (win && win.winner === 'yellow') {
          dropDisc(c, 'yellow');
          return;
        }
      }
    }

    // 2. Can player win next move? Block them!
    for (let c = 0; c < COLS; c++) {
      const r = getAvailableRow(c);
      if (r !== -1) {
        grid[r][c] = 'red';
        const win = checkWin();
        grid[r][c] = null;
        if (win && win.winner === 'red') {
          dropDisc(c, 'yellow');
          return;
        }
      }
    }

    // 3. Center preference: [3, 2, 4, 1, 5, 0, 6]
    const pref = [3, 2, 4, 1, 5, 0, 6];
    for (const c of pref) {
      if (getAvailableRow(c) !== -1) {
        dropDisc(c, 'yellow');
        return;
      }
    }
  }

  function handleGameOver(result) {
    gameState = 'GAMEOVER';

    if (result.winner === 'DRAW') {
      sound.playTie();
      stats.draws++;
      gameoverIcon.textContent = '🤝';
      gameoverTitle.textContent = 'STALEMATE DRAW!';
      gameoverReason.textContent = 'Full board with no 4-in-a-row connections!';
    } else {
      sound.playWin();
      result.coords.forEach(([r, c]) => {
        cellsDOM[r][c].classList.add('win-pulse');
      });

      if (result.winner === 'red') {
        stats.wins++;
        gameoverIcon.textContent = '🏆';
        gameoverTitle.textContent = (gameMode === '2p') ? 'RED PLAYER WINS!' : 'YOU DEFEATED THE AI!';
        gameoverReason.textContent = 'Four red discs connected!';
      } else {
        stats.losses++;
        gameoverIcon.textContent = (gameMode === '2p') ? '🏆' : '🤖';
        gameoverTitle.textContent = (gameMode === '2p') ? 'YELLOW PLAYER WINS!' : 'AI OUTSMARTED YOU!';
        gameoverReason.textContent = 'Four yellow discs connected!';
      }
    }

    localStorage.setItem('connectfour_stats', JSON.stringify(stats));
    updateHUD();

    const total = stats.wins + stats.losses + stats.draws;
    const rate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

    finalWins.textContent = stats.wins;
    finalLosses.textContent = stats.losses;
    finalTotal.textContent = total;
    finalRate.textContent = `${rate}%`;

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 700);
  }

  function startGame() {
    sound.init();
    gameState = 'PLAYING';
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    initGrid();
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
      gameMode = btn.dataset.mode;
      initGrid();
    });
  });

  dropButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const col = parseInt(btn.dataset.col, 10);
      handleColClick(col);
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
  setupBoardDOM();
  updateHUD();
})();

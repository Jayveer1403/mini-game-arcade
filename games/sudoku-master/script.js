(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('sudokumaster_muted') === 'true';
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

    playPlace() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playError() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
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
      localStorage.setItem('sudokumaster_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const gridEl = document.getElementById('sudoku-grid');
  const mistakesValEl = document.getElementById('mistakes-val');
  const timeValEl = document.getElementById('time-val');
  const numButtons = document.querySelectorAll('.num-btn');
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
  const finalMistakes = document.getElementById('final-mistakes');
  const finalBest = document.getElementById('final-best');
  const gameoverIcon = document.getElementById('gameover-icon');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');

  // Sudoku Board Data
  let solution = [];
  let initial = [];
  let current = [];
  let cellsDOM = [];

  let selectedCell = null; // { r, c }
  let currentDiff = 'easy';
  let mistakes = 0;
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

  // Sudoku Generator
  function isValid(b, r, c, val) {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === val || b[i][c] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        if (b[br + dr][bc + dc] === val) return false;
      }
    }
    return true;
  }

  function solveSudoku(b) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of numbers) {
            if (isValid(b, r, c, num)) {
              b[r][c] = num;
              if (solveSudoku(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function generatePuzzle() {
    // Generate complete board
    const b = Array(9).fill(null).map(() => Array(9).fill(0));
    solveSudoku(b);
    solution = b.map(row => [...row]);

    // Remove numbers based on difficulty
    const removeCount = currentDiff === 'hard' ? 48 : (currentDiff === 'med' ? 38 : 28);
    const puzzle = solution.map(row => [...row]);

    let removed = 0;
    while (removed < removeCount) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        removed++;
      }
    }

    initial = puzzle.map(row => [...row]);
    current = puzzle.map(row => [...row]);
  }

  function setupDOM() {
    gridEl.innerHTML = '';
    cellsDOM = [];
    for (let r = 0; r < 9; r++) {
      cellsDOM[r] = [];
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => selectCell(r, c));
        gridEl.appendChild(cell);
        cellsDOM[r][c] = cell;
      }
    }
  }

  function renderBoard() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const dom = cellsDOM[r][c];
        const val = current[r][c];

        dom.textContent = val === 0 ? '' : val;
        dom.className = 'sudoku-cell';

        if (initial[r][c] !== 0) {
          dom.classList.add('fixed');
        }

        if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
          dom.classList.add('selected');
        } else if (selectedCell && val !== 0 && current[selectedCell.r][selectedCell.c] === val) {
          dom.classList.add('highlighted');
        }

        if (val !== 0 && val !== solution[r][c]) {
          dom.classList.add('conflict');
        }
      }
    }
  }

  function selectCell(r, c) {
    if (gameState !== 'PLAYING') return;
    selectedCell = { r, c };
    renderBoard();
  }

  function inputNumber(num) {
    if (gameState !== 'PLAYING' || !selectedCell) return;
    const { r, c } = selectedCell;

    if (initial[r][c] !== 0) return; // Cannot edit original clue

    if (num === 0) {
      // Erase
      current[r][c] = 0;
      renderBoard();
      return;
    }

    if (num === solution[r][c]) {
      current[r][c] = num;
      sound.playPlace();
      renderBoard();
      checkWin();
    } else {
      current[r][c] = num;
      mistakes++;
      mistakesValEl.textContent = `${mistakes} / 3`;
      sound.playError();
      renderBoard();

      if (mistakes >= 3) {
        gameOver(false);
      }
    }
  }

  function checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (current[r][c] !== solution[r][c]) return;
      }
    }
    gameOver(true);
  }

  function gameOver(won) {
    gameState = 'GAMEOVER';
    clearInterval(timerInterval);

    const storageKey = `sudokumaster_best_time_${currentDiff}`;
    let best = localStorage.getItem(storageKey);

    if (won) {
      sound.playWin();
      if (!best || timerSeconds < parseInt(best, 10)) {
        best = timerSeconds;
        localStorage.setItem(storageKey, best);
      }
      gameoverIcon.textContent = '🏆';
      gameoverTitle.textContent = 'SUDOKU MASTERED!';
      gameoverReason.textContent = 'All 81 numbers logically placed!';
    } else {
      gameoverIcon.textContent = '💥';
      gameoverTitle.textContent = 'TOO MANY MISTAKES!';
      gameoverReason.textContent = 'Exceeded maximum allowable conflict errors.';
    }

    finalTime.textContent = formatTime(timerSeconds);
    finalDiff.textContent = currentDiff.toUpperCase();
    finalMistakes.textContent = `${mistakes} / 3`;
    finalBest.textContent = best ? formatTime(parseInt(best, 10)) : '--';

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 600);
  }

  function initGame() {
    mistakes = 0;
    timerSeconds = 0;
    selectedCell = null;
    mistakesValEl.textContent = '0 / 3';
    timeValEl.textContent = '00:00';
    clearInterval(timerInterval);

    generatePuzzle();
    renderBoard();
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
      currentDiff = btn.dataset.diff;
      initGame();
    });
  });

  numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.num, 10);
      inputNumber(num);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'].includes(e.code)) {
      inputNumber(parseInt(e.key, 10));
    } else if (e.code === 'Backspace' || e.code === 'Delete' || e.code === 'Digit0') {
      inputNumber(0);
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  setupDOM();
  generatePuzzle();
  renderBoard();
})();

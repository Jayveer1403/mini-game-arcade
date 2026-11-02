(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('wordsearch_muted') === 'true';
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

    playSelect() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playWordFound() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, this.ctx.currentTime);
      osc.frequency.setValueAtTime(783, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
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
      localStorage.setItem('wordsearch_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  const GRID_SIZE = 10;
  const WORD_POOL = ['CYBER', 'PIXEL', 'RETRO', 'LASER', 'NINJA', 'AVATAR', 'MATRIX', 'BLADE', 'ARCADE', 'ROBOT', 'CHIP', 'TURBO'];

  // Elements
  const wordBankEl = document.getElementById('word-bank');
  const gridEl = document.getElementById('word-grid');
  const wordsValEl = document.getElementById('words-val');
  const timeValEl = document.getElementById('time-val');

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
  const finalWords = document.getElementById('final-words');
  const finalBest = document.getElementById('final-best');

  // Game state
  let gameState = 'START';
  let targetWords = [];
  let foundWords = new Set();
  let grid = [];
  let cellsDOM = [];

  let isSelecting = false;
  let startCell = null;
  let currentSelection = [];
  let timerSeconds = 0;
  let timerInterval = null;

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

  function generatePuzzle() {
    // Select 6 words from pool
    targetWords = [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, 6);
    foundWords.clear();

    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));

    const directions = [
      [0, 1],   // Right
      [1, 0],   // Down
      [1, 1],   // Down-Right
      [-1, 1]   // Up-Right
    ];

    targetWords.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const [dr, dc] = dir;

        const maxR = dr === 1 ? GRID_SIZE - word.length : (dr === -1 ? GRID_SIZE - 1 : GRID_SIZE - 1);
        const minR = dr === -1 ? word.length - 1 : 0;
        const maxC = dc === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;

        const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
        const c = Math.floor(Math.random() * (maxC + 1));

        // Check if word can fit without conflict
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            grid[r + dr * i][c + dc * i] = word[i];
          }
          placed = true;
        }
      }
    });

    // Fill remaining cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === '') {
          grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
  }

  function setupDOM() {
    // Word bank tags
    wordBankEl.innerHTML = '';
    targetWords.forEach(w => {
      const tag = document.createElement('span');
      tag.className = 'word-tag';
      tag.textContent = w;
      tag.dataset.word = w;
      wordBankEl.appendChild(tag);
    });

    // Grid cells
    gridEl.innerHTML = '';
    cellsDOM = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      cellsDOM[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'letter-cell';
        cell.textContent = grid[r][c];
        cell.dataset.r = r;
        cell.dataset.c = c;
        gridEl.appendChild(cell);
        cellsDOM[r][c] = cell;
      }
    }
  }

  function getLine(r1, c1, r2, c2) {
    const dr = r2 - r1;
    const dc = c2 - c1;

    // Check if horizontal, vertical, or 45-deg diagonal
    if (dr === 0 && dc === 0) return [[r1, c1]];
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];

    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    const steps = Math.max(Math.abs(dr), Math.abs(dc));

    const line = [];
    for (let i = 0; i <= steps; i++) {
      line.push([r1 + stepR * i, c1 + stepC * i]);
    }
    return line;
  }

  function clearSelecting() {
    currentSelection.forEach(([r, c]) => {
      cellsDOM[r][c].classList.remove('selecting');
    });
    currentSelection = [];
  }

  function handlePointerDown(e) {
    if (gameState !== 'PLAYING') return;
    const target = e.target.closest('.letter-cell');
    if (!target) return;

    isSelecting = true;
    startCell = { r: parseInt(target.dataset.r, 10), c: parseInt(target.dataset.c, 10) };
    clearSelecting();
    currentSelection = [[startCell.r, startCell.c]];
    target.classList.add('selecting');
    sound.playSelect();
  }

  function handlePointerMove(e) {
    if (!isSelecting || gameState !== 'PLAYING') return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el ? el.closest('.letter-cell') : null;
    if (!target) return;

    const r = parseInt(target.dataset.r, 10);
    const c = parseInt(target.dataset.c, 10);

    const line = getLine(startCell.r, startCell.c, r, c);
    if (line.length > 0) {
      clearSelecting();
      currentSelection = line;
      currentSelection.forEach(([lr, lc]) => {
        cellsDOM[lr][lc].classList.add('selecting');
      });
    }
  }

  function handlePointerUp() {
    if (!isSelecting || gameState !== 'PLAYING') return;
    isSelecting = false;

    if (currentSelection.length > 1) {
      // Form word string
      const str1 = currentSelection.map(([r, c]) => grid[r][c]).join('');
      const str2 = str1.split('').reverse().join('');

      let matchWord = null;
      if (targetWords.includes(str1) && !foundWords.has(str1)) matchWord = str1;
      else if (targetWords.includes(str2) && !foundWords.has(str2)) matchWord = str2;

      if (matchWord) {
        // Discovered!
        foundWords.add(matchWord);
        sound.playWordFound();

        currentSelection.forEach(([r, c]) => {
          cellsDOM[r][c].classList.add('found');
        });

        const tag = document.querySelector(`.word-tag[data-word="${matchWord}"]`);
        if (tag) tag.classList.add('found');

        wordsValEl.textContent = `${foundWords.size} / ${targetWords.length}`;

        if (foundWords.size === targetWords.length) {
          handleWin();
        }
      }
    }

    clearSelecting();
  }

  function handleWin() {
    gameState = 'GAMEOVER';
    clearInterval(timerInterval);
    sound.playWin();

    let best = localStorage.getItem('wordsearch_best_time');
    if (!best || timerSeconds < parseInt(best, 10)) {
      best = timerSeconds;
      localStorage.setItem('wordsearch_best_time', best);
    }

    finalTime.textContent = formatTime(timerSeconds);
    finalWords.textContent = `${foundWords.size} / ${targetWords.length}`;
    finalBest.textContent = best ? formatTime(parseInt(best, 10)) : '--';

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 600);
  }

  function initGame() {
    timerSeconds = 0;
    timeValEl.textContent = '00:00';
    wordsValEl.textContent = '0 / 6';
    clearInterval(timerInterval);

    generatePuzzle();
    setupDOM();
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

  gridEl.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  generatePuzzle();
  setupDOM();
})();

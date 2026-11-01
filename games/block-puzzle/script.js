/**
 * NEON BLOCK PUZZLE - COMPLETE ENGINE
 * 10x10 Grid state, drag-and-drop & tap-to-place mechanics,
 * multi-line clearing, combo multiplier, bomb power-up tool, undo stack,
 * deterministic Daily/Time/Classic modes, and procedural Web Audio synthesis.
 */

// ==========================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================================
class BlockAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return !this.muted;
  }

  // Snappy piece placement thud
  playPlace() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Line Clear Fanfare (pitch scales with simultaneous lines)
  playLineClear(lineCount = 1) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 440 * (1 + lineCount * 0.2);
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
      const count = Math.min(notes.length, Math.max(2, lineCount + 1));

      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i], now + i * 0.05);
        gain.gain.setValueAtTime(0.3, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.18);
      }
    } catch (e) {}
  }

  // Combo Streak Chime
  playComboChime(streak) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const f = 523.25 * (1 + Math.min(streak * 0.12, 1.0));
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Bomb tool detonation boom
  playBomb() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) {}
  }

  // Undo / Whoosh sound
  playUndo() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Invalid placement buzz
  playError() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(100, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }
}

// ==========================================================
// 2. SHAPE LIBRARY & GENERATOR
// ==========================================================
const SHAPES = [
  // 1x1 Dot
  { id: 'dot_1', color: '#00f2fe', matrix: [[1]] },

  // Lines
  { id: 'line_h2', color: '#00e676', matrix: [[1, 1]] },
  { id: 'line_v2', color: '#00e676', matrix: [[1], [1]] },
  { id: 'line_h3', color: '#ffb800', matrix: [[1, 1, 1]] },
  { id: 'line_v3', color: '#ffb800', matrix: [[1], [1], [1]] },
  { id: 'line_h4', color: '#ff007f', matrix: [[1, 1, 1, 1]] },
  { id: 'line_v4', color: '#ff007f', matrix: [[1], [1], [1], [1]] },
  { id: 'line_h5', color: '#9d4edd', matrix: [[1, 1, 1, 1, 1]] },
  { id: 'line_v5', color: '#9d4edd', matrix: [[1], [1], [1], [1], [1]] },

  // Squares & Rectangles
  { id: 'sq_2x2', color: '#ff922b', matrix: [[1, 1], [1, 1]] },
  { id: 'sq_3x3', color: '#e64980', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { id: 'rect_2x3', color: '#4facfe', matrix: [[1, 1, 1], [1, 1, 1]] },
  { id: 'rect_3x2', color: '#4facfe', matrix: [[1, 1], [1, 1], [1, 1]] },

  // L-Shapes (All 4 orientations)
  { id: 'l_1', color: '#ffd43b', matrix: [[1, 0], [1, 0], [1, 1]] },
  { id: 'l_2', color: '#ffd43b', matrix: [[0, 1], [0, 1], [1, 1]] },
  { id: 'l_3', color: '#ffd43b', matrix: [[1, 1, 1], [1, 0, 0]] },
  { id: 'l_4', color: '#ffd43b', matrix: [[1, 1, 1], [0, 0, 1]] },

  // Small Corners (2x2 L)
  { id: 'corner_1', color: '#20c997', matrix: [[1, 1], [1, 0]] },
  { id: 'corner_2', color: '#20c997', matrix: [[1, 1], [0, 1]] },
  { id: 'corner_3', color: '#20c997', matrix: [[1, 0], [1, 1]] },
  { id: 'corner_4', color: '#20c997', matrix: [[0, 1], [1, 1]] },

  // T-Shapes
  { id: 't_down', color: '#a370f7', matrix: [[1, 1, 1], [0, 1, 0]] },
  { id: 't_up', color: '#a370f7', matrix: [[0, 1, 0], [1, 1, 1]] },
  { id: 't_right', color: '#a370f7', matrix: [[1, 0], [1, 1], [1, 0]] },
  { id: 't_left', color: '#a370f7', matrix: [[0, 1], [1, 1], [0, 1]] },

  // Plus shape
  { id: 'plus', color: '#00f2fe', matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },

  // Z & S shapes
  { id: 'z_h', color: '#ff6b6b', matrix: [[1, 1, 0], [0, 1, 1]] },
  { id: 's_h', color: '#51cf66', matrix: [[0, 1, 1], [1, 1, 0]] }
];

// ==========================================================
// 3. MAIN GAME CONTROLLER CLASS
// ==========================================================
class BlockPuzzleGame {
  constructor() {
    this.canvas = document.getElementById('board-canvas');
    this.ctx = this.canvas.getContext('2d');

    // UI elements
    this.scoreValEl = document.getElementById('score-val');
    this.bestScoreValEl = document.getElementById('best-score-val');
    this.modeStatValEl = document.getElementById('mode-stat-val');
    this.modeStatLblEl = document.getElementById('mode-stat-lbl');
    this.comboPillEl = document.getElementById('combo-pill');
    this.comboValEl = document.getElementById('combo-val');
    this.undoCountEl = document.getElementById('undo-count');
    this.bombCountEl = document.getElementById('bomb-count');
    this.comboToastEl = document.getElementById('combo-toast');
    this.comboTitleText = document.getElementById('combo-title-text');
    this.comboBonusText = document.getElementById('combo-bonus-text');
    this.gameToastEl = document.getElementById('game-toast');

    // Modals
    this.modalStart = document.getElementById('modal-start');
    this.modalPause = document.getElementById('modal-pause');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modeInfoBox = document.getElementById('mode-info');
    this.pauseScoreNum = document.getElementById('pause-score-num');
    this.pauseBestNum = document.getElementById('pause-best-num');
    this.gameoverScoreNum = document.getElementById('gameover-score-num');
    this.gameoverTitle = document.getElementById('gameover-title');
    this.gameoverReason = document.getElementById('gameover-reason');
    this.statLinesCleared = document.getElementById('stat-lines-cleared');
    this.statMaxStreak = document.getElementById('stat-max-streak');
    this.statHighScore = document.getElementById('stat-high-score');
    this.newHighBadge = document.getElementById('new-high-badge');

    // Buttons
    this.btnStart = document.getElementById('btn-start-game');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnBombTool = document.getElementById('btn-bomb-tool');
    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnChangeMode = document.getElementById('btn-change-mode');

    // Slots
    this.traySlots = [
      document.getElementById('slot-0'),
      document.getElementById('slot-1'),
      document.getElementById('slot-2')
    ];

    // Audio Engine
    this.audio = new BlockAudio();

    // Board Dimensions
    this.gridSize = 10;
    this.board = Array.from({ length: 10 }, () => Array(10).fill(null));

    // Game State
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.gameMode = 'classic'; // 'classic', 'time', 'challenge'
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('blockpuzzle_high') || '0', 10);
    this.streak = 0;
    this.maxStreak = 0;
    this.totalLinesCleared = 0;
    this.undoAvailable = 3;
    this.bombsAvailable = 1;
    this.bombToolActive = false;

    // Challenge / Time variables
    this.timeRemaining = 120; // 2 minutes for Time Attack
    this.timerInterval = null;
    this.challengeLinesGoal = 12;

    // Undo Stack
    this.historyStack = [];

    // Tray shapes (array of up to 3 shapes)
    this.trayShapes = [null, null, null];
    this.selectedSlotIndex = null;

    // Drag-and-drop state
    this.dragging = false;
    this.dragSlotIndex = null;
    this.dragShape = null;
    this.dragCurrentPos = { x: 0, y: 0 };
    this.dragHoverGrid = null; // { row, col } or null

    // Particles & Line clear animations
    this.clearingLines = []; // rows/cols currently flashing
    this.particles = [];
    this.floatingScores = [];

    // Binds
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);

    this.init();
  }

  init() {
    this.bestScoreValEl.textContent = this.bestScore;
    this.resize();
    window.addEventListener('resize', this.resize);
    this.setupListeners();
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(rect.width, rect.height);
    this.width = size;
    this.height = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.cellSize = size / this.gridSize;
  }

  setupListeners() {
    // Mode tabs
    const descriptions = {
      classic: '<strong>Classic Mode:</strong> Fit blocks onto the 10×10 board and clear lines continuously. Game ends when no tray shape fits anywhere on the grid!',
      time: '<strong>Time Attack Mode:</strong> 2 minutes on the clock! Rapidly clear lines and chain combos before time expires.',
      challenge: '<strong>Challenge Mode:</strong> Clear 12 full rows or columns to achieve victory!'
    };

    document.querySelectorAll('.mode-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.gameMode = tab.getAttribute('data-mode');
        this.modeInfoBox.innerHTML = descriptions[this.gameMode];
      });
    });

    // Start / Restart
    this.btnStart.addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    this.btnPause.addEventListener('click', () => this.togglePause());
    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnRestart.addEventListener('click', () => this.startGame());
    this.btnPlayAgain.addEventListener('click', () => this.startGame());
    this.btnChangeMode.addEventListener('click', () => {
      this.modalGameOver.classList.add('hidden');
      this.modalStart.classList.remove('hidden');
      this.state = 'START';
    });

    this.btnSound.addEventListener('click', () => {
      this.audio.init();
      const on = this.audio.toggleMute();
      this.soundIcon.textContent = on ? '🔊' : '🔇';
      this.showToast(on ? 'Sound On' : 'Sound Muted');
    });

    // Undo Move Button
    this.btnUndo.addEventListener('click', () => this.executeUndo());

    // Bomb Clear Tool
    this.btnBombTool.addEventListener('click', () => {
      if (this.state !== 'PLAYING') return;
      if (this.bombsAvailable <= 0) {
        this.showToast('No Bomb Tools remaining!');
        return;
      }
      this.bombToolActive = !this.bombToolActive;
      this.btnBombTool.classList.toggle('selected', this.bombToolActive);
      if (this.bombToolActive) {
        this.showToast('Bomb Tool Active: Tap any board cell to detonate a 3×3 blast!');
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z') {
        this.executeUndo();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
          this.togglePause();
        }
      }
    });

    // Selection Tray Slots Interactions (Click / Drag Start)
    this.traySlots.forEach((slotEl, idx) => {
      // Tap to select / unselect
      slotEl.addEventListener('click', (e) => {
        if (this.state !== 'PLAYING' || !this.trayShapes[idx]) return;
        this.audio.init();

        if (this.selectedSlotIndex === idx) {
          // Deselect
          this.selectedSlotIndex = null;
          slotEl.classList.remove('selected');
        } else {
          this.traySlots.forEach(s => s.classList.remove('selected'));
          this.selectedSlotIndex = idx;
          slotEl.classList.add('selected');
        }
      });

      // Mouse Drag Start
      slotEl.addEventListener('mousedown', (e) => {
        if (this.state !== 'PLAYING' || !this.trayShapes[idx]) return;
        this.startDrag(idx, e.clientX, e.clientY);
      });

      // Touch Drag Start with non-passive preventDefault
      slotEl.addEventListener('touchstart', (e) => {
        if (this.state !== 'PLAYING' || !this.trayShapes[idx]) return;
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        this.startDrag(idx, t.clientX, t.clientY);
      }, { passive: false });
    });

    // Board Mouse & Touch Placement / Drag Over
    const getBoardPos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { row, col, x, y };
      }
      return null;
    };

    // Canvas Click (Tap to Place or Bomb tool)
    this.canvas.addEventListener('click', (e) => {
      if (this.state !== 'PLAYING') return;
      this.audio.init();

      const pos = getBoardPos(e.clientX, e.clientY);
      if (!pos) return;

      if (this.bombToolActive) {
        this.detonateBomb(pos.row, pos.col);
        return;
      }

      if (this.selectedSlotIndex !== null && this.trayShapes[this.selectedSlotIndex]) {
        const shape = this.trayShapes[this.selectedSlotIndex];
        if (this.canPlaceShape(shape, pos.row, pos.col)) {
          this.placeShape(shape, pos.row, pos.col, this.selectedSlotIndex);
          this.selectedSlotIndex = null;
          this.traySlots.forEach(s => s.classList.remove('selected'));
        } else {
          this.audio.playError();
        }
      }
    });

    // Window Drag Listeners
    const onMove = (clientX, clientY) => {
      if (!this.dragging) return;
      this.dragCurrentPos = { x: clientX, y: clientY };
      const pos = getBoardPos(clientX, clientY - (this.cellSize * 1.5)); // Offset slightly above finger
      if (pos && this.canPlaceShape(this.dragShape, pos.row, pos.col)) {
        this.dragHoverGrid = { row: pos.row, col: pos.col };
      } else {
        this.dragHoverGrid = null;
      }
    };

    const onEnd = (clientX, clientY) => {
      if (!this.dragging) return;
      const pos = getBoardPos(clientX, clientY - (this.cellSize * 1.5));
      if (pos && this.canPlaceShape(this.dragShape, pos.row, pos.col)) {
        this.placeShape(this.dragShape, pos.row, pos.col, this.dragSlotIndex);
      } else {
        this.audio.playError();
      }

      this.dragging = false;
      this.dragSlotIndex = null;
      this.dragShape = null;
      this.dragHoverGrid = null;
      this.renderTray();
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onEnd(e.clientX, e.clientY));

    window.addEventListener('touchmove', (e) => {
      if (this.dragging && e.cancelable) e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (!this.dragging) return;
      if (e.cancelable) e.preventDefault();
      const t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    }, { passive: false });
  }

  startDrag(slotIdx, clientX, clientY) {
    this.audio.init();
    this.dragging = true;
    this.dragSlotIndex = slotIdx;
    this.dragShape = this.trayShapes[slotIdx];
    this.dragCurrentPos = { x: clientX, y: clientY };
    this.dragHoverGrid = null;
  }

  startGame() {
    this.modalStart.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');

    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.totalLinesCleared = 0;
    this.undoAvailable = 3;
    this.bombsAvailable = 1;
    this.bombToolActive = false;
    this.historyStack = [];
    this.selectedSlotIndex = null;

    this.undoCountEl.textContent = this.undoAvailable;
    this.bombCountEl.textContent = this.bombsAvailable;
    this.btnBombTool.classList.remove('selected');
    this.comboPillEl.classList.add('hidden');

    // Clear Board
    this.board = Array.from({ length: 10 }, () => Array(10).fill(null));

    if (this.gameMode === 'time') {
      this.timeRemaining = 120;
      this.modeStatLblEl.textContent = 'TIME';
      this.modeStatValEl.textContent = '120s';
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.state === 'PLAYING') {
          this.timeRemaining--;
          this.modeStatValEl.textContent = `${this.timeRemaining}s`;
          if (this.timeRemaining <= 0) {
            this.triggerGameOver(true, "Time's Up! High Score Blitz Achieved!");
          }
        }
      }, 1000);
    } else if (this.gameMode === 'challenge') {
      this.modeStatLblEl.textContent = 'GOAL';
      this.modeStatValEl.textContent = '0 / 12';
    } else {
      this.modeStatLblEl.textContent = 'MODE';
      this.modeStatValEl.textContent = 'Classic';
    }

    this.updateScoreUI();
    this.replenishTray();

    this.state = 'PLAYING';
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseScoreNum.textContent = this.score;
      this.pauseBestNum.textContent = this.bestScore;
      this.modalPause.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.modalPause.classList.add('hidden');
    }
  }

  // Save Board State for Undo
  saveStateForUndo() {
    if (this.undoAvailable <= 0) return;
    const snapshot = {
      board: this.board.map(row => [...row]),
      score: this.score,
      trayShapes: [...this.trayShapes],
      totalLinesCleared: this.totalLinesCleared
    };
    this.historyStack.push(snapshot);
    if (this.historyStack.length > 3) this.historyStack.shift();
  }

  executeUndo() {
    if (this.state !== 'PLAYING' || this.undoAvailable <= 0 || this.historyStack.length === 0) {
      this.showToast('No more Undo moves available!');
      return;
    }

    this.audio.playUndo();
    const prev = this.historyStack.pop();
    this.board = prev.board.map(row => [...row]);
    this.score = prev.score;
    this.trayShapes = [...prev.trayShapes];
    this.totalLinesCleared = prev.totalLinesCleared;

    this.undoAvailable--;
    this.undoCountEl.textContent = this.undoAvailable;
    this.updateScoreUI();
    this.renderTray();
    this.showToast('Move Undone ↩️');
  }

  detonateBomb(centerRow, centerCol) {
    this.bombsAvailable--;
    this.bombCountEl.textContent = this.bombsAvailable;
    this.bombToolActive = false;
    this.btnBombTool.classList.remove('selected');

    this.audio.playBomb();

    // Clear 3x3 cells
    let clearedCount = 0;
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r >= 0 && r < 10 && c >= 0 && c < 10) {
          if (this.board[r][c] !== null) {
            this.board[r][c] = null;
            clearedCount++;
            // Particles
            for (let p = 0; p < 8; p++) {
              this.particles.push(new BlockParticle(c * this.cellSize + this.cellSize / 2, r * this.cellSize + this.cellSize / 2, '#ff007f'));
            }
          }
        }
      }
    }

    this.score += clearedCount * 15;
    this.updateScoreUI();
    this.showToast(`💥 Bomb Detonated! Cleared ${clearedCount} cells!`);
  }

  // ==========================================================
  // 4. PLACEMENT & LINE CLEARING LOGIC
  // ==========================================================
  canPlaceShape(shape, startRow, startCol) {
    if (!shape) return false;
    const m = shape.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c] === 1) {
          const br = startRow + r;
          const bc = startCol + c;
          if (br < 0 || br >= 10 || bc < 0 || bc >= 10 || this.board[br][bc] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  placeShape(shape, startRow, startCol, slotIdx) {
    this.saveStateForUndo();

    const m = shape.matrix;
    let blockCount = 0;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c] === 1) {
          this.board[startRow + r][startCol + c] = shape.color;
          blockCount++;
        }
      }
    }

    this.audio.playPlace();

    // Points for placement
    const placePoints = blockCount * 10;
    this.score += placePoints;
    this.floatingScores.push(new FloatingText(startCol * this.cellSize + 20, startRow * this.cellSize + 20, `+${placePoints}`));

    // Remove from tray
    this.trayShapes[slotIdx] = null;
    this.renderTray();

    // Check Completed Lines
    this.checkLines();

    // Check if Tray needs replenishment
    if (this.trayShapes.every(s => s === null)) {
      this.replenishTray();
    }

    // Check Game Over
    if (!this.hasAnyValidMove()) {
      setTimeout(() => {
        this.triggerGameOver(false, "No available tray blocks fit on the board!");
      }, 500);
    }
  }

  checkLines() {
    const fullRows = [];
    const fullCols = [];

    // Rows
    for (let r = 0; r < 10; r++) {
      if (this.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    // Cols
    for (let c = 0; c < 10; c++) {
      let full = true;
      for (let r = 0; r < 10; r++) {
        if (this.board[r][c] === null) { full = false; break; }
      }
      if (full) fullCols.push(c);
    }

    const totalLines = fullRows.length + fullCols.length;

    if (totalLines > 0) {
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      this.totalLinesCleared += totalLines;

      // Audio
      this.audio.playLineClear(totalLines);
      if (this.streak >= 2) this.audio.playComboChime(this.streak);

      // Score calculation (combo bonus)
      const baseLinePts = totalLines * 100 * Math.min(4, totalLines);
      const comboBonus = (this.streak - 1) * 75;
      const totalEarned = baseLinePts + comboBonus;
      this.score += totalEarned;

      this.comboPillEl.classList.remove('hidden');
      this.comboValEl.textContent = `x${this.streak}`;

      if (this.streak >= 2) {
        this.showComboToast(this.streak, totalEarned);
      }

      // Flash & Clear Animation Particles
      fullRows.forEach(r => {
        for (let c = 0; c < 10; c++) {
          this.particles.push(new BlockParticle(c * this.cellSize + this.cellSize / 2, r * this.cellSize + this.cellSize / 2, this.board[r][c] || '#00f2fe'));
          this.board[r][c] = null;
        }
      });

      fullCols.forEach(c => {
        for (let r = 0; r < 10; r++) {
          if (this.board[r][c] !== null) {
            this.particles.push(new BlockParticle(c * this.cellSize + this.cellSize / 2, r * this.cellSize + this.cellSize / 2, this.board[r][c] || '#00f2fe'));
            this.board[r][c] = null;
          }
        }
      });

      // Perfect Board Clear Bonus!
      if (this.board.every(row => row.every(cell => cell === null))) {
        this.score += 500;
        this.showToast('🌟 PERFECT CLEAR! +500 PTS 🌟');
      }

      // Challenge mode check
      if (this.gameMode === 'challenge') {
        this.modeStatValEl.textContent = `${this.totalLinesCleared} / ${this.challengeLinesGoal}`;
        if (this.totalLinesCleared >= this.challengeLinesGoal) {
          this.triggerGameOver(true, "CHALLENGE COMPLETE! You cleared 12 full lines!");
        }
      }
    } else {
      // Streak breaks if no lines were cleared
      this.streak = 0;
      this.comboPillEl.classList.add('hidden');
    }

    this.updateScoreUI();
  }

  hasAnyValidMove() {
    for (let s = 0; s < this.trayShapes.length; s++) {
      const shape = this.trayShapes[s];
      if (!shape) continue;

      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (this.canPlaceShape(shape, r, c)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  replenishTray() {
    for (let i = 0; i < 3; i++) {
      const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.trayShapes[i] = JSON.parse(JSON.stringify(randomShape));
    }
    this.renderTray();
  }

  renderTray() {
    this.traySlots.forEach((slot, idx) => {
      slot.innerHTML = '';
      const shape = this.trayShapes[idx];
      if (!shape) {
        slot.classList.add('disabled');
        return;
      }
      slot.classList.remove('disabled');

      // Create preview SVG for the shape
      const m = shape.matrix;
      const rows = m.length;
      const cols = m[0].length;
      const blockSize = Math.min(22, 60 / Math.max(rows, cols));

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', cols * blockSize);
      svg.setAttribute('height', rows * blockSize);
      svg.style.overflow = 'visible';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (m[r][c] === 1) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', c * blockSize);
            rect.setAttribute('y', r * blockSize);
            rect.setAttribute('width', blockSize - 2);
            rect.setAttribute('height', blockSize - 2);
            rect.setAttribute('rx', 3);
            rect.setAttribute('fill', shape.color);
            rect.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))');
            svg.appendChild(rect);
          }
        }
      }
      slot.appendChild(svg);
    });
  }

  showComboToast(streak, pts) {
    this.comboTitleText.textContent = `${streak}x COMBO STREAK!`;
    this.comboBonusText.textContent = `+${pts} PTS`;
    this.comboToastEl.classList.remove('hidden');
    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboToastEl.classList.add('hidden');
    }, 750);
  }

  showToast(msg) {
    this.gameToastEl.textContent = msg;
    this.gameToastEl.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.gameToastEl.classList.add('hidden');
    }, 1900);
  }

  updateScoreUI() {
    this.scoreValEl.textContent = this.score;
  }

  triggerGameOver(isWin, reason) {
    this.state = 'GAMEOVER';
    clearInterval(this.timerInterval);

    // High Score check
    const isNew = this.score > this.bestScore;
    if (isNew) {
      this.bestScore = this.score;
      localStorage.setItem('blockpuzzle_high', this.bestScore.toString());
      this.bestScoreValEl.textContent = this.bestScore;
      this.newHighBadge.classList.remove('hidden');
    } else {
      this.newHighBadge.classList.add('hidden');
    }

    this.gameoverTitle.textContent = isWin ? "CHAMPION!" : "GAME OVER";
    this.gameoverReason.textContent = reason;
    this.gameoverScoreNum.textContent = this.score;
    this.statLinesCleared.textContent = this.totalLinesCleared;
    this.statMaxStreak.textContent = `${this.maxStreak}x`;
    this.statHighScore.textContent = this.bestScore;

    this.modalGameOver.classList.remove('hidden');
  }

  // ==========================================================
  // 5. RENDER LOOP
  // ==========================================================
  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw 10x10 Grid Cells
    const cs = this.cellSize;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const x = c * cs;
        const y = r * cs;

        // Cell background socket
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 6);
        this.ctx.fill();

        // Placed Block
        const color = this.board[r][c];
        if (color) {
          this.ctx.save();
          this.ctx.fillStyle = color;
          this.ctx.shadowColor = color;
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 6);
          this.ctx.fill();

          // 3D Gloss highlight
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          this.ctx.beginPath();
          this.ctx.roundRect(x + 3, y + 3, cs - 6, (cs - 4) * 0.35, 4);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }

    // 2. Placement Preview Highlight
    if (this.dragHoverGrid && this.dragShape) {
      const m = this.dragShape.matrix;
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.lineWidth = 2;

      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c] === 1) {
            const px = (this.dragHoverGrid.col + c) * cs;
            const py = (this.dragHoverGrid.row + r) * cs;
            this.ctx.beginPath();
            this.ctx.roundRect(px + 2, py + 2, cs - 4, cs - 4, 6);
            this.ctx.fill();
            this.ctx.stroke();
          }
        }
      }
      this.ctx.restore();
    }

    // 3. Floating dragged shape under cursor / finger
    if (this.dragging && this.dragShape) {
      const rect = this.canvas.getBoundingClientRect();
      const cursorX = this.dragCurrentPos.x - rect.left;
      const cursorY = this.dragCurrentPos.y - rect.top - (cs * 1.5);

      const m = this.dragShape.matrix;
      const previewCellSize = cs * 0.95;

      this.ctx.save();
      this.ctx.fillStyle = this.dragShape.color;
      this.ctx.shadowColor = this.dragShape.color;
      this.ctx.shadowBlur = 14;

      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c] === 1) {
            const bx = cursorX + (c - m[0].length / 2) * previewCellSize;
            const by = cursorY + (r - m.length / 2) * previewCellSize;
            this.ctx.beginPath();
            this.ctx.roundRect(bx, by, previewCellSize - 4, previewCellSize - 4, 6);
            this.ctx.fill();
          }
        }
      }
      this.ctx.restore();
    }

    // 4. Update & Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.update();
      pt.draw(this.ctx);
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // 5. Update & Draw Floating Scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const ft = this.floatingScores[i];
      ft.update();
      ft.draw(this.ctx);
      if (ft.life <= 0) this.floatingScores.splice(i, 1);
    }

    requestAnimationFrame(this.loop);
  }
}

// Particle & Floating Text Classes
class BlockParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 3 + Math.random() * 4;
    this.life = 1.0;
    this.decay = 0.035;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.life = 1.0;
    this.vy = -1.8;
  }
  update() {
    this.y += this.vy;
    this.life -= 0.03;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 20px "Fredoka One", cursive, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffd700';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Global start
window.addEventListener('DOMContentLoaded', () => {
  window.blockPuzzleApp = new BlockPuzzleGame();
});

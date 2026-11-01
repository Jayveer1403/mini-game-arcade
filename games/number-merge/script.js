/**
 * Neon Number Merge - Game Engine & Synthesizer
 * Built with vanilla JavaScript, CSS Grid/Transforms, and Web Audio API.
 * Features:
 * - 4x4 dynamic tile grid with smooth CSS transform translations
 * - 4 Game Modes: Classic, Time Attack (90s blitz), Endless, Challenge (512 in 60 moves)
 * - 3 Difficulties: Easy (Target 1024), Medium (Target 2048), Hard (Target 4096)
 * - Power Tools: Undo (3 uses), Hint (evaluates best move), Shuffle (rearranges tiles)
 * - Combo streak multiplier system with floating score bubbles
 * - Touch swipe detection + on-screen responsive D-Pad
 * - High-score persistence via localStorage
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. WEB AUDIO SYNTHESIZER
     ========================================================================== */
  class NumberAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('numbermerge_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('numbermerge_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playSlide() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playMerge(value, streak = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Pitch scales with merged value
      const baseFreq = 260 + Math.min(Math.log2(value) * 65, 800) + Math.min((streak - 1) * 35, 200);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    playHint() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [440, 554, 659].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.06);
        gain.gain.setValueAtTime(0.1, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.1);
      });
    }

    playUndo() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    playShuffle() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const freqs = [300, 420, 360, 540, 480];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + idx * 0.04);
        gain.gain.setValueAtTime(0.1, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.06);
      });
    }

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [261.6, 329.6, 392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const chords = [330, 311, 293, 277];
      chords.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  /* ==========================================================================
     2. GAME STATE & LOGIC ENGINE
     ========================================================================== */
  class NumberMergeGame {
    constructor() {
      this.audio = new NumberAudio();

      // Board Dimensions
      this.size = 4;
      this.grid = []; // 2D array of tile objects or null
      this.tiles = new Map(); // id -> DOM element
      this.nextTileId = 1;

      // Game Parameters
      this.mode = 'classic'; // 'classic' | 'time' | 'endless' | 'challenge'
      this.difficulty = 'medium'; // 'easy' (1024) | 'medium' (2048) | 'hard' (4096)
      this.targetValue = 2048;

      // Stats
      this.score = 0;
      this.bestScore = 0;
      this.totalMoves = 0;
      this.comboStreak = 0;
      this.hasWon = false;
      this.keepPlaying = false;
      this.isGameOver = false;
      this.isPaused = false;

      // Tools
      this.undoCount = 3;
      this.hintCount = 3;
      this.shuffleCount = 1;
      this.historyStack = []; // stores serialized board states

      // Mode-specific timers and limits
      this.timeRemaining = 90; // for Time Attack
      this.timerInterval = null;
      this.challengeMaxMoves = 60; // for Challenge mode (reach 512 in 60 moves)
      this.challengeTarget = 512;

      // Cache DOM Elements
      this.dom = {
        scoreVal: document.getElementById('score-val'),
        bestVal: document.getElementById('best-val'),
        modeStatLbl: document.getElementById('mode-stat-lbl'),
        modeStatVal: document.getElementById('mode-stat-val'),
        comboPill: document.getElementById('combo-pill'),
        comboVal: document.getElementById('combo-val'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnPause: document.getElementById('btn-pause'),
        btnUndo: document.getElementById('btn-undo'),
        undoCount: document.getElementById('undo-count'),
        btnHint: document.getElementById('btn-hint'),
        hintCount: document.getElementById('hint-count'),
        btnShuffle: document.getElementById('btn-shuffle'),
        shuffleCount: document.getElementById('shuffle-count'),
        boardContainer: document.getElementById('board-container'),
        tilesContainer: document.getElementById('tiles-container'),
        toast: document.getElementById('game-toast'),
        // Modals
        modalStart: document.getElementById('modal-start'),
        btnStartGame: document.getElementById('btn-start-game'),
        modalPause: document.getElementById('modal-pause'),
        btnResume: document.getElementById('btn-resume'),
        btnRestart: document.getElementById('btn-restart'),
        pauseScoreNum: document.getElementById('pause-score-num'),
        pauseBestNum: document.getElementById('pause-best-num'),
        modalVictory: document.getElementById('modal-victory'),
        btnKeepGoing: document.getElementById('btn-keep-going'),
        btnPlayAgainVic: document.getElementById('btn-play-again-vic'),
        victoryScoreNum: document.getElementById('victory-score-num'),
        victorySub: document.getElementById('victory-sub'),
        modalGameover: document.getElementById('modal-gameover'),
        gameoverTitle: document.getElementById('gameover-title'),
        gameoverReason: document.getElementById('gameover-reason'),
        gameoverScoreNum: document.getElementById('gameover-score-num'),
        statMaxTile: document.getElementById('stat-max-tile'),
        statMovesTotal: document.getElementById('stat-moves-total'),
        statHighScore: document.getElementById('stat-high-score'),
        newHighBadge: document.getElementById('new-high-badge'),
        btnPlayAgain: document.getElementById('btn-play-again'),
        btnChangeMode: document.getElementById('btn-change-mode'),
        modeTabs: document.querySelectorAll('.mode-btn'),
        diffChips: document.querySelectorAll('.diff-chip'),
        modeInfoBox: document.getElementById('mode-info'),
        touchDpad: document.getElementById('touch-dpad')
      };

      this.initEvents();
      this.updateSoundIcon();
      this.loadBestScore();
    }

    /* ==========================================================================
       SETUP & EVENT BINDINGS
       ========================================================================== */
    initEvents() {
      // Sound Toggle
      this.dom.btnSound.addEventListener('click', () => {
        const on = this.audio.toggle();
        this.updateSoundIcon();
        this.showToast(on ? 'Sound ON 🔊' : 'Sound OFF 🔇');
      });

      // Pause / Resume
      this.dom.btnPause.addEventListener('click', () => this.togglePause());
      this.dom.btnResume.addEventListener('click', () => this.togglePause());
      this.dom.btnRestart.addEventListener('click', () => {
        this.dom.modalPause.classList.add('hidden');
        this.isPaused = false;
        this.startNewGame();
      });

      // Mode Selection Tabs in Start Modal
      this.dom.modeTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.dom.modeTabs.forEach(b => b.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.mode = target.dataset.mode;
          this.updateModeInfo();
        });
      });

      // Difficulty Chips
      this.dom.diffChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          this.dom.diffChips.forEach(c => c.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.difficulty = target.dataset.diff;
          if (this.difficulty === 'easy') this.targetValue = 1024;
          else if (this.difficulty === 'medium') this.targetValue = 2048;
          else if (this.difficulty === 'hard') this.targetValue = 4096;
        });
      });

      // Start Game Button
      this.dom.btnStartGame.addEventListener('click', () => {
        this.audio.init();
        this.dom.modalStart.classList.add('hidden');
        this.startNewGame();
      });

      // Victory Buttons
      this.dom.btnKeepGoing.addEventListener('click', () => {
        this.dom.modalVictory.classList.add('hidden');
        this.keepPlaying = true;
      });
      this.dom.btnPlayAgainVic.addEventListener('click', () => {
        this.dom.modalVictory.classList.add('hidden');
        this.startNewGame();
      });

      // Game Over Buttons
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.modalGameover.classList.add('hidden');
        this.startNewGame();
      });
      this.dom.btnChangeMode.addEventListener('click', () => {
        this.dom.modalGameover.classList.add('hidden');
        this.dom.modalStart.classList.remove('hidden');
      });

      // Action Tools: Undo, Hint, Shuffle
      this.dom.btnUndo.addEventListener('click', () => this.useUndo());
      this.dom.btnHint.addEventListener('click', () => this.useHint());
      this.dom.btnShuffle.addEventListener('click', () => this.useShuffle());

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (!this.dom.modalStart.classList.contains('hidden') ||
              !this.dom.modalGameover.classList.contains('hidden') ||
              !this.dom.modalVictory.classList.contains('hidden')) {
            return;
          }
          this.togglePause();
          return;
        }

        if (this.isPaused || this.isGameOver || !this.dom.modalStart.classList.contains('hidden')) return;

        // Tool hotkeys
        if (e.key === 'z' || e.key === 'Z') {
          this.useUndo();
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          this.useHint();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          this.useShuffle();
          return;
        }

        let direction = null;
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            direction = 'up';
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            direction = 'down';
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            direction = 'left';
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            direction = 'right';
            break;
        }

        if (direction) {
          e.preventDefault();
          this.move(direction);
        }
      });

      // Touch / Swipe Gestures on Board with Scroll Prevention
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;
      const board = this.dom.boardContainer;

      board.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      }, { passive: false });

      board.addEventListener('touchmove', (e) => {
        // Prevent accidental page scrolling when swiping on the board
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      }, { passive: false });

      board.addEventListener('touchend', (e) => {
        if (this.isPaused || this.isGameOver) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const threshold = 25; // minimum px for swipe

        if (Math.max(absX, absY) > threshold && dt < 800) {
          e.preventDefault();
          if (absX > absY) {
            this.move(dx > 0 ? 'right' : 'left');
          } else {
            this.move(dy > 0 ? 'down' : 'up');
          }
        }
      }, { passive: false });

      // On-Screen D-Pad buttons
      this.dom.touchDpad.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.isPaused || this.isGameOver) return;
          const dir = btn.dataset.dir;
          if (dir) this.move(dir);
        });
      });
    }

    updateSoundIcon() {
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    updateModeInfo() {
      const msgs = {
        classic: '<strong>Classic Mode:</strong> Swipe tiles in 4 directions. Matching tiles collide and merge into double their value (2+2=4... up to 2048/4096)!',
        time: '<strong>Time Attack Mode:</strong> 90 seconds on the clock! Rapidly slide and merge as many high-value tiles as possible before time runs out.',
        endless: '<strong>Endless Mode:</strong> No victory cutoff! Push your board to the highest numerical ceiling (4096, 8192, 16384+).',
        challenge: '<strong>Challenge Mode:</strong> Form a 512 tile in 60 moves or fewer! Think strategically before each swipe.'
      };
      this.dom.modeInfoBox.innerHTML = msgs[this.mode] || msgs.classic;
    }

    showToast(message) {
      const toast = this.dom.toast;
      toast.textContent = message;
      toast.classList.remove('hidden');
      toast.classList.add('fade-in');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
      }, 1800);
    }

    togglePause() {
      if (this.isGameOver) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.dom.pauseScoreNum.textContent = this.score;
        this.dom.pauseBestNum.textContent = this.bestScore;
        this.dom.modalPause.classList.remove('hidden');
      } else {
        this.dom.modalPause.classList.add('hidden');
      }
    }

    loadBestScore() {
      const key = `numbermerge_high_${this.mode}_${this.difficulty}`;
      const saved = localStorage.getItem(key);
      this.bestScore = saved ? parseInt(saved, 10) : 0;
      this.dom.bestVal.textContent = this.bestScore;
    }

    saveBestScore() {
      const key = `numbermerge_high_${this.mode}_${this.difficulty}`;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(key, this.bestScore);
        this.dom.bestVal.textContent = this.bestScore;
        return true;
      }
      return false;
    }

    /* ==========================================================================
       START NEW GAME
       ========================================================================== */
    startNewGame() {
      // Clear timers
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      // Reset Board
      this.grid = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ];
      this.tiles.clear();
      this.dom.tilesContainer.innerHTML = '';
      this.nextTileId = 1;

      // Reset Stats
      this.score = 0;
      this.totalMoves = 0;
      this.comboStreak = 0;
      this.hasWon = false;
      this.keepPlaying = false;
      this.isGameOver = false;
      this.isPaused = false;
      this.historyStack = [];

      this.undoCount = 3;
      this.hintCount = 3;
      this.shuffleCount = 1;
      this.updateToolsDisplay();

      this.dom.scoreVal.textContent = '0';
      this.dom.comboPill.classList.add('hidden');
      this.loadBestScore();

      // Configure Mode-specific HUD
      this.setupModeHud();

      // Spawn initial 2 tiles
      this.spawnRandomTile();
      this.spawnRandomTile();
    }

    setupModeHud() {
      if (this.mode === 'classic') {
        this.dom.modeStatLbl.textContent = 'TARGET';
        this.dom.modeStatVal.textContent = this.targetValue;
      } else if (this.mode === 'time') {
        this.dom.modeStatLbl.textContent = 'TIME';
        this.timeRemaining = 90;
        this.dom.modeStatVal.textContent = `${this.timeRemaining}s`;
        this.startTimer();
      } else if (this.mode === 'endless') {
        this.dom.modeStatLbl.textContent = 'MODE';
        this.dom.modeStatVal.textContent = '♾️ Endless';
      } else if (this.mode === 'challenge') {
        this.dom.modeStatLbl.textContent = 'MOVES LEFT';
        this.dom.modeStatVal.textContent = this.challengeMaxMoves;
      }
    }

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.isPaused || this.isGameOver) return;
        this.timeRemaining--;
        this.dom.modeStatVal.textContent = `${this.timeRemaining}s`;
        if (this.timeRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.endGame('Time Up! 90-second blitz complete.');
        }
      }, 1000);
    }

    updateToolsDisplay() {
      this.dom.undoCount.textContent = this.undoCount;
      this.dom.hintCount.textContent = this.hintCount;
      this.dom.shuffleCount.textContent = this.shuffleCount;

      this.dom.btnUndo.disabled = this.undoCount <= 0 || this.historyStack.length === 0;
      this.dom.btnHint.disabled = this.hintCount <= 0;
      this.dom.btnShuffle.disabled = this.shuffleCount <= 0;
    }

    /* ==========================================================================
       TILE DOM MANAGEMENT & SPAWNING
       ========================================================================== */
    spawnRandomTile() {
      const emptyCells = [];
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (!this.grid[r][c]) {
            emptyCells.push({ r, c });
          }
        }
      }

      if (emptyCells.length === 0) return null;

      const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      const tile = {
        id: this.nextTileId++,
        r: spot.r,
        c: spot.c,
        val: value
      };

      this.grid[spot.r][spot.c] = tile;
      this.createTileElement(tile, true);
      return tile;
    }

    createTileElement(tile, isNew = false) {
      const el = document.createElement('div');
      el.className = `tile tile-${tile.val >= 2048 ? 'super' : tile.val}`;
      if (isNew) el.classList.add('tile-new');

      el.id = `tile-${tile.id}`;
      el.textContent = tile.val;
      this.setTilePosition(el, tile.r, tile.c);

      this.dom.tilesContainer.appendChild(el);
      this.tiles.set(tile.id, el);
      return el;
    }

    setTilePosition(el, r, c) {
      // Use CSS calc and variable percentages to scale smoothly
      el.style.transform = `translate(calc(${c} * 100% + ${c * 10}px), calc(${r} * 100% + ${r * 10}px))`;
    }

    updateTileElement(tile, merged = false) {
      const el = this.tiles.get(tile.id);
      if (!el) return;

      this.setTilePosition(el, tile.r, tile.c);
      el.textContent = tile.val;
      el.className = `tile tile-${tile.val >= 2048 ? 'super' : tile.val}`;
      if (merged) {
        el.classList.add('tile-merged');
        setTimeout(() => el.classList.remove('tile-merged'), 300);
      }
    }

    removeTileElement(tileId) {
      const el = this.tiles.get(tileId);
      if (el) {
        el.remove();
        this.tiles.delete(tileId);
      }
    }

    /* ==========================================================================
       SNAPSHOTS FOR UNDO
       ========================================================================== */
    pushHistory() {
      const serializedGrid = this.grid.map(row =>
        row.map(cell => (cell ? { val: cell.val, r: cell.r, c: cell.c } : null))
      );
      this.historyStack.push({
        grid: serializedGrid,
        score: this.score,
        totalMoves: this.totalMoves,
        comboStreak: this.comboStreak
      });
      // Cap history depth to 10
      if (this.historyStack.length > 10) {
        this.historyStack.shift();
      }
      this.updateToolsDisplay();
    }

    useUndo() {
      if (this.undoCount <= 0 || this.historyStack.length === 0 || this.isPaused || this.isGameOver) {
        this.audio.playError();
        return;
      }

      this.undoCount--;
      const prev = this.historyStack.pop();

      // Clean current tiles
      this.tiles.forEach(el => el.remove());
      this.tiles.clear();

      this.score = prev.score;
      this.totalMoves = prev.totalMoves;
      this.comboStreak = prev.comboStreak;
      this.dom.scoreVal.textContent = this.score;

      // Rebuild grid
      this.grid = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ];

      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const item = prev.grid[r][c];
          if (item) {
            const tile = {
              id: this.nextTileId++,
              r: item.r,
              c: item.c,
              val: item.val
            };
            this.grid[r][c] = tile;
            this.createTileElement(tile, false);
          }
        }
      }

      this.audio.playUndo();
      this.showToast('Move Undone ↩️');
      this.updateToolsDisplay();
    }

    /* ==========================================================================
       HINT & SHUFFLE TOOLS
       ========================================================================== */
    useHint() {
      if (this.hintCount <= 0 || this.isPaused || this.isGameOver) {
        this.audio.playError();
        return;
      }

      const dirs = ['up', 'right', 'down', 'left'];
      let bestDir = null;
      let maxScoreGain = -1;
      let maxFreeCells = -1;

      dirs.forEach(dir => {
        const sim = this.simulateMove(dir);
        if (sim.moved) {
          if (sim.scoreGain > maxScoreGain) {
            maxScoreGain = sim.scoreGain;
            maxFreeCells = sim.freeCells;
            bestDir = dir;
          } else if (sim.scoreGain === maxScoreGain && sim.freeCells > maxFreeCells) {
            maxFreeCells = sim.freeCells;
            bestDir = dir;
          }
        }
      });

      if (!bestDir) {
        this.showToast('No valid moves available!');
        this.audio.playError();
        return;
      }

      this.hintCount--;
      this.audio.playHint();
      const dirNames = { up: 'UP ⬆️', down: 'DOWN ⬇️', left: 'LEFT ⬅️', right: 'RIGHT ➡️' };
      this.showToast(`Hint: Swipe ${dirNames[bestDir]}!`);
      this.highlightDirection(bestDir);
      this.updateToolsDisplay();
    }

    highlightDirection(dir) {
      const btn = this.dom.touchDpad.querySelector(`.dpad-btn.${dir}`);
      if (btn) {
        btn.classList.add('pulse-hint');
        setTimeout(() => btn.classList.remove('pulse-hint'), 1200);
      }
    }

    useShuffle() {
      if (this.shuffleCount <= 0 || this.isPaused || this.isGameOver) {
        this.audio.playError();
        return;
      }

      this.pushHistory();
      this.shuffleCount--;

      // Gather non-empty values
      const values = [];
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c]) {
            values.push(this.grid[r][c].val);
          }
        }
      }

      // Fisher-Yates shuffle
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }

      // Clear existing elements
      this.tiles.forEach(el => el.remove());
      this.tiles.clear();

      let valIdx = 0;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c]) {
            const tile = {
              id: this.nextTileId++,
              r,
              c,
              val: values[valIdx++]
            };
            this.grid[r][c] = tile;
            this.createTileElement(tile, true);
          }
        }
      }

      this.audio.playShuffle();
      this.showToast('Board Shuffled! 🔀');
      this.updateToolsDisplay();
    }

    /* ==========================================================================
       MOVE LOGIC & MERGING ENGINE
       ========================================================================== */
    move(direction) {
      if (this.isPaused || this.isGameOver) return;

      const vectors = {
        up: { r: -1, c: 0 },
        down: { r: 1, c: 0 },
        left: { r: 0, c: -1 },
        right: { r: 0, c: 1 }
      };
      const vec = vectors[direction];
      if (!vec) return;

      // Check if move produces any state change
      const test = this.simulateMove(direction);
      if (!test.moved) {
        return;
      }

      // Save state before move
      this.pushHistory();

      // Traversal order
      const rowIndices = [0, 1, 2, 3];
      const colIndices = [0, 1, 2, 3];
      if (vec.r === 1) rowIndices.reverse();
      if (vec.c === 1) colIndices.reverse();

      // Track merged flags to prevent double merging in single move
      const mergedInMove = new Set();
      let movedAny = false;
      let pointsEarned = 0;
      let highestMerged = 0;
      let mergeCount = 0;

      rowIndices.forEach(r => {
        colIndices.forEach(c => {
          const tile = this.grid[r][c];
          if (!tile) return;

          let currR = r;
          let currC = c;
          let nextR = currR + vec.r;
          let nextC = currC + vec.c;

          // Slide forward while in bounds and empty
          while (
            nextR >= 0 &&
            nextR < this.size &&
            nextC >= 0 &&
            nextC < this.size &&
            !this.grid[nextR][nextC]
          ) {
            currR = nextR;
            currC = nextC;
            nextR += vec.r;
            nextC += vec.c;
          }

          // Check if collision can merge
          if (
            nextR >= 0 &&
            nextR < this.size &&
            nextC >= 0 &&
            nextC < this.size &&
            this.grid[nextR][nextC] &&
            this.grid[nextR][nextC].val === tile.val &&
            !mergedInMove.has(this.grid[nextR][nextC].id)
          ) {
            // MERGE
            const targetTile = this.grid[nextR][nextC];
            this.grid[r][c] = null;

            // Remove moving tile element
            this.removeTileElement(tile.id);

            // Double value of destination
            targetTile.val *= 2;
            mergedInMove.add(targetTile.id);

            this.updateTileElement(targetTile, true);

            pointsEarned += targetTile.val;
            mergeCount++;
            if (targetTile.val > highestMerged) {
              highestMerged = targetTile.val;
            }

            movedAny = true;
          } else if (currR !== r || currC !== c) {
            // SLIDE ONLY
            this.grid[r][c] = null;
            this.grid[currR][currC] = tile;
            tile.r = currR;
            tile.c = currC;
            this.updateTileElement(tile, false);
            movedAny = true;
          }
        });
      });

      if (movedAny) {
        this.totalMoves++;

        // Combo streak tracking
        if (mergeCount > 0) {
          this.comboStreak++;
          if (this.comboStreak >= 2) {
            this.dom.comboPill.classList.remove('hidden');
            this.dom.comboVal.textContent = `x${this.comboStreak}`;
          }
          const bonus = (this.comboStreak - 1) * 20;
          const totalPoints = pointsEarned + bonus;
          this.score += totalPoints;

          this.audio.playMerge(highestMerged, this.comboStreak);
          this.showScoreBubble(totalPoints);
        } else {
          this.comboStreak = 0;
          this.dom.comboPill.classList.add('hidden');
          this.audio.playSlide();
        }

        // Update HUD
        this.dom.scoreVal.textContent = this.score;
        this.saveBestScore();

        // Spawn a new random tile
        setTimeout(() => {
          this.spawnRandomTile();

          // Check for Victory
          if (!this.hasWon && !this.keepPlaying) {
            const hasTarget = this.checkTargetReached();
            if (hasTarget) {
              this.hasWon = true;
              this.audio.playVictory();
              this.dom.victoryScoreNum.textContent = this.score;
              this.dom.victorySub.textContent = `You reached ${this.targetValue}! Fantastic job!`;
              this.dom.modalVictory.classList.remove('hidden');
            }
          }

          // Check Challenge mode criteria
          if (this.mode === 'challenge') {
            const remaining = this.challengeMaxMoves - this.totalMoves;
            this.dom.modeStatVal.textContent = Math.max(0, remaining);
            const reachedChallenge = this.checkTileValue(this.challengeTarget);

            if (reachedChallenge) {
              this.audio.playVictory();
              this.dom.victoryScoreNum.textContent = this.score;
              this.dom.victorySub.textContent = `Challenge Complete! Reached 512 in ${this.totalMoves} moves!`;
              this.dom.modalVictory.classList.remove('hidden');
              this.isGameOver = true;
              return;
            } else if (remaining <= 0) {
              this.endGame('Out of moves! Challenge failed.');
              return;
            }
          }

          // Check for Game Over (no valid moves remaining)
          if (!this.canMove()) {
            this.endGame('No more valid moves remaining on the board.');
          }
        }, 120);
      }
    }

    showScoreBubble(points) {
      const bubble = document.createElement('div');
      bubble.className = 'floating-score';
      bubble.textContent = `+${points}`;
      this.dom.boardContainer.appendChild(bubble);
      setTimeout(() => bubble.remove(), 800);
    }

    checkTargetReached() {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] && this.grid[r][c].val >= this.targetValue) {
            return true;
          }
        }
      }
      return false;
    }

    checkTileValue(targetVal) {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] && this.grid[r][c].val >= targetVal) {
            return true;
          }
        }
      }
      return false;
    }

    canMove() {
      // 1. Any empty cell?
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (!this.grid[r][c]) return true;
        }
      }
      // 2. Any adjacent matching neighbor?
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const val = this.grid[r][c].val;
          if (r < this.size - 1 && this.grid[r + 1][c].val === val) return true;
          if (c < this.size - 1 && this.grid[r][c + 1].val === val) return true;
        }
      }
      return false;
    }

    simulateMove(direction) {
      const vectors = {
        up: { r: -1, c: 0 },
        down: { r: 1, c: 0 },
        left: { r: 0, c: -1 },
        right: { r: 0, c: 1 }
      };
      const vec = vectors[direction];

      // Clone simple numerical grid
      const temp = [];
      for (let r = 0; r < this.size; r++) {
        temp[r] = [];
        for (let c = 0; c < this.size; c++) {
          temp[r][c] = this.grid[r][c] ? this.grid[r][c].val : 0;
        }
      }

      const rowIndices = [0, 1, 2, 3];
      const colIndices = [0, 1, 2, 3];
      if (vec.r === 1) rowIndices.reverse();
      if (vec.c === 1) colIndices.reverse();

      let moved = false;
      let scoreGain = 0;
      const mergedCells = Array(4).fill(0).map(() => Array(4).fill(false));

      rowIndices.forEach(r => {
        colIndices.forEach(c => {
          if (temp[r][c] === 0) return;

          let currR = r;
          let currC = c;
          let nextR = currR + vec.r;
          let nextC = currC + vec.c;

          while (
            nextR >= 0 && nextR < 4 &&
            nextC >= 0 && nextC < 4 &&
            temp[nextR][nextC] === 0
          ) {
            currR = nextR;
            currC = nextC;
            nextR += vec.r;
            nextC += vec.c;
          }

          if (
            nextR >= 0 && nextR < 4 &&
            nextC >= 0 && nextC < 4 &&
            temp[nextR][nextC] === temp[r][c] &&
            !mergedCells[nextR][nextC]
          ) {
            temp[nextR][nextC] *= 2;
            scoreGain += temp[nextR][nextC];
            temp[r][c] = 0;
            mergedCells[nextR][nextC] = true;
            moved = true;
          } else if (currR !== r || currC !== c) {
            temp[currR][currC] = temp[r][c];
            temp[r][c] = 0;
            moved = true;
          }
        });
      });

      let freeCells = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (temp[r][c] === 0) freeCells++;
        }
      }

      return { moved, scoreGain, freeCells };
    }

    endGame(reason) {
      this.isGameOver = true;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.audio.playGameOver();

      const isNewHigh = this.saveBestScore();

      let maxTile = 0;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] && this.grid[r][c].val > maxTile) {
            maxTile = this.grid[r][c].val;
          }
        }
      }

      this.dom.gameoverTitle.textContent = 'GAME OVER';
      this.dom.gameoverReason.textContent = reason;
      this.dom.gameoverScoreNum.textContent = this.score;
      this.dom.statMaxTile.textContent = maxTile;
      this.dom.statMovesTotal.textContent = this.totalMoves;
      this.dom.statHighScore.textContent = this.bestScore;

      if (isNewHigh) {
        this.dom.newHighBadge.classList.remove('hidden');
      } else {
        this.dom.newHighBadge.classList.add('hidden');
      }

      this.dom.modalGameover.classList.remove('hidden');
    }
  }

  // Instantiate when DOM is fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    window.numberMergeGame = new NumberMergeGame();
  });
})();

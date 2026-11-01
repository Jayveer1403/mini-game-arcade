/**
 * Color Reaction - Fast Color Matching Challenge
 * Architecture:
 * - High-precision response timing via performance.now()
 * - Web Audio API procedural sound synthesizer (Countdowns, Match Pops, Error Buzzes, Fanfare)
 * - 5 Distinct Game Modes:
 *   1. Classic Color Match (Match target swatch from options)
 *   2. Speed Rush (Rapid matching against a global 45s blitz timer)
 *   3. Color Name Challenge (Match written color text with distracting colors)
 *   4. Reverse Color Challenge (Select an option that does NOT match target)
 *   5. Color Memory Sequence (Memorize & repeat animated color tile sequences)
 * - Canvas Charting for response times across rounds
 * - LocalStorage persistence for high scores per mode
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. COLOR PALETTES & DEFINITIONS
     ========================================================================== */
  const COLOR_PALETTE = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Lime', hex: '#84cc16' },
    { name: 'Rose', hex: '#f43f5e' }
  ];

  /* ==========================================================================
     2. WEB AUDIO SYNTHESIZER
     ========================================================================== */
  class ColorAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('colorreaction_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('colorreaction_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playCorrect(combo = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const baseFreq = 440 + Math.min(combo * 40, 400);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    playWrong() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(120, t + 0.2);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playTone(index) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
      const freq = notes[index % notes.length];
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    }

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const t = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }
  }

  /* ==========================================================================
     3. GAME CONTROLLER
     ========================================================================== */
  class ColorReactionGame {
    constructor() {
      this.audio = new ColorAudio();

      // State Configurations
      this.mode = 'classic'; // 'classic' | 'speed' | 'name' | 'reverse' | 'memory'
      this.difficulty = 'medium'; // 'easy' (4 options) | 'medium' (6 options) | 'hard' (8 options)
      this.state = 'idle'; // 'idle' | 'playing' | 'paused' | 'over'

      // Metrics & History
      this.score = 0;
      this.bestScore = 0;
      this.currentRound = 1;
      this.maxRounds = 10;
      this.correctCount = 0;
      this.wrongCount = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.responseTimes = []; // in ms

      // Timers
      this.roundDuration = 6.0; // seconds
      this.roundTimeLeft = 6.0;
      this.roundTimerInterval = null;
      this.startTime = 0;

      // Speed Rush Global Timer
      this.speedTimeLeft = 45;
      this.speedTimerInterval = null;

      // Targets
      this.currentTarget = null;
      this.currentOptions = [];

      // Memory Mode Sequence
      this.memorySequence = [];
      this.playerStep = 0;

      // DOM Cache
      this.dom = {
        scoreVal: document.getElementById('score-val'),
        timerStatLbl: document.getElementById('timer-stat-lbl'),
        timerStatVal: document.getElementById('timer-stat-val'),
        levelStatLbl: document.getElementById('level-stat-lbl'),
        levelStatVal: document.getElementById('level-stat-val'),
        comboPill: document.getElementById('combo-pill'),
        comboVal: document.getElementById('combo-val'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnPause: document.getElementById('btn-pause'),
        instructionText: document.getElementById('instruction-text'),
        gameToast: document.getElementById('game-toast'),
        targetSwatch: document.getElementById('target-swatch'),
        targetLabel: document.getElementById('target-label'),
        roundTimerFill: document.getElementById('round-timer-fill'),
        optionsGrid: document.getElementById('color-options-grid'),
        // Modals
        modalStart: document.getElementById('modal-start'),
        btnStartGame: document.getElementById('btn-start-game'),
        modeTabs: document.querySelectorAll('.mode-btn'),
        diffChips: document.querySelectorAll('.diff-chip'),
        modeInfoBox: document.getElementById('mode-info'),
        modalPause: document.getElementById('modal-pause'),
        btnResume: document.getElementById('btn-resume'),
        btnRestart: document.getElementById('btn-restart'),
        pauseScoreNum: document.getElementById('pause-score-num'),
        pauseBestNum: document.getElementById('pause-best-num'),
        modalResults: document.getElementById('modal-results'),
        ratingBadge: document.getElementById('rating-badge'),
        newRecordRibbon: document.getElementById('new-record-ribbon'),
        rScoreVal: document.getElementById('r-score-val'),
        rAvgVal: document.getElementById('r-avg-val'),
        rFastestVal: document.getElementById('r-fastest-val'),
        rAccuracyVal: document.getElementById('r-accuracy-val'),
        rCountsVal: document.getElementById('r-counts-val'),
        rComboVal: document.getElementById('r-combo-val'),
        colorChart: document.getElementById('color-chart'),
        btnPlayAgain: document.getElementById('btn-play-again'),
        btnChangeMode: document.getElementById('btn-change-mode')
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

      // Pause & Resume
      this.dom.btnPause.addEventListener('click', () => this.togglePause());
      this.dom.btnResume.addEventListener('click', () => this.togglePause());
      this.dom.btnRestart.addEventListener('click', () => {
        this.dom.modalPause.classList.add('hidden');
        this.state = 'idle';
        this.startSession();
      });

      // Mode Selection Tabs
      this.dom.modeTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.dom.modeTabs.forEach(b => b.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.mode = target.dataset.mode;
          this.updateModeExplanation();
        });
      });

      // Difficulty Selector Chips
      this.dom.diffChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          this.dom.diffChips.forEach(c => c.classList.remove('active'));
          const target = e.currentTarget;
          target.classList.add('active');
          this.difficulty = target.dataset.diff;
        });
      });

      // Start Game Button
      this.dom.btnStartGame.addEventListener('click', () => {
        this.audio.init();
        this.dom.modalStart.classList.add('hidden');
        this.startSession();
      });

      // Results Modal Actions
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.modalResults.classList.add('hidden');
        this.startSession();
      });
      this.dom.btnChangeMode.addEventListener('click', () => {
        this.dom.modalResults.classList.add('hidden');
        this.dom.modalStart.classList.remove('hidden');
      });

      // Keyboard Controls (Keys 1-8 for Rapid Pick, P / Space for Pause)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (!this.dom.modalStart.classList.contains('hidden') ||
              !this.dom.modalResults.classList.contains('hidden')) return;
          this.togglePause();
          return;
        }

        if (this.state !== 'playing') return;

        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= this.currentOptions.length) {
          e.preventDefault();
          this.selectOption(num - 1);
        }
      });
    }

    updateSoundIcon() {
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    updateModeExplanation() {
      const descriptions = {
        classic: '<strong>1. Classic Color Match:</strong> Observe the top target color card and immediately tap the identical matching color from the available options before the round timer expires!',
        speed: '<strong>2. Speed Rush:</strong> Race against a global 45-second clock! Match as many colors in rapid succession as possible with combo multipliers.',
        name: '<strong>3. Color Name Challenge:</strong> Read the written color name on the target card and tap that color, ignoring distracting font colors!',
        reverse: '<strong>4. Reverse Color Challenge:</strong> Pick any color that does NOT match the target color! Avoid picking the same color.',
        memory: '<strong>5. Color Memory:</strong> Observe the flashing sequence of colored tiles, then repeat the exact color order without mistakes.'
      };
      this.dom.modeInfoBox.innerHTML = descriptions[this.mode] || descriptions.classic;
    }

    showToast(msg) {
      const toast = this.dom.gameToast;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 1500);
    }

    loadBestScore() {
      const key = `colorreaction_high_${this.mode}_${this.difficulty}`;
      const saved = localStorage.getItem(key);
      this.bestScore = saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
      const key = `colorreaction_high_${this.mode}_${this.difficulty}`;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(key, this.bestScore);
        return true;
      }
      return false;
    }

    togglePause() {
      if (this.state === 'over' || this.state === 'idle') return;
      if (this.state === 'paused') {
        this.state = 'playing';
        this.dom.modalPause.classList.add('hidden');
        if (this.mode !== 'speed') {
          this.startRoundTimer();
        } else {
          this.startSpeedTimer();
        }
      } else {
        this.state = 'paused';
        this.clearAllTimers();
        this.dom.pauseScoreNum.textContent = this.score;
        this.dom.pauseBestNum.textContent = this.bestScore;
        this.dom.modalPause.classList.remove('hidden');
      }
    }

    /* ==========================================================================
       SESSION MANAGEMENT
       ========================================================================== */
    startSession() {
      this.clearAllTimers();
      this.score = 0;
      this.currentRound = 1;
      this.correctCount = 0;
      this.wrongCount = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.responseTimes = [];
      this.memorySequence = [];

      this.dom.scoreVal.textContent = '0';
      this.dom.comboPill.classList.add('hidden');
      this.loadBestScore();

      if (this.mode === 'speed') {
        this.speedTimeLeft = 45;
        this.dom.timerStatLbl.textContent = 'RUSH';
        this.dom.timerStatVal.textContent = `${this.speedTimeLeft}s`;
        this.dom.levelStatLbl.textContent = 'MATCHES';
        this.dom.levelStatVal.textContent = '0';
        this.startSpeedTimer();
        this.nextSpeedQuestion();
      } else if (this.mode === 'memory') {
        this.dom.timerStatLbl.textContent = 'SEQ';
        this.dom.timerStatVal.textContent = '1';
        this.dom.levelStatLbl.textContent = 'LEVEL';
        this.dom.levelStatVal.textContent = '1';
        this.startMemoryRound();
      } else {
        this.maxRounds = 10;
        this.dom.timerStatLbl.textContent = 'TIME';
        this.dom.levelStatLbl.textContent = 'ROUND';
        this.dom.levelStatVal.textContent = `1 / ${this.maxRounds}`;
        this.startNormalRound();
      }
    }

    clearAllTimers() {
      clearInterval(this.roundTimerInterval);
      clearInterval(this.speedTimerInterval);
    }

    /* ==========================================================================
       STANDARD ROUND ENGINE (Classic, Name, Reverse)
       ========================================================================== */
    startNormalRound() {
      this.clearAllTimers();
      this.state = 'playing';
      this.dom.levelStatVal.textContent = `${this.currentRound} / ${this.maxRounds}`;

      // Calculate round duration by difficulty and round progress
      let baseTime = 5.0;
      if (this.difficulty === 'easy') baseTime = 6.0;
      else if (this.difficulty === 'hard') baseTime = 3.5;
      this.roundDuration = Math.max(1.8, baseTime - (this.currentRound - 1) * 0.2);
      this.roundTimeLeft = this.roundDuration;

      // Generate Options Count
      let count = 6;
      if (this.difficulty === 'easy') count = 4;
      else if (this.difficulty === 'hard') count = 8;

      // Pick unique colors from palette
      const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5).slice(0, count);
      this.currentOptions = shuffled;

      // Pick target
      this.currentTarget = shuffled[Math.floor(Math.random() * shuffled.length)];

      // Configure Target Swatch
      if (this.mode === 'name') {
        // Stroop Effect: text says target color, but rendered in a different distractor color
        const distractor = shuffled.find(c => c.name !== this.currentTarget.name) || shuffled[0];
        this.dom.targetSwatch.style.backgroundColor = distractor.hex;
        this.dom.targetLabel.textContent = this.currentTarget.name.toUpperCase();
        this.dom.targetLabel.style.color = '#fff';
        this.dom.instructionText.textContent = `Tap the color named: "${this.currentTarget.name.toUpperCase()}"!`;
      } else if (this.mode === 'reverse') {
        this.dom.targetSwatch.style.backgroundColor = this.currentTarget.hex;
        this.dom.targetLabel.textContent = 'AVOID THIS COLOR';
        this.dom.targetLabel.style.color = '#fff';
        this.dom.instructionText.textContent = `Pick any color EXCEPT ${this.currentTarget.name.toUpperCase()}!`;
      } else {
        // Classic
        this.dom.targetSwatch.style.backgroundColor = this.currentTarget.hex;
        this.dom.targetLabel.textContent = 'MATCH ME';
        this.dom.targetLabel.style.color = '#fff';
        this.dom.instructionText.textContent = 'Tap the exact matching color card!';
      }

      this.renderOptionsGrid();
      this.startTime = performance.now();
      this.startRoundTimer();
    }

    renderOptionsGrid() {
      const grid = this.dom.optionsGrid;
      grid.innerHTML = '';

      if (this.currentOptions.length <= 4) grid.className = 'options-grid cols-2';
      else if (this.currentOptions.length <= 6) grid.className = 'options-grid cols-3';
      else grid.className = 'options-grid cols-4';

      this.currentOptions.forEach((col, idx) => {
        const btn = document.createElement('button');
        btn.className = 'color-card-btn';
        btn.style.backgroundColor = col.hex;
        btn.setAttribute('aria-label', col.name);

        const badge = document.createElement('span');
        badge.className = 'card-num-badge';
        badge.textContent = idx + 1;
        btn.appendChild(badge);

        const lbl = document.createElement('span');
        lbl.className = 'card-color-label';
        lbl.textContent = col.name;
        btn.appendChild(lbl);

        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this.state === 'playing') {
            this.selectOption(idx, btn);
          }
        });

        grid.appendChild(btn);
      });
    }

    startRoundTimer() {
      this.roundTimerInterval = setInterval(() => {
        if (this.state === 'paused') return;
        this.roundTimeLeft -= 0.05;
        const progress = Math.max(0, (this.roundTimeLeft / this.roundDuration) * 100);
        this.dom.roundTimerFill.style.width = `${progress}%`;
        this.dom.timerStatVal.textContent = `${Math.max(0, this.roundTimeLeft).toFixed(1)}s`;

        if (this.roundTimeLeft <= 0) {
          clearInterval(this.roundTimerInterval);
          this.handleTimeout();
        }
      }, 50);
    }

    /* ==========================================================================
       USER SELECTION LOGIC
       ========================================================================== */
    selectOption(index, btnEl = null) {
      if (this.state !== 'playing') return;
      const chosen = this.currentOptions[index];
      if (!chosen) return;

      const elapsed = performance.now() - this.startTime;
      this.responseTimes.push(elapsed);

      let isCorrect = false;
      if (this.mode === 'reverse') {
        isCorrect = chosen.name !== this.currentTarget.name;
      } else {
        isCorrect = chosen.name === this.currentTarget.name;
      }

      if (isCorrect) {
        this.correctCount++;
        this.combo++;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;

        // Score based on speed & combo
        const speedBonus = Math.max(50, Math.round(1000 - elapsed * 1.5));
        const comboBonus = (this.combo - 1) * 40;
        const points = speedBonus + comboBonus;
        this.score += points;
        this.dom.scoreVal.textContent = this.score;

        if (this.combo >= 2) {
          this.dom.comboPill.classList.remove('hidden');
          this.dom.comboVal.textContent = `x${this.combo}`;
        }

        this.audio.playCorrect(this.combo);
        if (btnEl) btnEl.classList.add('correct-pop');
        this.showToast(`+${points} Correct!`);

        setTimeout(() => {
          if (this.mode === 'speed') {
            this.dom.levelStatVal.textContent = this.correctCount;
            this.nextSpeedQuestion();
          } else {
            if (this.currentRound < this.maxRounds) {
              this.currentRound++;
              this.startNormalRound();
            } else {
              this.finishSession();
            }
          }
        }, 180);
      } else {
        this.wrongCount++;
        this.combo = 0;
        this.dom.comboPill.classList.add('hidden');
        this.score = Math.max(0, this.score - 120);
        this.dom.scoreVal.textContent = this.score;

        this.audio.playWrong();
        if (btnEl) btnEl.classList.add('wrong-pop');
        this.showToast('-120 Incorrect Choice!');

        setTimeout(() => {
          if (this.mode === 'speed') {
            this.nextSpeedQuestion();
          } else {
            if (this.currentRound < this.maxRounds) {
              this.currentRound++;
              this.startNormalRound();
            } else {
              this.finishSession();
            }
          }
        }, 220);
      }
    }

    handleTimeout() {
      this.wrongCount++;
      this.combo = 0;
      this.dom.comboPill.classList.add('hidden');
      this.audio.playWrong();
      this.showToast('Time Expired!');

      if (this.currentRound < this.maxRounds) {
        this.currentRound++;
        setTimeout(() => this.startNormalRound(), 300);
      } else {
        this.finishSession();
      }
    }

    /* ==========================================================================
       SPEED RUSH MODE (45s Blitz)
       ========================================================================== */
    startSpeedTimer() {
      this.speedTimerInterval = setInterval(() => {
        if (this.state === 'paused') return;
        this.speedTimeLeft--;
        this.dom.timerStatVal.textContent = `${this.speedTimeLeft}s`;
        if (this.speedTimeLeft <= 0) {
          clearInterval(this.speedTimerInterval);
          this.finishSession();
        }
      }, 1000);
    }

    nextSpeedQuestion() {
      this.state = 'playing';
      const count = this.difficulty === 'easy' ? 4 : (this.difficulty === 'medium' ? 6 : 8);
      const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5).slice(0, count);
      this.currentOptions = shuffled;
      this.currentTarget = shuffled[Math.floor(Math.random() * shuffled.length)];

      this.dom.targetSwatch.style.backgroundColor = this.currentTarget.hex;
      this.dom.targetLabel.textContent = 'MATCH';
      this.dom.instructionText.textContent = 'SPEED RUSH: Match as many as you can!';
      this.dom.roundTimerFill.style.width = '100%';

      this.renderOptionsGrid();
      this.startTime = performance.now();
    }

    /* ==========================================================================
       COLOR MEMORY SEQUENCE MODE
       ========================================================================== */
    startMemoryRound() {
      this.state = 'playing';
      const count = 4; // 4 color pads
      this.currentOptions = COLOR_PALETTE.slice(0, count);
      this.renderOptionsGrid();

      // Add a new random step to the sequence
      const nextIndex = Math.floor(Math.random() * count);
      this.memorySequence.push(nextIndex);
      this.playerStep = 0;

      this.dom.timerStatVal.textContent = `${this.memorySequence.length}`;
      this.dom.levelStatVal.textContent = `${this.memorySequence.length}`;
      this.dom.instructionText.textContent = 'Memorize the color sequence...';
      this.dom.targetLabel.textContent = 'WATCH';
      this.dom.targetSwatch.style.backgroundColor = 'transparent';

      // Playback sequence
      let idx = 0;
      const playStep = () => {
        if (idx < this.memorySequence.length) {
          const optIdx = this.memorySequence[idx];
          const col = this.currentOptions[optIdx];
          this.dom.targetSwatch.style.backgroundColor = col.hex;
          this.dom.targetLabel.textContent = col.name;
          this.audio.playTone(optIdx);

          const btn = this.dom.optionsGrid.children[optIdx];
          if (btn) btn.classList.add('correct-pop');
          setTimeout(() => {
            if (btn) btn.classList.remove('correct-pop');
            this.dom.targetSwatch.style.backgroundColor = 'transparent';
            this.dom.targetLabel.textContent = '...';
            idx++;
            setTimeout(playStep, 350);
          }, 300);
        } else {
          this.dom.instructionText.textContent = 'Your turn! Tap the sequence in order.';
          this.dom.targetLabel.textContent = 'REPEAT';
          this.startTime = performance.now();
        }
      };
      setTimeout(playStep, 600);
    }

    /* ==========================================================================
       SESSION FINISH & EVALUATION
       ========================================================================== */
    finishSession() {
      this.state = 'over';
      this.clearAllTimers();
      this.audio.playVictory();

      const validTimes = this.responseTimes.filter(t => t > 0);
      const avg = validTimes.length > 0
        ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
        : 0;
      const fastest = validTimes.length > 0 ? Math.round(Math.min(...validTimes)) : 0;

      const totalAttempts = this.correctCount + this.wrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((this.correctCount / totalAttempts) * 100) : 100;

      // Rating classification
      let ratingText = 'GOOD 👍';
      if (this.score >= 5000 && accuracy >= 90) ratingText = 'COLOR MASTER 🎨';
      else if (avg > 0 && avg <= 450) ratingText = 'LIGHTNING FAST ⚡';
      else if (accuracy >= 85) ratingText = 'EXCELLENT 🌟';
      else if (accuracy >= 70) ratingText = 'VERY GOOD 🎯';
      else ratingText = 'KEEP PRACTICING 🚀';

      this.dom.ratingBadge.textContent = ratingText;
      this.dom.rScoreVal.textContent = this.score;
      this.dom.rAvgVal.textContent = avg > 0 ? `${avg} ms` : '-- ms';
      this.dom.rFastestVal.textContent = fastest > 0 ? `${fastest} ms` : '-- ms';
      this.dom.rAccuracyVal.textContent = `${accuracy}%`;
      this.dom.rCountsVal.textContent = `${this.correctCount} / ${this.wrongCount}`;
      this.dom.rComboVal.textContent = `x${this.bestCombo}`;

      const isNewBest = this.saveBestScore();
      if (isNewBest) {
        this.dom.newRecordRibbon.classList.remove('hidden');
      } else {
        this.dom.newRecordRibbon.classList.add('hidden');
      }

      this.drawProgressionChart(validTimes);
      this.dom.modalResults.classList.remove('hidden');
    }

    drawProgressionChart(times) {
      const canvas = this.dom.colorChart;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      if (times.length === 0) return;

      const maxVal = Math.max(...times, 1200);
      const minVal = Math.min(...times, 200);
      const padding = 20;

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      // Progression Line
      ctx.beginPath();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;

      const step = (w - padding * 2) / Math.max(1, times.length - 1);
      times.forEach((val, idx) => {
        const x = padding + idx * step;
        const norm = (val - minVal) / Math.max(1, maxVal - minVal);
        const y = h - padding - norm * (h - padding * 2);

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points & Labels
      times.forEach((val, idx) => {
        const x = padding + idx * step;
        const norm = (val - minVal) / Math.max(1, maxVal - minVal);
        const y = h - padding - norm * (h - padding * 2);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(val)}ms`, x, y - 6);
      });
    }
  }

  // Initialize on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    window.colorReactionGame = new ColorReactionGame();
  });
})();

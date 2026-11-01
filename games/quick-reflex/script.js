/**
 * Quick Reflex - Reaction Speed Challenge
 * Architecture:
 * - High-precision timing via performance.now()
 * - Web Audio API procedural sound synthesizer (Countdowns, Beeps, Success, Buzzers, Fanfare)
 * - 5 Distinct Game Modes:
 *   1. Reaction Time Test (Green signal, false start detector, 5 rounds)
 *   2. Color Reflex Challenge (Randomized target colors & positions)
 *   3. Number Blitz (Tap 1-N in ascending sequence under time pressure)
 *   4. Fast Tap Challenge (10-second high-velocity tapping test)
 *   5. Memory Reflex Challenge (Simon-like dynamic pattern reproduction)
 * - Canvas Charting for reaction time progression
 * - LocalStorage persistence for best scores & reaction times
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. WEB AUDIO SYNTHESIZER
     ========================================================================== */
  class ReflexAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('quickreflex_sound_enabled') !== 'false';
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
      localStorage.setItem('quickreflex_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playCountdown(final = false) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = final ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(final ? 880 : 440, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (final ? 0.3 : 0.15));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + (final ? 0.3 : 0.15));
    }

    playSignalGo() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.03);
        gain.gain.setValueAtTime(0.18, t + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.03);
        osc.stop(t + idx * 0.03 + 0.2);
      });
    }

    playReactionSuccess(rating = 'good') {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      const baseFreq = rating === 'lightning' ? 987 : (rating === 'excellent' ? 784 : 659);
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    playEarlyFault() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    playTapPop() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 200, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    playMemoryNote(index) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
      const freq = notes[index % notes.length];
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
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
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    }
  }

  /* ==========================================================================
     2. GAME CONTROLLER & LOGIC ENGINE
     ========================================================================== */
  class QuickReflexGame {
    constructor() {
      this.audio = new ReflexAudio();

      // State Configurations
      this.mode = 'classic'; // 'classic' | 'color' | 'number' | 'fast-tap' | 'memory'
      this.difficulty = 'medium'; // 'easy' | 'medium' | 'hard'
      this.state = 'idle'; // 'idle' | 'countdown' | 'waiting' | 'ready' | 'result' | 'paused' | 'over'

      // Metrics & History
      this.score = 0;
      this.bestScore = 0;
      this.bestReaction = 9999;
      this.currentRound = 1;
      this.maxRounds = 5;
      this.reactionTimes = [];
      this.correctCount = 0;
      this.mistakeCount = 0;
      this.combo = 0;
      this.bestCombo = 0;

      // Timers & Timestamps
      this.startTime = 0;
      this.waitingTimeout = null;
      this.countdownInterval = null;
      this.modeTimer = null;
      this.fastTapCount = 0;
      this.fastTapDuration = 10; // seconds
      this.fastTapTimeLeft = 10;

      // Memory Mode Sequence
      this.memorySequence = [];
      this.playerStep = 0;

      // Cache DOM Elements
      this.dom = {
        scoreVal: document.getElementById('score-val'),
        bestVal: document.getElementById('best-val'),
        roundStatLbl: document.getElementById('round-stat-lbl'),
        roundStatVal: document.getElementById('round-stat-val'),
        comboPill: document.getElementById('combo-pill'),
        comboVal: document.getElementById('combo-val'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnPause: document.getElementById('btn-pause'),
        instructionText: document.getElementById('instruction-text'),
        gameToast: document.getElementById('game-toast'),
        arena: document.getElementById('reaction-arena'),
        arenaContent: document.getElementById('arena-content'),
        arenaIcon: document.getElementById('arena-icon'),
        arenaTitle: document.getElementById('arena-title'),
        arenaDesc: document.getElementById('arena-desc'),
        arenaMetric: document.getElementById('arena-metric'),
        targetsGrid: document.getElementById('targets-grid'),
        fastTapArea: document.getElementById('fast-tap-area'),
        fastTapMeterFill: document.getElementById('fast-tap-meter-fill'),
        btnTapTarget: document.getElementById('btn-tap-target'),
        tapCountBadge: document.getElementById('tap-count-badge'),
        memoryPadArea: document.getElementById('memory-pad-area'),
        memoryStatus: document.getElementById('memory-status'),
        memPads: document.querySelectorAll('.mem-pad'),
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
        rSlowestVal: document.getElementById('r-slowest-val'),
        rAccuracyVal: document.getElementById('r-accuracy-val'),
        rComboVal: document.getElementById('r-combo-val'),
        reactionChart: document.getElementById('reaction-chart'),
        btnPlayAgain: document.getElementById('btn-play-again'),
        btnChangeMode: document.getElementById('btn-change-mode')
      };

      this.initEvents();
      this.updateSoundIcon();
      this.loadBestRecords();
    }

    /* ==========================================================================
       SETUP & EVENT LISTENERS
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

      // Mode Selector Tabs
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

      // Start Button
      this.dom.btnStartGame.addEventListener('click', () => {
        this.audio.init();
        this.dom.modalStart.classList.add('hidden');
        this.startSession();
      });

      // Results Modal Buttons
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.modalResults.classList.add('hidden');
        this.startSession();
      });
      this.dom.btnChangeMode.addEventListener('click', () => {
        this.dom.modalResults.classList.add('hidden');
        this.dom.modalStart.classList.remove('hidden');
      });

      // Arena Main Click / Tap Trigger (For Reaction Time Mode & Next Round)
      this.dom.arena.addEventListener('pointerdown', (e) => {
        // Prevent trigger if clicking on nested target button or when paused/over
        if (e.target.closest('#targets-grid') || 
            e.target.closest('#fast-tap-area') || 
            e.target.closest('#memory-pad-area') ||
            this.state === 'paused' || 
            this.state === 'over') {
          return;
        }

        e.preventDefault();
        this.handleArenaInteraction();
      });

      // Fast Tap Target Button
      this.dom.btnTapTarget.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.state === 'ready' && this.mode === 'fast-tap') {
          this.handleFastTap();
        }
      });

      // Memory Pads
      this.dom.memPads.forEach(pad => {
        pad.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this.state === 'ready' && this.mode === 'memory') {
            const index = parseInt(pad.dataset.index, 10);
            this.handleMemoryTap(index);
          }
        });
      });

      // Keyboard Interaction (Spacebar / Enter)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (!this.dom.modalStart.classList.contains('hidden') ||
              !this.dom.modalResults.classList.contains('hidden')) return;
          this.togglePause();
          return;
        }

        if (e.code === 'Space' || e.key === 'Enter') {
          if (this.state === 'waiting' || this.state === 'ready' || this.state === 'result') {
            e.preventDefault();
            this.handleArenaInteraction();
          }
        }
      });
    }

    updateSoundIcon() {
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    updateModeExplanation() {
      const descriptions = {
        classic: '<strong>1. Reaction Time Test:</strong> Wait for the red screen to turn green. React as fast as you can! Reacting too early triggers a false-start penalty.',
        color: '<strong>2. Color Reflex Challenge:</strong> Locate and tap the designated target color among varying distractors before time expires.',
        number: '<strong>3. Number Blitz:</strong> Tap the randomly scattered numbered tiles in strict ascending order (1 ➔ 2 ➔ 3...).',
        'fast-tap': '<strong>4. Fast Tap Challenge:</strong> Unleash maximum tapping speed! Register as many valid taps as possible within 10 seconds.',
        memory: '<strong>5. Memory Reflex:</strong> Observe the flashing color sequence carefully, then repeat the exact order without errors.'
      };
      this.dom.modeInfoBox.innerHTML = descriptions[this.mode] || descriptions.classic;
    }

    showToast(msg) {
      const toast = this.dom.gameToast;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 1600);
    }

    loadBestRecords() {
      const savedScore = localStorage.getItem(`quickreflex_score_${this.mode}`);
      const savedTime = localStorage.getItem(`quickreflex_fastest_${this.mode}`);
      this.bestScore = savedScore ? parseInt(savedScore, 10) : 0;
      this.bestReaction = savedTime ? parseFloat(savedTime) : 9999;
      this.dom.bestVal.textContent = this.bestReaction === 9999 ? '-- ms' : `${Math.round(this.bestReaction)} ms`;
    }

    saveBestRecords(avgTime) {
      let isNewRecord = false;
      const keyScore = `quickreflex_score_${this.mode}`;
      const keyTime = `quickreflex_fastest_${this.mode}`;

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(keyScore, this.score);
        isNewRecord = true;
      }
      if (avgTime > 0 && avgTime < this.bestReaction) {
        this.bestReaction = avgTime;
        localStorage.setItem(keyTime, this.bestReaction);
        this.dom.bestVal.textContent = `${Math.round(this.bestReaction)} ms`;
        isNewRecord = true;
      }
      return isNewRecord;
    }

    togglePause() {
      if (this.state === 'over' || this.state === 'idle') return;
      if (this.state === 'paused') {
        this.state = this.previousState || 'waiting';
        this.dom.modalPause.classList.add('hidden');
        if (this.state === 'waiting') {
          this.scheduleSignal();
        }
      } else {
        this.previousState = this.state;
        this.state = 'paused';
        clearTimeout(this.waitingTimeout);
        this.dom.pauseScoreNum.textContent = this.score;
        this.dom.pauseBestNum.textContent = this.bestReaction === 9999 ? '-- ms' : `${Math.round(this.bestReaction)} ms`;
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
      this.reactionTimes = [];
      this.correctCount = 0;
      this.mistakeCount = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.fastTapCount = 0;
      this.memorySequence = [];

      this.dom.scoreVal.textContent = '0';
      this.dom.comboPill.classList.add('hidden');
      this.loadBestRecords();

      // Mode-specific initialization
      if (this.mode === 'classic') {
        this.maxRounds = 5;
        this.dom.roundStatLbl.textContent = 'ROUND';
        this.dom.roundStatVal.textContent = `1 / ${this.maxRounds}`;
        this.startClassicRound();
      } else if (this.mode === 'color') {
        this.maxRounds = 5;
        this.dom.roundStatLbl.textContent = 'ROUND';
        this.dom.roundStatVal.textContent = `1 / ${this.maxRounds}`;
        this.startColorRound();
      } else if (this.mode === 'number') {
        this.maxRounds = 4;
        this.dom.roundStatLbl.textContent = 'ROUND';
        this.dom.roundStatVal.textContent = `1 / ${this.maxRounds}`;
        this.startNumberRound();
      } else if (this.mode === 'fast-tap') {
        this.dom.roundStatLbl.textContent = 'TIME';
        this.dom.roundStatVal.textContent = '10s';
        this.startFastTapSession();
      } else if (this.mode === 'memory') {
        this.dom.roundStatLbl.textContent = 'LEVEL';
        this.dom.roundStatVal.textContent = '1';
        this.startMemoryRound();
      }
    }

    clearAllTimers() {
      clearTimeout(this.waitingTimeout);
      clearInterval(this.countdownInterval);
      clearInterval(this.modeTimer);
    }

    setArenaState(stateClass, title, desc, icon = '⚡') {
      const arena = this.dom.arena;
      arena.className = '';
      arena.classList.add(stateClass);
      this.dom.arenaIcon.textContent = icon;
      this.dom.arenaTitle.textContent = title;
      this.dom.arenaDesc.textContent = desc;
      this.dom.arenaContent.classList.remove('hidden');
      this.dom.arenaMetric.classList.add('hidden');
      this.dom.targetsGrid.classList.add('hidden');
      this.dom.fastTapArea.classList.add('hidden');
      this.dom.memoryPadArea.classList.add('hidden');
    }

    /* ==========================================================================
       MODE 1: CLASSIC REACTION TIME TEST (Red -> Green)
       ========================================================================== */
    startClassicRound() {
      this.dom.roundStatVal.textContent = `${this.currentRound} / ${this.maxRounds}`;
      this.dom.instructionText.textContent = 'Wait for green... Tap immediately when it turns green!';
      this.setArenaState('arena-wait', 'WAIT FOR GREEN...', 'Do not tap yet or you will get a false start penalty!', '🛑');
      this.state = 'waiting';

      // Unpredictable waiting period (1.6s to 4.5s bounded by difficulty)
      let minDelay = 1600;
      let maxDelay = 4200;
      if (this.difficulty === 'hard') {
        minDelay = 1200;
        maxDelay = 3500;
      } else if (this.difficulty === 'easy') {
        minDelay = 2000;
        maxDelay = 5000;
      }
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;

      this.waitingTimeout = setTimeout(() => {
        this.triggerGreenSignal();
      }, delay);
    }

    triggerGreenSignal() {
      this.state = 'ready';
      this.startTime = performance.now();
      this.setArenaState('arena-ready', 'TAP NOW!', 'React as fast as humanly possible!', '🟢');
      this.audio.playSignalGo();
    }

    handleArenaInteraction() {
      if (this.mode !== 'classic') return;

      if (this.state === 'waiting') {
        // FALSE START PENALTY
        clearTimeout(this.waitingTimeout);
        this.state = 'result';
        this.mistakeCount++;
        this.combo = 0;
        this.dom.comboPill.classList.add('hidden');
        this.score = Math.max(0, this.score - 150);
        this.dom.scoreVal.textContent = this.score;

        this.audio.playEarlyFault();
        this.setArenaState('arena-early', 'TOO EARLY! 🛑', 'You tapped before the green signal! (-150 pts penalty)', '💥');
        this.dom.instructionText.textContent = 'False start! Tap anywhere to try this round again.';
      } else if (this.state === 'ready') {
        // SUCCESSFUL REACTION
        const elapsed = performance.now() - this.startTime;
        this.state = 'result';
        this.reactionTimes.push(elapsed);
        this.correctCount++;
        this.combo++;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;

        // Score based on millisecond speed
        let roundScore = Math.max(50, Math.round(1000 - elapsed * 1.5));
        const comboBonus = (this.combo - 1) * 60;
        this.score += roundScore + comboBonus;
        this.dom.scoreVal.textContent = this.score;

        if (this.combo >= 2) {
          this.dom.comboPill.classList.remove('hidden');
          this.dom.comboVal.textContent = `x${this.combo}`;
        }

        const rating = elapsed < 220 ? 'lightning' : (elapsed < 300 ? 'excellent' : 'good');
        this.audio.playReactionSuccess(rating);

        this.setArenaState('arena-success', `${Math.round(elapsed)} ms`, 'Tap anywhere to advance to next round', '⚡');
        this.dom.arenaMetric.textContent = `${Math.round(elapsed)} ms`;
        this.dom.arenaMetric.classList.remove('hidden');
        this.dom.instructionText.textContent = `Splendid reaction! ${Math.round(elapsed)} ms. Tap to continue.`;
      } else if (this.state === 'result') {
        // Advance to next round or finish session
        if (this.currentRound < this.maxRounds) {
          this.currentRound++;
          this.startClassicRound();
        } else {
          this.finishSession();
        }
      }
    }

    /* ==========================================================================
       MODE 2: COLOR REFLEX CHALLENGE
       ========================================================================== */
    startColorRound() {
      this.dom.roundStatVal.textContent = `${this.currentRound} / ${this.maxRounds}`;
      const colors = [
        { name: 'CYAN', hex: '#00f2fe' },
        { name: 'PINK', hex: '#ec4899' },
        { name: 'YELLOW', hex: '#facc15' },
        { name: 'GREEN', hex: '#22c55e' },
        { name: 'PURPLE', hex: '#a855f7' },
        { name: 'ORANGE', hex: '#f97316' }
      ];

      // Pick target color
      const target = colors[Math.floor(Math.random() * colors.length)];
      this.setArenaState('arena-idle', '', '', '');
      this.dom.arenaContent.classList.add('hidden');
      this.dom.targetsGrid.classList.remove('hidden');
      this.dom.targetsGrid.innerHTML = '';

      this.dom.instructionText.textContent = `🎯 QUICK: Tap the ${target.name} circle!`;

      // Generate 6 circles with random placement
      const shuffled = [...colors].sort(() => Math.random() - 0.5);
      this.startTime = performance.now();
      this.state = 'ready';

      shuffled.forEach(c => {
        const item = document.createElement('div');
        item.className = 'target-item';
        item.style.backgroundColor = c.hex;
        item.style.borderRadius = '50%';
        item.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (this.state !== 'ready') return;
          const elapsed = performance.now() - this.startTime;
          if (c.name === target.name) {
            item.classList.add('correct-flash');
            this.handleTargetSuccess(elapsed);
          } else {
            item.classList.add('wrong-flash');
            this.handleTargetFault();
          }
        });
        this.dom.targetsGrid.appendChild(item);
      });
    }

    handleTargetSuccess(elapsed) {
      this.reactionTimes.push(elapsed);
      this.correctCount++;
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;

      const roundScore = Math.max(100, Math.round(1200 - elapsed * 1.8));
      this.score += roundScore + (this.combo - 1) * 50;
      this.dom.scoreVal.textContent = this.score;
      this.audio.playReactionSuccess('excellent');
      this.showToast(`+${roundScore} pts (${Math.round(elapsed)} ms)`);

      if (this.currentRound < this.maxRounds) {
        this.currentRound++;
        setTimeout(() => this.startColorRound(), 250);
      } else {
        setTimeout(() => this.finishSession(), 350);
      }
    }

    handleTargetFault() {
      this.mistakeCount++;
      this.combo = 0;
      this.dom.comboPill.classList.add('hidden');
      this.score = Math.max(0, this.score - 100);
      this.dom.scoreVal.textContent = this.score;
      this.audio.playEarlyFault();
      this.showToast('-100 Wrong Target!');
    }

    /* ==========================================================================
       MODE 3: NUMBER BLITZ (Ascending Order)
       ========================================================================== */
    startNumberRound() {
      this.dom.roundStatVal.textContent = `${this.currentRound} / ${this.maxRounds}`;
      this.setArenaState('arena-idle', '', '', '');
      this.dom.arenaContent.classList.add('hidden');
      this.dom.targetsGrid.classList.remove('hidden');
      this.dom.targetsGrid.innerHTML = '';

      const count = this.difficulty === 'easy' ? 6 : (this.difficulty === 'medium' ? 8 : 9);
      this.dom.instructionText.textContent = `Tap numbers 1 to ${count} in ascending order!`;

      this.currentNumberTarget = 1;
      const numbers = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

      this.startTime = performance.now();
      this.state = 'ready';

      numbers.forEach(num => {
        const item = document.createElement('div');
        item.className = 'target-item';
        item.textContent = num;
        item.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        item.style.borderColor = 'rgba(0, 242, 254, 0.4)';

        item.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (this.state !== 'ready') return;
          if (num === this.currentNumberTarget) {
            item.style.backgroundColor = 'var(--green-neon)';
            item.style.pointerEvents = 'none';
            item.classList.add('correct-flash');
            this.audio.playTapPop();
            this.currentNumberTarget++;

            if (this.currentNumberTarget > count) {
              const elapsed = performance.now() - this.startTime;
              this.handleTargetSuccess(elapsed);
            }
          } else {
            item.classList.add('wrong-flash');
            this.handleTargetFault();
          }
        });
        this.dom.targetsGrid.appendChild(item);
      });
    }

    /* ==========================================================================
       MODE 4: FAST TAP CHALLENGE (10s High Velocity)
       ========================================================================== */
    startFastTapSession() {
      this.setArenaState('arena-idle', '', '', '');
      this.dom.arenaContent.classList.add('hidden');
      this.dom.fastTapArea.classList.remove('hidden');
      this.dom.instructionText.textContent = 'Tap the button as fast as you can before time expires!';

      this.fastTapCount = 0;
      this.fastTapTimeLeft = 10;
      this.dom.tapCountBadge.textContent = '0';
      this.dom.fastTapMeterFill.style.width = '100%';
      this.state = 'ready';

      const totalTime = 10;
      const startTimestamp = performance.now();

      this.modeTimer = setInterval(() => {
        if (this.state === 'paused') return;
        const elapsed = (performance.now() - startTimestamp) / 1000;
        this.fastTapTimeLeft = Math.max(0, totalTime - elapsed);
        this.dom.roundStatVal.textContent = `${this.fastTapTimeLeft.toFixed(1)}s`;
        this.dom.fastTapMeterFill.style.width = `${(this.fastTapTimeLeft / totalTime) * 100}%`;

        if (this.fastTapTimeLeft <= 0) {
          clearInterval(this.modeTimer);
          this.state = 'over';
          // Approximate reaction time based on average interval between taps
          const avgInterval = (10 / Math.max(1, this.fastTapCount)) * 1000;
          this.reactionTimes.push(avgInterval);
          this.score = this.fastTapCount * 80;
          this.dom.scoreVal.textContent = this.score;
          this.finishSession();
        }
      }, 50);
    }

    handleFastTap() {
      this.fastTapCount++;
      this.dom.tapCountBadge.textContent = this.fastTapCount;
      this.audio.playTapPop();
    }

    /* ==========================================================================
       MODE 5: MEMORY REFLEX CHALLENGE (Simon-style Sequences)
       ========================================================================== */
    startMemoryRound() {
      this.setArenaState('arena-idle', '', '', '');
      this.dom.arenaContent.classList.add('hidden');
      this.dom.memoryPadArea.classList.remove('hidden');

      const nextPad = Math.floor(Math.random() * 4);
      this.memorySequence.push(nextPad);
      this.dom.roundStatVal.textContent = `${this.memorySequence.length}`;
      this.playerStep = 0;

      this.dom.instructionText.textContent = 'Watch the sequence...';
      this.dom.memoryStatus.textContent = '👀 Watch closely...';
      this.state = 'waiting';

      // Playback sequence
      let i = 0;
      const playStep = () => {
        if (i < this.memorySequence.length) {
          const padIdx = this.memorySequence[i];
          this.flashPad(padIdx);
          i++;
          setTimeout(playStep, 500);
        } else {
          this.state = 'ready';
          this.startTime = performance.now();
          this.dom.instructionText.textContent = 'Your turn! Repeat the exact sequence.';
          this.dom.memoryStatus.textContent = '⚡ YOUR TURN!';
        }
      };
      setTimeout(playStep, 700);
    }

    flashPad(index) {
      const pad = this.dom.memPads[index];
      if (pad) {
        pad.classList.add('active');
        this.audio.playMemoryNote(index);
        setTimeout(() => pad.classList.remove('active'), 320);
      }
    }

    handleMemoryTap(index) {
      this.flashPad(index);
      if (index === this.memorySequence[this.playerStep]) {
        this.playerStep++;
        this.correctCount++;
        if (this.playerStep >= this.memorySequence.length) {
          const elapsed = performance.now() - this.startTime;
          this.reactionTimes.push(elapsed / this.memorySequence.length);
          this.combo++;
          if (this.combo > this.bestCombo) this.bestCombo = this.combo;

          this.score += this.memorySequence.length * 250;
          this.dom.scoreVal.textContent = this.score;
          this.audio.playReactionSuccess('lightning');
          this.showToast(`Sequence Cleared! Level ${this.memorySequence.length + 1}`);

          if (this.memorySequence.length >= 8) {
            this.finishSession();
          } else {
            setTimeout(() => this.startMemoryRound(), 600);
          }
        }
      } else {
        this.mistakeCount++;
        this.audio.playEarlyFault();
        this.showToast('Wrong Sequence! Game Over');
        this.finishSession();
      }
    }

    /* ==========================================================================
       SESSION COMPLETION & RESULTS DASHBOARD
       ========================================================================== */
    finishSession() {
      this.state = 'over';
      this.clearAllTimers();
      this.audio.playVictory();

      // Computations
      const validTimes = this.reactionTimes.filter(t => t > 0);
      const avg = validTimes.length > 0 
        ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) 
        : 0;
      const fastest = validTimes.length > 0 ? Math.round(Math.min(...validTimes)) : 0;
      const slowest = validTimes.length > 0 ? Math.round(Math.max(...validTimes)) : 0;

      const totalAttempts = this.correctCount + this.mistakeCount;
      const accuracy = totalAttempts > 0 ? Math.round((this.correctCount / totalAttempts) * 100) : 100;

      // Rating classification
      let ratingText = 'GOOD 👍';
      let ratingClass = 'rating-good';
      if (avg > 0 && avg <= 220) {
        ratingText = 'LIGHTNING FAST ⚡';
      } else if (avg > 0 && avg <= 280) {
        ratingText = 'EXCELLENT 🌟';
      } else if (avg > 0 && avg <= 350) {
        ratingText = 'VERY GOOD 🎯';
      } else if (avg > 350) {
        ratingText = 'KEEP PRACTICING 🚀';
      }

      this.dom.ratingBadge.textContent = ratingText;
      this.dom.rScoreVal.textContent = this.score;
      this.dom.rAvgVal.textContent = avg > 0 ? `${avg} ms` : '-- ms';
      this.dom.rFastestVal.textContent = fastest > 0 ? `${fastest} ms` : '-- ms';
      this.dom.rSlowestVal.textContent = slowest > 0 ? `${slowest} ms` : '-- ms';
      this.dom.rAccuracyVal.textContent = `${accuracy}%`;
      this.dom.rComboVal.textContent = `x${this.bestCombo}`;

      const isNew = this.saveBestRecords(avg);
      if (isNew) {
        this.dom.newRecordRibbon.classList.remove('hidden');
      } else {
        this.dom.newRecordRibbon.classList.add('hidden');
      }

      // Render chart canvas
      this.drawReactionChart(validTimes);

      this.dom.modalResults.classList.remove('hidden');
    }

    drawReactionChart(times) {
      const canvas = this.dom.reactionChart;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      if (times.length === 0) return;

      const maxVal = Math.max(...times, 400);
      const minVal = Math.min(...times, 150);
      const padding = 20;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      // Draw line graph
      ctx.beginPath();
      ctx.strokeStyle = '#00f2fe';
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

      // Draw points and values
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
        ctx.fillText(`${Math.round(val)}ms`, x, y - 8);
      });
    }
  }

  // Initialize on DOM load
  window.addEventListener('DOMContentLoaded', () => {
    window.quickReflexGame = new QuickReflexGame();
  });
})();

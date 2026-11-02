(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('whackamole_muted') === 'true';
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

    playBonk() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playGold() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [600, 900, 1200].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.12);
      });
    }

    playBomb() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('whackamole_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const holesGrid = document.getElementById('holes-grid');
  const scoreEl = document.getElementById('score-val');
  const timeEl = document.getElementById('time-val');
  const comboEl = document.getElementById('combo-val');

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

  const startBestScore = document.getElementById('start-best-score');
  const finalScore = document.getElementById('final-score');
  const finalMoles = document.getElementById('final-moles');
  const finalCombo = document.getElementById('final-combo');
  const finalBest = document.getElementById('final-best');

  // Game state
  let gameState = 'START';
  let bestScore = parseInt(localStorage.getItem('whackamole_best_score') || '0', 10);

  let score = 0;
  let timeLeft = 45;
  let combo = 1;
  let maxCombo = 1;
  let molesWhacked = 0;

  let spawnTimer = null;
  let clockTimer = null;

  // 9 Holes
  const holes = [];
  for (let i = 0; i < 9; i++) {
    holes.push({
      id: i,
      state: 'down', // down, up, whacked
      type: 'normal', // normal, gold, bomb
      el: null,
      charEl: null,
      iconEl: null,
      hideTimeout: null
    });
  }

  function setupDOM() {
    holesGrid.innerHTML = '';
    holes.forEach((hole, idx) => {
      const box = document.createElement('div');
      box.className = 'hole-box';
      box.dataset.id = idx;

      const char = document.createElement('div');
      char.className = 'mole-character';

      const icon = document.createElement('span');
      icon.className = 'mole-icon';
      icon.textContent = '🐹';

      char.appendChild(icon);
      box.appendChild(char);
      holesGrid.appendChild(box);

      hole.el = box;
      hole.charEl = char;
      hole.iconEl = icon;

      box.addEventListener('pointerdown', () => whackHole(idx));
    });
  }

  function popMole() {
    if (gameState !== 'PLAYING') return;

    // Filter available holes
    const available = holes.filter(h => h.state === 'down');
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    const rand = Math.random();
    if (rand < 0.15) {
      chosen.type = 'bomb';
      chosen.iconEl.textContent = '💣';
    } else if (rand < 0.35) {
      chosen.type = 'gold';
      chosen.iconEl.textContent = '👑';
    } else {
      chosen.type = 'normal';
      chosen.iconEl.textContent = '🐹';
    }

    chosen.state = 'up';
    chosen.charEl.className = 'mole-character up';

    const stayDuration = Math.max(550, 950 - (45 - timeLeft) * 10);
    chosen.hideTimeout = setTimeout(() => {
      if (chosen.state === 'up') {
        chosen.state = 'down';
        chosen.charEl.className = 'mole-character';
      }
    }, stayDuration);
  }

  function whackHole(idx) {
    if (gameState !== 'PLAYING') return;
    const hole = holes[idx];

    if (hole.state === 'up') {
      clearTimeout(hole.hideTimeout);
      hole.state = 'whacked';
      hole.charEl.classList.add('whacked');

      if (hole.type === 'normal') {
        const pts = 10 * combo;
        score += pts;
        molesWhacked++;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        sound.playBonk();
      } else if (hole.type === 'gold') {
        const pts = 30 * combo;
        score += pts;
        molesWhacked++;
        combo += 2;
        if (combo > maxCombo) maxCombo = combo;
        sound.playGold();
      } else if (hole.type === 'bomb') {
        score = Math.max(0, score - 20);
        combo = 1;
        sound.playBomb();
      }

      scoreEl.textContent = score;
      comboEl.textContent = `x${combo}`;

      setTimeout(() => {
        hole.state = 'down';
        hole.charEl.className = 'mole-character';
      }, 200);
    } else if (hole.state === 'down') {
      // Miss penalty: reset combo
      combo = 1;
      comboEl.textContent = `x${combo}`;
    }
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    clearInterval(clockTimer);
    clearInterval(spawnTimer);

    holes.forEach(h => {
      clearTimeout(h.hideTimeout);
      h.state = 'down';
      h.charEl.className = 'mole-character';
    });

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('whackamole_best_score', bestScore);
    }

    finalScore.textContent = score;
    finalMoles.textContent = molesWhacked;
    finalCombo.textContent = `x${maxCombo}`;
    finalBest.textContent = bestScore;

    modalGameOver.classList.remove('hidden');
  }

  function initGame() {
    score = 0;
    timeLeft = 45;
    combo = 1;
    maxCombo = 1;
    molesWhacked = 0;

    scoreEl.textContent = '0';
    timeEl.textContent = '45s';
    comboEl.textContent = 'x1';

    clearInterval(clockTimer);
    clearInterval(spawnTimer);

    clockTimer = setInterval(() => {
      if (gameState === 'PLAYING') {
        timeLeft--;
        timeEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
          gameOver();
        }
      }
    }, 1000);

    spawnTimer = setInterval(() => {
      if (gameState === 'PLAYING') {
        popMole();
        if (timeLeft < 25 && Math.random() < 0.45) {
          popMole(); // multi mole frenzy
        }
      }
    }, 650);
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

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  // Init
  startBestScore.textContent = bestScore;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  setupDOM();
})();

(() => {
  'use strict';

  // Sound Engine
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('tictactoe_muted') === 'true';
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

    playPlaceX() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playPlaceO() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
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

    playDraw() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('tictactoe_muted', this.muted);
      return this.muted;
    }
  }

  const sound = new SoundFX();

  // Elements
  const cells = document.querySelectorAll('.ttt-cell');
  const boardEl = document.getElementById('ttt-board');
  const strikeLine = document.getElementById('strike-line');
  const turnIndicator = document.getElementById('turn-indicator');
  const winsEl = document.getElementById('wins-val');
  const drawsEl = document.getElementById('draws-val');
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
  const finalDraws = document.getElementById('final-draws');
  const finalLosses = document.getElementById('final-losses');
  const finalRatio = document.getElementById('final-ratio');
  const gameoverIcon = document.getElementById('gameover-icon');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverReason = document.getElementById('gameover-reason');

  // Stats
  let stats = JSON.parse(localStorage.getItem('tictactoe_stats') || '{"wins":0,"draws":0,"losses":0}');

  // Game state
  let gameMode = 'ai-hard'; // 'ai-hard', 'ai-easy', '2p'
  let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
  let board = Array(9).fill('');
  let currentTurn = 'X'; // 'X' always goes first

  const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  function updateHUD() {
    winsEl.textContent = stats.wins;
    drawsEl.textContent = stats.draws;
    lossesEl.textContent = stats.losses;
  }

  function checkWinner(b) {
    for (const combo of WIN_COMBOS) {
      const [p1, p2, p3] = combo;
      if (b[p1] && b[p1] === b[p2] && b[p1] === b[p3]) {
        return { winner: b[p1], combo };
      }
    }
    if (b.every(cell => cell !== '')) {
      return { winner: 'DRAW', combo: null };
    }
    return null;
  }

  function drawStrikeLine(combo) {
    if (!combo) return;
    const boardRect = boardEl.getBoundingClientRect();
    const c1 = cells[combo[0]].getBoundingClientRect();
    const c3 = cells[combo[2]].getBoundingClientRect();

    const x1 = c1.left + c1.width / 2 - boardRect.left;
    const y1 = c1.top + c1.height / 2 - boardRect.top;
    const x2 = c3.left + c3.width / 2 - boardRect.left;
    const y2 = c3.top + c3.height / 2 - boardRect.top;

    const length = Math.hypot(x2 - x1, y2 - y1) + 40;
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    strikeLine.style.width = `${length}px`;
    strikeLine.style.height = `6px`;
    strikeLine.style.left = `${midX - length / 2}px`;
    strikeLine.style.top = `${midY - 3}px`;
    strikeLine.style.transform = `rotate(${angle}deg)`;
    strikeLine.classList.remove('hidden');
  }

  // Minimax Algorithm
  function minimax(newBoard, depth, isMaximizing) {
    const result = checkWinner(newBoard);
    if (result) {
      if (result.winner === 'O') return 10 - depth;
      if (result.winner === 'X') return depth - 10;
      if (result.winner === 'DRAW') return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'O';
          const score = minimax(newBoard, depth + 1, false);
          newBoard[i] = '';
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'X';
          const score = minimax(newBoard, depth + 1, true);
          newBoard[i] = '';
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  function getBestAIMove() {
    // Master AI uses Minimax
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = '';
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  function getCasualAIMove() {
    // 50% chance optimal, 50% chance random
    if (Math.random() < 0.5) {
      return getBestAIMove();
    }
    const emptyIndices = [];
    board.forEach((val, idx) => { if (val === '') emptyIndices.push(idx); });
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase(), 'taken');

    if (player === 'X') sound.playPlaceX();
    else sound.playPlaceO();

    const outcome = checkWinner(board);
    if (outcome) {
      handleGameOver(outcome);
    } else {
      currentTurn = (player === 'X') ? 'O' : 'X';
      turnIndicator.textContent = (gameMode === '2p')
        ? `PLAYER ${currentTurn}'s TURN`
        : (currentTurn === 'X' ? "YOUR TURN (X)" : "AI COMPUTING...");

      if (currentTurn === 'O' && gameMode !== '2p') {
        setTimeout(aiTurn, 350);
      }
    }
  }

  function aiTurn() {
    if (gameState !== 'PLAYING') return;
    const move = (gameMode === 'ai-hard') ? getBestAIMove() : getCasualAIMove();
    if (move !== -1) {
      makeMove(move, 'O');
    }
  }

  function handleGameOver(outcome) {
    gameState = 'GAMEOVER';

    if (outcome.winner === 'DRAW') {
      sound.playDraw();
      stats.draws++;
      gameoverIcon.textContent = '🤝';
      gameoverTitle.textContent = 'STALEMATE DRAW!';
      gameoverReason.textContent = 'Both sides displayed airtight strategy!';
    } else if (outcome.winner === 'X') {
      sound.playWin();
      stats.wins++;
      drawStrikeLine(outcome.combo);
      gameoverIcon.textContent = '🏆';
      gameoverTitle.textContent = (gameMode === '2p') ? 'PLAYER X VICTORIOUS!' : 'YOU DEFEATED THE AI!';
      gameoverReason.textContent = 'Three aligned in flawless formation!';
    } else {
      sound.playWin();
      stats.losses++;
      drawStrikeLine(outcome.combo);
      gameoverIcon.textContent = (gameMode === '2p') ? '🏆' : '🤖';
      gameoverTitle.textContent = (gameMode === '2p') ? 'PLAYER O VICTORIOUS!' : 'AI OUTPLAYED YOU!';
      gameoverReason.textContent = 'Three aligned across the neon grid!';
    }

    localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
    updateHUD();

    const totalGames = stats.wins + stats.draws + stats.losses;
    const ratio = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

    finalWins.textContent = stats.wins;
    finalDraws.textContent = stats.draws;
    finalLosses.textContent = stats.losses;
    finalRatio.textContent = `${ratio}%`;

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 700);
  }

  function initBoard() {
    board = Array(9).fill('');
    currentTurn = 'X';
    strikeLine.classList.add('hidden');
    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'ttt-cell';
    });

    turnIndicator.textContent = (gameMode === '2p') ? "PLAYER X's TURN" : "YOUR TURN (X)";
    updateHUD();
  }

  function startGame() {
    sound.init();
    gameState = 'PLAYING';
    modalStart.classList.add('hidden');
    modalGameOver.classList.add('hidden');
    modalPause.classList.add('hidden');
    initBoard();
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
      initBoard();
    });
  });

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      if (gameState !== 'PLAYING') return;
      if (gameMode !== '2p' && currentTurn !== 'X') return; // wait for AI

      const idx = parseInt(cell.dataset.index, 10);
      if (board[idx] === '') {
        makeMove(idx, currentTurn);
      }
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
  updateHUD();
})();

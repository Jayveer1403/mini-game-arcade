(() => {
  const WORD_BANK = [
    'NEON', 'CYBER', 'LASER', 'REFLEX', 'ORBIT', 'PIXEL', 'RADAR', 'TURBO',
    'MATRIX', 'VECTOR', 'VELOCITY', 'HYPER', 'GLITCH', 'SYNAPSE', 'ROBOT',
    'SHIELD', 'ARCADE', 'BLITZ', 'CIRCUIT', 'PHOTON', 'PULSE', 'CHROME',
    'COSMIC', 'ENGINE', 'FLIGHT', 'FUSION', 'GRAVITY', 'IMPACT', 'KINETIC',
    'MOTION', 'NAVIGATE', 'PLASMA', 'ROCKET', 'SENSOR', 'STATIC', 'THRUST'
  ];

  const timeVal = document.getElementById('time-val');
  const wpmVal = document.getElementById('wpm-val');
  const accVal = document.getElementById('acc-val');
  const bestVal = document.getElementById('best-val');
  const soundBtn = document.getElementById('sound-btn');
  const pauseBtn = document.getElementById('pause-btn');

  const targetWordEl = document.getElementById('target-word');
  const typeInput = document.getElementById('type-input');
  const streakIndicator = document.getElementById('streak-indicator');

  const wordsCountEl = document.getElementById('words-count');
  const charsCountEl = document.getElementById('chars-count');
  const errorsCountEl = document.getElementById('errors-count');

  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const pauseRestartBtn = document.getElementById('pause-restart-btn');

  const rankIcon = document.getElementById('rank-icon');
  const rankTitle = document.getElementById('rank-title');
  const finalWpm = document.getElementById('final-wpm');
  const finalAcc = document.getElementById('final-acc');
  const finalStreak = document.getElementById('final-streak');

  // Audio Setup
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playKeySound(freq = 600, duration = 0.05, type = 'sine') {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playWordCompleteSound() {
    if (!soundEnabled || !audioCtx) return;
    [520, 650, 780].forEach((f, idx) => {
      setTimeout(() => playKeySound(f, 0.1, 'triangle'), idx * 35);
    });
  }

  function playErrorSound() {
    if (!soundEnabled || !audioCtx) return;
    playKeySound(150, 0.15, 'sawtooth');
  }

  function playGameOverFanfare() {
    if (!soundEnabled || !audioCtx) return;
    [400, 500, 600, 800].forEach((f, idx) => {
      setTimeout(() => playKeySound(f, 0.25, 'triangle'), idx * 80);
    });
  }

  // Game State
  const TOTAL_TIME = 45;
  let timeLeft = TOTAL_TIME;
  let timerInterval = null;
  let currentWord = '';
  let wordsCompleted = 0;
  let totalTypedChars = 0;
  let correctChars = 0;
  let errorCount = 0;
  let streak = 0;
  let maxStreak = 0;
  let isPlaying = false;

  let bestWpm = parseInt(localStorage.getItem('arcade_typing_speed_best') || '0', 10);
  bestVal.textContent = bestWpm;

  function getRandomWord() {
    const list = WORD_BANK.filter(w => w !== currentWord);
    return list[Math.floor(Math.random() * list.length)];
  }

  function renderWordDisplay(inputVal = '') {
    targetWordEl.innerHTML = '';
    const wordUpper = currentWord;
    const inputUpper = inputVal.toUpperCase();

    for (let i = 0; i < wordUpper.length; i++) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = wordUpper[i];

      if (i < inputUpper.length) {
        if (inputUpper[i] === wordUpper[i]) {
          span.classList.add('correct');
        } else {
          span.classList.add('wrong');
        }
      }
      targetWordEl.appendChild(span);
    }
  }

  function setNextWord() {
    currentWord = getRandomWord();
    typeInput.value = '';
    renderWordDisplay('');
  }

  function updateMetrics() {
    const elapsedMinutes = (TOTAL_TIME - timeLeft) / 60;
    const grossWpm = elapsedMinutes > 0 ? Math.round((correctChars / 5) / elapsedMinutes) : 0;
    const totalHits = correctChars + errorCount;
    const acc = totalHits > 0 ? Math.round((correctChars / totalHits) * 100) : 100;

    wpmVal.textContent = grossWpm;
    accVal.textContent = `${acc}%`;
    wordsCountEl.textContent = wordsCompleted;
    charsCountEl.textContent = correctChars;
    errorsCountEl.textContent = errorCount;
    streakIndicator.textContent = `STREAK: ${streak}🔥`;
  }

  function startGame() {
    initAudio();
    timeLeft = TOTAL_TIME;
    wordsCompleted = 0;
    totalTypedChars = 0;
    correctChars = 0;
    errorCount = 0;
    streak = 0;
    maxStreak = 0;
    isPlaying = true;

    timeVal.textContent = `${timeLeft}s`;
    wpmVal.textContent = '0';
    accVal.textContent = '100%';

    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseBtn.textContent = '⏸️';

    typeInput.disabled = false;
    typeInput.value = '';
    typeInput.focus();

    setNextWord();
    updateMetrics();

    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      timeVal.textContent = `${timeLeft}s`;
      updateMetrics();

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function pauseGame() {
    if (!isPlaying) return;
    isPlaying = false;
    clearInterval(timerInterval);
    typeInput.disabled = true;
    pauseOverlay.classList.remove('hidden');
    pauseBtn.textContent = '▶️';
  }

  function resumeGame() {
    if (isPlaying) return;
    isPlaying = true;
    pauseOverlay.classList.add('hidden');
    pauseBtn.textContent = '⏸️';
    typeInput.disabled = false;
    typeInput.focus();
    startTimer();
  }

  function togglePause() {
    if (isPlaying) {
      pauseGame();
    } else if (!pauseOverlay.classList.contains('hidden')) {
      resumeGame();
    }
  }

  function endGame() {
    clearInterval(timerInterval);
    isPlaying = false;
    typeInput.disabled = true;

    playGameOverFanfare();

    const elapsedMinutes = TOTAL_TIME / 60;
    const finalGrossWpm = Math.round((correctChars / 5) / elapsedMinutes);
    const totalHits = correctChars + errorCount;
    const finalAccuracy = totalHits > 0 ? Math.round((correctChars / totalHits) * 100) : 100;

    if (finalGrossWpm > bestWpm) {
      bestWpm = finalGrossWpm;
      localStorage.setItem('arcade_typing_speed_best', bestWpm.toString());
      bestVal.textContent = bestWpm;
    }

    finalWpm.textContent = finalGrossWpm;
    finalAcc.textContent = `${finalAccuracy}%`;
    finalStreak.textContent = `${maxStreak}🔥`;

    // Award rank
    if (finalGrossWpm >= 75) {
      rankIcon.textContent = '👑';
      rankTitle.textContent = 'GRANDMASTER';
    } else if (finalGrossWpm >= 55) {
      rankIcon.textContent = '💎';
      rankTitle.textContent = 'DIAMOND';
    } else if (finalGrossWpm >= 40) {
      rankIcon.textContent = '🥇';
      rankTitle.textContent = 'GOLD';
    } else if (finalGrossWpm >= 25) {
      rankIcon.textContent = '🥈';
      rankTitle.textContent = 'SILVER';
    } else {
      rankIcon.textContent = '🥉';
      rankTitle.textContent = 'BRONZE';
    }

    gameOverOverlay.classList.remove('hidden');
  }

  typeInput.addEventListener('input', (e) => {
    if (!isPlaying) return;

    const val = typeInput.value.trim().toUpperCase();
    renderWordDisplay(typeInput.value);

    // Audio click for typing
    playKeySound(500 + Math.random() * 200, 0.04);

    // Check if typed string matches prefix
    const isPrefixCorrect = currentWord.startsWith(val);

    if (val === currentWord) {
      // Completed full word!
      wordsCompleted++;
      correctChars += currentWord.length;
      streak++;
      if (streak > maxStreak) maxStreak = streak;

      playWordCompleteSound();
      setNextWord();
      updateMetrics();
    } else if (!isPrefixCorrect && val.length > 0) {
      errorCount++;
      streak = 0;
      playErrorSound();
      updateMetrics();
    }
  });

  typeInput.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const val = typeInput.value.trim().toUpperCase();
      if (val === currentWord) {
        wordsCompleted++;
        correctChars += currentWord.length;
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        playWordCompleteSound();
      } else {
        errorCount++;
        streak = 0;
        playErrorSound();
      }
      setNextWord();
      updateMetrics();
    }
  });

  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', resumeGame);
  pauseRestartBtn.addEventListener('click', startGame);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      togglePause();
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  });
})();

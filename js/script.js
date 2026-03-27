  <script>
    // ======================== GAME STATE ========================
    let currentDifficulty = 'easy';
    const levelOrder = ['easy', 'medium', 'hard'];
    let currentLevelIndex = 0;

    let cardsArray = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let moves = 0;
    let timerInterval = null;
    let secondsElapsed = 0;
    let matchedCount = 0;
    let totalPairs = 0;
    let gameActive = true;

    // DOM elements
    const gameBoard = document.getElementById("game-board");
    const movesSpan = document.getElementById("moves");
    const timeSpan = document.getElementById("time");
    const restartBtn = document.getElementById("restartBtn");
    const winModal = document.getElementById("win-modal");
    const victoryModal = document.getElementById("victory-modal");
    const nextLevelBtn = document.getElementById("nextLevelBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const finalMovesSpan = document.getElementById("finalMovesSpan");
    const finalTimeSpan = document.getElementById("finalTimeSpan");
    const nextLevelInfo = document.getElementById("nextLevelInfo");
    const levelIndicatorSpan = document.getElementById("levelIndicator");
    const fullResetBtn = document.getElementById("fullResetBtn");
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const pairsMatchedSpan = document.getElementById("pairsMatched");
    const totalPairsSpan = document.getElementById("totalPairsSpan");
    const diffBtns = document.querySelectorAll("[data-diff]");
    const toastMsg = document.getElementById("toastMsg");

    function showToast(message, duration = 1800) {
      toastMsg.textContent = message;
      toastMsg.classList.remove("opacity-0");
      toastMsg.classList.add("opacity-100");
      setTimeout(() => {
        toastMsg.classList.remove("opacity-100");
        toastMsg.classList.add("opacity-0");
      }, duration);
    }

    const difficultyConfig = {
      easy: { rows: 3, cols: 4, totalCards: 12, pairs: 6, gridClass: "grid-easy" },
      medium: { rows: 4, cols: 4, totalCards: 16, pairs: 8, gridClass: "grid-medium" },
      hard: { rows: 4, cols: 6, totalCards: 24, pairs: 12, gridClass: "grid-hard" }
    };

    const emojiLibrary = [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
      "🐸", "🐵", "🐔", "🐧", "🐦", "🐴", "🦋", "🐝", "🐳", "🐬", "🦄", "🐙",
      "🍎", "🍒", "🍉", "🍕", "⚽", "🏀", "🎈", "🚀", "🌈", "⭐", "❄️", "🎵", "💎", "🔮"
    ];

    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function generateCardData() {
      const cfg = difficultyConfig[currentDifficulty];
      const neededPairs = cfg.pairs;
      let shuffledLib = [...emojiLibrary];
      shuffledLib = shuffleArray(shuffledLib);
      const selectedEmojis = shuffledLib.slice(0, neededPairs);
      let deck = [...selectedEmojis, ...selectedEmojis];
      deck = shuffleArray(deck);
      return deck;
    }

    function updatePairCounter() {
      pairsMatchedSpan.textContent = matchedCount;
      totalPairsSpan.textContent = totalPairs;
    }

    function buildBoard() {
      gameBoard.innerHTML = "";
      const cfg = difficultyConfig[currentDifficulty];
      const deck = generateCardData();
      totalPairs = cfg.pairs;
      matchedCount = 0;
      moves = 0;
      secondsElapsed = 0;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      movesSpan.textContent = moves;
      timeSpan.textContent = "0s";
      updatePairCounter();
      hasFlippedCard = false;
      lockBoard = false;
      firstCard = secondCard = null;
      gameActive = true;

      gameBoard.className = `game-grid ${cfg.gridClass}`;
      cardsArray = [];

      deck.forEach((emoji, idx) => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.setAttribute("data-idx", idx);
        cardDiv.setAttribute("data-emoji", emoji);

        const inner = document.createElement("div");
        inner.classList.add("card-inner");
        inner.innerHTML = `
          <div class="card-front">${emoji}</div>
          <div class="card-back"><i class="fas fa-question-circle text-3xl text-indigo-300"></i></div>
        `;
        cardDiv.appendChild(inner);
        cardDiv.addEventListener("click", () => handleCardClick(cardDiv));
        gameBoard.appendChild(cardDiv);
        cardsArray.push(cardDiv);
      });

      levelIndicatorSpan.textContent = `${currentLevelIndex + 1}/${levelOrder.length}`;
    }

    function startTimerIfNeeded() {
      if (!timerInterval && gameActive && moves === 0) {
        timerInterval = setInterval(() => {
          if (gameActive) {
            secondsElapsed++;
            timeSpan.textContent = `${secondsElapsed}s`;
          }
        }, 1000);
      }
    }

    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function resetBoardState() {
      hasFlippedCard = false;
      firstCard = null;
      secondCard = null;
    }

    function handleCardClick(card) {
      if (lockBoard || !gameActive) return;
      if (card.classList.contains("matched")) return;
      if (card.classList.contains("flipped") && hasFlippedCard && firstCard === card) return;

      startTimerIfNeeded();

      if (!hasFlippedCard) {
        card.classList.add("flipped");
        hasFlippedCard = true;
        firstCard = card;
        return;
      }

      secondCard = card;
      card.classList.add("flipped");
      moves++;
      movesSpan.textContent = moves;

      const emoji1 = firstCard.getAttribute("data-emoji");
      const emoji2 = secondCard.getAttribute("data-emoji");
      const isMatch = (emoji1 === emoji2);

      if (isMatch) {
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");
        matchedCount++;
        updatePairCounter();
        resetBoardState();

        if (matchedCount === totalPairs) {
          levelComplete();
        }
      } else {
        lockBoard = true;
        setTimeout(() => {
          if (firstCard) firstCard.classList.remove("flipped");
          if (secondCard) secondCard.classList.remove("flipped");
          resetBoardState();
          lockBoard = false;
        }, 750);
      }
    }

    function levelComplete() {
      if (!gameActive) return;
      gameActive = false;
      stopTimer();
      finalMovesSpan.textContent = moves;
      finalTimeSpan.textContent = `${secondsElapsed}s`;

      const isLastLevel = (currentLevelIndex === levelOrder.length - 1);
      if (isLastLevel) {
        nextLevelInfo.innerHTML = "🌟 Legendary! You've dominated every mode! 🌟<br>Claim your final trophy!";
        nextLevelBtn.innerHTML = '<i class="fas fa-crown mr-2"></i> Claim Victory';
      } else {
        const nextLevelName = levelOrder[currentLevelIndex + 1].toUpperCase();
        const nextPairs = difficultyConfig[levelOrder[currentLevelIndex + 1]].pairs;
        nextLevelInfo.innerHTML = `🎉 Incredible! Next: <strong>${nextLevelName}</strong> mode with <strong>${nextPairs} pairs</strong>! 🚀`;
        nextLevelBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Advance to Next Level';
      }
      winModal.classList.remove("hidden");
    }

    function goToNextLevel() {
      winModal.classList.add("hidden");
      if (currentLevelIndex === levelOrder.length - 1) {
        victoryModal.classList.remove("hidden");
        return;
      }
      currentLevelIndex++;
      currentDifficulty = levelOrder[currentLevelIndex];
      updateDifficultyButtonActive(currentDifficulty);
      resetGameStateForNewLevel();
      buildBoard();
      showToast(`✨ Moving to ${currentDifficulty.toUpperCase()} mode! Good luck! ✨`, 2000);
    }

    function resetGameStateForNewLevel() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      hasFlippedCard = false;
      lockBoard = false;
      firstCard = null;
      secondCard = null;
      gameActive = true;
    }

    function restartCurrentLevel() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      hasFlippedCard = false;
      lockBoard = false;
      firstCard = secondCard = null;
      gameActive = true;
      buildBoard();
      winModal.classList.add("hidden");
      victoryModal.classList.add("hidden");
      showToast("🔄 Level restarted! Keep going!", 1500);
    }

    function fullGameReset() {
      currentLevelIndex = 0;
      currentDifficulty = levelOrder[0];
      updateDifficultyButtonActive(currentDifficulty);
      resetGameStateForNewLevel();
      buildBoard();
      victoryModal.classList.add("hidden");
      winModal.classList.add("hidden");
      showToast("🌟 Fresh journey! Starting from Easy mode 🌟", 1800);
    }

    function updateDifficultyButtonActive(diff) {
      diffBtns.forEach(btn => {
        const val = btn.getAttribute("data-diff");
        if (val === diff) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    }

    function setDifficultyAndReset(diff) {
      if (diff === currentDifficulty && currentLevelIndex === levelOrder.indexOf(diff)) {
        restartCurrentLevel();
        return;
      }
      currentDifficulty = diff;
      currentLevelIndex = levelOrder.indexOf(diff);
      if (currentLevelIndex === -1) currentLevelIndex = 0;
      updateDifficultyButtonActive(currentDifficulty);
      resetGameStateForNewLevel();
      buildBoard();
      winModal.classList.add("hidden");
      victoryModal.classList.add("hidden");
      showToast(`🎮 Switched to ${diff.toUpperCase()} mode. New challenge!`, 1800);
    }

    // Theme management
    function initTheme() {
      const isDark = localStorage.getItem("memoryTheme") === "dark";
      if (isDark) {
        document.body.classList.add("dark-mode");
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
      } else {
        document.body.classList.remove("dark-mode");
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
      }
    }

    function toggleTheme() {
      if (document.body.classList.contains("dark-mode")) {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("memoryTheme", "light");
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
        showToast("☀️ Light mode activated", 1000);
      } else {
        document.body.classList.add("dark-mode");
        localStorage.setItem("memoryTheme", "dark");
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
        showToast("🌙 Dark mode activated", 1000);
      }
    }

    // Event Listeners
    restartBtn.addEventListener("click", () => restartCurrentLevel());
    nextLevelBtn.addEventListener("click", () => goToNextLevel());
    cancelModalBtn.addEventListener("click", () => winModal.classList.add("hidden"));
    fullResetBtn.addEventListener("click", () => fullGameReset());
    themeToggle.addEventListener("click", toggleTheme);

    diffBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const diff = btn.getAttribute("data-diff");
        setDifficultyAndReset(diff);
      });
    });

    // Initialize
    initTheme();
    currentLevelIndex = 0;
    currentDifficulty = 'easy';
    updateDifficultyButtonActive('easy');
    buildBoard();
  </script>
<script src="js/script.js">

    // ---------- GAME STATE ----------
    let currentDifficulty = 'easy';    // 'easy', 'medium', 'hard'
    let levelOrder = ['easy', 'medium', 'hard'];
    let currentLevelIndex = 0;          // 0->easy, 1->medium, 2->hard

    // Game dynamic vars
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

    // DOM Elements
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

    // Difficulty buttons
    const diffBtns = document.querySelectorAll("[data-diff]");

    // ----- Difficulty Config: grid size & emoji pool -----
    const difficultyConfig = {
      easy: { rows: 3, cols: 4, totalCards: 12, pairs: 6, gridClass: "grid-easy" },
      medium: { rows: 4, cols: 4, totalCards: 16, pairs: 8, gridClass: "grid-medium" },
      hard: { rows: 4, cols: 6, totalCards: 24, pairs: 12, gridClass: "grid-hard" }
    };

    // Rich emoji set for variety
    const emojiLibrary = [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
      "🐸", "🐵", "🐔", "🐧", "🐦", "🐴", "🦋", "🐝", "🐳", "🐬", "🦄", "🐙",
      "🍎", "🍒", "🍉", "🍕", "⚽", "🏀", "🎈", "🚀", "🌈", "⭐", "❄️", "🎵"
    ];

    // Helper: shuffle array (Fisher-Yates)
    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Generate card data based on current difficulty
    function generateCardData() {
      const cfg = difficultyConfig[currentDifficulty];
      const neededPairs = cfg.pairs;
      // pick random unique emojis from library
      let shuffledLib = [...emojiLibrary];
      shuffledLib = shuffleArray(shuffledLib);
      const selectedEmojis = shuffledLib.slice(0, neededPairs);
      // duplicate for pairs
      let deck = [...selectedEmojis, ...selectedEmojis];
      deck = shuffleArray(deck);
      return deck;
    }

    // Render game board from scratch
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
      hasFlippedCard = false;
      lockBoard = false;
      firstCard = secondCard = null;
      gameActive = true;

      // apply grid classes
      gameBoard.className = `game-grid ${cfg.gridClass}`;

      // create card elements
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
          <div class="card-back"><i class="fas fa-question text-3xl text-gray-400"></i></div>
        `;
        cardDiv.appendChild(inner);
        cardDiv.addEventListener("click", () => handleCardClick(cardDiv));
        gameBoard.appendChild(cardDiv);
        cardsArray.push(cardDiv);
      });

      // update level text
      levelIndicatorSpan.textContent = `${currentLevelIndex + 1}/${levelOrder.length}`;
    }

    // Timer start on first move
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

    function handleCardClick(card) {
      // ignore if board locked, already matched, already flipped same card, or game inactive
      if (lockBoard || !gameActive) return;
      if (card.classList.contains("matched")) return;
      if (card.classList.contains("flipped") && hasFlippedCard && firstCard === card) return;

      // start timer on first interaction
      startTimerIfNeeded();

      // first flip
      if (!hasFlippedCard) {
        card.classList.add("flipped");
        hasFlippedCard = true;
        firstCard = card;
        return;
      }

      // second card (different)
      secondCard = card;
      card.classList.add("flipped");
      moves++;
      movesSpan.textContent = moves;

      // check match
      const emoji1 = firstCard.getAttribute("data-emoji");
      const emoji2 = secondCard.getAttribute("data-emoji");
      const isMatch = (emoji1 === emoji2);

      if (isMatch) {
        // matched
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");
        // remove click listener implicitly by class check, but we keep event but matched class prevents re-flip
        matchedCount++;
        resetBoardState();

        // check level completion
        if (matchedCount === totalPairs) {
          levelComplete();
        }
      } else {
        // no match: lock board, flip back after delay
        lockBoard = true;
        setTimeout(() => {
          if (firstCard) firstCard.classList.remove("flipped");
          if (secondCard) secondCard.classList.remove("flipped");
          resetBoardState();
          lockBoard = false;
        }, 800);
      }
    }

    function resetBoardState() {
      hasFlippedCard = false;
      firstCard = null;
      secondCard = null;
    }

    function levelComplete() {
      // stop timer, show modal
      if (!gameActive) return;
      gameActive = false;
      stopTimer();

      // Show win modal with progression
      finalMovesSpan.textContent = moves;
      finalTimeSpan.textContent = `${secondsElapsed}s`;

      // determine if there is next level
      const isLastLevel = (currentLevelIndex === levelOrder.length - 1);
      if (isLastLevel) {
        nextLevelInfo.innerHTML = "✨ You've mastered every difficulty! ✨<br>Complete victory awaits!";
        nextLevelBtn.innerHTML = '<i class="fas fa-crown mr-2"></i> Claim Victory';
      } else {
        const nextLevelName = levelOrder[currentLevelIndex + 1].toUpperCase();
        nextLevelInfo.innerHTML = `🏆 Amazing! Next: <strong>${nextLevelName}</strong> mode with more cards! 🚀`;
        nextLevelBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Advance to Next Level';
      }
      winModal.classList.remove("hidden");
    }

    // Proceed to next difficulty
    function goToNextLevel() {
      winModal.classList.add("hidden");
      // check if final level completed
      if (currentLevelIndex === levelOrder.length - 1) {
        // VICTORY all levels done!
        victoryModal.classList.remove("hidden");
        return;
      }
      // move to next level
      currentLevelIndex++;
      currentDifficulty = levelOrder[currentLevelIndex];
      updateDifficultyButtonActive(currentDifficulty);
      // reset game fully
      resetGameStateForNewLevel();
      buildBoard();
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

    // Restart current level (same difficulty)
    function restartCurrentLevel() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      hasFlippedCard = false;
      lockBoard = false;
      firstCard = secondCard = null;
      gameActive = true;
      buildBoard();  // fresh board with same difficulty
      // close modals if any
      winModal.classList.add("hidden");
      victoryModal.classList.add("hidden");
    }

    // Full reset from easy (start over)
    function fullGameReset() {
      // reset progression
      currentLevelIndex = 0;
      currentDifficulty = levelOrder[0];
      updateDifficultyButtonActive(currentDifficulty);
      resetGameStateForNewLevel();
      buildBoard();
      victoryModal.classList.add("hidden");
      winModal.classList.add("hidden");
    }

    // update UI active style on difficulty buttons
    function updateDifficultyButtonActive(diff) {
      diffBtns.forEach(btn => {
        const val = btn.getAttribute("data-diff");
        if (val === diff) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    // Manual difficulty change via buttons (only allowed if game not in progress? We'll allow restart but reset progression)
    function setDifficultyAndReset(diff) {
      if (diff === currentDifficulty && currentLevelIndex === levelOrder.indexOf(diff)) {
        restartCurrentLevel();
        return;
      }
      // change difficulty manually resets progression to that level only (new journey)
      currentDifficulty = diff;
      currentLevelIndex = levelOrder.indexOf(diff);
      if (currentLevelIndex === -1) currentLevelIndex = 0;
      updateDifficultyButtonActive(currentDifficulty);
      resetGameStateForNewLevel();
      buildBoard();
      // close any open modals
      winModal.classList.add("hidden");
      victoryModal.classList.add("hidden");
    }

    // Light/Dark mode toggle with persistence & dynamic icons
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
      } else {
        document.body.classList.add("dark-mode");
        localStorage.setItem("memoryTheme", "dark");
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
      }
    }

    // Event Listeners
    restartBtn.addEventListener("click", () => {
      restartCurrentLevel();
    });

    nextLevelBtn.addEventListener("click", () => {
      goToNextLevel();
    });

    cancelModalBtn.addEventListener("click", () => {
      winModal.classList.add("hidden");
      // game stays completed, but user might restart manually
    });

    fullResetBtn.addEventListener("click", () => {
      fullGameReset();
    });

    diffBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const diff = btn.getAttribute("data-diff");
        setDifficultyAndReset(diff);
      });
    });

    themeToggle.addEventListener("click", toggleTheme);

    // initial setup
    initTheme();
    currentLevelIndex = 0;
    currentDifficulty = 'easy';
    updateDifficultyButtonActive('easy');
    buildBoard();

    // Edge: prevent double modal when finish and also ensure progression doesn't glitch
    window.addEventListener('load', () => {
      // extra responsive fix: ensure grid fits
    });

  </script>
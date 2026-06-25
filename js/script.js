
    (function(){
      "use strict";
      // ----- 10 LEVELS -----
      const levelOrder = [0,1,2,3,4,5,6,7,8,9];
      const levelConfig = [
        { rows:2, cols:3, pairs:3, gridClass:'grid-lvl-0', label:'Level 1', icon:'🌟' },
        { rows:3, cols:3, pairs:4, gridClass:'grid-lvl-1', label:'Level 2', icon:'⚡' },
        { rows:3, cols:4, pairs:6, gridClass:'grid-lvl-2', label:'Level 3', icon:'🔥' },
        { rows:4, cols:4, pairs:8, gridClass:'grid-lvl-3', label:'Level 4', icon:'🌀' },
        { rows:4, cols:4, pairs:8, gridClass:'grid-lvl-4', label:'Level 5', icon:'💎' },
        { rows:4, cols:5, pairs:10, gridClass:'grid-lvl-5', label:'Level 6', icon:'🌊' },
        { rows:4, cols:5, pairs:10, gridClass:'grid-lvl-6', label:'Level 7', icon:'🌙' },
        { rows:4, cols:6, pairs:12, gridClass:'grid-lvl-7', label:'Level 8', icon:'⭐' },
        { rows:5, cols:6, pairs:15, gridClass:'grid-lvl-8', label:'Level 9', icon:'👑' },
        { rows:6, cols:6, pairs:18, gridClass:'grid-lvl-9', label:'Level 10', icon:'🏆' }
      ];

      let currentLevelIndex = 0;
      let currentDifficulty = 0;
      let cardsArray = [];
      let hasFlippedCard = false, lockBoard = false, firstCard = null, secondCard = null;
      let moves = 0, secondsElapsed = 0, matchedCount = 0, totalPairs = 0;
      let timerInterval = null, gameActive = true;

      // DOM refs
      const board = document.getElementById('game-board');
      const movesSpan = document.getElementById('moves');
      const timeSpan = document.getElementById('time');
      const restartBtn = document.getElementById('restartBtn');
      const winModal = document.getElementById('win-modal');
      const victoryModal = document.getElementById('victory-modal');
      const nextBtn = document.getElementById('nextLevelBtn');
      const cancelBtn = document.getElementById('cancelModalBtn');
      const finalMoves = document.getElementById('finalMovesSpan');
      const finalTime = document.getElementById('finalTimeSpan');
      const nextInfo = document.getElementById('nextLevelInfo');
      const levelInd = document.getElementById('levelIndicator');
      const fullResetBtn = document.getElementById('fullResetBtn');
      const themeToggle = document.getElementById('themeToggle');
      const themeIcon = document.getElementById('themeIcon');
      const pairsMatched = document.getElementById('pairsMatched');
      const totalPairsSpan = document.getElementById('totalPairsSpan');
      const diffBtns = document.querySelectorAll('[data-diff]');
      const toast = document.getElementById('toastMsg');
      const levelDots = document.getElementById('levelDots');

      function showToast(msg, dur=1600) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._hide);
        toast._hide = setTimeout(() => toast.classList.remove('show'), dur);
      }

      // ----- ICON LIBRARY (Font Awesome) -----
      const iconSet = [
        'fa-dragon', 'fa-cat', 'fa-dog', 'fa-fish', 'fa-crow', 'fa-hippo', 'fa-otter', 'fa-spider',
        'fa-crown', 'fa-gem', 'fa-meteor', 'fa-moon', 'fa-sun', 'fa-cloud', 'fa-bolt', 'fa-snowflake',
        'fa-heart', 'fa-star', 'fa-fire', 'fa-water', 'fa-leaf', 'fa-tree', 'fa-seedling', 'fa-feather',
        'fa-guitar', 'fa-drum', 'fa-music', 'fa-headphones', 'fa-microphone', 'fa-cloud-moon',
        'fa-car', 'fa-plane', 'fa-rocket', 'fa-ship', 'fa-submarine', 'fa-bicycle', 'fa-tractor',
        'fa-robot', 'fa-gamepad', 'fa-dice', 'fa-puzzle-piece', 'fa-chess-queen', 'fa-chess-knight',
        'fa-wand-sparkles', 'fa-hat-wizard', 'fa-skull', 'fa-ghost', 'fa-campground', 'fa-frog',
        'fa-lion', 'fa-monkey', 'fa-paw', 'fa-rainbow', 'fa-feather-pointed', 'fa-umbrella',
        'fa-mask', 'fa-ghost', 'fa-hat-cowboy', 'fa-horse', 'fa-dove', 'fa-kiwi-bird'
      ];

      function shuffle(a){ for(let i=a.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

      function generateDeck(){
        const needed = levelConfig[currentDifficulty].pairs;
        let pool = shuffle([...iconSet]).slice(0, needed);
        let deck = shuffle([...pool, ...pool]);
        return deck;
      }

      function updatePairCounter(){ pairsMatched.textContent = matchedCount; totalPairsSpan.textContent = totalPairs; }

      function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

      function resetBoardState(){ hasFlippedCard=false; firstCard=null; secondCard=null; }

      function updateLevelDots() {
        levelDots.innerHTML = '';
        for(let i=0; i<levelOrder.length; i++) {
          const dot = document.createElement('span');
          dot.className = 'level-dot';
          if(i === currentLevelIndex) dot.classList.add('active');
          else if(i < currentLevelIndex) dot.classList.add('done');
          levelDots.appendChild(dot);
        }
      }

      function buildBoard(){
        board.innerHTML = '';
        const cfg = levelConfig[currentDifficulty];
        const deck = generateDeck();
        totalPairs = cfg.pairs; matchedCount=0; moves=0; secondsElapsed=0;
        stopTimer(); timerInterval=null;
        movesSpan.textContent='0'; timeSpan.textContent='0s'; updatePairCounter();
        hasFlippedCard=false; lockBoard=false; firstCard=secondCard=null; gameActive=true;

        board.className = `game-grid ${cfg.gridClass}`;
        cardsArray = [];
        deck.forEach((iconClass, idx) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.dataset.idx = idx;
          card.dataset.icon = iconClass;
          const inner = document.createElement('div');
          inner.className = 'card-inner';
          inner.innerHTML = `<div class="card-front"><i class="fas ${iconClass}"></i></div><div class="card-back"><i class="fas fa-question-circle"></i></div>`;
          card.appendChild(inner);
          card.addEventListener('click', ()=> handleCardClick(card));
          board.appendChild(card);
          cardsArray.push(card);
        });
        levelInd.textContent = `${currentLevelIndex+1}/${levelOrder.length}`;
        updateLevelDots();
      }

      function startTimerIfNeeded(){
        if(!timerInterval && gameActive && moves===0){
          timerInterval = setInterval(()=>{
            if(gameActive){ secondsElapsed++; timeSpan.textContent = secondsElapsed+'s'; }
          },1000);
        }
      }

      function handleCardClick(card){
        if(lockBoard || !gameActive) return;
        if(card.classList.contains('matched') || card.classList.contains('flipped')) return;
        startTimerIfNeeded();

        if(!hasFlippedCard){
          card.classList.add('flipped');
          hasFlippedCard = true;
          firstCard = card;
          return;
        }
        secondCard = card;
        card.classList.add('flipped');
        moves++;
        movesSpan.textContent = moves;

        const match = firstCard.dataset.icon === secondCard.dataset.icon;
        if(match){
          firstCard.classList.add('matched'); secondCard.classList.add('matched');
          matchedCount++; updatePairCounter();
          resetBoardState();
          if(matchedCount === totalPairs) levelComplete();
        } else {
          lockBoard = true;
          setTimeout(()=>{
            if(firstCard) firstCard.classList.remove('flipped');
            if(secondCard) secondCard.classList.remove('flipped');
            resetBoardState();
            lockBoard = false;
          },750);
        }
      }

      function levelComplete(){
        if(!gameActive) return;
        gameActive = false; stopTimer();
        finalMoves.textContent = moves;
        finalTime.textContent = secondsElapsed+'s';
        const last = currentLevelIndex === levelOrder.length-1;
        if(last){
          nextInfo.innerHTML = '🌟 Legendary! You\'ve dominated all 10 levels! 🌟<br>Claim your ultimate trophy!';
          nextBtn.innerHTML = '<i class="fas fa-crown mr-2"></i> Claim Victory';
        } else {
          const nextLevel = levelConfig[currentLevelIndex+1];
          nextInfo.innerHTML = `🎉 Amazing! Next: <strong>${nextLevel.icon} ${nextLevel.label}</strong> with <strong>${nextLevel.pairs} pairs</strong>! 🚀`;
          nextBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Advance to Next Level';
        }
        winModal.classList.remove('hidden');
      }

      function goToNextLevel(){
        winModal.classList.add('hidden');
        if(currentLevelIndex === levelOrder.length-1){ victoryModal.classList.remove('hidden'); return; }
        currentLevelIndex++;
        currentDifficulty = levelOrder[currentLevelIndex];
        updateDiffActive(currentDifficulty);
        resetGameStateForNewLevel();
        buildBoard();
        showToast(`✨ ${levelConfig[currentDifficulty].icon} ${levelConfig[currentDifficulty].label}!`, 1600);
      }

      function resetGameStateForNewLevel(){ stopTimer(); timerInterval=null; hasFlippedCard=false; lockBoard=false; firstCard=null; secondCard=null; gameActive=true; }

      function restartCurrentLevel(){ stopTimer(); timerInterval=null; hasFlippedCard=false; lockBoard=false; firstCard=secondCard=null; gameActive=true; buildBoard(); winModal.classList.add('hidden'); victoryModal.classList.add('hidden'); showToast('🔄 Level restarted!', 1200); }

      function fullGameReset(){ currentLevelIndex=0; currentDifficulty=levelOrder[0]; updateDiffActive(currentDifficulty); resetGameStateForNewLevel(); buildBoard(); victoryModal.classList.add('hidden'); winModal.classList.add('hidden'); showToast('🌟 Fresh journey! Starting from Level 1 🌟',1600); }

      function updateDiffActive(diff){ diffBtns.forEach(b=>{ const v=parseInt(b.dataset.diff); if(v===diff) b.classList.add('active'); else b.classList.remove('active'); }); }

      function setDifficultyAndReset(diff){
        if(diff===currentDifficulty && currentLevelIndex===levelOrder.indexOf(diff)){ restartCurrentLevel(); return; }
        currentDifficulty=diff; currentLevelIndex=levelOrder.indexOf(diff); if(currentLevelIndex<0) currentLevelIndex=0;
        updateDiffActive(currentDifficulty);
        resetGameStateForNewLevel();
        buildBoard();
        winModal.classList.add('hidden'); victoryModal.classList.add('hidden');
        showToast(`🎮 Switched to ${levelConfig[currentDifficulty].label}.`, 1500);
      }

      // theme
      function initTheme(){ const dark = localStorage.getItem('memoryTheme')==='dark'; document.body.classList.toggle('dark-mode', dark); themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon'; }
      function toggleTheme(){ const dark = document.body.classList.toggle('dark-mode'); localStorage.setItem('memoryTheme', dark?'dark':'light'); themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon'; showToast(dark?'🌙 Dark mode':'☀️ Light mode',1000); }

      // event listeners
      restartBtn.addEventListener('click', restartCurrentLevel);
      nextBtn.addEventListener('click', goToNextLevel);
      cancelBtn.addEventListener('click', ()=> winModal.classList.add('hidden'));
      fullResetBtn.addEventListener('click', fullGameReset);
      themeToggle.addEventListener('click', toggleTheme);
      diffBtns.forEach(b=> b.addEventListener('click', ()=> setDifficultyAndReset(parseInt(b.dataset.diff))));

      // init
      initTheme();
      currentLevelIndex=0; currentDifficulty=levelOrder[0]; updateDiffActive(currentDifficulty); buildBoard();
    })();
  
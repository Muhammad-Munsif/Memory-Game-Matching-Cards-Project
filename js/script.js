

(function () {
    "use strict";

    // ----- DIFFICULTIES -----
    const difficulties = {
        easy: { label: 'Easy', icon: '🌱', basePairs: 3, levelMultiplier: 1.5 },
        medium: { label: 'Medium', icon: '⚡', basePairs: 4, levelMultiplier: 1.8 },
        hard: { label: 'Hard', icon: '🔥', basePairs: 5, levelMultiplier: 2.0 }
    };

    const levelOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    function generateLevelConfigs(diffKey) {
        const diff = difficulties[diffKey];
        const configs = [];
        for (let i = 0; i < 10; i++) {
            const pairs = Math.round(diff.basePairs + (i * diff.levelMultiplier));
            configs.push({
                pairs: pairs,
                label: `Level ${i + 1}`,
                icon: ['🌟', '⚡', '🔥', '🌀', '💎', '🌊', '🌙', '⭐', '👑', '🏆'][i]
            });
        }
        return configs;
    }

    let currentDifficulty = 'easy';
    let currentLevelIndex = 0;
    let levelConfigs = generateLevelConfigs('easy');
    let cardsArray = [];
    let hasFlippedCard = false,
        lockBoard = false,
        firstCard = null,
        secondCard = null;
    let moves = 0,
        secondsElapsed = 0,
        matchedCount = 0,
        totalPairs = 0;
    let timerInterval = null,
        gameActive = true;
    let soundEnabled = true;
    let levelStars = [];

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
    const difficultyLabel = document.getElementById('difficultyLabel');
    const fullResetBtn = document.getElementById('fullResetBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const pairsMatched = document.getElementById('pairsMatched');
    const totalPairsSpan = document.getElementById('totalPairsSpan');
    const toast = document.getElementById('toastMsg');
    const levelDots = document.getElementById('levelDots');
    const starRating = document.getElementById('starRating');
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownContent = document.getElementById('dropdownContent');
    const selectedDifficultyLabel = document.getElementById('selectedDifficultyLabel');
    const sidebarLevels = document.getElementById('sidebarLevels');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    // ----- Sound Effects -----
    function playSound(type) {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.1;
            if (type === 'flip') {
                osc.frequency.value = 600;
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'match') {
                osc.frequency.value = 880;
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = 1100;
                    osc2.type = 'sine';
                    gain2.gain.value = 0.08;
                    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.15);
                }, 150);
            } else if (type === 'mismatch') {
                osc.frequency.value = 300;
                osc.type = 'sawtooth';
                gain.gain.value = 0.05;
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'complete') {
                [523, 659, 784, 1047].forEach((freq, i) => {
                    setTimeout(() => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.connect(g);
                        g.connect(ctx.destination);
                        o.frequency.value = freq;
                        o.type = 'sine';
                        g.gain.value = 0.08;
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                        o.start(ctx.currentTime);
                        o.stop(ctx.currentTime + 0.2);
                    }, i * 120);
                });
            } else if (type === 'victory') {
                [523, 587, 659, 784, 880, 988, 1047].forEach((freq, i) => {
                    setTimeout(() => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.connect(g);
                        g.connect(ctx.destination);
                        o.frequency.value = freq;
                        o.type = 'sine';
                        g.gain.value = 0.08;
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                        o.start(ctx.currentTime);
                        o.stop(ctx.currentTime + 0.25);
                    }, i * 100);
                });
            }
        } catch (e) { /* silent */ }
    }

    function showToast(msg, dur = 1600) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._hide);
        toast._hide = setTimeout(() => toast.classList.remove('show'), dur);
    }

    // ----- ICON LIBRARY -----
    const iconSet = [
        'fa-dragon', 'fa-cat', 'fa-dog', 'fa-fish', 'fa-crow', 'fa-hippo', 'fa-otter', 'fa-spider',
        'fa-crown', 'fa-gem', 'fa-meteor', 'fa-moon', 'fa-sun', 'fa-cloud', 'fa-bolt', 'fa-snowflake',
        'fa-heart', 'fa-star', 'fa-fire', 'fa-water', 'fa-leaf', 'fa-tree', 'fa-seedling', 'fa-feather',
        'fa-guitar', 'fa-drum', 'fa-music', 'fa-headphones', 'fa-microphone', 'fa-cloud-moon',
        'fa-car', 'fa-plane', 'fa-rocket', 'fa-ship', 'fa-submarine', 'fa-bicycle', 'fa-tractor',
        'fa-robot', 'fa-gamepad', 'fa-dice', 'fa-puzzle-piece', 'fa-chess-queen', 'fa-chess-knight',
        'fa-wand-sparkles', 'fa-hat-wizard', 'fa-skull', 'fa-ghost', 'fa-campground', 'fa-frog',
        'fa-lion', 'fa-monkey', 'fa-paw', 'fa-rainbow', 'fa-feather-pointed', 'fa-umbrella',
        'fa-mask', 'fa-hat-cowboy', 'fa-horse', 'fa-dove', 'fa-kiwi-bird', 'fa-pen-fancy'
    ];

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

    function generateDeck() {
        const needed = levelConfigs[currentLevelIndex].pairs;
        let pool = shuffle([...iconSet]).slice(0, needed);
        let deck = shuffle([...pool, ...pool]);
        // Ensure even number for grid
        while (deck.length < 12) {
            deck.push(deck[0]);
        }
        return deck;
    }

    function updatePairCounter() {
        pairsMatched.textContent = matchedCount;
        totalPairsSpan.textContent = totalPairs;
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

    function updateLevelDots() {
        levelDots.innerHTML = '';
        for (let i = 0; i < levelOrder.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'level-dot';
            if (i === currentLevelIndex) dot.classList.add('active');
            else if (i < currentLevelIndex) dot.classList.add('done');
            levelDots.appendChild(dot);
        }
    }

    function updateSidebar() {
        sidebarLevels.innerHTML = '';
        for (let i = 0; i < levelConfigs.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'sidebar-btn';
            if (i === currentLevelIndex) btn.classList.add('active');
            const star = levelStars[i] ? '⭐'.repeat(levelStars[i]) : '☆';
            btn.innerHTML = `${i + 1}. ${levelConfigs[i].icon} <span class="star-indicator">${star}</span>`;
            btn.addEventListener('click', () => goToLevel(i));
            sidebarLevels.appendChild(btn);
        }
    }

    function calculateStars(moves, pairs) {
        const optimalMoves = pairs * 2;
        const ratio = moves / optimalMoves;
        if (ratio <= 1.2) return 3;
        if (ratio <= 1.8) return 2;
        return 1;
    }

    function updateStarRating(stars) {
        starRating.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('i');
            star.className = i < stars ? 'fas fa-star filled' : 'fas fa-star empty';
            starRating.appendChild(star);
        }
    }

    function buildBoard() {
        board.innerHTML = '';
        const cfg = levelConfigs[currentLevelIndex];
        const deck = generateDeck();
        totalPairs = cfg.pairs;
        // Ensure we have at least 6 pairs for 6 columns
        while (totalPairs < 6) {
            totalPairs = Math.min(totalPairs + 1, 12);
        }
        matchedCount = 0;
        moves = 0;
        secondsElapsed = 0;
        stopTimer();
        timerInterval = null;
        movesSpan.textContent = '0';
        timeSpan.textContent = '0s';
        updatePairCounter();
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = secondCard = null;
        gameActive = true;

        // Always 6 columns
        board.className = 'game-grid';
        cardsArray = [];
        const displayDeck = deck.slice(0, totalPairs * 2);
        displayDeck.forEach((iconClass, idx) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.idx = idx;
            card.dataset.icon = iconClass;
            const inner = document.createElement('div');
            inner.className = 'card-inner';
            inner.innerHTML =
                `<div class="card-front"><i class="fas ${iconClass}"></i></div><div class="card-back"><i class="fas fa-question-circle"></i></div>`;
            card.appendChild(inner);
            card.addEventListener('click', () => handleCardClick(card));
            board.appendChild(card);
            cardsArray.push(card);
        });
        levelInd.textContent = `${currentLevelIndex + 1}/${levelOrder.length}`;
        updateLevelDots();
        updateSidebar();
    }

    function startTimerIfNeeded() {
        if (!timerInterval && gameActive && moves === 0) {
            timerInterval = setInterval(() => {
                if (gameActive) {
                    secondsElapsed++;
                    timeSpan.textContent = secondsElapsed + 's';
                }
            }, 1000);
        }
    }

    function handleCardClick(card) {
        if (lockBoard || !gameActive) return;
        if (card.classList.contains('matched') || card.classList.contains('flipped')) return;
        startTimerIfNeeded();
        playSound('flip');

        if (!hasFlippedCard) {
            card.classList.add('flipped');
            hasFlippedCard = true;
            firstCard = card;
            return;
        }
        secondCard = card;
        card.classList.add('flipped');
        moves++;
        movesSpan.textContent = moves;


(function () {
    "use strict";
    // ----- 10 LEVELS -----
    const levelOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const levelConfig = [
        { rows: 2, cols: 3, pairs: 3, gridClass: 'grid-lvl-0', label: 'Level 1', icon: '🌟' },
        { rows: 3, cols: 3, pairs: 4, gridClass: 'grid-lvl-1', label: 'Level 2', icon: '⚡' },
        { rows: 3, cols: 4, pairs: 6, gridClass: 'grid-lvl-2', label: 'Level 3', icon: '🔥' },
        { rows: 4, cols: 4, pairs: 8, gridClass: 'grid-lvl-3', label: 'Level 4', icon: '🌀' },
        { rows: 4, cols: 4, pairs: 8, gridClass: 'grid-lvl-4', label: 'Level 5', icon: '💎' },
        { rows: 4, cols: 5, pairs: 10, gridClass: 'grid-lvl-5', label: 'Level 6', icon: '🌊' },
        { rows: 4, cols: 5, pairs: 10, gridClass: 'grid-lvl-6', label: 'Level 7', icon: '🌙' },
        { rows: 4, cols: 6, pairs: 12, gridClass: 'grid-lvl-7', label: 'Level 8', icon: '⭐' },
        { rows: 5, cols: 6, pairs: 15, gridClass: 'grid-lvl-8', label: 'Level 9', icon: '👑' },
        { rows: 6, cols: 6, pairs: 18, gridClass: 'grid-lvl-9', label: 'Level 10', icon: '🏆' }
    ];

    let currentLevelIndex = 0;
    let currentDifficulty = 0;
    let cardsArray = [];
    let hasFlippedCard = false, lockBoard = false, firstCard = null, secondCard = null;
    let moves = 0, secondsElapsed = 0, matchedCount = 0, totalPairs = 0;
    let timerInterval = null, gameActive = true;
    let soundEnabled = true;

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
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const pairsMatched = document.getElementById('pairsMatched');
    const totalPairsSpan = document.getElementById('totalPairsSpan');
    const diffBtns = document.querySelectorAll('[data-diff]');
    const toast = document.getElementById('toastMsg');
    const levelDots = document.getElementById('levelDots');
    const starRating = document.getElementById('starRating');

    // ----- Sound Effects (Web Audio) -----
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
        } catch (e) { /* silent fallback */ }
    }

    function showToast(msg, dur = 1600) {
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
        'fa-mask', 'fa-hat-cowboy', 'fa-horse', 'fa-dove', 'fa-kiwi-bird', 'fa-pen-fancy'
    ];

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

    function generateDeck() {
        const needed = levelConfig[currentDifficulty].pairs;
        let pool = shuffle([...iconSet]).slice(0, needed);
        let deck = shuffle([...pool, ...pool]);
        return deck;
    }

    function updatePairCounter() { pairsMatched.textContent = matchedCount; totalPairsSpan.textContent = totalPairs; }

    function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

    function resetBoardState() { hasFlippedCard = false; firstCard = null; secondCard = null; }



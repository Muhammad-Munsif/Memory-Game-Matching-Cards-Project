
    <script>
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

                const match = firstCard.dataset.icon === secondCard.dataset.icon;
                if (match) {
                    playSound('match');
                    firstCard.classList.add('matched');
                    secondCard.classList.add('matched');
                    matchedCount++;
                    updatePairCounter();
                    resetBoardState();
                    if (matchedCount === totalPairs) levelComplete();
                } else {
                    playSound('mismatch');
                    lockBoard = true;
                    setTimeout(() => {
                        if (firstCard) firstCard.classList.remove('flipped');
                        if (secondCard) secondCard.classList.remove('flipped');
                        resetBoardState();
                        lockBoard = false;
                    }, 750);
                }
            }

            function levelComplete() {
                if (!gameActive) return;
                gameActive = false;
                stopTimer();
                playSound('complete');

                const stars = calculateStars(moves, totalPairs);
                levelStars[currentLevelIndex] = stars;
                updateStarRating(stars);

                finalMoves.textContent = moves;
                finalTime.textContent = secondsElapsed + 's';
                const last = currentLevelIndex === levelOrder.length - 1;
                if (last) {
                    nextInfo.innerHTML = '🌟 Legendary! You\'ve dominated all 10 levels! 🌟<br>Claim your ultimate trophy!';
                    nextBtn.innerHTML = '<i class="fas fa-crown mr-2"></i> Claim Victory';
                    playSound('victory');
                    createConfetti();
                } else {
                    const nextLevel = levelConfigs[currentLevelIndex + 1];
                    nextInfo.innerHTML =
                        `🎉 Amazing! Next: <strong>${nextLevel.icon} ${nextLevel.label}</strong> with <strong>${nextLevel.pairs} pairs</strong>! 🚀`;
                    nextBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Advance to Next Level';
                }
                winModal.classList.remove('hidden');
                updateSidebar();
            }

            function createConfetti() {
                const container = document.createElement('div');
                container.className = 'confetti-container';
                document.body.appendChild(container);
                const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#34d399', '#a855f7', '#ec4899', '#f97316'];
                for (let i = 0; i < 80; i++) {
                    const piece = document.createElement('div');
                    piece.className = 'confetti-piece';
                    piece.style.left = Math.random() * 100 + '%';
                    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
                    piece.style.width = (Math.random() * 8 + 4) + 'px';
                    piece.style.height = (Math.random() * 8 + 4) + 'px';
                    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
                    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
                    piece.style.animationDelay = (Math.random() * 2) + 's';
                    container.appendChild(piece);
                }
                setTimeout(() => container.remove(), 5000);
            }

            function goToNextLevel() {
                winModal.classList.add('hidden');
                if (currentLevelIndex === levelOrder.length - 1) {
                    victoryModal.classList.remove('hidden');
                    createConfetti();
                    playSound('victory');
                    return;
                }
                currentLevelIndex++;
                resetGameStateForNewLevel();
                buildBoard();
                showToast(`✨ ${levelConfigs[currentLevelIndex].icon} ${levelConfigs[currentLevelIndex].label}!`, 1600);
            }

            function resetGameStateForNewLevel() {
                stopTimer();
                timerInterval = null;
                hasFlippedCard = false;
                lockBoard = false;
                firstCard = null;
                secondCard = null;
                gameActive = true;
            }

            function restartCurrentLevel() {
                stopTimer();
                timerInterval = null;
                hasFlippedCard = false;
                lockBoard = false;
                firstCard = secondCard = null;
                gameActive = true;
                buildBoard();
                winModal.classList.add('hidden');
                victoryModal.classList.add('hidden');
                showToast('🔄 Level restarted!', 1200);
            }

            function fullGameReset() {
                currentLevelIndex = 0;
                levelStars = [];
                resetGameStateForNewLevel();
                buildBoard();
                victoryModal.classList.add('hidden');
                winModal.classList.add('hidden');
                showToast(`🌟 Fresh journey! Starting ${difficulties[currentDifficulty].label} Level 1 🌟`, 1600);
            }

            function changeDifficulty(diff) {
                if (diff === currentDifficulty && currentLevelIndex === 0) {
                    restartCurrentLevel();
                    return;
                }
                currentDifficulty = diff;
                levelConfigs = generateLevelConfigs(diff);
                levelStars = [];
                currentLevelIndex = 0;
                updateDifficultyButtons(diff);
                resetGameStateForNewLevel();
                buildBoard();
                winModal.classList.add('hidden');
                victoryModal.classList.add('hidden');
                showToast(`🎮 Switched to ${difficulties[diff].label} mode.`, 1500);
                dropdownContent.classList.remove('show');
            }

            function goToLevel(lvlIndex) {
                if (lvlIndex === currentLevelIndex) { restartCurrentLevel(); return; }
                currentLevelIndex = lvlIndex;
                resetGameStateForNewLevel();
                buildBoard();
                winModal.classList.add('hidden');
                victoryModal.classList.add('hidden');
                showToast(`📌 ${levelConfigs[lvlIndex].label}`, 1200);
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }

            function updateDifficultyButtons(diff) {
                const btns = dropdownContent.querySelectorAll('[data-diff]');
                btns.forEach(b => {
                    b.classList.remove('active-drop');
                    if (b.dataset.diff === diff) b.classList.add('active-drop');
                });
                selectedDifficultyLabel.textContent = difficulties[diff].label;
                difficultyLabel.textContent = difficulties[diff].label;
            }

            // Theme
            function initTheme() {
                const dark = localStorage.getItem('memoryTheme') === 'dark';
                document.body.classList.toggle('dark-mode', dark);
                themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
            }

            function toggleTheme() {
                const dark = document.body.classList.toggle('dark-mode');
                localStorage.setItem('memoryTheme', dark ? 'dark' : 'light');
                themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
                showToast(dark ? '🌙 Dark mode' : '☀️ Light mode', 1000);
            }

            function toggleSound() {
                soundEnabled = !soundEnabled;
                soundIcon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
                showToast(soundEnabled ? '🔊 Sound on' : '🔇 Sound off', 1000);
            }

            // Dropdown
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContent.classList.toggle('show');
            });
            document.addEventListener('click', () => { dropdownContent.classList.remove('show'); });

            // Sidebar toggle
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            // Close sidebar on outside click (mobile)
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            });

            // Event listeners
            restartBtn.addEventListener('click', restartCurrentLevel);
            nextBtn.addEventListener('click', goToNextLevel);
            cancelBtn.addEventListener('click', () => winModal.classList.add('hidden'));
            fullResetBtn.addEventListener('click', fullGameReset);
            themeToggle.addEventListener('click', toggleTheme);
            soundToggle.addEventListener('click', toggleSound);

            dropdownContent.querySelectorAll('[data-diff]').forEach(b => {
                b.addEventListener('click', () => changeDifficulty(b.dataset.diff));
            });

            // Init
            initTheme();
            levelConfigs = generateLevelConfigs('easy');
            updateDifficultyButtons('easy');
            buildBoard();
            updateStarRating(0);
        })();
    </script>
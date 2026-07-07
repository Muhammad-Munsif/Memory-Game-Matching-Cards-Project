






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

            function resetAllProgress() {
                if (confirm('Reset all progress for all difficulties and levels?')) {
                    bestScores = {};
                    levelStars = [];
                    saveBestScores();
                    buildBoard();
                    showToast('🗑️ All progress reset!', 1500);
                }
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

            // ----- THEME with animation -----
            function createThemeParticles(x, y, isDark) {
                const colors = isDark ? ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a'] : ['#4f46e5', '#7c3aed', '#818cf8', '#a5b4fc'];
                const container = document.createElement('div');
                container.className = 'theme-particles';
                container.style.left = x + 'px';
                container.style.top = y + 'px';
                container.style.width = '0';
                container.style.height = '0';
                document.body.appendChild(container);
                for (let i = 0; i < 12; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'theme-particle';
                    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
                    const distance = 60 + Math.random() * 80;
                    particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                    particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
                    particle.style.background = colors[i % colors.length];
                    particle.style.width = (6 + Math.random() * 8) + 'px';
                    particle.style.height = (6 + Math.random() * 8) + 'px';
                    particle.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';
                    particle.style.animationDelay = (Math.random() * 0.2) + 's';
                    container.appendChild(particle);
                }
                setTimeout(() => container.remove(), 1500);
            }

            function setTheme(isDark) {
                const icon = document.getElementById('themeIcon');
                // Add rotation animation
                icon.classList.add('rotating');
                setTimeout(() => icon.classList.remove('rotating'), 600);

                // Get toggle position for particles
                const rect = themeToggle.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                createThemeParticles(cx, cy, isDark);

                if (isDark) {
                    document.body.classList.add('dark-mode');
                    icon.className = 'fas fa-sun';
                } else {
                    document.body.classList.remove('dark-mode');
                    icon.className = 'fas fa-moon';
                }
                localStorage.setItem('memoryTheme', isDark ? 'dark' : 'light');
            }

            function initTheme() {
                const saved = localStorage.getItem('memoryTheme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = saved === 'dark' || (saved === null && prefersDark);
                if (isDark) {
                    document.body.classList.add('dark-mode');
                    themeIcon.className = 'fas fa-sun';
                } else {
                    document.body.classList.remove('dark-mode');
                    themeIcon.className = 'fas fa-moon';
                }
                localStorage.setItem('memoryTheme', isDark ? 'dark' : 'light');
            }

            function toggleTheme() {
                const isDark = !document.body.classList.contains('dark-mode');
                setTheme(isDark);
                showToast(isDark ? '🌙 Dark mode' : '☀️ Light mode', 1000);
            }

            function toggleSound() {
                soundEnabled = !soundEnabled;
                soundIcon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
                showToast(soundEnabled ? '🔊 Sound on' : '🔇 Sound off', 1000);
            }

            // ----- Dropdown -----
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContent.classList.toggle('show');
            });
            document.addEventListener('click', () => { dropdownContent.classList.remove('show'); });

            // ----- Sidebar toggle -----
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
                        sidebar.classList.remove('open');
                    }
                }
            });

            // ----- Event listeners -----
            restartBtn.addEventListener('click', restartCurrentLevel);
            resetAllBtn.addEventListener('click', resetAllProgress);
            nextBtn.addEventListener('click', goToNextLevel);
            cancelBtn.addEventListener('click', () => winModal.classList.add('hidden'));
            fullResetBtn.addEventListener('click', fullGameReset);
            themeToggle.addEventListener('click', toggleTheme);
            soundToggle.addEventListener('click', toggleSound);

            dropdownContent.querySelectorAll('[data-diff]').forEach(b => {
                b.addEventListener('click', () => changeDifficulty(b.dataset.diff));
            });

            // Keyboard shortcut: R to restart
            document.addEventListener('keydown', (e) => {
                if (e.key === 'r' || e.key === 'R') {
                    if (!e.ctrlKey && !e.metaKey) {
                        restartCurrentLevel();
                    }
                }
            });

            // ----- Init -----
            loadBestScores();
            initTheme();
            levelConfigs = generateLevelConfigs('easy');
            updateDifficultyButtons('easy');
            buildBoard();
            updateStarRating(0);
        })();
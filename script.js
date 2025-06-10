document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const movesDisplay = document.getElementById('moves');
    const timeDisplay = document.getElementById('time');
    const restartButton = document.getElementById('restart');
    const winMessage = document.getElementById('win-message');
    const playAgainButton = document.getElementById('play-again');
    const finalMovesDisplay = document.getElementById('final-moves');
    const finalTimeDisplay = document.getElementById('final-time');

    // Game variables
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let moves = 0;
    let timer = null;
    let seconds = 0;
    let matchedPairs = 0;
    const totalPairs = 6; // For a 6x2 grid (12 cards)

    // Emoji icons for cards (6 pairs)
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
    
    // Initialize game
    function initGame() {
        // Reset game state
        moves = 0;
        seconds = 0;
        matchedPairs = 0;
        movesDisplay.textContent = moves;
        timeDisplay.textContent = `${seconds}s`;
        clearInterval(timer);
        timer = null;
        
        // Create cards
        cards = [];
        gameBoard.innerHTML = '';
        
        // Select 6 random emojis and duplicate them for pairs
        const selectedEmojis = [...emojis].sort(() => 0.5 - Math.random()).slice(0, totalPairs);
        const gameEmojis = [...selectedEmojis, ...selectedEmojis];
        
        // Shuffle cards
        gameEmojis.sort(() => 0.5 - Math.random());
        
        // Create card elements
        gameEmojis.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">${emoji}</div>
                    <div class="card-back"></div>
                </div>
            `;
            
            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
            cards.push(card);
        });
    }
    
    // Flip card function
    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        if (this.classList.contains('matched')) return;
        
        // Start timer on first move
        if (!timer && moves === 0) {
            startTimer();
        }
        
        this.classList.add('flipped');
        
        if (!hasFlippedCard) {
            // First click
            hasFlippedCard = true;
            firstCard = this;
            return;
        }
        
        // Second click
        secondCard = this;
        moves++;
        movesDisplay.textContent = moves;
        
        checkForMatch();
    }
    
    // Check for match
    function checkForMatch() {
        const isMatch = firstCard.querySelector('.card-front').textContent === 
                        secondCard.querySelector('.card-front').textContent;
        
        if (isMatch) {
            disableCards();
            matchedPairs++;
            
            // Check for win
            if (matchedPairs === totalPairs) {
                endGame();
            }
        } else {
            unflipCards();
        }
    }
    
    // Disable matched cards
    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        
        resetBoard();
    }
    
    // Unflip unmatched cards
    function unflipCards() {
        lockBoard = true;
        
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            
            resetBoard();
        }, 1000);
    }
    
    // Reset board state
    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }
    
    // Timer functions
    function startTimer() {
        timer = setInterval(() => {
            seconds++;
            timeDisplay.textContent = `${seconds}s`;
        }, 1000);
    }
    
    function stopTimer() {
        clearInterval(timer);
    }
    
    // End game
    function endGame() {
        stopTimer();
        finalMovesDisplay.textContent = moves;
        finalTimeDisplay.textContent = `${seconds}s`;
        winMessage.classList.remove('hidden');
    }
    
    // Event listeners
    restartButton.addEventListener('click', () => {
        initGame();
    });
    
    playAgainButton.addEventListener('click', () => {
        winMessage.classList.add('hidden');
        initGame();
    });
    
    // Initialize the game
    initGame();
});
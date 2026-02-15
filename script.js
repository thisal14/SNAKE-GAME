const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const overlaySubtext = document.getElementById('overlay-subtext');

// Game Constants
const GRID_SIZE = 15;
const CELL_SIZE = 10;
const CANVAS_WIDTH = 200; // Original Low-res feel
const CANVAS_HEIGHT = 160;

// Set actual canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game State
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameSpeed = 150;
let gameLoopId = null;

highScoreElement.innerText = `HI: ${String(highScore).padStart(4, '0')}`;

function initGame() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameSpeed = 150;
    updateScore();
    createFood();
}

function updateScore() {
    scoreElement.innerText = String(score).padStart(4, '0');
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / CELL_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / CELL_SIZE))
    };
    // Don't spawn food on snake body
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            createFood();
            return;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw snake
    ctx.fillStyle = '#2b3a1a'; // Nokia Dark Green
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];

        // Slightly smaller segments to show grid effect
        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );

        // Draw "eyes" on head
        if (i === 0) {
            ctx.fillStyle = '#9ead86'; // Screen color
            if (direction === 'right' || direction === 'left') {
                ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 2, 2, 2);
                ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 6, 2, 2);
            } else {
                ctx.fillRect(segment.x * CELL_SIZE + 2, segment.y * CELL_SIZE + 4, 2, 2);
                ctx.fillRect(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + 4, 2, 2);
            }
            ctx.fillStyle = '#2b3a1a';
        }
    }

    // Draw food
    ctx.fillRect(
        food.x * CELL_SIZE + 2,
        food.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
    );
}

function move() {
    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;
    if (direction === 'left') head.x--;
    if (direction === 'right') head.x++;

    // Wall collision
    if (head.x < 0 || head.x >= CANVAS_WIDTH / CELL_SIZE ||
        head.y < 0 || head.y >= CANVAS_HEIGHT / CELL_SIZE) {
        gameOver();
        return;
    }

    // Self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        createFood();
        // Speed up slightly
        if (gameSpeed > 60) gameSpeed -= 2;
    } else {
        snake.pop();
    }
}

function gameLoop() {
    if (!gameRunning) return;
    move();
    draw();
    setTimeout(gameLoop, gameSpeed);
}

function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.innerText = `HI: ${String(highScore).padStart(4, '0')}`;
    }
    overlay.style.display = 'block';
    overlayText.innerText = 'GAME OVER';
    overlaySubtext.innerText = 'Press 5 or Space to Restart';
}

function startGame() {
    if (gameRunning) return;
    initGame();
    gameRunning = true;
    overlay.style.display = 'none';
    gameLoop();
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (!gameRunning && (e.key === ' ' || e.key === '5' || e.key === 'Enter')) {
        startGame();
    }

    const key = e.key;
    if (key === 'ArrowUp' && direction !== 'down') nextDirection = 'up';
    if (key === 'ArrowDown' && direction !== 'up') nextDirection = 'down';
    if (key === 'ArrowLeft' && direction !== 'right') nextDirection = 'left';
    if (key === 'ArrowRight' && direction !== 'left') nextDirection = 'right';
});

// Keypad Button Support
document.getElementById('upBtn').addEventListener('click', () => { if (direction !== 'down') nextDirection = 'up'; });
document.getElementById('downBtn').addEventListener('click', () => { if (direction !== 'up') nextDirection = 'down'; });
document.getElementById('leftBtn').addEventListener('click', () => { if (direction !== 'right') nextDirection = 'left'; });
document.getElementById('rightBtn').addEventListener('click', () => { if (direction !== 'left') nextDirection = 'right'; });

// Touch Swipe Detection
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    if (!gameRunning) startGame();
    // Prevent scrolling
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    // Prevent scrolling
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // Minimum distance to be considered a swipe
    const minDistance = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (Math.abs(dx) > minDistance) {
            if (dx > 0 && direction !== 'left') nextDirection = 'right';
            else if (dx < 0 && direction !== 'right') nextDirection = 'left';
        }
    } else {
        // Vertical swipe
        if (Math.abs(dy) > minDistance) {
            if (dy > 0 && direction !== 'up') nextDirection = 'down';
            else if (dy < 0 && direction !== 'down') nextDirection = 'up';
        }
    }

    e.preventDefault();
}, { passive: false });

// Initial Draw
initGame();
draw();

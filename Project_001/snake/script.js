// 贪吃蛇游戏逻辑

// 阻止页面滚动的辅助函数
function preventScrolling() {
    // 阻止鼠标滚轮事件
    window.addEventListener('wheel', preventDefault, { passive: false });
    // 阻止触摸设备上的滚动事件
    window.addEventListener('touchmove', preventDefault, { passive: false });
    // 阻止方向键和空格键的默认滚动行为
    window.addEventListener('keydown', handleScrollKeys);
}

function allowScrolling() {
    window.removeEventListener('wheel', preventDefault);
    window.removeEventListener('touchmove', preventDefault);
    window.removeEventListener('keydown', handleScrollKeys);
}

function preventDefault(e) {
    e.preventDefault();
}

function handleScrollKeys(e) {
    // 阻止方向键、空格键、Page Up、Page Down等可能导致滚动的键
    const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
    if (scrollKeys.includes(e.keyCode) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
    }
}

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const applySettingsBtn = document.getElementById('applySettingsBtn');

// 返回游戏大厅
function backToLobby() {
    // 创建自定义确认对话框
    const customConfirm = document.createElement('div');
    customConfirm.id = 'customConfirm';
    customConfirm.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        text-align: center;
        min-width: 300px;
    `;
    
    customConfirm.innerHTML = `
        <p>确定要返回游戏大厅吗？当前游戏进度将会丢失。</p>
        <div style="margin-top: 15px;">
            <button id="confirmYes" style="padding: 8px 16px; margin-right: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px;">确定</button>
            <button id="confirmNo" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 5px;">取消</button>
        </div>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">按Enter键确定，ESC键取消</p>
    `;
    
    document.body.appendChild(customConfirm);
    
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
    
    // 确认按钮点击事件
    function handleConfirm() {
        // 清除游戏循环
        clearInterval(gameInterval);
        
        // 移除对话框
        document.body.removeChild(customConfirm);
        document.body.style.overflow = '';
        
        // 跳转到游戏大厅页面
        window.location.href = '../index_select.html';
        
        // 移除事件监听器
        document.removeEventListener('keydown', handleKeydown);
    }
    
    // 取消按钮点击事件
    function handleCancel() {
        document.body.removeChild(customConfirm);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
    }
    
    // 键盘事件处理
    function handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }
    
    // 添加事件监听器
    document.getElementById('confirmYes').addEventListener('click', handleConfirm);
    document.getElementById('confirmNo').addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
    
    // 自动聚焦确认按钮
    document.getElementById('confirmYes').focus();
}

// 键盘事件：ESC键返回大厅
document.addEventListener('keydown', function(e) {
    if (e.code === 'Escape') {
        backToLobby();
    }
});
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedBtn = document.getElementById('speedBtn'); // 获取加速按钮
const directionBtns = document.querySelectorAll('.direction-btn');

// 游戏参数
const GRID_SIZE = 20;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// 游戏状态
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameInterval;
let gameSpeed = 150;
let normalSpeed = 150; // 保存正常速度
let isGameRunning = false;
let isPaused = false;
let speedBoostLevel = 0; // 加速级别: 0=正常, 1=一级加速, 2=二级加速, 3=三级加速
let speedBoostTimer; // 加速计时器

// 游戏设置
let gameSettings = {
    snakeColor: localStorage.getItem('snakeColor') || '#4CAF50', // 蛇头颜色
    snakeBodyColor: localStorage.getItem('snakeBodyColor') || '#8BC34A', // 蛇身体颜色
    foodStyle: localStorage.getItem('foodStyle') || 'apple', // 食物样式
    foodColor: localStorage.getItem('foodColor') || '#D32F2F', // 食物颜色
    difficulty: localStorage.getItem('snakeDifficulty') || 'easy' // 游戏难度
};

// 根据难度设置初始速度
function setDifficultySpeed(difficulty) {
    switch(difficulty) {
        case 'easy':
            return 180; // 简单模式 - 较慢
        case 'medium':
            return 150; // 中等模式 - 中等
        case 'hard':
            return 120; // 困难模式 - 较快
        default:
            return 150;
    }
}

// 初始化难度对应的速度
normalSpeed = setDifficultySpeed(gameSettings.difficulty);
gameSpeed = normalSpeed;

// 初始化游戏
function initGame() {
    // 重置蛇的位置和状态
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    isPaused = false;
    resetSpeedBoost(); // 重置加速状态
    
    // 更新分数显示
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    
    // 生成食物
    generateFood();
    
    // 绘制初始游戏状态
    drawGame();
}

// 加速功能：多级加速，可通过连续按键循环切换
function toggleSpeedBoost() {
    if (!isGameRunning || isPaused) return;
    
    // 循环切换加速级别 (0→1→2→3→0...)
    speedBoostLevel = (speedBoostLevel + 1) % 4;
    
    // 根据不同级别设置不同的速度
    switch (speedBoostLevel) {
        case 0: // 正常速度
            gameSpeed = normalSpeed;
            speedBtn.classList.remove('active');
            speedBtn.textContent = '正常';
            clearTimeout(speedBoostTimer);
            break;
        case 1: // 一级加速 (稍快)
            gameSpeed = Math.max(50, normalSpeed - 40);
            speedBtn.classList.add('active');
            speedBtn.textContent = '加速1';
            restartSpeedBoostTimer();
            break;
        case 2: // 二级加速 (更快)
            gameSpeed = Math.max(50, normalSpeed - 80);
            speedBtn.classList.add('active');
            speedBtn.textContent = '加速2';
            restartSpeedBoostTimer();
            break;
        case 3: // 三级加速 (最快)
            gameSpeed = Math.max(50, normalSpeed - 120);
            speedBtn.classList.add('active');
            speedBtn.textContent = '加速3';
            restartSpeedBoostTimer();
            break;
    }
    
    // 更新游戏间隔
    if (isGameRunning && !isPaused) {
        updateGameInterval();
    }
    
    // 显示加速级别提示
    showSpeedLevelHint(speedBoostLevel);
}

// 重新启动加速计时器
function restartSpeedBoostTimer() {
    // 清除之前的计时器
    clearTimeout(speedBoostTimer);
    
    // 设置新的计时器，根据加速级别设置不同的持续时间
    // 加速级别越高，持续时间越短
    const duration = [0, 15000, 10000, 7000][speedBoostLevel];
    
    speedBoostTimer = setTimeout(() => {
        // 恢复正常速度
        speedBoostLevel = 0;
        gameSpeed = normalSpeed;
        speedBtn.classList.remove('active');
        speedBtn.textContent = '正常';
        if (isGameRunning && !isPaused) {
            updateGameInterval();
        }
    }, duration);
}

// 显示加速级别提示
function showSpeedLevelHint(level) {
    // 检查是否已存在提示元素
    let hintElement = document.getElementById('speedLevelHint');
    
    if (!hintElement) {
        // 创建提示元素
        hintElement = document.createElement('div');
        hintElement.id = 'speedLevelHint';
        hintElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 18px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(hintElement);
    }
    
    // 设置提示文本
    const speedTexts = ['正常速度', '一级加速', '二级加速', '三级加速'];
    hintElement.textContent = speedTexts[level];
    
    // 显示提示
    hintElement.style.opacity = '1';
    
    // 1秒后隐藏
    setTimeout(() => {
        hintElement.style.opacity = '0';
    }, 1000);
}

// 更新游戏间隔时间
function updateGameInterval() {
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, gameSpeed);
}

// 重置加速状态
function resetSpeedBoost() {
    speedBoostLevel = 0;
    gameSpeed = normalSpeed;
    if (speedBtn) {
        speedBtn.classList.remove('active');
        speedBtn.textContent = '正常';
    }
    clearTimeout(speedBoostTimer);
}

// 更新游戏间隔时间
function updateGameInterval() {
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, gameSpeed);
}

// 生成食物
function generateFood() {
    // 确保食物不会出现在蛇身上
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    food = newFood;
}

// 绘制不同样式的食物
function drawFood() {
    switch(gameSettings.foodStyle) {
        case 'apple':
            drawApple();
            break;
        case 'cherry':
            drawCherry();
            break;
        case 'banana':
            drawBanana();
            break;
        case 'cookie':
            drawCookie();
            break;
        default:
            drawApple();
    }
}

// 绘制苹果样式食物
function drawApple() {
    // 苹果主体
    ctx.fillStyle = gameSettings.foodColor;
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 苹果叶子
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 + 4, food.y * GRID_SIZE + GRID_SIZE / 2 - 4, GRID_SIZE / 5, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制樱桃样式食物
function drawCherry() {
    // 两个樱桃
    ctx.fillStyle = gameSettings.foodColor;
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 - 4, food.y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 3, 0, Math.PI * 2);
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 + 4, food.y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 樱桃梗
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(food.x * GRID_SIZE + GRID_SIZE / 2 - 3, food.y * GRID_SIZE + GRID_SIZE / 2 - 3);
    ctx.lineTo(food.x * GRID_SIZE + GRID_SIZE / 2 - 1, food.y * GRID_SIZE + GRID_SIZE / 2 - 8);
    ctx.moveTo(food.x * GRID_SIZE + GRID_SIZE / 2 + 3, food.y * GRID_SIZE + GRID_SIZE / 2 - 3);
    ctx.lineTo(food.x * GRID_SIZE + GRID_SIZE / 2 + 1, food.y * GRID_SIZE + GRID_SIZE / 2 - 8);
    ctx.stroke();
}

// 绘制香蕉样式食物
function drawBanana() {
    // 香蕉身体
    ctx.fillStyle = gameSettings.foodColor;
    ctx.beginPath();
    ctx.ellipse(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2,
                GRID_SIZE / 2 - 3, GRID_SIZE / 2 - 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 香蕉顶部
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 + 7, food.y * GRID_SIZE + GRID_SIZE / 2 - 7, GRID_SIZE / 8, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制饼干样式食物
function drawCookie() {
    // 饼干主体
    ctx.fillStyle = gameSettings.foodColor;
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 饼干上的巧克力豆
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 - 5, food.y * GRID_SIZE + GRID_SIZE / 2 - 3, GRID_SIZE / 10, 0, Math.PI * 2);
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 + 5, food.y * GRID_SIZE + GRID_SIZE / 2 - 3, GRID_SIZE / 10, 0, Math.PI * 2);
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2 + 5, GRID_SIZE / 10, 0, Math.PI * 2);
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 - 5, food.y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 10, 0, Math.PI * 2);
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2 + 5, food.y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 10, 0, Math.PI * 2);
    ctx.fill();
}

// 显示设置面板
function showSettings() {
    // 加载保存的设置
    const snakeColorOptions = document.querySelectorAll('input[name="snakeColor"]');
    snakeColorOptions.forEach(option => {
        option.checked = option.value === gameSettings.snakeColor;
    });
    
    const snakeBodyColorOptions = document.querySelectorAll('input[name="snakeBodyColor"]');
    snakeBodyColorOptions.forEach(option => {
        option.checked = option.value === gameSettings.snakeBodyColor;
    });
    
    const foodStyleOptions = document.querySelectorAll('input[name="foodStyle"]');
    foodStyleOptions.forEach(option => {
        option.checked = option.value === gameSettings.foodStyle;
    });
    
    const foodColorOptions = document.querySelectorAll('input[name="foodColor"]');
    foodColorOptions.forEach(option => {
        option.checked = option.value === gameSettings.foodColor;
    });
    
    const difficultyOptions = document.querySelectorAll('input[name="difficulty"]');
    difficultyOptions.forEach(option => {
        option.checked = option.value === gameSettings.difficulty;
    });
    
    // 显示面板
    settingsPanel.style.display = 'flex';
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
}

// 隐藏设置面板
function hideSettings() {
    settingsPanel.style.display = 'none';
    // 允许页面滚动
    document.body.style.overflow = '';
}

// 应用游戏设置
function applySettings() {
    // 获取颜色设置
    const selectedSnakeColor = document.querySelector('input[name="snakeColor"]:checked').value;
    const selectedSnakeBodyColor = document.querySelector('input[name="snakeBodyColor"]:checked').value;
    const selectedFoodStyle = document.querySelector('input[name="foodStyle"]:checked').value;
    const selectedFoodColor = document.querySelector('input[name="foodColor"]:checked').value;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    // 更新设置对象
    gameSettings.snakeColor = selectedSnakeColor;
    gameSettings.snakeBodyColor = selectedSnakeBodyColor;
    gameSettings.foodStyle = selectedFoodStyle;
    gameSettings.foodColor = selectedFoodColor;
    
    // 保存设置到localStorage
    localStorage.setItem('snakeColor', gameSettings.snakeColor);
    localStorage.setItem('snakeBodyColor', gameSettings.snakeBodyColor);
    localStorage.setItem('foodStyle', gameSettings.foodStyle);
    localStorage.setItem('foodColor', gameSettings.foodColor);
    localStorage.setItem('snakeDifficulty', selectedDifficulty);
    
    // 如果难度改变，更新速度
    if (gameSettings.difficulty !== selectedDifficulty) {
        gameSettings.difficulty = selectedDifficulty;
        normalSpeed = setDifficultySpeed(selectedDifficulty);
        
        // 如果没有使用加速，直接更新游戏速度
        if (speedBoostLevel === 0) {
            gameSpeed = normalSpeed;
            if (isGameRunning && !isPaused) {
                updateGameInterval();
            }
        }
    }
    
    // 隐藏设置面板
    hideSettings();
    
    // 重绘游戏以应用新设置
    drawGame();
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? gameSettings.snakeColor : gameSettings.snakeBodyColor;
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        
        // 蛇的边框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        
        // 蛇头眼睛
        if (index === 0) {
            ctx.fillStyle = 'black';
            const eyeSize = GRID_SIZE / 8;
            const eyeOffset = GRID_SIZE / 3;
            
            if (direction === 'right') {
                ctx.beginPath();
                ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'left') {
                ctx.beginPath();
                ctx.arc(segment.x * GRID_SIZE + eyeOffset, segment.y * GRID_SIZE + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * GRID_SIZE + eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'up') {
                ctx.beginPath();
                ctx.arc(segment.x * GRID_SIZE + eyeOffset, segment.y * GRID_SIZE + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'down') {
                ctx.beginPath();
                ctx.arc(segment.x * GRID_SIZE + eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    // 绘制食物
    drawFood();
    
    // 如果游戏暂停，显示暂停提示
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

// 更新游戏状态
function updateGame() {
    if (isPaused) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头
    const head = { x: snake[0].x, y: snake[0].y };
    
    // 根据方向移动蛇头
    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // 检查碰撞 - 墙壁
    if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || 
        head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
        gameOver();
        return;
    }
    
    // 检查碰撞 - 自身
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // 将新头部添加到蛇身
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        scoreElement.textContent = score;
        
        // 检查是否更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 生成新食物
        generateFood();
        
        // 随着分数增加，提高游戏速度（根据不同难度调整速度增长）
            if (score % 50 === 0 && normalSpeed > 50) {
                // 根据难度调整加速幅度
                let speedDecrease = 5; // 默认值
                switch(gameSettings.difficulty) {
                    case 'easy':
                        speedDecrease = 3; // 简单模式 - 速度增加较慢
                        break;
                    case 'medium':
                        speedDecrease = 5; // 中等模式 - 速度适中增加
                        break;
                    case 'hard':
                        speedDecrease = 7; // 困难模式 - 速度增加较快
                        break;
                }
                
                normalSpeed = Math.max(50, normalSpeed - speedDecrease); // 更新正常速度而不是直接更新gameSpeed
                if (speedBoostLevel === 0) { // 如果没有使用加速，则更新当前游戏速度
                    gameSpeed = normalSpeed;
                    updateGameInterval(); // 使用封装的函数更新游戏间隔
                }
            }
        
        // 分数增加时的动画效果
        canvas.classList.add('pulse');
        setTimeout(() => canvas.classList.remove('pulse'), 500);
    } else {
        // 如果没吃到食物，移除尾部
        snake.pop();
    }
    
    // 绘制更新后的游戏状态
    drawGame();
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    isGameRunning = false;
    resetSpeedBoost(); // 重置加速状态
    
    // 游戏结束动画
    canvas.classList.add('game-over');
    
    // 显示游戏结束信息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`最终分数: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

// 开始游戏
function startGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        isPaused = false;
        updateGameInterval(); // 使用封装的函数启动游戏循环
        startBtn.textContent = '继续';
    } else if (isPaused) {
        isPaused = false;
        updateGameInterval(); // 从暂停状态恢复时更新游戏间隔
        startBtn.textContent = '继续';
    }
}

// 暂停游戏
function pauseGame() {
    if (isGameRunning && !isPaused) {
        clearInterval(gameInterval);
        isPaused = true;
        startBtn.textContent = '继续';
        drawGame(); // 绘制暂停状态
    }
}

// 重置游戏
function resetGame() {
    clearInterval(gameInterval);
    isGameRunning = false;
    canvas.classList.remove('game-over');
    startBtn.textContent = '开始游戏';
    initGame();
}

// 处理方向控制
function setDirection(newDirection) {
    // 防止180度转向（不能直接反向移动）
    if (
        (newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')
    ) {
        nextDirection = newDirection;
    }
}

// 事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', resetGame);
speedBtn.addEventListener('click', toggleSpeedBoost); // 添加加速按钮事件监听器
settingsBtn.addEventListener('click', showSettings);
closeSettingsBtn.addEventListener('click', hideSettings);
applySettingsBtn.addEventListener('click', applySettings);

// 方向按钮事件
directionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const newDir = btn.getAttribute('data-direction');
        setDirection(newDir);
    });
});

// 监听键盘事件来关闭设置面板
settingsPanel.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideSettings();
    } else if (e.key === 'Enter') {
        applySettings();
    }
});

// 键盘控制
window.addEventListener('keydown', (e) => {
    // ESC键返回游戏大厅
    if (e.key === 'Escape') {
        e.preventDefault();
        backToLobby();
        return;
    }
    switch (e.key) {
        case 'ArrowUp':
            setDirection('up');
            break;
        case 'ArrowDown':
            setDirection('down');
            break;
        case 'ArrowLeft':
            setDirection('left');
            break;
        case 'ArrowRight':
            setDirection('right');
            break;
        case ' ': // 空格键暂停/继续
            e.preventDefault();
            if (isGameRunning) {
                if (isPaused) {
                    startGame();
                } else {
                    pauseGame();
                }
            } else {
                startGame();
            }
            break;
        case 'Enter': // 回车键开始/重置
            if (!isGameRunning) {
                resetGame();
                startGame();
            }
            break;
            case ' ' : // 空格键暂停/继续 (已在上面处理)
            break;
            case 'Shift': // Shift键循环切换加速级别
            case 's': // S键也可以循环切换加速级别
            e.preventDefault();
            toggleSpeedBoost();
            break;
            case 'p': // P键暂停游戏
            e.preventDefault();
            pauseGame();
            break;
            case 'r': // R键重置游戏
            e.preventDefault();
            resetGame();
            break;
    }
});

// 触摸控制（移动设备）
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!isGameRunning || isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // 判断滑动方向
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平滑动
        setDirection(diffX > 0 ? 'right' : 'left');
    } else {
        // 垂直滑动
        setDirection(diffY > 0 ? 'down' : 'up');
    }
    
    e.preventDefault();
}, { passive: false });

// 初始化返回大厅按钮事件
const backBtn = document.getElementById('backToLobbyBtn');
if (backBtn) {
    backBtn.addEventListener('click', backToLobby);
}

// 初始化游戏
initGame();
preventScrolling(); // 游戏加载后立即阻止滚动
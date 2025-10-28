// 雷霆飞机游戏逻辑

// 返回游戏大厅函数
function backToLobby() {
    if (confirm('确定要返回游戏大厅吗？当前游戏进度将会丢失。')) {
        // 清除所有可能的游戏循环
        try {
            if (typeof gameLoopId !== 'undefined') {
                cancelAnimationFrame(gameLoopId);
            }
        } catch (e) {
            console.log('清除游戏循环时出错:', e);
        }
        
        // 跳转到游戏大厅页面
        window.location.href = '../index_select.html';
    }
}

// 键盘事件：ESC键返回大厅 (仅在游戏非运行状态时有效)
document.addEventListener('keydown', function(e) {
    if (e.code === 'Escape' && typeof isGameRunning !== 'undefined' && !isGameRunning) {
        backToLobby();
    }
});

// 游戏设置对象
let gameSettings = {
    difficulty: localStorage.getItem('thunderPlaneDifficulty') || 'normal',
    planeColor: localStorage.getItem('thunderPlaneColor') || 'blue',
    bulletStyle: localStorage.getItem('thunderPlaneBulletStyle') || 'classic',
    soundEnabled: localStorage.getItem('thunderPlaneSound') !== 'false'
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const startGameBtn = document.getElementById('startGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const resumeBtn = document.getElementById('resumeBtn');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const soundEnabledToggle = document.getElementById('soundEnabled');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');

// 根据设置获取难度相关参数
function getDifficultyParams() {
    switch(gameSettings.difficulty) {
        case 'easy':
            return {
                playerSpeed: 6,
                bulletSpeed: 10,
                enemySpeedBase: 1.5,
                bulletCooldown: 250,
                enemySpawnRateBase: 1800,
                lives: 5
            };
        case 'hard':
            return {
                playerSpeed: 4,
                bulletSpeed: 6,
                enemySpeedBase: 2.5,
                bulletCooldown: 350,
                enemySpawnRateBase: 1200,
                lives: 2
            };
        case 'normal':
        default:
            return {
                playerSpeed: 5,
                bulletSpeed: 8,
                enemySpeedBase: 2,
                bulletCooldown: 300,
                enemySpawnRateBase: 1500,
                lives: 3
            };
    }
}

// 获取当前难度参数
const difficultyParams = getDifficultyParams();

// 游戏常量
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const PLAYER_SPEED = difficultyParams.playerSpeed;
const BULLET_SPEED = difficultyParams.bulletSpeed;
const ENEMY_SPEED_BASE = difficultyParams.enemySpeedBase;
const ENEMY_SPEED_INCREASE = 0.1;
const BULLET_COOLDOWN = difficultyParams.bulletCooldown; // 毫秒
const ENEMY_SPAWN_RATE_BASE = difficultyParams.enemySpawnRateBase; // 毫秒
const ENEMY_SPAWN_RATE_DECREASE = 50; // 毫秒

// 游戏状态
let player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    width: 50,
    height: 60,
    speed: PLAYER_SPEED,
    bullets: [],
    lastShot: 0,
    lives: 3,
    invincible: false,
    invincibleTimer: 0
};

let enemies = [];
let enemyBullets = [];
let explosions = [];
let score = 0;
let level = 1;
let gameLoopId;
let lastEnemySpawn = 0;
let enemySpawnRate = ENEMY_SPAWN_RATE_BASE;
let isGameRunning = false;
let isPaused = false;

// 按键状态
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    ' ': false,
    p: false
};

// 触摸状态
let touchState = {
    left: false,
    right: false,
    up: false,
    down: false
};

// 初始化游戏
function initGame() {
    // 获取最新的难度参数
    const difficultyParams = getDifficultyParams();
    
    // 重置玩家
    player = {
        x: CANVAS_WIDTH / 2 - 25,
        y: CANVAS_HEIGHT - 80,
        width: 50,
        height: 60,
        speed: difficultyParams.playerSpeed,
        bullets: [],
        lastShot: 0,
        lives: difficultyParams.lives,
        invincible: false,
        invincibleTimer: 0
    };
    
    // 重置游戏状态
    enemies = [];
    enemyBullets = [];
    explosions = [];
    score = 0;
    level = 1;
    lastEnemySpawn = 0;
    enemySpawnRate = difficultyParams.enemySpawnRateBase;
    isGameRunning = false;
    isPaused = false;
    
    // 更新UI
    scoreElement.textContent = score;
    livesElement.textContent = player.lives;
    levelElement.textContent = level;
    
    // 显示开始界面
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    // 绘制初始状态
    drawGame();
    
    // 初始化设置面板
    initSettingsPanel();
}

// 显示设置面板
function showSettings() {
    settingsPanel.classList.add('active');
    // 暂停游戏
    if (isGameRunning && !isPaused) {
        pauseGame();
    }
}

// 隐藏设置面板
function hideSettings() {
    settingsPanel.classList.remove('active');
}

// 初始化设置面板
function initSettingsPanel() {
    // 设置难度
    const difficultyOptions = document.getElementsByName('difficulty');
    difficultyOptions.forEach(option => {
        option.checked = option.value === gameSettings.difficulty;
    });
    
    // 设置飞机颜色
    const planeColorOptions = document.getElementsByName('planeColor');
    planeColorOptions.forEach(option => {
        option.checked = option.value === gameSettings.planeColor;
    });
    
    // 设置子弹样式
    const bulletStyleOptions = document.getElementsByName('bulletStyle');
    bulletStyleOptions.forEach(option => {
        option.checked = option.value === gameSettings.bulletStyle;
    });
    
    // 设置音效开关
    soundEnabledToggle.checked = gameSettings.soundEnabled;
}

// 应用设置
function applySettings() {
    // 保存难度设置
    const difficultyOptions = document.getElementsByName('difficulty');
    for (let i = 0; i < difficultyOptions.length; i++) {
        if (difficultyOptions[i].checked) {
            gameSettings.difficulty = difficultyOptions[i].value;
            localStorage.setItem('thunderPlaneDifficulty', gameSettings.difficulty);
            break;
        }
    }
    
    // 保存飞机颜色设置
    const planeColorOptions = document.getElementsByName('planeColor');
    for (let i = 0; i < planeColorOptions.length; i++) {
        if (planeColorOptions[i].checked) {
            gameSettings.planeColor = planeColorOptions[i].value;
            localStorage.setItem('thunderPlaneColor', gameSettings.planeColor);
            break;
        }
    }
    
    // 保存子弹样式设置
    const bulletStyleOptions = document.getElementsByName('bulletStyle');
    for (let i = 0; i < bulletStyleOptions.length; i++) {
        if (bulletStyleOptions[i].checked) {
            gameSettings.bulletStyle = bulletStyleOptions[i].value;
            localStorage.setItem('thunderPlaneBulletStyle', gameSettings.bulletStyle);
            break;
        }
    }
    
    // 保存音效设置
    gameSettings.soundEnabled = soundEnabledToggle.checked;
    localStorage.setItem('thunderPlaneSound', gameSettings.soundEnabled);
    
    // 如果游戏未开始，重新初始化游戏以应用难度设置
    if (!isGameRunning) {
        initGame();
    }
    
    // 显示设置成功提示
    showSettingApplied();
    
    // 隐藏设置面板
    hideSettings();
}

// 显示设置应用成功提示
function showSettingApplied() {
    // 创建提示元素
    let notification = document.getElementById('settingNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'settingNotification';
        notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300 opacity-0';
        document.body.appendChild(notification);
    }
    
    notification.textContent = '设置已应用！';
    notification.style.opacity = '1';
    
    // 2秒后自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
}

// 根据设置获取飞机颜色
function getPlaneColor() {
    switch(gameSettings.planeColor) {
        case 'red':
            return { main: '#FF4500', border: '#8B0000' };
        case 'green':
            return { main: '#00FF00', border: '#006400' };
        case 'purple':
            return { main: '#9370DB', border: '#483D8B' };
        case 'blue':
        default:
            return { main: '#00FFFF', border: '#008080' };
    }
}

// 开始游戏
function startGame() {
    isGameRunning = true;
    isPaused = false;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    // 开始游戏循环
    lastEnemySpawn = Date.now();
    gameLoop();
}

// 暂停游戏
function pauseGame() {
    if (isGameRunning && !isPaused) {
        isPaused = true;
        pauseScreen.classList.remove('hidden');
        cancelAnimationFrame(gameLoopId);
    }
}

// 继续游戏
function resumeGame() {
    if (isGameRunning && isPaused) {
        isPaused = false;
        pauseScreen.classList.add('hidden');
        gameLoop();
    }
}

// 游戏结束
function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    
    // 更新游戏结束界面
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
    gameOverScreen.classList.remove('hidden');
    
    // 添加震动效果
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 500);
}

// 返回游戏大厅
function backToLobby() {
    if (confirm('确定要返回游戏大厅吗？当前游戏进度将会丢失。')) {
        // 停止游戏循环
        isGameRunning = false;
        cancelAnimationFrame(gameLoopId);
        
        // 跳转到游戏大厅页面
        window.location.href = '../index_select.html';
    }
}

// 游戏循环
function gameLoop() {
    if (!isGameRunning || isPaused) return;
    
    const currentTime = Date.now();
    
    // 更新游戏状态
    updatePlayer();
    updateBullets();
    updateEnemies(currentTime);
    updateEnemyBullets();
    updateExplosions();
    checkCollisions();
    checkLevelUp();
    
    // 绘制游戏
    drawGame();
    
    // 继续游戏循环
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 更新玩家状态
function updatePlayer() {
    // 处理无敌状态
    if (player.invincible) {
        player.invincibleTimer -= 16; // 假设60fps，每帧约16ms
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    
    // 处理键盘控制
    if (keys.ArrowUp || keys.w) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys.ArrowDown || keys.s) {
        player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + player.speed);
    }
    if (keys.ArrowLeft || keys.a) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys.ArrowRight || keys.d) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    }
    
    // 处理射击
    if (keys[' ']) {
        shoot();
    }
    
    // 处理触摸控制
    if (touchState.up) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (touchState.down) {
        player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + player.speed);
    }
    if (touchState.left) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (touchState.right) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    }
}

// 射击函数
function shoot() {
    // 动态获取当前难度参数
    const difficultyParams = getDifficultyParams();
    
    const currentTime = Date.now();
    if (currentTime - player.lastShot >= difficultyParams.bulletCooldown) {
        player.bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: difficultyParams.bulletSpeed
        });
        player.lastShot = currentTime;
        
        // 如果音效启用，可以在这里添加射击音效
        if (gameSettings.soundEnabled) {
            // 音效代码可以在这里实现
        }
    }
}

// 更新子弹
function updateBullets() {
    player.bullets = player.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
}

// 生成敌人
function spawnEnemy() {
    const enemyTypes = [
        { width: 40, height: 40, health: 1, score: 100 }, // 小型敌机
        { width: 60, height: 60, health: 2, score: 200 }, // 中型敌机
        { width: 80, height: 80, health: 3, score: 300 }  // 大型敌机
    ];
    
    // 根据关卡决定生成哪种敌机的概率
    let enemyTypeIndex;
    const rand = Math.random();
    if (rand < 0.7) {
        enemyTypeIndex = 0; // 70%概率生成小型敌机
    } else if (rand < 0.9) {
        enemyTypeIndex = 1; // 20%概率生成中型敌机
    } else {
        enemyTypeIndex = 2; // 10%概率生成大型敌机
    }
    
    const enemyType = enemyTypes[enemyTypeIndex];
    
    enemies.push({
        x: Math.random() * (CANVAS_WIDTH - enemyType.width),
        y: -enemyType.height,
        width: enemyType.width,
        height: enemyType.height,
        speed: ENEMY_SPEED_BASE + (level - 1) * ENEMY_SPEED_INCREASE,
        health: enemyType.health,
        score: enemyType.score,
        lastShot: Date.now()
    });
}

// 更新敌人
function updateEnemies(currentTime) {
    // 生成新敌人
    if (currentTime - lastEnemySpawn >= enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = currentTime;
    }
    
    // 更新敌人位置和射击
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        // 敌人射击
        if (Math.random() < 0.01 && currentTime - enemy.lastShot > 1000) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 15,
                speed: 5
            });
            enemy.lastShot = currentTime;
        }
        
        return enemy.y < CANVAS_HEIGHT + enemy.height;
    });
}

// 更新敌人子弹
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < CANVAS_HEIGHT;
    });
}

// 创建爆炸效果
function createExplosion(x, y, size) {
    explosions.push({
        x: x,
        y: y,
        size: size,
        frame: 0,
        maxFrames: 10
    });
}

// 更新爆炸效果
function updateExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.frame++;
        return explosion.frame < explosion.maxFrames;
    });
}

// 碰撞检测
function checkCollisions() {
    // 玩家子弹与敌人的碰撞
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                // 移除子弹
                player.bullets.splice(bulletIndex, 1);
                
                // 减少敌人生命值
                enemy.health--;
                
                if (enemy.health <= 0) {
                    // 敌人被消灭
                    score += enemy.score;
                    scoreElement.textContent = score;
                    
                    // 创建爆炸效果
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2);
                    
                    // 移除敌人
                    enemies.splice(enemyIndex, 1);
                    
                    // 分数增加动画
                    canvas.classList.add('pulse');
                    setTimeout(() => canvas.classList.remove('pulse'), 200);
                }
            }
        });
    });
    
    // 敌人子弹与玩家的碰撞
    if (!player.invincible) {
        enemyBullets.forEach((bullet, bulletIndex) => {
            if (checkCollision(bullet, player)) {
                // 移除子弹
                enemyBullets.splice(bulletIndex, 1);
                
                // 减少玩家生命
                player.lives--;
                livesElement.textContent = player.lives;
                
                // 创建爆炸效果
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, player.width / 2);
                
                // 设置无敌状态
                player.invincible = true;
                player.invincibleTimer = 2000; // 2秒无敌
                
                // 玩家受伤动画
                canvas.classList.add('shake');
                setTimeout(() => canvas.classList.remove('shake'), 500);
                
                // 检查游戏是否结束
                if (player.lives <= 0) {
                    gameOver();
                }
            }
        });
    }
    
    // 敌人与玩家的碰撞
    if (!player.invincible) {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(enemy, player)) {
                // 移除敌人
                enemies.splice(enemyIndex, 1);
                
                // 减少玩家生命
                player.lives--;
                livesElement.textContent = player.lives;
                
                // 创建爆炸效果
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, player.width / 2);
                
                // 设置无敌状态
                player.invincible = true;
                player.invincibleTimer = 2000;
                
                // 玩家受伤动画
                canvas.classList.add('shake');
                setTimeout(() => canvas.classList.remove('shake'), 500);
                
                // 检查游戏是否结束
                if (player.lives <= 0) {
                    gameOver();
                }
            }
        });
    }
}

// 检查碰撞的辅助函数
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 检查关卡升级
function checkLevelUp() {
    const newLevel = Math.floor(score / 5000) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;
        
        // 随着关卡提升，增加游戏难度
        enemySpawnRate = Math.max(ENEMY_SPAWN_RATE_BASE - (level - 1) * ENEMY_SPAWN_RATE_DECREASE, 300);
        
        // 关卡提升动画
        levelElement.classList.add('pulse');
        setTimeout(() => levelElement.classList.remove('pulse'), 500);
    }
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制星空背景
    drawStars();
    
    // 绘制玩家飞机
    drawPlayer();
    
    // 绘制子弹
    drawBullets();
    
    // 绘制敌人
    drawEnemies();
    
    // 绘制敌人子弹
    drawEnemyBullets();
    
    // 绘制爆炸效果
    drawExplosions();
}

// 绘制星空背景
function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制静态星星
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        const size = Math.random() * 2;
        const x = (i * 137.5 + Date.now() * 0.01) % CANVAS_WIDTH;
        const y = (i * 83.7 + Date.now() * 0.005) % CANVAS_HEIGHT;
        ctx.globalAlpha = 0.3 + Math.random() * 0.7;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}

// 绘制玩家飞机
function drawPlayer() {
    // 绘制闪烁效果（无敌状态）
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        return;
    }
    
    const planeColors = getPlaneColor();
    
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // 飞机主体
    ctx.fillStyle = planeColors.main;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // 飞机边框
    ctx.strokeStyle = planeColors.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 飞机引擎火焰
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(-10, player.height / 2);
    ctx.lineTo(0, player.height / 2 + 15);
    ctx.lineTo(10, player.height / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// 绘制子弹
function drawBullets() {
    // 根据设置的子弹样式选择颜色和效果
    let bulletColor, glowColor;
    
    switch(gameSettings.bulletStyle) {
        case 'fire':
            bulletColor = '#FF4500';
            glowColor = 'rgba(255, 69, 0, 0.5)';
            break;
        case 'laser':
            bulletColor = '#00FF00';
            glowColor = 'rgba(0, 255, 0, 0.5)';
            break;
        case 'classic':
        default:
            bulletColor = '#FFD700';
            glowColor = 'rgba(255, 215, 0, 0.5)';
            break;
    }
    
    ctx.fillStyle = bulletColor;
    player.bullets.forEach(bullet => {
        // 根据子弹样式调整形状
        if (gameSettings.bulletStyle === 'laser') {
            // 激光样式
            ctx.save();
            ctx.translate(bullet.x + bullet.width / 2, bullet.y);
            
            // 绘制激光束
            ctx.fillStyle = bulletColor;
            ctx.fillRect(-1, 0, 2, bullet.height);
            
            // 激光辉光效果
            ctx.fillStyle = glowColor;
            ctx.fillRect(-3, 0, 6, bullet.height + 4);
            
            ctx.restore();
        } else if (gameSettings.bulletStyle === 'fire') {
            // 火球样式
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 火球光芒
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width * 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 经典样式
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // 子弹发光效果
            ctx.fillStyle = glowColor;
            ctx.fillRect(bullet.x - 2, bullet.y - 2, bullet.width + 4, bullet.height + 4);
        }
    });
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        
        // 根据敌人类型绘制不同颜色
        let enemyColor;
        if (enemy.width === 40) enemyColor = '#FF6B6B'; // 小型敌机
        else if (enemy.width === 60) enemyColor = '#FFA500'; // 中型敌机
        else enemyColor = '#FF0000'; // 大型敌机
        
        ctx.fillStyle = enemyColor;
        
        // 绘制敌机形状
        ctx.beginPath();
        ctx.moveTo(0, enemy.height / 2);
        ctx.lineTo(-enemy.width / 2, -enemy.height / 2);
        ctx.lineTo(enemy.width / 2, -enemy.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // 敌机边框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制敌机细节
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-10, 0, 3, 0, Math.PI * 2);
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

// 绘制敌人子弹
function drawEnemyBullets() {
    ctx.fillStyle = '#FF0000';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 绘制爆炸效果
function drawExplosions() {
    explosions.forEach(explosion => {
        const progress = explosion.frame / explosion.maxFrames;
        const currentSize = explosion.size * (1 + progress);
        
        ctx.save();
        
        // 爆炸外环
        ctx.fillStyle = `rgba(255, 165, 0, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 爆炸内环
        ctx.fillStyle = `rgba(255, 69, 0, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, currentSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // 爆炸中心
        ctx.fillStyle = `rgba(255, 255, 0, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

// 事件监听器
// 键盘控制
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    
    // P键暂停/继续
    if (e.key.toLowerCase() === 'p') {
        if (isGameRunning && !isPaused) {
            pauseGame();
        } else if (isGameRunning && isPaused) {
            resumeGame();
        }
    }
    
    // ESC键优先级处理：先关闭设置面板，再处理游戏暂停/继续
    if (e.key === 'Escape') {
        e.preventDefault();
        if (settingsPanel.classList.contains('active')) {
            hideSettings();
        } else if (isGameRunning) {
            // 游戏运行中，暂停或继续游戏
            if (isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    }
    
    // M键打开设置面板
    if (e.key.toLowerCase() === 'm') {
        showSettings();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// 触摸控制
canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const touchY = e.touches[0].clientY - canvas.getBoundingClientRect().top;
    
    // 左半屏控制左右移动
    if (touchX < CANVAS_WIDTH / 2) {
        if (touchX < CANVAS_WIDTH / 4) {
            touchState.left = true;
        } else {
            touchState.right = true;
        }
    } 
    // 右半屏发射子弹
    else {
        shoot();
    }
    
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    
    // 重置触摸状态
    touchState.left = false;
    touchState.right = false;
    
    // 更新移动方向
    if (touchX < CANVAS_WIDTH / 2) {
        if (touchX < CANVAS_WIDTH / 4) {
            touchState.left = true;
        } else {
            touchState.right = true;
        }
    }
    
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    // 重置触摸状态
    touchState.left = false;
    touchState.right = false;
    
    e.preventDefault();
}, { passive: false });

// 按钮事件
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', initGame);
startGameBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', initGame);
resumeBtn.addEventListener('click', resumeGame);

// 设置面板按钮事件
settingsBtn.addEventListener('click', showSettings);
closeSettingsBtn.addEventListener('click', hideSettings);
applySettingsBtn.addEventListener('click', applySettings);

// 初始化返回大厅按钮事件
if (backToLobbyBtn) {
    backToLobbyBtn.addEventListener('click', backToLobby);
}

// 初始化游戏
initGame();
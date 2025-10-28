// 黄金矿工游戏核心逻辑

// 返回游戏大厅函数
function backToLobby() {
    if (confirm('确定要返回游戏大厅吗？当前游戏进度将会丢失。')) {
        // 清除游戏循环和定时器
        if (gameState.timeInterval) clearInterval(gameState.timeInterval);
        if (gameState.hookInterval) cancelAnimationFrame(gameState.hookInterval);
        if (gameState.swingAnimationId) cancelAnimationFrame(gameState.swingAnimationId);
        
        // 跳转到游戏大厅页面
        window.location.href = '../index_select.html';
    }
}

// 为返回按钮添加点击事件
const backToLobbyBtn = document.getElementById('backToLobbyBtn');
if (backToLobbyBtn) {
    backToLobbyBtn.addEventListener('click', backToLobby);
}

// 键盘事件：ESC键返回大厅
document.addEventListener('keydown', function(e) {
    if (e.code === 'Escape') {
        backToLobby();
    }
});

// 游戏设置对象
let gameSettings = {
    hookSpeed: localStorage.getItem('goldMinerHookSpeed') || 'normal',
    difficulty: localStorage.getItem('goldMinerDifficulty') || 'easy',
    theme: localStorage.getItem('goldMinerTheme') || 'classic',
    soundEnabled: localStorage.getItem('goldMinerSound') !== 'false'
};

// 游戏状态变量
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    time: 60,
    hookState: 'idle', // idle, throwing, retrieving
    hookAngle: 0,
    hookLength: 0,
    maxHookLength: 300,
    hookSpeed: getHookSpeedFromSetting(),
    items: [],
    timeInterval: null,
    hookInterval: null,
    targetScore: 1000, // 每关目标分数
    currentSwingAngle: 0,
    swingDirection: 1,
    swingAnimationId: null,
    hookedItem: null,
    hookedItemIndex: undefined
};

// 根据设置获取钩子速度
function getHookSpeedFromSetting() {
    switch(gameSettings.hookSpeed) {
        case 'slow':
            return 3;
        case 'normal':
            return 5;
        case 'fast':
            return 8;
        default:
            return 5;
    }
}

// 根据难度调整游戏参数
function adjustDifficultyParams() {
    switch(gameSettings.difficulty) {
        case 'easy':
            gameState.targetScore = 1000;
            gameState.time = 70;
            break;
        case 'medium':
            gameState.targetScore = 1500;
            gameState.time = 60;
            break;
        case 'hard':
            gameState.targetScore = 2000;
            gameState.time = 50;
            break;
        default:
            gameState.targetScore = 1000;
            gameState.time = 60;
    }
}

// DOM元素
const elements = {
    miner: document.getElementById('miner'),
    hook: document.getElementById('hook'),
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    time: document.getElementById('time'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    retrieveBtn: document.getElementById('retrieveBtn'),
    refreshMapBtn: null, // 将在initGame中初始化
    backToLobbyBtn: null, // 返回游戏大厅按钮
    gameArea: document.querySelector('.relative.bg-sky'),
    startScreen: document.getElementById('start-screen'),
    // 设置面板元素
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    applySettingsBtn: document.getElementById('applySettingsBtn'),
    soundEnabled: document.getElementById('soundEnabled')
};

// 游戏物品配置
const itemTypes = {
    gold: {
        value: 100,
        weight: 1,
        size: 20,
        color: '#FFD700',
        class: 'gold'
    },
    goldLarge: {
        value: 300,
        weight: 5, // 增加大黄金的重量，使其回收速度更慢
        size: 32,
        color: '#FFD700',
        class: 'gold-large'
    },
    stone: {
        value: 50,
        weight: 5,
        size: 24,
        color: '#696969',
        class: 'stone'
    },
    diamond: {
        value: 500,
        weight: 0.5,
        size: 24,
        color: '#B9F2FF',
        class: 'diamond'
    },
    bomb: {
        value: -200,
        weight: 1,
        size: 24,
        color: '#333',
        class: 'bomb'
    }
};

// 初始化游戏
function initGame() {
    // 创建刷新地图按钮
    createRefreshMapButton();
    
    // 初始化返回游戏大厅按钮引用
    createBackToLobbyButton();
    
    // 绑定事件监听器
    // 使用事件委托或确保只绑定一次事件
    if (elements.startBtn && !elements.startBtn._eventsBound) {
        elements.startBtn.addEventListener('click', toggleGame);
        elements.startBtn._eventsBound = true;
    }
    if (elements.pauseBtn && !elements.pauseBtn._eventsBound) {
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.pauseBtn._eventsBound = true;
    }
    if (elements.retrieveBtn && !elements.retrieveBtn._eventsBound) {
        elements.retrieveBtn.addEventListener('click', retrieveHook);
        elements.retrieveBtn._eventsBound = true;
    }
    if (elements.refreshMapBtn && !elements.refreshMapBtn._eventsBound) {
        elements.refreshMapBtn.addEventListener('click', refreshMap);
        elements.refreshMapBtn._eventsBound = true;
    }
    // 绑定设置相关按钮事件
    if (elements.settingsBtn && !elements.settingsBtn._eventsBound) {
        elements.settingsBtn.addEventListener('click', showSettings);
        elements.settingsBtn._eventsBound = true;
    }
    if (elements.closeSettingsBtn && !elements.closeSettingsBtn._eventsBound) {
        elements.closeSettingsBtn.addEventListener('click', hideSettings);
        elements.closeSettingsBtn._eventsBound = true;
    }
    if (elements.applySettingsBtn && !elements.applySettingsBtn._eventsBound) {
        elements.applySettingsBtn.addEventListener('click', applySettings);
        elements.applySettingsBtn._eventsBound = true;
    }
    
    // 绑定键盘事件，但确保只绑定一次
    if (!window._keydownEventBound) {
        document.addEventListener('keydown', handleKeyPress);
        window._keydownEventBound = true;
    }
    
    // 确保游戏区域隐藏
    elements.gameArea.style.opacity = '0';
    
    // 初始时不显示钩子动画
    elements.hook.style.animation = 'none';
    
    // 确保开始封面可见且在最上层
    if (elements.startScreen) {
        elements.startScreen.style.display = 'flex';
        elements.startScreen.style.zIndex = '100';
    }
    
    // 更新回收按钮状态
    updateRetrieveButtonState();
    
    // 初始化设置面板的值
    initSettingsPanel();
    
    // 不在初始化时生成物品，只在开始游戏时生成
}

// 创建刷新地图按钮
function createRefreshMapButton() {
    const buttonContainer = document.querySelector('.bg-slate-700.text-white');
    if (!buttonContainer) return;
    
    const refreshBtn = document.createElement('div');
    refreshBtn.id = 'refreshMapBtn';
    refreshBtn.className = 'hidden items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200';
    refreshBtn.innerHTML = '<i class="fa fa-refresh mr-2"></i>刷新地图 (F)';
    refreshBtn.style.fontSize = '14px';
    
    buttonContainer.appendChild(refreshBtn);
    elements.refreshMapBtn = refreshBtn;
}

// 初始化返回游戏大厅按钮引用
function createBackToLobbyButton() {
    // HTML中已经有返回按钮，只需要获取引用
    elements.backToLobbyBtn = document.getElementById('backToLobbyBtn');
}

// 刷新地图函数
function refreshMap() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // 隐藏刷新按钮
    if (elements.refreshMapBtn) {
        elements.refreshMapBtn.classList.remove('flex');
        elements.refreshMapBtn.classList.add('hidden');
    }
    
    // 生成新物品
    generateItems();
    
    // 显示刷新动画提示
    showRefreshAnimation();
}

// 显示设置面板
function showSettings() {
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.add('active');
        // 禁用背景游戏交互
        gameState.isPaused = true;
        if (gameState.isPlaying) {
            togglePause(); // 暂停游戏
        }
    }
}

// 隐藏设置面板
function hideSettings() {
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.remove('active');
        // 如果之前游戏是暂停状态，恢复游戏
        if (gameState.isPlaying && !gameState.wasPausedBeforeSettings) {
            togglePause(); // 恢复游戏
        }
    }
}

// 初始化设置面板的值
function initSettingsPanel() {
    // 设置钩子速度
    const hookSpeedOptions = document.getElementsByName('hookSpeed');
    hookSpeedOptions.forEach(option => {
        if (option.value === gameSettings.hookSpeed) {
            option.checked = true;
        }
    });
    
    // 设置难度
    const difficultyOptions = document.getElementsByName('difficulty');
    difficultyOptions.forEach(option => {
        if (option.value === gameSettings.difficulty) {
            option.checked = true;
        }
    });
    
    // 设置主题
    const themeOptions = document.getElementsByName('theme');
    themeOptions.forEach(option => {
        if (option.value === gameSettings.theme) {
            option.checked = true;
        }
    });
    
    // 设置音效
    if (elements.soundEnabled) {
        elements.soundEnabled.checked = gameSettings.soundEnabled;
    }
}

// 应用设置
function applySettings() {
    // 保存钩子速度设置
    const hookSpeedOptions = document.getElementsByName('hookSpeed');
    for (let i = 0; i < hookSpeedOptions.length; i++) {
        if (hookSpeedOptions[i].checked) {
            gameSettings.hookSpeed = hookSpeedOptions[i].value;
            localStorage.setItem('goldMinerHookSpeed', gameSettings.hookSpeed);
            break;
        }
    }
    
    // 保存难度设置
    const difficultyOptions = document.getElementsByName('difficulty');
    for (let i = 0; i < difficultyOptions.length; i++) {
        if (difficultyOptions[i].checked) {
            gameSettings.difficulty = difficultyOptions[i].value;
            localStorage.setItem('goldMinerDifficulty', gameSettings.difficulty);
            break;
        }
    }
    
    // 保存主题设置
    const themeOptions = document.getElementsByName('theme');
    for (let i = 0; i < themeOptions.length; i++) {
        if (themeOptions[i].checked) {
            gameSettings.theme = themeOptions[i].value;
            localStorage.setItem('goldMinerTheme', gameSettings.theme);
            break;
        }
    }
    
    // 保存音效设置
    if (elements.soundEnabled) {
        gameSettings.soundEnabled = elements.soundEnabled.checked;
        localStorage.setItem('goldMinerSound', gameSettings.soundEnabled);
    }
    
    // 应用设置到游戏
    gameState.hookSpeed = getHookSpeedFromSetting();
    if (gameState.isPlaying) {
        adjustDifficultyParams();
        updateScoreDisplay(); // 更新分数显示
    }
    
    // 应用主题
    applyTheme();
    
    // 显示设置成功提示
    showSettingApplied();
    
    // 隐藏设置面板
    hideSettings();
}

// 应用主题
function applyTheme() {
    const gameArea = elements.gameArea;
    const itemElements = document.querySelectorAll('.item');
    
    switch(gameSettings.theme) {
        case 'classic':
            gameArea.classList.remove('bg-blue-700', 'bg-cyan-900');
            gameArea.classList.add('bg-sky');
            break;
        case 'diamond':
            gameArea.classList.remove('bg-sky', 'bg-cyan-900');
            gameArea.classList.add('bg-blue-700');
            break;
        case 'deepsea':
            gameArea.classList.remove('bg-sky', 'bg-blue-700');
            gameArea.classList.add('bg-cyan-900');
            break;
    }
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

// 显示刷新动画
function showRefreshAnimation() {
    // 检查是否已存在刷新动画元素
    let refreshAnimation = document.getElementById('refreshAnimation');
    
    if (!refreshAnimation) {
        // 创建新的刷新动画元素
        refreshAnimation = document.createElement('div');
        refreshAnimation.id = 'refreshAnimation';
        refreshAnimation.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg text-center z-50';
        refreshAnimation.style.display = 'none';
        document.body.appendChild(refreshAnimation);
    }
    
    // 设置动画内容
    refreshAnimation.innerHTML = `
        <i class="fa fa-refresh fa-spin mr-2"></i> 地图已刷新！
    `;
    
    // 显示动画
    refreshAnimation.style.display = 'block';
    
    // 2秒后自动隐藏
    setTimeout(() => {
        refreshAnimation.style.display = 'none';
    }, 2000);
}


// 切换游戏状态
function toggleGame() {
    if (!gameState.isPlaying) {
        startGame();
    } else {
        resetGame();
    }
}

// 开始游戏
function startGame() {
    console.log('开始游戏');
    
    // 立即隐藏开始封面
    if (elements.startScreen) {
        elements.startScreen.style.display = 'none';
    }
    
    // 立即显示游戏区域（不使用淡入效果）
    elements.gameArea.style.opacity = '1';
    elements.gameArea.style.transition = 'none'; // 移除过渡效果
    
    // 重置游戏状态
    resetGameState();
    
    // 立即生成游戏物品
    generateItems();
    
    // 开始倒计时
    startCountdown();
    
    // 使用JavaScript控制的钩子摇摆，确保可以精确获取角度
    startHookSwing();
    
    // 更新按钮状态
    updateRetrieveButtonState();
}

// 暂停/恢复游戏
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.timeInterval);
        if (gameState.hookInterval) cancelAnimationFrame(gameState.hookInterval);
        if (gameState.swingAnimationId) cancelAnimationFrame(gameState.swingAnimationId);
        elements.pauseBtn.innerHTML = '<i class="fa fa-play mr-2"></i>继续游戏';
        elements.gameArea.style.opacity = '0.7';
    } else {
        startCountdown();
        if (gameState.hookState !== 'idle') {
            startHookAnimation();
        } else {
            // 恢复摇摆动画
            startHookSwing();
        }
        elements.pauseBtn.innerHTML = '<i class="fa fa-pause mr-2"></i>暂停游戏';
        elements.gameArea.style.opacity = '1';
    }
    
    // 更新回收按钮状态
    updateRetrieveButtonState();
}

// 处理键盘输入
function handleKeyPress(e) {
    if (e.code === 'Space') {
        if (!gameState.isPlaying) {
            // 游戏未开始时，空格键开始游戏
            startGame();
        } else if (gameState.hookState === 'idle' && !gameState.isPaused) {
            // 游戏进行中，空格键抛出钩子
            throwHook();
        }
    } else if (e.code === 'KeyP') {
        // P键用于暂停/继续游戏
        if (gameState.isPlaying) {
            togglePause();
        }
    } else if (e.code === 'KeyR') {
        // R键用于回收钩子
        if (gameState.isPlaying && !gameState.isPaused && gameState.hookState === 'throwing') {
            retrieveHook();
        }
    } else if (e.code === 'KeyF') {
        // F键用于刷新地图
        if (gameState.isPlaying && !gameState.isPaused && 
            elements.refreshMapBtn && !elements.refreshMapBtn.classList.contains('hidden')) {
            refreshMap();
        }
    } else if (e.code === 'Escape') {
        // ESC键返回游戏大厅
        e.preventDefault(); // 防止默认行为
        backToLobby();
    }
}

// 已经在文件开头定义了backToLobby函数，这里不再重复定义

// 开始倒计时
function startCountdown() {
    clearInterval(gameState.timeInterval);
    gameState.timeInterval = setInterval(() => {
        if (gameState.isPaused) return;
        
        gameState.time--;
        elements.time.textContent = gameState.time;
        
        if (gameState.time <= 0) {
            endLevel();
        }
    }, 1000);
}

// 抛出钩子 - 根据当前摇摆角度抛出
function throwHook() {
    if (gameState.hookState !== 'idle') return;
    
    gameState.hookState = 'throwing';
    gameState.hookLength = 0;
    
    // 清除摇摆动画
    if (gameState.swingAnimationId) {
        cancelAnimationFrame(gameState.swingAnimationId);
    }
    
    // 清除任何正在运行的钩子动画
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    
    // 使用JavaScript控制的动画中保存的当前角度
    gameState.hookAngle = gameState.currentSwingAngle || 0;
    
    // 确保钩子在抛出时正确定位
    elements.hook.style.transformOrigin = 'top center';
    elements.hook.style.transform = `translateX(-50%) rotate(${gameState.hookAngle}deg)`;
    elements.hook.style.top = '29%';
    elements.hook.style.left = '50%';
    elements.hook.style.animation = 'none'; // 确保CSS动画被禁用
    
    // 强制重绘
    elements.hook.offsetHeight;
    
    startHookAnimation();
}

// 使用JavaScript控制钩子摇摆动画 - 精确控制角度，确保钩子能从不同位置抛出
function startHookSwing() {
    if (gameState.swingAnimationId) {
        cancelAnimationFrame(gameState.swingAnimationId);
    }
    
    // 初始化摇摆相关状态
    if (gameState.currentSwingAngle === undefined) {
        gameState.currentSwingAngle = 0;
    }
    if (gameState.swingDirection === undefined) {
        gameState.swingDirection = 1; // 1表示向右，-1表示向左
    }
    
    gameState.swingSpeed = 1.2; // 摇摆速度
    gameState.maxSwingAngle = 45; // 最大摇摆角度
    
    function animateSwing() {
        if (gameState.isPaused || gameState.hookState !== 'idle') return;
        
        // 更新摇摆角度
        gameState.currentSwingAngle += gameState.swingSpeed * gameState.swingDirection;
        
        // 检测是否到达最大角度，反转方向
        if (gameState.currentSwingAngle >= gameState.maxSwingAngle || 
            gameState.currentSwingAngle <= -gameState.maxSwingAngle) {
            gameState.swingDirection *= -1;
        }
        
        // 应用当前角度到钩子
        elements.hook.style.transformOrigin = 'top center';
        elements.hook.style.transform = `translateX(-50%) rotate(${gameState.currentSwingAngle}deg)`;
        
        // 继续动画
        gameState.swingAnimationId = requestAnimationFrame(animateSwing);
    }
    
    // 开始动画
    gameState.swingAnimationId = requestAnimationFrame(animateSwing);
}

// 开始钩子动画 - 使用requestAnimationFrame提高性能
function startHookAnimation() {
    // 清除可能存在的interval
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    
    // 提高钩子速度
    gameState.hookSpeed = 7; // 增加速度
    
    function animateHook() {
        if (gameState.isPaused) return;
        
        if (gameState.hookState === 'throwing') {
            gameState.hookLength += gameState.hookSpeed;
            
            // 更新钩子长度 - 使用直接DOM操作
            const hookLine = elements.hook.querySelector('div:first-child');
            if (hookLine) {
                hookLine.style.height = gameState.hookLength + 'px';
            }
            
            // 检查是否达到最大长度或触底
            if (gameState.hookLength >= gameState.maxHookLength || 
                checkHookCollision()) {
                retrieveHook();
                return; // 退出当前动画循环
            }
        } else if (gameState.hookState === 'retrieving') {
            // 未钩中物品时，使用更快的回收速度
            const speedFactor = gameState.hookedItem ? 
                gameState.hookedItem.weight * 0.4 : 1.5; // 未钩中时更快
            
            gameState.hookLength -= gameState.hookSpeed * speedFactor;
            
            // 更新钩子长度
            const hookLine = elements.hook.querySelector('div:first-child');
            if (hookLine) {
                hookLine.style.height = gameState.hookLength + 'px';
            }
            
            // 更新被钩住物品的位置
            if (gameState.hookedItem && gameState.hookedItem.element) {
                // 优化：缓存元素引用
                const itemElement = gameState.hookedItem.element;
                const radians = (gameState.hookAngle * Math.PI) / 180;
                const x = (16 / 2) + Math.sin(radians) * gameState.hookLength; // 假设hook宽度为16px
                const y = gameState.hookLength;
                
                itemElement.style.left = x + 'px';
                itemElement.style.top = y + 'px';
            }
            
            // 检查是否收回
            if (gameState.hookLength <= 0) {
                completeHookAction();
                return; // 退出当前动画循环
            }
        }
        
        // 继续动画循环
        gameState.hookInterval = requestAnimationFrame(animateHook);
    }
    
    // 开始动画循环
    gameState.hookInterval = requestAnimationFrame(animateHook);
}

// 收回钩子 - 立即开始回收过程
function retrieveHook() {
    if (gameState.hookState !== 'throwing' || gameState.isPaused || !gameState.isPlaying) return;
    
    gameState.hookState = 'retrieving';
    
    // 立即开始回收动画
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    startHookAnimation();
    
    // 更新按钮状态
    updateRetrieveButtonState();
}

// 更新回收按钮状态
function updateRetrieveButtonState() {
    if (!elements.retrieveBtn) return;
    
    if (gameState.isPlaying && !gameState.isPaused && gameState.hookState === 'throwing') {
        elements.retrieveBtn.disabled = false;
        elements.retrieveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        elements.retrieveBtn.disabled = true;
        elements.retrieveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// 检查钩子碰撞
function checkHookCollision() {
    const hookLine = elements.hook.querySelector('div:first-child');
    const hookTip = elements.hook.querySelector('div:last-child');
    const gameAreaRect = elements.gameArea.getBoundingClientRect();
    
    // 获取钩子线和钩子末端的位置信息
    const hookLineRect = hookLine.getBoundingClientRect();
    const hookTipRect = hookTip.getBoundingClientRect();
    
    // 检查是否触底
    if (hookTipRect.bottom >= gameAreaRect.bottom) {
        return true;
    }
    
    // 检查是否钩到物品 - 改进的碰撞检测
    for (let i = 0; i < gameState.items.length; i++) {
        const item = gameState.items[i];
        if (!item.element) continue;
        
        const itemRect = item.element.getBoundingClientRect();
        
        // 检查钩子末端是否碰到物品（原有逻辑，但使用宽松检测）
        if (isCollidingWithTolerance(hookTipRect, itemRect, 5)) {
            hookItem(item, i);
            return false; // 不触底，继续收回
        }
        
        // 检查钩子线是否碰到物品（新增逻辑）
        if (isCollidingWithTolerance(hookLineRect, itemRect, 8)) {
            hookItem(item, i);
            return false; // 不触底，继续收回
        }
    }
    
    return false;
}

// 钩子抓住物品
function hookItem(item, index) {
    gameState.hookedItem = item;
    gameState.hookedItemIndex = index;
    
    // 添加钩子动画
    if (item.element) {
        item.element.classList.add('hooked');
    }
    
    retrieveHook();
}

// 计算关卡目标分数
function calculateLevelTarget(level) {
    // 每个关卡目标分数逐渐增加
    return 1000 * level;
}

// 显示下一阶段目标信息
function showLevelTargetInfo() {
    // 检查是否已存在目标信息元素
    let targetInfo = document.getElementById('levelTargetInfo');
    
    if (!targetInfo) {
        // 创建新的目标信息元素
        targetInfo = document.createElement('div');
        targetInfo.id = 'levelTargetInfo';
        targetInfo.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white px-8 py-4 rounded-lg shadow-lg text-center z-50';
        targetInfo.style.display = 'none';
        document.body.appendChild(targetInfo);
    }
    
    // 更新目标分数信息
    const nextLevel = gameState.level + 1;
    const nextTarget = calculateLevelTarget(nextLevel);
    targetInfo.innerHTML = `
        <h3 class="text-xl font-bold mb-2">下一阶段目标</h3>
        <p class="text-lg">达到 <span class="font-bold">${nextTarget}</span> 分</p>
        <p class="text-sm mt-2 opacity-80">继续收集黄金！</p>
    `;
    
    // 显示目标信息
    targetInfo.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        targetInfo.style.display = 'none';
    }, 3000);
}

// 完成钩子动作
function completeHookAction() {
    // 清除钩子动画
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    
    // 处理钩到的物品
    if (gameState.hookedItem) {
        // 增加分数 - 使用updateScore函数保持一致的显示格式
        updateScore(gameState.hookedItem.value);
        
        // 移除物品
        if (gameState.hookedItem.element && gameState.hookedItem.element.parentNode) {
            gameState.hookedItem.element.parentNode.removeChild(gameState.hookedItem.element);
        }
        
        // 从物品数组中移除
        if (gameState.hookedItemIndex !== undefined && gameState.hookedItemIndex >= 0 && 
            gameState.hookedItemIndex < gameState.items.length) {
            gameState.items.splice(gameState.hookedItemIndex, 1);
        }
        
        // 清空被钩住的物品
        gameState.hookedItem = null;
        gameState.hookedItemIndex = undefined;
        
        console.log(`剩余物品数量: ${gameState.items.length}`);
    }
    
    // 检查是否收集完所有物品
    if (gameState.items.length === 0) {
        // 自动刷新地图
        refreshMap();
        
        // 显示下一阶段目标信息
        showLevelTargetInfo();
    } else if (gameState.items.length <= 2 && elements.refreshMapBtn) {
        // 当物品数量少于2但不为0时，显示刷新地图按钮
        elements.refreshMapBtn.classList.remove('hidden');
        elements.refreshMapBtn.classList.add('flex');
    }
    
    // 不再自动生成新物品，改为由用户手动控制
    
    // 重置钩子位置和状态
    gameState.hookState = 'idle';
    gameState.hookLength = 0;
    
    // 更新钩子DOM
    elements.hook.style.transform = 'translateX(-50%) rotate(0deg)';
    elements.hook.style.transformOrigin = 'top center';
    elements.hook.style.top = '29%';
    elements.hook.style.left = '50%';
    
    // 重置钩子线长度
    const hookLine = elements.hook.querySelector('div:first-child');
    if (hookLine) {
        hookLine.style.height = '32px'; // 恢复初始长度
    }
    
    // 确保CSS动画被禁用
    elements.hook.style.animation = 'none';
    
    // 更新回收按钮状态
    updateRetrieveButtonState();
    
    // 重置摇摆状态
    gameState.currentSwingAngle = 0;
    gameState.swingDirection = 1;
    
    // 重新开始摇摆动画
    startHookSwing();
}


// 收集物品 - 与hookItem功能重复，可以移除或合并
function collectItem(item, index) {
    // 移除物品元素
    if (item.element) {
        item.element.remove();
    }
    
    // 移除物品数据
    if (index >= 0 && index < gameState.items.length) {
        gameState.items.splice(index, 1);
    }
    
    // 更新分数
    updateScore(item.value);
    
    // 特殊处理炸弹
    if (item.type === 'bomb') {
        showExplosion();
    }
    
    // 检查物品数量，及时生成新物品
    if (gameState.items.length <= 0) {
        generateItems();
    }
}

// 更新分数
function updateScore(points) {
    gameState.score += points;
    
    // 更新分数显示，采用"当前分数/目标分数"格式
    const scoreText = `${gameState.score}/${gameState.targetScore}`;
    elements.score.textContent = scoreText;
    
    // 根据分数是否达到或超过目标分数设置颜色
    if (gameState.score >= gameState.targetScore) {
        elements.score.classList.remove('text-red-500');
        elements.score.classList.add('text-green-500');
    } else {
        elements.score.classList.remove('text-green-500');
        elements.score.classList.add('text-red-500');
    }
    
    // 显示分数动画
    showScorePopup(points);
}

// 显示分数弹出
function showScorePopup(points) {
    const popup = document.createElement('div');
    popup.className = 'absolute text-white font-bold text-lg';
    popup.textContent = points > 0 ? `+${points}` : points;
    popup.style.color = points > 0 ? '#4CAF50' : '#F44336';
    popup.style.top = '50px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.zIndex = '5';
    
    elements.gameArea.appendChild(popup);
    
    // 动画
    let position = 50;
    let opacity = 1;
    
    const animation = setInterval(() => {
        position -= 2;
        opacity -= 0.05;
        
        popup.style.top = position + 'px';
        popup.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(animation);
            popup.remove();
        }
    }, 20);
}

// 显示爆炸效果
function showExplosion() {
    const explosion = document.createElement('div');
    explosion.className = 'absolute bg-orange-500 rounded-full';
    explosion.style.width = '40px';
    explosion.style.height = '40px';
    explosion.style.top = '20px';
    explosion.style.left = '50%';
    explosion.style.transform = 'translateX(-50%)';
    explosion.style.zIndex = '15';
    
    elements.gameArea.appendChild(explosion);
    
    // 爆炸动画
    let size = 40;
    let opacity = 1;
    
    const animation = setInterval(() => {
        size += 10;
        opacity -= 0.1;
        
        explosion.style.width = size + 'px';
        explosion.style.height = size + 'px';
        explosion.style.transform = `translate(-50%, -50%)`;
        explosion.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(animation);
            explosion.remove();
        }
    }, 30);
}

// 生成游戏物品 - 优化地图更新逻辑，确保每次生成新物品前完全清理旧物品
function generateItems() {
    console.log('生成新物品');
    
    // 清除现有物品元素
    gameState.items.forEach(item => {
        if (item.element && item.element.parentNode) {
            item.element.parentNode.removeChild(item.element);
        }
    });
    
    // 清空物品数组
    gameState.items = [];
    
    // 使用固定尺寸而不是getBoundingClientRect，减少重排
    const gameAreaWidth = elements.gameArea.offsetWidth || 400;
    const gameAreaHeight = elements.gameArea.offsetHeight || 300;
    
    // 调整物品数量，根据关卡调整并增加基础数量
    const baseCount = 8;
    const levelBonus = Math.min(gameState.level - 1, 4); // 最多额外增加4个物品
    const itemCount = baseCount + levelBonus;
    
    // 批量创建物品，减少DOM操作
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < itemCount; i++) {
        // 简化的物品类型选择
        let type;
        const rand = Math.random();
        
        if (gameState.level > 3 && rand < 0.1) {
            type = 'diamond';
        } else if (rand < 0.4) {
            type = 'gold';
        } else if (rand < 0.6) {
            type = 'stone';
        } else if (rand < 0.85) {
            type = 'goldLarge';
        } else {
            type = 'bomb';
        }
        
        const itemType = itemTypes[type];
        
        // 创建物品元素
        const item = document.createElement('div');
        item.className = `game-item ${itemType.class}`;
        item.style.width = itemType.size + 'px';
        item.style.height = itemType.size + 'px';
        
        // 随机位置 - 限制在钩子可到达的范围内
        // 钩子从顶部中间位置抛出，所以X坐标范围需要限制在中间区域附近
        const centerX = gameAreaWidth / 2;
        // 钩子摆动角度大约在±60度，所以X坐标范围应该在中心左右各1/3的宽度
        const maxXOffset = gameAreaWidth / 3;
        const x = centerX + (Math.random() * maxXOffset * 2 - maxXOffset) + itemType.size;
        // 确保X坐标在游戏区域内
        const clampedX = Math.max(itemType.size, Math.min(gameAreaWidth - itemType.size, x));
        
        // Y坐标也需要限制，确保钩子可以到达
        // 从游戏区域中间偏下位置开始，但不要太低
        const minY = gameAreaHeight * 0.4;
        const maxY = gameAreaHeight * 0.8; // 不要太靠近底部，确保钩子可以到达
        const y = minY + Math.random() * (maxY - minY);
        
        item.style.left = clampedX + 'px';
        item.style.top = y + 'px';
        
        // 先添加到文档片段
        fragment.appendChild(item);
        
        // 同时记录到数组
        gameState.items.push({
            type: type,
            value: itemType.value,
            weight: itemType.weight,
            size: itemType.size,
            element: item
        });
    }
    
    // 一次性添加所有物品
    elements.gameArea.appendChild(fragment);
}

// 重置游戏状态
function resetGameState() {
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.hookState = 'idle';
    gameState.hookLength = 0;
    gameState.currentSwingAngle = 0;
    gameState.swingDirection = 1;
    
    // 确保分数、关卡和目标分数正确初始化
    if (gameState.score === 0) {
        // 首次开始游戏时设置初始值
        gameState.level = 1;
        gameState.time = 60;
        gameState.targetScore = calculateLevelTarget(gameState.level);
        
        // 更新UI显示
        elements.level.textContent = gameState.level;
        elements.time.textContent = gameState.time;
    }
    
    // 初始化分数显示，采用"当前分数/目标分数"格式
    elements.score.textContent = `${gameState.score}/${gameState.targetScore}`;
    
    // 初始分数小于目标分数，设置为红色
    elements.score.classList.remove('text-green-500');
    elements.score.classList.add('text-red-500');
    
    elements.startBtn.innerHTML = '<i class="fa fa-refresh mr-2"></i>重新开始';
}

// 结束关卡
function endLevel() {
    // 正确清除不同类型的定时器
    if (gameState.timeInterval) {
        clearInterval(gameState.timeInterval);
    }
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    if (gameState.swingAnimationId) {
        cancelAnimationFrame(gameState.swingAnimationId);
    }
    
    if (gameState.score >= gameState.targetScore) {
        // 关卡完成
        showLevelComplete();
    } else {
        // 游戏结束
        showGameOver();
    }
}

// 显示升级提示
function showLevelUpMessage() {
    // 创建升级提示元素
    const levelUpMessage = document.createElement('div');
    levelUpMessage.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-10 py-5 rounded-xl shadow-2xl text-center z-50';
    
    // 计算下一阶段目标
    const nextTarget = calculateLevelTarget(gameState.level + 1);
    
    levelUpMessage.innerHTML = `
        <h2 class="text-3xl font-bold mb-3">🎉 升级了！</h2>
        <p class="text-xl">当前关卡: ${gameState.level}</p>
        <p class="mt-2 text-lg">下一阶段目标: ${nextTarget} 分</p>
    `;
    
    // 添加到页面
    document.body.appendChild(levelUpMessage);
    
    // 3秒后移除
    setTimeout(() => {
        levelUpMessage.remove();
    }, 3000);
}

// 显示关卡完成
function showLevelComplete() {
    const levelComplete = document.createElement('div');
    levelComplete.id = 'levelComplete';
    levelComplete.innerHTML = `
        <h2>关卡完成！</h2>
        <p>得分: ${gameState.score}</p>
        <p>目标分数: ${gameState.targetScore}</p>
        <button id="nextLevelBtn">下一关</button>
    `;
    
    elements.gameArea.appendChild(levelComplete);
    
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        levelComplete.remove();
        nextLevel();
    });
}

// 下一关
function nextLevel() {
    // 清理当前物品
    gameState.items.forEach(item => {
        if (item.element) item.element.remove();
    });
    gameState.items = [];
    
    // 更新游戏状态
    gameState.level++;
    gameState.time = 60;
    gameState.targetScore = Math.floor(gameState.targetScore * 1.5);
    
    // 更新UI
    elements.level.textContent = gameState.level;
    elements.time.textContent = gameState.time;
    
    // 生成新物品
    generateItems();
    
    // 重新开始计时
    startCountdown();
}

// 显示游戏结束
function showGameOver() {
    const gameOver = document.createElement('div');
    gameOver.id = 'gameOver';
    gameOver.innerHTML = `
        <h2>游戏结束</h2>
        <p>最终得分: ${gameState.score}</p>
        <p>达到关卡: ${gameState.level}</p>
        <button id="restartBtn">重新开始</button>
    `;
    
    elements.gameArea.appendChild(gameOver);
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        gameOver.remove();
        resetGame();
    });
}

// 重置游戏
function resetGame() {
    // 清除定时器
    if (gameState.timeInterval) {
        clearInterval(gameState.timeInterval);
    }
    if (gameState.hookInterval) {
        cancelAnimationFrame(gameState.hookInterval);
    }
    if (gameState.swingAnimationId) {
        cancelAnimationFrame(gameState.swingAnimationId);
    }
    
    // 清理物品
    gameState.items.forEach(item => {
        if (item.element) item.element.remove();
    });
    
    // 重置游戏状态
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.time = 60;
    gameState.hookState = 'idle';
    gameState.hookLength = 0;
    gameState.items = [];
    gameState.targetScore = 1000;
    
    // 确保开始封面可见
    if (elements.startScreen) {
        elements.startScreen.style.display = 'flex';
    }
    
    // 重置UI
    elements.score.textContent = '0';
    elements.level.textContent = '1';
    elements.time.textContent = '60';
    elements.startBtn.innerHTML = '<i class="fa fa-play mr-2"></i>开始游戏';
    elements.pauseBtn.innerHTML = '<i class="fa fa-pause mr-2"></i>暂停游戏';
    elements.hook.querySelector('div:first-child').style.height = '32px';
    elements.hook.style.transform = 'translateX(-50%) rotate(0deg)';
    elements.hook.style.animation = 'none'; // 重置时不显示动画
    elements.gameArea.style.opacity = '0'; // 隐藏游戏区域
    
    // 生成新物品
    generateItems();
}

// 辅助函数：带容差的碰撞检测
// tolerance参数增加碰撞判定的容差范围，提高游戏体验
function isCollidingWithTolerance(rect1, rect2, tolerance = 0) {
    return !(rect1.right + tolerance < rect2.left || 
             rect1.left > rect2.right + tolerance || 
             rect1.bottom + tolerance < rect2.top || 
             rect1.top > rect2.bottom + tolerance);
}

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

// 游戏启动
window.addEventListener('DOMContentLoaded', function() {
    initGame();
    preventScrolling(); // 游戏加载后立即阻止滚动
});
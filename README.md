# 游戏乐园 (Project_001)

一个包含多个经典HTML5小游戏的网页游戏集合。

## 游戏列表

### 1. 黄金矿工 (Gold Miner)
- **路径**: `gold_miner/index.html`
- **类型**: 休闲益智
- **玩法**: 使用钩子抓取金矿和其他物品，收集金矿获得分数

### 2. 贪吃蛇 (Snake)
- **路径**: `snake/index.html`
- **类型**: 经典街机
- **玩法**: 控制蛇的移动方向，吃掉食物使蛇变长，避免撞墙或撞到自身

### 3. 雷霆飞机 (Thunder Plane)
- **路径**: `thunder_plane/thunder-plane.html`
- **类型**: 射击游戏
- **玩法**: 控制飞机躲避敌机攻击并击落敌人

### 4. 坦克大战 (Tank War)
- **路径**: `tank_war/index.html`
- **类型**: 动作射击
- **玩法**: 驾驶坦克消灭敌人并保护基地

## 快速开始

### 运行游戏大厅
直接在浏览器中打开 `index.html` 即可进入游戏选择页面。

### 运行独立游戏
直接打开对应游戏的 `index.html` 文件即可开始游戏。

### 运行服务器（可选）
```bash
node server.js
```
或
```bash
node simple_server.js
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript
- **后端**: Node.js (服务器)
- **游戏引擎**: Canvas API
- **样式框架**: Font Awesome, Google Fonts

## 目录结构

```
Project_001/
├── index.html          # 游戏大厅主页
├── gold_miner/         # 黄金矿工游戏
│   ├── index.html
│   ├── game.js
│   └── style.css
├── snake/              # 贪吃蛇游戏
│   ├── index.html
│   ├── game.js
│   ├── script.js
│   └── style.css
├── thunder_plane/      # 雷霆飞机游戏
│   ├── thunder-plane.html
│   ├── thunder-plane.js
│   └── thunder-plane.css
├── tank_war/           # 坦克大战游戏
│   ├── index.html
│   ├── game.js
│   └── style.css
└── server.js           # Node.js 服务器
```

## 控制方式

- **方向键**: 控制角色移动
- **鼠标**: 部分游戏支持鼠标操作
- **空格键/点击**: 射击或确认
- **ESC键**: 返回游戏大厅

## 运行要求

- 现代浏览器（Chrome, Firefox, Safari, Edge等）
- 启用JavaScript

## 许可证

本项目仅供学习交流使用。

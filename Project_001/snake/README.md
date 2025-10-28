# 游戏项目集合

本目录包含两个独立的HTML5游戏：贪吃蛇游戏和雷霆飞机游戏，分别存放在不同的文件夹中。

## 项目结构说明

### 共享文件：
- **server.js** - 本地开发服务器脚本，用于预览两个游戏
- **README.md** - 项目总览说明
- **index_select.html** - 游戏选择页面

### 贪吃蛇游戏文件夹：**snake/**
- **index.html** - 贪吃蛇游戏主页面
- **style.css** - 贪吃蛇游戏样式
- **script.js** - 贪吃蛇游戏逻辑
- **README_snake.md** - 贪吃蛇游戏详细说明

### 雷霆飞机游戏文件夹：**thunder_plane/**
- **thunder-plane.html** - 雷霆飞机游戏主页面
- **thunder-plane.css** - 雷霆飞机游戏样式
- **thunder-plane.js** - 雷霆飞机游戏逻辑
- **README_plane.md** - 雷霆飞机游戏详细说明

## 如何运行游戏

### 方法一：直接打开HTML文件
- 贪吃蛇游戏：进入snake文件夹，双击打开 `index.html`
- 雷霆飞机游戏：进入thunder_plane文件夹，双击打开 `thunder-plane.html`

### 方法二：使用本地服务器（推荐）
1. 确保已安装Node.js
2. 在项目根目录下运行命令：`node server.js`
3. 打开浏览器访问：
   - 游戏选择页面：http://localhost:8080/
   - 贪吃蛇游戏：http://localhost:8080/snake/index.html
   - 雷霆飞机游戏：http://localhost:8080/thunder_plane/thunder-plane.html
const http = require('http');
const fs = require('fs');
const path = require('path');

// 使用端口8081避免冲突
const PORT = 8081;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 处理根路径请求
    let filePath = req.url === '/' ? '/index_select.html' : req.url;
    
    // 构建完整的文件路径
    const fullPath = path.join(__dirname, filePath);
    
    // 确定MIME类型
    const extname = path.extname(fullPath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }
    
    // 读取文件并发送响应
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在，返回404错误
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>文件未找到</p>', 'utf8');
            } else {
                // 服务器错误
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>500 Internal Server Error</h1><p>错误: ${err.code}</p>`, 'utf8');
            }
        } else {
            // 成功读取文件，发送内容
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`游戏选择页面: http://localhost:${PORT}`);
    console.log(`贪吃蛇游戏: http://localhost:${PORT}/snake/index.html`);
    console.log(`雷霆飞机游戏: http://localhost:${PORT}/thunder_plane/thunder-plane.html`);
});
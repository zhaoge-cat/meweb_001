const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// 简单的文件服务器
const server = http.createServer((req, res) => {
    // 处理请求路径
    let filePath = req.url === '/' ? '/index_select.html' : req.url;
    
    // 构建完整的文件路径
    const fullPath = path.join(__dirname, filePath);
    
    // 获取文件扩展名
    const extname = path.extname(fullPath);
    
    // 设置MIME类型
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.html': contentType = 'text/html'; break;
    }
    
    // 读取并提供文件
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`访问 http://localhost:${PORT} 选择游戏`);
    console.log(`贪吃蛇游戏: http://localhost:${PORT}/snake/index.html`);
    console.log(`雷霆飞机游戏: http://localhost:${PORT}/thunder_plane/thunder-plane.html`);
});
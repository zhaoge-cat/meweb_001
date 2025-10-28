const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;

// 更完整的MIME类型支持
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// 检查文件是否存在的辅助函数
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

const server = http.createServer((req, res) => {
    console.log('Request for: ' + req.url);
    
    // 移除URL中的查询参数
    const urlWithoutQuery = req.url.split('?')[0];
    
    // 处理特殊请求：忽略@vite/client请求
    if (urlWithoutQuery === '/@vite/client') {
        console.log('忽略Vite客户端请求');
        res.writeHead(204);
        res.end();
        return;
    }
    
    // 处理根路径
    let filePath = urlWithoutQuery;
    
    // 如果是根路径，指向index_select.html
    if (filePath === '/') {
        filePath = '/index_select.html';
    }
    
    // 处理目录请求
    if (filePath.endsWith('/')) {
        filePath += 'index.html';
    }
    
    // 安全检查：防止路径遍历攻击
    if (filePath.includes('..')) {
        console.log('阻止路径遍历攻击尝试');
        res.writeHead(403);
        res.end('禁止访问');
        return;
    }
    
    // 构建完整路径
    const fullPath = path.join(__dirname, filePath.substring(1)); // 移除开头的'/'
    
    // 检查文件是否存在
    if (!fileExists(fullPath)) {
        console.log(`文件不存在: ${fullPath}`);
        res.writeHead(404);
        res.end(`文件未找到: ${filePath}`);
        return;
    }
    
    // 确定MIME类型
    const extname = path.extname(fullPath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 读取并发送文件
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            console.error('读取文件错误:', err);
            res.writeHead(500);
            res.end('服务器读取文件错误');
            return;
        }
        
        // 发送成功响应
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Content-Length': content.length,
            'Cache-Control': 'max-age=0' // 禁用缓存以便调试
        });
        console.log(`成功发送文件: ${filePath}, 内容类型: ${contentType}`);
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
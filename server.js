'use strict';
// Static server cho site AI-SDLC — zero dependency.
// Chạy: node server.js   (mặc định port 3200)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3200);
const ROOT = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const target = path.join(ROOT, path.normalize(urlPath).replace(/^([/\\])+/, ''));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(target, (err, st) => {
    // Thư mục -> phục vụ index.html bên trong (VD: /mau/ -> /mau/index.html)
    if (!err && st.isDirectory()) {
      const idx = path.join(target, 'index.html');
      fs.stat(idx, (e2, s2) => {
        if (e2 || !s2.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404</h1><p><a href="/">Về trang chủ AI-SDLC</a></p>');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
        fs.createReadStream(idx).pipe(res);
      });
      return;
    }
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p><a href="/">Về trang chủ AI-SDLC</a></p>');
      return;
    }
    const type = MIME[path.extname(target).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': 'public, max-age=300' };
    if (type === 'application/pdf' || target.endsWith('.txt')) {
      headers['Content-Disposition'] = `inline; filename="${path.basename(target)}"`;
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AI-SDLC site: http://localhost:${PORT}/  (root: ${ROOT})`);
});

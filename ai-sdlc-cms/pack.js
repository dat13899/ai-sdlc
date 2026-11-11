'use strict';
// Đóng gói bản triển khai vào deploy/: chỉ những gì server cần để chạy.
// Không có node_modules, data/, mã nguồn React — host tự `npm install` từ package.json.
// Chạy: npm run pack   (tự build web/ trước)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'deploy');

execSync('npm --prefix web run build', { stdio: 'inherit', cwd: ROOT });

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
const copy = (rel) => fs.cpSync(path.join(ROOT, rel), path.join(OUT, rel), { recursive: true });
['server.js', 'lib', 'process.json', 'package-lock.json', 'README.md', 'web/dist'].forEach(copy);

// package.json chỉ giữ lệnh start (các lệnh khác cần file không có trong gói)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
pkg.scripts = { start: 'node server.js' };
delete pkg.devDependencies; // công cụ triển khai (ssh2-sftp-client) không cần trên server
fs.writeFileSync(path.join(OUT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

const size = (p) => fs.statSync(p).isDirectory() ? fs.readdirSync(p).reduce((n, f) => n + size(path.join(p, f)), 0) : fs.statSync(p).size;
console.log(`\ndeploy/ sẵn sàng: ${(size(OUT) / 1024).toFixed(0)} KB`);

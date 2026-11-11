'use strict';
// Chế độ phát triển: chạy cùng lúc
//   - API: node --watch server.js  → sửa server.js / lib/ là tự khởi động lại (cổng 3300)
//   - Giao diện: Vite (cổng 5173) → sửa web/src là trình duyệt cập nhật ngay (HMR), /api chuyển sang 3300
// Mở http://localhost:5173. Ctrl+C dừng cả hai.
const { spawn } = require('child_process');
const path = require('path');

const API_PORT = process.env.PORT || '3300'; // đổi cổng API: PORT=3302 npm run dev
const env = { ...process.env, PORT: API_PORT, API_PORT };
const procs = [
  spawn(process.execPath, ['--watch-path=server.js', '--watch-path=lib', '--watch-path=process.json', 'server.js'], { stdio: 'inherit', cwd: __dirname, env }),
  spawn('npm', ['run', 'dev'], { stdio: 'inherit', cwd: path.join(__dirname, 'web'), shell: true, env }),
];
const stop = () => { for (const p of procs) if (!p.killed) p.kill(); process.exit(); };
for (const p of procs) p.on('exit', (code) => { if (code) { console.error(`Một tiến trình dừng với mã ${code}, dừng tất cả.`); stop(); } });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

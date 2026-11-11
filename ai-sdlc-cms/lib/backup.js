'use strict';
// Sao lưu thư mục dữ liệu mỗi ngày một bản, giữ KEEP bản gần nhất.
// Đặt BACKUP_DIR trên ổ / thư mục khác máy chủ (vd ổ mạng) — sao lưu cùng ổ không cứu được khi hỏng ổ.
const fs = require('fs');
const path = require('path');

const KEEP = 14;
const stamp = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Tạo bản sao lưu của hôm nay nếu chưa có; trả về tên thư mục hoặc null khi đã có.
function runBackup(dataDir, backupDir, now = new Date()) {
  const name = `data-${stamp(now)}`;
  const dest = path.join(backupDir, name);
  if (fs.existsSync(dest)) return null;
  fs.mkdirSync(backupDir, { recursive: true });
  // chép vào thư mục tạm rồi đổi tên: bản sao lưu dở dang không bao giờ trông như bản hoàn chỉnh
  const tmp = dest + '.tmp';
  fs.rmSync(tmp, { recursive: true, force: true });
  // sessions.json (phiên đăng nhập) và secrets.json (token bot) là bí mật, không đưa vào bản sao lưu; khôi phục xong nhập lại token
  const SECRET = new Set(['sessions.json', 'secrets.json']);
  fs.cpSync(dataDir, tmp, { recursive: true, filter: (src) => !SECRET.has(path.basename(src)) });
  fs.renameSync(tmp, dest);
  const old = fs.readdirSync(backupDir).filter((f) => /^data-\d{4}-\d{2}-\d{2}$/.test(f)).sort().slice(0, -KEEP);
  for (const f of old) fs.rmSync(path.join(backupDir, f), { recursive: true, force: true });
  return name;
}

// Chạy khi khởi động rồi kiểm tra mỗi giờ (máy tắt ban đêm vẫn có bản sao lưu khi bật lại).
function scheduleBackup(dataDir, backupDir) {
  const tick = () => {
    try { const n = runBackup(dataDir, backupDir); if (n) console.log(`Đã sao lưu dữ liệu → ${path.join(backupDir, n)}`); }
    catch (e) { console.error('Sao lưu thất bại:', e.message); }
  };
  tick();
  const t = setInterval(tick, 3600 * 1000);
  t.unref();
  return () => clearInterval(t);
}

module.exports = { runBackup, scheduleBackup, KEEP };

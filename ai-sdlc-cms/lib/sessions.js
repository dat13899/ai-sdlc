'use strict';
// Phiên đăng nhập lưu ra file để khởi động lại server không làm mọi người bị đăng xuất.
// Chỉ lưu SHA-256 của mã phiên: lộ file này cũng không dùng lại được cookie.
// ponytail: ghi lại cả file mỗi lần đăng nhập/đăng xuất — đủ cho vài chục người; đông hơn thì chuyển SQLite.
const fs = require('fs');
const crypto = require('crypto');

const hash = (sid) => crypto.createHash('sha256').update(String(sid || '')).digest('hex');

function createSessions(file) {
  let map = new Map();
  try {
    const now = Date.now();
    for (const [h, s] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))) if (s.exp > now) map.set(h, s);
  } catch { /* chưa có file hoặc hỏng → bắt đầu trống */ }

  const persist = () => {
    const now = Date.now();
    for (const [h, s] of map) if (s.exp <= now) map.delete(h);
    if (!file) return; // test chạy trong RAM
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(map)), { mode: 0o600 });
    fs.renameSync(tmp, file);
  };

  return {
    hash,
    get: (sid) => map.get(hash(sid)),
    set: (sid, s) => { map.set(hash(sid), s); persist(); },
    delete: (sid) => { if (map.delete(hash(sid))) persist(); },
    // xoá mọi phiên thoả điều kiện fn(session, hash) — đổi mật khẩu, khoá tài khoản
    deleteWhere: (fn) => { let n = 0; for (const [h, s] of map) if (fn(s, h)) { map.delete(h); n++; } if (n) persist(); },
  };
}

module.exports = { createSessions };

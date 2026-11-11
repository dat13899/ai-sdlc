'use strict';
// Tải nội dung deploy/ lên server qua SFTP, không cần gõ gì.
// Cấu hình đọc từ file .env.deploy (KHÔNG commit, KHÔNG nằm trong deploy/) hoặc biến môi trường.
// Chạy: npm run deploy   (= đóng gói lại + tải lên)
//
// An toàn:
//  - Bắt buộc khớp fingerprint khoá máy chủ (SFTP_FINGERPRINT) → không gửi mật khẩu cho máy chủ giả.
//  - Chỉ ghi đè/thêm file; KHÔNG xoá gì trên server, KHÔNG đụng thư mục data/.
//  - Không in mật khẩu ra màn hình.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SftpClient = require('ssh2-sftp-client');

const ROOT = __dirname;
const LOCAL = path.join(ROOT, 'deploy');

// đọc .env.deploy dạng KEY=giá trị (không cần thêm thư viện)
const envFile = path.join(ROOT, '.env.deploy');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    // bỏ dấu nháy bọc ngoài nếu có: SFTP_PASSWORD="abc" → abc
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const cfg = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASSWORD,
  fingerprint: (process.env.SFTP_FINGERPRINT || '').replace(/^SHA256:/, ''),
  dir: process.env.SFTP_DIR || '',
};
const missing = ['host', 'username', 'password', 'fingerprint'].filter((k) => !cfg[k]);
if (missing.length) {
  console.error(`Thiếu cấu hình: ${missing.map((k) => 'SFTP_' + (k === 'username' ? 'USER' : k.toUpperCase())).join(', ')}.\nCopy .env.deploy.example thành .env.deploy rồi điền.`);
  process.exit(1);
}
if (!fs.existsSync(path.join(LOCAL, 'server.js'))) {
  console.error('Chưa có deploy/ — chạy "npm run pack" trước (hoặc dùng "npm run deploy").');
  process.exit(1);
}

(async () => {
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      readyTimeout: 20000,
      // so khoá máy chủ với fingerprint đã biết trước khi gửi mật khẩu
      hostVerifier: (key) => {
        const fp = crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
        if (fp !== cfg.fingerprint) console.error(`Khoá máy chủ KHÔNG khớp (nhận SHA256:${fp}) — dừng, không gửi mật khẩu.`);
        return fp === cfg.fingerprint;
      },
    });
    const remote = cfg.dir || (await sftp.cwd());
    console.log(`Đã kết nối ${cfg.host}:${cfg.port} — thư mục đích: ${remote}`);
    const before = await sftp.list(remote);
    console.log('Hiện có trên server:', before.map((e) => e.name + (e.type === 'd' ? '/' : '')).join('  ') || '(trống)');

    // tải từng mục ở cấp gốc của deploy/ (thư mục thì tải đệ quy)
    let files = 0;
    for (const name of fs.readdirSync(LOCAL)) {
      const src = path.join(LOCAL, name);
      const dst = `${remote.replace(/\/$/, '')}/${name}`;
      if (fs.statSync(src).isDirectory()) {
        await sftp.uploadDir(src, dst, { useFastput: false });
        files += countFiles(src);
      } else {
        await sftp.put(src, dst);
        files += 1;
      }
      console.log(`  ↑ ${name}`);
    }
    console.log(`\nXong: đã tải ${files} file. Thư mục data/ trên server giữ nguyên.`);
    console.log('Bước tiếp: khởi động lại server trên panel (panel tự npm install nếu được cấu hình).');
  } catch (e) {
    console.error('Lỗi:', e.message);
    if (/authentication methods failed/i.test(e.message)) {
      console.error('→ Máy chủ từ chối tên đăng nhập/mật khẩu. Kiểm tra SFTP_USER và SFTP_PASSWORD trong .env.deploy:'
        + '\n  - mật khẩu dán đủ, không thừa dấu cách / ký tự ở đầu-cuối'
        + '\n  - nếu đã đổi mật khẩu SFTP trên panel thì dùng mật khẩu MỚI'
        + `\n  (độ dài mật khẩu đang dùng: ${cfg.password.length} ký tự)`);
    }
    process.exitCode = 1;
  } finally {
    await sftp.end().catch(() => {});
  }
})();

function countFiles(dir) {
  return fs.readdirSync(dir).reduce((n, f) => {
    const p = path.join(dir, f);
    return n + (fs.statSync(p).isDirectory() ? countFiles(p) : 1);
  }, 0);
}

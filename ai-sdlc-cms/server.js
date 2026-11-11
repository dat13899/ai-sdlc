'use strict';
// AI-SDLC CMS — theo dõi tiến độ các dự án qua 14 bước / 8 gate của quy trình AI-SDLC.
// Server = API JSON (lib/api.js) + phục vụ giao diện React đã build (web/dist).
// Chạy: npm run build (lần đầu / sau khi sửa web/) rồi node server.js
//       PORT mặc định 3300, dữ liệu ở ./data hoặc CMS_DATA
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const Fastify = require('fastify');
const { createStore } = require('./lib/store');
const { createSessions } = require('./lib/sessions');
const { scheduleBackup } = require('./lib/backup');
const { createTelegram } = require('./lib/telegram');

const PROC = JSON.parse(fs.readFileSync(path.join(__dirname, 'process.json'), 'utf8'));
const DATA_DIR = process.env.CMS_DATA || path.join(__dirname, 'data');
const SESSION_MS = 7 * 24 * 3600 * 1000;
const MAX_UPLOAD = 30 * 1024 * 1024; // hỗ trợ đa định dạng tài liệu, PDF, Excel, ảnh ≤ 30 MB
const DIST = process.env.CMS_DIST || path.join(__dirname, 'web', 'dist'); // CMS_DIST: thư mục build khác (thử nghiệm khi server thật đang giữ web/dist)
const MIME = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

// telegramFetch: thay hàm fetch gọi Telegram (test dùng Telegram giả, không gọi mạng thật)
async function buildApp({ dataDir = DATA_DIR, adminPassword, logger = true, telegramFetch, telegramBackoffMs } = {}) {
  const store = createStore(dataDir, PROC);
  const tg = createTelegram({ store, PROC, fetchImpl: telegramFetch, backoffMs: telegramBackoffMs, onError: (e) => console.error('Telegram:', e.message) });
  // phiên lưu ra data/sessions.json (chỉ SHA-256 của mã phiên) → khởi động lại không bị đăng xuất
  const sessions = createSessions(path.join(dataDir, 'sessions.json'));

  if (!store.hasUsers()) {
    const pw = adminPassword || crypto.randomBytes(9).toString('base64url');
    store.createUser({ username: 'admin', name: 'Quản trị viên', password: pw, admin: true });
    if (!adminPassword) console.log(`\n  Tạo tài khoản đầu tiên: admin / ${pw}  (đăng nhập rồi đổi mật khẩu ở trang Tài khoản)\n`);
  }

  const app = Fastify({ logger, trustProxy: true, bodyLimit: 1024 * 1024 });
  await app.register(require('@fastify/helmet'), {
    // "no-referrer" (mặc định) khiến trình duyệt gửi Origin: null → kiểm tra CSRF bên dưới chặn nhầm
    referrerPolicy: { policy: 'same-origin' },
    // Ant Design chèn <style> lúc chạy (CSS-in-JS) → style-src cần 'unsafe-inline'; script vẫn chỉ từ 'self'
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'frame-src': ["'self'"],
        'object-src': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': null,
      },
    },
  });
  await app.register(require('@fastify/cookie'));
  await app.register(require('@fastify/multipart'), { limits: { fileSize: MAX_UPLOAD, files: 1, fields: 10 } });
  await app.register(require('@fastify/rate-limit'), { global: false });

  /* ---------- phiên đăng nhập + chống CSRF ---------- */
  app.addHook('onRequest', async (req, reply) => {
    const sid = req.cookies.sid;
    const s = sid && sessions.get(sid);
    if (s && s.exp > Date.now()) {
      const u = store.getUser(s.uid);
      if (u && !u.disabled) req.user = u; else sessions.delete(sid);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // trình duyệt luôn gửi Origin với POST/PUT/DELETE; khác host (hoặc thiếu) → chặn
      const src = req.headers.origin || req.headers.referer;
      let ok = false;
      try { ok = new URL(src).host === req.headers.host; } catch {}
      if (!ok) return reply.code(403).send({ error: 'Yêu cầu không hợp lệ (Origin)' });
    }
  });

  // API JSON trong scope riêng (error handler JSON chỉ áp cho /api)
  await app.register(async (scope) => require('./lib/api')(scope, { store, PROC, sessions, SESSION_MS, MAX_UPLOAD, tg }));
  app.decorate('tg', tg);
  app.addHook('onClose', async () => tg.close());
  tg.start(); // đã có token và đang bật thì nhận lệnh ngay khi khởi động

  /* ---------- giao diện React đã build ---------- */
  // file trong dist/assets có hash trong tên → cache lâu; tên chỉ gồm ký tự an toàn nên không thể thoát thư mục
  // JS/CSS được nén brotli (hoặc gzip) một lần rồi giữ trong RAM — nội dung theo hash không bao giờ đổi
  const packed = new Map();
  const compressed = (abs, enc) => {
    const key = `${enc}:${abs}`;
    if (!packed.has(key)) {
      const raw = fs.readFileSync(abs);
      packed.set(key, enc === 'br'
        ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
        : zlib.gzipSync(raw, { level: 9 }));
    }
    return packed.get(key);
  };
  app.get('/assets/:file', (req, reply) => {
    const f = req.params.file;
    const type = MIME[path.extname(f)];
    const abs = path.join(DIST, 'assets', f);
    if (!/^[\w.-]+$/.test(f) || !type || !fs.existsSync(abs)) return reply.code(404).send('Not found');
    reply.type(type).header('cache-control', 'public, max-age=31536000, immutable').header('vary', 'accept-encoding');
    const ae = String(req.headers['accept-encoding'] || '');
    const enc = /\.(js|css|svg)$/.test(f) && (/\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : null);
    if (enc) return reply.header('content-encoding', enc).send(compressed(abs, enc));
    return reply.send(fs.createReadStream(abs));
  });
  app.get('/favicon.svg', (req, reply) => {
    const abs = path.join(DIST, 'favicon.svg');
    if (fs.existsSync(abs)) return reply.type('image/svg+xml').header('cache-control', 'public, max-age=86400').send(fs.createReadStream(abs));
    return reply.code(404).send('Not found');
  });
  app.get('/favicon.ico', (req, reply) => {
    const abs = path.join(DIST, 'favicon.ico');
    if (fs.existsSync(abs)) return reply.type('image/x-icon').header('cache-control', 'public, max-age=86400').send(fs.createReadStream(abs));
    return reply.code(404).send('Not found');
  });
  // mọi đường dẫn khác (không phải /api) → index.html, React Router lo phần còn lại
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
    const index = path.join(DIST, 'index.html');
    if (!fs.existsSync(index)) return reply.code(503).type('text/plain; charset=utf-8').send('Chưa build giao diện: chạy "npm run build" rồi tải lại trang.');
    return reply.type('text/html; charset=utf-8').header('cache-control', 'no-cache').send(fs.createReadStream(index));
  });

  return app;
}

if (require.main === module) {
  // Hosting kiểu panel (Pterodactyl…) cấp cổng qua SERVER_PORT và cần nghe trên mọi địa chỉ;
  // chạy tự quản thì mặc định 127.0.0.1:3300 sau reverse proxy.
  const port = Number(process.env.PORT || process.env.SERVER_PORT || 3300);
  const host = process.env.HOST || (process.env.SERVER_PORT ? '0.0.0.0' : '127.0.0.1');
  if (process.env.COOKIE_SECURE === 'false') console.warn('\n  ⚠ COOKIE_SECURE=false: cookie đăng nhập gửi được qua HTTP thường — chỉ dùng khi chưa có HTTPS.\n');
  // sao lưu hằng ngày; đặt BACKUP_DIR sang ổ/thư mục khác máy chủ (mặc định ./backups cùng ổ chỉ chống xoá nhầm)
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
  buildApp().then(async (app) => { await app.listen({ port, host }); app.tg.startDigestTimer(); }).then(() => scheduleBackup(DATA_DIR, backupDir))
    .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { buildApp };

'use strict';
// Kiểm tra cấu hình + thông báo Telegram bằng Telegram GIẢ (không gọi mạng thật). Chạy: node test-telegram.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildApp } = require('./server');
const { buildDigest } = require('./lib/notify');
const { runBackup } = require('./lib/backup');

const TOKEN = '123456789:' + 'AbCdEfGhIjKlMnOpQrStUvWxYz012345678';

// Bot API giả: ghi lại tin đã gửi, trả update đã xếp hàng cho getUpdates, giả lập sai token / mất mạng
function fakeTelegram() {
  const f = { sent: [], queue: [], down: false, fetch: null };
  f.fetch = async (url, opts) => {
    const [, tk, method] = /bot([^/]+)\/(\w+)$/.exec(url);
    if (f.down) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    const body = JSON.parse(opts.body || '{}');
    const res = (obj, status = 200) => ({ ok: status === 200, status, json: async () => obj });
    if (tk !== TOKEN) return res({ ok: false, error_code: 401, description: 'Unauthorized' }, 401);
    if (method === 'getMe') return res({ ok: true, result: { id: 123456789, username: 'ai_sdlc_bot', first_name: 'AI SDLC' } });
    if (method === 'sendMessage') { f.sent.push(body); return res({ ok: true, result: { message_id: f.sent.length } }); }
    if (method === 'getUpdates') {
      if (!f.queue.length) await new Promise((r) => setTimeout(r, 25));
      return res({ ok: true, result: f.queue.splice(0) });
    }
    return res({ ok: false, error_code: 404, description: 'not found' }, 404);
  };
  f.to = (chat) => f.sent.filter((s) => String(s.chat_id) === String(chat)).map((s) => s.text);
  return f;
}
const waitFor = async (cond, ms = 1500) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await cond()) return true; await new Promise((r) => setTimeout(r, 20)); }
  return false;
};

(async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-tg-'));
  const fake = fakeTelegram();
  const app = await buildApp({ dataDir, adminPassword: 'admin-pass-123', logger: false, telegramFetch: fake.fetch, telegramBackoffMs: 10 });
  let cookie = '';
  const api = async (method, url, body) => {
    const r = await app.inject({ method, url, payload: body, headers: { host: 'localhost', origin: 'http://localhost', cookie, ...(body ? { 'content-type': 'application/json' } : {}) } });
    const sc = r.headers['set-cookie'];
    if (sc) cookie = [].concat(sc)[0].split(';')[0];
    let json = null;
    try { json = r.json(); } catch {}
    return { status: r.statusCode, body: json };
  };
  const ok = (r) => { assert.ok(r.status < 300, `${r.status} ${JSON.stringify(r.body)}`); return r.body; };
  const cookies = {};
  const loginAs = async (name, pw) => { cookie = ''; const u = ok(await api('POST', '/api/login', { username: name, password: pw })); cookies[name] = cookie; return u; };
  const as = (n) => { cookie = cookies[n]; };

  const admin = await loginAs('admin', 'admin-pass-123');
  const mk = (u, n) => api('POST', '/api/admin/users', { username: u, name: n, password: 'Demo-pass-123' }).then(ok);
  as('admin');
  const ba = await mk('ba1', 'Lan BA'), dev = await mk('dev1', 'Hùng Dev'), pm = await mk('pm1', 'Nam PM');
  await loginAs('ba1', 'Demo-pass-123'); await loginAs('dev1', 'Demo-pass-123'); await loginAs('pm1', 'Demo-pass-123');

  /* ---------- chỉ admin cấu hình; chưa có token ---------- */
  as('dev1');
  assert.strictEqual((await api('GET', '/api/admin/telegram')).status, 403);
  assert.strictEqual((await api('PUT', '/api/admin/telegram/token', { token: TOKEN })).status, 403);
  assert.strictEqual((await api('GET', '/api/me/telegram')).body.available, false, 'chưa cấu hình thì chưa liên kết được');
  assert.strictEqual((await api('POST', '/api/me/telegram/code')).status, 400);
  as('admin');
  let v = ok(await api('GET', '/api/admin/telegram'));
  assert.strictEqual(v.configured, false);
  assert.strictEqual(v.tokenHint, '');
  assert.strictEqual((await api('PUT', '/api/admin/telegram/settings', { enabled: true })).status, 400, 'bật khi chưa có token → từ chối');

  /* ---------- lưu token: kiểm tra định dạng, token sai, mất mạng, rồi đúng; token không bao giờ lộ ---------- */
  assert.strictEqual((await api('PUT', '/api/admin/telegram/token', { token: 'khong-phai-token' })).status, 400);
  const wrong = await api('PUT', '/api/admin/telegram/token', { token: '123456789:' + 'x'.repeat(35) });
  assert.strictEqual(wrong.status, 400);
  assert.match(wrong.body.error, /Unauthorized/);
  fake.down = true;
  const down = await api('PUT', '/api/admin/telegram/token', { token: TOKEN });
  assert.strictEqual(down.status, 400);
  assert.match(down.body.error, /Không kết nối được api\.telegram\.org \(ENOTFOUND\)/);
  fake.down = false;
  assert.strictEqual(ok(await api('GET', '/api/admin/telegram')).configured, false, 'lưu thất bại thì không để lại token');
  v = ok(await api('PUT', '/api/admin/telegram/token', { token: TOKEN }));
  assert.strictEqual(v.configured, true);
  assert.strictEqual(v.bot.username, 'ai_sdlc_bot');
  assert.strictEqual(v.tokenHint, '123456789:••••••••');
  const everything = JSON.stringify(v) + JSON.stringify(ok(await api('GET', '/api/admin/telegram'))) + JSON.stringify(ok(await api('GET', `/api/admin/telegram`)));
  assert.ok(!everything.includes(TOKEN) && !everything.includes('AbCdEfGh'), 'API không trả token');
  assert.ok(fs.readFileSync(path.join(dataDir, 'secrets.json'), 'utf8').includes(TOKEN), 'token nằm trong secrets.json');
  assert.ok(!fs.existsSync(path.join(dataDir, 'settings.json')) || !fs.readFileSync(path.join(dataDir, 'settings.json'), 'utf8').includes(TOKEN), 'token không nằm trong settings.json');
  assert.ok(!fs.readFileSync(path.join(dataDir, 'audit.jsonl'), 'utf8').includes('AbCdEfGh'), 'nhật ký không chứa token');
  assert.strictEqual(ok(await api('POST', '/api/admin/telegram/check')).bot.username, 'ai_sdlc_bot');

  /* ---------- cấu hình: kiểm tra đầu vào, bật thì bắt đầu nhận lệnh ---------- */
  const S = { enabled: true, chatId: '-1001', publicUrl: 'https://cms.example.vn/', digestTime: '09:15', events: { aiReview: false } };
  assert.strictEqual((await api('PUT', '/api/admin/telegram/settings', { ...S, chatId: 'abc' })).status, 400);
  assert.strictEqual((await api('PUT', '/api/admin/telegram/settings', { ...S, digestTime: '25:00' })).status, 400);
  assert.strictEqual((await api('PUT', '/api/admin/telegram/settings', { ...S, publicUrl: 'ftp://x.vn' })).status, 400);
  assert.strictEqual((await api('PUT', '/api/admin/telegram/settings', { ...S, publicUrl: 'https://x.vn/duong/dan' })).status, 400);
  v = ok(await api('PUT', '/api/admin/telegram/settings', S));
  assert.deepStrictEqual([v.settings.enabled, v.settings.publicUrl, v.settings.digestTime, v.settings.events.aiReview, v.settings.events.assign], [true, 'https://cms.example.vn', '09:15', false, true]);
  assert.ok(await waitFor(() => app.tg.status().running), 'bật thì bắt đầu nhận lệnh');

  /* ---------- lệnh /chatid trong nhóm: nhóm hiện trong danh sách để chọn ---------- */
  fake.queue.push({ update_id: 1, message: { chat: { id: -1001, type: 'supergroup', title: 'Nhóm Dự án AI' }, text: '/chatid@ai_sdlc_bot' } });
  assert.ok(await waitFor(() => fake.to(-1001).some((t) => t.includes('Chat ID: -1001'))));
  fake.queue.push({ update_id: 2, my_chat_member: { chat: { id: -1002, type: 'group', title: 'Nhóm khác' }, new_chat_member: { status: 'member' } } });
  assert.ok(await waitFor(async () => (await api('GET', '/api/admin/telegram')).body.settings.seenChats.length === 2), 'bot được thêm vào nhóm thì nhóm hiện trong danh sách');
  v = ok(await api('GET', '/api/admin/telegram'));
  assert.deepStrictEqual(v.settings.seenChats.map((c) => c.id).sort(), ['-1001', '-1002']);
  assert.strictEqual(v.settings.seenChats.find((c) => c.id === '-1001').title, 'Nhóm Dự án AI');

  /* ---------- liên kết tài khoản bằng mã dùng 1 lần ---------- */
  const link = async (who, chatId, username) => {
    as(who);
    const c = ok(await api('POST', '/api/me/telegram/code'));
    assert.match(c.link, /^https:\/\/t\.me\/ai_sdlc_bot\?start=[0-9A-F]{8}$/);
    fake.queue.push({ update_id: 100 + chatId, message: { chat: { id: chatId, type: 'private' }, from: { username }, text: `/start ${c.code}` } });
    assert.ok(await waitFor(async () => (await api('GET', '/api/me/telegram')).body.linked), `${who} liên kết được`);
    assert.ok(fake.to(chatId).some((t) => t.includes('Đã liên kết')));
    return c.code;
  };
  const baCode = await link('ba1', 556, 'lan_ba');
  await link('dev1', 555, 'hung_dev');
  await link('pm1', 557, 'nam_pm');
  assert.strictEqual((await api('GET', '/api/me/telegram')).body.tgUsername, 'nam_pm');
  fake.queue.push({ update_id: 200, message: { chat: { id: 999, type: 'private' }, from: { username: 'ke_la' }, text: `/start ${baCode}` } });
  assert.ok(await waitFor(() => fake.to(999).some((t) => t.includes('không đúng hoặc đã hết hạn'))), 'mã chỉ dùng 1 lần');
  fake.queue.push({ update_id: 201, message: { chat: { id: 999, type: 'private' }, text: '/start' } });
  assert.ok(await waitFor(() => fake.to(999).some((t) => t.includes('Liên kết Telegram'))));

  /* ---------- thông báo theo sự kiện (so sánh dữ liệu trước/sau) ---------- */
  as('admin');
  const proj = ok(await api('POST', '/api/projects', { name: 'INS Platform', code: 'INS' }));
  const item = ok(await api('POST', `/api/projects/${proj.id}/items`, { name: 'Thanh toán QR', kind: 'full', force: true }));
  const tid = item.itemId;
  ok(await api('PUT', `/api/projects/${proj.id}/ai-setup`, { tools: ['Claude'], dataLevel: 'internal' }));
  ok(await api('PUT', `/api/projects/${proj.id}/members`, { members: [
    { userId: admin.id, roles: ['PM'] }, { userId: pm.id, roles: ['PM', 'PO'] }, { userId: ba.id, roles: ['BA'] }, { userId: dev.id, roles: ['Dev', 'TechLead'] },
  ] }));
  const step = (code, body) => api('PUT', `/api/projects/${proj.id}/t/${tid}/steps/${code}`, body).then(ok);
  const before = fake.sent.length;
  await step('B3', { status: 'done', owners: [ba.id] });
  assert.ok(await waitFor(() => fake.to(556).some((t) => t.includes('được giao bước B3'))), 'người được giao nhận tin');
  assert.strictEqual(fake.sent.length, before + 1, 'admin là người thao tác nên không tự nhận tin; chỉ ba nhận');
  await step('B4', { status: 'done' });
  await step('B5', { status: 'doing', owners: [ba.id] });
  assert.ok(await waitFor(() => fake.to(557).some((t) => t.includes('⛔ Gate 1 đang chờ vai trò của bạn ký'))), 'PM/PO nhận tin Gate 1 chờ ký');
  const g1msg = fake.to(557).find((t) => t.includes('Gate 1'));
  assert.ok(g1msg.includes(`https://cms.example.vn/p/${proj.id}/t/${tid}#B5`), 'tin có link vào đúng bước');
  assert.ok(!fake.to(555).some((t) => t.includes('Gate 1')), 'Dev/Tech Lead không có vai trò ký Gate 1 nên không nhận');

  // AI chờ duyệt: tắt sự kiện thì không gửi, bật thì gửi cho PM + Tech Lead (trừ người ghi)
  as('ba1');
  const aiLog = () => api('POST', `/api/projects/${proj.id}/t/${tid}/ai-logs`, { step: 'B3', tool: 'Claude', purpose: 'Tóm tắt biên bản', origin: 'ai' }).then(ok);
  const n557 = fake.to(557).length;
  await aiLog();
  await new Promise((r) => setTimeout(r, 80));
  assert.strictEqual(fake.to(557).length, n557, 'sự kiện aiReview đang tắt');
  as('admin');
  ok(await api('PUT', '/api/admin/telegram/settings', { ...S, events: { aiReview: true } }));
  as('ba1');
  await aiLog();
  assert.ok(await waitFor(() => fake.to(557).some((t) => t.includes('🤖 Có nội dung AI chờ duyệt')) && fake.to(555).some((t) => t.includes('🤖'))));
  assert.ok(!fake.to(556).some((t) => t.includes('🤖')), 'người ghi không nhận tin duyệt của chính mình');

  // gate không đạt → PM của dự án (trừ người ký)
  as('admin');
  ok(await api('PUT', `/api/projects/${proj.id}/t/${tid}/gates/g1`, { result: 'fail', note: 'Spec thiếu AC' }));
  assert.ok(await waitFor(() => fake.to(557).some((t) => t.includes('❌ Gate 1 không đạt') && t.includes('Spec thiếu AC'))));

  /* ---------- tóm tắt sáng + gửi thử ---------- */
  await step('B5', { status: 'doing', owners: [ba.id], end: '2020-01-01' });
  assert.strictEqual((await api('POST', '/api/admin/telegram/test', { target: 'me' })).status, 400, 'admin chưa liên kết');
  ok(await api('POST', '/api/admin/telegram/test', { target: 'group' }));
  assert.ok(fake.to(-1001).some((t) => t.includes('Tin thử')));
  ok(await api('POST', '/api/admin/telegram/test', { target: 'digest' }));
  const digest = fake.to(-1001).find((t) => t.startsWith('📋 AI-SDLC'));
  assert.ok(digest.includes('INS Platform › Thanh toán QR') && digest.includes('⏰'), digest);
  assert.ok(digest.includes('B5 (hạn 01/01/2020') && digest.includes('🤖 Nội dung AI chờ duyệt: 2') && digest.includes('https://cms.example.vn/tasks'));
  const now = new Date(2026, 10, 5, 9, 30);
  assert.strictEqual((await app.tg.digest(now)).sent, true);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dataDir, 'settings.json'), 'utf8')).telegram.lastDigest, '2026-11-05');
  assert.strictEqual(buildDigest({ steps: [], gates: [] }, [], [], new Date()), null, 'không có gì thì không gửi');

  /* ---------- /viec: việc của riêng người đã liên kết ---------- */
  fake.queue.push({ update_id: 250, message: { chat: { id: 556, type: 'private' }, text: '/viec' } });
  assert.ok(await waitFor(() => fake.to(556).some((t) => t.startsWith('📌 Việc của bạn'))), 'người đã liên kết nhận danh sách việc');
  const viec = fake.to(556).find((t) => t.startsWith('📌 Việc của bạn'));
  assert.ok(viec.includes('INS Platform › Thanh toán QR · B5') && viec.includes('hạn 01/01/2020') && viec.includes('https://cms.example.vn/tasks'), viec);
  fake.queue.push({ update_id: 251, message: { chat: { id: 999, type: 'private' }, text: '/viec' } });
  assert.ok(await waitFor(() => fake.to(999).some((t) => t.includes('chưa liên kết'))), 'chat lạ không xem được việc của ai');

  /* ---------- báo cáo & số liệu ---------- */
  as('admin');
  await step('B4', { status: 'doing', owners: [ba.id] });
  await step('B4', { status: 'done', owners: [ba.id] });
  const m = ok(await api('GET', '/api/metrics'));
  assert.ok(m.totals.overdue >= 1 && m.overdue.some((o) => o.step === 'B5' && o.late > 0), 'B5 quá hạn');
  assert.ok(m.steps.some((s) => s.code === 'B4' && s.n === 1), 'bước có mốc bắt đầu + xong thì có thời gian');
  const g1 = m.gates.find((g) => g.id === 'Gate 1');
  assert.ok(g1 && g1.fail >= 1 && g1.failRate > 0, 'gate không đạt được đếm từ nhật ký');
  assert.ok(m.ai.total >= 2 && m.ai.byResult.pending >= 2 && m.ai.oldestPendingDays >= 0);
  assert.ok(m.load.some((l) => l.name === ba.name && l.overdue >= 1), 'tải theo người');
  assert.ok(m.projects.some((p) => p.id === proj.id));
  cookie = '';
  assert.strictEqual((await api('GET', '/api/metrics')).status, 401, 'cần đăng nhập');
  as('admin');

  /* ---------- huỷ liên kết (admin / chính chủ qua /huy) ---------- */
  v = ok(await api('POST', `/api/admin/telegram/users/${ba.id}/unlink`));
  assert.strictEqual(v.users.find((u) => u.id === ba.id).linked, false);
  assert.strictEqual(v.users.find((u) => u.id === pm.id).tgUsername, 'nam_pm');
  fake.queue.push({ update_id: 300, message: { chat: { id: 557, type: 'private' }, text: '/huy' } });
  assert.ok(await waitFor(() => fake.to(557).some((t) => t === 'Đã huỷ liên kết.')));
  const n556 = fake.to(556).length;
  as('admin');
  await step('B6', { status: 'doing', owners: [ba.id] }).catch(() => {});
  await new Promise((r) => setTimeout(r, 80));
  assert.strictEqual(fake.to(556).length, n556, 'đã huỷ liên kết thì không nhận tin');

  /* ---------- sao lưu bỏ token; khởi động lại vẫn nhận lệnh; xoá token thì dừng hẳn ---------- */
  const bdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-tgbak-'));
  const bname = runBackup(dataDir, bdir, new Date(2026, 10, 5));
  assert.ok(fs.existsSync(path.join(bdir, bname, 'settings.json')) && !fs.existsSync(path.join(bdir, bname, 'secrets.json')), 'sao lưu có cấu hình nhưng không có token');
  const app2 = await buildApp({ dataDir, logger: false, telegramFetch: fake.fetch, telegramBackoffMs: 10 });
  assert.ok(await waitFor(() => app2.tg.status().running), 'khởi động lại: có token + đang bật thì tự nhận lệnh');
  await app2.close();
  as('admin');
  v = ok(await api('DELETE', '/api/admin/telegram/token'));
  assert.deepStrictEqual([v.configured, v.settings.enabled, v.bot], [false, false, null]);
  assert.ok(await waitFor(() => !app.tg.status().running));
  assert.ok(!fs.readFileSync(path.join(dataDir, 'secrets.json'), 'utf8').includes('AbCdEfGh'));

  await app.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(bdir, { recursive: true, force: true });
  console.log('OK — Telegram đạt tất cả kiểm tra');
})().catch((e) => { console.error(e); process.exit(1); });

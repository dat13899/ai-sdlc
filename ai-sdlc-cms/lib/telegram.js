'use strict';
// Bot Telegram: nhận lệnh bằng long polling (chỉ gọi ra ngoài, không cần mở cổng vào) và gửi thông báo.
// Token lấy từ secrets.json (store.getSecret), KHÔNG bao giờ trả ra API hay ghi vào nhật ký.
const crypto = require('crypto');
const { diffEvents, buildDigest, formatTasks, ymd } = require('./notify');
const { collectTasks } = require('./tasks');

const TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{30,}$/;
const CODE_TTL = 10 * 60 * 1000;
const sleep = (ms, signal) => new Promise((resolve) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
});

function createTelegram({ store, PROC, fetchImpl = globalThis.fetch, backoffMs = 5000, onError = (e) => console.error('Telegram:', e.message) }) {
  const st = { running: false, ac: null, offset: 0, bot: null, error: '' };
  const codes = new Map(); // mã liên kết → { uid, exp }
  let digestTimer = null;

  const token = () => store.getSecret('telegramToken');

  // gọi Bot API; lỗi mạng được đổi thành thông báo dễ hiểu (hay gặp: tường lửa / proxy công ty chặn api.telegram.org)
  async function call(tk, method, params = {}, timeoutMs = 15000, signal) {
    let res;
    try {
      res = await fetchImpl(`https://api.telegram.org/bot${tk}/${method}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      if (signal?.aborted) throw e; // bị dừng chủ động, không phải lỗi mạng
      const why = e.name === 'TimeoutError' ? 'quá thời gian chờ' : (e.cause?.code || e.message);
      throw new Error(`Không kết nối được api.telegram.org (${why}) — kiểm tra mạng / tường lửa / proxy của máy chạy CMS`);
    }
    let data;
    try { data = await res.json(); } catch { throw new Error(`Telegram trả dữ liệu lạ (HTTP ${res.status})`); }
    if (!data.ok) {
      const hint = { 401: 'Token không đúng hoặc đã bị thu hồi (Telegram: Unauthorized)', 409: 'Có chương trình khác đang nhận tin của bot này (xung đột getUpdates) — tắt bản chạy khác hoặc dùng bot riêng' }[data.error_code];
      const e = new Error(hint || data.description || `Lỗi Telegram (HTTP ${res.status})`);
      e.code = data.error_code;
      throw e;
    }
    return data.result;
  }

  const verify = (tk) => call(tk, 'getMe').then((b) => ({ id: b.id, username: b.username, name: b.first_name }));

  async function saveToken(raw) {
    const tk = String(raw || '').trim();
    if (!TOKEN_RE.test(tk)) throw new Error('Token không đúng dạng (ví dụ 123456789:ABC…) — lấy từ @BotFather');
    st.bot = await verify(tk); // sai token / không tới được Telegram thì báo ngay, không lưu
    store.setSecret('telegramToken', tk);
    st.error = ''; st.offset = 0;
    stop(); start();
    return st.bot;
  }
  function clearToken() { stop(); store.setSecret('telegramToken', ''); st.bot = null; st.error = ''; st.offset = 0; }
  async function check() {
    const tk = token();
    if (!tk) throw new Error('Chưa lưu token');
    try { st.bot = await verify(tk); st.error = ''; } catch (e) { st.error = e.message; throw e; }
    return st.bot;
  }
  const status = () => ({ configured: !!token(), bot: st.bot, running: st.running, error: st.error });

  /* ---------- nhận lệnh ---------- */
  const isGroup = (c) => ['group', 'supergroup', 'channel'].includes(c.type);
  function remember(c) {
    const seen = store.getTelegram().seenChats.filter((x) => x.id !== String(c.id));
    store.setTelegram({ seenChats: [{ id: String(c.id), title: c.title || '' }, ...seen].slice(0, 10) });
  }
  const reply = (chatId, text) => send(chatId, text).catch(onError);

  function createCode(uid) {
    const now = Date.now();
    for (const [k, v] of codes) if (v.exp < now) codes.delete(k);
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.set(code, { uid, exp: now + CODE_TTL });
    return code;
  }
  function consume(code) {
    const c = codes.get(code);
    codes.delete(code);
    return c && c.exp >= Date.now() ? c.uid : null;
  }

  async function handle(u) {
    if (u.my_chat_member) {
      const c = u.my_chat_member.chat;
      if (isGroup(c) && ['member', 'administrator'].includes(u.my_chat_member.new_chat_member?.status)) remember(c);
      return;
    }
    const m = u.message;
    if (!m?.chat) return;
    const c = m.chat;
    if (isGroup(c)) remember(c);
    const cmd = /^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/.exec((m.text || '').trim());
    if (!cmd) return;
    const [, name, arg] = cmd;
    if (name === 'chatid') return reply(c.id, `Chat ID: ${c.id}\nDán số này vào mục Cấu hình Telegram của CMS (hoặc chọn nhóm có sẵn trong danh sách).`);
    if (c.type !== 'private') return; // các lệnh khác chỉ nhận ở chat riêng
    if (name === 'start') {
      const code = (arg || '').trim().toUpperCase();
      if (!code) return reply(c.id, 'Để nhận thông báo: vào CMS → Tài khoản → Liên kết Telegram, bấm "Lấy mã liên kết" rồi mở link hoặc gửi: /start MÃ');
      const uid = consume(code);
      const user = uid && store.getUser(uid);
      if (!user || user.disabled) return reply(c.id, 'Mã không đúng hoặc đã hết hạn (10 phút). Hãy lấy mã mới trong CMS.');
      store.setTgLink(uid, { chatId: String(c.id), username: m.from?.username || '', at: new Date().toISOString() });
      store.audit({ user: user.name, action: 'Liên kết Telegram', detail: m.from?.username ? '@' + m.from.username : '' });
      return reply(c.id, `✅ Đã liên kết với tài khoản ${user.name}. Thông báo sẽ gửi vào đây. Gửi /huy để huỷ liên kết.`);
    }
    if (name === 'huy') {
      const user = store.findByChat(c.id);
      if (!user) return reply(c.id, 'Chat này chưa liên kết với tài khoản nào.');
      store.setTgLink(user.id, null);
      store.audit({ user: user.name, action: 'Huỷ liên kết Telegram', detail: '' });
      return reply(c.id, 'Đã huỷ liên kết.');
    }
    if (name === 'viec') {
      const user = store.findByChat(c.id);
      if (!user) return reply(c.id, 'Chat này chưa liên kết với tài khoản nào. Vào CMS → Tài khoản → Liên kết Telegram.');
      return reply(c.id, formatTasks(collectTasks(PROC, store.listProjects(), user), store.getTelegram().publicUrl));
    }
    return reply(c.id, 'Lệnh: /viec (việc của tôi) · /start MÃ (liên kết tài khoản) · /huy (huỷ liên kết) · /chatid (xem chat id)');
  }

  /* ---------- vòng nhận tin ---------- */
  async function loop() {
    while (st.running) {
      const tk = token();
      if (!tk) break;
      st.ac = new AbortController();
      try {
        if (!st.bot) st.bot = await verify(tk);
        const ups = await call(tk, 'getUpdates', { offset: st.offset, timeout: 25, allowed_updates: ['message', 'my_chat_member'] }, 35000, st.ac.signal);
        st.error = '';
        for (const u of ups) { st.offset = u.update_id + 1; try { await handle(u); } catch (e) { onError(e); } }
      } catch (e) {
        if (!st.running) break;
        st.error = e.message;
        if (e.code === 401) { st.running = false; break; } // token đã bị thu hồi
        await sleep(backoffMs, st.ac.signal);
      }
    }
    st.running = false;
  }
  function start() {
    if (st.running || !token() || !store.getTelegram().enabled) return;
    st.running = true;
    loop();
  }
  function stop() { st.running = false; st.ac?.abort(); }

  /* ---------- gửi thông báo ---------- */
  const send = (chatId, text) => call(token(), 'sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });
  const ready = () => !!token() && store.getTelegram().enabled;

  // gọi sau mỗi thay đổi dự án: so trước/sau, gửi DM cho đúng người đã liên kết. Chạy nền, lỗi chỉ ghi log.
  function notifyDiff(before, after, actorId) {
    if (!ready()) return;
    const s = store.getTelegram();
    for (const ev of diffEvents(PROC, before, after, actorId, s.publicUrl)) {
      if (s.events[ev.event] === false) continue;
      const user = store.getUser(ev.to);
      const tg = store.getTgLink(ev.to);
      if (user && !user.disabled && tg) send(tg.chatId, ev.text).catch(onError);
    }
  }

  async function digest(now = new Date(), force = false) {
    const s = store.getTelegram();
    if (!token() || !s.enabled) return { sent: false, reason: 'Chưa bật thông báo Telegram' };
    if (!s.chatId) return { sent: false, reason: 'Chưa chọn nhóm nhận tóm tắt' };
    if (!force && s.events.digest === false) return { sent: false, reason: 'Tóm tắt sáng đang tắt' };
    const text = buildDigest(PROC, store.listProjects(), store.listUsers(), now, s.publicUrl);
    if (!text) return { sent: false, reason: 'Không có việc nào để tóm tắt' };
    await send(s.chatId, text);
    if (!force) store.setTelegram({ lastDigest: ymd(now) });
    return { sent: true };
  }
  // mỗi phút kiểm tra: tới giờ tóm tắt (trong vòng 3 giờ sau giờ đặt, để máy bật muộn vẫn gửi) và hôm nay chưa gửi
  function startDigestTimer() {
    if (digestTimer) return;
    digestTimer = setInterval(() => {
      const s = store.getTelegram(), now = new Date();
      if (!s.enabled || s.events.digest === false || s.lastDigest === ymd(now)) return;
      const [h, m] = s.digestTime.split(':').map(Number);
      const since = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
      if (since >= 0 && since < 180) digest(now).catch(onError);
    }, 60 * 1000);
    digestTimer.unref();
  }
  function close() { stop(); clearInterval(digestTimer); digestTimer = null; }

  return { TOKEN_RE, status, saveToken, clearToken, check, start, stop, close, handle, createCode, send, notifyDiff, digest, startDigestTimer, remember };
}

module.exports = { createTelegram, TOKEN_RE };

'use strict';
// Cấu hình Telegram (chỉ admin) và liên kết tài khoản của từng người. Token chỉ vào, không bao giờ ra.
const EVENT_KEYS = ['assign', 'gateWaiting', 'gateFail', 'aiReview', 'digest'];

module.exports = function registerTelegram(app, { store, tg, admin, auth, HttpError, bad }) {
  const audit = (req, action, detail = '') => store.audit({ user: req.user.name, uid: req.user.id, action, detail });

  // toàn bộ trạng thái cho trang cấu hình; chỉ lộ "id bot" (phần trước dấu :), không lộ token
  const view = () => {
    const s = store.getTelegram(), status = tg.status(), links = store.listTgLinks();
    const tk = store.getSecret('telegramToken');
    return {
      configured: status.configured, tokenHint: tk ? `${tk.split(':')[0]}:••••••••` : '', bot: status.bot, running: status.running, error: status.error,
      settings: { enabled: s.enabled, chatId: s.chatId, publicUrl: s.publicUrl, digestTime: s.digestTime, events: s.events, seenChats: s.seenChats },
      users: store.listUsers().map((u) => ({ id: u.id, name: u.name, username: u.username, disabled: u.disabled, linked: !!links[u.id], tgUsername: links[u.id]?.username || '' })),
    };
  };
  const wrap = async (fn) => { try { return await fn(); } catch (e) { throw e.statusCode ? e : bad(e.message); } };

  app.get('/api/admin/telegram', { preHandler: admin }, async () => view());

  app.put('/api/admin/telegram/token', { preHandler: admin }, async (req) => {
    const bot = await wrap(() => tg.saveToken(req.body?.token));
    audit(req, 'Lưu token bot Telegram', `@${bot.username}`); // không ghi token
    return view();
  });
  app.delete('/api/admin/telegram/token', { preHandler: admin }, async (req) => {
    tg.clearToken();
    store.setTelegram({ enabled: false });
    audit(req, 'Xoá token bot Telegram');
    return view();
  });
  app.post('/api/admin/telegram/check', { preHandler: admin }, async () => {
    await wrap(() => tg.check());
    return view();
  });

  app.put('/api/admin/telegram/settings', { preHandler: admin }, async (req) => {
    const b = req.body || {};
    const chatId = String(b.chatId ?? '').trim();
    if (!/^(-?\d{1,20})?$/.test(chatId)) throw bad('Chat ID chỉ gồm chữ số (nhóm thường bắt đầu bằng dấu -)');
    const publicUrl = String(b.publicUrl ?? '').trim().replace(/\/+$/, '');
    if (publicUrl && !/^https?:\/\/[^\s/]+$/i.test(publicUrl)) throw bad('Địa chỉ site phải dạng https://ten-mien (không có đường dẫn phía sau)');
    const digestTime = String(b.digestTime || '08:30');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(digestTime)) throw bad('Giờ tóm tắt phải dạng HH:mm');
    const events = Object.fromEntries(EVENT_KEYS.map((k) => [k, b.events?.[k] !== false]));
    const enabled = !!b.enabled;
    if (enabled && !store.getSecret('telegramToken')) throw bad('Chưa lưu token bot — lưu token trước khi bật');
    store.setTelegram({ enabled, chatId, publicUrl, digestTime, events });
    if (enabled) tg.start(); else tg.stop();
    audit(req, 'Sửa cấu hình Telegram', `${enabled ? 'bật' : 'tắt'} · nhóm: ${chatId || '(chưa chọn)'} · tóm tắt ${digestTime}`);
    return view();
  });

  // gửi thử để kiểm tra từng đường: nhóm, DM cho chính mình, tóm tắt sáng
  app.post('/api/admin/telegram/test', { preHandler: admin }, async (req) => {
    const target = req.body?.target;
    const s = store.getTelegram();
    if (!store.getSecret('telegramToken')) throw bad('Chưa lưu token bot');
    if (target === 'group') {
      if (!s.chatId) throw bad('Chưa chọn nhóm nhận tin');
      await wrap(() => tg.send(s.chatId, '✅ Tin thử từ AI-SDLC CMS — nhóm này sẽ nhận bản tóm tắt mỗi sáng.'));
    } else if (target === 'me') {
      const link = store.getTgLink(req.user.id);
      if (!link) throw bad('Tài khoản của anh chưa liên kết Telegram — vào trang Tài khoản để liên kết');
      await wrap(() => tg.send(link.chatId, '✅ Tin thử từ AI-SDLC CMS — thông báo cá nhân sẽ gửi vào đây.'));
    } else if (target === 'digest') {
      const r = await wrap(() => tg.digest(new Date(), true));
      if (!r.sent) throw bad(r.reason);
    } else throw bad('Đích gửi thử không hợp lệ');
    return { ok: true };
  });

  app.post('/api/admin/telegram/users/:uid/unlink', { preHandler: admin }, async (req) => {
    try { store.setTgLink(req.params.uid, null); } catch (e) { throw new HttpError(404, e.message); }
    audit(req, 'Huỷ liên kết Telegram của người dùng', store.getUser(req.params.uid)?.username || '');
    return view();
  });

  /* ---------- liên kết của chính mình ---------- */
  const mine = (uid) => {
    const status = tg.status(), s = store.getTelegram(), link = store.getTgLink(uid);
    return { available: status.configured && s.enabled && !!status.bot, botUsername: status.bot?.username || '', linked: !!link, tgUsername: link?.username || '' };
  };
  app.get('/api/me/telegram', { preHandler: auth }, async (req) => mine(req.user.id));
  app.post('/api/me/telegram/code', { preHandler: auth }, async (req) => {
    const m = mine(req.user.id);
    if (!m.available) throw bad('Quản trị viên chưa bật thông báo Telegram');
    const code = tg.createCode(req.user.id);
    return { code, link: `https://t.me/${m.botUsername}?start=${code}`, botUsername: m.botUsername, expiresInSec: 600 };
  });
  app.delete('/api/me/telegram', { preHandler: auth }, async (req) => {
    store.setTgLink(req.user.id, null);
    audit(req, 'Huỷ liên kết Telegram');
    return mine(req.user.id);
  });
};

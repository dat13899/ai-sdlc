'use strict';
// Quy đổi thay đổi dữ liệu thành tin nhắn thông báo (hàm thuần, không gọi mạng — lib/telegram.js lo việc gửi).
const { summarize, enforced, STATUS } = require('./progress');

const tracksOf = (p) => [['base', 'Nền tảng', p.base], ...p.items.map((i) => [i.id, i.name, i])];
const membersWith = (p, roles) => (p.members || []).filter((m) => m.roles.some((r) => roles.includes(r))).map((m) => m.userId);
const link = (base, p, tid, step) => (base ? `\n${base}/p/${p.id}/t/${tid}${step ? '#' + step : ''}` : '');

// So sánh dự án trước / sau một thao tác → danh sách { event, to, text }.
// Sự kiện: assign (được giao bước), gateWaiting (gate chờ vai trò của mình), gateFail (gate không đạt → PM),
// aiReview (có nội dung AI chờ duyệt → PM / Tech Lead). Không bao giờ báo cho chính người vừa thao tác.
function diffEvents(proc, before, after, actorId, baseUrl = '') {
  const out = [];
  const push = (event, to, text) => { for (const u of new Set(to)) if (u && u !== actorId) out.push({ event, to: u, text }); };
  const beforeTrack = Object.fromEntries(tracksOf(before).map(([id, , t]) => [id, t]));

  for (const [tid, tname, t] of tracksOf(after)) {
    const bt = beforeTrack[tid];
    const where = `${after.name} › ${tname}`;

    // được giao bước
    for (const [code, st] of Object.entries(t.steps)) {
      const was = (bt?.steps[code]?.owners) || [];
      const added = st.owners.filter((o) => !was.includes(o));
      if (added.length) {
        const s = proc.steps.find((x) => x.code === code);
        push('assign', added, `🆕 Bạn được giao bước ${code} — ${s.name}\n${where}${link(baseUrl, after, tid, code)}`);
      }
    }

    if (!enforced(after)) continue; // chưa khai báo thành viên thì chưa biết báo cho ai

    // gate mới tới lượt, chờ vai trò của mình ký
    const aBlock = summarize(proc, t).blocking;
    const bBlock = bt ? summarize(proc, bt).blocking : null;
    if (aBlock && aBlock.key !== bBlock?.key) {
      push('gateWaiting', membersWith(after, aBlock.roles),
        `⛔ ${aBlock.id} đang chờ vai trò của bạn ký\n${where}\nĐiều kiện: ${aBlock.check}${link(baseUrl, after, tid, aBlock.at)}`);
    }

    // gate vừa bị đánh "Không đạt"
    for (const g of proc.gates) {
      if (t.gates[g.key]?.result === 'fail' && bt?.gates[g.key]?.result !== 'fail') {
        const note = t.gates[g.key].note;
        push('gateFail', membersWith(after, ['PM']), `❌ ${g.id} không đạt — ${where}${note ? `\nGhi chú: ${note}` : ''}\nNgười ký: ${t.gates[g.key].by}${link(baseUrl, after, tid, g.at)}`);
      }
    }
  }

  // nội dung AI mới ghi, chờ người khác duyệt
  if (enforced(after)) {
    const seen = new Set((before.aiLogs || []).map((l) => l.id));
    for (const l of after.aiLogs || []) {
      if (seen.has(l.id) || l.result !== 'pending') continue;
      const tname = l.track === 'base' ? 'Nền tảng' : after.items.find((i) => i.id === l.track)?.name || '';
      push('aiReview', membersWith(after, ['PM', 'TechLead']).filter((u) => u !== l.by),
        `🤖 Có nội dung AI chờ duyệt — ${after.name} › ${tname} · ${l.step}\n${l.tool}: ${l.purpose}\nNgười ghi: ${l.byName}${link(baseUrl, after, l.track, l.step)}`);
    }

    // bug S1/S2 mới ghi
    const seenBugs = new Set((before.bugs || []).map((b) => b.id));
    for (const b of after.bugs || []) {
      if (seenBugs.has(b.id) || !['S1', 'S2'].includes(b.severity) || b.status === 'closed') continue;
      const tname = b.track === 'base' ? 'Nền tảng' : after.items.find((i) => i.id === b.track)?.name || '';
      push('gateFail', membersWith(after, ['PM', 'TechLead']),
        `🐛 Phát hiện ${b.severity} [${b.code}] — ${after.name} › ${tname} · ${b.step}\nTiêu đề: ${b.title}\nNgười báo: ${b.foundByName}${link(baseUrl, after, b.track, b.step)}`);
    }
  }
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dmy = (s) => s.split('-').reverse().join('/');

// Tóm tắt buổi sáng gửi vào nhóm: việc đang chạy, gate đang chờ, bước quá hạn, nội dung AI chờ duyệt.
function buildDigest(proc, projects, users, now = new Date(), baseUrl = '') {
  const today = ymd(now);
  const nameOf = (id) => users.find((u) => u.id === id)?.name || '?';
  const lines = [];
  const overdue = [];
  let pendingAi = 0;
  let openBugs = 0;
  for (const p of projects.filter((x) => !x.archived)) {
    pendingAi += (p.aiLogs || []).filter((l) => l.result === 'pending').length;
    openBugs += (p.bugs || []).filter((b) => ['S1', 'S2'].includes(b.severity) && b.status !== 'closed').length;
    for (const [tid, tname, t] of tracksOf(p)) {
      if (t.archived) continue;
      const s = summarize(proc, t);
      if (s.current) {
        const gate = s.failed.length ? ` · ❌ ${s.failed.map((g) => g.id).join(', ')} không đạt` : s.blocking ? ` · ⛔ ${s.blocking.id} chờ ký` : '';
        lines.push(`• ${p.name} › ${tname}: ${s.current} (${s.pct}%)${gate}`);
      }
      for (const [code, st] of Object.entries(t.steps)) {
        if (st.end && st.end < today && !['done', 'skipped'].includes(st.status)) {
          overdue.push(`⏰ ${p.name} › ${tname} · ${code} (hạn ${dmy(st.end)}, ${STATUS[st.status]})${st.owners.length ? ' — ' + st.owners.map(nameOf).join(', ') : ''}`);
        }
      }
    }
  }
  if (!lines.length && !overdue.length && !pendingAi && !openBugs) return null;
  const MAX = 3600; // Telegram giới hạn 4096 ký tự / tin
  const parts = [`📋 AI-SDLC — tóm tắt ${dmy(today)}`];
  if (lines.length) parts.push('', 'Đang chạy:', ...lines);
  if (overdue.length) parts.push('', ...overdue);
  if (pendingAi) parts.push('', `🤖 Nội dung AI chờ duyệt: ${pendingAi}`);
  if (openBugs) parts.push('', `🐛 Bug S1/S2 chưa đóng: ${openBugs}`);
  if (baseUrl) parts.push('', `${baseUrl}/tasks`);
  let text = parts.join('\n');
  if (text.length > MAX) text = text.slice(0, MAX).replace(/\n[^\n]*$/, '') + '\n… (còn nữa, xem trên CMS)';
  return text;
}

// Trả lời lệnh /viec: việc của riêng một người (cùng dữ liệu với trang "Việc của tôi").
function formatTasks(t, baseUrl = '') {
  const total = t.steps.length + t.gates.length + t.reviews.length;
  if (!total) return '🎉 Hiện không có việc nào đang chờ bạn.';
  const MAX = 3600, parts = [`📌 Việc của bạn (${total})`];
  const sec = (title, rows) => rows.length && parts.push('', title, ...rows);
  sec('Bước được giao:', t.steps.map((s) => `• ${s.projectName} › ${s.trackName} · ${s.step} ${s.stepName} (${s.pct}%)${s.end ? ' · hạn ' + dmy(s.end) : ''}`));
  sec('Gate chờ bạn ký:', t.gates.map((g) => `• ${g.projectName} › ${g.trackName} · ${g.gateId}`));
  sec('Nội dung AI chờ bạn duyệt:', t.reviews.map((r) => `• ${r.projectName} › ${r.trackName} · ${r.step}: ${r.purpose}`));
  if (baseUrl) parts.push('', `${baseUrl}/tasks`);
  const text = parts.join('\n');
  return text.length > MAX ? text.slice(0, MAX).replace(/\n[^\n]*$/, '') + '\n… (còn nữa, xem trên CMS)' : text;
}

module.exports = { diffEvents, buildDigest, formatTasks, ymd };

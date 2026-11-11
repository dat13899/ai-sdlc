'use strict';
// "Việc của tôi": bước được giao, gate đang chờ vai trò của mình ký, nội dung AI chờ mình duyệt.
// Hàm thuần — dùng chung cho API /api/my-tasks và lệnh /viec của bot Telegram.
const { stepPct, summarize, enforced, isMember, gateRoleBlocker } = require('./progress');

function collectTasks(PROC, projects, user) {
  const me = user.id;
  const out = { steps: [], gates: [], reviews: [] };
  for (const p of projects) {
    if (p.archived) continue;
    const tracks = [['base', 'Nền tảng', p.base], ...p.items.filter((i) => !i.archived).map((i) => [i.id, i.name, i])];
    for (const [tid, tname, t] of tracks) {
      const where = { project: p.id, projectName: p.name, track: tid, trackName: tname };
      for (const [code, st] of Object.entries(t.steps)) {
        if (st.owners.includes(me) && !['done', 'skipped'].includes(st.status)) {
          out.steps.push({ ...where, step: code, stepName: PROC.steps.find((s) => s.code === code).name, status: st.status, pct: stepPct(PROC, t, code), end: st.end });
        }
      }
      // gate đang chặn mà vai trò của mình ký được (chỉ khi dự án đã khai báo thành viên)
      const blocking = enforced(p) ? summarize(PROC, t).blocking : null;
      if (blocking && !gateRoleBlocker(PROC, p, user, blocking.key)) {
        out.gates.push({ ...where, gate: blocking.key, gateId: blocking.id, at: blocking.at, check: blocking.check, result: t.gates[blocking.key].result });
      }
    }
    if (enforced(p) && isMember(p, me)) {
      for (const l of p.aiLogs) {
        if (l.result !== 'pending' || l.by === me) continue;
        const trackName = l.track === 'base' ? 'Nền tảng' : p.items.find((i) => i.id === l.track)?.name || '';
        out.reviews.push({ project: p.id, projectName: p.name, track: l.track, trackName, id: l.id, step: l.step, tool: l.tool, purpose: l.purpose, byName: l.byName, at: l.at });
      }
    }
  }
  return out;
}

module.exports = { collectTasks };

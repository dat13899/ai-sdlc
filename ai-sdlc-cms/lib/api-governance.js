'use strict';
// Các route quản trị việc dùng AI: thành viên & vai trò, thiết lập AI của dự án, nhật ký dùng AI, "việc của tôi".
// Đăng ký từ lib/api.js; dùng chung helper (HttpError, save, log, preHandler…) qua ctx.
const { AI_ORIGIN, AI_RESULT, DATA_LEVEL, enforced, isMember } = require('./progress');
const { collectTasks } = require('./tasks');
const { buildMetrics } = require('./metrics');

module.exports = function registerGovernance(app, ctx) {
  const { store, PROC, project, track, auth, save, log, str, bad, HttpError, canManage, canSetup } = ctx;

  /* ---------- thành viên & vai trò, thiết lập AI ---------- */
  app.put('/api/projects/:id/members', { preHandler: project }, async (req) => {
    if (!canManage(req.project, req.user)) throw new HttpError(403, 'Chỉ admin hoặc PM của dự án mới sửa được thành viên');
    const members = store.cleanMembers(req.body?.members);
    const users = store.listUsers();
    const label = (m) => `${users.find((u) => u.id === m.userId)?.name} (${m.roles.join('/')})`;
    const p = save(req, (x) => { x.members = members; });
    log(req, p.id, 'Sửa thành viên & vai trò', members.map(label).join('; ') || '(trống — tắt kiểm soát vai trò)');
    return p;
  });

  app.put('/api/projects/:id/ai-setup', { preHandler: project }, async (req) => {
    if (!canSetup(req.project, req.user)) throw new HttpError(403, 'Chỉ admin, PM hoặc Tech Lead của dự án mới sửa được thiết lập AI');
    let setup;
    try { setup = store.cleanAiSetup(req.body); } catch (e) { throw bad(e.message); }
    const p = save(req, (x) => { x.aiSetup = setup; });
    log(req, p.id, 'Sửa thiết lập AI', `công cụ: ${setup.tools.join(', ') || '(trống)'} · dữ liệu: ${DATA_LEVEL[setup.dataLevel] || '(chưa chọn)'}`);
    return p;
  });

  /* ---------- nhật ký dùng AI ---------- */
  // khi dự án đã khai báo thành viên thì chỉ thành viên mới ghi / duyệt
  const memberOnly = (req) => {
    if (enforced(req.project) && !isMember(req.project, req.user.id)) throw new HttpError(403, 'Chỉ thành viên dự án mới ghi / duyệt nhật ký AI');
  };

  app.post('/api/projects/:id/t/:t/ai-logs', { preHandler: track }, async (req) => {
    memberOnly(req);
    const b = req.body || {};
    if (!req.track.steps[b.step]) throw bad('Bước không thuộc hạng mục này');
    if (!AI_ORIGIN[b.origin]) throw bad('Nhãn nguồn gốc không hợp lệ');
    const tools = req.project.aiSetup.tools;
    let tool = '';
    if (b.origin !== 'manual') {
      if (!tools.length) throw bad('Dự án chưa khai báo công cụ AI được duyệt — vào tab Nền tảng, mục Thiết lập AI');
      if (!tools.includes(b.tool)) throw bad(`Công cụ "${str(b.tool, 60)}" chưa được duyệt cho dự án này`);
      tool = b.tool;
    }
    const purpose = str(b.purpose, 300);
    if (!purpose) throw bad('Cần ghi mục đích dùng');
    const promptId = str(b.promptId, 40);
    if (!/^[A-Za-z0-9_.-]*$/.test(promptId)) throw bad('Mã prompt chỉ gồm chữ, số và . _ -');
    // chỉ lưu mục đích + mã prompt, KHÔNG lưu nội dung prompt (có thể chứa dữ liệu nhạy cảm)
    const entry = {
      id: store.newId(), track: req.params.t, step: b.step, tool, model: str(b.model, 80), purpose, promptId, origin: b.origin,
      result: b.origin === 'manual' ? 'na' : 'pending', note: str(b.note, 500), by: req.user.id, byName: req.user.name, at: new Date().toISOString(),
    };
    const p = save(req, (x) => { x.aiLogs.push(entry); });
    log(req, p.id, `Ghi nhật ký AI ${b.step} [${req.trackName}]`, `${AI_ORIGIN[entry.origin]}${tool ? ' · ' + tool : ''} — ${purpose}`);
    return p;
  });

  app.put('/api/projects/:id/ai-logs/:logId/review', { preHandler: project }, async (req) => {
    memberOnly(req);
    const l = req.project.aiLogs.find((x) => x.id === req.params.logId);
    if (!l) throw new HttpError(404, 'Không tìm thấy mục nhật ký');
    if (l.result !== 'pending') throw bad('Mục này đã được duyệt');
    if (l.by === req.user.id) throw bad('Người duyệt phải khác người ghi nhận');
    const result = req.body?.result;
    if (!['accepted', 'edited', 'rejected'].includes(result)) throw bad('Kết quả duyệt không hợp lệ');
    const p = save(req, (x) => {
      Object.assign(x.aiLogs.find((y) => y.id === l.id), {
        result, reviewer: req.user.id, reviewerName: req.user.name, reviewedAt: new Date().toISOString(), reviewNote: str(req.body?.note, 500),
      });
    });
    log(req, p.id, `Duyệt nội dung AI ${l.step}`, `${AI_RESULT[result]} — ${l.purpose}`);
    return p;
  });

  app.delete('/api/projects/:id/ai-logs/:logId', { preHandler: project }, async (req) => {
    const l = req.project.aiLogs.find((x) => x.id === req.params.logId);
    if (!l) throw new HttpError(404, 'Không tìm thấy mục nhật ký');
    // người ghi chỉ xoá được khi chưa ai duyệt; đã duyệt rồi thì chỉ admin xoá (để giữ dấu vết)
    if (!(req.user.admin || (l.by === req.user.id && ['pending', 'na'].includes(l.result)))) throw new HttpError(403, 'Không xoá được mục này');
    const p = save(req, (x) => { x.aiLogs = x.aiLogs.filter((y) => y.id !== l.id); });
    log(req, p.id, `Xoá nhật ký AI ${l.step}`, l.purpose);
    return p;
  });

  /* ---------- việc của tôi ---------- */
  app.get('/api/my-tasks', { preHandler: auth }, async (req) => collectTasks(PROC, store.listProjects(), req.user));

  /* ---------- báo cáo & số liệu (mọi tài khoản xem được, giống danh sách dự án) ---------- */
  app.get('/api/metrics', { preHandler: auth }, async () => buildMetrics(PROC, store.listProjects(), store.listUsers(), store.readAudit(undefined, 5000)));
};

'use strict';
// Quản lý Bug nội bộ: tạo bug tại B11/B12, cập nhật trạng thái (open, fixing, closed), xóa bug.
// Gate 4 đòi hỏi bug S1-S2 = 0 mới được ký Đạt.
const { BUG_SEVERITY, BUG_STATUS } = require('./progress');

module.exports = function registerBugs(app, ctx) {
  const { store, project, track, save, log, str, bad, HttpError } = ctx;

  // Tạo bug mới trong track
  app.post('/api/projects/:id/t/:t/bugs', { preHandler: track }, async (req) => {
    const b = req.body || {};
    const title = str(b.title, 200);
    if (!title) throw bad('Thiếu tiêu đề bug');
    const severity = BUG_SEVERITY[b.severity] ? b.severity : 'S3';
    const step = str(b.step || 'B11', 10);
    const count = (req.project.bugs || []).filter((x) => x.track === req.params.t).length + 1;
    const code = `BUG-${String(count).padStart(3, '0')}`;
    const users = store.listUsers();
    const fixBy = str(b.fixBy, 40);
    const fixUser = users.find((u) => u.id === fixBy);

    const entry = {
      id: store.newId(),
      code,
      track: req.params.t,
      step,
      title,
      severity,
      status: 'open',
      note: str(b.note, 1000),
      foundBy: req.user.id,
      foundByName: req.user.name,
      fixBy: fixUser ? fixUser.id : '',
      fixByName: fixUser ? fixUser.name : '',
      createdAt: new Date().toISOString(),
      closedAt: null,
      closedBy: '',
    };

    const p = save(req, (x) => {
      x.bugs = x.bugs || [];
      x.bugs.push(entry);
    });
    log(req, p.id, `Tạo ${code} [${req.trackName}]`, `${severity}: ${title}`);
    return p;
  });

  // Cập nhật trạng thái / thông tin bug
  app.put('/api/projects/:id/bugs/:bugId', { preHandler: project }, async (req) => {
    const b = req.project.bugs?.find((x) => x.id === req.params.bugId);
    if (!b) throw new HttpError(404, 'Không tìm thấy bug');
    const body = req.body || {};
    const users = store.listUsers();

    let changes = [];
    const p = save(req, (x) => {
      const bug = x.bugs.find((y) => y.id === b.id);
      if (body.title && str(body.title, 200) !== bug.title) {
        changes.push(`tiêu đề: ${str(body.title, 200)}`);
        bug.title = str(body.title, 200);
      }
      if (body.severity && BUG_SEVERITY[body.severity] && body.severity !== bug.severity) {
        changes.push(`mức độ: ${bug.severity} → ${body.severity}`);
        bug.severity = body.severity;
      }
      if (body.status && BUG_STATUS[body.status] && body.status !== bug.status) {
        changes.push(`trạng thái: ${BUG_STATUS[bug.status]} → ${BUG_STATUS[body.status]}`);
        bug.status = body.status;
        if (body.status === 'closed') {
          bug.closedAt = new Date().toISOString();
          bug.closedBy = req.user.name;
        } else {
          bug.closedAt = null;
          bug.closedBy = '';
        }
      }
      if (body.note !== undefined && str(body.note, 1000) !== bug.note) {
        bug.note = str(body.note, 1000);
      }
      if (body.fixBy !== undefined) {
        const fixUser = users.find((u) => u.id === body.fixBy);
        bug.fixBy = fixUser ? fixUser.id : '';
        bug.fixByName = fixUser ? fixUser.name : '';
      }
    });

    if (changes.length) log(req, p.id, `Cập nhật ${b.code}`, changes.join('; '));
    return p;
  });

  // Xóa bug (chỉ người tạo hoặc admin)
  app.delete('/api/projects/:id/bugs/:bugId', { preHandler: project }, async (req) => {
    const b = req.project.bugs?.find((x) => x.id === req.params.bugId);
    if (!b) throw new HttpError(404, 'Không tìm thấy bug');
    if (!req.user.admin && b.foundBy !== req.user.id) {
      throw new HttpError(403, 'Chỉ người báo bug hoặc admin mới được xóa');
    }
    const p = save(req, (x) => {
      x.bugs = (x.bugs || []).filter((y) => y.id !== b.id);
    });
    log(req, p.id, `Xóa bug ${b.code}`, b.title);
    return p;
  });
};

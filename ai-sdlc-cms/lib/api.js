'use strict';
// API JSON cho giao diện React (web/). Mọi route nằm dưới /api, cần đăng nhập (trừ /api/login).
// Lỗi trả { error } kèm mã 400/401/403/404/409. Thao tác ghi trả về dự án đã cập nhật (kèm số liệu
// tiến độ tính sẵn ở `view`) để giao diện cập nhật cache, không phải tự tính lại quy tắc nghiệp vụ.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const mammoth = require('mammoth');
const { marked } = require('marked');
const htmlToDocx = require('html-to-docx');
const xlsx = require('xlsx');
const JSZip = require('jszip');
const { STATUS, GATE_RESULT, KIND, AI_ORIGIN, AI_RESULT, DATA_LEVEL, BUG_SEVERITY, BUG_STATUS, FAST_QUESTIONS, stepPct, summarize, gateBlocker, gateApplies,
  enforced, rolesOf, isMember, gateRoleBlocker, pendingAi, missingDocs, setupStatus, openS1S2Bugs, canViewProject, canCreateItem, canManageItems, canEditStep } = require('./progress');

const ALLOWED_DOC_EXTS = {
  '.md': 'text/markdown; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const DATE_RE = /^(\d{4}-\d{2}-\d{2})?$/;
const str = (v, max) => String(v ?? '').trim().slice(0, max);

class HttpError extends Error { constructor(code, msg, extra) { super(msg); this.statusCode = code; this.extra = extra; } }
const bad = (msg) => new HttpError(400, msg);

module.exports = function registerApi(app, { store, PROC, sessions, SESSION_MS, MAX_UPLOAD, tg }) {
  const log = (req, project, action, detail) => store.audit({ user: req.user.name, uid: req.user.id, project, action, detail });

  // số liệu tính sẵn cho từng track (giao diện chỉ đọc, không tự tính lại quy tắc nghiệp vụ)
  function trackView(t, p, tid, user) {
    const s = summarize(PROC, t);
    const trackBugs = (p.bugs || []).filter((b) => b.track === tid);
    const s1s2 = openS1S2Bugs(p, tid);
    return {
      pct: s.pct, current: s.current, blocking: s.blocking && s.blocking.key, failed: s.failed.map((g) => g.key),
      stepPct: Object.fromEntries(Object.keys(t.steps).map((c) => [c, stepPct(PROC, t, c)])),
      canEditStep: Object.fromEntries(Object.keys(t.steps).map((c) => [c, canEditStep(p, t.steps[c], user)])),
      // tài liệu bắt buộc còn thiếu của từng bước (chỉ cảnh báo)
      stepMissing: Object.fromEntries(Object.keys(t.steps).map((c) => [c, missingDocs(PROC, p, tid, t, c).filter((x) => x.step === c)])),
      bugs: {
        total: trackBugs.length,
        open: trackBugs.filter((b) => b.status !== 'closed').length,
        openS1S2: s1s2.length,
      },
      gates: Object.fromEntries(Object.keys(t.gates).map((k) => {
        const g = PROC.gates.find((x) => x.key === k);
        return [k, {
          applies: gateApplies(t, g), blocker: gateBlocker(PROC, t, k, p, tid),
          roleBlocker: gateRoleBlocker(PROC, p, user, k),   // lý do người đang xem không ký được (theo vai trò)
          pendingAi: pendingAi(PROC, p, tid, g.at).length,  // số mục AI chưa được người duyệt (chặn ký Đạt)
          missingDocs: missingDocs(PROC, p, tid, t, g.at),  // tài liệu bắt buộc còn thiếu (chỉ cảnh báo)
        }];
      })),
    };
  }
  // quyền quản lý của người đang xem: admin, hoặc (khi dự án đã khai báo thành viên) PM / Tech Lead
  const canManage = (p, user) => user.admin || (enforced(p) && rolesOf(p, user.id).includes('PM'));
  const canSetup = (p, user) => user.admin || (enforced(p) && rolesOf(p, user.id).some((r) => r === 'PM' || r === 'TechLead'));
  const withView = (p, user) => ({
    ...p,
    view: {
      base: trackView(p.base, p, 'base', user),
      items: Object.fromEntries(p.items.map((i) => [i.id, trackView(i, p, i.id, user)])),
      setup: setupStatus(PROC, p),
      me: {
        roles: rolesOf(p, user.id),
        enforced: enforced(p),
        canManage: canManage(p, user),
        canSetup: canSetup(p, user),
        canCreateItem: canCreateItem(p, user),
        canManageItems: canManageItems(p, user),
        isMember: isMember(p, user.id),
      },
    },
  });

  app.setErrorHandler((err, req, reply) => {
    const code = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (code === 500) req.log.error(err);
    reply.code(code).send({ error: code === 500 ? 'Lỗi máy chủ' : err.message, ...(code < 500 ? err.extra : {}) });
  });

  const auth = async (req) => { if (!req.user) throw new HttpError(401, 'Chưa đăng nhập'); };
  const admin = async (req) => { await auth(req); if (!req.user.admin) throw new HttpError(403, 'Chỉ dành cho admin'); };
  const project = async (req) => {
    await auth(req);
    const p = store.getProject(req.params.id);
    if (!p || !canViewProject(p, req.user)) throw new HttpError(404, 'Không tìm thấy dự án');
    req.project = p;
  };
  const track = async (req) => {
    await project(req);
    req.track = store.getTrack(req.project, req.params.t);
    if (!req.track) throw new HttpError(404, 'Không tìm thấy hạng mục');
    req.trackName = req.params.t === 'base' ? 'Nền tảng' : req.track.name;
  };
  // sửa dự án rồi trả bản mới (kèm view)
  const save = (req, fn) => {
    const after = store.updateProject(req.project.id, fn);
    tg.notifyDiff(req.project, after, req.user.id); // thông báo Telegram: so trước/sau, gửi nền, lỗi chỉ ghi log
    return withView(after, req.user);
  };
  const trackOf = (p, req) => store.getTrack(p, req.params.t);

  /* ---------- phiên ---------- */
  app.post('/api/login', { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } }, async (req, reply) => {
    const u = store.verify(req.body?.username, req.body?.password);
    if (!u) throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');
    const sid = crypto.randomBytes(32).toString('base64url');
    sessions.set(sid, { uid: u.id, exp: Date.now() + SESSION_MS });
    reply.setCookie('sid', sid, { path: '/', httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE !== 'false' /* chỉ tắt khi host chưa có HTTPS */, maxAge: SESSION_MS / 1000 });
    return u;
  });
  app.post('/api/logout', async (req, reply) => {
    sessions.delete(req.cookies.sid);
    reply.clearCookie('sid', { path: '/' });
    return { ok: true };
  });
  app.get('/api/me', { preHandler: auth }, async (req) => req.user);
  app.post('/api/me/password', { preHandler: auth }, async (req) => {
    if (!store.verify(req.user.username, req.body?.current)) throw bad('Mật khẩu hiện tại không đúng');
    try { store.updateUser(req.user.id, (u, setPw) => setPw(String(req.body.password || ''))); } catch (e) { throw bad(e.message); }
    const keep = sessions.hash(req.cookies.sid);
    sessions.deleteWhere((s, h) => s.uid === req.user.id && h !== keep); // đăng xuất các phiên khác
    return { ok: true };
  });

  /* ---------- dữ liệu dùng chung ---------- */
  app.get('/api/process', { preHandler: auth }, async () => ({
    ...PROC, labels: { STATUS, GATE_RESULT, KIND, AI_ORIGIN, AI_RESULT, DATA_LEVEL, BUG_SEVERITY, BUG_STATUS }, fastQuestions: FAST_QUESTIONS,
  }));
  app.get('/api/users', { preHandler: auth }, async () => store.listUsers());

  /* ---------- dự án ---------- */
  app.get('/api/projects', { preHandler: auth }, async (req) =>
    store.listProjects().filter((p) => canViewProject(p, req.user)).map((p) => withView(p, req.user)));
  app.get('/api/projects/:id', { preHandler: project }, async (req) => withView(req.project, req.user));
  app.get('/api/projects/:id/log', { preHandler: project }, async (req) => store.readAudit(req.project.id));

  app.post('/api/projects', { preHandler: admin }, async (req) => {
    let p;
    try { p = store.createProject(req.body || {}, req.user.id); } catch (e) { throw bad(e.message); }
    log(req, p.id, 'Tạo dự án', p.name);
    return withView(p, req.user);
  });
  app.put('/api/projects/:id', { preHandler: [admin, project] }, async (req) => {
    const b = req.body || {};
    let info;
    try {
      const name = str(b.name, 120);
      if (!name) throw new Error('Thiếu tên dự án');
      const visibility = b.visibility === 'private' ? 'private' : 'public';
      info = { name, code: str(b.code, 30), description: str(b.description, 1000), repoUrl: store.cleanRepo(b.repoUrl), branch: store.cleanBranch(b.branch), repoType: store.cleanRepoType(b.repoType), visibility };
    } catch (e) { throw bad(e.message); }
    const p = save(req, (x) => Object.assign(x, info));
    log(req, p.id, 'Sửa thông tin dự án', `${info.name} · repo: ${info.repoUrl || '(trống)'} @ ${info.branch}`);
    return p;
  });
  app.post('/api/projects/:id/archive', { preHandler: [admin, project] }, async (req) => {
    const archived = !!req.body?.archived;
    const p = save(req, (x) => { x.archived = archived; });
    log(req, p.id, archived ? 'Lưu trữ dự án' : 'Bỏ lưu trữ dự án', p.name);
    return p;
  });

  /* ---------- hạng mục ---------- */
  app.post('/api/projects/:id/items', { preHandler: project }, async (req) => {
    if (!canCreateItem(req.project, req.user)) {
      throw new HttpError(403, 'Chỉ thành viên của dự án mới có quyền tạo hạng mục');
    }
    // chặn mềm: dự án chưa sẵn sàng dùng AI (B2, công cụ, mức dữ liệu, file luật) thì chưa cho tạo hạng mục;
    // admin được bỏ qua có chủ đích (force) và việc bỏ qua được ghi vào nhật ký
    const st = setupStatus(PROC, req.project);
    const forced = !st.ready && req.user.admin && req.body?.force === true;
    if (!st.ready && !forced) throw new HttpError(409, 'Thiết lập AI của dự án chưa đủ: ' + st.missing.join('; '), { setup: st.missing, canForce: req.user.admin });
    let it;
    let p;
    try { p = save(req, (x) => { it = store.addItem(x, req.body || {}, req.user.id); }); } catch (e) { throw bad(e.message); }
    if (forced) log(req, p.id, 'Bỏ qua cảnh báo thiết lập AI', st.missing.join('; '));
    log(req, p.id, 'Tạo hạng mục', `${it.name} (${KIND[it.kind]})${it.crCode ? ' · ' + it.crCode : ''}${it.ref ? ' — ' + it.ref : ''}`);
    return { project: p, itemId: it.id };
  });
  app.put('/api/projects/:id/items/:t', { preHandler: track }, async (req) => {
    if (req.params.t === 'base') throw bad('Không áp dụng cho nền tảng');
    if (!canManageItems(req.project, req.user)) {
      throw new HttpError(403, 'Chỉ PM hoặc PO mới có quyền chỉnh sửa hạng mục');
    }
    const b = req.body || {};
    const name = str(b.name, 120);
    if (!name) throw bad('Thiếu tên hạng mục');
    let specDir;
    try { specDir = store.cleanSpecDir(b.specDir); } catch (e) { throw bad(e.message); }
    const p = save(req, (x) => Object.assign(trackOf(x, req), { name, specDir, ref: str(b.ref, 300) }));
    log(req, p.id, 'Sửa hạng mục', `${name} · thư mục: ${specDir || '(trống)'}`);
    return p;
  });
  app.post('/api/projects/:id/items/:t/archive', { preHandler: track }, async (req) => {
    if (req.params.t === 'base') throw bad('Không lưu trữ được nền tảng');
    if (!canManageItems(req.project, req.user)) {
      throw new HttpError(403, 'Chỉ PM hoặc PO mới có quyền lưu trữ hạng mục');
    }
    const archived = !!req.body?.archived;
    const p = save(req, (x) => { trackOf(x, req).archived = archived; });
    log(req, p.id, archived ? 'Lưu trữ hạng mục' : 'Bỏ lưu trữ hạng mục', req.trackName);
    return p;
  });

  /* ---------- bước, checklist, gate ---------- */
  app.put('/api/projects/:id/t/:t/steps/:code', { preHandler: track }, async (req) => {
    const { code } = req.params;
    const b = req.body || {};
    const st = req.track.steps[code];
    if (!st) throw bad('Bước không thuộc hạng mục này');
    if (!STATUS[b.status] || !DATE_RE.test(b.start || '') || !DATE_RE.test(b.end || '')) throw bad('Dữ liệu không hợp lệ');

    // Kiểm tra quyền sửa bước:
    const canEdit = canEditStep(req.project, st, req.user);
    const isClaiming = (st.owners || []).length === 0 && (b.owners || []).includes(req.user.id) && isMember(req.project, req.user.id);
    if (!canEdit && !isClaiming) {
      throw new HttpError(403, 'Chỉ người phụ trách bước này hoặc PM/TechLead mới có quyền thay đổi tiến độ');
    }

    // người phụ trách: chỉ nhận tài khoản đang hoạt động (giữ người đã khoá nếu vốn đã được giao)
    const users = store.listUsers();
    const prev = st.owners || [];
    const owners = b.owners !== undefined
      ? [...new Set([].concat(b.owners))].filter((id) => users.some((u) => u.id === id && (!u.disabled || prev.includes(id))))
      : prev;
    const names = (ids) => ids.map((id) => users.find((u) => u.id === id).name).join(', ') || '(trống)';
    let changes = [];
    const p = save(req, (x) => {
      const stepObj = trackOf(x, req).steps[code];
      const next = { status: b.status, start: b.start || '', end: b.end || '', note: str(b.note, 2000) };
      changes = Object.keys(next).filter((k) => stepObj[k] !== next[k]).map((k) => `${k}: ${k === 'status' ? STATUS[stepObj[k]] + ' → ' + STATUS[next[k]] : next[k] || '(trống)'}`);
      if (owners.join() !== stepObj.owners.join()) changes.push(`phụ trách: ${names(owners)}`);
      Object.assign(stepObj, next, { owners });
      // mốc thời gian thật để tính số liệu (khác start/end là ngày kế hoạch)
      const now = new Date().toISOString();
      if (next.status === 'todo') { delete stepObj.startedAt; delete stepObj.doneAt; }
      else if (next.status === 'doing') { stepObj.startedAt ||= now; delete stepObj.doneAt; }
      else if (next.status === 'done') { stepObj.startedAt ||= now; stepObj.doneAt ||= now; }
      else delete stepObj.doneAt;
      delete stepObj.owner; // trường chữ tự do của bản cũ
    });
    if (changes.length) log(req, p.id, `Cập nhật ${code} [${req.trackName}]`, changes.join('; '));
    return p;
  });

  app.put('/api/projects/:id/t/:t/checks/:code', { preHandler: track }, async (req) => {
    const { code } = req.params;
    const st = req.track.steps[code];
    if (!st) throw bad('Bước không thuộc hạng mục này');
    if (!canEditStep(req.project, st, req.user)) {
      throw new HttpError(403, 'Chỉ người phụ trách bước này hoặc PM/TechLead mới có quyền cập nhật checklist');
    }
    const n = PROC.steps.find((s) => s.code === code).rows.length;
    const on = new Set([].concat(req.body?.checks ?? []).map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < n));
    const before = st.checks.filter(Boolean).length;
    const p = save(req, (x) => { trackOf(x, req).steps[code].checks = Array.from({ length: n }, (_, i) => on.has(i)); });
    if (before !== on.size) log(req, p.id, `Checklist ${code} [${req.trackName}]`, `${before}/${n} → ${on.size}/${n}`);
    if (before !== on.size) log(req, p.id, `Checklist ${code} [${req.trackName}]`, `${before}/${n} → ${on.size}/${n}`);
    return p;
  });

  app.put('/api/projects/:id/t/:t/gates/:key', { preHandler: track }, async (req) => {
    const { key } = req.params;
    const result = req.body?.result;
    if (!req.track.gates[key] || !GATE_RESULT[result]) throw bad('Dữ liệu không hợp lệ');
    const g = PROC.gates.find((x) => x.key === key);
    const roleBlock = gateRoleBlocker(PROC, req.project, req.user, key);
    if (roleBlock) throw new HttpError(403, roleBlock);
    if (!gateApplies(req.track, g)) throw new HttpError(409, `${g.id}: bước ${g.at} đã bỏ qua, gate không áp dụng`);
    if (result === 'pass') {
      const blocker = gateBlocker(PROC, req.track, key, req.project, req.params.t);
      if (blocker) throw new HttpError(409, `${g.id}: ${blocker}`);
      // Human Gate: nội dung do AI sinh phải có người duyệt trước khi ký Đạt
      const pend = pendingAi(PROC, req.project, req.params.t, g.at);
      if (pend.length) throw new HttpError(409, `${g.id}: còn ${pend.length} mục AI chưa được người duyệt (${[...new Set(pend.map((l) => l.step))].join(', ')})`);
    }
    const reset = [];
    const p = save(req, (x) => {
      const t = trackOf(x, req);
      t.gates[key] = { result, by: req.user.name, uid: req.user.id, at: new Date().toISOString(), note: str(req.body.note, 2000) };
      // gate phụ thuộc (vd Gate 4 cần 4a/4b/4c) bị huỷ "Đạt" nếu gate nó cần không còn đạt
      if (result !== 'pass') {
        for (const dep of PROC.gates.filter((d) => (d.requires || []).includes(key))) {
          if (t.gates[dep.key] && t.gates[dep.key].result === 'pass') { t.gates[dep.key] = { result: 'pending', by: '', at: '', note: '' }; reset.push(dep.id); }
        }
      }
    });
    log(req, p.id, `Ký ${g.id} [${req.trackName}]`, GATE_RESULT[result] + (req.body.note ? ` — ${str(req.body.note, 200)}` : '') + (reset.length ? ` (huỷ ${reset.join(', ')})` : ''));
    return { project: p, reset };
  });

  // cấu hình Telegram (admin) + liên kết tài khoản
  require('./api-telegram')(app, { store, tg, admin, auth, HttpError, bad });
  // thành viên & vai trò, thiết lập AI, nhật ký dùng AI, việc của tôi
  require('./api-governance')(app, { store, PROC, project, track, auth, save, log, str, bad, HttpError, canManage, canSetup });
  // quản lý bug nội bộ
  require('./api-bugs')(app, { store, PROC, project, track, auth, save, log, str, bad, HttpError });

  /* ---------- tài liệu ---------- */
  app.post('/api/projects/:id/docs', { preHandler: project }, async (req) => {
    if (!req.isMultipart()) throw bad('Cần multipart/form-data');
    const docId = store.newId();
    const dest = store.uploadPath(req.project.id, docId);
    const f = {};
    let file = null;
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file') {
          if (!part.filename) { part.file.resume(); continue; }
          const ext = path.extname(part.filename).toLowerCase();
          if (!ALLOWED_DOC_EXTS[ext]) {
            part.file.resume();
            throw bad(`Không hỗ trợ định dạng file ${ext || 'này'}. Các định dạng cho phép: .md, .docx, .doc, .pdf, .xlsx, .xls, .csv, .png, .jpg, .jpeg, .svg, .webp, .gif`);
          }

          await pipeline(part.file, fs.createWriteStream(dest));
          if (part.file.truncated) throw bad(`File vượt quá ${MAX_UPLOAD / 1048576} MB`);

          const buf = fs.readFileSync(dest);
          if (ext === '.md') {
            try { new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { throw bad('File .md phải là văn bản UTF-8'); }
            if (buf.includes(0)) throw bad('File .md phải là văn bản UTF-8');
          }

          const cleanName = path.basename(part.filename).slice(0, 200);
          file = { name: cleanName, size: buf.length, type: ALLOWED_DOC_EXTS[ext], ext };
        } else f[part.fieldname] = part.value;
      }
      const t = store.getTrack(req.project, f.track);
      if (!t || !t.steps[f.step]) throw bad('Bước không hợp lệ');
      const tpl = str(f.templateId, 60);
      if (tpl && !PROC.steps.find((s) => s.code === f.step).templates.some((x) => x.id === tpl)) throw bad('Biểu mẫu không hợp lệ');
      let url = str(f.url, 2000);
      if (url && !/^https?:\/\//i.test(url)) throw bad('Link phải bắt đầu bằng http:// hoặc https://');
      if (file) url = '';
      if (!file && !url) throw bad('Cần link hoặc file');
      const label = str(f.label, 160) || (file ? file.name : url);
      const p = save(req, (x) => {
        x.docs.push({ id: docId, track: f.track, step: f.step, templateId: tpl, label, url, file, by: req.user.id, byName: req.user.name, at: new Date().toISOString() });
      });
      log(req, p.id, `Thêm tài liệu ${f.step} [${f.track === 'base' ? 'Nền tảng' : t.name}]`, label);
      return p;
    } catch (e) {
      fs.rmSync(dest, { force: true });
      throw e;
    }
  });

  // Chuyển đổi file Word (.docx) sang Markdown phục vụ trình soạn thảo
  app.post('/api/projects/:id/docs/convert-docx', { preHandler: project }, async (req) => {
    if (!req.isMultipart()) throw bad('Cần multipart/form-data');
    let tmpFile = null;
    try {
      let result = null;
      let filename = '';
      for await (const part of req.parts()) {
        if (part.type === 'file') {
          if (!part.filename || !/\.docx?$/i.test(part.filename)) {
            part.file.resume();
            throw bad('Chỉ nhận file Word (.docx)');
          }
          filename = part.filename;
          const tmpId = store.newId();
          tmpFile = path.join(store.uploadPath(req.project.id, tmpId) + '.docx.tmp');
          await pipeline(part.file, fs.createWriteStream(tmpFile));
          const res = await mammoth.convertToMarkdown({ path: tmpFile });
          result = {
            markdown: res.value,
            filename: path.basename(filename).replace(/\.docx?$/i, '.md'),
            warnings: res.messages.map((m) => m.message),
          };
        }
      }
      if (tmpFile) fs.rmSync(tmpFile, { force: true });
      if (!result) throw bad('Không tìm thấy file Word để chuyển đổi');
      return result;
    } catch (e) {
      if (tmpFile) fs.rmSync(tmpFile, { force: true });
      throw e;
    }
  });

  // Tạo tài liệu Markdown trực tiếp từ trình soạn thảo
  app.post('/api/projects/:id/docs/create', { preHandler: project }, async (req) => {
    const b = req.body || {};
    const t = store.getTrack(req.project, b.track);
    if (!t || !t.steps[b.step]) throw bad('Bước không hợp lệ');
    const tpl = str(b.templateId, 60);
    if (tpl && !PROC.steps.find((s) => s.code === b.step).templates.some((x) => x.id === tpl)) throw bad('Biểu mẫu không hợp lệ');
    const label = str(b.label, 160) || 'Tài liệu mới';
    const content = String(b.content || '');
    const cleanFn = (str(b.filename, 100) || `${b.step}-${label}`).replace(/\.md$/i, '') + '.md';

    const docId = store.newId();
    const dest = store.uploadPath(req.project.id, docId);
    fs.writeFileSync(dest, content, 'utf8');

    const file = { name: cleanFn, size: Buffer.byteLength(content, 'utf8'), type: 'text/markdown' };
    const p = save(req, (x) => {
      x.docs.push({ id: docId, track: b.track, step: b.step, templateId: tpl, label, url: '', file, by: req.user.id, byName: req.user.name, at: new Date().toISOString() });
    });
    log(req, p.id, `Tạo tài liệu ${b.step} [${b.track === 'base' ? 'Nền tảng' : t.name}]`, label);
    return p;
  });

  // Cập nhật nội dung tài liệu Markdown & lưu vết phiên bản (Revision)
  app.put('/api/projects/:id/docs/:docId/content', { preHandler: project }, async (req) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d || !/\.md$/i.test(d.file.name)) throw new HttpError(404, 'Không tìm thấy tài liệu Markdown');

    const canEdit = req.user.admin || !enforced(req.project) || canManage(req.project, req.user) || d.by === req.user.id || isMember(req.project, req.user.id);
    if (!canEdit) throw new HttpError(403, 'Bạn không có quyền chỉnh sửa tài liệu này');

    const newContent = String(req.body?.content ?? '');
    const note = str(req.body?.note, 200) || 'Cập nhật nội dung';
    const dest = store.uploadPath(req.project.id, d.id);

    // Lưu phiên bản cũ nếu có
    let oldContent = '';
    try { oldContent = fs.readFileSync(dest, 'utf8'); } catch {}
    if (oldContent) {
      const revId = store.newId();
      fs.writeFileSync(store.uploadRevPath(req.project.id, d.id, revId), oldContent, 'utf8');
      d.revisions = d.revisions || [];
      d.revisions.unshift({
        revId,
        at: d.at,
        by: d.by,
        byName: d.byName,
        size: d.file ? d.file.size : Buffer.byteLength(oldContent, 'utf8'),
        note: d.lastNote || 'Bản trước',
      });
      if (d.revisions.length > 25) d.revisions = d.revisions.slice(0, 25);
    }

    fs.writeFileSync(dest, newContent, 'utf8');
    const p = save(req, (x) => {
      const docInProj = x.docs.find((y) => y.id === d.id);
      if (docInProj) {
        docInProj.revisions = d.revisions;
        docInProj.file.size = Buffer.byteLength(newContent, 'utf8');
        docInProj.at = new Date().toISOString();
        docInProj.by = req.user.id;
        docInProj.byName = req.user.name;
        docInProj.lastNote = note;
      }
    });

    log(req, p.id, `Sửa tài liệu ${d.step}`, `${d.label} — ${note}`);
    return p;
  });

  // Xem nội dung của một phiên bản cũ (Revision)
  app.get('/api/projects/:id/docs/:docId/revisions/:revId', { preHandler: project }, async (req, reply) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d) throw new HttpError(404, 'Không tìm thấy tài liệu');
    const rev = (d.revisions || []).find((r) => r.revId === req.params.revId);
    if (!rev) throw new HttpError(404, 'Không tìm thấy phiên bản lịch sử này');

    const revPath = store.uploadRevPath(req.project.id, d.id, rev.revId);
    if (!fs.existsSync(revPath)) throw new HttpError(404, 'File phiên bản không tồn tại trên đĩa');

    return reply
      .type('text/plain; charset=utf-8')
      .header('content-security-policy', "sandbox; default-src 'none'")
      .header('cache-control', 'no-store')
      .send(fs.readFileSync(revPath, 'utf8'));
  });

  // Xuất tài liệu Markdown ra file Word (.docx)
  app.get('/api/projects/:id/docs/:docId/docx', { preHandler: project }, async (req, reply) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d || !/\.md$/i.test(d.file.name)) throw new HttpError(404, 'Không tìm thấy tài liệu Markdown');

    const dest = store.uploadPath(req.project.id, d.id);
    if (!fs.existsSync(dest)) throw new HttpError(404, 'File nội dung không tồn tại');
    const mdContent = fs.readFileSync(dest, 'utf8');

    // Chuyển Markdown sang HTML rồi đóng gói thành file .docx
    const html = marked.parse(mdContent);
    const docxBuf = await htmlToDocx(html, null, {
      title: d.label,
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch lề chuẩn
    });

    const exportName = (d.label || d.file.name.replace(/\.md$/i, '')).replace(/[/\\?%*:|"<>]/g, '_') + '.docx';
    return reply
      .header('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(exportName)}`)
      .type('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .send(docxBuf);
  });

  app.delete('/api/projects/:id/docs/:docId', { preHandler: project }, async (req) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId);
    if (!d) throw new HttpError(404, 'Không tìm thấy tài liệu');
    const canDel = req.user.admin || !enforced(req.project) || canManage(req.project, req.user) || d.by === req.user.id;
    if (!canDel) throw new HttpError(403, 'Chỉ người tải lên hoặc PM/Admin mới có quyền xóa tài liệu này');
    const p = save(req, (x) => { x.docs = x.docs.filter((y) => y.id !== d.id); });
    if (d.file) {
      fs.rmSync(store.uploadPath(req.project.id, d.id), { force: true });
      // Xoá các phiên bản cũ
      for (const r of d.revisions || []) {
        try { fs.rmSync(store.uploadRevPath(req.project.id, d.id, r.revId), { force: true }); } catch {}
      }
    }
    log(req, p.id, `Xoá tài liệu ${d.step}`, d.label);
    return p;
  });

  // Xoá nhiều tài liệu cùng lúc (Batch Delete)
  app.post('/api/projects/:id/docs/batch-delete', { preHandler: project }, async (req) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) throw bad('Danh sách tài liệu cần xóa không hợp lệ');

    const canManageAll = req.user.admin || !enforced(req.project) || canManage(req.project, req.user);
    const toDelete = req.project.docs.filter((d) => ids.includes(d.id));
    if (toDelete.length === 0) throw bad('Không tìm thấy tài liệu nào khớp trong dự án');

    if (!canManageAll) {
      const unauthorized = toDelete.some((d) => d.by !== req.user.id);
      if (unauthorized) throw new HttpError(403, 'Bạn chỉ có quyền xóa những tài liệu do chính bạn tải lên');
    }

    const p = save(req, (x) => {
      x.docs = x.docs.filter((d) => !ids.includes(d.id));
    });

    for (const d of toDelete) {
      if (d.file) {
        try { fs.rmSync(store.uploadPath(req.project.id, d.id), { force: true }); } catch {}
        for (const r of d.revisions || []) {
          try { fs.rmSync(store.uploadRevPath(req.project.id, d.id, r.revId), { force: true }); } catch {}
        }
      }
    }

    log(req, p.id, 'Xóa tài liệu hàng loạt', `Đã xóa ${toDelete.length} tài liệu`);
    return p;
  });

  // Tải hàng loạt tài liệu dự án dạng file nén .ZIP có phân thư mục theo 5 giai đoạn
  const handleDownloadZip = async (req, reply) => {
    let ids = [];
    if (req.body && Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else if (req.query && req.query.ids) {
      ids = String(req.query.ids).split(',').map((x) => x.trim()).filter(Boolean);
    }
    const track = req.query && req.query.track ? String(req.query.track) : null;

    let targetDocs = req.project.docs.filter((d) => d.file);
    if (ids.length > 0) {
      targetDocs = targetDocs.filter((d) => ids.includes(d.id));
    }
    if (track) {
      targetDocs = targetDocs.filter((d) => d.track === track);
    }

    if (targetDocs.length === 0) {
      throw bad('Không có tài liệu nào để nén (các tài liệu phải có file đính kèm thực tế)');
    }

    const zip = new JSZip();

    // Mapping bước sang thư mục 5 giai đoạn chuẩn AI-SDLC
    const PHASE_FOLDERS = {
      b1: '01_Khoi_dong_va_Chuan_bi',
      b2: '01_Khoi_dong_va_Chuan_bi',
      b3: '02_Kham_pha_va_Dinh_nghia',
      b4: '02_Kham_pha_va_Dinh_nghia',
      b5: '02_Kham_pha_va_Dinh_nghia',
      b6: '03_Thiet_ke_va_Kien_truc',
      b7: '03_Thiet_ke_va_Kien_truc',
      b8: '03_Thiet_ke_va_Kien_truc',
      b9: '04_Phat_trien_va_Kiem_thu',
      b10: '04_Phat_trien_va_Kiem_thu',
      b11: '04_Phat_trien_va_Kiem_thu',
      b12: '04_Phat_trien_va_Kiem_thu',
      b13: '05_Phat_hanh_va_Van_hanh',
      b14: '05_Phat_hanh_va_Van_hanh',
    };

    let totalPacked = 0;
    const manifest = [];
    const usedPaths = new Set();

    for (const d of targetDocs) {
      const dest = store.uploadPath(req.project.id, d.id);
      if (!fs.existsSync(dest)) continue;
      const fileData = fs.readFileSync(dest);

      const stepKey = String(d.step || '').toLowerCase();
      const folderName = PHASE_FOLDERS[stepKey] || '00_Tai_lieu_chung';
      const stepPrefix = d.step ? `[${d.step.toUpperCase()}]_` : '';
      const ext = path.extname(d.file.name);
      let rawBase = (d.label || d.file.name).replace(/[/\\?%*:|"<>]/g, '_').trim();
      if (ext && rawBase.toLowerCase().endsWith(ext.toLowerCase())) {
        rawBase = rawBase.slice(0, -ext.length);
      }
      let safeFileName = `${stepPrefix}${rawBase}${ext}`;
      let counter = 1;
      while (usedPaths.has(`${folderName}/${safeFileName}`)) {
        safeFileName = `${stepPrefix}${rawBase}_(${counter})${ext}`;
        counter++;
      }
      usedPaths.add(`${folderName}/${safeFileName}`);

      zip.folder(folderName).file(safeFileName, fileData);
      totalPacked++;
      manifest.push({
        step: d.step || 'Chung',
        label: d.label,
        filename: safeFileName,
        size: d.file.size,
        by: d.byName || 'Hệ thống',
        at: d.at,
      });
    }

    if (totalPacked === 0) {
      throw bad('Các file trên đĩa không tồn tại để nén');
    }

    // Tạo file README tóm tắt hồ sơ dự án
    let readme = `======================================================================\n`;
    readme += `HỒ SƠ TÀI LIỆU DỰ ÁN AI-SDLC\n`;
    readme += `Dự án: ${req.project.name} (${req.project.code || req.project.id})\n`;
    readme += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`;
    readme += `Người xuất: ${req.user.name} (${req.user.username})\n`;
    readme += `Tổng số tài liệu: ${totalPacked} file\n`;
    readme += `======================================================================\n\n`;
    readme += `DANH SÁCH TÀI LIỆU NÉN THEO 5 GIAI ĐOẠN:\n`;
    manifest.forEach((m, idx) => {
      readme += `${idx + 1}. [${m.step}] ${m.label} (${m.filename}) — Người tải: ${m.by} — Ngày: ${m.at}\n`;
    });
    readme += `\n======================================================================\n`;
    readme += `Quy chuẩn tuân thủ AI-SDLC Enterprise — Hệ thống CMS quản lý tiến độ.\n`;

    zip.file('README_HO_SO_DU_AN.txt', readme);

    const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const zipName = `AI-SDLC_${(req.project.code || req.project.name).replace(/[/\\?%*:|"<> \s]/g, '_')}_Docs.zip`;

    log(req, req.project.id, 'Tải ZIP tài liệu', `Đã tải ${totalPacked} file nén`);

    return reply
      .header('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`)
      .type('application/zip')
      .send(zipBuf);
  };

  app.get('/api/projects/:id/docs/download-zip', { preHandler: project }, handleDownloadZip);
  app.post('/api/projects/:id/docs/download-zip', { preHandler: project }, handleDownloadZip);

  // Lấy nhật ký hoạt động thời gian thực của dự án (Activity Feed)
  app.get('/api/projects/:id/activities', { preHandler: project }, async (req) => {
    const limit = Math.min(100, Math.max(10, Number(req.query?.limit) || 40));
    return store.readAudit(req.project.id, limit);
  });
  // nội dung file .md dạng văn bản để giao diện hiển thị (dạng thô / dạng đẹp).
  // text/plain + CSP sandbox: kể cả mở thẳng URL này trong trình duyệt cũng không chạy được gì.
  app.get('/api/projects/:id/docs/:docId/content', { preHandler: project }, async (req, reply) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d || !/\.md$/i.test(d.file.name)) throw new HttpError(404, 'Không có nội dung Markdown để xem');
    return reply
      .type('text/plain; charset=utf-8')
      .header('content-security-policy', "sandbox; default-src 'none'")
      .header('cache-control', 'no-store')
      .send(fs.readFileSync(store.uploadPath(req.project.id, d.id), 'utf8'));
  });
  app.get('/api/projects/:id/files/:docId', { preHandler: project }, async (req, reply) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d) throw new HttpError(404, 'Không tìm thấy file');
    // luôn tải về (attachment) để file HTML/SVG upload lên không chạy được trong origin này
    return reply
      .header('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(d.file.name)}`)
      .type('application/octet-stream')
      .send(fs.createReadStream(store.uploadPath(req.project.id, d.id)));
  });

  // Xem file trực tiếp trên trình duyệt (inline): PDF, hình ảnh, văn bản
  app.get('/api/projects/:id/files/:docId/view', { preHandler: project }, async (req, reply) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d) throw new HttpError(404, 'Không tìm thấy file');
    const dest = store.uploadPath(req.project.id, d.id);
    if (!fs.existsSync(dest)) throw new HttpError(404, 'File không tồn tại trên đĩa');

    const ext = path.extname(d.file.name).toLowerCase();
    const mimeType = ALLOWED_DOC_EXTS[ext] || 'application/octet-stream';

    // CSP an toàn: ngăn chặn XSS nếu file SVG được mở, nhưng cho phép PDF & hình ảnh render inline
    let csp = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    if (ext === '.pdf') {
      csp = "frame-ancestors 'self'";
    } else if (/\.(png|jpe?g|gif|webp)$/i.test(ext)) {
      csp = "default-src 'self' data:; frame-ancestors 'self'";
    }

    return reply
      .header('content-disposition', `inline; filename*=UTF-8''${encodeURIComponent(d.file.name)}`)
      .header('content-security-policy', csp)
      .header('x-content-type-options', 'nosniff')
      .header('cache-control', 'public, max-age=3600')
      .type(mimeType)
      .send(fs.createReadStream(dest));
  });

  // Dữ liệu bảng tính (Excel/CSV) dạng mảng 2 chiều phục vụ In-App SheetViewer
  app.get('/api/projects/:id/docs/:docId/sheet-data', { preHandler: project }, async (req) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d) throw new HttpError(404, 'Không tìm thấy tài liệu');
    const ext = path.extname(d.file.name).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      throw bad('Tài liệu không phải bảng tính (.xlsx, .xls, .csv)');
    }
    const dest = store.uploadPath(req.project.id, d.id);
    if (!fs.existsSync(dest)) throw new HttpError(404, 'File không tồn tại trên đĩa');

    try {
      const workbook = xlsx.readFile(dest, { cellDates: true, dense: true });
      const sheetNames = workbook.SheetNames || [];
      const sheets = {};
      for (const name of sheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) continue;
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
        const maxRows = 5000;
        const truncated = data.length > maxRows;
        const rows = truncated ? data.slice(0, maxRows) : data;
        const totalCols = rows.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 0);
        sheets[name] = {
          name,
          rows,
          totalRows: data.length,
          totalCols,
          truncated,
        };
      }
      return {
        filename: d.file.name,
        sheetNames,
        sheets,
      };
    } catch (err) {
      throw bad(`Không thể đọc file bảng tính: ${err.message}`);
    }
  });

  // Chuyển đổi Word (.docx) sang HTML để xem trực tiếp dạng trang in
  app.get('/api/projects/:id/docs/:docId/docx-html', { preHandler: project }, async (req) => {
    const d = req.project.docs.find((x) => x.id === req.params.docId && x.file);
    if (!d) throw new HttpError(404, 'Không tìm thấy tài liệu');
    const ext = path.extname(d.file.name).toLowerCase();
    if (!['.docx', '.doc'].includes(ext)) {
      throw bad('Tài liệu không phải file Word (.docx, .doc)');
    }
    const dest = store.uploadPath(req.project.id, d.id);
    if (!fs.existsSync(dest)) throw new HttpError(404, 'File không tồn tại trên đĩa');

    try {
      const res = await mammoth.convertToHtml({ path: dest });
      return {
        filename: d.file.name,
        html: res.value,
        warnings: res.messages.map((m) => m.message),
      };
    } catch (err) {
      throw bad(`Không thể chuyển đổi file Word: ${err.message}`);
    }
  });

  /* ---------- quản trị tài khoản ---------- */
  app.post('/api/admin/users', { preHandler: admin }, async (req) => {
    let u;
    try { u = store.createUser({ ...req.body, admin: !!req.body?.admin }); } catch (e) { throw bad(e.message); }
    store.audit({ user: req.user.name, action: 'Tạo tài khoản', detail: u.username });
    return u;
  });
  app.post('/api/admin/users/:uid/disabled', { preHandler: admin }, async (req) => {
    if (req.params.uid === req.user.id) throw bad('Không tự khoá chính mình');
    const disabled = !!req.body?.disabled;
    let u;
    try { u = store.updateUser(req.params.uid, (x) => { x.disabled = disabled; }); } catch (e) { throw new HttpError(404, e.message); }
    if (disabled) sessions.deleteWhere((s) => s.uid === u.id);
    store.audit({ user: req.user.name, action: disabled ? 'Khoá tài khoản' : 'Mở khoá tài khoản', detail: u.username });
    return u;
  });
  app.delete('/api/admin/users/:uid', { preHandler: admin }, async (req) => {
    if (req.params.uid === req.user.id) throw bad('Không tự xoá chính mình');
    let u;
    try { u = store.deleteUser(req.params.uid); } catch (e) { throw new HttpError(404, e.message); }
    sessions.deleteWhere((s) => s.uid === u.id);
    store.audit({ user: req.user.name, action: 'Xoá tài khoản', detail: u.username });
    return { ok: true };
  });
  app.post('/api/admin/users/:uid/reset', { preHandler: admin }, async (req) => {
    const pw = crypto.randomBytes(9).toString('base64url');
    let u;
    try { u = store.updateUser(req.params.uid, (x, setPw) => setPw(pw)); } catch (e) { throw new HttpError(404, e.message); }
    sessions.deleteWhere((s) => s.uid === u.id);
    store.audit({ user: req.user.name, action: 'Đặt lại mật khẩu', detail: u.username });
    return { user: u, password: pw }; // chỉ trả 1 lần, không ghi log
  });

  app.all('/api/*', async () => { throw new HttpError(404, 'Không có API này'); });
};

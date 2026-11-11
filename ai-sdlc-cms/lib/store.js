'use strict';
// Lưu trữ bằng file JSON. Mọi thao tác đọc-sửa-ghi đều đồng bộ (fs.*Sync) nên trong
// một tiến trình Node không có hai lần ghi chen nhau.
// ponytail: chỉ an toàn khi chạy 1 tiến trình; chạy nhiều instance thì chuyển SQLite.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { FAST_QUESTIONS } = require('./progress');
const ID_RE = /^[a-z0-9]{8}$/;

function createStore(dir, proc) {
  const P = {
    users: path.join(dir, 'users.json'),
    projects: path.join(dir, 'projects'),
    uploads: path.join(dir, 'uploads'),
    audit: path.join(dir, 'audit.jsonl'),
  };
  fs.mkdirSync(P.projects, { recursive: true });
  fs.mkdirSync(P.uploads, { recursive: true });

  const readJSON = (f, dflt) => {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return dflt; throw e; }
  };
  // ghi file tạm rồi đổi tên → không bao giờ để lại file JSON ghi dở
  const writeJSON = (f, v) => {
    const tmp = f + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(v, null, 2), 'utf8');
    fs.renameSync(tmp, f);
  };
  const newId = () => crypto.randomBytes(4).toString('hex');

  /* ---------- người dùng ---------- */
  const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
  const users = () => readJSON(P.users, []);
  const saveUsers = (list) => writeJSON(P.users, list);
  const publicUser = (u) => u && { id: u.id, username: u.username, name: u.name, admin: !!u.admin, disabled: !!u.disabled };

  function createUser({ username, name, password, admin }) {
    username = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('Tên đăng nhập 3–32 ký tự: a-z, 0-9, . _ -');
    if (String(password || '').length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
    const list = users();
    if (list.some((u) => u.username === username)) throw new Error('Tên đăng nhập đã tồn tại');
    const salt = crypto.randomBytes(16).toString('hex');
    const u = { id: newId(), username, name: String(name || username).trim().slice(0, 80), salt, hash: hash(password, salt), admin: !!admin, disabled: false, createdAt: new Date().toISOString() };
    list.push(u);
    saveUsers(list);
    return publicUser(u);
  }

  function verify(username, password) {
    const u = users().find((x) => x.username === String(username || '').trim().toLowerCase());
    // vẫn băm khi không có user để thời gian phản hồi không lộ user nào tồn tại
    const h = Buffer.from(hash(String(password || ''), u ? u.salt : 'x'), 'hex');
    if (!u || u.disabled) return null;
    return crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex')) ? publicUser(u) : null;
  }

  function updateUser(id, fn) {
    const list = users();
    const u = list.find((x) => x.id === id);
    if (!u) throw new Error('Không tìm thấy người dùng');
    fn(u, (pw) => {
      if (String(pw || '').length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự');
      u.salt = crypto.randomBytes(16).toString('hex');
      u.hash = hash(pw, u.salt);
    });
    saveUsers(list);
    return publicUser(u);
  }

  // xoá hẳn tài khoản + gỡ khỏi thành viên/người phụ trách của mọi dự án (nhật ký giữ nguyên tên đã ghi)
  function deleteUser(id) {
    const list = users();
    const u = list.find((x) => x.id === id);
    if (!u) throw new Error('Không tìm thấy người dùng');
    saveUsers(list.filter((x) => x.id !== id));
    const tracks = (p) => [p.base, ...p.items];
    for (const p of listProjects()) {
      const hit = (p.members || []).some((m) => m.userId === id) || tracks(p).some((t) => Object.values(t.steps).some((st) => st.owners.includes(id)));
      if (!hit) continue;
      updateProject(p.id, (q) => {
        q.members = (q.members || []).filter((m) => m.userId !== id);
        for (const t of tracks(q)) for (const st of Object.values(t.steps)) st.owners = st.owners.filter((o) => o !== id);
      });
    }
    return publicUser(u);
  }

  const getUser = (id) => publicUser(users().find((u) => u.id === id));
  const listUsers = () => users().map(publicUser);

  /* ---------- cấu hình & bí mật (Telegram) ----------
     settings.json: cấu hình thường, được sao lưu. secrets.json: token bot, KHÔNG sao lưu và không bao giờ trả ra API. */
  const DEFAULT_TG = {
    enabled: false, chatId: '', publicUrl: '', digestTime: '08:30', lastDigest: '',
    events: { assign: true, gateWaiting: true, gateFail: true, aiReview: true, digest: true },
    seenChats: [], // nhóm bot đã thấy: [{ id, title }] — để chọn nhóm mà không phải chép chat id
  };
  const settingsFile = path.join(dir, 'settings.json');
  const secretsFile = path.join(dir, 'secrets.json');
  const getTelegram = () => {
    const t = readJSON(settingsFile, {}).telegram || {};
    return { ...DEFAULT_TG, ...t, events: { ...DEFAULT_TG.events, ...(t.events || {}) }, seenChats: t.seenChats || [] };
  };
  const setTelegram = (patch) => {
    const all = readJSON(settingsFile, {});
    all.telegram = { ...getTelegram(), ...patch };
    writeJSON(settingsFile, all);
    return all.telegram;
  };
  const getSecret = (k) => readJSON(secretsFile, {})[k] || '';
  const setSecret = (k, v) => {
    const all = readJSON(secretsFile, {});
    if (v) all[k] = v; else delete all[k];
    const tmp = secretsFile + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(all), { mode: 0o600 });
    fs.renameSync(tmp, secretsFile);
  };
  // liên kết tài khoản ↔ chat Telegram (user.tg = { chatId, username, at }); mỗi chat chỉ gắn với 1 tài khoản
  const getTgLink = (uid) => (users().find((u) => u.id === uid) || {}).tg || null;
  function setTgLink(uid, link) {
    const list = users();
    const u = list.find((x) => x.id === uid);
    if (!u) throw new Error('Không tìm thấy người dùng');
    if (link) for (const o of list) if (o.tg && o.tg.chatId === link.chatId) delete o.tg;
    if (link) u.tg = link; else delete u.tg;
    saveUsers(list);
  }
  const listTgLinks = () => Object.fromEntries(users().filter((u) => u.tg).map((u) => [u.id, u.tg]));
  const findByChat = (chatId) => users().find((u) => u.tg && String(u.tg.chatId) === String(chatId) && !u.disabled);

  /* ---------- dự án ----------
     Dự án = "nền tảng" (bước giai đoạn đầu, làm 1 lần) + nhiều "hạng mục" (các bước còn lại,
     lặp cho từng tính năng / Change Request / fast-track). Mỗi phần là một "track":
     { steps: {Bx: trạng thái}, gates: {gx: kết quả} }. Tài liệu gắn với track qua doc.track. */
  const baseCodes = new Set(proc.baseSteps);
  const itemCodes = proc.steps.map((s) => s.code).filter((c) => !baseCodes.has(c));
  const gatesOf = (codes) => proc.gates.filter((g) => codes.includes(g.at)).map((g) => g.key);
  const blankStep = () => ({ status: 'todo', owners: [], start: '', end: '', note: '', checks: [] });
  const blankGate = () => ({ result: 'pending', by: '', at: '', note: '' });
  // bổ sung bước/gate còn thiếu (khi quy trình được sync thêm) — dữ liệu cũ vẫn dùng được
  const fill = (t, codes) => {
    t.steps = t.steps || {}; t.gates = t.gates || {};
    for (const c of codes) {
      t.steps[c] = t.steps[c] || blankStep();
      // bản cũ lưu "owner" dạng chữ tự do → giữ để hiển thị tới khi bước được lưu lại
      if (!Array.isArray(t.steps[c].owners)) t.steps[c].owners = [];
    }
    for (const k of gatesOf(codes)) t.gates[k] = t.gates[k] || blankGate();
    return t;
  };
  const KINDS = ['full', 'cr', 'fast'];

  /* ---------- kiểm tra đầu vào cho repo / thư mục spec ---------- */
  const cleanRepo = (u) => {
    u = String(u || '').trim().replace(/\/+$/, '').replace(/\.git$/, '');
    if (u && !/^https:\/\/[^\s/]+\/\S+$/i.test(u)) throw new Error('Repo URL phải dạng https://host/nhom/repo');
    return u.slice(0, 300);
  };
  const cleanBranch = (b) => {
    b = String(b || '').trim() || 'main';
    if (!/^[\w./-]{1,100}$/.test(b) || b.includes('..')) throw new Error('Tên nhánh không hợp lệ');
    return b;
  };
  const cleanSpecDir = (d) => {
    d = String(d || '').trim().replace(/^\/+|\/+$/g, '');
    if (d && (!/^[\w./-]{1,200}$/.test(d) || d.split('/').includes('..'))) throw new Error('Thư mục spec chỉ gồm chữ không dấu, số và . _ - /');
    return d;
  };
  const cleanRepoType = (t) => {
    t = String(t || 'gitlab').toLowerCase();
    if (!['gitlab', 'github'].includes(t)) throw new Error('Loại repo phải là gitlab hoặc github');
    return t;
  };
  const ROLE_KEYS = new Set(proc.roles.map((r) => r.key));
  // thành viên: chỉ nhận tài khoản có thật, vai trò hợp lệ, không trùng; người không có vai trò nào bị bỏ
  function cleanMembers(list) {
    const known = new Set(users().filter((u) => !u.disabled).map((u) => u.id));
    const out = [];
    for (const m of Array.isArray(list) ? list : []) {
      if (!m || !known.has(m.userId) || out.some((x) => x.userId === m.userId)) continue;
      const roles = [...new Set([].concat(m.roles || []))].filter((r) => ROLE_KEYS.has(r));
      if (roles.length) out.push({ userId: m.userId, roles });
    }
    return out;
  }
  const LEVELS = ['', 'public', 'internal', 'confidential', 'restricted'];
  function cleanAiSetup(b) {
    const tools = [...new Set([].concat(b?.tools || []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean))].slice(0, 20);
    const dataLevel = String(b?.dataLevel || '');
    if (!LEVELS.includes(dataLevel)) throw new Error('Mức nhạy cảm dữ liệu không hợp lệ');
    return { tools, dataLevel };
  }
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

  function normalize(p) {
    if (!p.items) {
      // dữ liệu bản đầu (1 lượt B1–B14 cho cả dự án) → nền tảng + hạng mục "Phát hành đầu tiên"
      const itemId = newId();
      const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k]).map((k) => [k, o[k]]));
      p.base = { steps: pick(p.steps || {}, [...baseCodes]), gates: pick(p.gates || {}, gatesOf([...baseCodes])) };
      p.items = [{ id: itemId, name: 'Phát hành đầu tiên', kind: 'full', ref: '', archived: false, createdAt: p.createdAt, createdBy: p.createdBy,
        steps: pick(p.steps || {}, itemCodes), gates: pick(p.gates || {}, gatesOf(itemCodes)) }];
      for (const d of p.docs || []) d.track = baseCodes.has(d.step) ? 'base' : itemId;
      delete p.steps; delete p.gates;
    }
    p.docs = p.docs || [];
    p.repoUrl = p.repoUrl || '';
    p.branch = p.branch || 'main';
    p.repoType = p.repoType || (/github\.com/i.test(p.repoUrl) ? 'github' : 'gitlab'); // mặc định GitLab (GitLab nội bộ)
    p.members = p.members || [];                      // [{ userId, roles: [PM|BA|PO|TechLead|Dev|Test|Security|DevOps] }]
    p.visibility = p.visibility === 'private' ? 'private' : 'public'; // 'public' | 'private'
    p.aiSetup = p.aiSetup || { tools: [], dataLevel: '' };
    p.aiLogs = p.aiLogs || [];
    p.bugs = p.bugs || [];
    fill(p.base, [...baseCodes]);
    for (const it of p.items) { it.specDir = it.specDir || ''; it.crCode = it.crCode || ''; it.crReason = it.crReason || ''; fill(it, itemCodes); }
    return p;
  }

  const pfile = (id) => {
    if (!ID_RE.test(id)) return null;
    return path.join(P.projects, id + '.json');
  };
  const load = (f) => {
    const p = readJSON(f, null);
    if (!p) return null;
    const legacy = !p.items;
    normalize(p);
    if (legacy) writeJSON(f, p); // lưu ngay để id hạng mục mới sinh ra không đổi giữa các request
    return p;
  };
  const getProject = (id) => { const f = pfile(id); return f ? load(f) : null; };
  const listProjects = () =>
    fs.readdirSync(P.projects).filter((f) => f.endsWith('.json')).map((f) => load(path.join(P.projects, f))).filter(Boolean);
  // track theo id: 'base' hoặc id hạng mục
  const getTrack = (p, t) => (t === 'base' ? p.base : p.items.find((i) => i.id === t)) || null;

  function createProject({ name, code, description, repoUrl, branch, repoType, visibility }, by) {
    name = String(name || '').trim().slice(0, 120);
    if (!name) throw new Error('Thiếu tên dự án');
    const now = new Date().toISOString();
    const p = normalize({
      id: newId(), name, code: String(code || '').trim().slice(0, 30), description: String(description || '').trim().slice(0, 1000),
      repoUrl: cleanRepo(repoUrl), branch: cleanBranch(branch), repoType: cleanRepoType(repoType),
      visibility: visibility === 'private' ? 'private' : 'public',
      processVersion: proc.version, archived: false, createdAt: now, createdBy: by, updatedAt: now,
      base: {}, items: [], docs: [], bugs: [],
    });
    writeJSON(pfile(p.id), p);
    return p;
  }

  // thêm hạng mục; fast-track tự đánh "Bỏ qua" các bước luồng rút gọn cho phép bỏ
  function addItem(p, { name, kind, ref, specDir, crCode, crReason, fast }, by) {
    name = String(name || '').trim().slice(0, 120);
    if (!name) throw new Error('Thiếu tên hạng mục');
    if (!KINDS.includes(kind)) throw new Error('Loại hạng mục không hợp lệ');
    // Fast-track: phải trả lời đủ 3 câu và đáp án đúng điều kiện của tài liệu (dưới 0,5 ngày, không chạm phân quyền/thanh toán, không đổi data model)
    let fastCheck;
    if (kind === 'fast') {
      const bad = FAST_QUESTIONS.filter((q) => fast?.[q.key] !== q.must);
      if (bad.length) throw new Error('Không đủ điều kiện Fast-track: ' + bad.map((q) => q.label).join(' · ') + ' — hãy tạo dạng Tính năng hoặc Change Request');
      fastCheck = Object.fromEntries(FAST_QUESTIONS.map((q) => [q.key, fast[q.key]]));
    }
    // Change Request: bắt buộc mã CR (PL2)
    crCode = String(crCode || '').trim().slice(0, 60);
    if (kind === 'cr' && !crCode) throw new Error('Change Request cần mã CR (PL2)');
    // thư mục spec mặc định specs/NNN-ten (fast-track không cần — mô tả thẳng trong ticket)
    specDir = specDir == null || specDir === '' ? (kind === 'fast' ? '' : `specs/${String(p.items.length + 1).padStart(3, '0')}-${slug(name) || 'hang-muc'}`) : cleanSpecDir(specDir);
    const it = fill({ id: newId(), name, kind, ref: String(ref || '').trim().slice(0, 300), specDir, crCode: kind === 'cr' ? crCode : '', crReason: kind === 'cr' ? String(crReason || '').trim().slice(0, 1000) : '', ...(fastCheck ? { fastCheck } : {}), archived: false, createdAt: new Date().toISOString(), createdBy: by }, itemCodes);
    if (kind === 'fast') for (const c of proc.fastTrackSkip) if (it.steps[c]) it.steps[c].status = 'skipped';
    p.items.push(it);
    return it;
  }

  function updateProject(id, fn) {
    const f = pfile(id);
    const p = f && load(f);
    if (!p) throw new Error('Không tìm thấy dự án');
    fn(p);
    p.updatedAt = new Date().toISOString();
    writeJSON(f, p);
    return p;
  }

  /* ---------- file đính kèm ---------- */
  const uploadPath = (pid, docId) => {
    if (!ID_RE.test(pid) || !ID_RE.test(docId)) throw new Error('id không hợp lệ');
    const d = path.join(P.uploads, pid);
    fs.mkdirSync(d, { recursive: true });
    return path.join(d, docId);
  };
  const uploadRevPath = (pid, docId, revId) => {
    if (!ID_RE.test(pid) || !ID_RE.test(docId) || !/^[\w.-]+$/.test(revId)) throw new Error('id không hợp lệ');
    const d = path.join(P.uploads, pid);
    fs.mkdirSync(d, { recursive: true });
    return path.join(d, `${docId}.rev.${revId}`);
  };

  /* ---------- nhật ký ---------- */
  function audit(entry) {
    fs.appendFileSync(P.audit, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', 'utf8');
  }
  function readAudit(projectId, limit = 300) {
    let lines = [];
    try { lines = fs.readFileSync(P.audit, 'utf8').split('\n'); } catch { return []; }
    const out = [];
    for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
      if (!lines[i]) continue;
      try {
        const e = JSON.parse(lines[i]);
        if (!projectId || e.project === projectId) out.push(e);
      } catch {}
    }
    return out;
  }

  return {
    newId, createUser, verify, updateUser, deleteUser, getUser, listUsers, hasUsers: () => users().length > 0,
    getTelegram, setTelegram, getSecret, setSecret, getTgLink, setTgLink, listTgLinks, findByChat,
    getProject, listProjects, getTrack, createProject, addItem, cleanRepo, cleanBranch, cleanSpecDir, cleanRepoType, cleanMembers, cleanAiSetup, updateProject, uploadPath, uploadRevPath, audit, readAudit, ID_RE, itemCodes,
  };
}

module.exports = { createStore };

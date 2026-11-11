'use strict';
// Kiểm tra API JSON (lib/api.js) + sao lưu bằng fastify.inject, không mở cổng. Chạy: node test.js
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildApp } = require('./server');
const { runBackup, KEEP } = require('./lib/backup');

(async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-api-'));
  const app = await buildApp({ dataDir, adminPassword: 'admin-pass-123', logger: false });
  let cookie = '';
  const api = async (method, url, body, headers = {}) => {
    const r = await app.inject({
      method, url, payload: body,
      headers: { host: 'localhost', origin: 'http://localhost', cookie, ...(body && !Buffer.isBuffer(body) ? { 'content-type': 'application/json' } : {}), ...headers },
    });
    const sc = r.headers['set-cookie'];
    if (sc) cookie = [].concat(sc)[0].split(';')[0];
    let json = null;
    try { json = r.json(); } catch {}
    return { status: r.statusCode, body: json, raw: r };
  };
  const ok = (r) => { assert.ok(r.status < 300, `${r.status} ${JSON.stringify(r.body)}`); return r.body; };
  // mỗi người đăng nhập đúng 1 lần (đăng nhập bị giới hạn 10 lần / 5 phút); đổi người = đổi cookie
  const cookies = {};
  const loginAs = async (name, pw) => {
    const saved = cookie; cookie = '';
    const u = ok(await api('POST', '/api/login', { username: name, password: pw }));
    cookies[name] = cookie; cookie = saved;
    return u;
  };
  const as = (name) => { cookie = cookies[name]; };

  // phiên + CSRF
  assert.strictEqual((await api('GET', '/api/me')).status, 401);
  assert.strictEqual((await api('POST', '/api/login', { username: 'admin', password: 'sai' })).status, 401);
  assert.strictEqual((await api('POST', '/api/login', { username: 'admin', password: 'admin-pass-123' }, { origin: 'https://evil.example' })).status, 403);
  const me = await loginAs('admin', 'admin-pass-123');
  as('admin');
  assert.ok(me.admin && !me.hash && !me.salt, 'không lộ hash/salt');
  assert.strictEqual((await api('GET', '/api/khong-co')).status, 404);
  const proc = ok(await api('GET', '/api/process'));
  assert.strictEqual(proc.steps.length, 14);
  assert.deepStrictEqual(proc.roles.map((r) => r.key), ['PM', 'BA', 'PO', 'TechLead', 'Dev', 'Test', 'Security', 'DevOps']);
  assert.deepStrictEqual(proc.gates.find((g) => g.key === 'g4b').roles, ['Security']);
  assert.ok(proc.prompts.length >= 11, 'đủ 11 prompt mẫu chuẩn');
  assert.strictEqual(proc.prompts[0].id, 'P-B3-01');
  assert.strictEqual(proc.labels.BUG_SEVERITY.S1, 'S1 — Blocker');

  /* ---------- dự án, loại repo, thiết lập AI ---------- */
  assert.strictEqual((await api('POST', '/api/projects', { name: 'X', repoUrl: 'javascript:alert(1)' })).status, 400);
  assert.strictEqual((await api('POST', '/api/projects', { name: 'X', repoType: 'svn' })).status, 400);
  let p = ok(await api('POST', '/api/projects', { name: 'INS Platform', code: 'INS', repoUrl: 'https://github.com/acme/ins.git', repoType: 'github' }));
  assert.strictEqual(p.repoUrl, 'https://github.com/acme/ins');
  assert.strictEqual(p.repoType, 'github');
  const q = ok(await api('POST', '/api/projects', { name: 'Dự án trống', repoUrl: 'https://git.congty.vn/nhom/du-an' }));
  assert.strictEqual(q.repoType, 'gitlab', 'mặc định GitLab (GitLab nội bộ không có chữ "gitlab" trong tên miền)');
  const dev = ok(await api('POST', '/api/admin/users', { username: 'dev1', name: 'Dev Một', password: 'dev1-pass-123' }));
  const out = ok(await api('POST', '/api/admin/users', { username: 'ngoai', name: 'Người ngoài', password: 'ngoai-pass-123' }));
  await loginAs('dev1', 'dev1-pass-123');
  await loginAs('ngoai', 'ngoai-pass-123');

  // chưa thiết lập AI → chưa tạo được hạng mục; chỉ admin được bỏ qua có chủ đích (ghi vào nhật ký)
  assert.strictEqual(p.view.setup.ready, false);
  assert.strictEqual(p.view.setup.missing.length, 4);
  let r = await api('POST', `/api/projects/${p.id}/items`, { name: 'Thanh toán QR', kind: 'full' });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.body.canForce, true);
  assert.match(r.body.error, /Thiết lập AI/);
  r = ok(await api('POST', `/api/projects/${p.id}/items`, { name: 'Thanh toán QR', kind: 'full', force: true }));
  const feat = r.itemId;
  assert.strictEqual(r.project.items.find((i) => i.id === feat).specDir, 'specs/001-thanh-toan-qr');

  // thiết lập AI: công cụ (loại trùng), mức dữ liệu hợp lệ; B2 xong + đủ 6 file luật
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/ai-setup`, { tools: ['Claude'], dataLevel: 'tuyet-mat' })).status, 400);
  p = ok(await api('PUT', `/api/projects/${p.id}/ai-setup`, { tools: ['Claude', 'GitHub Copilot', 'Claude'], dataLevel: 'internal' }));
  assert.deepStrictEqual(p.aiSetup.tools, ['Claude', 'GitHub Copilot']);
  assert.strictEqual(p.view.setup.ready, false);

  const boundary = 'XB';
  const mp = (fields, file) => Buffer.from(
    Object.entries(fields).map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`).join('') +
    (file ? `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: text/plain\r\n\r\n${file.data}\r\n` : '') +
    `--${boundary}--\r\n`);
  const mph = { 'content-type': `multipart/form-data; boundary=${boundary}` };
  const link = (track, step, templateId) => api('POST', `/api/projects/${p.id}/docs`, mp({ track, step, templateId, label: templateId, url: `https://git.congty.vn/ins/-/blob/main/${templateId}.md` }), mph);

  for (const id of ['constitution', 'skill', 'docs-index', 'tool-permissions', 'data-classification', 'ai-tool-scope']) ok(await link('base', 'B2', id));
  p = ok(await api('PUT', `/api/projects/${p.id}/t/base/steps/B2`, { status: 'done' }));
  assert.strictEqual(p.view.setup.ready, true, JSON.stringify(p.view.setup));

  /* ---------- Fast-track có câu hỏi điều kiện, Change Request cần mã CR ---------- */
  const noFast = await api('POST', `/api/projects/${p.id}/items`, { name: 'Sửa nhãn', kind: 'fast' });
  assert.strictEqual(noFast.status, 400);
  assert.match(noFast.body.error, /Fast-track/);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/items`, { name: 'Sửa nhãn', kind: 'fast', fast: { small: true, sensitive: true, model: false } })).status, 400, 'chạm thanh toán/phân quyền → không được fast-track');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/items`, { name: 'Sửa nhãn', kind: 'fast', fast: { small: false, sensitive: false, model: false } })).status, 400, 'quá 0,5 ngày → không được fast-track');
  r = ok(await api('POST', `/api/projects/${p.id}/items`, { name: 'Sửa nhãn', kind: 'fast', fast: { small: true, sensitive: false, model: false } }));
  const fast = r.itemId;
  p = r.project;
  assert.deepStrictEqual(p.items.find((i) => i.id === fast).fastCheck, { small: true, sensitive: false, model: false });
  assert.strictEqual(p.items.find((i) => i.id === fast).specDir, '');
  assert.strictEqual(p.view.items[fast].gates.g1.applies, false, 'fast-track: Gate 1 không áp dụng');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/items`, { name: 'Đổi hạn mức', kind: 'cr' })).status, 400, 'CR cần mã CR');
  r = ok(await api('POST', `/api/projects/${p.id}/items`, { name: 'Đổi hạn mức', kind: 'cr', crCode: 'CR-012', crReason: 'Khách đổi hạn mức giao dịch' }));
  assert.strictEqual(r.project.items.find((i) => i.id === r.itemId).crCode, 'CR-012');
  p = r.project;
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/items/${feat}`, { name: 'QR', specDir: '../etc' })).status, 400);

  /* ---------- bước, checklist, gate (chưa khai báo thành viên → ai cũng ký được) ---------- */
  p = ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B3`, { status: 'doing', owners: [me.id, dev.id, 'zzzzzzzz'] }));
  assert.deepStrictEqual(p.items.find((i) => i.id === feat).steps.B3.owners, [me.id, dev.id]);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B3`, { status: 'xyz' })).status, 400);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/base/steps/B5`, { status: 'done' })).status, 400);
  p = ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/checks/B3`, { checks: [0, 1, 99] }));
  assert.strictEqual(p.items.find((i) => i.id === feat).steps.B3.checks.filter(Boolean).length, 2);
  assert.strictEqual(p.view.items[feat].stepPct.B3, Math.round((2 / proc.steps.find((s) => s.code === 'B3').rows.length) * 100));

  assert.strictEqual(p.view.me.enforced, false);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4`, { result: 'pass' })).status, 409);
  for (const k of ['g4a', 'g4b', 'g4c']) ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/${k}`, { result: 'pass' }));
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4`, { result: 'pass' }));
  r = ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4b`, { result: 'fail', note: 'còn lỗ hổng High' }));
  assert.deepStrictEqual(r.reset, ['Gate 4']);
  assert.strictEqual(r.project.items.find((i) => i.id === feat).gates.g4.result, 'pending');
  assert.deepStrictEqual(r.project.view.items[feat].failed, ['g4b']);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/${fast}/gates/g1`, { result: 'pass' })).status, 409);

  /* ---------- tài liệu: link, file .md, chặn javascript:, tải về dạng attachment, xoá ---------- */
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/docs`, mp({ track: 'base', step: 'B1', url: 'javascript:alert(1)' }), mph)).status, 400);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/docs`, mp({ track: feat, step: 'B3' }, { name: 'brd.html', data: '<script>x</script>' }), mph)).status, 400);
  const bin = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="track"\r\n\r\n${feat}\r\n--${boundary}\r\nContent-Disposition: form-data; name="step"\r\n\r\nB3\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="x.md"\r\n\r\n`), Buffer.from([0xff, 0xfe, 0x00, 0x41]), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/docs`, bin, mph)).status, 400);
  const md = '# BRD Thanh toán QR\n\n| Mục | Giá trị |\n|---|---|\n| A | 1 |\n\n- [x] xong\n';
  const docsBefore = p.docs.length;
  p = ok(await api('POST', `/api/projects/${p.id}/docs`, mp({ track: feat, step: 'B3' }, { name: '../../BRD.md', data: md }), mph));
  const doc = p.docs.find((d) => d.file);
  assert.strictEqual(doc.file.name, 'BRD.md');
  const dl = await api('GET', `/api/projects/${p.id}/files/${doc.id}`);
  assert.strictEqual(dl.raw.body, md);
  assert.match(dl.raw.headers['content-disposition'], /^attachment/);
  const content = await api('GET', `/api/projects/${p.id}/docs/${doc.id}/content`);
  assert.strictEqual(content.raw.body, md);
  assert.match(content.raw.headers['content-type'], /^text\/plain/);
  assert.match(content.raw.headers['content-security-policy'], /sandbox/);

  // Kiểm tra tải ZIP hàng loạt tài liệu
  const zipRes = await api('GET', `/api/projects/${p.id}/docs/download-zip`);
  assert.strictEqual(zipRes.status, 200);
  assert.strictEqual(zipRes.raw.headers['content-type'], 'application/zip');
  assert.strictEqual(zipRes.raw.rawPayload.slice(0, 4).toString('binary'), 'PK\x03\x04', 'ZIP file signature hợp lệ');

  // Kiểm tra nhật ký hoạt động thời gian thực (Activity feed)
  const actRes = ok(await api('GET', `/api/projects/${p.id}/activities`));
  assert.ok(Array.isArray(actRes));
  assert.ok(actRes.length > 0);

  // Kiểm tra xoá tài liệu hàng loạt & các trường hợp biên
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/docs/batch-delete`, { ids: [] })).status, 400, 'ids rỗng bị từ chối');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/docs/batch-delete`, { ids: ['non-existent-id'] })).status, 400, 'id không tồn tại bị từ chối');
  p = ok(await api('POST', `/api/projects/${p.id}/docs/batch-delete`, { ids: [doc.id] }));
  assert.strictEqual(p.docs.length, docsBefore);
  assert.ok(!fs.existsSync(path.join(dataDir, 'uploads', p.id, doc.id)), 'file đã xoá khỏi đĩa qua batch-delete');

  /* ---------- vai trò: khai báo thành viên → chỉ đúng vai trò mới ký được gate ---------- */
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/members`, { members: [] })).status, 200, 'admin sửa thành viên được');
  p = ok(await api('PUT', `/api/projects/${p.id}/members`, { members: [
    { userId: me.id, roles: ['PM', 'TechLead', 'Hacker'] }, { userId: dev.id, roles: ['Dev', 'Test'] }, { userId: 'zzzzzzzz', roles: ['PM'] }, { userId: out.id, roles: [] },
  ] }));
  assert.deepStrictEqual(p.members, [{ userId: me.id, roles: ['PM', 'TechLead'] }, { userId: dev.id, roles: ['Dev', 'Test'] }], 'bỏ vai trò lạ, id lạ và người không có vai trò');
  assert.strictEqual(p.view.me.enforced, true);
  as('dev1');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/members`, { members: [] })).status, 403, 'không phải PM/admin thì không sửa được thành viên');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/ai-setup`, { tools: ['X'], dataLevel: '' })).status, 403, 'Dev không sửa được thiết lập AI');
  r = ok(await api('GET', `/api/projects/${p.id}`));
  assert.strictEqual(r.view.items[feat].gates.g4a.roleBlocker, null, 'Dev có vai trò Test nên ký được Gate 4a');
  assert.match(r.view.items[feat].gates.g2.roleBlocker, /Tech Lead/);
  const g2 = await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g2`, { result: 'pass' });
  assert.strictEqual(g2.status, 403);
  assert.match(g2.body.error, /Tech Lead/);
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4a`, { result: 'pass', note: 'SIT xanh' }));
  as('admin');
  const g4a = await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4a`, { result: 'fail' });
  assert.strictEqual(g4a.status, 403, 'admin không có vai trò Test thì cũng không ký được Gate 4a');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4`, { result: 'pass' })).status, 403, 'Gate 4 chỉ PO');

  /* ---------- nhật ký dùng AI + Human Gate ---------- */
  as('dev1');
  const aiBody = { step: 'B3', tool: 'Claude', model: 'sonnet', purpose: 'Tóm tắt biên bản họp', promptId: 'P-B3-01', origin: 'ai' };
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { ...aiBody, tool: 'ChatGPT' })).status, 400, 'công cụ chưa được duyệt');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { ...aiBody, origin: 'robot' })).status, 400);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { ...aiBody, promptId: 'a b' })).status, 400);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { ...aiBody, step: 'B1' })).status, 400, 'B1 không thuộc hạng mục');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { ...aiBody, purpose: ' ' })).status, 400);
  p = ok(await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, aiBody));
  const log1 = p.aiLogs[0];
  assert.strictEqual(log1.result, 'pending');
  assert.ok(!('prompt' in log1) && !JSON.stringify(log1).includes('nội dung prompt'), 'không lưu nội dung prompt');
  p = ok(await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, { step: 'B3', origin: 'manual', purpose: 'Viết BRD tay' }));
  assert.strictEqual(p.aiLogs[1].result, 'na');
  assert.strictEqual(p.aiLogs[1].tool, '');
  // người ngoài dự án không ghi / duyệt được
  as('ngoai');
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/ai-logs`, aiBody)).status, 403);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/ai-logs/${log1.id}/review`, { result: 'accepted' })).status, 403);

  // chuẩn bị tới B5: B3, B4 xong; B5 giao cho dev
  as('admin');
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B3`, { status: 'done', owners: [me.id] }));
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B4`, { status: 'done' }));
  p = ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B5`, { status: 'doing', owners: [dev.id] }));
  // thiếu tài liệu bắt buộc: B3 cần BRD, B4 cần spec → chỉ cảnh báo
  let miss = p.view.items[feat].gates.g1.missingDocs.map((d) => `${d.step}:${d.id}`);
  assert.deepStrictEqual(miss, ['B3:brd', 'B4:spec']);
  assert.deepStrictEqual(p.view.items[feat].stepMissing.B3.map((d) => d.id), ['brd']);

  // việc của tôi
  let t = ok(await api('GET', '/api/my-tasks'));
  assert.deepStrictEqual(t.gates.filter((g) => g.track === feat).map((g) => g.gate), ['g1'], 'admin là PM nên Gate 1 đang chờ mình ký');
  assert.strictEqual(t.reviews.length, 1, 'có 1 mục AI do dev ghi đang chờ admin duyệt');
  as('dev1');
  t = ok(await api('GET', '/api/my-tasks'));
  assert.deepStrictEqual(t.steps.map((s) => `${s.track}:${s.step}`), [`${feat}:B5`]);
  assert.strictEqual(t.gates.length, 0, 'dev không có vai trò ký Gate 1');
  assert.strictEqual(t.reviews.length, 0, 'không tự duyệt nội dung AI của chính mình');

  // Gate 1 bị chặn khi còn nội dung AI chưa có người duyệt
  as('admin');
  const g1 = await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g1`, { result: 'pass' });
  assert.strictEqual(g1.status, 409);
  assert.match(g1.body.error, /chưa được người duyệt/);
  assert.strictEqual((await api('GET', `/api/projects/${p.id}`)).body.view.items[feat].gates.g1.pendingAi, 1);
  as('dev1');
  const self = await api('PUT', `/api/projects/${p.id}/ai-logs/${log1.id}/review`, { result: 'accepted' });
  assert.strictEqual(self.status, 400, 'người ghi không được tự duyệt');
  as('admin');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/ai-logs/${log1.id}/review`, { result: 'xyz' })).status, 400);
  p = ok(await api('PUT', `/api/projects/${p.id}/ai-logs/${log1.id}/review`, { result: 'edited', note: 'sửa lại phần số liệu' }));
  assert.strictEqual(p.aiLogs[0].result, 'edited');
  assert.strictEqual(p.aiLogs[0].reviewerName, me.name);
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/ai-logs/${log1.id}/review`, { result: 'accepted' })).status, 400, 'đã duyệt rồi');
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g1`, { result: 'pass', note: 'PM ký' }));

  // gắn tài liệu đúng biểu mẫu → hết cảnh báo thiếu tài liệu
  ok(await link(feat, 'B3', 'brd'));
  p = ok(await link(feat, 'B4', 'spec'));
  assert.deepStrictEqual(p.view.items[feat].gates.g1.missingDocs, []);

  // xoá nhật ký AI: đã duyệt thì chỉ admin xoá được; người ghi xoá được khi chưa duyệt
  as('dev1');
  assert.strictEqual((await api('DELETE', `/api/projects/${p.id}/ai-logs/${log1.id}`)).status, 403);
  p = ok(await api('DELETE', `/api/projects/${p.id}/ai-logs/${p.aiLogs[1].id}`));
  assert.strictEqual(p.aiLogs.length, 1);

  /* ---------- nhật ký, danh sách ---------- */
  as('admin');
  const logs = ok(await api('GET', `/api/projects/${p.id}/log`));
  assert.ok(logs.some((e) => e.action === 'Ký Gate 4a [Thanh toán QR]'));
  assert.ok(logs.some((e) => e.action === 'Bỏ qua cảnh báo thiết lập AI'), 'việc admin bỏ qua cảnh báo được ghi lại');
  assert.ok(logs.some((e) => e.action === 'Duyệt nội dung AI B3'));
  assert.ok(logs.some((e) => e.action === 'Sửa thành viên & vai trò'));
  assert.strictEqual(ok(await api('GET', '/api/projects')).length, 2);

  /* ---------- dữ liệu bản cũ tự chuyển ---------- */
  const old = { id: 'abcd1234', name: 'Cũ', code: '', description: '', processVersion: '5.9', archived: false, createdAt: '2026-11-01T00:00:00Z', createdBy: 'x', updatedAt: '2026-11-01T00:00:00Z',
    steps: { B1: { status: 'done', owner: '', start: '', end: '', note: '', checks: [] }, B5: { status: 'doing', owner: 'BA', start: '', end: '', note: '', checks: [true] } },
    gates: { g1: { result: 'fail', by: 'X', at: '', note: '' } },
    docs: [{ id: 'dddd0001', step: 'B1', label: 'a', url: 'https://a' }, { id: 'dddd0002', step: 'B5', label: 'b', url: 'https://b' }] };
  fs.writeFileSync(path.join(dataDir, 'projects', 'abcd1234.json'), JSON.stringify(old));
  const m1 = ok(await api('GET', '/api/projects/abcd1234'));
  const m2 = ok(await api('GET', '/api/projects/abcd1234'));
  assert.strictEqual(m1.items[0].id, m2.items[0].id);
  assert.strictEqual(m1.base.steps.B1.status, 'done');
  assert.strictEqual(m1.items[0].name, 'Phát hành đầu tiên');
  assert.strictEqual(m1.items[0].steps.B5.owner, 'BA', 'người phụ trách dạng chữ cũ vẫn giữ để hiển thị');
  assert.strictEqual(m1.items[0].gates.g1.result, 'fail');
  assert.deepStrictEqual(m1.docs.map((d) => d.track), ['base', m1.items[0].id]);
  assert.deepStrictEqual([m1.members, m1.aiLogs, m1.aiSetup.tools, m1.repoType], [[], [], [], 'gitlab'], 'trường mới có giá trị mặc định');
  assert.strictEqual(m1.view.me.enforced, false, 'dự án cũ chưa khai báo thành viên → chưa bật kiểm soát vai trò');

  // giao diện: đường dẫn lạ → index.html (hoặc 503 khi chưa build); assets chặn thoát thư mục
  assert.ok([200, 503].includes((await api('GET', '/p/abcd1234/t/base')).status));
  assert.strictEqual((await api('GET', '/assets/..%2f..%2fserver.js')).status, 404);
  assert.strictEqual((await api('GET', '/assets/x.exe')).status, 404);

  /* ---------- tài khoản: đặt lại mật khẩu thu hồi phiên; thành viên thường không vào API admin ---------- */
  const reset = ok(await api('POST', `/api/admin/users/${dev.id}/reset`));
  assert.ok(reset.password.length >= 12);
  as('dev1');
  assert.strictEqual((await api('GET', '/api/me')).status, 401, 'phiên cũ của dev bị thu hồi sau khi đặt lại mật khẩu');
  const dev2 = await loginAs('dev1', reset.password);
  as('dev1');
  assert.strictEqual(dev2.username, 'dev1');
  assert.strictEqual((await api('POST', '/api/projects', { name: 'Y' })).status, 403);
  assert.strictEqual((await api('POST', `/api/admin/users/${me.id}/disabled`, { disabled: true })).status, 403);
  // xoá tài khoản: chỉ admin, không tự xoá, gỡ khỏi danh sách
  assert.strictEqual((await api('DELETE', `/api/admin/users/${out.id}`)).status, 403);
  as('admin');
  assert.strictEqual((await api('DELETE', `/api/admin/users/${me.id}`)).status, 400, 'không tự xoá chính mình');
  assert.strictEqual((await api('DELETE', '/api/admin/users/khong-co')).status, 404);
  ok(await api('DELETE', `/api/admin/users/${out.id}`));
  assert.ok(!ok(await api('GET', '/api/users')).some((u) => u.id === out.id));
  as('dev1');
  // dự án chưa thiết lập AI: thành viên thường không bỏ qua được, kể cả gửi force
  let blocked = await api('POST', `/api/projects/${q.id}/items`, { name: 'Báo cáo', kind: 'full', force: true });
  assert.strictEqual(blocked.status, 409);
  assert.strictEqual(blocked.body.canForce, false);
  // dự án đã sẵn sàng: Change Request tạo bình thường
  ok(await api('POST', `/api/projects/${p.id}/items`, { name: 'Báo cáo', kind: 'cr', crCode: 'CR-013' }));

  /* ---------- quản lý bug & Gate 4 blocker ---------- */
  as('admin');
  ok(await api('PUT', `/api/projects/${p.id}/members`, { members: [
    { userId: me.id, roles: ['PM', 'TechLead', 'PO', 'Security'] },
    { userId: dev.id, roles: ['Dev', 'Test'] },
  ] }));
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4b`, { result: 'pass' }));
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/t/${feat}/bugs`, { title: '' })).status, 400);
  let bugRes = ok(await api('POST', `/api/projects/${p.id}/t/${feat}/bugs`, { title: 'Lỗi treo khi quét QR', severity: 'S1', step: 'B11' }));
  let bug = bugRes.bugs.find((b) => b.title === 'Lỗi treo khi quét QR');
  assert.ok(bug);
  assert.strictEqual(bug.code, 'BUG-001');
  assert.strictEqual(bug.severity, 'S1');
  assert.strictEqual(bug.status, 'open');
  assert.strictEqual(bugRes.view.items[feat].bugs.openS1S2, 1);

  // g4a, g4b, g4c đã đạt nhưng Gate 4 bị chặn vì còn bug S1
  let g4Res = await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4`, { result: 'pass' });
  assert.strictEqual(g4Res.status, 409);
  assert.match(g4Res.body.error, /bug S1\/S2/);

  // sửa bug thành S3 -> Gate 4 không còn bị chặn bởi bug S1/S2
  bugRes = ok(await api('PUT', `/api/projects/${p.id}/bugs/${bug.id}`, { severity: 'S3' }));
  assert.strictEqual(bugRes.view.items[feat].bugs.openS1S2, 0);

  // đổi lại S1 và đóng bug (closed)
  ok(await api('PUT', `/api/projects/${p.id}/bugs/${bug.id}`, { severity: 'S1', status: 'closed' }));
  const updatedBug = (await api('GET', `/api/projects/${p.id}`)).body.bugs.find((b) => b.id === bug.id);
  assert.strictEqual(updatedBug.status, 'closed');
  assert.ok(updatedBug.closedAt);

  // Gate 4 ký Đạt thành công khi bug S1 đã đóng
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/gates/g4`, { result: 'pass' }));

  // xóa bug
  ok(await api('DELETE', `/api/projects/${p.id}/bugs/${bug.id}`));
  assert.ok(!(await api('GET', `/api/projects/${p.id}`)).body.bugs.some((b) => b.id === bug.id));

  /* ---------- phiên bền + sao lưu ---------- */
  const sid = cookies.admin.split('=')[1];
  const raw = fs.readFileSync(path.join(dataDir, 'sessions.json'), 'utf8');
  assert.ok(!raw.includes(sid), 'file phiên không chứa mã phiên gốc');
  assert.ok(raw.includes(crypto.createHash('sha256').update(sid).digest('hex')), 'file phiên chỉ chứa SHA-256');
  const app2 = await buildApp({ dataDir, logger: false });
  const again = await app2.inject({ method: 'GET', url: '/api/me', headers: { host: 'localhost', cookie: cookies.admin } });
  assert.strictEqual(again.statusCode, 200, 'khởi động lại server vẫn giữ phiên đăng nhập');
  await app2.close();

  /* ---------- phân quyền RBAC & Dự án Private ---------- */
  as('admin');
  const priv = ok(await api('POST', '/api/projects', { name: 'Dự án Mật', visibility: 'private' }));
  assert.strictEqual(priv.visibility, 'private');
  // gán dev1 làm thành viên với vai trò Dev
  ok(await api('PUT', `/api/projects/${priv.id}/members`, { members: [{ userId: dev.id, roles: ['Dev'] }] }));

  // tạo user "ngoai2" không thuộc dự án
  const ngoai2 = ok(await api('POST', '/api/admin/users', { username: 'ngoai2', name: 'Người Ngoài 2', password: 'ngoai2-pass-123' }));
  await loginAs('ngoai2', 'ngoai2-pass-123');

  // ngoai2 không thấy dự án Private trong danh sách và không mở được chi tiết (404)
  as('ngoai2');
  const ngoaiProjects = ok(await api('GET', '/api/projects'));
  assert.ok(!ngoaiProjects.some((x) => x.id === priv.id), 'người ngoài không thấy dự án private');
  assert.strictEqual((await api('GET', `/api/projects/${priv.id}`)).status, 404, 'người ngoài mở dự án private bị 404');
  assert.strictEqual((await api('POST', `/api/projects/${priv.id}/items`, { name: 'Hack item' })).status, 404);

  // dev1 là thành viên: thấy và mở được dự án
  as('dev1');
  const devProjects = ok(await api('GET', '/api/projects'));
  assert.ok(devProjects.some((x) => x.id === priv.id), 'thành viên thấy dự án private');
  assert.strictEqual((await api('GET', `/api/projects/${priv.id}`)).status, 200);

  // dev1 (chỉ có vai trò Dev) không có quyền sửa/lưu trữ hạng mục
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/items/${feat}`, { name: 'Đổi tên lén' })).status, 403);
  assert.strictEqual((await api('POST', `/api/projects/${p.id}/items/${feat}/archive`, { archived: true })).status, 403);

  // dev1 (không phải owner của B1, B1 chỉ gán me/PM) không được sửa tiến độ B1
  as('admin');
  ok(await api('PUT', `/api/projects/${p.id}/t/base/steps/B1`, { status: 'doing', start: '2026-11-01', end: '2026-11-10', owners: [me.id] }));
  as('dev1');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/base/steps/B1`, { status: 'done', start: '2026-11-01', end: '2026-11-10' })).status, 403, 'không phải owner/PM thì không sửa được bước');
  assert.strictEqual((await api('PUT', `/api/projects/${p.id}/t/base/checks/B1`, { checks: [0, 1] })).status, 403, 'không phải owner/PM thì không tick checklist');

  // nhưng dev1 có thể sửa bước mà dev1 là owner
  as('admin');
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B9`, { status: 'doing', start: '2026-11-01', end: '2026-11-10', owners: [dev.id] }));
  as('dev1');
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/steps/B9`, { status: 'doing', start: '2026-11-01', end: '2026-11-10', note: 'Dev1 đang làm' }));
  ok(await api('PUT', `/api/projects/${p.id}/t/${feat}/checks/B9`, { checks: [0] }));

  // kiểm tra DORA metrics, Cycle Time, AI Acceleration, Bottlenecks
  as('admin');
  const metrics = ok(await api('GET', '/api/metrics'));
  assert.ok(metrics.dora, 'có dora metrics');
  assert.ok(metrics.dora.deploymentFrequency);
  assert.ok(metrics.dora.leadTime);
  assert.ok(metrics.dora.changeFailureRate);
  assert.ok(metrics.dora.timeToRestore);
  assert.ok(metrics.cycleTime?.phases?.length >= 5, 'chu kỳ có các giai đoạn');
  assert.ok(metrics.aiAcceleration, 'có chỉ số tăng tốc AI');
  assert.ok(metrics.bottlenecks, 'có chỉ số phát hiện điểm nghẽn');

  // kiểm tra tạo tài liệu Markdown trực tiếp, sửa có lưu lịch sử revision, xuất Word (.docx)
  const createdDoc = ok(await api('POST', `/api/projects/${p.id}/docs/create`, {
    track: 'base',
    step: 'B1',
    label: 'Kế hoạch kiến trúc hệ thống',
    content: '# Kiến trúc v1\r\n\r\nNội dung ban đầu của hệ thống.',
  }));
  const newDoc = createdDoc.docs.find((d) => d.label === 'Kế hoạch kiến trúc hệ thống');
  assert.ok(newDoc, 'tài liệu mới đã tạo thành công');
  assert.strictEqual(newDoc.revisions?.length || 0, 0);

  // đọc nội dung file ban đầu
  const initRes = await api('GET', `/api/projects/${p.id}/docs/${newDoc.id}/content`);
  assert.strictEqual(initRes.status, 200);
  assert.match(initRes.raw.payload, /Kiến trúc v1/);

  // cập nhật nội dung tạo revision
  const updatedDocRes = ok(await api('PUT', `/api/projects/${p.id}/docs/${newDoc.id}/content`, {
    content: '# Kiến trúc v2\r\n\r\nNội dung đã được nâng cấp lên v2.',
    note: 'Cập nhật kiến trúc v2',
  }));
  const updatedDoc = updatedDocRes.docs.find((d) => d.id === newDoc.id);
  assert.strictEqual(updatedDoc.revisions?.length, 1, 'đã tạo 1 revision lưu vết');
  assert.strictEqual(updatedDoc.lastNote, 'Cập nhật kiến trúc v2');
  assert.strictEqual(updatedDoc.revisions[0].note, 'Bản trước');

  // đọc revision cũ
  const revId = updatedDoc.revisions[0].revId;
  const revRes = await api('GET', `/api/projects/${p.id}/docs/${newDoc.id}/revisions/${revId}`);
  assert.strictEqual(revRes.status, 200);
  assert.match(revRes.raw.payload, /Kiến trúc v1/);

  // xuất tài liệu thành Word (.docx)
  const docxRes = await api('GET', `/api/projects/${p.id}/docs/${newDoc.id}/docx`);
  assert.strictEqual(docxRes.status, 200);
  assert.match(docxRes.raw.headers['content-type'], /wordprocessingml\.document/);
  assert.ok(docxRes.raw.rawPayload.length > 500, 'file Word xuất ra có dữ liệu OpenXML');

  // Upload file PDF & kiểm tra endpoint xem inline
  const pdfSample = Buffer.from('%PDF-1.4 sample content');
  const pdfUpload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="track"\r\n\r\nbase\r\n--${boundary}\r\nContent-Disposition: form-data; name="step"\r\n\r\nB1\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="kien-truc.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    pdfSample,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  p = ok(await api('POST', `/api/projects/${p.id}/docs`, pdfUpload, mph));
  const pdfDoc = p.docs.find((d) => d.file?.name === 'kien-truc.pdf');
  assert.ok(pdfDoc, 'Upload thành công file PDF');
  const pdfView = await api('GET', `/api/projects/${p.id}/files/${pdfDoc.id}/view`);
  assert.strictEqual(pdfView.status, 200);
  assert.match(pdfView.raw.headers['content-type'], /application\/pdf/);
  assert.match(pdfView.raw.headers['content-disposition'], /^inline/);

  // Upload file CSV & kiểm tra sheet-data
  const csvContent = 'ID,Tên,Tiến độ\n1,Task A,100%\n2,Task B,50%';
  const csvUpload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="track"\r\n\r\nbase\r\n--${boundary}\r\nContent-Disposition: form-data; name="step"\r\n\r\nB1\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bao-cao.csv"\r\nContent-Type: text/csv\r\n\r\n`),
    Buffer.from(csvContent, 'utf8'),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  p = ok(await api('POST', `/api/projects/${p.id}/docs`, csvUpload, mph));
  const csvDoc = p.docs.find((d) => d.file?.name === 'bao-cao.csv');
  assert.ok(csvDoc, 'Upload thành công file CSV');
  const sheetRes = await api('GET', `/api/projects/${p.id}/docs/${csvDoc.id}/sheet-data`);
  assert.strictEqual(sheetRes.status, 200);
  assert.ok(sheetRes.body.sheetNames.length >= 1);
  const firstSheet = sheetRes.body.sheets[sheetRes.body.sheetNames[0]];
  assert.strictEqual(firstSheet.rows.length, 3);
  assert.strictEqual(firstSheet.rows[0][0], 'ID');

  // Chặn upload file không hợp lệ (.exe)
  const exeUpload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="track"\r\n\r\nbase\r\n--${boundary}\r\nContent-Disposition: form-data; name="step"\r\n\r\nB1\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="malware.exe"\r\nContent-Type: application/octet-stream\r\n\r\n`),
    Buffer.from('MZ...'),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const exeRes = await api('POST', `/api/projects/${p.id}/docs`, exeUpload, mph);
  assert.strictEqual(exeRes.status, 400);

  as('admin');
  ok(await api('POST', '/api/logout'));
  assert.strictEqual((await api('GET', '/api/me')).status, 401);

  const bdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-bak-'));
  assert.strictEqual(runBackup(dataDir, bdir, new Date(2026, 10, 5)), 'data-2026-11-05');
  assert.strictEqual(runBackup(dataDir, bdir, new Date(2026, 10, 5)), null, 'mỗi ngày chỉ một bản');
  assert.ok(fs.existsSync(path.join(bdir, 'data-2026-11-05', 'users.json')));
  assert.ok(fs.existsSync(path.join(bdir, 'data-2026-11-05', 'projects', `${p.id}.json`)));
  assert.ok(!fs.existsSync(path.join(bdir, 'data-2026-11-05', 'sessions.json')), 'không sao lưu bí mật đăng nhập');
  for (let d = 6; d <= 25; d++) runBackup(dataDir, bdir, new Date(2026, 10, d));
  const kept = fs.readdirSync(bdir).sort();
  assert.strictEqual(kept.length, KEEP);
  assert.strictEqual(kept[kept.length - 1], 'data-2026-11-25');
  assert.ok(!kept.includes('data-2026-11-05'), 'bản cũ nhất bị xoá khi vượt số bản giữ lại');

  await app.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(bdir, { recursive: true, force: true });
  console.log('OK — API đạt tất cả kiểm tra');
})().catch((e) => { console.error(e); process.exit(1); });

'use strict';
// Quy tắc nghiệp vụ tính từ dữ liệu — hàm thuần, không đọc file.
// track = { steps: {Bx: {status, checks…}}, gates: {gx: {result…}} }; tài liệu / nhật ký AI nằm ở cấp dự án.

const STATUS = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Xong', skipped: 'Bỏ qua' };
const GATE_RESULT = { pending: 'Chưa ký', pass: 'Đạt', fail: 'Không đạt' };
const KIND = { full: 'Tính năng', cr: 'Change Request', fast: 'Fast-track' };
// nhãn nguồn gốc nội dung (quy trình yêu cầu gắn AI-generated / Manual cho test case, script…)
const AI_ORIGIN = { ai: 'AI-generated', mixed: 'AI + sửa tay', manual: 'Manual' };
const AI_RESULT = { pending: 'Chờ duyệt', accepted: 'Chấp nhận', edited: 'Đã sửa', rejected: 'Loại bỏ', na: '—' };
const DATA_LEVEL = { public: 'Công khai', internal: 'Nội bộ', confidential: 'Bí mật', restricted: 'Hạn chế' };
const BUG_SEVERITY = { S1: 'S1 — Blocker', S2: 'S2 — Critical', S3: 'S3 — Major', S4: 'S4 — Minor' };
const BUG_STATUS = { open: 'Mở', fixing: 'Đang sửa', closed: 'Đã đóng' };
// điều kiện dùng luồng rút gọn (theo tài liệu): đáp án bắt buộc cho từng câu
const FAST_QUESTIONS = [
  { key: 'small', label: 'Việc dưới 0,5 ngày công?', must: true },
  { key: 'sensitive', label: 'Có chạm phân quyền hoặc thanh toán?', must: false },
  { key: 'model', label: 'Có đổi data model?', must: false },
];

function stepPct(proc, t, code) {
  const st = t.steps[code];
  if (!st) return 0;
  if (st.status === 'done' || st.status === 'skipped') return 100;
  const rows = proc.steps.find((s) => s.code === code).rows.length;
  if (!rows) return 0;
  const ticked = (st.checks || []).slice(0, rows).filter(Boolean).length;
  return Math.round((ticked / rows) * 100);
}

// gate nằm ở bước đã "Bỏ qua" (vd fast-track bỏ B5/B6 → Gate 1/2) thì không áp dụng
const gateApplies = (t, g) => (t.steps[g.at] || {}).status !== 'skipped';

function summarize(proc, t) {
  const order = proc.steps.map((s) => s.code).filter((c) => t.steps[c]);
  const counted = order.filter((c) => t.steps[c].status !== 'skipped');
  const pct = counted.length ? Math.round(counted.reduce((n, c) => n + stepPct(proc, t, c), 0) / counted.length) : 100;
  const curIdx = order.findIndex((c) => !['done', 'skipped'].includes(t.steps[c].status));
  const current = curIdx === -1 ? null : order[curIdx];
  const reach = curIdx === -1 ? order.length - 1 : curIdx;
  const gates = proc.gates.filter((g) => t.gates[g.key] && gateApplies(t, g));
  // gate đang chặn: gate đầu tiên chưa "Đạt" nằm ở bước đã tới (≤ bước hiện tại)
  const blocking = gates.find((g) => order.indexOf(g.at) <= reach && t.gates[g.key].result !== 'pass') || null;
  return { pct, current, blocking, failed: gates.filter((g) => t.gates[g.key].result === 'fail') };
}

const openS1S2Bugs = (p, tid) =>
  (p?.bugs || []).filter((b) => b.track === tid && ['S1', 'S2'].includes(b.severity) && b.status !== 'closed');

// trả về lý do không được ký "Đạt", hoặc null
function gateBlocker(proc, t, key, p, tid) {
  const g = proc.gates.find((x) => x.key === key);
  const missing = (g.requires || []).filter((k) => (t.gates[k] || {}).result !== 'pass');
  if (missing.length) return `Cần ${missing.map((k) => proc.gates.find((x) => x.key === k).id).join(', ')} đạt trước`;
  if (key === 'g4' && p && tid) {
    const s1s2 = openS1S2Bugs(p, tid);
    if (s1s2.length) return `Còn ${s1s2.length} bug S1/S2 chưa đóng (${s1s2.map((b) => b.code || b.title).join(', ')}) — Gate 4 yêu cầu bug S1–S2 = 0`;
  }
  return null;
}

/* ---------- vai trò ---------- */
// Kiểm soát vai trò chỉ bật khi dự án đã khai báo thành viên; chưa khai báo thì ai cũng ký được (dự án cũ không bị kẹt).
const enforced = (p) => (p.members || []).length > 0;
const rolesOf = (p, uid) => (p.members || []).find((m) => m.userId === uid)?.roles || [];
const roleLabel = (proc, key) => (proc.roles.find((r) => r.key === key) || {}).label || key;
const isMember = (p, uid) => (p.members || []).some((m) => m.userId === uid);

// quyền xem dự án: admin, dự án public, hoặc là thành viên của dự án
const canViewProject = (p, user) =>
  Boolean(user?.admin || p?.visibility !== 'private' || isMember(p, user?.id));

// quyền tạo hạng mục: admin, dự án chưa bật vai trò, hoặc là thành viên của dự án
const canCreateItem = (p, user) =>
  Boolean(user?.admin || !enforced(p) || isMember(p, user?.id));

// quyền sửa / lưu trữ hạng mục: admin, dự án chưa bật vai trò, hoặc có vai trò PM / PO
const canManageItems = (p, user) =>
  Boolean(user?.admin || !enforced(p) || rolesOf(p, user?.id).some((r) => r === 'PM' || r === 'PO'));

// quyền sửa bước / tick checklist: admin, dự án chưa bật vai trò, PM / TechLead, hoặc là người phụ trách
const canEditStep = (p, step, user) =>
  Boolean(
    user?.admin ||
    !enforced(p) ||
    rolesOf(p, user?.id).some((r) => r === 'PM' || r === 'TechLead') ||
    (step?.owners || []).includes(user?.id)
  );

// lý do user không được ký gate này, hoặc null
function gateRoleBlocker(proc, p, user, key) {
  const g = proc.gates.find((x) => x.key === key);
  if (!enforced(p) || !g.roles.length) return null;
  if (rolesOf(p, user.id).some((r) => g.roles.includes(r))) return null;
  return `${g.id} chỉ vai trò ${g.roles.map((r) => roleLabel(proc, r)).join(' / ')} được ký — bạn chưa có vai trò này trong dự án`;
}

/* ---------- nhật ký AI + tài liệu bắt buộc ---------- */
const stepIdx = (proc, code) => proc.steps.findIndex((s) => s.code === code);

// nội dung do AI sinh (ai/mixed) trong track, từ đầu tới bước `atStep`, chưa có người duyệt
const pendingAi = (proc, p, tid, atStep) =>
  (p.aiLogs || []).filter((l) => l.track === tid && l.result === 'pending' && stepIdx(proc, l.step) <= stepIdx(proc, atStep));

// tài liệu bắt buộc còn thiếu của track, từ đầu tới bước `atStep` (bước "Bỏ qua" không đòi)
function missingDocs(proc, p, tid, t, atStep) {
  const out = [];
  for (const st of proc.steps) {
    if (stepIdx(proc, st.code) > stepIdx(proc, atStep) || !t.steps[st.code] || t.steps[st.code].status === 'skipped') continue;
    for (const tpl of st.templates.filter((x) => x.required)) {
      if (!(p.docs || []).some((d) => d.track === tid && d.step === st.code && d.templateId === tpl.id)) out.push({ step: st.code, id: tpl.id, title: tpl.title });
    }
  }
  return out;
}

// dự án đã sẵn sàng dùng AI chưa (B2 xong + công cụ được duyệt + mức dữ liệu + đủ file luật)
function setupStatus(proc, p) {
  const missing = [];
  if (p.base.steps.B2?.status !== 'done') missing.push('Bước B2 (Constitution & skill.md) chưa xong');
  if (!(p.aiSetup?.tools || []).length) missing.push('Chưa khai báo công cụ AI được duyệt');
  if (!p.aiSetup?.dataLevel) missing.push('Chưa chọn mức nhạy cảm dữ liệu');
  const docs = missingDocs(proc, p, 'base', p.base, 'B2');
  if (docs.length) missing.push(`Thiếu tài liệu B2: ${docs.map((d) => d.title).join('; ')}`);
  return { ready: !missing.length, missing };
}

module.exports = {
  STATUS, GATE_RESULT, KIND, AI_ORIGIN, AI_RESULT, DATA_LEVEL, BUG_SEVERITY, BUG_STATUS, FAST_QUESTIONS,
  stepPct, summarize, gateBlocker, gateApplies, enforced, rolesOf, isMember, roleLabel, gateRoleBlocker,
  pendingAi, missingDocs, setupStatus, stepIdx, openS1S2Bugs, canViewProject, canCreateItem, canManageItems, canEditStep,
};

'use strict';
// Đọc định nghĩa quy trình từ repo ai-sdlc (../src) → process.json.
// Chạy lại mỗi khi quy trình đổi: node sync-process.js [đường/dẫn/ai-sdlc]
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..'), 'src');
const d = require(path.join(SRC, 'data.js'));
const detail = JSON.parse(fs.readFileSync(path.join(SRC, 'steps-detail.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(SRC, 'templates.json'), 'utf8'));

const tplTitle = {};
for (const g of registry.groups) for (const f of g.files) tplTitle[f.id] = f.title;

// Phạm vi + vị trí gợi ý của từng file mẫu trong repo dự án (theo cây thư mục của docs-index.md,
// mở rộng cho nhiều tính năng: mỗi hạng mục 1 thư mục specs/NNN-ten/, ký hiệu {spec}).
//   shared     — dùng chung toàn dự án (nền tảng), tính năng chỉ tham chiếu
//   cumulative — 1 file/thư mục chung, mỗi tính năng thêm vào (ADR, CHANGELOG…)
//   feature    — riêng từng hạng mục, nằm trong {spec}/
//   event      — theo sự kiện (bug, postmortem)
// Mẫu không có trong bảng → shared, không gợi ý đường dẫn.
const PLACES = {
  'pl1-project-charter': ['shared', 'docs/project-charter.md'],
  constitution: ['shared', 'constitution.md'], 'coding-convention': ['shared', 'CODING_CONVENTION.md'],
  skill: ['shared', 'SKILL.md'], agents: ['shared', 'AGENTS.md'], 'docs-index': ['shared', 'docs-index.md'],
  glossary: ['shared', 'glossary.md'], 'dor-dod': ['shared', 'dor-dod.md'],
  'tool-permissions': ['shared', 'docs/tool-permissions.md'], 'data-classification': ['shared', 'docs/data-classification.md'],
  'ai-tool-scope': ['shared', 'docs/ai-tool-scope.md'], prompts: ['shared', 'docs/prompts.md'],
  'code-review-human': ['shared', 'docs/code-review-checklist.md'], 'conventional-commits': ['shared', 'docs/conventional-commits.md'],
  'standards-index': ['shared', 'docs/standards-index.md'], 'ai-governance': ['shared', 'docs/ai-governance.md'],
  'adr-template': ['cumulative', 'docs/adr/NNNN-ten-quyet-dinh.md'], changelog: ['cumulative', 'CHANGELOG.md'],
  runbook: ['cumulative', 'runbook.md'], 'dora-metrics': ['cumulative', 'docs/dora-metrics.md'],
  'pl2-change-request': ['feature', '{spec}/changes/CR-xxx.md'], 'pl4-bo-bieu-mau-b3': ['feature', null],
  'pl6-uat-go-no-go': ['feature', '{spec}/uat-signoff.md'],
  'interview-guide': ['feature', '{spec}/interview-guide.md'], 'meeting-minutes': ['feature', '{spec}/bien-ban-hop.md'],
  brd: ['feature', '{spec}/BRD.md'], 'process-flow': ['feature', '{spec}/process-flow.md'], 'qa-log': ['feature', '{spec}/QA-log.md'],
  spec: ['feature', '{spec}/spec.md'], plan: ['feature', '{spec}/plan.md'], tasks: ['feature', '{spec}/tasks.md'],
  'test-plan': ['feature', '{spec}/test-plan.md'], 'test-case-rtm': ['feature', '{spec}/test-case-rtm.md'],
  'threat-model': ['feature', '{spec}/threat-model.md'],
  'pl5-bug-report': ['event', null], postmortem: ['event', 'postmortems/YYYY-MM-DD-ten-su-co.md'],
};
for (const g of registry.groups) if (g.id === 'rules') for (const f of g.files) PLACES[f.id] = ['shared', `rules/${f.id}.md`];
const place = (id) => { const [scope, p] = PLACES[id] || ['shared', null]; return { scope, path: p }; };

// Vai trò theo RACI của quy trình (tài liệu: PM, BA, PO/Sponsor, Tech Lead, Dev, Test, Security, DevOps/Ops).
// "AI không bao giờ giữ vai trò A" — AI không phải vai trò, chỉ có người mới ký gate.
const ROLES = [
  { key: 'PM', label: 'PM' }, { key: 'BA', label: 'BA' }, { key: 'PO', label: 'PO / Sponsor / Khách hàng' },
  { key: 'TechLead', label: 'Tech Lead' }, { key: 'Dev', label: 'Dev' }, { key: 'Test', label: 'Tester / Test Lead' },
  { key: 'Security', label: 'Security' }, { key: 'DevOps', label: 'DevOps / Ops' },
];
// Vai trò được ký từng gate, theo cột "Người duyệt" của tài liệu (gate.owner).
//   g3 "Reviewer khác tác giả": Dev hoặc Tech Lead; g5 "Họp Go/No-Go": PM ghi nhận kết quả họp cùng PO.
const GATE_ROLES = {
  g1: ['PO', 'PM'], g2: ['TechLead'], g3: ['TechLead', 'Dev'], g4a: ['Test'], g4b: ['Security'],
  g4c: ['TechLead'], g4: ['PO'], g5: ['PM', 'PO'],
};
// Tài liệu đầu ra bắt buộc của từng bước (trong số mẫu của bước đó) — thiếu thì cảnh báo trước khi ký gate.
const REQUIRED = {
  B2: ['constitution', 'skill', 'docs-index', 'tool-permissions', 'data-classification', 'ai-tool-scope'],
  B3: ['brd'], B4: ['spec'], B6: ['plan'], B7: ['tasks'], B11: ['test-plan', 'test-case-rtm'],
  B12: ['pl6-uat-go-no-go'], B13: ['changelog'],
};

const steps = [];
for (const ph of d.phases) {
  for (const s of ph.steps) {
    const rows = (detail[s.code] || []).map((r) => ({
      name: r[0], who: r[1], how: r[2], note: r[3], form: r[4] === '—' ? '' : r[4],
    }));
    // biểu mẫu của bước = link trong bảng chi tiết + mẫu có "for" bắt đầu bằng mã bước
    const ids = new Set();
    for (const r of detail[s.code] || []) for (const l of (r[5] && r[5].links) || []) ids.add(l.id);
    for (const g of registry.groups) {
      for (const f of g.files) if (new RegExp(`^\\s*${s.code}\\b`).test(f.for || '')) ids.add(f.id);
    }
    steps.push({
      code: s.code, name: s.name, phase: ph.id, gate: s.gate || '', out: s.out || '', ai: s.ai || '',
      rows,
      templates: [...ids].filter((id) => tplTitle[id]).map((id) => ({ id, title: tplTitle[id], ...place(id), required: (REQUIRED[s.code] || []).includes(id) })),
    });
  }
}

const gates = d.gates.map((g) => ({
  key: g.id.toLowerCase().replace(/^gate\s*/, 'g'),
  id: g.id, at: g.at, owner: g.owner, check: g.check, after: g.after,
}));
for (const g of gates) g.roles = GATE_ROLES[g.key] || [];
// Gate 4 chỉ ký được khi 4a/4b/4c đã đạt (theo nội dung "4a+4b+4c đã ký" của tài liệu)
const g4 = gates.find((g) => g.key === 'g4');
if (g4) g4.requires = gates.filter((g) => /^g4[a-z]$/.test(g.key)).map((g) => g.key);

// luồng rút gọn: đọc khoảng "bỏ qua Bx–By" trong mô tả fastTrack của tài liệu
const ft = /bỏ qua\s+B(\d+)\s*[–-]\s*B(\d+)/i.exec(d.fastTrack || '');
const order = steps.map((s) => s.code);
const fastTrackSkip = ft ? order.filter((c) => { const n = +c.slice(1); return n >= +ft[1] && n <= +ft[2]; }) : [];

// Thư viện prompt chuẩn từ templates/b2/prompts.md
const promptsFile = path.resolve(SRC, '..', 'templates', 'b2', 'prompts.md');
const prompts = [];
if (fs.existsSync(promptsFile)) {
  const ptext = fs.readFileSync(promptsFile, 'utf8').replace(/\r\n/g, '\n');
  const pre = /^###\s+(P-B\d+-\d+)\s*[·-]\s*([^\n]+)\n\n```(?:text)?\n([\s\S]*?)```/gm;
  let pm;
  while ((pm = pre.exec(ptext)) !== null) {
    const id = pm[1].trim();
    const title = pm[2].trim();
    const template = pm[3].trim();
    const sm = /^P-(B\d+)-\d+/.exec(id);
    prompts.push({ id, step: sm ? sm[1] : '', title, template });
  }
}

const out = {
  version: d.meta.version,
  site: 'https://' + d.meta.domain,
  syncedAt: new Date().toISOString().slice(0, 10),
  // giai đoạn đầu (B1–B2: Charter, constitution/skill.md) làm 1 lần cho cả dự án;
  // các bước còn lại lặp lại cho từng hạng mục (tính năng / Change Request / fast-track)
  baseSteps: d.phases[0].steps.map((s) => s.code),
  fastTrack: d.fastTrack || '',
  fastTrackSkip,
  phases: d.phases.map((p) => ({ id: p.id, name: p.name, steps: p.steps.map((s) => s.code) })),
  roles: ROLES,
  prompts,
  steps,
  gates,
};
fs.writeFileSync(path.join(__dirname, 'process.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`process.json: v${out.version} · ${steps.length} bước · ${steps.reduce((n, s) => n + s.rows.length, 0)} hàng · ${gates.length} gate · ${prompts.length} prompt`);

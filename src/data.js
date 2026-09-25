'use strict';
// Nguồn dữ liệu duy nhất cho site — trích từ quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf
// Sửa file này rồi refresh trang: server tự đọc lại (không cần build).

const meta = {
  version: '5.9',
  sourceName: 'quy-trinh-ai.pdf',
  pages: 47,
  diagrams: 14,
  updated: '2026-09-14',
  domain: 'ai.btdat.io.vn',
  tagline: 'Quy trình phát triển phần mềm tích hợp AI',
  basis: 'Spec-Driven Development (GitHub Spec Kit) + Agile/Scrum + DevOps, bổ sung AI gate và Human gate',
  scope: 'Mọi dự án phần mềm của công ty. Task nhỏ < 0,5 ngày công đi luồng rút gọn (mục 6).',
};

const phases = [
  {
    id: 'GĐ 0',
    name: 'Khởi tạo',
    tint: 'violet',
    steps: [
      { code: 'B1', name: 'Project Charter & Kick-off', gate: 'PM duyệt',
        out: 'Project Charter, Stakeholder Register, Communication Plan',
        ai: 'Claude/ChatGPT draft Charter; Fireflies/Otter ghi biên bản kick-off' },
      { code: 'B2', name: 'Constitution & skill.md', gate: 'Tech Lead + PM duyệt', key: true,
        out: '17 file: constitution, convention, SKILL.md, tool-permissions, data-classification, prompts, rules/…',
        ai: 'Đây là "bộ não" điều khiển AI Agent — mọi lỗi ở B2 nhân bản ra 12 bước sau' },
    ],
  },
  {
    id: 'GĐ 1',
    name: 'Yêu cầu',
    tint: 'blue',
    steps: [
      { code: 'B3', name: 'Thu thập & phân tích yêu cầu', gate: null,
        out: 'BRD, Biên bản họp, Process flow / User journey',
        ai: 'AI ghi họp, trích xuất yêu cầu, sinh BPMN nháp — chuẩn BABOK v3 + BPMN 2.0' },
      { code: 'B4', name: 'Viết Spec (Specify)', gate: null,
        out: 'spec.md, User Story + Acceptance Criteria, SRS',
        ai: 'ISO/IEC/IEEE 29148, INVEST, Gherkin Given–When–Then' },
      { code: 'B5', name: 'Làm rõ & chốt Spec (Clarify)', gate: '⛔ Gate 1 — PO/PM ký',
        out: 'Q&A Log, spec.md final, Biên bản duyệt Spec',
        ai: 'Chưa qua Gate 1 thì không được sinh plan/code; sau Gate 1 mọi thay đổi phải qua Change Request (PL2)' },
    ],
  },
  {
    id: 'GĐ 2',
    name: 'Thiết kế',
    tint: 'cyan',
    steps: [
      { code: 'B6', name: 'Technical Plan & Kiến trúc', gate: '⛔ Gate 2 — Tech Lead duyệt',
        out: 'plan.md, ADR, C4 Model, ERD, OpenAPI 3.x',
        ai: 'AI đề xuất kiến trúc → tự kiểm bằng adr-rules/api-rules; tránh "architecture by autocomplete"' },
      { code: 'B7', name: 'Phân rã Task & sprint planning', gate: 'PM duyệt sprint backlog',
        out: 'tasks.md, Ticket Jira, Sprint Backlog',
        ai: '/speckit.tasks phân rã plan.md, mỗi task có AC riêng' },
    ],
  },
  {
    id: 'GĐ 3',
    name: 'Lập trình',
    tint: 'green',
    steps: [
      { code: 'B8', name: 'Coding (AI-assisted / agentic)', gate: null,
        out: 'Code, commit theo Conventional Commits, PR',
        ai: 'AI tuân thủ constitution + CODING_CONVENTION; dừng lại hỏi khi mâu thuẫn tài liệu' },
      { code: 'B9', name: 'Unit Test', gate: 'Coverage gate tự động',
        out: 'Unit test, báo cáo coverage, mutation score',
        ai: 'AI sinh test theo test-rules.md; dev phải đọc assert thay vì tin mù' },
      { code: 'B10', name: 'Code Review 2 tầng', gate: '⛔ Gate 3 — human approve mới merge',
        out: 'PR comment của AI, review của người, PR đã merge',
        ai: 'Tầng 1 AI quét bug/convention/bảo mật theo code-review-rules.md (OWASP ASVS) + SAST/secret scan; tầng 2 người review nghiệp vụ/kiến trúc' },
    ],
  },
  {
    id: 'GĐ 4',
    name: 'Kiểm thử',
    tint: 'amber',
    steps: [
      { code: 'B11', name: 'Test Plan & Test Case', gate: 'Test Lead duyệt',
        out: 'Test Plan, Test Case, RTM, Automation script',
        ai: 'AI sinh test case từ Acceptance Criteria; Playwright codegen — RTM phủ 100% AC' },
      { code: 'B12', name: 'SIT / Regression / UAT / ATTT & Hiệu năng', gate: '⛔ Gate 4a/4b/4c + Gate 4',
        out: 'Biên bản SIT, báo cáo ATTT, báo cáo hiệu năng, Biên bản UAT Sign-off',
        ai: 'DAST + pentest (4b), JMeter/k6 (4c); zero bug S1–S2 mới trình PO ký UAT' },
    ],
  },
  {
    id: 'GĐ 5',
    name: 'Phát hành & Vận hành',
    tint: 'pink',
    steps: [
      { code: 'B13', name: 'Release & triển khai môi trường', gate: '⛔ Gate 5 — Go/No-Go',
        out: 'Release note, Rollback Plan, Checklist Go/No-Go',
        ai: 'Build-once-promote-many; blue-green/canary; Hypercare 1–2 tuần sau go-live' },
      { code: 'B14', name: 'Vận hành, giám sát & cải tiến', gate: 'Post-mortem có người chủ trì',
        out: 'Runbook, Post-mortem, constitution.md cập nhật',
        ai: 'AI hỗ trợ giám sát log/alert (SRE agent); bài học đưa ngược vào constitution.md/rules' },
    ],
  },
];

const gates = [
  { id: 'Gate 1', at: 'B5', owner: 'PO / PM', check: 'Spec đã chốt, mọi câu hỏi mở trong Q&A Log đã trả lời', after: 'Khóa spec.md — thay đổi sau đó phải qua Change Request' },
  { id: 'Gate 2', at: 'B6', owner: 'Tech Lead (Architect/CTO)', check: 'ADR khớp constitution.md, OpenAPI đạt api-rules', after: 'Commit plan.md/ADR/C4/OpenAPI vào repo' },
  { id: 'Gate 3', at: 'B10', owner: 'Reviewer khác tác giả', check: 'AI review tầng 1 xanh, CI xanh, hết finding High/Critical', after: 'Merge — branch protection chặn nếu thiếu review' },
  { id: 'Gate 4a', at: 'B12', owner: 'Test Lead', check: 'SIT + Regression tự động xanh 100%, RTM phủ 100% AC', after: 'Deploy build sang UAT' },
  { id: 'Gate 4b', at: 'B12', owner: 'Security Lead / pentest độc lập', check: 'DAST, pentest, DBF/EDR, PAM+MFA; hết lỗ hổng Critical/High', after: 'Không còn lỗ hổng chưa vá' },
  { id: 'Gate 4c', at: 'B12', owner: 'Tech Lead', check: 'Load & stress test đạt SLA hiệu năng trong Spec', after: 'Xác nhận scalability/auto-scaling' },
  { id: 'Gate 4', at: 'B12', owner: 'PO / khách hàng', check: '4a+4b+4c đã ký, bug S1–S2 = 0, kịch bản UAT chạy xong', after: 'Biên bản UAT Sign-off (PL6)' },
  { id: 'Gate 5', at: 'B13', owner: 'Họp Go/No-Go: PM, Tech Lead, Test Lead, Security Lead, PO', check: 'Checklist Go/No-Go (PL6) toàn bộ "Đạt"', after: 'Go-live + Hypercare; có mục "Không đạt" → No-Go, dời lịch' },
];

const b2Groups = [
  {
    title: 'Nhóm 1 — Quy định kỹ thuật',
    note: 'Luật bất biến của hệ thống, dùng từ B3 trở đi',
    files: [
      { n: '3.1', f: 'constitution.md', d: 'Kiến trúc, bảo mật, logging. Mỗi nguyên tắc đủ 3 phần: Rule / Rationale / Application' },
      { n: '3.2', f: 'CODING_CONVENTION.md', d: 'Naming, formatting, cấu trúc thư mục, docstring' },
      { n: '3.3', f: 'adr-template.md', d: 'Khuôn ADR chuẩn để AI sinh ADR nhất quán từ B6', tag: 'mới V5.2' },
    ],
  },
  {
    title: 'Nhóm 2 — Quy định vận hành AI',
    note: 'AI là ai, được phép làm gì, dữ liệu nào được đưa vào prompt',
    files: [
      { n: '3.4', f: 'SKILL.md', d: 'Identity, thứ tự đọc file, phạm vi quyền hạn, xử lý khi không chắc chắn, workflow coding, Tầng 1/Tầng 2' },
      { n: '3.5', f: 'tool-permissions.md', d: 'Least-privilege: được tự chạy test/lint, KHÔNG được tự chạy migration DB hay push thẳng lên main', tag: 'mới V5.2' },
      { n: '3.6', f: 'data-classification.md', d: 'Public / Internal / Confidential / Restricted — loại nào được đưa vào prompt AI', tag: 'mới V5.2' },
      { n: '3.7', f: 'ai-tool-scope.md', d: 'Danh mục AI tool được duyệt cho dự án + trạng thái Zero Data Retention', tag: 'mới V5.2' },
    ],
  },
  {
    title: 'Nhóm 3 — Quy định & thư viện Prompt',
    note: 'Prompt tinh chỉnh theo từng giai đoạn',
    files: [
      { n: '3.8', f: 'prompts.md', d: 'System prompt cho B3, B4, B6, B9, B10, B13' },
    ],
  },
  {
    title: 'Nhóm 4 — Quy tắc kiểm tra (rules/)',
    note: 'Linter để AI tự kiểm trước khi người review — phủ mọi giai đoạn AI sinh nội dung',
    files: [
      { n: '3.9', f: 'rules/brd-rules.md', d: 'Linter cho BRD (B3)' },
      { n: '3.10', f: 'rules/bpm-rules.md', d: 'Linter cho BPMN (B3/B4)' },
      { n: '3.11', f: 'rules/adr-rules.md', d: 'Checklist AI tự kiểm ADR (B6)', tag: 'mới V5.2' },
      { n: '3.12', f: 'rules/api-rules.md', d: 'Checklist AI tự kiểm OpenAPI Spec (B6)', tag: 'mới V5.2' },
      { n: '3.13', f: 'rules/test-rules.md', d: 'Checklist AI tự kiểm Unit Test (B9)', tag: 'mới V5.2' },
      { n: '3.14', f: 'rules/code-review-rules.md', d: 'Checklist AI review tầng 1 — cụ thể hóa OWASP ASVS (B10)', tag: 'mới V5.2' },
    ],
  },
  {
    title: 'Chỉ mục & dùng chung',
    note: 'Đồng bộ tài liệu và thuật ngữ giữa người và AI',
    files: [
      { n: '3.15', f: 'docs-index.md', d: 'Bản đồ tài liệu dự án — chống AI đọc sai file' },
      { n: '3.16', f: 'glossary.md', d: 'Từ điển thuật ngữ nghiệp vụ (BA cập nhật ở B4)' },
      { n: '3.17', f: 'dor-dod.md', d: 'Definition of Ready / Definition of Done — tiêu chí khách quan cho mọi gate' },
    ],
  },
];

const appendices = [
  { n: 1, t: 'Project Charter & Kick-off', for: 'B1', d: 'Charter (SMART, in/out-scope, ngân sách), milestones gắn Gate 1–5, Stakeholder Register, Comm Plan' },
  { n: 2, t: 'Change Request Form', for: 'Sau Gate 1', d: 'Mọi thay đổi phạm vi/thiết kế sau khi Spec đã chốt — PM + PO duyệt trước khi làm' },
  { n: 3, t: 'Bộ tài liệu B2 (17 mục, 3.1–3.17)', for: 'B2', d: 'Mỗi mục có phần "Cách dựng" (ai dựng, dựa chuẩn nào, nạp vào AI ra sao) + nội dung mẫu copy dùng ngay' },
  { n: 4, t: 'Bộ biểu mẫu B3 (4.1–4.5)', for: 'B3', d: 'Interview Guide · Biên bản họp (phân biệt phát biểu gốc vs AI diễn giải) · BRD theo BABOK v3 · Process Flow/User Journey (BPMN 2.0) · Q&A Log' },
  { n: 5, t: 'Bug Report', for: 'Vận hành', d: 'Steps to reproduce, expected vs actual, evidence, link AC/Test Case, Severity + Priority' },
  { n: 6, t: 'UAT Sign-off & Go/No-Go Checklist', for: 'Gate 4 & 5', d: 'Phần 1: biên bản UAT (Test Lead, Security Lead, PO ký). Phần 2: checklist Go/No-Go trước go-live' },
];

const severity = [
  { lv: 'S1 — Blocker', def: 'Hệ thống down, mất dữ liệu, chặn toàn bộ luồng nghiệp vụ chính, lỗ hổng khai thác được ngay', sla: '4 giờ' },
  { lv: 'S2 — Critical', def: 'Một chức năng chính không dùng được, không có workaround, ảnh hưởng nhiều người dùng', sla: '1 ngày làm việc' },
  { lv: 'S3 — Major', def: 'Chức năng phụ lỗi, hoặc chức năng chính lỗi nhưng có workaround', sla: '3–5 ngày (theo sprint)' },
  { lv: 'S4 — Minor', def: 'Lỗi giao diện, chính tả, không ảnh hưởng nghiệp vụ', sla: 'Backlog theo ưu tiên' },
];

const priority = [
  { p: 'P1 — Khẩn cấp', d: 'Xử lý ngay, có thể phá sprint → áp dụng quy trình Hotfix' },
  { p: 'P2 — Cao', d: 'Ưu tiên trong sprint hiện tại' },
  { p: 'P3 — Trung bình', d: 'Đưa vào backlog, lên kế hoạch sprint kế tiếp' },
  { p: 'P4 — Thấp', d: 'Xử lý khi rảnh nguồn lực, không cam kết thời gian' },
];

const lifecycle = ['New', 'Triage', 'Assigned', 'In Progress', 'Fixed', 'Retest', 'Closed'];
const lifecycleNote = 'Retest fail → Reopen. Triage Board họp hằng ngày do Test Lead chủ trì. Chỉ người báo lỗi/Test được đóng bug — Dev không tự đóng bug mình sửa.';

const hotfix = [
  'Xác nhận sự cố, tạo nhánh hotfix từ commit đang chạy Production',
  'Fix tối thiểu đúng phạm vi sự cố — không tranh thủ sửa việc khác',
  'Unit test cho phần fix (bắt buộc) + chạy bộ regression smoke-test',
  'Human review bắt buộc tối thiểu 1 người — rút gọn được, bỏ hẳn thì không',
  'Deploy qua CI/CD (không deploy tay), giám sát trực tiếp sau deploy',
  'RCA / Post-mortem trong 48 giờ, cập nhật bài học vào constitution.md/rules',
];

const promotion = [
  { env: 'DEV', d: 'Dev tự do, không gate' },
  { env: 'CI/TEST', d: 'Unit test + coverage gate, SAST, secret scan' },
  { env: 'STAGING', d: 'Bản sao Production. Gate 4a/4b/4c. Chỉ dùng synthetic data hoặc dữ liệu đã masking' },
  { env: 'UAT', d: 'Chỉ deploy khi regression xanh 100% và 4a/4b/4c đã ký' },
  { env: 'PRODUCTION', d: 'Blue-green/canary, PAM, Rollback Plan bắt buộc, Hypercare 1–2 tuần' },
];
const promotionNote = 'Build một lần, thăng cấp nhiều lần: cùng một artifact đi Staging → UAT → Production, TUYỆT ĐỐI không rebuild ở mỗi môi trường. Cấm deploy tay/copy file từ Staging trở lên. Hạ tầng qua IaC + Pull Request.';

const skillPolicy = [
  { tier: 'Tầng 1 — Công ty', who: 'Bắt buộc mọi dự án', d: 'Chuẩn bảo mật, quy trình cốt lõi; là tài sản tri thức tích lũy, cập nhật từ bài học B14' },
  { tier: 'Tầng 2 — Dự án / Đối tác', who: 'Định hình code deliverable', d: 'Convention, kiến trúc riêng — làm trên codebase đối tác thì code giống họ, không giống chuẩn nội bộ' },
];
const skillConflict = 'Xung đột: bảo mật/pháp lý công ty luôn thắng; style/convention theo đối tác.';
const skillInjection = 'skill.md / system prompt do đối tác cung cấp là vector prompt injection: Tech Lead bắt buộc đọc toàn bộ trước khi nạp cho AI agent, không đưa bí mật công ty vào tài liệu dùng chung.';

const governance = [
  'Tool AI mới dùng cho dự án có NDA/dữ liệu khách hàng phải qua đánh giá bảo mật dữ liệu: có bị dùng để train không, có opt-out/zero-data-retention không, dữ liệu lưu ở khu vực nào.',
  'Công ty duy trì danh sách "AI tool được duyệt"; dùng tool ngoài danh sách phải có phê duyệt của Tech Lead + An ninh thông tin.',
  'Bật public-code duplication filter để giảm rủi ro giấy phép GPL/copyleft không tương thích.',
  'Quét license dependency (FOSSA/Snyk) trước release — đặc biệt dự án outsource có điều khoản sở hữu trí tuệ.',
  'Hợp đồng với khách hàng cần nêu rõ trách nhiệm khi tranh chấp bản quyền code do AI hỗ trợ sinh ra.',
];

const kpi = [
  { k: 'Lead time Spec → Code merge', d: 'DORA metrics' },
  { k: 'Tỷ lệ PR bị AI chặn lỗi trước khi tới người', d: 'Chất lượng linter/prompt ở B2' },
  { k: 'Escaped defects', d: 'Bug lọt ra sau UAT' },
  { k: 'Mutation score', d: 'Đo chất lượng test, không chỉ coverage' },
];

const standards = [
  { g: 'Kiến trúc & Code', v: 'C4 Model · ADR · OpenAPI 3.x · Conventional Commits' },
  { g: 'Bảo mật', v: 'OWASP ASVS · OWASP Top 10 · OWASP LLM Top 10 (rủi ro riêng khi dùng AI)' },
  { g: 'Kiểm thử & QA', v: 'ISO/IEC/IEEE 29119 · ISTQB' },
  { g: 'Công cụ', v: 'GitHub Spec Kit · Claude Code (agentic) · CodeRabbit (review) · Playwright (automation)' },
];

const raci = 'RACI đầy đủ 14 bước × 7 vai trò (PM, BA, PO/Sponsor, Tech Lead, Dev, Test, Security, DevOps/Ops). Nguyên tắc xuyên suốt: AI không bao giờ giữ vai trò A — trách nhiệm cuối cùng luôn thuộc về con người.';

const fastTrack = 'Task < 0,5 ngày công, không chạm phân quyền/thanh toán, không đổi data model: bỏ qua B4–B7 đầy đủ, mô tả thẳng vào ticket. Vẫn bắt buộc unit test + AI review tầng 1 + human review tầng 2.';

const gaps = [
  { at: 'B4', what: 'spec.md / User Story + Acceptance Criteria', note: 'Tài liệu tự ghi "chưa có biểu mẫu chuẩn riêng — đề xuất bổ sung ở bản cập nhật kế tiếp"' },
  { at: 'B6', what: 'plan.md / C4 Model', note: 'Bảng bước 5 ghi "Chưa có mẫu plan.md/C4"' },
  { at: 'B10', what: 'Checklist riêng cho human reviewer tầng 2', note: 'Bảng bước 5 ghi "Chưa có checklist riêng"' },
  { at: 'B11', what: 'Test Plan / Test Case / RTM', note: 'Ghi "Chưa có mẫu"' },
  { at: 'B14', what: 'Runbook và Post-mortem template', note: 'Ghi "Chưa có mẫu" cho cả hai' },
];

const assets = [
  { f: 'quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf', d: 'Bản gốc 47 trang (nguyên bản, không sửa)', size: '2,3 MB' },
  { f: 'quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt', d: 'Text trích từ PDF, để tra cứu/tìm kiếm', size: '89 KB' },
  { f: 'luu-do/', d: '14 lưu đồ PNG của B1–B14 (bước Human Gate tô vàng)', size: '644 KB' },
  { f: 'README.md', d: 'Tóm tắt nội dung + danh sách chỗ còn thiếu', size: '6,6 KB' },
];

module.exports = { meta, phases, gates, b2Groups, appendices, severity, priority, lifecycle, lifecycleNote, hotfix, promotion, promotionNote, skillPolicy, skillConflict, skillInjection, governance, kpi, standards, raci, fastTrack, gaps, assets };

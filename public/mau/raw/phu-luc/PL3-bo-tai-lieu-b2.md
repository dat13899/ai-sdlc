---
title: "PL3 — Bộ tài liệu B2: chỉ mục 17 file"
for: "B2. Constitution & skill.md (Giai đoạn 0 — Khởi tạo)"
owner: "Tech Lead (A/R) · PM (C) · BA (R một phần)"
nguồn: "AI-SDLC v5.9 Phụ lục 3 (17 mục 3.1–3.17); GitHub Spec Kit; AGENTS.md; MADR"
---

# PL3 — Bộ tài liệu B2 (chỉ mục 17 file)

> **Cách dựng:** Tech Lead chạy `/speckit.constitution` ngay sau khi khởi tạo repo (trước khi viết bất kỳ tính năng nào), sau đó tạo 4 nhóm tài liệu dưới đây. Đây là **"bộ não" điều khiển AI Agent** và tiêu chuẩn hoá cách làm việc của đội — mọi lệnh `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` sau đó đều đối chiếu ngược lại các file này.
>
> Bảng dưới ánh xạ từng mục của tài liệu gốc sang **file mẫu .md đã tổng hợp sẵn** trong bộ mẫu này — copy vào thư mục gốc repo dự án là dùng được.

## Cách kiểm tra đã dựng đủ bộ

- [ ] Đã có đủ 17 file (hoặc có ghi rõ lý do bỏ file nào)
- [ ] Mọi file đã điền placeholder `[Tên dự án]`, không còn placeholder trống
- [ ] `docs-index.md` liệt kê đúng các file thực có trong repo
- [ ] `constitution.md` đã được commit **trước** commit code tính năng đầu tiên
- [ ] Bổ sung/sửa file luôn qua Pull Request; chỉ Tech Lead được duyệt thay đổi `constitution.md`

---

## NHÓM 1 — Quy định kỹ thuật

| Mục | File mẫu | Nội dung | Ai dựng | Khi nào cập nhật |
|---|---|---|---|---|
| 3.1 | [`b2/constitution.md`](b2/constitution.md) | Quy tắc bất biến về kiến trúc, bảo mật, logging. Mỗi nguyên tắc đủ 3 phần: **Rule / Rationale / Application** | Tech Lead (chạy `/speckit.constitution`) | Khi có bài học từ B14; mọi thay đổi qua PR |
| 3.2 | [`b2/CODING_CONVENTION.md`](b2/CODING_CONVENTION.md) | Naming, formatting, cấu trúc thư mục, docstring; bảng formatter/linter theo ngôn ngữ | Tech Lead + AI draft | Khi thêm ngôn ngữ/framework mới |
| 3.3 | [`b2/adr-template.md`](b2/adr-template.md) | Khuôn ADR theo chuẩn MADR, dùng từ B6 để AI sinh ADR nhất quán | Tech Lead | Hiếm khi — đây là khuôn mẫu |

**Điều kiện hoàn thành nhóm 1:** Tech Lead đã ký duyệt; `constitution.md` đã lan truyền xuống các template phụ thuộc (plan-template, spec-template, tasks-template) bằng lệnh Spec Kit.

---

## NHÓM 2 — Quy định vận hành AI

| Mục | File mẫu | Nội dung | Ai dựng | Khi nào cập nhật |
|---|---|---|---|---|
| 3.4 | [`b2/SKILL.md`](b2/SKILL.md) | AI là ai, thứ tự đọc file, phạm vi quyền hạn, xử lý khi không chắc chắn, workflow coding, Tầng 1/Tầng 2 | Tech Lead | Khi đổi công cụ AI hoặc phạm vi quyền |
| 3.4b | [`b2/AGENTS.md`](b2/AGENTS.md) | Chuẩn liên-công-cụ: file chỉ dẫn agent dùng chung nhiều tool | Tech Lead | Khi đổi lệnh build/test |
| 3.5 | [`b2/tool-permissions.md`](b2/tool-permissions.md) | Least-privilege: bảng được tự chạy / phải hỏi / cấm; mức tự chủ theo môi trường | Tech Lead + Security | Khi thêm tool hoặc đổi quy trình deploy |
| 3.6 | [`b2/data-classification.md`](b2/data-classification.md) | Public / Internal / Confidential / Restricted — loại nào được đưa vào prompt AI | Security Lead + Tech Lead | Khi có loại dữ liệu mới |
| 3.7 | [`b2/ai-tool-scope.md`](b2/ai-tool-scope.md) | Danh mục tool AI được duyệt cho dự án + trạng thái Zero Data Retention | Tech Lead + ATTT | Mỗi quý, hoặc khi thêm tool |

**Điều kiện hoàn thành nhóm 2:** mọi tool AI dự án dùng đều nằm trong danh sách duyệt; `tool-permissions.md` không cho phép AI tự chạy migration DB hoặc push thẳng lên main.

---

## NHÓM 3 — Quy định & thư viện Prompt

| Mục | File mẫu | Nội dung | Ai dựng | Khi nào cập nhật |
|---|---|---|---|---|
| 3.8 | [`b2/prompts.md`](b2/prompts.md) | Thư viện system prompt tinh chỉnh cho từng giai đoạn (B3, B4, B6, B9, B10, B13) | Tech Lead + BA + AI draft | Khi prompt cho kết quả kém — ghi lại cả bản cũ để so sánh |

**Điều kiện hoàn thành nhóm 3:** mỗi prompt ghi rõ Input / Yêu cầu / Định dạng output / Điều KHÔNG được làm.

---

## NHÓM 4 — Quy tắc kiểm tra (`rules/`)

Đây là **linter để AI tự kiểm trước khi con người review** — phủ mọi giai đoạn AI tự sinh nội dung, không chỉ BA.

| Mục | File mẫu | Áp ở bước | Nội dung | Ai dựng |
|---|---|---|---|---|
| 3.9 | [`rules/brd-rules.md`](rules/brd-rules.md) | B3 | Linter BRD: yêu cầu đo lường được, FR vs NFR, truy vết mục tiêu kinh doanh | BA |
| 3.10 | [`rules/bpm-rules.md`](rules/bpm-rules.md) | B3/B4 | Linter BPMN: không nhánh cụt, gateway có nhãn, actor nhất quán | BA |
| 3.11 | [`rules/adr-rules.md`](rules/adr-rules.md) | B6 | Checklist tự kiểm ADR theo MADR (≥ 2 phương án, có cả mặt xấu) | Tech Lead |
| 3.12 | [`rules/api-rules.md`](rules/api-rules.md) | B6 | Checklist OpenAPI: naming, versioning, error model, bảo mật, ví dụ | Tech Lead |
| 3.13 | [`rules/test-rules.md`](rules/test-rules.md) | B9 | Checklist unit test: assert thật, một hành vi/test, edge case, chống test giả | Dev + Tester |
| 3.14 | [`rules/code-review-rules.md`](rules/code-review-rules.md) | B10 | Checklist AI review tầng 1 — cụ thể hoá OWASP ASVS + Top 10 + secret scan | Security + Tech Lead |

**Điều kiện hoàn thành nhóm 4:** mỗi linter có câu hỏi kiểm chứng được, có ví dụ viết đúng/sai, và có mục "điều kiện chặn cứng".

---

## CHỈ MỤC & DÙNG CHUNG

| Mục | File mẫu | Nội dung | Ai dựng | Khi nào cập nhật |
|---|---|---|---|---|
| 3.15 | [`b2/docs-index.md`](b2/docs-index.md) | Bản đồ tài liệu dự án: file nào là nguồn sự thật cho thông tin gì, thứ tự AI nên đọc | Tech Lead | Mỗi khi thêm/bớt file tài liệu |
| 3.16 | [`b2/glossary.md`](b2/glossary.md) | Từ điển thuật ngữ nghiệp vụ + kỹ thuật | BA (khởi tạo) | Liên tục từ B3 trở đi |
| 3.17 | [`b2/dor-dod.md`](b2/dor-dod.md) | Definition of Ready / Definition of Done — tiêu chí khách quan cho mọi gate | PM + Tech Lead | Khi tiêu chí không còn phù hợp thực tế |

---

## Quy tắc 2 tầng `skill.md` (mục 7 tài liệu gốc)

| Tầng | Nội dung | Khi xung đột |
|---|---|---|
| **Tầng 1 — Công ty** | Chuẩn bảo mật, quy trình cốt lõi. Áp dụng **bắt buộc** mọi dự án. Là tài sản tri thức tích luỹ, cập nhật từ bài học B14 | **Bảo mật/pháp lý công ty luôn thắng** |
| **Tầng 2 — Dự án / Đối tác** | Convention, kiến trúc riêng. Khi làm trên codebase có sẵn của đối tác, tầng này quyết định hình hài code (giống code của họ, không phải giống chuẩn nội bộ) | Style/convention theo đối tác |

### ⚠️ Kiểm duyệt `skill.md` của đối tác (chống prompt injection)

File chỉ dẫn AI agent (`skill.md`, system prompt do đối tác cung cấp) là **một vector prompt injection tiềm ẩn** — có thể chứa chỉ dẫn ẩn khiến agent gửi code/secret ra ngoài.

- [ ] Tech Lead **bắt buộc đọc toàn bộ** nội dung `skill.md`/tài liệu chỉ dẫn của đối tác trước khi nạp vào ngữ cảnh AI agent
- [ ] Không đưa bí mật công ty (API key, tên khách hàng khác, know-how định giá…) vào `skill.md` dùng chung với môi trường đối tác
- [ ] Nếu phát hiện chỉ dẫn đáng ngờ → dừng, báo Security Lead, ghi vào Q&A Log

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 (17 mục 3.1–3.17) và mục 2 B2, mục 7 — tài liệu gốc nội bộ
- GitHub Spec Kit — https://github.com/github/spec-kit
- Spec-Driven Development — https://github.com/github/spec-kit/blob/main/spec-driven.md
- AGENTS.md — https://agents.md/
- MADR — https://adr.github.io/madr/
- OWASP ASVS — https://owasp.org/www-project-application-security-verification-standard/

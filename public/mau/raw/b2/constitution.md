---
title: constitution.md — Hiến pháp dự án / Project Constitution
for: B2 bước 1–2 — Khởi tạo repo & Spec Kit, soạn Hiến pháp dự án (Tech Lead + AI)
owner: Tech Lead (người duyệt duy nhất) — PM đồng ký tại Gate B2
nguồn: AI-SDLC v5.9 — B2 (dòng 230–378) và Phụ lục 3.1 (dòng 1612–1675); GitHub Spec Kit — /speckit.constitution; OWASP ASVS 5.0
---

# constitution.md — Hiến pháp dự án

> **Cách dựng (theo tài liệu gốc):** Tech Lead chạy `/speckit.constitution` (GitHub Spec Kit) **ngay sau khi khởi tạo repo ở B2, trước khi bất kỳ tính năng nào được viết** — vì mọi lệnh sau đó (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`) đều đối chiếu ngược lại file này.
>
> AI thu thập input từ Tech Lead + ngữ cảnh repo, điền vào bản mẫu có placeholder, rồi tự động lan truyền thay đổi xuống các template phụ thuộc (`plan-template.md`, `spec-template.md`, `tasks-template.md`). **Chỉ Tech Lead được duyệt thay đổi file này, luôn qua Pull Request.**
>
> **Quy tắc bất biến:** mỗi nguyên tắc PHẢI có đủ 3 phần — **Rule** (câu lệnh MUST/SHOULD đo lường được, không viết chung chung), **Rationale** (tại sao tồn tại), **Application** (áp dụng cụ thể ra sao).

## Metadata

| Trường | Giá trị | Ghi chú |
|---|---|---|
| Tên dự án | `[Tên dự án]` | Khớp với tên repo |
| Version | `1.0.0` | Semantic Versioning — xem phần Governance |
| Ratified (ngày phê chuẩn) | `[Ngày ký Gate B2]` | Định dạng ISO `YYYY-MM-DD`; là ngày gốc, không đổi về sau |
| Last Amended (sửa đổi lần cuối) | `[Ngày ký Gate B2]` | Cập nhật mỗi lần tu chính |
| Owner / Người duyệt | Tech Lead `[Tên]` | Người duyệt duy nhất |
| Đồng ký Gate B2 | PM `[Tên]` | Human Gate |
| Tech stack đã chốt (từ B1) | `[VD: TypeScript/NestJS + PostgreSQL + Docker]` | Nguồn để suy ra Rule ở các nguyên tắc |
| Template phụ thuộc | `plan-template.md`, `spec-template.md`, `tasks-template.md` | Phải đồng bộ khi tu chính |
| Phạm vi áp dụng | Toàn bộ repo dự án, mọi AI agent, mọi thành viên | Constitution là nguồn chân lý duy nhất |

## Core Principles

### Nguyên tắc 1 — Kiến trúc đơn giản, nhất quán (Simple, Consistent Architecture)

**Rule**

- Hệ thống **MUST** theo **Microservices First**, **Stateless Services**, **API First**, **Fail-Fast**.
- **MUST** giới hạn tối đa **3 service cho MVP**; vượt quá con số này **MUST** có ADR giải trình (xem `adr-template.md`).
- Service **MUST** không giữ session state phía server.
- Mọi lời gọi giữa các service **MUST** qua contract được định nghĩa trước (OpenAPI) tại `docs/api/`.

**Rationale**

- Phức tạp sớm làm AI agent dễ "lạc" trong kiến trúc rối, sinh code sai chỗ.
- Ranh giới service rõ ràng giúp task nhỏ, PR nhỏ, review nhanh; số service là biến số đo lường được để phát hiện phình to kiến trúc.

**Application**

- Không dùng Repository pattern trừ khi độ phức tạp truy cập dữ liệu thực sự cần (ghi lý do trong ADR).
- Không session state phía server — dùng JWT (đối chiếu Nguyên tắc 2).
- Vượt 3 service **MUST** có ADR ở `docs/adr/`; CI kiểm tra sự tồn tại của ADR tương ứng khi thêm service mới.

### Nguyên tắc 2 — Bảo mật mặc định (Security By Default)

**Rule**

- Hệ thống **MUST** mã hóa dữ liệu **khi truyền** (TLS 1.2+) và **khi lưu trữ** (at rest).
- **MUST** validate mọi input tại biên hệ thống; **MUST** tuân thủ **OWASP Top 10** và đối chiếu checklist **OWASP ASVS**.
- **MUST NOT** hardcode secret trong mã nguồn, log, hay tài liệu.
- Mọi thay đổi liên quan **auth/authz** **MUST** có Security review trước khi merge.

**Rationale**

- Bảo mật không thể "gắn thêm sau" — làm từ đầu giảm bề mặt tấn công, tránh retrofit tốn kém và rủi ro rò rỉ dữ liệu.
- Auth là vùng lỗi đắt nhất: một sai sót nhỏ lan ra toàn hệ thống, nên cần cổng kiểm soát riêng.

**Application**

- Zero Trust: JWT / Auth Header **trên mọi request**, không tin request nội bộ mặc định.
- **Tuyệt đối không log PII** (đối chiếu `data-classification.md`), kể cả ở mức DEBUG.
- Secret qua Vault / biến môi trường; **không commit repo**; CI chạy secret scan và **chặn merge** nếu phát hiện.
- Mọi PR chạm `auth/`, `permissions/`, `payments/` **MUST** gắn label `security-review`.

### Nguyên tắc 3 — Khả năng quan sát (Observability)

**Rule**

- Mọi service **MUST** log **có cấu trúc JSON** (một schema thống nhất toàn hệ thống).
- Mọi log **MUST** mang `correlation_id` xuyên suốt chuỗi gọi; `correlation_id` **MUST** được sinh tại entry point và truyền xuống toàn bộ downstream call.
- **MUST NOT** log PII, secret, token, hay số thẻ — ở mọi mức log.

**Rationale**

- Không có log có cấu trúc, debug hệ thống agentic (nơi AI tự sinh code) gần như bất khả thi khi có sự cố production.
- `correlation_id` là điều kiện để tái dựng một request xuyên nhiều service — thứ mà log dạng text tự do không thể làm được.

**Application**

- Format log JSON dùng chung một logger util trong `src/utils/`; cấm `console.log`/`print()` trực tiếp trong code production (CI lint chặn).
- Trường bắt buộc trong mỗi bản ghi log: `timestamp`, `level`, `service`, `correlation_id`, `message`.
- Có integration test kiểm tra `correlation_id` được truyền qua ít nhất 2 service.

### Nguyên tắc 4 — Chất lượng theo hướng Test (Test-Driven Quality)

**Rule**

- Mọi tính năng **MUST** có **unit test sinh từ Acceptance Criteria (AC)**, **MUST NOT** sinh test từ code có sẵn.
- Coverage tối thiểu: **80% toàn repo**, **100% cho business logic lõi** (rules nghiệp vụ, tính tiền, phân quyền).
- CI **MUST** chặn merge nếu coverage dưới ngưỡng hoặc test fail.
- **MUST NOT** xóa test đang có — nếu test không còn phù hợp, **MUST** hỏi người trước (xem `tool-permissions.md`).

**Rationale**

- Test sinh từ AC là "hợp đồng" — ngăn AI viết test hợp thức hóa code sai (xem `rules/test-rules.md`).
- Ngưỡng coverage đo lường được biến "chất lượng" thành cổng CI khách quan, không phụ thuộc cảm nhận người review.

**Application**

- Test viết theo Gherkin/AC trong `tasks.md`; đặt ở `tests/unit/` và `tests/integration/`.
- Assert **MUST** kiểm tra hành vi nghiệp vụ (giá trị trả về, trạng thái, exception mong đợi), không chỉ "chạy không lỗi".
- Gate B9 quality gate đối chiếu danh sách test với danh sách AC: mỗi AC **MUST** ánh xạ tới ít nhất 1 test.

### Nguyên tắc 5 — Tài liệu và truy vết (Documentation & Traceability)

**Rule**

- Mọi **public API** **MUST** có Docstring/JSDoc; mọi thay đổi hành vi API **MUST** cập nhật `docs/api/` trong **cùng PR**.
- Comment **MUST** giải thích **"Tại sao" (Why)**; **MUST NOT** lặp lại "Cái gì" (What) mà code đã tự nói.
- Mọi PR **MUST** truy vết được tới **task/ticket** (không có PR "mồ côi").
- Mọi quyết định kiến trúc quan trọng **MUST** có ADR theo MADR trong `docs/adr/`.

**Rationale**

- AI agent đọc tài liệu làm ngữ cảnh; tài liệu lệch code tạo ra chuỗi quyết định sai ở các bước sau.
- Truy vết PR ↔ ticket ↔ AC là điều kiện để audit và để đo lead time (DORA).

**Application**

- PR template có mục bắt buộc: `Ticket`, `AC đã phủ`, `Test đã chạy`, `Ảnh hưởng tài liệu`.
- Đổi contract API mà không cập nhật docs → CI/docs-linter chặn.
- ADR đã ở trạng thái `Accepted` **MUST NOT** bị sửa nội dung; đổi ý thì tạo ADR mới ghi `Supersedes ADR-000X`.

### Nguyên tắc 6 — Quản trị AI Agent (AI Governance)

**Rule**

- Mọi AI agent **MUST** đọc `SKILL.md` và `tool-permissions.md` trước khi nhận task; hành động của agent **MUST** nằm trong phạm vi đã cho phép.
- **MUST NOT** đưa **dữ liệu khách hàng thật / PII / secret** vào prompt của bất kỳ AI tool nào (đối chiếu `data-classification.md`).
- **MUST NOT** sửa/xóa `SKILL.md`, `AGENTS.md`, `constitution.md`, hay file cấu hình agent **đang chạy**; mọi thay đổi **MUST** qua Pull Request + review người.
- Mọi nội dung chỉ dẫn do đối tác cung cấp (`skill.md`, system prompt, tài liệu hướng dẫn AI) **MUST** được Tech Lead đọc và kiểm duyệt toàn bộ trước khi nạp vào ngữ cảnh agent — **phòng chống prompt injection**.

**Rationale**

- File cấu hình agent là **vector prompt injection gián tiếp** đã được ghi nhận: chỉ dẫn ẩn có thể khiến agent gửi code/secret ra ngoài.
- AI không có "ranh giới tự nhiên" — ranh giới phải được viết ra, versioned, và kiểm tra được thì mới đáng tin.

**Application**

- Quy tắc "kiểm duyệt skill.md đối tác" áp dụng cho **MỌI file cấu hình agent**, kể cả file do nội bộ tạo.
- Agent **MUST** dừng và hỏi khi gặp mâu thuẫn spec ↔ code, hoặc gặp thuật ngữ không có trong `glossary.md` — **không tự suy đoán**.
- Danh mục AI tool được duyệt cho dự án ghi tại `ai-tool-scope.md` (kèm trạng thái Zero Data Retention).

### Nguyên tắc 7 — Kiểm soát thay đổi & khả năng đảo ngược (Change Control & Reversibility)

**Rule**

- Mọi thay đổi **MUST** đi qua **Pull Request**; **MUST NOT** commit trực tiếp lên `main`.
- Mọi thay đổi schema/dữ liệu **MUST** có migration **có đường lùi** (down migration hoặc kế hoạch rollback ghi trong PR).
- Migration DB **MUST NOT** do AI agent tự chạy (xem `tool-permissions.md`).
- Mỗi PR **MUST** ở mức **< 400 dòng** thay đổi thực tế, tính cả test.

**Rationale**

- Thay đổi nhỏ, đảo ngược được là điều kiện để deploy thường xuyên và rollback nhanh khi sự cố.
- Giới hạn kích thước PR tăng chất lượng review của cả người và AI, giảm tỷ lệ lỗi lọt.

**Application**

- Nhánh theo naming convention `<type>/<ticket-id>-<mô tả ngắn>` (xem `CODING_CONVENTION.md`).
- PR > 400 dòng **MUST** được chia nhỏ hoặc có lý do được Tech Lead chấp thuận ghi trong PR.
- Mọi thay đổi không tương thích ngược trên API **MUST** có ghi chú deprecation + version mới.

## Governance

### Ai được sửa

| Vai trò | Quyền với constitution.md |
|---|---|
| Tech Lead | **Người duyệt duy nhất** — bắt buộc approve mọi thay đổi |
| PM | Đồng ký tại Gate B2; đề xuất khi nguyên tắc ảnh hưởng phạm vi/tiến độ |
| Thành viên / BA / Dev | Được **đề xuất** qua Pull Request; không được tự sửa |
| AI Agent | **MUST NOT** sửa/xóa trực tiếp; chỉ được soạn bản nháp trong PR có người duyệt |

### Quy trình sửa đổi (Amendment Procedure)

- [ ] 1. Mở **Pull Request** sửa `constitution.md`, kèm **lý do và use case cụ thể** (không nêu cảm tính).
- [ ] 2. Nêu rõ **nguyên tắc nào** bị ảnh hưởng và **tác động** tới `plan-template.md`, `spec-template.md`, `tasks-template.md`, `SKILL.md`.
- [ ] 3. Tech Lead duyệt; nếu là thay đổi MAJOR thì thông báo cho toàn nhóm trước khi merge.
- [ ] 4. Cập nhật **Version** theo Semantic Versioning (bên dưới) và **Last Amended**.
- [ ] 5. **Đồng bộ xuống** các template phụ thuộc trong cùng PR (hoặc PR liên kết) — không để lệch.
- [ ] 6. Ghi **Sync Impact Report** (dạng comment HTML ở đầu file) khi tu chính: version cũ → mới, nguyên tắc đổi tên, mục thêm/bớt, TODO còn treo.

### Chính sách phiên bản (Versioning Policy — Semantic Versioning)

| Loại bump | Điều kiện |
|---|---|
| **MAJOR** | Loại bỏ hoặc định nghĩa lại nguyên tắc theo hướng **không tương thích ngược** |
| **MINOR** | Thêm nguyên tắc mới, hoặc mở rộng đáng kể hướng dẫn hiện có |
| **PATCH** | Làm rõ câu chữ, sửa typo, tinh chỉnh không đổi ngữ nghĩa |

Nếu loại bump còn mơ hồ → **MUST** nêu lập luận trước khi chốt, không tự chọn.

### Rà soát tuân thủ (Compliance Review)

- **Hằng quý:** rà soát xem nguyên tắc còn phù hợp; ghi biên bản rà soát.
- **Sau mỗi release lớn:** xác nhận không có vi phạm phát sinh; vi phạm phải có hành động khắc phục ghi lại.
- **Trước mỗi Gate:** người review đối chiếu PR với constitution; vi phạm chưa xử lý là điều kiện **chặn Gate**.
- CI kiểm tra tự động phần đo lường được: coverage, lint, secret scan, sự tồn tại của ADR khi vượt ngưỡng service, nhãn `security-review`.

## Checklist ký duyệt tại Gate B2 (Human Gate)

- [ ] Không còn placeholder `[ALL_CAPS]` chưa giải thích (trừ mục để trống có chủ ý và có lý do).
- [ ] Mỗi nguyên tắc có đủ **Rule / Rationale / Application**; Rule dùng MUST/SHOULD và đo lường được.
- [ ] Ngày ở định dạng ISO `YYYY-MM-DD`; Version nhất quán với Sync Impact Report.
- [ ] Các template phụ thuộc đã đồng bộ.
- [ ] Tech Lead + PM đã ký; tag `v0-constitution` sau khi commit vào `main`.

## Nguồn tham chiếu

- GitHub Spec Kit — lệnh `/speckit.constitution` (bản mẫu gốc): https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/constitution.md
- GitHub Spec Kit — Spec-Driven Development: https://github.com/github/spec-kit/blob/main/spec-driven.md
- Semantic Versioning 2.0.0: https://semver.org/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP ASVS (Application Security Verification Standard): https://owasp.org/www-project-application-security-verification-standard/
- ISO/IEC 25010 — mô hình chất lượng sản phẩm phần mềm: https://iso25000.com/index.php/en/iso-25000-standards/iso-25010
- Tài liệu gốc AI-SDLC v5.9 — B2 (dòng 230–378) và Phụ lục 3.1 (dòng 1612–1675)

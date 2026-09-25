---
title: CODING_CONVENTION.md — Quy chuẩn viết code
for: B2 bước 2 — Soạn cùng constitution.md (Tech Lead + AI); áp dụng mọi giai đoạn từ B6 trở đi
owner: Tech Lead
nguồn: AI-SDLC v5.9 — Phụ lục 3.2 (dòng 1677–1762); style guide chính thức của ngôn ngữ (PEP 8/Black, Google Java Style, Airbnb cho JS/TS) + OWASP ASVS
---

# CODING_CONVENTION.md — Quy chuẩn viết code

> **Cách dựng (theo tài liệu gốc):** Tech Lead soạn dựa trên **stack đã chọn ở B1**, lấy **style guide chính thức của ngôn ngữ làm nền** (PEP 8/Black cho Python, Google Java Style, Airbnb cho JS/TS…) — **không viết lại từ đầu**, chỉ liệt kê phần **khác biệt hoặc siết chặt hơn** so với chuẩn gốc.

## 1. Phạm vi áp dụng

| Hạng mục | Nội dung |
|---|---|
| Áp dụng cho | Toàn bộ mã nguồn trong repo dự án, mọi ngôn ngữ đã chốt ở B1 |
| Đối tượng tuân thủ | Dev, mọi AI agent sinh code, người review |
| Quan hệ với chuẩn gốc | Chuẩn ngôn ngữ là nền; file này chỉ ghi **phần siết chặt / khác biệt** |
| Cơ chế thực thi | Formatter + Linter chạy ở pre-commit và CI; **CI chặn merge nếu lint fail** |
| Ngoại lệ | Chỉ khi có ADR hoặc lý do được Tech Lead chấp thuận, ghi trong PR |
| Liên quan | `constitution.md` (Nguyên tắc 1, 5, 7), `rules/api-rules.md`, `rules/test-rules.md` |

## 2. Naming convention

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Class / Interface | `PascalCase`, danh từ | `UserRepository`, `IPaymentGateway` |
| Function / Method | `camelCase`, động từ + danh từ | `calculateInvoiceTotal()`, `validateUserInput()` |
| Biến | `camelCase` | `retryCount`, `orderTotal` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS` |
| File / Folder | `kebab-case` | `user-profile.service.ts`, `order-management/` |
| DB table / column | `snake_case`, **số nhiều cho table** | `user_accounts`, `created_at` |
| Nhánh Git | `<type>/<ticket-id>-<mô tả ngắn>` | `feature/PROJ-123-add-payment` |
| Biến môi trường | `UPPER_SNAKE_CASE`, prefix theo service | `PAYMENT_SERVICE_DB_URL` |

**Ghi chú siết chặt so với chuẩn gốc:**

- [ ] Tên biến **MUST** mang nghĩa nghiệp vụ, không viết tắt tùy tiện (`usr`, `tmp2`) — trừ chỉ số vòng lặp `i`, `j`.
- [ ] Boolean **MUST** bắt đầu bằng `is`/`has`/`can`/`should` (`isActive`, `hasPaid`).
- [ ] Tên **MUST** dùng thuật ngữ đúng trong `glossary.md` — không tự đặt từ đồng nghĩa.

## 3. Formatting & Linting — công cụ bắt buộc theo ngôn ngữ

| Ngôn ngữ | Formatter | Linter | Config file | Phiên bản ghim |
|---|---|---|---|---|
| Python | Black | Ruff | `pyproject.toml` `[tool.ruff]` | `[VD: black==24.x]` |
| TypeScript / JS | Prettier | ESLint | `.eslintrc.json`, `.prettierrc` | `[Ghim theo lockfile]` |
| Java | google-java-format | Checkstyle | `checkstyle.xml` | `[Ghim theo build]` |
| Go | gofmt | golangci-lint | `.golangci.yml` | `[Ghim theo go.mod]` |

**Quy tắc:**

- [ ] Indentation theo **mặc định của formatter** (2 hoặc 4 space) — **không tùy chỉnh tay**, không tranh luận style trong review.
- [ ] **CI chặn merge nếu lint fail** (tham chiếu B10 — AI review tầng 1).
- [ ] Không tắt rule linter inline (`eslint-disable`, `# noqa`) mà không ghi lý do ngay cạnh.
- [ ] Không format lại file không liên quan trong cùng PR (làm loãng diff).
- [ ] Độ dài dòng theo config formatter; giới hạn mềm để review trên màn hình dễ đọc.

## 4. Cấu trúc thư mục chuẩn

```text
src/
├── controllers/     # nhận request, gọi service, KHÔNG chứa business logic
├── services/        # business logic
├── repositories/    # truy cập dữ liệu
├── models/          # entity/schema
├── dto/             # request/response object
├── middlewares/
├── utils/
└── config/
tests/
├── unit/
└── integration/
```

**Quy tắc ranh giới (đo lường được):**

- [ ] `controllers/` **MUST NOT** chứa business logic — chỉ map request → gọi `services/`.
- [ ] `services/` **MUST NOT** truy cập DB trực tiếp — đi qua `repositories/`.
- [ ] `repositories/` **MUST NOT** chứa quy tắc nghiệp vụ.
- [ ] Import chéo tầng ngược chiều (`services` → `controllers`) **MUST** bị chặn ở review hoặc bằng lint rule.
- [ ] `utils/` **MUST** là hàm thuần túy, không phụ thuộc state toàn cục.

## 5. Error handling

| Quy tắc | Mức | Ghi chú |
|---|---|---|
| Không bao giờ để **empty catch block** | MUST NOT | Log hoặc ném lại; cấm `catch (e) {}` |
| Custom exception class theo domain, kế thừa **1 base `AppError`** chung | MUST | `PaymentDeclinedError extends AppError` |
| Error response format **thống nhất toàn API** | MUST | Tham chiếu `rules/api-rules.md` |
| Fail-Fast tại biên hệ thống | MUST | Validate sớm, không để lỗi lan vào tầng sâu |
| Không lộ chi tiết nội bộ (stack trace, câu SQL) ra response | MUST NOT | Đối chiếu OWASP Top 10 — A05/A09 |
| Không log secret/PII trong message lỗi | MUST NOT | Đối chiếu `data-classification.md` |

**Mẫu mã lỗi thống nhất (placeholder — chốt theo dự án):**

```json
{
  "error": { "code": "[ERROR_CODE]", "message": "[Thông điệp an toàn cho người dùng]",
  "correlation_id": "[uuid]", "details": [] }
}
```

## 6. Documentation

- [ ] Mọi **public API** bắt buộc **Docstring/JSDoc** — mô tả tham số, giá trị trả về, lỗi có thể ném.
- [ ] Comment tập trung vào **"Tại sao" (Why)**, **không lặp lại "Cái gì" (What)** mà code đã tự nói.
- [ ] Thay đổi hành vi API **MUST** cập nhật `docs/api/` trong **cùng PR**.
- [ ] Comment lỗi thời **MUST** bị xóa khi sửa code liên quan, không để lại mô tả sai.

```typescript
/**
 * Tính tổng giá trị đơn hàng bao gồm thuế và phí ship.
 * @param order - Đơn hàng cần tính
 * @returns Tổng giá trị đã bao gồm thuế/phí
 */
function calculateOrderTotal(order: Order): number { /* ... */ }
```

## 7. Git & Commit

| Hạng mục | Quy tắc |
|---|---|
| Nhánh | `<type>/<ticket-id>-<mô tả ngắn>`; **không commit trực tiếp lên `main`** |
| Commit message | **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` |
| Kích thước PR | Mục tiêu **< 400 dòng** thay đổi thực tế (tính cả test) |
| Nội dung PR | Bắt buộc: ticket, AC đã phủ, test đã chạy, ảnh hưởng tài liệu |
| Rebase/merge | Không force-push lên nhánh chung; không viết lại lịch sử nhánh `main` |
| File sinh tự động | Không commit build artifact, `.env`, secret — CI secret scan chặn |

## 8. Ranh giới khi AI agent sinh code

- [ ] Chỉ sinh code trong **phạm vi 1 task** trong `tasks.md`; không tự mở rộng scope.
- [ ] Tuân thủ cấu trúc thư mục ở mục 4 — không tự tạo tầng/file mới ngoài chuẩn.
- [ ] Không thêm **dependency mới** mà không nêu lý do trong PR; quét license trước khi merge.
- [ ] Không xóa test đang có; không "sửa test cho pass" khi hành vi đang sai.
- [ ] Nếu convention trong repo **khác** file này (codebase có sẵn của đối tác) → **theo code hiện có của đối tác** cho phần style/convention; phần bảo mật/pháp lý vẫn theo chuẩn công ty (xem `SKILL.md` mục 7).

## 9. Checklist trước khi mở PR

- [ ] Formatter + Linter chạy sạch, không tắt rule vô cớ.
- [ ] Unit test cho AC mới đã có; coverage không giảm dưới ngưỡng.
- [ ] Không còn `TODO` không có ticket, không còn `console.log`/`print()` debug.
- [ ] Không hardcode secret; không log PII.
- [ ] Docstring/JSDoc cho API mới/sửa; docs đã cập nhật.
- [ ] PR < 400 dòng hoặc có lý do được chấp thuận; commit theo Conventional Commits; đã gắn ticket.

## Nguồn tham chiếu

- PEP 8 — Style Guide for Python Code: https://peps.python.org/pep-0008/
- Black — The uncompromising Python code formatter: https://black.readthedocs.io/
- Ruff — linter Python: https://docs.astral.sh/ruff/
- Prettier: https://prettier.io/docs/en/index.html
- ESLint: https://eslint.org/docs/latest/
- Airbnb JavaScript Style Guide: https://github.com/airbnb/javascript
- Google Java Style Guide: https://google.github.io/styleguide/javaguide.html
- Checkstyle: https://checkstyle.org/
- gofmt / Go style: https://go.dev/blog/gofmt
- golangci-lint: https://golangci-lint.run/
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
- Tài liệu gốc AI-SDLC v5.9 — Phụ lục 3.2 (dòng 1677–1762)

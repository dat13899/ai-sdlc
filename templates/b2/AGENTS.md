---
title: AGENTS.md — Chuẩn chỉ dẫn liên công cụ
for: B2 — tạo cùng SKILL.md; dùng chung nhiều AI tool (Claude Code, Codex, Cursor, Copilot...)
owner: Tech Lead (A/R)
nguồn: AGENTS.md (agents.md); AI-SDLC v5.9 mục 7
---

# AGENTS.md

> Chuẩn mở để khai báo chỉ dẫn cho AI agent — dùng chung cho nhiều công cụ đọc cùng một file, thay vì mỗi tool một định dạng riêng.
>
> **Quan hệ với các file khác:** `AGENTS.md` nói **cách vận hành tool** (build/test/lệnh); `SKILL.md` nói **AI là ai và được làm gì**; `constitution.md` nói **quy tắc bất biến của dự án**. Cả ba đều phải có.

## 1. Mục đích

Một file duy nhất mà mọi AI coding tool đọc được, để không phải cấu hình lại từng tool khi đổi công cụ hoặc thêm thành viên mới.

## 2. Phạm vi áp dụng

| Phạm vi | File | Ghi chú |
|---|---|---|
| Toàn repo | `AGENTS.md` ở thư mục gốc | File này |
| Từng thư mục con | `AGENTS.md` trong thư mục con | Ghi đè/chỉ thị thêm cho phạm vi đó |
| Riêng một tool | `.cursorrules`, `.github/copilot-instructions.md` | Chỉ dùng khi tool đó không hỗ trợ `AGENTS.md` |

**Nguyên tắc:** không lặp lại nội dung đã có ở file cấp trên — file con chỉ ghi **khác biệt**.

## 3. Khai báo lệnh build / test (phần quan trọng nhất)

```markdown
## Lệnh

| Việc | Lệnh | Ghi chú |
|---|---|---|
| Cài phụ thuộc | `npm ci` | Dùng `ci` không dùng `install` khi CI chạy |
| Chạy dev | `npm run dev` | Port [3000] |
| Build | `npm run build` | |
| Test toàn bộ | `npm test` | |
| Test 1 file | `npm test -- <đường-dẫn-file>` | |
| Test 1 ca | `npm test -- -t "<tên ca>"` | |
| Lint | `npm run lint` | |
| Fix lint | `npm run lint:fix` | |
| Type check | `npx tsc --noEmit` | |
| Kiểm bảo mật | `npm run audit` | |
```

**Quy tắc:** mọi lệnh trong bảng này **phải chạy được thật** — AI sẽ tin và chạy theo. Lệnh sai làm agent lặp vô hạn.

| Hạng mục | Nội dung |
|---|---|
| Ngôn ngữ / phiên bản | [VD: Node 22, TypeScript 5.6] |
| Trình quản lý gói | [npm / pnpm / yarn / poetry] |
| Biến môi trường cần thiết | [Liệt kê tên biến, **không ghi giá trị**] |
| Dữ liệu test | [Cách tạo seed data; không dùng dữ liệu Production] |

## 4. Quy tắc cho AI agent

### Được làm tự động

- Đọc bất kỳ file nào trong repo
- Chạy test, lint, build ở môi trường local
- Tạo/sửa file trong phạm vi nhiệm vụ
- Tạo nhánh + commit + push nhánh của mình + mở PR

### Phải hỏi trước

- Cài thêm package/thư viện mới
- Xoá file không phải do mình tạo
- Sửa file ở thư mục cấu hình hạ tầng/CI
- Đổi schema CSDL, chạy migration
- Đổi public API contract

### Cấm

- Merge vào `main` / `develop`
- Đọc, ghi, in ra secret / `.env` / khoá API
- Deploy lên STAGING hoặc PRODUCTION
- Tắt hoặc bỏ qua test để CI xanh
- Gọi API bên ngoài không có trong `ai-tool-scope.md`
- Bịa số liệu, kết quả test, link tài liệu

## 5. Ranh giới (không được vượt)

| Ranh giới | Nội dung |
|---|---|
| Phạm vi thay đổi | Chỉ sửa file liên quan nhiệm vụ — không "dọn dẹp" file khác trong cùng PR |
| Kích thước PR | Một PR một mục đích; PR > 400 dòng thay đổi nên tách |
| Thư mục cấm chạm | [VD: `infra/`, `.github/workflows/`, `secrets/`] — phải có người duyệt |
| File do người khác tạo | Không tự sửa nếu không thuộc nhiệm vụ |
| Comment/lint | Không tắt cảnh báo lint chỉ để code chạy qua |

## 6. Định dạng commit & PR

**Commit** — theo Conventional Commits:

```text
<type>[scope]: <mô tả ngắn>

[phần thân nếu cần]

AI-assisted: yes | Người kiểm: [Tên]
```

**Pull Request** phải ghi:

- Làm gì, vì sao
- Test nào đã chạy + kết quả thật
- Chỗ nào AI chưa chắc
- Ảnh chụp nếu có thay đổi giao diện

## 7. Ví dụ mẫu hoàn chỉnh

```markdown
# AGENTS.md

## Tổng quan dự án
Ứng dụng quản lý đơn hàng — Node 22 + TypeScript + PostgreSQL.

## Lệnh
| Việc | Lệnh |
|---|---|
| Cài phụ thuộc | `npm ci` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Test | `npm test` |
| Test 1 file | `npm test -- src/orders/order.service.test.ts` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |

## Quy tắc
- Không commit thẳng vào `main`
- Mọi hàm public phải có test
- Không đưa `process.env` ra log
- Migration DB: chỉ tạo file, KHÔNG tự chạy

## Cấm
- Sửa `.github/workflows/**`
- Đọc `.env`
- Deploy
```

## 8. Checklist dựng AGENTS.md

- [ ] File nằm ở thư mục gốc repo
- [ ] Mọi lệnh trong bảng đã **chạy thử và chạy được thật**
- [ ] Có ghi phiên bản ngôn ngữ/runtime
- [ ] Có danh sách biến môi trường cần thiết (tên, không giá trị)
- [ ] Có phân biệt rõ: tự động / phải hỏi / cấm
- [ ] Có liệt kê thư mục cấm chạm
- [ ] Có quy định commit + PR
- [ ] Không chứa **bất kỳ** secret, token, mật khẩu nào
- [ ] Thư mục con có `AGENTS.md` riêng chỉ ghi phần khác biệt
- [ ] Đã commit trước commit code tính năng đầu tiên

## Nguồn tham chiếu

- AGENTS.md — chuẩn mở cho chỉ dẫn AI agent — https://agents.md/
- AI-SDLC v5.9, mục 7 — tài liệu gốc nội bộ
- Anthropic — CLAUDE.md / best practices — https://www.anthropic.com/engineering/claude-code-best-practices
- Conventional Commits — https://www.conventionalcommits.org/

---
title: Linter cho OpenAPI Spec — rules/api-rules.md
for: B6 bước 2 (AI tự kiểm OpenAPI) trước khi Tech Lead review
owner: AI (tự kiểm) · Tech Lead (A/R) · Dev (R)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.12; OpenAPI Specification 3.x (OpenAPI Initiative)
---

# rules/api-rules.md — Checklist AI tự kiểm OpenAPI Spec

## Mục đích

API spec là **hợp đồng giữa các bên** — backend, frontend, mobile, đối tác. Spec sai hoặc mơ hồ ở B6 sẽ thành lỗi tích hợp ở B12 (SIT) và bug trên Production. Linter này bắt lỗi trước khi spec thành code.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B6 bước 1 — AI đề xuất API spec | AI | `spec.md` + ADR đã duyệt |
| B6 bước 2 — tự kiểm | AI | OpenAPI 3.x đã sinh |
| B6 bước 3 — Tech Lead review | Tech Lead | OpenAPI + ADR + `constitution.md` |
| B9/B10 — khi implement | Dev + AI | OpenAPI vs code thực tế |
| B12 — SIT | Tester | OpenAPI vs hành vi thật của API |

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Vì sao chặn |
|---|---|---|
| C1 | **Mọi** endpoint phải có ví dụ request **và** response thực tế | Không có ví dụ = client phải đoán format |
| C2 | Error model thống nhất toàn bộ API (cùng cấu trúc body lỗi, cùng cách đánh mã) | Mỗi endpoint một kiểu lỗi → client không xử lý chung được |
| C3 | Không lộ thông tin nội bộ trong lỗi (stack trace, tên bảng, câu SQL, tên server nội bộ) | Rò rỉ thông tin hệ thống = rủi ro ATTT (OWASP A05/A09) |
| C4 | Mọi endpoint phải khai báo **security scheme** (trừ endpoint công khai có ghi chú rõ) | Quên auth = lỗ hổng phân quyền |
| C5 | Thay đổi phá vỡ tương thích (breaking change) phải tăng version hoặc ghi rõ kế hoạch chuyển đổi | Client cũ vỡ im lặng khi deploy |
| C6 | Mọi tham số phải có kiểu dữ liệu, ràng buộc (min/max/pattern/enum) và bắt buộc/tuỳ chọn | Không ràng buộc → validate ở đâu cũng được → lỗi dữ liệu |

## Checklist tự kiểm

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | OpenAPI version khai báo đúng (3.0.x / 3.1.x) và validate được bằng linter? | | |
| 2 | Có đủ `info` (title, version, description) và `servers` cho từng môi trường? | | |
| 3 | Tên resource dùng **danh từ số nhiều** (`/orders`, không phải `/getOrder`)? | | |
| 4 | Động từ HTTP dùng đúng ngữ nghĩa (GET không gây side-effect; PUT idempotent; PATCH cập nhật một phần)? | | |
| 5 | Có endpoint nào lộ động từ trong đường dẫn (`/createUser`, `/deleteOrder`)? | | |
| 6 | Versioning đã khai báo (`/v1/...` hoặc header) và có quy tắc khi nào tăng version? | | |
| 7 | Mỗi endpoint có `summary` và `description` nói rõ làm gì? | | |
| 8 | Mọi tham số có `schema` kèm type + ràng buộc (min/max/pattern/enum/maxLength)? | | |
| 9 | Tham số phân trang (limit/offset hoặc cursor) có giới hạn trên (`maximum`)? | | |
| 10 | Mọi endpoint có `example` hoặc `examples` cho request và response? | | |
| 11 | Error model có dạng thống nhất (ví dụ `{code, message, details, traceId}`)? | | |
| 12 | Mã lỗi HTTP dùng đúng (400 vs 401 vs 403 vs 404 vs 409 vs 422 vs 429 vs 500)? | | |
| 13 | Response lỗi có lộ stack trace / tên bảng / câu SQL / hostname nội bộ? | | |
| 14 | Mọi endpoint (trừ công khai) đã khai báo `security`? | | |
| 15 | Có quy định idempotency cho endpoint tạo mới (idempotency key) nếu client có thể retry? | | |
| 16 | Có rate limiting / 429 được khai báo cho endpoint nặng? | | |
| 17 | Kiểu dữ liệu thời gian, tiền tệ, ID đã chuẩn hoá (ISO 8601 UTC; tiền theo đơn vị nhỏ nhất + currency)? | | |
| 18 | Nullable vs optional đã phân biệt rõ? | | |
| 19 | Enum đã liệt kê hết giá trị và có ghi chú khi mở rộng? | | |
| 20 | Breaking change nào đã xảy ra so với version trước? Đã xử lý theo C5? | | |
| 21 | Tên field dùng nhất quán 1 kiểu (camelCase hoặc snake_case — chọn một)? | | |
| 22 | Có endpoint nào trùng chức năng với endpoint khác? | | |
| 23 | Spec đã được validate bằng công cụ (Spectral / swagger-cli / openapi-generator validate)? | | |

**Ngưỡng đạt:** C1–C6 = Đạt, câu 23 = Đạt, và số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**Đặt tên endpoint — SAI:** `POST /getUserById`, `GET /order/delete`
**ĐÚNG:** `GET /users/{id}`, `DELETE /orders/{id}`

**Lỗi lộ thông tin — SAI:**
```json
{ "error": "SQLSTATE[42P01]: relation \"customers_v2\" does not exist at 10.0.3.14" }
```
Lộ tên bảng, hệ quản trị CSDL, IP nội bộ.

**ĐÚNG:**
```json
{ "code": "RESOURCE_NOT_FOUND", "message": "Không tìm thấy khách hàng.", "traceId": "7f3a9c21" }
```
Chi tiết kỹ thuật ghi vào log nội bộ theo `traceId`.

**Tham số thiếu ràng buộc — SAI:**
```yaml
- name: limit
  in: query
  schema: { type: integer }
```
Client gửi `limit=999999` → sập DB.

**ĐÚNG:**
```yaml
- name: limit
  in: query
  schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
```

**Thiếu security — SAI:** endpoint xoá đơn hàng không có khối `security`.
**ĐÚNG:**
```yaml
security:
  - bearerAuth: []
```

## Khi nào tự động CHẶN (block)

Không được commit spec / không được trình Gate 2 nếu:

- [ ] Có endpoint không có ví dụ request/response (C1)
- [ ] Error model không thống nhất giữa các endpoint (C2)
- [ ] Response lỗi lộ stack trace / tên bảng / SQL / host nội bộ (C3)
- [ ] Có endpoint (không công khai) không khai báo security (C4)
- [ ] Có breaking change mà không tăng version và không có kế hoạch chuyển đổi (C5)
- [ ] Có tham số/field không có kiểu dữ liệu xác định (C6)
- [ ] Spec không validate được bằng công cụ (câu 23)

## Gợi ý công cụ kiểm tự động

| Công cụ | Kiểm gì |
|---|---|
| Spectral (Stoplight) | Quy tắc style + custom ruleset cho naming, ví dụ, mô tả |
| `swagger-cli validate` / `redocly lint` | Cú pháp OpenAPI hợp lệ |
| `openapi-generator validate` | Spec có sinh được client/server không |
| `dredd` / Schemathesis | So khớp spec với hành vi thật của API (chạy ở B12) |

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.12 — tài liệu gốc nội bộ
- OpenAPI Specification 3.x, OpenAPI Initiative — https://spec.openapis.org/
- OpenAPI Specification 3.1.0 — https://spec.openapis.org/oas/v3.1.0
- Microsoft REST API Guidelines — https://github.com/microsoft/api-guidelines
- Google API Design Guide — https://cloud.google.com/apis/design
- OWASP API Security Top 10 — https://owasp.org/API-Security/

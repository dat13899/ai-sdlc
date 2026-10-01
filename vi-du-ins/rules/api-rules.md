---
title: Linter cho OpenAPI Spec — rules/api-rules.md (ví dụ INS Platform)
for: B6 bước 2 (AI tự kiểm OpenAPI) trước khi Tech Lead review
owner: AI (tự kiểm) · Tech Lead (A/R) · Dev (R)
nguồn: templates/rules/api-rules.md; Architecture.md §2.3, §2.6; RULES.md §B, §D; LESSONS.md §1, §4; TSD purchase-service 06_data-and-api-design.md
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/rules/api-rules.md

# rules/api-rules.md — Checklist AI tự kiểm OpenAPI Spec (INS Platform)

## Mục đích

INS Platform là nền tảng bảo hiểm gồm 15 microservice Java 21 + Spring Boot 3.5, sau API Gateway (KGateway), phục vụ 3 nhóm client: miniapp khách hàng (Angular 20, nhúng trong Ví X), CMS quản trị (Angular 20), và M2M nội bộ / đối tác bảo hiểm (NCC). Spec sai ở B6 đã từng thành lỗi **im lặng** trên môi trường thật: API trả 200, log sạch, chỉ dữ liệu sai (LESSONS §4). File này ghi lại quy ước API **đang chạy thật** và các chỗ spec ≠ code đã phát hiện, để AI kiểm spec mới theo đúng hiện trạng chứ không theo tài liệu cũ.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B6 bước 1 — AI đề xuất API spec | AI | SRS chức năng + TSD `06_data-and-api-design.md` của service |
| B6 bước 2 — tự kiểm | AI | OpenAPI 3 fragment trong TSD §7 (hiện viết tay trong markdown) |
| B6 bước 3 — Tech Lead review | Tech Lead | OpenAPI + ADR + `Architecture.md` + `RULES.md` |
| B9/B10 — khi implement | Dev + AI | OpenAPI vs controller thực tế (**grep cả path tuyệt đối** — xem mục "Đường dẫn") |
| B12 — SIT | Tester | OpenAPI vs hành vi thật qua gateway |

## Quy ước API đang áp dụng (nguồn sự thật)

### Đường dẫn & phân vùng

| Vùng | Mẫu path | Auth |
|---|---|---|
| Public (khách + CMS) | `/ins/{service}/public/v1/...` | JWT realm `customer` (khách) hoặc role `platform-admin` / `insurer-admin` (CMS) |
| Private (M2M nội bộ) | `/ins/{service}/private/v1/...` | JWT realm `internal` (client_credentials) + scope `SCOPE_{service}:read` / `SCOPE_{service}:write` |
| Partner (NCC gọi vào) | `/api/partner/...` (route riêng tới `ins-insurer-adaptor`) | API Key + HMAC-SHA256 (Architecture §2.4) |
| Health | `/actuator/health/**`, `/actuator/info` | permitAll |

- `Architecture.md` §2.3 và `RULES.md` G10 ghi `/api/v1/{resource}` — **đã lệch** so với code; path legacy `/api/v1/` ở controller nội bộ của insurer-adaptor là 1 trong "3 bug ảnh hưởng production" phải đổi sang `/ins/insurer-adaptor/private/v1/...` (Deployment Checklist §11.5). Spec mới theo bảng trên.
- Tenant lấy từ JWT, fallback header `X-Tenant-Id`. Lệch nhau → `403 TENANT_MISMATCH`.
- Danh tính khách **lấy từ JWT** (chống IDOR), không nhận `customerId` từ body/path. Lưu ý: JWT `sub` = `keycloak_user_id`, **khác** `customers.id` (LESSONS §7.4).
- Một controller khai path tuyệt đối trên từng method (không có `@RequestMapping` cấp lớp) → grep theo base path **bỏ sót** 13 endpoint. Khi đối chiếu spec vs code, grep cả chuỗi path đầy đủ.

### Response envelope

| Loại | Shape thực tế |
|---|---|
| Thành công | `ApiResponse.of(payload)` (`platform-libs:spring-web`) → `{ "data": {...}, "meta": { "traceId": "..." } }`; `ResponseEntity` + đúng status (`201 Created`, `200 OK`) |
| Lỗi (code đang chạy) | `{ "success": false, "errorCode": "...", "message": "...", "timestamp": "..." }` do error handler dùng chung của `ins-common` + handler riêng từng service dựng |
| Lỗi liên quan đơn hàng | như trên, **kèm `data.order_id`** để FE retry không đẻ đơn trùng |
| Lỗi (TSD mô tả) | `application/problem+json` RFC 7807 `{type,title,status,detail,instance,code,traceId,errors}` — **không phải hiện trạng**, TSD purchase §7.7 tự ghi chú đã lệch |

Message lỗi externalize ra `messages.properties` / `error-default-messages.properties` ở module adapter, đánh mã chuẩn hoá `INS00xxx` — đây là nguồn FE map i18n (`errors.order.<CODE>`). Message thô của NCC **không** được đi thẳng ra client.

### Exception → HTTP status

| Nguồn lỗi | HTTP | Mã ví dụ (purchase-service) |
|---|---|---|
| Bean validation (`@Valid @RequestBody`) | 400 | danh sách field lỗi |
| JWT thiếu / hết hạn / sai chữ ký / sai audience | 401 | `INTERNAL_EVENT_INVALID_SIGNATURE` (M2M) |
| Thiếu `public-paths` cho endpoint ẩn danh | 401 | — (xem mục CSRF) |
| Sai tenant / không sở hữu tài nguyên | 403 | `TENANT_MISMATCH`, `ORDER_NOT_OWNED`, `CART_NOT_OWNED` |
| `ResourceNotFoundException` | 404 | `ORDER_NOT_FOUND`, `CART_NOT_FOUND` |
| Trùng / xung đột trạng thái / idempotency | 409 | `CART_ITEM_DUPLICATE`, `IDEMPOTENCY_KEY_REUSED_DIFFERENT_PAYLOAD` |
| `BusinessRuleViolationException` | 422 | `ORDER_CANCEL_NOT_ALLOWED_FOR_STATUS`, `CART_EXPIRED`, `QUOTE_AMOUNT_MISMATCH` |
| Vượt số lần thử | 429 | `ORDER_PAYMENT_RETRY_EXHAUSTED` (đã retry thanh toán 3 lần) |
| Service phía sau lỗi / hết retry | 503 | `PAYMENT_INIT_FAILED`, `QUOTE_FAILED`, `VOUCHER_LOCK_FAILED` |
| Cổng thanh toán timeout | 504 | `PAYMENT_GATEWAY_TIMEOUT` |

**Bẫy đã dính (LESSONS §4.2):** `GlobalExceptionHandler` **không** `extends ResponseEntityExceptionHandler` nhưng có `@ExceptionHandler(Exception.class)` → nuốt luôn lỗi validation, trả **500 thay vì 400**. Spec khai 400 mà code trả 500 → client xử lý sai nhánh. Controller không tự `throw` (RULES J18), không `catch (Exception)` chung ngoài ranh giới hệ thống (RULES SC2).

### Naming JSON — snake_case vs camelCase

**Đã dính 3 lần, cả 3 lần đều im lặng** (LESSONS §4.1): khoá lệch kiểu chữ không ném lỗi, field nhiều từ chỉ lặng lẽ `null`. Hiện trạng codebase đang **trộn** nhiều quy ước:

| Chỗ | Quy ước thực tế |
|---|---|
| Response DTO REST (purchase) | camelCase (`cartId`, `totalDraftAmount`, `expiresAt`) |
| Query param CMS (purchase) | snake_case, single-value (`cycle_code`, `insurer_id`, `from_date`) |
| Một số body CMS | snake_case (`{transaction_id, payment_date, effective_date}`) |
| Body lỗi đơn hàng | `data.order_id` (snake_case) trong envelope camelCase (`errorCode`) |
| Kafka envelope (outbox) | snake_case 11 khoá (`event_id, event_type, version, occurred_at, tenant_id, source_service, correlation_id, causation_id, actor_id, traceparent, payload`); record Java camelCase, đổi bằng `PropertyNamingStrategy.SNAKE_CASE` của ObjectMapper |
| Endpoint SMS hậu kiểm | nhận **cả hai** kiểu khoá qua `@JsonAlias` (vá tạm, không phải chuẩn) |
| API NCC | giữ nguyên tên field theo `@JsonProperty` của từng NCC — **không đổi** |
| TSD promotion-service | yêu cầu response snake_case, code đang camelCase (gap analysis L-1) |

**Quy tắc cho spec mới:** mỗi service khai rõ 1 quy ước cho body REST trong TSD §7 và giữ đúng nó; field nhiều từ `null` bất thường → **nghi naming strategy TRƯỚC**, đừng đi tìm chỗ khác.

### CSRF & public-paths

- Mặc định dùng JWT → không cần CSRF token cho API có Bearer (RULES S5).
- Endpoint ẩn danh phải khai `ins.security.public-paths`. **POST ẩn danh phải khai THÊM `csrfIgnoredPaths`** — `public-paths` không miễn CSRF. Thiếu một dòng thì âm thầm gãy register / forgot-password / SSO đối tác (LESSONS §4.6).
- Chẩn đoán nhanh: **403 trong ~1ms = CSRF chặn**; **401 = thiếu public-paths** (ví dụ thật: `/ins/cms/public/v1/banners/**` trả 401 vì matcher thiếu).
- Ngoại lệ Sonar duy nhất được duyệt: `S4502` (CSRF) ở endpoint đối tác, kèm comment giải thích (RULES SO2).

### Idempotency

- Header `Idempotency-Key` (tối đa 100 ký tự, client sinh UUID v7), filter `IdempotencyKeyFilter`, lưu Valkey TTL **48h**.
- Bắt buộc với POST/PUT/PATCH/DELETE thuộc các prefix nghiệp vụ ghi (purchase: `carts/`, `checkouts`, `customers/me/orders/`, `cms/orders/`, `private/v1/purchase/`).
- Cùng key + cùng body hash → trả response đã cache; khác body hash → **409 `IDEMPOTENCY_KEY_REUSED_DIFFERENT_PAYLOAD`**.
- DB chặn trùng thêm tầng nữa: `UNIQUE (tenant_id, idempotency_key)` trên bảng đơn hàng.
- Miễn trừ phải ghi rõ trong spec. Ví dụ: callback kết quả cấp hợp đồng (`POST .../events/policy-result`) **miễn** vì dedupe theo nghiệp vụ (poll ⟷ callback first-wins).
- Gọi sang service có filter mà quên header → **400 bị catch nuốt**: SMS hậu kiểm thiếu `Idempotency-Key` bị notification-service trả 400 `INS00748`, SMS im lặng không tới khách, endpoint gốc vẫn 200 (LESSONS §4.3).
- Consumer Kafka dedupe bằng `IdempotencyStore` trên Valkey (`SET NX` + TTL); TTL dedupe **phải ≥ thời gian workflow còn sống**.
- Thứ tự trong facade/use case: nạp entity → **TẤT CẢ guard (trạng thái, tenant, quyền, idempotency)** → gọi ngoài → ghi DB (LESSONS §1). `@Transactional` không gỡ được REST/Kafka/SMS đã bắn.

### Kiểu dữ liệu chuẩn

| Loại | Quy ước |
|---|---|
| ID | UUID v7 (`UuidValueGenerator`), JSON `string format: uuid`; DB `BINARY(16)` |
| Tiền | VND đồng, `Long` / `integer int64` — **cấm** `BigDecimal`, `Double` |
| Thời gian | ISO 8601 có offset **`+07:00`** (không phải UTC), ví dụ `2026-05-19T17:30:00+07:00`, qua `DTime` |
| Ngày trên FE | lưu ISO, chỉ format `dd/MM/yyyy` khi hiển thị — đã từng gửi sai ngày sinh sang NCC vì trộn hai định dạng (LESSONS §9) |
| Enum trạng thái | nhãn hiển thị do BE quyết (`statusLabel` đọc bảng `order_statuses`), FE không tự map |

### Tích hợp đối tác ngoài

| Chủ đề | Quy ước thực tế |
|---|---|
| Kênh | Mọi NCC đi qua `ins-insurer-adaptor`; schema nền tảng bất biến, adaptor hấp thụ khác biệt NCC. Domain không chứa DTO của NCC — DTO chỉ ở `adapter/outbound/{ncc}`, map bằng MapStruct |
| Resilience | Resilience4j circuit breaker + retry 3× exponential backoff, timeout mặc định 10s (Architecture §2.6) |
| Timeout theo chặng | Timeout phía gọi **phải lớn hơn** tổng timeout chặng sau. Lệnh tạo hợp đồng: purchase → adaptor **45s** > adaptor → NCC (connect 3s + read 30s). Bản cũ 15s làm purchase bỏ cuộc trước, ghi `POLICY_REQUEST_FAILED` trong khi NCC **đã cấp** hợp đồng thật |
| Timeout gateway | Theo route: 5s (product, promotion, transaction-management), 10s (policy, cms), 12s (insurer-adaptor), 15s (purchase, payment, insurer-partner), 30s (identity) |
| CB cho enrichment không critical | fast-fail (ví dụ identity: window 20 / min 8 / slow-call 1s / open 30s) để service chậm không kéo cạn thread của luồng chính |
| Poll dự phòng | Trạng thái thanh toán poll kiểu best-effort → trả `UNKNOWN`, **không ném** |
| Callback NCC → nền tảng | **Verify chữ ký trước** khi apply; kết quả đi qua Transactional Outbox; kết hợp poll theo kiểu first-wins trong Temporal saga (NCC trả `PENDING` rồi callback sau) |
| Ký / xác thực | Khác nhau từng NCC: Bearer JWT/OAuth2, HMAC-SHA256(body, secret) trong field `signature`, MD5(secret + id + body), RSA-sign body, hoặc RSA-encrypt cả body. Header chung: `Content-Type: application/json; charset=UTF-8`, `Accept: application/json`, `X-Request-Id` = UUID v7 (audit end-to-end) |
| Tiền từ NCC | NCC trả `Double` / `BigDecimal` → convert sang `Long` (`longValueExact()` để bắt phần thập phân khác 0) trước khi vào domain |
| Token NCC | cache Valkey TTL = `expires_in - 60s` |
| Secret NCC | Vault, path `${CARRIER}_${PRODUCT}_${SECRET_TYPE}`; cấm inline trong `.properties` / `application.yml` (RULES S3) |
| Webhook ra ngoài | qua `ins-callback-service`, HMAC-SHA256, retry exponential backoff |
| Gọi S2S trong cluster | khác namespace **phải** dùng FQDN `…svc.cluster.local` — tên ngắn → `UnknownHost` → hợp đồng không tạo được |
| Phí | luôn tính ở server, **không tin `amount` của FE** (RULES S4) |

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Vì sao chặn (bằng chứng trong dự án) |
|---|---|---|
| C1 | **Mọi** endpoint có ví dụ request **và** response bọc `ApiResponse.of(...)`, kèm ví dụ lỗi | TSD §7.8 đã phải bổ sung fragment cho các endpoint còn thiếu ví dụ |
| C2 | Error model thống nhất: spec khai đúng shape **đang chạy** `{success, errorCode, message, timestamp}`, không khai problem+json khi code không trả | TSD purchase §7.7 mô tả RFC 7807 nhưng code trả shape khác |
| C3 | Không lộ message thô của NCC, stack trace, tên bảng, host nội bộ | Đã phải bịt ở nhánh checkout gộp đăng ký |
| C4 | Mọi endpoint khai security (realm + role/scope); endpoint ẩn danh khai **cả** `public-paths` **và** (nếu là POST) `csrfIgnoredPaths` | Thiếu `csrfIgnoredPaths` làm gãy âm thầm register / forgot-password / SSO (LESSONS §4.6) |
| C5 | Breaking change phải có kế hoạch chuyển đổi và **thứ tự deploy** (LESSONS §11) | Thêm enum đọc từ DB mà set dữ liệu trước khi deploy BE → lỗi live |
| C6 | Mọi field có kiểu + ràng buộc; **tên field theo đúng 1 quy ước của service** | Lệch snake/camel đã làm field `null` im lặng 3 lần (LESSONS §4.1) |

## Checklist tự kiểm

Cột "Hiện trạng" ghi theo baseline purchase-service trong TSD (dùng làm mẫu đối chiếu cho service khác).

| # | Câu hỏi kiểm tra | Hiện trạng | Ghi chú |
|---|---|---|---|
| 1 | OpenAPI version khai báo đúng và validate được bằng linter? | Không đạt | Fragment OpenAPI 3 viết tay trong markdown TSD, chưa validate bằng công cụ |
| 2 | Có đủ `info` và `servers` cho từng môi trường? | | > TODO: dự án chưa có — cần Tech Lead bổ sung danh sách `servers` chuẩn |
| 3 | Resource danh từ số nhiều? | Đạt | `/carts/items`, `/customers/me/orders`, `/cms/orders` |
| 4 | Động từ HTTP đúng ngữ nghĩa? | Đạt một phần | Hành động nghiệp vụ dùng POST sub-resource (`/orders/{id}/cancel`, `/retry-payment`) |
| 5 | Có path lộ động từ? | Chấp nhận có kiểm soát | Chỉ ở dạng hành động trên sub-resource như mục 4 |
| 6 | Versioning khai báo và có quy tắc tăng version? | Không đạt | Có `/v1` trong path; > TODO: dự án chưa có quy tắc khi nào lên `v2` — cần Tech Lead bổ sung |
| 7 | Mỗi endpoint có `summary`/`description`? | Đạt | Bảng inventory TSD §6 |
| 8 | Tham số có type + ràng buộc? | Đạt một phần | Có `maxLength`, `enum`, `format: uuid` ở fragment chính |
| 9 | Phân trang có giới hạn trên? | Không rõ | `Pageable` mặc định size 20 (RULES SQ3); > TODO: dự án chưa có `maximum` cho `size` — cần Tech Lead bổ sung |
| 10 | Mọi endpoint có `example`? | Đạt một phần | Xem C1 |
| 11 | Error model thống nhất? | Không đạt | Xem C2 |
| 12 | Mã HTTP dùng đúng? | Đạt (spec) / rủi ro (code) | Bảng "Exception → HTTP status"; bẫy `catch (Exception)` → 500 |
| 13 | Response lỗi có lộ thông tin nội bộ? | Đạt | Message externalize; message NCC không đi thẳng ra client |
| 14 | Mọi endpoint khai `security`? | Đạt | Auth ghi trên từng dòng inventory |
| 15 | Idempotency cho endpoint tạo mới? | Đạt | `Idempotency-Key` + 409 khi khác payload |
| 16 | Rate limiting / 429 cho endpoint nặng? | Đạt một phần | KGateway có `policies.yaml` rate-limit; 429 nghiệp vụ cho retry thanh toán; > TODO: dự án chưa ghi ngưỡng rate-limit theo route — cần DevOps bổ sung |
| 17 | Thời gian, tiền tệ, ID chuẩn hoá? | Đạt | `+07:00`, VND `int64`, UUID v7 |
| 18 | Nullable vs optional phân biệt rõ? | | > TODO: dự án chưa có quy ước — cần Tech Lead bổ sung |
| 19 | Enum liệt kê hết giá trị? | Đạt một phần | Trạng thái đơn có bảng master data; enum bị gỡ phải cập nhật fixture test |
| 20 | Breaking change so với version trước? | Có | Nhiều endpoint "ĐÃ GỠ" trong TSD mà không tăng version — kèm thứ tự deploy |
| 21 | Tên field nhất quán 1 kiểu? | **Không đạt** | Xem bảng "Naming JSON" |
| 22 | Endpoint trùng chức năng? | Rủi ro | Nhánh thứ hai của nghiệp vụ đã có làm mất 5/5 guard (LESSONS §2) — ưu tiên tái dùng hàm chung |
| 23 | Spec validate bằng công cụ? | Không đạt | > TODO: dự án chưa có — cần Tech Lead chọn công cụ (xem bảng cuối) |

**Ngưỡng đạt:** C1–C6 = Đạt, câu 23 = Đạt, và số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**Naming lệch — SAI** (service khai camelCase, client gửi snake_case):
```json
{ "transaction_id": "0192f8b0-...", "payment_date": "2026-05-19T10:00:00+07:00" }
```
DTO Java là `transactionId`, `paymentDate` → hai field nhận `null`, API vẫn 200.

**ĐÚNG:** spec ghi rõ quy ước của service và ví dụ dùng đúng quy ước đó; test tích hợp gửi JSON thật (không dựng DTO bằng constructor) để bắt lệch khoá.

**Lỗi — SAI** (spec khai một đằng, code trả một nẻo):
```yaml
'422':
  content:
    application/problem+json: { schema: { $ref: '#/components/schemas/ProblemDetail' } }
```

**ĐÚNG** (khai đúng shape đang chạy):
```json
{ "success": false, "errorCode": "ORDER_CANCEL_NOT_ALLOWED_FOR_STATUS",
  "message": "Đơn hàng không thể huỷ ở trạng thái này", "timestamp": "2026-05-19T10:00:00+07:00",
  "data": { "order_id": "0192f8b0-1234-7abc-9def-000000000001" } }
```

**Endpoint ẩn danh — SAI:** chỉ thêm path vào `ins.security.public-paths` cho một POST đăng ký → request bị 403 ngay lập tức (CSRF).
**ĐÚNG:** thêm path vào **cả** `public-paths` **và** `csrfIgnoredPaths`, ghi cả hai vào spec mục security.

**Timeout — SAI:** caller 15s gọi adaptor, adaptor chờ NCC tới 33s.
**ĐÚNG:** timeout caller (45s) > tổng timeout chặng sau (3s + 30s); spec ghi timeout từng chặng.

## Khi nào tự động CHẶN (block)

Không được commit spec / không được trình Gate 2 nếu:

- [ ] Có endpoint không có ví dụ request/response bọc `ApiResponse` (C1)
- [ ] Spec khai shape lỗi khác shape code đang trả (C2)
- [ ] Response lỗi lộ message thô NCC / stack trace / tên bảng / host nội bộ (C3)
- [ ] Endpoint ẩn danh không khai `public-paths`, hoặc POST ẩn danh thiếu `csrfIgnoredPaths` (C4)
- [ ] Có breaking change mà không có kế hoạch chuyển đổi + thứ tự deploy (C5)
- [ ] Có field không có kiểu, hoặc tên field trái quy ước naming của service (C6)
- [ ] Endpoint ghi không khai `Idempotency-Key` và không ghi lý do miễn trừ
- [ ] Spec không validate được bằng công cụ (câu 23)

## Gợi ý công cụ kiểm tự động

| Công cụ | Kiểm gì | Hiện trạng dự án |
|---|---|---|
| Spectral / `redocly lint` | Style + cú pháp OpenAPI, rule naming field | > TODO: dự án chưa có — cần Tech Lead bổ sung |
| REST Assured + OpenAPI validator | So response thật với spec (`ApiResponse<T>` + shape lỗi); gate CI khi snapshot drift | Có `rest-assured` trong pom purchase nhưng **chưa test nào dùng**; contract test mới là đặc tả target trong TSD §4 |
| ArchUnit | Controller chỉ gọi Facade | Đang chạy (xem `rules/test-rules.md`) |

## Nguồn tham chiếu

- `Architecture.md` §2.3 (Adapter layer, REST, outbox), §2.4 (bảo mật), §2.6 (tích hợp ngoài)
- `RULES.md` §B (Security S1–S13), §D (Performance & SQL), G10, J18, SC2, SO2
- `LESSONS.md` §1 (guard trước side-effect), §2, §4.1–§4.6, §7.4, §9, §11
- TSD purchase-service `06_data-and-api-design.md` §6, §7, §7.7, §9
- Tài liệu spec API NCC nội bộ (chỉ lấy quy ước header/ký/convert tiền)
- Template gốc: `templates/rules/api-rules.md`

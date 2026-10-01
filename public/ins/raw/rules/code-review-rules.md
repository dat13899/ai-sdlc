---
title: Checklist AI review tầng 1 — rules/code-review-rules.md (INS Platform)
for: B10 bước 1–2 (AI review tầng 1, song song Sonar/secret scan) — GATE 3
owner: AI (chạy) · Dev (sửa finding) · Reviewer (duyệt tầng 2) · Tech Lead (A)
nguồn: RULES.md §F (PL04), RULES_ANGULAR.md §J (PL05), SonarClean.md, LESSONS.md §0–§4, §7–§9, §11
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/rules/code-review-rules.md

# rules/code-review-rules.md — Checklist AI review tầng 1

## Mục đích

Tầng 1 là lưới lọc để người review không phải bắt những lỗi máy kiểm được. Ở INS Platform, tầng 1 có thêm nhiệm vụ riêng: bắt các **lỗi im lặng** đã từng lọt vào repo — hệ thống trả 200, log không có gì lạ, chỉ dữ liệu sai (LESSONS §4). Mọi rule trong `RULES.md`/`RULES_ANGULAR.md` đều mức **Bắt buộc**, "vi phạm là lý do REJECT".

AI review phải đọc kèm: `RULES.md` (Java), `RULES_ANGULAR.md` (Angular), `SonarClean.md`, `LESSONS.md`.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| Trước commit (FE) | husky `pre-commit` → lint-staged | `eslint --fix` + `prettier --write` trên file staged |
| Trước commit (BE) | Dev / AI | RULES §F, SonarClean checklist, `ArchitectureTest` |
| B10 bước 1 — mở MR | CI (GitLab CI/CD theo Architecture.md) | MR diff + SonarQube + ruleset này |
| B10 bước 2 — AI comment finding | AI | MR diff, `CODING_CONVENTION.md`, `LESSONS.md` |
| B10 bước 3–4 — Dev sửa, mời reviewer | Dev | Hết finding Critical/High |
| B10 bước 6–7 — Approve & merge | Reviewer | MR + CI xanh |

> TODO: dự án chưa có tài liệu mô tả pipeline CI thực tế (job nào chạy Sonar/test trên MR, có branch protection không) — cần DevOps/Tech Lead bổ sung.

## Phân loại mức độ

Nguồn chỉ ghi "Bắt buộc"; bảng dưới là cách phân mức khi AI báo finding, gán theo hậu quả đã ghi nhận trong LESSONS.

| Mức | Định nghĩa | Ví dụ ở dự án | Được merge? |
|---|---|---|---|
| **Critical** | Sai tiền/hợp đồng/dữ liệu khách không tự phục hồi được; lộ secret/PII; gãy ranh giới kiến trúc (ArchUnit đỏ thêm) | Guard đứng sau lời gọi tạo hợp đồng + gửi SMS → hợp đồng mồ côi; secret hard-code; `@SuppressWarnings`/`NOSONAR` mới | ❌ |
| **High** | Lỗi im lặng: trả 200 nhưng dữ liệu sai; sai status HTTP; thiếu kiểm tenant/quyền | `catch (Exception)` biến 400 thành 500; best-effort nuốt lỗi; Jackson snake/camel lệch làm field `null`; ngày ISO lẫn `dd/MM/yyyy` gửi NCC | ❌ |
| **Medium** | Vi phạm rule Bắt buộc không gây sai dữ liệu ngay | SELECT không `Pageable`; subscribe không unsubscribe; thiếu `trackBy`; S1192 | ⚠️ Tech Lead chấp thuận, ghi lý do |
| **Low** | Style, Javadoc/JSDoc, import thừa | Thiếu JSDoc `@Input`; comment lạc hậu | ✅ ghi backlog |

## Ví dụ viết ĐÚNG vs viết SAI

### 1. Guard phải đứng TRƯỚC tác dụng phụ (LESSONS §1)

`@Transactional` chỉ rollback DB của service đang chạy — không gỡ được hợp đồng đã tạo ở policy-service qua REST, SMS đã bắn Kafka trực tiếp, yêu cầu đã gửi NCC. Minh hoạ dựng lại từ ca thật:

**❌ SAI — guard trạng thái nằm sau hai side-effect:**

```java
PolicyRef policy = policyPort.createPolicyFromOrder(order);   // REST sang policy-service
notificationPort.recordPolicyResult(order, policy);           // bắn SMS
order.markPolicyIssueSucceeded();                             // requireStatusIn(...) mới ném ở đây
orderRepository.save(order);
```

**✅ ĐÚNG — nạp → TẤT CẢ guard → gọi ngoài → ghi DB:**

```java
order.requireStatusIn(RESUMABLE);                  // trạng thái, tenant, quyền, idempotency trước
PolicyRef policy = policyPort.createPolicyFromOrder(order);
if (policy == null) {                              // kết quả gọi ngoài phải được kiểm
  throw new PurchaseApplicationException(POLICY_NOT_CREATED);
}
notificationPort.recordPolicyResult(order, policy);
order.markPolicyIssueSucceeded();
orderRepository.save(order);
```

**Vì sao chặn:** ca thật — khách có hợp đồng + SMS, đơn không đổi trạng thái; hoặc API trả 400 nhưng dữ liệu đã commit; hoặc gửi SMS "HĐ đã kích hoạt" khi không có hợp đồng nào. Critical. Cách AI kiểm: đọc method **từ dưới lên**, hỏi "guard này còn cứu được gì nếu dòng trên đã chạy?".

### 2. S1192 — hằng đã khai thì dùng ở MỌI chỗ (SonarClean)

**❌ SAI — có `KEY_STATUS` rồi nhưng vẫn gõ raw `"status"`:**

```java
private static final String KEY_STATUS = "status";
@RequestParam(value = "status", required = false) String status,   // vi phạm
Map.of("order_id", id, "status", s)                                // vi phạm
```

**✅ ĐÚNG — tham chiếu hằng có sẵn, không tạo hằng thứ hai cùng giá trị:**

```java
@RequestParam(value = KEY_STATUS, required = false) String status,
Map.of(KEY_ORDER_ID, id, KEY_STATUS, s)
```

**Vì sao chặn:** biến thể "already-defined constant" bị Sonar bắt ngay từ lần lặp đầu; file nhìn qua tưởng đã tuân thủ. Đã dính cả hai biến thể trong cùng một controller CMS. Kiểm: `grep -n '"status"' <file>` chỉ còn dòng khai báo. **Không** dùng `@SuppressWarnings`/`// NOSONAR` để qua.

### 3. Nuốt lỗi — best-effort và `catch (Exception)` (LESSONS §4.2, §4.3; RULES J33, SC2) — code minh hoạ dựng lại từ mô tả ca thật

**❌ SAI:**

```java
try {
  smsPort.send(request);                 // thiếu Idempotency-Key → downstream trả 400
} catch (Exception e) {
  log.warn("send sms best-effort failed"); // mất cause, luồng vẫn trả 200
}
```

**✅ ĐÚNG — catch đúng loại, giữ cause, và caller biết kết quả:**

```java
try {
  smsPort.send(request);
} catch (SmsRejectedException e) {
  log.warn("sms rejected orderId={}", orderId, e);
  return SmsResult.failed(e.getCode());   // caller quyết định, không mặc định thành công
}
```

**Vì sao chặn:** ca thật — SMS hậu kiểm không tới khách mà endpoint vẫn 200; `createPolicyFromOrder` trả `null` mà luồng vẫn báo thành công. Tương tự ở tầng handler: `@ExceptionHandler(Exception.class)` trong advice không `extends ResponseEntityExceptionHandler` đã biến lỗi validation 400 thành 500.

## Khi nào tự động CHẶN (block) — điều kiện cứng

| # | Điều kiện | Ai chặn |
|---|---|---|
| B1 | Còn finding **Critical/High** chưa sửa | Không mời review tầng 2 |
| B2 | `ArchitectureTest` đỏ thêm so với mốc (mốc: `controller_should_go_through_facade` 3 vi phạm) | Build / reviewer |
| B3 | Diff thêm `@SuppressWarnings("java:S…")`, `"unchecked"`, `"rawtypes"`, `// NOSONAR` (ngoại lệ duy nhất: S4502 ở endpoint đối tác, có comment) | AI tầng 1 — grep verify ở SonarClean |
| B4 | Secret/API key/token/connection string trong code (RULES S3, RULES_ANGULAR S5) | Chặn tuyệt đối + rotate |
| B5 | `ng lint` lỗi mức error (vd `eqeqeq`, `no-explicit-any`, `no-restricted-globals` localStorage) | lint-staged / CI |
| B6 | Lib mới trong `pom.xml`/`package.json` không qua MR riêng có Tech Lead approve (TP1) | Reviewer |
| B7 | Đổi `@Entity`/DDL mà MR không nêu `ddl-auto` của service và thứ tự deploy (LESSONS §7.1, §11) | Reviewer |
| B8 | Test hiện có bị sửa để pass trong khi hành vi đổi mà không cập nhật javadoc/test tương ứng (LESSONS §5.3) | Cần ghi lý do |

## Checklist chi tiết theo nhóm

### A. Bảo mật — injection & input

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| A1 | Có SQL ghép chuỗi? Native query có dùng `?` parameter, search dùng Specification? (S2) | Critical | |
| A2 | Input từ user có encode chống XSS (OWASP Encoder/`HtmlUtils`), không trả raw HTML? (S1) | Critical | |
| A3 | Đường dẫn file có lọc `/`, `\`, null + whitelist extension? (S6) | High | |
| A4 | FE: có `document.getElementById/querySelector`, `innerHTML`, `element.style` trực tiếp? (D1) | High | |
| A5 | FE: `[innerHTML]` với dữ liệu chưa sanitize; `bypassSecurityTrustHtml` có kiểm soát? (D2) | High | |
| A6 | FE: có inline `<script>` trong template? (D3/S3) | High | |
| A7 | FE: query param tự concat URL thay vì `HttpParams`/`encodeURIComponent`? (S1) | Medium | |
| A8 | `@Valid @RequestBody` + fail-fast đầu method? (SC8) | Medium | |

### B. Bảo mật — xác thực & phân quyền

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| B1 | Endpoint mới có `@PreAuthorize` hoặc tenant filter, mặc định deny? (S7) | Critical | |
| B2 | Có kiểm `tenant_id` qua `TenantContext.get()` (trừ identity)? Tham số tenant có bị khai rồi bỏ không dùng? (AR9, LESSONS §2) | High | |
| B3 | Path đúng nhóm: public `/ins/<svc>/public/v1/…`, CMS `…/public/v1/cms/…`, M2M `…/private/v1/…` (không expose private qua public gateway)? | High | |
| B4 | POST ẩn danh mới: đã khai **cả** `public-paths` **và** `csrfIgnoredPaths`? (403 trong 1ms = CSRF, 401 = thiếu public-paths — LESSONS §4.6) | High | |
| B5 | Login fail message chung; đổi session ID sau login; cookie HttpOnly+Secure+SameSite? (S8–S10) | High | |
| B6 | FE: route dữ liệu nhạy cảm có `AuthGuard` + role? (S7) | High | |
| B7 | ID-space: có nhầm JWT `sub` (= `keycloak_user_id`) với `customers.id`? (LESSONS §7.4) | High | |

### C. Bảo mật — dữ liệu & secret

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| C1 | Có hard-code password/API key/token/connection string (BE S3, FE S5)? | Critical | |
| C2 | Log có PII raw (CCCD, SĐT, tên, địa chỉ, mật khẩu, token)? (INS-extra, S11) | High | |
| C3 | Có lưu PAN thẻ thay vì tokenization? (S12) | Critical | |
| C4 | FE: JWT/PII/OTP/số thẻ trong `localStorage`/`sessionStorage` (ngoài `TokenStorageService`)? (S2) | High | |
| C5 | Có kết luận "có dữ liệu" chỉ vì log hiện `field=***`? Masking thay cả giá trị null (LESSONS §4.4) | Medium | |
| C6 | FE: input password có `autocomplete="new-password"`/`off`? (S6) | Low | |

### D. Phụ thuộc & chuỗi cung ứng

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| D1 | Lib mới đã qua Tech Lead + MR riêng? (TP1) | High | |
| D2 | License MIT/Apache-2.0/BSD, tránh GPL? (TP2) | High | |
| D3 | Có viết lại thứ đã có trong `platform-libs`, `ins-common`, Commons, Guava, RxJS? (G6/G7) | Low | |
| D4 | `package-lock.json` được commit; `npm audit` sạch Critical/High? (TP3, TP4) | Medium | |

### E. Logic & xử lý lỗi

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| E1 | Guard (trạng thái, tenant, quyền, idempotency) có đứng **trước** REST/Kafka/ghi DB? (LESSONS §1) | Critical | |
| E2 | MR có viết **nhánh thứ hai** cho nghiệp vụ đã có? Đã liệt kê và đối chiếu từng guard của đường cũ, hay tái dùng hàm chung? (LESSONS §2) | Critical | |
| E3 | Kết quả gọi ngoài/best-effort (`null`, cache replay, 4xx bị catch) có được kiểm trước khi báo thành công? (LESSONS §4.3) | High | |
| E4 | Có `@ExceptionHandler(Exception.class)` mới hoặc advice thứ hai trong service? (LESSONS §4.2) | High | |
| E5 | Catch có log/forward cause (J33), không vừa log vừa rethrow (S2139), không nuốt (S1166), không catch `Exception` chung (SC2)? | High | |
| E6 | Tiền VND dùng `Long`, tính ở BE (AR10, S4)? | High | |
| E7 | Kafka ra ngoài qua Transactional Outbox, không dual-write trong request (AR12)? | High | |
| E8 | 1 transaction = 1 aggregate; mutation qua method của root; event emit từ root (AR6, AR7)? | High | |
| E9 | DTO đọc/ghi JSON đúng naming strategy của service (purchase/payment/policy/promotion đặt `SNAKE_CASE` toàn cục)? Field nhiều từ bị `null` → nghi naming trước (LESSONS §4.1) | High | |
| E10 | Có fallback im lặng che lỗi đọc dữ liệu? (LESSONS §4.7) | Medium | |
| E11 | Config mới/sửa có bean nào thật sự đọc không? (vd `ins.cache.*` không bean nào đọc — LESSONS §4.5) | Medium | |
| E12 | FE: date picker lưu ISO, chỉ format `dd/MM/yyyy` khi hiển thị; payload gửi BE cùng một dạng? (LESSONS §9) | High | |
| E13 | Tên biến môi trường khớp deployment (vd `INS_VALKEY_*` vs `INS_REDIS_*`; service không đọc nhầm `INS_<SERVICE_KHÁC>_DB_*`)? (LESSONS §7.3) | High | |
| E14 | Có `return` trong `finally` (J5), switch fall-through (J30), `==` với float/double (J20)? | Medium | |

### F. Hiệu năng & tài nguyên

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| F1 | Mọi SELECT có `LIMIT`/`Pageable` (mặc định 20)? (SQ3) | Medium | |
| F2 | Function trên cột có index trong WHERE (SQ1)? Bảng giao dịch có partition key trong WHERE (SQ5)? Cột mới đã đánh giá index (SQ4)? | Medium | |
| F3 | Resource đóng bằng try-with-resources (J9, S2095)? Connection qua pool (P4, J41)? | Medium | |
| F4 | `new Thread()` thay vì ExecutorService (P1); `synchronized` quanh webservice call (J43)? | Medium | |
| F5 | Redis key có TTL, có prefix `ins:<service>:`; không `KEYS`/`SCAN` ở hot path? (Naming §6) | Medium | |
| F6 | FE: `subscribe()` có unsubscribe/`takeUntilDestroyed()`; không nest subscribe; interval/listener được clear? (R1, R4–R6) | Medium | |
| F7 | FE: list lớn có `trackBy`; component @Input immutable dùng OnPush; feature mới lazy load? (P1–P3) | Low | |

### G. Code có gọi AI / LLM

> TODO: dự án chưa có — sản phẩm không có tính năng gọi LLM trong các nguồn đã rà; cần Tech Lead bổ sung nếu phát sinh.

### H. Chất lượng code & khả năng bảo trì

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| H1 | Checklist SonarClean: S1192 (cả biến thể hằng đã có), S2139, S107, S2160, S5738/S1874, unchecked/rawtypes, S1168, S2065, S2629? | Medium | |
| H2 | Import `adapter.inbound..` → `adapter.outbound..`; domain import Spring/JPA/Temporal; UseCase có `@Service`? (AR1–AR3) | Critical | |
| H3 | Controller/consumer/scheduler gọi thẳng UseCase; Facade có business logic hoặc gọi JPA/outbound? (AR4, AR5) | High | |
| H4 | Magic string/number (G4); hằng FE nằm ngoài `*.constants.ts`/`*.enums.ts` (G5)? | Medium | |
| H5 | Text hiển thị hard-code vi/en thay vì `translate` (G13); `==`/`!=` (G14); `any` (G10); `var` (G9)? | Medium | |
| H6 | `System.out`/`printStackTrace`/`console.log`/`debugger` còn sót? | Medium | |
| H7 | Code comment-out (S125), comment trông giống code, TODO không ticket (S1135)? | Low | |
| H8 | Public API thiếu Javadoc/JSDoc (G3, G11)? Comment không khớp code (G7)? | Low | |
| H9 | Đề xuất xoá "code chết" có chứng minh: truy theo port, grep `-i`, tách khai hằng/call site, kiểm route k8s, `@KafkaListener`, seed SQL? (LESSONS §3) | High | |
| H10 | Đổi Sonar ngoài phạm vi issue được giao (tự quét rồi sửa, tách hằng tên `fallbackMethod`)? (LESSONS §8) | Medium | |

## Định dạng báo cáo finding của AI

Ví dụ minh hoạ (tên file giả định):

```
[High] catch Exception nuốt lỗi 400 của notification-service
File: ins-purchase-service/adapter/src/main/java/.../outbound/rest/SmsRestAdapter.java:88-95
Vấn đề: catch (Exception) chỉ log warn, không giữ cause, caller vẫn trả 200 → SMS có thể không tới khách.
Quy tắc: rules/code-review-rules.md E3, E5 · RULES J33, SC2 · SonarClean S1166 · LESSONS §4.3
Đề xuất: catch đúng loại, log kèm cause bằng placeholder {}, trả kết quả thất bại cho caller quyết định.
Kiểm chứng: test use case với port ném lỗi 400 → luồng không báo thành công; chạy RIÊNG lớp test của use case.
```

Không có "File" và "Đề xuất" thì dev không sửa được → finding bị bỏ qua.

## Nguồn tham chiếu

- `RULES.md` §F (checklist trước commit), §G; PL04 — Checklist Java backend review code
- `RULES_ANGULAR.md` §J, §K; PL05 — Checklist Code Review for Angular
- `SonarClean.md` — POLICY, 9 rule chính, checklist, rule bổ sung
- `LESSONS.md` §0 (checklist sau khi code), §1–§4, §7, §8, §9, §11
- INS Naming Standards v1.4.1 §6–§7
- OWASP ASVS — https://owasp.org/www-project-application-security-verification-standard/

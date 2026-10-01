---
title: ADR Template (MADR) — ví dụ INS Platform
for: B6 — Thiết kế kiến trúc (mọi quyết định kiến trúc quan trọng)
owner: Tech Lead (A/R) · Dev (R) · AI (draft từ prompt B6)
nguồn: templates/b2/adr-template.md; MADR; Architecture.md §2.1, §2.3; RULES.md AR10, AR12; LESSONS.md §1, §10; TSD purchase-service 04/06
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/adr-template.md

# ADR Template (MADR) — INS Platform

> Copy khối dưới vào `docs/adr/NNNN-tieu-de-ngan.md`. Đánh số tuần tự, không tái sử dụng số. Kiểm bằng `rules/adr-rules.md` trước khi mở PR.

---

## Khối mẫu

```markdown
---
title: "ADR-NNNN: <Tiêu đề quyết định>"
status: proposed | accepted | rejected | deprecated | superseded by ADR-XXXX
date: YYYY-MM-DD
decision-makers: [<Tech Lead>]
consulted: [<người được hỏi>]
informed: [<người cần biết>]
---

# ADR-NNNN: <Tiêu đề>

## Trạng thái (Status)
## Bối cảnh và vấn đề (Context and Problem Statement)
## Yếu tố quyết định (Decision Drivers)
## Các phương án đã cân nhắc (Considered Options)
## Quyết định (Decision Outcome)
## Hệ quả (Consequences)
### Tích cực
### Tiêu cực / mặt phải chấp nhận   ← BẮT BUỘC ≥ 1 mục
### Rủi ro còn lại
## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)
## Liên kết (Links / More Information)
```

---

## Quy tắc viết ADR

| Quy tắc | Nội dung |
|---|---|
| **Khi nào phải viết ADR** | Quyết định ảnh hưởng kiến trúc, khó đảo ngược, hoặc ảnh hưởng nhiều service. Ở INS: mọi thứ nằm trong `Architecture.md` §2 (outbox, UUID v7, kiểu tiền, ranh giới aggregate), và **mọi lần revert một thay đổi đã lên môi trường thật** (LESSONS §10) |
| **Khi nào KHÔNG cần ADR** | Chi tiết trong một module, việc revert được trong 1 ngày mà chưa lên môi trường thật |
| **Tối thiểu bao nhiêu phương án** | **≥ 2** phương án thực sự cân nhắc. Với ADR "đã thử — đã revert", phương án đã thử **là** một phương án |
| **Bắt buộc nêu mặt xấu** | Mọi ADR có ít nhất 1 tiêu cực |
| **AI sinh ADR** | AI draft được, quyết định cuối thuộc Tech Lead. AI không tự đổi status thành `accepted` |
| **Đổi quyết định cũ** | Không sửa ADR cũ. Tạo ADR mới, ghi vào ADR cũ `superseded by ADR-XXXX` |
| **Ai duyệt** | Tech Lead duyệt qua Pull Request |

## Ví dụ ADR đã điền (lấy từ dự án thật)

Ba ADR dưới đây viết lại từ quyết định có trong `Architecture.md` và bảng "Đã thử — đã revert" (LESSONS §10). Ô người ra quyết định và ngày không có trong nguồn được để TODO.

### ADR-0001 — Transactional Outbox thay cho dual-write Kafka

```markdown
---
title: "ADR-0001: Phát sự kiện Kafka qua Transactional Outbox, không dual-write"
status: accepted
date: 2026-04-29          # ngày ban hành Architecture.md v1.0 — ngày quyết định gốc: TODO
decision-makers: [TODO: Tech Lead]
consulted: [TODO]
informed: [Dev 15 service]
---

# ADR-0001: Phát sự kiện Kafka qua Transactional Outbox, không dual-write

## Trạng thái (Status)

`accepted` — áp dụng bắt buộc (Architecture §2.3, RULES AR12)

## Bối cảnh và vấn đề (Context and Problem Statement)

Mỗi service lưu aggregate vào MariaDB và phải phát domain event cho service khác qua
Kafka (thanh toán → cấp hợp đồng → thông báo). `@Transactional` chỉ rollback DB của
service đang chạy; nó không gỡ được message đã gửi Kafka. Nếu vừa ghi DB vừa gửi Kafka
trong cùng request, một trong hai có thể thành công còn cái kia thất bại.

## Yếu tố quyết định (Decision Drivers)

- 1 transaction = 1 aggregate; sự kiện phải nhất quán với trạng thái aggregate đã commit
- Luồng tiền: mất event "đã thanh toán" = khách trả tiền mà không được cấp hợp đồng
- Audit log append-only, stream qua topic audit (retention ≥ 5 năm)
- Consumer ở nhiều service khác nhau, cần envelope thống nhất

## Các phương án đã cân nhắc (Considered Options)

1. Dual-write: gọi `kafkaTemplate.send()` trong request sau khi save
2. Transactional Outbox + relay polling (scheduler đọc bảng outbox rồi publish)
3. Transactional Outbox + Debezium CDC đọc binlog

## Quyết định (Decision Outcome)

**Đã chọn:** Transactional Outbox — aggregate save và insert bảng `{svc}_outbox`
atomic trong cùng transaction; relay publish sau. Envelope JSON snake_case 11 khoá
(`event_id, event_type, version, occurred_at, tenant_id, source_service, correlation_id,
causation_id, actor_id, traceparent, payload`), dựng qua `OutboxAppender` của `ins-common`.

**Hiện trạng triển khai (purchase-service):** phương án 2 — `PurchaseOutboxRelayScheduler`
polling `fixedDelay` 2s, serialize bằng Jackson thành chuỗi JSON, gửi bằng
`StringSerializer`; consumer dùng `StringDeserializer` + `objectMapper.readTree`.
Chưa có Debezium connector nào; Avro/Schema Registry là thiết kế mục tiêu.

**Lý do:** chỉ outbox đảm bảo event và trạng thái aggregate cùng commit hoặc cùng
rollback. Polling relay đủ dùng và không cần vận hành thêm CDC.

## Hệ quả (Consequences)

### Tích cực

- Không còn trạng thái "DB đã đổi nhưng event mất" hoặc ngược lại
- Envelope thống nhất snake_case, có `correlation_id` / `traceparent` để truy vết

### Tiêu cực / mặt phải chấp nhận

- Event trễ tối đa một nhịp relay (2s ở purchase)
- Thêm bảng outbox mỗi service (có service partition theo quý)
- Relay có thể gửi lặp → **mọi consumer phải dedupe** (purchase: `IdempotencyStore`
  Valkey `SET NX`, TTL ≥ thời gian workflow còn sống)
- Ngoại lệ có chủ đích: SMS publisher bắn Kafka **trực tiếp**, không qua outbox, để tin
  nhắn không bị cuốn theo transaction — nên SMS **không** rollback được; mọi guard phải
  đứng TRƯỚC lệnh gửi SMS (LESSONS §1)

### Rủi ro còn lại

- Gap analysis ghi nhiều service vẫn còn handler mẫu gọi `kafkaTemplate.send()` trực
  tiếp với envelope camelCase — vi phạm ADR này cho tới khi thay bằng outbox appender
- Tên topic thực tế dạng gạch ngang (`ins-purchase-events`) lệch với thiết kế dạng chấm
  (`ins.purchase.events`) — publisher và consumer phải cấu hình cùng một tên
  (đã có bug production do lệch topic ở insurer-partner)

## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)

### Phương án 1 — Dual-write

- ✅ Tốt: đơn giản, không thêm bảng, độ trễ thấp nhất
- ❌ Xấu: không atomic; lỗi mạng giữa save và send làm mất hoặc thừa event

### Phương án 2 — Outbox + polling relay (đang chạy)

- ✅ Tốt: atomic với aggregate; không cần thêm hạ tầng CDC
- ❌ Xấu: có độ trễ polling; tải query đều đặn lên bảng outbox; gửi at-least-once

### Phương án 3 — Outbox + Debezium CDC

- ✅ Tốt: đọc binlog, không polling; route theo `event_type`
- ❌ Xấu: thêm thành phần phải vận hành (Kafka Connect + connector); chưa triển khai

## Liên kết (Links)

- Architecture.md §2.3 (Messaging), RULES.md AR12
- TSD purchase-service `04_event-driven-design.md` §2.2; `07_testing-design.md` (test `OutboxToKafkaIT`)
- LESSONS.md §1 (ngoại lệ SMS publisher)
```

### ADR-0002 — Tiền VND kiểu `Long` (đồng), không `BigDecimal`

```markdown
---
title: "ADR-0002: Biểu diễn tiền VND bằng Long (đơn vị đồng)"
status: accepted
date: 2026-04-29          # ngày ban hành Architecture.md v1.0 — ngày quyết định gốc: TODO
decision-makers: [TODO: Tech Lead]
consulted: [TODO]
informed: [Dev BE, Dev FE]
---

# ADR-0002: Biểu diễn tiền VND bằng Long (đơn vị đồng)

## Trạng thái (Status)

`accepted` — bắt buộc (Architecture §2.1, RULES AR10 và rule bổ sung của dự án ở RULES §C4)

## Bối cảnh và vấn đề (Context and Problem Statement)

Nền tảng tính phí bảo hiểm, áp voucher, thu tiền và đối soát với nhiều NCC. Tiền đi
qua domain, DB, REST, Kafka và API NCC. Cần một kiểu dữ liệu duy nhất cho số tiền VND
để phép tính và so sánh luôn chính xác.

## Yếu tố quyết định (Decision Drivers)

- VND không có đơn vị lẻ dưới đồng trong nghiệp vụ của nền tảng
- Logic tính tiền chỉ chạy ở backend (RULES S4), phải so khớp chính xác
  (ví dụ `QUOTE_AMOUNT_MISMATCH` khi số tiền checkout ≠ số tiền báo giá)
- Mỗi NCC trả tiền một kiểu khác nhau (có NCC trả `Double`, có NCC trả `BigDecimal`)

## Các phương án đã cân nhắc (Considered Options)

1. `Long` — đơn vị đồng
2. `BigDecimal`
3. `Double`

## Quyết định (Decision Outcome)

**Đã chọn:** `Long` (đồng). DB `BIGINT UNSIGNED`; JSON `integer int64`; kèm
`currency_code CHAR(3)` mặc định `VND` ở bảng cần.

**Lý do:** số nguyên tuyệt đối chính xác, so sánh bằng `==`/`equals` không bẫy
scale, rẻ hơn `BigDecimal`, và khớp đúng bản chất VND không có phần lẻ.

## Hệ quả (Consequences)

### Tích cực

- Một kiểu tiền duy nhất xuyên domain → DB → API → event
- Không có lỗi làm tròn dấu phẩy động, không có bẫy `BigDecimal.equals` khác scale

### Tiêu cực / mặt phải chấp nhận

- Phải convert ở **biên** insurer-adaptor: NCC trả `Double` → convert sang `Long`
  (làm tròn xuống); NCC trả `BigDecimal` → `.longValueExact()` (ném lỗi nếu có phần
  thập phân khác 0) — thêm code và test cho từng NCC
- Nếu sau này cần ngoại tệ có đơn vị lẻ, kiểu này không đủ → cần ADR mới

### Rủi ro còn lại

- Làm tròn xuống khi convert `Double` của NCC có thể lệch 1 đồng so với số NCC hiển thị;
  > TODO: chưa có quy tắc đối soát chênh lệch — cần BA/Tech Lead bổ sung

## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)

### Phương án 1 — `Long`

- ✅ Tốt: chính xác, nhanh, đơn giản, khớp bản chất VND
- ❌ Xấu: không biểu diễn được phần lẻ; phải convert ở biên NCC

### Phương án 2 — `BigDecimal`

- ✅ Tốt: biểu diễn được mọi đơn vị lẻ, sẵn cho đa tiền tệ
- ❌ Xấu: `equals` phụ thuộc scale; chậm và dài dòng hơn; thừa với VND

### Phương án 3 — `Double`

- ✅ Tốt: một số NCC đã trả sẵn kiểu này
- ❌ Xấu: sai số dấu phẩy động — không chấp nhận được cho tiền

## Liên kết (Links)

- Architecture.md §2.1; RULES.md AR10
- Tài liệu spec API NCC nội bộ — mục "Quirks cần lưu ý khi viết Strategy"
- TSD purchase-service `06_data-and-api-design.md` §3 (DDL tiền `BIGINT UNSIGNED`)
```

### ADR-0003 — Kiểm tenant ở luồng khởi tạo thanh toán: phát hiện, không chặn (đã revert)

```markdown
---
title: "ADR-0003: Kiểm tra IDOR ở payment initiate chỉ ghi nhận (detection-only), không throw"
status: accepted
date: TODO                # nguồn không ghi ngày revert
decision-makers: [TODO: Tech Lead]
consulted: [TODO: Security Lead]
informed: [Dev payment-service]
---

# ADR-0003: Kiểm tra IDOR ở payment initiate chỉ ghi nhận (detection-only), không throw

## Trạng thái (Status)

`accepted` — thay thế thay đổi trước đó (throw `TENANT_MISMATCH`) đã bị revert

## Bối cảnh và vấn đề (Context and Problem Statement)

Phát hiện bảo mật "F8" chỉ ra nguy cơ IDOR ở endpoint khởi tạo thanh toán: request có
thể trỏ tới tài nguyên không thuộc tenant/khách đang gọi. Bản vá đầu tiên ném
`TENANT_MISMATCH` (403) khi không khớp. Sau khi lên môi trường thật, bản vá **chặn nhầm
khách thật** trên luồng thanh toán và phải revert.

## Yếu tố quyết định (Decision Drivers)

- Luồng thanh toán là money-path: chặn nhầm = khách không trả được tiền, mất đơn
- Vẫn cần tín hiệu để phát hiện truy cập chéo tenant thật sự
- Bối cảnh chung cần lưu ý khi làm lại: JWT `sub` = `keycloak_user_id`, khác
  `customers.id` (LESSONS §7.4). Nguồn **không** ghi đây là nguyên nhân chặn nhầm —
  chỉ là điểm phải kiểm trước khi enforce lại

## Các phương án đã cân nhắc (Considered Options)

1. Enforce: ném `TENANT_MISMATCH` khi không khớp (đã thử, đã revert)
2. Detection-only: `log.warn`, không throw, tiếp tục xử lý

## Quyết định (Decision Outcome)

**Đã chọn:** Detection-only — ghi `log.warn`, không chặn request.

**Lý do:** phương án 1 gây chặn nhầm khách thật trên money-path; trong khi chưa xác
định được điều kiện so khớp đúng, ghi nhận để điều tra an toàn hơn chặn.

## Hệ quả (Consequences)

### Tích cực

- Khách thật không bị chặn thanh toán
- Có log để đo tần suất và dạng request không khớp

### Tiêu cực / mặt phải chấp nhận

- **IDOR chỉ được phát hiện, không được chặn** — lỗ hổng vẫn mở trên endpoint này
- Log `warn` không ai đọc thì tương đương không có kiểm tra

### Rủi ro còn lại

- Cần một ADR mới khi đã xác định đúng điều kiện so khớp để chuyển lại sang enforce;
  > TODO: nguồn không ghi kế hoạch/điều kiện enforce lại — cần Security Lead bổ sung
- Trước khi làm lại, **đọc ghi chú chi tiết của lần revert** để biết vì sao lần trước
  hỏng (LESSONS §10)

## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)

### Phương án 1 — Enforce `TENANT_MISMATCH`

- ✅ Tốt: đóng hẳn lỗ hổng IDOR; nhất quán với các endpoint khác trả 403 `TENANT_MISMATCH`
- ❌ Xấu: đã chặn nhầm khách thật trên luồng thanh toán → revert

### Phương án 2 — Detection-only

- ✅ Tốt: không ảnh hưởng khách thật; vẫn có tín hiệu
- ❌ Xấu: không chặn tấn công; phụ thuộc người đọc log

## Liên kết (Links)

- LESSONS.md §10 (bảng "Đã thử — đã revert"), §7.4 (ID-space)
- Cùng bảng §10 còn 2 quyết định đáng viết ADR: revert `signalWithStart` (gây regression
  money-path — đơn không lên `PAYMENT_SUCCESS`, sau làm lại đúng cách ở luồng resume) và
  revert cột đếm lượt dùng voucher gương bảng mã (revert trong ngày)
```

## Ví dụ viết đúng vs viết sai

| | Ví dụ |
|---|---|
| ❌ **Sai** | "Dùng outbox cho Kafka vì là best practice." *(1 phương án, không có mặt xấu, không nói hiện trạng triển khai)* |
| ✅ **Đúng** | "Chọn Transactional Outbox thay vì dual-write vì `@Transactional` không gỡ được message Kafka đã gửi; đang chạy relay polling 2s, chưa có Debezium. Mặt phải chấp nhận: event trễ tới 2s, consumer phải dedupe vì relay gửi at-least-once; SMS publisher là ngoại lệ bắn thẳng Kafka nên mọi guard phải đứng trước nó. Đã cân nhắc Debezium CDC (không polling nhưng thêm Kafka Connect phải vận hành)." |

## Nguồn tham chiếu

- MADR — https://adr.github.io/madr/
- Michael Nygard — Documenting Architecture Decisions — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- `Architecture.md` §2.1, §2.3; `RULES.md` AR10, AR12, S4
- `LESSONS.md` §1, §7.4, §10
- TSD purchase-service `04_event-driven-design.md`, `06_data-and-api-design.md`
- Template gốc: `templates/b2/adr-template.md`

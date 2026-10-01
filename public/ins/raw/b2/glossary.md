> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/glossary.md

# glossary.md — Từ điển thuật ngữ dự án INS Platform

**Dùng cho:** B2 (khởi tạo), cập nhật liên tục từ B3 tới B14 · **Owner:** BA (R) · PO (A) · Tech Lead (C)

> **Bối cảnh:** INS Platform là một nền tảng bảo hiểm trung gian (Insurance Middleware Platform, kiến trúc MACH) nằm giữa khách hàng cuối (miniapp trong Ví X, web, app đối tác, CMS) và 8 công ty bảo hiểm (NCC). Backend có 15 microservice Java 21 + Spring Boot 3.5. Phase 1 deploy 12 service.
>
> **Nguồn định nghĩa:** SRS BaselineV2 (11/06/2026), `Tong_hop_Status_Nghiep_vu.docx`, `Plan_Dong_bo_Status_Order_Policy.md`, `Plan_Truy_van_ket_qua_tao_hop_dong.md`, `FLOW_Huy_Don_Hang.md`, `temporal-workflows.md`, `Architecture.md`, `LESSONS.md`, phụ lục Glossary của bộ Comprehensive Reference. Chỗ nào các nguồn nói khác nhau thì ghi ở cột "Ghi chú", không tự chọn một bên.

## 1. Nhóm từ BẮT BUỘC có trong glossary ở dự án này

| Loại | Ví dụ thực tế ở INS | Vì sao ở dự án này dễ sai |
|---|---|---|
| Thuật ngữ nghiệp vụ bảo hiểm | đơn hàng, hợp đồng, GCN, TNDS, huỷ đơn / huỷ HĐ, sửa HĐ | "Hợp đồng" (policy) và "đơn hàng" (order) nằm ở 2 service, 2 aggregate khác nhau |
| Từ đồng nghĩa | CTBH = NCC = NBH | SRS dùng CTBH, code dùng `insurer`/`ncc`, tài liệu kỹ thuật dùng NCC |
| Tên trạng thái | `POLICY_REQUEST_TIMEOUT`, `POLICY_ACTIVE`, `group_code` | SRS mô tả status + substatus, code đã **làm phẳng** thành leaf status |
| Vai trò / realm | `customer`, `tenant-admin`, `internal` | Realm cũ `insurer-admin` đã bị cấm dùng |
| Từ kỹ thuật dùng theo nghĩa riêng | outbox, facade, ID-space, tenant | Một số ngoại lệ có chủ đích (VD SMS không đi qua outbox) |

## 2. Bảng thuật ngữ nghiệp vụ

| Thuật ngữ | Định nghĩa | Ví dụ / Ngữ cảnh | KHÔNG phải là | Ghi chú |
|---|---|---|---|---|
| **Đơn hàng (Order)** | Bản ghi giao dịch mua bảo hiểm của KH, đi từ lúc checkout tới khi phát hành hợp đồng. Aggregate `Order` thuộc `ins-purchase-service` | KH submit checkout → tạo Order ở `ORDER_INIT` | Không phải hợp đồng. Order còn sống kể cả khi HĐ tạo thất bại | Trạng thái xem §2.3 |
| **Hợp đồng (Policy, HĐ)** | Hợp đồng bảo hiểm đã được NCC phát hành. Aggregate `Policy` thuộc `ins-policy-service`. Trong domain này "hợp đồng" === policy | Policy được tạo local sau khi NCC phát hành OK (WF-01 step 7) | Không phải đơn hàng. Không phải "hợp đồng khung" giữa tenant và NCC (cái đó là Contract ở insurer-partner-service) | Trạng thái xem §2.4 |
| **GCN** | Giấy chứng nhận bảo hiểm — đầu ra sau khi tạo policy | Link GCN lưu ở `certificate_url`; KH tải qua `.../{id}/certificate` (presigned URL) | Không phải số hợp đồng (`insurer_policy_no`) | |
| **CTBH / NCC / NBH** | Công ty bảo hiểm (Nhà cung cấp, Nhà bảo hiểm) — ba từ đồng nghĩa | Dự án tích hợp 8 NCC: Insurer-A…Insurer-F và các NCC khác | Không phải "đối tác kênh bán" (app đối tác phân phối) | SRS dùng CTBH, code dùng NCC/insurer |
| **Mã NCC (`nccCode`, `insurerCode`)** | Khoá định danh NCC dùng để định tuyến adapter/dispatcher | `PolicyResultQueryDispatcher` route theo `nccCode` | Không phải `tenant_id` | |
| **KH** | Khách hàng cá nhân (B2C) | Truy cập qua miniapp trong Ví X, web, app đối tác | Không phải admin CMS hay nhân sự NCC | |
| **TNDS** | Trách nhiệm dân sự — bảo hiểm bắt buộc TNDS chủ xe cơ giới | TNDS xe máy, TNDS ô tô; policy có thêm cột `vehicle_chassis_number`, `vehicle_engine_number`… | Không phải bảo hiểm vật chất xe | SRS sản phẩm riêng bị đẩy sang Phase 2 |
| **UW / Thẩm định rủi ro** | Đánh giá rủi ro trước khi phát hành HĐ | Phase 1: **nền tảng không làm UW**; `ins-uw-service` không phát triển; NCC tự thẩm định khi nhận yêu cầu phát hành (step `issuePolicyAtInsurer`) | Không phải precheck. Không phải phê duyệt HĐ (`POLICY_PENDING_APPROVAL`) | Muốn pre-screen UW phía nền tảng thì thêm 2 step UW trước `calculatePricing` |
| **Precheck (tiền kiểm)** | Kiểm tra điều kiện trước thanh toán. Có 2 loại: tiền kiểm hệ thống và tiền kiểm phía NCC | `SYSTEM_PRECHECK_SUCCESS` = trường hợp không có API check từ CTBH, hệ thống tự tiền kiểm đạt; `PRECHECK_PARTNER_SUCCESS` = NCC chấp nhận điều kiện | Không phải UW | 2 state precheck-success chưa nối vào luồng live (hoãn) |
| **CTT** | Cổng thanh toán | `ins-payment-service` gọi CTT để trừ tiền (WF-01 step 4) | Không phải Ví X | |
| **Mở cổng thanh toán** | Bước payment-service gửi yêu cầu sang CTT | `PAYMENT_REQUEST_SUCCESS` = mở cổng thành công nhưng KH **chưa** thanh toán | Không phải "đã thanh toán" (`PAYMENT_SUCCESS`) | Chốt Q2 ngày 18/06/2026 |
| **Huỷ đơn hàng** | KH tự huỷ đơn khi đơn **chưa đi vào thanh toán**. Chỉ cập nhật trạng thái đơn, không OTP, không gọi CTBH, không hoàn tiền | `POST /ins/purchase/public/v1/customers/me/orders/{id}/cancel`; BE cho huỷ ở `INIT`/`PENDING_UPDATE`/`PAYMENT_PENDING`, FE chỉ hiện nút ở `PAYMENT_PENDING`; idempotent | Không phải huỷ hợp đồng | ⚠️ Nguồn lệch: `temporal-workflows.md` mô tả WF-02a có bước refund + gọi NCC; Plan đồng bộ status (Đợt 2) đã **bỏ** `CANCELLED` khỏi Order status. BA cần chốt |
| **Huỷ hợp đồng** | KH tự huỷ HĐ **đang hoạt động**, xác thực bằng OTP SMS, có nhánh hotline CSKH (WF-02b) | Kết quả: leaf `POLICY_CANCEL_BY_CUSTOMER`; `cancellation_type = CUSTOMER_CANCEL` | Không phải huỷ đơn. Bản hiện hành KHÔNG có refund, commission, "5 loại huỷ" | Thiết kế cũ "5 loại huỷ + refund tier" đã bị loại vì sai scope (derive từ BRD, không từ SRS) |
| **NCC huỷ hợp đồng** | NCC chủ động huỷ HĐ qua portal NCC rồi callback về nền tảng | Leaf `POLICY_CANCEL_BY_INSURER` | Không gộp với `POLICY_CANCEL_BY_CUSTOMER` | Chốt Q5: giữ 2 leaf để phân biệt người huỷ |
| **Loại huỷ ở CMS (`CancellationType`)** | Loại huỷ admin chọn khi huỷ HĐ trên CMS | `CUSTOMER_CANCEL`, `ADMIN_CANCEL_REFUND` (Huỷ–Hoàn tiền), `ADMIN_CANCEL_NO_REFUND` (Huỷ không đối soát), `FREE_LOOK_CANCEL`, `INSURER_CANCEL` | Không phải lý do huỷ (`CancellationReason`: `CUSTOMER_REQUEST`, `NON_PAYMENT`, `FRAUD`, `MISREPRESENTATION`, `OTHER`) | Theo `PLAN_CMS_Quan_Ly_Hop_Dong.md` |
| **Sửa hợp đồng (Endorsement)** | Sửa thông tin hoặc quyền lợi của HĐ đã phát hành (đổi địa chỉ, người thụ hưởng, nâng/hạ quyền lợi kéo theo điều chỉnh phí). Bắt buộc eSign của KH + approval của NCC (WF-03) | 3 loại: info / coverage / beneficiary; SLA ≤ 7 ngày | Không phải "cập nhật thông tin khi `POLICY_NEED_UPDATE`" | Feature đã bị thu hẹp trong policy-service (descope G-05) → Phase 2 |
| **Callback kết quả tạo HĐ** | Webhook NCC gọi vào nền tảng để báo kết quả tạo HĐ | `ins-callback-service` nhận tại `/ins/callback/public/v1/insurer/{insurerCode}`, qua chuỗi 5 filter (size, IP whitelist, rate limit, replay, chữ ký HMAC/RSA/mTLS) rồi publish event | Callback-service **không** tự cấp HĐ hay đổi business state — chỉ verify → route → publish | |
| **Truy vấn kết quả tạo HĐ** | Tiến trình tự động chủ động hỏi NCC khi chưa nhận được kết quả cuối (bù cho callback bị miss/lag) | Chạy 5 phút/lần, tối đa 3 lượt retry; quét order `POLICY_REQUEST_TIMEOUT` hoặc `POLICY_REQUEST_SUCCESS` quá x phút | Không phải callback (callback là NCC gọi vào) | Đã chốt service sở hữu = policy-service (xem `bo-sung/plan.md`) |
| **Gửi lại yêu cầu tạo HĐ (RetryCreatePolicy)** | Tiến trình tự động gửi lại YC tạo HĐ khi lần gửi lỗi | Scheduler 30s, tối đa 3 lượt; quét `POLICY_REQUEST_FAILED` | Không phải truy vấn kết quả | |
| **Cảnh báo vận hành** | Kênh báo cho ops khi hết retry hoặc phát hiện conflict trạng thái | Phase 1 = audit `Severity.CRITICAL` + event lên topic audit | Không phải thông báo cho KH | Slack/email defer |
| **Hoàn tiền (Cashback)** | Luồng trả tiền cho KH khi HĐ bị từ chối | `CASHBACK_INIT → PROCESSING → SUCCESS / FAILED`; kiểu `AUTO`/`MANUAL` | Không phải huỷ đơn (huỷ đơn không phát sinh hoàn tiền) | Phase 1 chỉ dựng khung trạng thái, logic ở Phase 2 |
| **Voucher hold / unhold / confirm** | Giữ chỗ voucher 3 pha quanh thanh toán | Hold trước khi gọi CTT (TTL 15 phút) → unhold nếu TT fail → confirm nếu TT OK | Không phải "dùng voucher" ngay khi chọn | |
| **Mã campaign** | Mã cấu hình ở notification-service quyết định nội dung/kênh thông báo | Event kết quả tạo HĐ đẩy lên Kafka kèm mã campaign | | Chưa chốt producer gửi `campaign_code` hay notification-service tự map theo `event_type` (D6) |
| **YCBT** | Yêu cầu bồi thường (claim request) | Nút "YCBT" hiện khi HĐ đang hoạt động | | `ins-claims-service` defer Phase 2 |
| **Tenant** | Đơn vị cô lập dữ liệu. Mọi bảng có cột `tenant_id`, runtime đọc qua `TenantContext.get()`; RLS theo view | Tenant mặc định = UUID toàn số 0 | Không phải realm Keycloak | Ngoại lệ: `ins-identity-service` cross-tenant. Sản phẩm không hiện → kiểm `tenant_id` trước (LESSONS §7.5) |
| **Realm** | Nhóm người dùng trong Keycloak | `customer` (KH B2C), `tenant-admin` (nhân sự NCC dùng CMS), `internal` (nhân sự nội bộ) | Không phải tenant | CẤM tên cũ `insurer-admin` |
| **Phase 1 / Phase 2** | Phạm vi triển khai | Phase 1 (Q2–Q3 2026): 12 service, 2 app FE, 9 luồng nghiệp vụ; `uw`, `claims`, `recommendation` sang Phase 2 | | |

### 2.2. Thuật ngữ kỹ thuật & quy trình riêng của dự án

Các thuật ngữ chung (Smoke test, SIT, UAT, RTM, ADR, DoR/DoD…) dùng theo bảng 2.2 của template gốc. Bảng dưới chỉ ghi các từ dự án dùng theo nghĩa riêng.

| Thuật ngữ | Định nghĩa | Ví dụ / Ngữ cảnh | KHÔNG phải là | Ghi chú |
|---|---|---|---|---|
| **MACH** | Microservices · API-first · Cloud-native · Headless | Kiến trúc tham chiếu của toàn nền tảng | | |
| **Layer domain / application / adapter** | 3 module Maven của mỗi service. Chiều phụ thuộc duy nhất: `adapter → application → domain` | `domain` không được import Spring/JPA/Hibernate/Temporal | | ArchUnit chặn build nếu vi phạm |
| **Aggregate** | Ranh giới nhất quán. 1 transaction = 1 aggregate; mọi đổi state đi qua method của aggregate root | `Order.create(...)` (validate + sinh ID), `Order.reconstitute(...)` (từ persistence, không validate) | Không phải JPA entity (`JpaOrder` tách riêng, map qua MapStruct) | |
| **Domain event** | Sự kiện thì quá khứ, bất biến, phát từ aggregate root qua `DomainEventPublisher` | `OrderCancelled`, `PolicyCreationSucceeded` | Không được phát từ UseCase/Facade/Controller | |
| **UseCase** | Lớp điều phối ở application, implement inbound port. KHÔNG là Spring bean — tạo bằng `@Bean` trong `UseCaseConfig` | `QueryPolicyResultUseCase` | Không chứa business logic (logic ở aggregate) | |
| **Port (inbound / outbound)** | Interface hợp đồng. Inbound = lối vào use case; outbound = gọi ra hệ thống ngoài, adapter implement | `PolicyResultQueryPort`, `OrderStatusQueryPort` | | Truy code chết theo tên PORT, không theo class impl (LESSONS §3) |
| **Facade** | `@Component @Transactional` ở adapter; chỉ map DTO ↔ Command/Result và delegate | Controller → Facade → Port → UseCase → Repository | Không chứa business logic, không gọi JPA repository hay outbound adapter trực tiếp | Controller, scheduler, Kafka consumer, Temporal activity đều phải đi qua Facade |
| **Transactional Outbox** | Lưu aggregate và INSERT dòng outbox trong cùng transaction; relay polling đẩy lên Kafka sau commit | Relay `@Scheduled` đọc `PENDING` → publish → `SENT`; lỗi > 3 lần → `DEAD` | Không phải gọi `KafkaTemplate.send()` trong request (dual-write) | Phase 1 dùng polling relay, Debezium CDC defer (ADR-POL-06). Ngoại lệ có chủ đích: publisher SMS bắn Kafka trực tiếp để tin nhắn không bị cuốn theo transaction |
| **Event envelope** | Khung JSON snake_case bọc mọi event | `event_id`, `event_type`, `aggregate_id`, `tenant_id`, `correlation_id`, `occurred_at`, `payload`… | Không dùng camelCase | ⚠️ Nguồn lệch về số field (9 hay 11) và tên `version`/`event_version` giữa prompt sinh TSD và Comprehensive Reference |
| **Leaf status + `group_code`** | Mô hình trạng thái Policy đã **làm phẳng**: mỗi substatus của SRS thành 1 leaf riêng trong `policy_statuses`, cột `group_code` cho biết nhóm | SRS `POLICY_SUCCESS/ACTIVE` = leaf `POLICY_ACTIVE`, group `POLICY_SUCCESS` | KHÔNG có bảng/khái niệm `sub_status` | API trả `statusCode = group_code`, `subStatusCode = code` |
| **Saga WF-01 (Order Purchase Saga)** | Temporal workflow điều phối mua BH từ checkout tới phát hành HĐ, "all-or-nothing" với compensation | 8 step: validateOrderInput → applyVoucher → calculatePricing → capturePayment → issuePolicyAtInsurer → awaitInsurerCallback → createPolicy → sendNotification. SLA ≤ 5 phút (happy) / ≤ 7 ngày (kèm resubmit) | | Owner: purchase-service |
| **WF-02a / WF-02b / WF-03 / WF-09** | 4 workflow Temporal còn lại của Phase 1 | WF-02a huỷ đơn · WF-02b huỷ HĐ · WF-03 sửa HĐ · WF-09 đồng bộ HĐ định kỳ (daily 02:00, fallback cho callback) | "Workflow" cũ WF-06/07/08/10 đã reclassify, không phải workflow độc lập | |
| **Insurer adaptor** | Lớp ACL outbound — service **duy nhất** gọi API NCC; quy mọi giao thức NCC (SOAP/REST/File) về một schema nền tảng bất biến | Sealed outbound port per NCC; circuit breaker + retry 3× exponential backoff, timeout 10s | Không sở hữu policy state, không lưu business data | |
| **Insurer partner service** | System of record cho master data NCC | Insurer, contract tenant–NCC, product mapping, garage, metadata credential (chỉ lưu Vault path) | Không phải adaptor (không gọi API NCC) | |
| **Guard trước side-effect** | Thứ tự bắt buộc trong facade/use case: nạp entity → **tất cả guard** → gọi ngoài → ghi DB | `@Transactional` không gỡ được HĐ đã tạo qua REST, SMS đã gửi, request đã gửi NCC | | LESSONS §1 — 3 ca thật cùng một commit |
| **Best-effort** | Hàm `*BestEffort` log `warn` rồi đi tiếp | Đã gây: `createPolicyFromOrder` trả null mà luồng vẫn báo thành công | Không phải "an toàn để bỏ qua" | LESSONS §4.3 — nhóm lỗi im lặng |
| **ID-space** | `JWT sub` = `keycloak_user_id`, **khác** `customers.id` (PK domain) | purchase / policy / payment / promotion đều lưu và truyền `customer_id = JWT sub` | Không được so `customer_id` với `customers.id` | LESSONS §7.4 |
| **UUID v7** | Định dạng ID cho mọi domain ID, sinh qua `UuidValueGenerator` | DB lưu `BINARY(16)` | | |
| **VND = `Long`** | Tiền tệ lưu bằng `Long` đơn vị đồng | `amountVnd`, `refundAmountVnd` | KHÔNG dùng `BigDecimal` | |
| **`DTime`** | Value object thời gian, timezone `+07:00` | Mọi timestamp domain | Không dùng `Instant` trần | |
| **Soft delete** | Xoá mềm qua cột `deleted_at` / `deleted_time` | | Không hard delete (trừ batch cleanup) | |
| **`ddl-auto`** | Chế độ Hibernate đối chiếu schema — **khác nhau theo service và theo môi trường** | payment/identity `update`; insurer-partner/promotion/purchase `validate`; callback `none`; k8s đều `none` | | Quy tắc: gỡ code → deploy → mới DROP (LESSONS §7.1) |
| **Idempotency-Key** | Header chống xử lý trùng cho POST/PUT/DELETE có side-effect | Lưu Valkey TTL 48h | | Thiếu header từng khiến SMS hậu kiểm 400 bị nuốt im lặng |
| **`ApiResponse.of(...)`** | Envelope response REST chuẩn của thư viện `platform-libs:spring-web` | | | |
| **TSD** | Technical Specification Document — thiết kế chi tiết theo **từng service**, 9 file (00 overview + 01–08 theo 8 template) | `documents/tsd/<service>/` | Không phải SRS; không còn viết TSD theo feature | |
| **SRS / HLD** | SRS = đặc tả yêu cầu (Baseline V1 18/05/2026, V2 11/06/2026). HLD = thiết kế tổng thể | | | |
| **ADR (quy ước dự án)** | Đặt tên `ADR-<PREFIX>-<NN>-<slug>`, prefix theo service | ADR-POL-06 (polling outbox), ADR-IDENT-01 (cross-tenant) | | Mẫu 5 mục: Bối cảnh / Lựa chọn / Quyết định / Hệ quả / Tương thích kiến trúc |

### 2.3. Trạng thái Order (`order_statuses`, purchase-service)

Theo bảng chuẩn nghiệp vụ (15 status) + các status giữ thêm đã chốt. Nhãn FE lấy theo nhóm hiển thị của SRS V2.

| Trạng thái hệ thống | Nghĩa | Nhãn / nhóm FE |
|---|---|---|
| `ORDER_INIT` | Đơn vừa khởi tạo (đổi tên từ `INIT`) | Chờ thanh toán |
| `PRECHECK_PENDING` | Đang chờ kết quả precheck | — (đề xuất giữ, chờ BA xác nhận) |
| `SYSTEM_PRECHECK_SUCCESS` / `SYSTEM_PRECHECK_FAILED` | Tiền kiểm hệ thống đạt / không đạt | Chờ thanh toán / Cần chỉnh sửa |
| `PRECHECK_PARTNER_SUCCESS` / `PRECHECK_PARTNER_FAILED` | NCC chấp nhận / từ chối điều kiện | Chờ thanh toán / Cần chỉnh sửa |
| `PAYMENT_PENDING` | Đã tạo bản ghi payment, chưa gửi sang cổng | Chờ thanh toán |
| `PAYMENT_REQUEST_SUCCESS` / `PAYMENT_REQUEST_FAILED` | Mở cổng thanh toán thành công (chưa trả) / thất bại | Đang thanh toán / — |
| `PAYMENT_SUCCESS` | Đã thanh toán (đổi tên từ `PAID`) | Đang tạo hợp đồng |
| `PAYMENT_FAILED` / `PAYMENT_TIMEOUT` | Thanh toán thất bại / quá thời gian | Thanh toán thất bại / Đang thanh toán |
| `POLICY_REQUEST_SUCCESS` | Đã gửi yêu cầu phát hành HĐ, NCC ack, chờ kết quả | Đang tạo hợp đồng |
| `POLICY_REQUEST_FAILED` | Gửi yêu cầu phát hành lỗi → vào luồng gửi lại | Đang tạo hợp đồng |
| `POLICY_REQUEST_TIMEOUT` | Đang tạo HĐ nhưng quá thời gian (đổi tên từ `POLICY_ISSUE_TIMEOUT`) | Đang tạo hợp đồng |
| `POLICY_ISSUE_SUCCESS` / `POLICY_ISSUE_FAILED` | Kết quả cuối: đã tạo HĐ / tạo HĐ thất bại | Đã tạo hợp đồng / Tạo HĐ thất bại |
| `PENDING_UPDATE` | KH sửa & gửi lại sau khi bị từ chối | Cần chỉnh sửa — ⚠️ không có trong tài liệu chuẩn, chờ BA quyết giữ hay bỏ |

> Đã **bỏ** khỏi Order (chốt Q1): `CANCELLED`, `REFUND_PROCESSING`, `REFUND_SUCCEED`, `REFUND_NOT_ELIGIBLE`. Map id ↔ status phải dùng `switch` tường minh, **không** dùng `ordinal()+1`.

### 2.4. Trạng thái Policy (`policy_statuses`, policy-service — 11 leaf)

| id | Leaf (lưu DB) | `group_code` | Nhãn hiển thị | Terminal |
|---|---|---|---|---|
| 10 | `POLICY_INIT` | `POLICY_INIT` | Khởi tạo hợp đồng | không |
| 11 | `POLICY_ACTIVE` | `POLICY_SUCCESS` | Đang hoạt động | không |
| 12 | `POLICY_PENDING_APPROVAL` | `POLICY_SUCCESS` | Chờ phê duyệt hợp đồng | không |
| 13 | `POLICY_NEED_UPDATE` | `POLICY_SUCCESS` | Cần bổ sung thông tin | không |
| 14 | `POLICY_REJECTED` | `POLICY_SUCCESS` | Bị từ chối (vật chất) | có |
| 15 | `POLICY_FAILED` | `POLICY_FAILED` | Tạo hợp đồng thất bại | có |
| 16 | `POLICY_EXPIRED` | `EXPIRED` | Hết hạn | có |
| 17 | `POLICY_RENEW_SUCCESS` | `EXPIRED` | Gia hạn thành công | không (chỉ seed, logic defer) |
| 18 | `POLICY_RENEW_FAILED` | `EXPIRED` | Gia hạn thất bại | không (chỉ seed, logic defer) |
| 19 | `POLICY_CANCEL_BY_CUSTOMER` | `CANCELLED` | Đã huỷ (KH huỷ qua client) | có |
| 20 | `POLICY_CANCEL_BY_INSURER` | `CANCELLED` | Đã huỷ (NCC huỷ qua portal, callback) | có |

> "Thuộc nhóm thành công" = so `group_code = 'POLICY_SUCCESS'`; "đang active" = leaf `POLICY_ACTIVE`. Hằng id tra theo `code`, không hardcode.

## 3. Nguyên tắc đã áp dụng khi viết bảng này

- Mỗi entry có nguồn trong tài liệu dự án; chỗ các tài liệu nói khác nhau được đánh dấu ⚠️ thay vì chọn một bên.
- Tên trạng thái ghi đúng chuỗi code, kèm nhãn hiển thị.
- Tên công ty bảo hiểm thật đã thay bằng Insurer-A…F.

## 4. Ghi chú sử dụng

- SRS vẫn viết "POLICY_SUCCESS substatus = X". Khi đọc SRS phải quy đổi sang leaf status theo bảng 2.4 — **không** tạo lại khái niệm `sub_status`.
- FE gộp nhiều trạng thái BE vào một nhãn (VD "Cần chỉnh sửa" gồm `PRECHECK_PARTNER_FAILED` / `SYSTEM_PRECHECK_FAILED` / `PENDING_UPDATE`). Vì vậy FE không tự quyết hành động theo nhãn; hướng xử lý là BE trả `availableActions`.
- Date picker lưu ISO, chỉ format `dd/MM/yyyy` khi hiển thị — trộn hai dạng từng làm NCC nhận sai ngày sinh (LESSONS §9).

## 5. Checklist

- [x] Có entry cho các thuật ngữ nghiệp vụ riêng (đơn hàng, hợp đồng, GCN, TNDS, huỷ đơn/huỷ HĐ, sửa HĐ, callback, truy vấn kết quả)
- [x] Từ viết tắt chính (CTBH, NCC, KH, CTT, GCN, YCBT, TNDS, UW, TSD) có trong bảng
- [x] Tên trạng thái hệ thống ghi kèm nhãn hiển thị (§2.3, §2.4)
- [x] Realm/vai trò có entry khớp với code
- [x] Cột "KHÔNG phải là" điền cho các cặp dễ nhầm
- [ ] Không có hai entry mâu thuẫn — **chưa đạt**: còn 3 điểm ⚠️ (huỷ đơn / `CANCELLED`, `PENDING_UPDATE`, event envelope) chờ BA/Tech Lead chốt
- [ ] Nhãn FE riêng "Đã huỷ" — TODO: dự án chưa có — cần BA bổ sung (hiện `CANCELLED` map về nhãn "Bị từ chối")
- [ ] Glossary vai trò CMS chi tiết (quyền/scope như `SCOPE_policy:cancel`) — TODO: dự án chưa có bảng đầy đủ — cần Tech Lead bổ sung

## Nguồn tham chiếu

- SRS BaselineV2 (11/06/2026), `Tong_hop_Status_Nghiep_vu.docx` — tài liệu nội bộ
- `Plan_Dong_bo_Status_Order_Policy.md` (quyết định Q1–Q8, M1–M3, T1–T4, ngày 18/06/2026)
- `Plan_Truy_van_ket_qua_tao_hop_dong.md`, `FLOW_Huy_Don_Hang.md`, `PLAN_CMS_Quan_Ly_Hop_Dong.md`
- `temporal-workflows.md` + `temporal-workflows/WF-*.md`
- `Architecture.md`, `CLAUDE.md`, `LESSONS.md`, INS Comprehensive Reference — Phụ lục 9.A Glossary

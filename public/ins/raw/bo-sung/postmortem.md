---
title: Post-mortem (blameless) — ví dụ INS Platform
for: B14 bước 3 — Retrospective/Post-mortem sau sự cố lớn
owner: PM (chủ trì) · Tech Lead (R) · Người liên quan (C/I)
nguồn: templates/bo-sung/postmortem.md; LESSONS.md §4.1, §4.3, §4.4, §5; TSD purchase-service 04/06/07; gap analysis các service
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/bo-sung/postmortem.md

# Post-mortem — Field JSON lặng lẽ `null` do lệch snake_case ↔ camelCase (lặp 3 lần)

> Post-mortem **gộp** cho một lớp lỗi đã xảy ra 3 lần, thay vì 3 bản riêng. Nguồn chỉ ghi lại bài học rút gọn (LESSONS §4.1) và hiện trạng code liên quan; chi tiết từng lần (ngày, endpoint, số bản ghi) không có trong nguồn — các ô đó để TODO, **không suy đoán**.

## 0. Nguyên tắc blameless

- Tập trung vào hệ thống: cả 3 lần, người viết code làm đúng với quy ước **họ thấy ở file bên cạnh** — vấn đề là codebase có nhiều quy ước cùng lúc.
- Không dùng "ai đã gây ra" — dùng "hệ thống cho phép field `null` đi qua mà không ai biết vì…".
- Mục tiêu đầu ra là hành động có owner và hạn.

## 1. Tóm tắt

| Trường | Nội dung |
|---|---|
| Mã sự cố | INC-JSON-NAMING (gộp 3 lần) |
| Mức độ | > TODO: nguồn không phân loại mức — cần Tech Lead đánh giá lại từng lần |
| Ngày xảy ra | > TODO: nguồn không ghi ngày từng lần — cần Tech Lead bổ sung từ lịch sử ticket |
| Thời lượng ảnh hưởng | > TODO: không có trong nguồn |
| Trạng thái hiện tại | ☐ Đã khắc phục ☑ Đang theo dõi ☐ Chưa khắc phục — từng lần đã sửa tại chỗ, **nguyên nhân gốc (nhiều quy ước naming song song) vẫn còn** |
| Người viết | > TODO |
| Ngày hoàn thành | > TODO |

**Tóm tắt:** Ba lần, một field JSON nhiều từ (ví dụ kiểu `transaction_id` ↔ `transactionId`) được gửi theo một kiểu chữ trong khi bên nhận (Jackson) chờ kiểu kia. Jackson **không ném lỗi** với khoá lệch kiểu chữ — field chỉ nhận `null`, API vẫn trả 200, log không có gì bất thường. Nguyên nhân gốc: codebase đang dùng song song snake_case và camelCase ở các lớp khác nhau (REST body, query param, Kafka envelope, API NCC) mà không có kiểm tra tự động nào so khoá JSON thật với DTO.

## 2. Tác động

| Chỉ số | Số liệu |
|---|---|
| Số người dùng bị ảnh hưởng | > TODO: không có trong nguồn |
| Thời gian hệ thống không dùng được | 0 — hệ thống **không** sập; đây là lỗi dữ liệu im lặng |
| Giao dịch/đơn hàng thất bại | > TODO: không có trong nguồn |
| Dữ liệu bị mất hoặc sai | ☐ Không ☑ Có — field nhiều từ bị ghi/đọc thành `null` (chi tiết field từng lần: TODO) |
| Thiệt hại tài chính ước tính | > TODO |
| Ảnh hưởng uy tín / cam kết khách hàng | > TODO |
| Có vi phạm SLA đã cam kết? | > TODO |
| Dữ liệu cá nhân bị ảnh hưởng? | > TODO: cần xác định field bị `null` có phải PII không |

## 3. Dòng thời gian

> Nguồn không ghi mốc giờ của cả 3 lần. Không điền giờ giả định.

| Mốc (giờ) | Sự việc | Ai làm / phát hiện |
|---|---|---|
| > TODO | Lần 1 — thay đổi được deploy, field nhiều từ nhận `null` | > TODO |
| > TODO | Lần 1 — phát hiện và sửa | > TODO |
| > TODO | Lần 2 — tái diễn cùng lớp lỗi | > TODO |
| > TODO | Lần 3 — tái diễn cùng lớp lỗi | > TODO |
| (sau lần 3) | Rút thành quy tắc trong LESSONS §4.1: "field nhiều từ bị `null` bất thường → nghi naming strategy TRƯỚC" | Team |

**Câu hỏi bắt buộc cho timeline:**

- [ ] Time to detect: > TODO — đặc điểm lớp lỗi này là **không có tín hiệu tự động**, chỉ phát hiện khi có người nhìn thấy dữ liệu sai
- [ ] Time to restore: > TODO
- [x] Vì sao phát hiện chậm: không có cảnh báo nào bắn — API 200, log sạch (xem mục 4)

## 4. Phát hiện & phản ứng

| Câu hỏi | Trả lời |
|---|---|
| Phát hiện bằng cách nào? | ☐ Cảnh báo tự động ☐ Người dùng báo ☐ Vô tình phát hiện ☐ Kiểm tra định kỳ — > TODO: nguồn không ghi kênh phát hiện từng lần |
| Cảnh báo có hoạt động như thiết kế? | ☐ Có ☑ Không — không có cảnh báo nào được thiết kế cho lớp lỗi này: HTTP 200, không exception, không log lỗi |
| Quy trình leo thang có hoạt động? | > TODO |
| Điều gì khiến việc xử lý nhanh hơn? | Từ sau lần 3 có quy tắc chẩn đoán cố định: gặp field nhiều từ `null` bất thường thì kiểm naming strategy đầu tiên |
| Điều gì khiến việc xử lý chậm hơn? | (1) Không có tín hiệu lỗi. (2) Log mask giá trị thành `***` **kể cả khi giá trị là null** (LESSONS §4.4) → nhìn log tưởng có dữ liệu. (3) Theo bản năng, người debug đi tìm lỗi ở logic nghiệp vụ trước, không nghĩ tới tầng serialize |

## 5. Phân tích nguyên nhân gốc — 5 Whys

| Bước | Câu hỏi | Trả lời |
|---|---|---|
| Why 1 | Vì sao dữ liệu sai? | Một field JSON nhiều từ được deserialize thành `null` |
| Why 2 | Vì sao thành `null`? | Khoá gửi và khoá DTO chờ khác kiểu chữ (snake_case vs camelCase); Jackson bỏ qua khoá lạ mà không ném lỗi |
| Why 3 | Vì sao bên gửi dùng kiểu chữ khác? | Codebase có nhiều quy ước song song: response REST camelCase (`cartId`), query param CMS snake_case (`cycle_code`), body CMS snake_case (`transaction_id`), body lỗi trộn (`errorCode` + `data.order_id`), Kafka envelope snake_case nhờ `PropertyNamingStrategy.SNAKE_CASE` trong khi record Java camelCase, API NCC giữ tên theo `@JsonProperty` của từng NCC; TSD của một service còn yêu cầu snake_case trong khi code trả camelCase |
| Why 4 | Vì sao không bị test chặn? | Phần lớn test là unit test domain/application dựng DTO/record trực tiếp bằng constructor và mock port — **không đi qua ObjectMapper với JSON thật**; test controller (standalone MockMvc) mới có ở mức đại diện, tầng adapter chưa được đo coverage. Contract test (REST Assured + OpenAPI validator) chỉ là đặc tả target trong TSD; dependency có trong pom nhưng chưa test nào dùng |
| Why 5 | Vì sao cơ chế kiểm soát đó chưa có? | Chưa có quyết định chuẩn naming JSON toàn hệ thống cho REST body (chỉ Kafka envelope được chuẩn hoá snake_case 11 khoá), nên cũng chưa có gì để kiểm tự động theo |

**Nguyên nhân gốc:** hệ thống cho phép nhiều quy ước naming JSON tồn tại song song mà không có kiểm tra tự động so JSON thật với DTO, trong khi thư viện serialize mặc định **im lặng** với khoá lệch.

> Nguyên nhân kích hoạt (mỗi lần một field cụ thể viết sai kiểu chữ) đã được sửa tại chỗ 3 lần — và lần nào cũng tái diễn, đúng dấu hiệu "fix trigger không giải quyết vấn đề". Cách vá kiểu `@JsonAlias` nhận cả hai kiểu khoá (đang có ở endpoint SMS hậu kiểm) cũng chỉ là vá trigger.

## 6. Yếu tố góp phần

| Loại | Yếu tố | Có thể phòng ngừa? |
|---|---|---|
| Kỹ thuật | Jackson không fail với khoá lạ; nhiều naming strategy song song (xem Why 3) | ☑ Có ☐ Không |
| Quy trình | Không có quyết định (ADR) chuẩn naming REST body toàn hệ thống; mỗi TSD tự quy định | ☑ Có ☐ Không |
| Kiểm thử | Không có contract test; integration/controller test gửi JSON thật còn mỏng; unit test dựng DTO trực tiếp | ☑ Có ☐ Không |
| Giám sát | Không có chỉ số nào cho "field bắt buộc nhận null"; log mask `***` che luôn giá trị null | ☑ Có ☐ Không |
| Tài liệu | TSD có chỗ mô tả khác code (ví dụ shape lỗi RFC 7807 vs shape thực tế) → người đọc spec không tin được spec | ☑ Có ☐ Không |
| Quy trình AI | AI sinh DTO/test theo quy ước của file bên cạnh; checklist tự kiểm OpenAPI (câu 21: "tên field dùng nhất quán 1 kiểu") chưa được áp | ☑ Có ☐ Không |

## 7. Bài học & hành động khắc phục

| # | Hành động | Loại | Owner | Hạn chót | Trạng thái |
|---|---|---|---|---|---|
| 1 | Viết ADR chốt quy ước naming JSON cho REST body (từng service hay toàn hệ thống) và ghi vào TSD §7 mỗi service | Ngăn tái diễn | Tech Lead | > TODO | ☑ Mới |
| 2 | Bật contract test REST Assured + OpenAPI validator (đặc tả TSD purchase §4), gate CI khi response lệch spec | Ngăn tái diễn | > TODO | > TODO | ☑ Mới |
| 3 | Đề xuất (chưa có trong nguồn — cần Tech Lead quyết): cấu hình ObjectMapper phía test fail khi gặp khoá không khai báo, để unit/integration test bắt lệch khoá | Phát hiện sớm | Tech Lead | > TODO | ☑ Mới |
| 4 | Sửa log mask để phân biệt `null` với giá trị bị che (không in `***` cho null) | Phát hiện sớm | > TODO | > TODO | ☑ Mới |
| 5 | Thêm dòng "field nhiều từ lặng lẽ null" vào bảng sự cố runbook (INC-22) | Giảm thời gian khắc phục | DevOps | — | ☑ Xong |
| 6 | Áp checklist `rules/api-rules.md` câu 21 + C6 làm điều kiện chặn khi AI sinh spec/DTO | Ngăn tái diễn | Tech Lead | > TODO | ☑ Mới |
| 7 | Rà các chỗ đang dùng `@JsonAlias` nhận hai kiểu khoá; gỡ khi đã chốt quy ước (mục 1) | Ngăn tái diễn | > TODO | > TODO | ☑ Mới |

**Quy tắc:** mỗi hành động phải có **1 owner cụ thể** và **hạn chót** — các ô TODO ở trên phải được điền trong buổi RCA.

## 8. Vòng lặp cải tiến (B14 bước 4)

- [x] Bài học kỹ thuật → đã đưa vào `LESSONS.md` §4.1 (quy tắc chẩn đoán)
- [ ] Bài học về cách làm việc với AI (AI sao chép quy ước của file lân cận) → cập nhật `rules/api-rules.md` (đã có mục "Naming JSON") và `constitution.md`
- [ ] Bài học quy trình (thiếu ADR naming) → trình PM + Tech Lead
- [ ] Đã thông báo kết quả cho người liên quan
- [ ] Đã kiểm hành động của post-mortem **lần trước** — ở đây chính là 2 lần sửa trước đó: cả hai chỉ sửa trigger nên lớp lỗi tái diễn

## 9. Phụ lục

- Bằng chứng hiện trạng naming: TSD purchase-service `06_data-and-api-design.md` §6 (endpoint SMS hậu kiểm dùng `@JsonAlias`), §7.4 (query param snake_case), §7.7 (shape lỗi); `04_event-driven-design.md` §2.2 (envelope snake_case qua ObjectMapper); gap analysis promotion-service (L-1: response DTO camelCase trong khi TSD yêu cầu snake_case)
- Lớp lỗi im lặng liên quan: LESSONS §4.3 (best-effort nuốt lỗi), §4.4 (log mask)
- Biên bản họp RCA: > TODO
- Ticket theo dõi hành động: > TODO

## Nguồn tham chiếu

- `LESSONS.md` §4.1, §4.3, §4.4, §5.3
- TSD purchase-service `04_event-driven-design.md`, `06_data-and-api-design.md`, `07_testing-design.md`
- Google SRE Book — Postmortem Culture — https://sre.google/sre-book/postmortem-culture/
- Template gốc: `templates/bo-sung/postmortem.md`

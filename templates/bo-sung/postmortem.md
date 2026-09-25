---
title: Post-mortem (blameless)
for: B14 bước 3 — Retrospective/Post-mortem sau sự cố lớn
owner: PM (chủ trì) · Tech Lead (R) · Người liên quan (C/I)
nguồn: AI-SDLC v5.9 dòng 1134-1179 + quy trình Hotfix (dòng 1228-1243); Google SRE — Postmortem Culture
---

# Post-mortem — [Tên sự cố] · [Ngày]

> **Cách dựng:** PM chủ trì, tổ chức cuối sprint hoặc sau sự cố lớn. Tài liệu gốc yêu cầu: nếu là sự cố Severity 1 trên Production, **bắt buộc hoàn thành RCA trong vòng 48 giờ** sau khi hệ thống ổn định. Bài học liên quan quy trình AI thì cập nhật ngược vào `constitution.md` / `rules/` (B14 bước 4).

## 0. Nguyên tắc blameless

- **Tập trung vào hệ thống, không quy tội cá nhân.** Con người hành động hợp lý với thông tin họ có tại thời điểm đó.
- Không dùng từ "ai đã gây ra" — dùng "hệ thống cho phép lỗi này xảy ra vì…".
- Người liên quan phải thấy an toàn khi kể lại đầy đủ → nếu họ sợ, dòng thời gian sẽ thiếu mốc quan trọng.
- Mục tiêu đầu ra là **hành động khắc phục có owner và hạn**, không phải kết luận đúng/sai.

## 1. Tóm tắt

| Trường | Nội dung |
|---|---|
| Mã sự cố | [INC-YYYY-xxx] |
| Mức độ | ☐ S1 ☐ S2 ☐ S3 ☐ S4 |
| Ngày xảy ra | [YYYY-MM-DD HH:MM (múi giờ)] |
| Thời lượng ảnh hưởng | [X giờ Y phút] |
| Trạng thái hiện tại | ☐ Đã khắc phục ☐ Đang theo dõi ☐ Chưa khắc phục |
| Người viết | [Tên] |
| Ngày hoàn thành | [YYYY-MM-DD] — phải ≤ 48 giờ với sự cố S1 |

**Tóm tắt 2–3 câu:** [Sự việc gì xảy ra, ảnh hưởng đến ai, nguyên nhân gốc là gì.]

## 2. Tác động

| Chỉ số | Số liệu |
|---|---|
| Số người dùng bị ảnh hưởng | [Con số hoặc %] |
| Thời gian hệ thống không dùng được | [Phút] |
| Giao dịch/đơn hàng thất bại | [Con số] |
| Dữ liệu bị mất hoặc sai | ☐ Không ☐ Có — mô tả: [ ] |
| Thiệt hại tài chính ước tính | [Nếu có] |
| Ảnh hưởng uy tín / cam kết khách hàng | [Mô tả] |
| Có vi phạm SLA đã cam kết? | ☐ Không ☐ Có — mức: [ ] |
| Dữ liệu cá nhân bị ảnh hưởng? | ☐ Không ☐ Có — số lượng: [ ], **phải báo Security Lead** |

## 3. Dòng thời gian

| Mốc (giờ) | Sự việc | Ai làm / phát hiện |
|---|---|---|
| [HH:MM] | Thay đổi được deploy / sự kiện kích hoạt xảy ra | [Tên / hệ thống] |
| [HH:MM] | Dấu hiệu bất thường đầu tiên xuất hiện | [Hệ thống] |
| [HH:MM] | Cảnh báo tự động bắn ra | [Alert] |
| [HH:MM] | Người trực xác nhận sự cố | [Tên] |
| [HH:MM] | Leo thang lên cấp 2 / Tech Lead | [Tên] |
| [HH:MM] | Xác định được nguyên nhân khả dĩ | [Tên] |
| [HH:MM] | Áp dụng biện pháp giảm thiểu | [Tên] |
| [HH:MM] | Hệ thống hoạt động trở lại | [Tên] |
| [HH:MM] | Xác nhận ổn định (theo dõi ≥ 30 phút) | [Tên] |

**Câu hỏi bắt buộc cho timeline:**

- [ ] Thời gian **phát hiện** (time to detect) = bao lâu từ lúc xảy ra đến lúc biết?
- [ ] Thời gian **khắc phục** (time to restore) = bao lâu từ lúc biết đến lúc ổn?
- [ ] Nếu phát hiện chậm: vì sao cảnh báo không bắn hoặc bắn mà bị bỏ qua?

## 4. Phát hiện & phản ứng

| Câu hỏi | Trả lời |
|---|---|
| Phát hiện bằng cách nào? | ☐ Cảnh báo tự động ☐ Người dùng báo ☐ Vô tình phát hiện ☐ Kiểm tra định kỳ |
| Cảnh báo có hoạt động như thiết kế? | ☐ Có ☐ Không — lý do: [ ] |
| Quy trình leo thang có hoạt động? | ☐ Có ☐ Không — lý do: [ ] |
| Điều gì khiến việc xử lý nhanh hơn? | [ ] |
| Điều gì khiến việc xử lý chậm hơn? | [ ] |

## 5. Phân tích nguyên nhân gốc — 5 Whys

| Bước | Câu hỏi | Trả lời |
|---|---|---|
| Why 1 | Vì sao hệ thống lỗi? | [ ] |
| Why 2 | Vì sao tình trạng đó xảy ra? | [ ] |
| Why 3 | Vì sao nó không bị chặn ở bước trước? | [ ] |
| Why 4 | Vì sao cơ chế kiểm soát hiện có không phát hiện? | [ ] |
| Why 5 | Vì sao cơ chế kiểm soát đó chưa tồn tại / chưa đủ? | [ ] |

**Nguyên nhân gốc (1–2 câu):** [ ]

> Phân biệt rõ: **nguyên nhân kích hoạt** (trigger — việc xảy ra ngay trước) và **nguyên nhân gốc** (hệ thống cho phép trigger gây hậu quả). Fix trigger không giải quyết vấn đề.

## 6. Yếu tố góp phần

| Loại | Yếu tố | Có thể phòng ngừa? |
|---|---|---|
| Kỹ thuật | [Ví dụ: thiếu index; không có giới hạn input; race condition] | ☐ Có ☐ Không |
| Quy trình | [Ví dụ: deploy ngoài giờ cao điểm; bỏ qua bước kiểm thử] | ☐ Có ☐ Không |
| Kiểm thử | [Ví dụ: không có test cho đường lỗi này] | ☐ Có ☐ Không |
| Giám sát | [Ví dụ: không có cảnh báo cho chỉ số này] | ☐ Có ☐ Không |
| Tài liệu | [Ví dụ: Runbook thiếu sự cố này] | ☐ Có ☐ Không |
| Quy trình AI | [Ví dụ: AI sinh code thiếu xử lý lỗi; prompt thiếu ràng buộc; review tầng 1 bỏ sót] | ☐ Có ☐ Không |

## 7. Bài học & hành động khắc phục

| # | Hành động | Loại | Owner | Hạn chót | Trạng thái |
|---|---|---|---|---|---|
| 1 | [Thêm test cho đường lỗi đã bỏ sót] | Ngăn tái diễn | [Tên] | [YYYY-MM-DD] | ☐ Mới ☐ Đang làm ☐ Xong |
| 2 | [Thêm cảnh báo cho chỉ số X ở ngưỡng Y] | Phát hiện sớm | [Tên] | [YYYY-MM-DD] | ☐ |
| 3 | [Bổ sung mục mới vào Runbook] | Giảm thời gian khắc phục | [Tên] | [YYYY-MM-DD] | ☐ |
| 4 | [Cập nhật `rules/`/`constitution.md` cho quy trình AI] | Ngăn tái diễn | Tech Lead | [YYYY-MM-DD] | ☐ |
| 5 | [Thêm kiểm tra vào CI] | Ngăn tái diễn | [Tên] | [YYYY-MM-DD] | ☐ |

**Quy tắc:** mỗi hành động phải có **1 owner cụ thể** (không phải "cả team") và **hạn chót**. Hành động không có owner là hành động sẽ không xảy ra.

## 8. Vòng lặp cải tiến (B14 bước 4)

- [ ] Bài học kỹ thuật không thuộc quy trình AI → cập nhật vào tài liệu kỹ thuật/`CODING_CONVENTION.md`
- [ ] Bài học liên quan **cách làm việc với AI** (prompt, phạm vi quyền, review tự động bỏ sót) → cập nhật `constitution.md` / `rules/`
- [ ] Bài học về quy trình (gate nào bị vượt, bước nào thiếu) → đề xuất sửa quy trình, trình PM + Tech Lead
- [ ] Đã thông báo kết quả cho người liên quan (không để post-mortem nằm im trong thư mục)
- [ ] Đã kiểm tra hành động khắc phục của post-mortem **lần trước** đã hoàn thành chưa

## 9. Phụ lục

- Log/evidence liên quan: [Đường dẫn]
- Biên bản họp RCA: [Đường dẫn]
- Ticket theo dõi hành động: [Link]

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 2 B14, B13, và quy trình Hotfix Production (mục 3) — tài liệu gốc nội bộ
- Google SRE Book — Postmortem Culture: Learning from Failure — https://sre.google/sre-book/postmortem-culture/
- Google SRE Book — Ví dụ post-mortem thực tế — https://sre.google/sre-book/example-postmortem/
- Google SRE Workbook — Postmortem template — https://sre.google/workbook/postmortem-culture/
- Etsy Debriefing Facilitation Guide (blameless) — https://www.etsy.com/codeascraft/debriefing-facilitation-guide

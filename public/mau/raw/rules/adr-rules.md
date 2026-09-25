---
title: Linter cho ADR — rules/adr-rules.md
for: B6 bước 2 (AI tự kiểm ADR) trước khi Tech Lead review
owner: AI (tự kiểm) · Tech Lead (A/R)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.11; MADR (adr.github.io/madr)
---

# rules/adr-rules.md — Checklist AI tự kiểm ADR

## Mục đích

ADR viết xong nhưng thiếu bối cảnh hoặc không nêu phương án đã cân nhắc thì **không dùng được** khi 6 tháng sau có người hỏi "sao lại làm thế này". Linter này chặn điều đó trước khi ADR vào repo.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B6 bước 1 — sau khi AI đề xuất kiến trúc | AI | ADR nháp + `adr-template.md` |
| B6 bước 2 — tự kiểm trước khi trình Tech Lead | AI | ADR đã điền |
| B6 bước 3 — Tech Lead review | Tech Lead | ADR + `constitution.md` |
| Gate 2 trước khi ký | Tech Lead | Toàn bộ ADR của dự án |

**Quy tắc:** AI tự kiểm và báo cáo Đạt/Không đạt. Không đạt thì sửa ngay, không trình Tech Lead với ADR còn lỗi.

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Vì sao chặn |
|---|---|---|
| C1 | ADR phải nêu **ít nhất 2 phương án** đã cân nhắc. Chỉ 1 phương án thì phải ghi rõ lý do (ràng buộc cứng, không có lựa chọn) | ADR không có phương án là "biên bản hợp thức hoá", không phải bản ghi quyết định |
| C2 | `Consequences` phải có **cả mặt tốt lẫn mặt xấu** | Chỉ ghi mặt tốt = che giấu đánh đổi |
| C3 | ADR **không được mâu thuẫn** với `constitution.md` | Mâu thuẫn = phá luật dự án đã ký |
| C4 | ADR không được mô tả chi tiết đến mức thành tài liệu thiết kế (code, schema đầy đủ) | ADR là **quyết định**, thiết kế chi tiết thuộc `plan.md` |
| C5 | Phải có trạng thái (status) hợp lệ: proposed / accepted / rejected / deprecated / superseded by ADR-xxx | Không biết ADR nào còn hiệu lực |

## Checklist tự kiểm

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | Có frontmatter đủ: status, date, decision-makers, consulted, informed? | | |
| 2 | Tiêu đề nêu **vấn đề đã giải quyết** (không phải tên công nghệ chung chung)? | | |
| 3 | `Context and Problem Statement` mô tả bối cảnh trong 2–3 câu, có nêu vấn đề dạng câu hỏi? | | |
| 4 | Có mục `Decision Drivers` (các yếu tố ràng buộc: chất lượng mong muốn, hạn chế, force)? | | |
| 5 | Có **≥ 2 phương án** trong `Considered Options`? | | |
| 6 | Mỗi phương án có ưu điểm và nhược điểm cụ thể (không chỉ "tốt hơn")? | | |
| 7 | `Decision Outcome` nêu rõ phương án được chọn **và lý do** gắn với driver nào? | | |
| 8 | `Consequences` có cả Good và Bad? | | |
| 9 | Có phương án nào bị loại mà **lý do loại không rõ**? | | |
| 10 | ADR có mâu thuẫn với nguyên tắc nào trong `constitution.md`? | | |
| 11 | Nếu mâu thuẫn — đã có ADR/quy trình tu chính constitution chưa? | | |
| 12 | ADR có gắn với bước nào của quy trình (B6) và ảnh hưởng file nào (plan.md, api-rules)? | | |
| 13 | Có tham chiếu chéo tới ADR liên quan đã có (supersedes / superseded by)? | | |
| 14 | Ngôn ngữ có tránh mô tả code chi tiết (đó là việc của plan.md)? | | |
| 15 | Đã ghi rõ ai là decision-maker (một người chịu trách nhiệm, không phải "cả team")? | | |
| 16 | Ngày cập nhật có đúng và theo định dạng ISO (YYYY-MM-DD)? | | |
| 17 | Nếu trạng thái là `superseded` — đã ghi rõ số ADR thay thế chưa? | | |
| 18 | Có mục Links tới issue/PR/tài liệu liên quan? | | |

**Ngưỡng đạt:** C1–C5 = Đạt và số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**Decision Outcome — SAI:**
> Chúng tôi chọn PostgreSQL vì nó tốt và phổ biến.

Không gắn với driver nào, không so sánh với phương án khác → đọc lại 6 tháng sau không biết tại sao.

**Decision Outcome — ĐÚNG:**
> Chọn **PostgreSQL 16** vì đáp ứng driver "cần truy vấn phân tích trên dữ liệu giao dịch mà không phải đồng bộ sang kho dữ liệu riêng" (driver 2) và đội đã có kinh nghiệm vận hành. Phương án MongoDB bị loại vì không đáp ứng yêu cầu giao dịch ACID đa bảng ở FR-014.

**Consequences — SAI:**
> * Tốt: nhanh, ổn định.

**Consequences — ĐÚNG:**
> * Tốt: đáp ứng ACID cho luồng thanh toán; đội vận hành đã quen.
> * Xấu: phải tự cấu hình replication và backup, tốn ~0.5 ngày công ban đầu; không scale ngang dễ như NoSQL nếu lượng ghi tăng gấp 10.

**Context — SAI:**
> Cần chọn database.

**Context — ĐÚNG:**
> Hệ thống cần lưu đơn hàng và giao dịch thanh toán (FR-001 đến FR-014). Câu hỏi: chọn loại database nào để vừa đảm bảo tính toàn vẹn giao dịch, vừa đủ nhanh cho báo cáo doanh thu theo ngày, trong khi đội chỉ có 2 backend và không có DevOps chuyên trách?

## Khi nào tự động CHẶN (block)

Không được commit ADR vào repo / không được trình Gate 2 nếu:

- [ ] Có 0 hoặc 1 phương án mà không ghi lý do ràng buộc cứng (C1)
- [ ] `Consequences` chỉ có mặt tốt (C2)
- [ ] ADR mâu thuẫn `constitution.md` mà không có ADR tu chính kèm theo (C3)
- [ ] Thiếu frontmatter `status` hoặc status không hợp lệ (C5)
- [ ] Không ghi decision-maker cá nhân (câu hỏi 15)

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.11 — tài liệu gốc nội bộ
- MADR — Markdown Architectural Decision Records — https://adr.github.io/madr/
- MADR Template — https://github.com/adr/madr/blob/develop/template/adr-template.md
- ADR Templates tổng hợp — https://adr.github.io/adr-templates/
- Michael Nygard, "Documenting Architecture Decisions" — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

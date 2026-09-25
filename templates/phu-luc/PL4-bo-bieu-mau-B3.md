---
title: "PL4 — Bộ biểu mẫu cho bước B3 (5 mẫu)"
for: "B3. Thu thập & phân tích yêu cầu (Giai đoạn 1 — Yêu cầu)"
owner: "BA (R/A) · PO/khách hàng (C — xác nhận) · AI (ghi họp, sinh nháp)"
nguồn: "AI-SDLC v5.9 Phụ lục 4 (mục 4.1–4.5); BABOK v3 (IIBA); BPMN 2.0 (OMG)"
---

# PL4 — Bộ biểu mẫu cho bước B3 (chỉ mục 5 mẫu)

> **Cách dựng:** B3 tạo ra 3 tài liệu đầu ra — BRD, Biên bản họp, Process flow/User journey. Để có đủ 3 tài liệu đó, BA cần 5 mẫu dưới đây (khớp 1-1 với cột "Biểu mẫu sử dụng" trong bảng chi tiết từng bước của B3). Bảng này ánh xạ từng bước của B3 sang mẫu cần dùng.

## Ánh xạ bước B3 → biểu mẫu

| Bước | Người thực hiện | Việc làm | Biểu mẫu dùng |
|---|---|---|---|
| 1 | BA | Chọn kỹ thuật phù hợp & lên lịch (không mặc định luôn phỏng vấn) | [4.1 Hướng dẫn phỏng vấn](b3/4.1-interview-guide.md) |
| 2 | AI (Fireflies/Otter) + BA | Ghi âm (xin phép trước), lấy transcript, đưa vào prompt B3 → BRD nháp | [4.2 Biên bản họp](b3/4.2-bien-ban-hop.md) |
| 3 | BA | Tự kiểm BRD theo từng câu hỏi trong linter; mục nào Không đạt phải sửa **ngay tại chỗ** | [`rules/brd-rules.md`](rules/brd-rules.md) |
| 4 | AI (vẽ nháp) + BA (review) | Vẽ luồng nghiệp vụ; luồng >3 actor hoặc >2 điểm rẽ nhánh → bắt buộc BPMN đầy đủ | [4.4 Process Flow / User Journey](b3/4.4-process-flow-user-journey.md) + [`rules/bpm-rules.md`](rules/bpm-rules.md) |
| 5 | BA | Cập nhật thuật ngữ mới vào glossary (ngay trong B3, không chờ) | [`b2/glossary.md`](b2/glossary.md) |
| 6 | BA → PO/khách hàng | Gửi BRD xác nhận sơ bộ qua kênh chính thức, nêu rõ thời hạn phản hồi 2–3 ngày | [4.3 BRD](b3/4.3-BRD.md) |
| Xử lý xung đột | BA | Khi các bên ý kiến trái nhau, ghi lại và chốt người quyết định | [4.5 Q&A Log](b3/4.5-QA-log.md) |

---

## 5 mẫu chi tiết

### 4.1 — Hướng dẫn phỏng vấn / Interview Guide

| Trường | Nội dung |
|---|---|
| File mẫu | [`b3/4.1-interview-guide.md`](b3/4.1-interview-guide.md) |
| Ai dựng | BA soạn riêng cho **mỗi** buổi — không dùng chung một bộ câu hỏi cứng |
| Dựa trên chuẩn | BABOK v3 (IIBA) — chương Techniques: Interview, Workshop, Document Analysis, Observation, Prototyping |
| Nội dung chính | Bảng chọn kỹ thuật theo tình huống; bộ câu hỏi mở theo chủ đề; nguyên tắc không dẫn dắt; checklist trước–trong–sau buổi |
| Điểm quan trọng | **Không mặc định luôn phỏng vấn** — chọn đúng kỹ thuật tiết kiệm thời gian hơn nhiều |

### 4.2 — Biên bản họp / Workshop

| Trường | Nội dung |
|---|---|
| File mẫu | [`b3/4.2-bien-ban-hop.md`](b3/4.2-bien-ban-hop.md) |
| Ai dựng | AI (Fireflies/Otter) ghi tự động → BA rà soát và xác nhận |
| Dựa trên chuẩn | BABOK v3 — Requirements Elicitation & Confirmation |
| Nội dung chính | Phân biệt **rõ ràng phát biểu gốc vs phần AI diễn giải**; người xác nhận; action items có owner + hạn; quyết định đã chốt |
| Điểm quan trọng | Chỗ AI tóm tắt còn nghi ngờ **phải nghe lại đúng đoạn ghi âm gốc** (bắt buộc theo tài liệu gốc) |

### 4.3 — BRD (Business Requirement Document)

| Trường | Nội dung |
|---|---|
| File mẫu | [`b3/4.3-BRD.md`](b3/4.3-BRD.md) |
| Ai dựng | BA (AI hỗ trợ trích xuất từ transcript) |
| Dựa trên chuẩn | BABOK v3 (IIBA); User Story theo INVEST; Acceptance Criteria theo Gherkin |
| Nội dung chính | Business context; Stakeholder; mục tiêu kinh doanh; FR có mã; NFR **định lượng được**; User Story + AC; ưu tiên MoSCoW; giả định; rủi ro & đối sách; tiêu chí nghiệm thu |
| Điểm quan trọng | NFR phải có số cụ thể (VD: ≤ 2 giây, ≥ 99.5%) — không viết "nhanh", "ổn định" |

### 4.4 — Process Flow / User Journey

| Trường | Nội dung |
|---|---|
| File mẫu | [`b3/4.4-process-flow-user-journey.md`](b3/4.4-process-flow-user-journey.md) |
| Ai dựng | AI vẽ nháp → BA review |
| Dựa trên chuẩn | BPMN 2.0 (OMG) |
| Nội dung chính | Bảng As-is/To-be đối chiếu; quy tắc ký hiệu (oval/chữ nhật/hình thoi); Process Flow dạng Mermaid; User Journey Map rút gọn |
| Điểm quan trọng | Luồng **>3 actor hoặc >2 điểm rẽ nhánh → bắt buộc BPMN đầy đủ**; không để **nhánh cụt**; mọi Gateway phải có **nhãn điều kiện** |

### 4.5 — Q&A Log

| Trường | Nội dung |
|---|---|
| File mẫu | [`b3/4.5-QA-log.md`](b3/4.5-QA-log.md) |
| Ai dựng | BA khởi tạo ngay khi có câu hỏi mở đầu tiên (có thể sớm từ B3) |
| Vòng đời sử dụng | B3 → B5: tổng hợp và chốt cùng lúc với Spec |
| Nội dung chính | ID; câu hỏi/vấn đề; ngày nêu; người nêu; **ý kiến các bên khi xung đột**; người quyết định; quyết định + ngày; trạng thái; tài liệu ảnh hưởng |
| Điểm quan trọng | Đây là **nguồn chính thức duy nhất** trả lời "ai quyết định gì, khi nào" — **không thay thế bằng chat rời rạc trên Slack/Teams/Zalo** |

---

## Checklist hoàn thành B3

- [ ] Đã chọn kỹ thuật thu thập phù hợp và có lý do (không mặc định phỏng vấn)
- [ ] Đã **xin phép trước khi ghi âm** buổi họp
- [ ] Biên bản họp phân biệt rõ phát biểu gốc vs AI diễn giải
- [ ] Chỗ AI tóm tắt nghi ngờ đã được nghe lại ghi âm gốc
- [ ] BRD đã **tự kiểm qua `rules/brd-rules.md`**, không còn mục "Không đạt"
- [ ] Process Flow đã kiểm qua `rules/bpm-rules.md`: không nhánh cụt, gateway có nhãn
- [ ] Luồng >3 actor hoặc >2 điểm rẽ nhánh đã vẽ BPMN đầy đủ (có swimlane)
- [ ] Thuật ngữ mới đã thêm vào `glossary.md` ngay trong B3
- [ ] BRD đã gửi PO/khách hàng xác nhận sơ bộ, có nêu thời hạn phản hồi
- [ ] Mọi câu hỏi mở & xung đột ý kiến đã ghi vào Q&A Log kèm người quyết định
- [ ] *(Đây chưa phải Human Gate chính thức — Gate 1 nằm ở B5)*

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 4 (mục 4.1–4.5) và mục 2 B3 — tài liệu gốc nội bộ
- BABOK v3, IIBA — https://www.iiba.org/
- BPMN 2.0, OMG — https://www.omg.org/spec/BPMN/
- INVEST criteria — https://www.agilealliance.org/glossary/invest/
- Gherkin (Cucumber) — https://cucumber.io/docs/gherkin/

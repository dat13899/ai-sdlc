---
title: Linter cho BPMN — rules/bpm-rules.md
for: B3 bước 4 (Vẽ luồng nghiệp vụ) + B4
owner: BA (tự kiểm) · AI (sinh nháp) · Tech Lead (C)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.10; BPMN 2.0 (OMG); BABOK v3 (IIBA)
---

# rules/bpm-rules.md — Linter cho sơ đồ BPMN / Process Flow

## Mục đích

Chặn các sơ đồ luồng nghiệp vụ **không thể chuyển thành spec/code** ngay tại B3 — trước khi chúng thành đầu vào của `spec.md` (B4) và `plan.md` (B6).

Sơ đồ thiếu nhãn hoặc có nhánh cụt là nguyên nhân phổ biến nhất của việc dev phải hỏi lại giữa sprint.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B3 bước 4 — sau khi AI vẽ nháp, trước khi BA gửi PO xác nhận | BA | `4.4-process-flow-user-journey.md` đã điền |
| B5 — khi đối chiếu Spec với luồng nghiệp vụ | BA + AI | spec.md + sơ đồ |
| B6 — trước khi Tech Lead ký Gate 2 | AI (tự kiểm) | plan.md có tham chiếu luồng |

Cách dùng: chạy lần lượt từng câu hỏi, đánh dấu Đạt/Không đạt, **sửa ngay tại chỗ ở B3** — không dồn sang bước sau.

## Quy tắc bắt buộc

| # | Quy tắc | Vì sao chặn |
|---|---|---|
| C1 | **Không có nhánh cụt** — mọi Gateway phải có ít nhất 1 đường vào và 1 đường ra | Nhánh cụt = tình huống không có xử lý → dev tự bịa |
| C2 | **Mọi Gateway phải có nhãn điều kiện** trên từng nhánh ra | Gateway không nhãn = không biết rẽ khi nào |
| C3 | Luồng > 3 actor hoặc > 2 điểm rẽ nhánh → **bắt buộc BPMN đầy đủ** (swimlane), không dùng User Journey Map rút gọn | Bản rút gọn mất trách nhiệm của từng actor |
| C4 | Mọi bước phải ghi rõ **actor thực hiện** (người/hệ thống) | Bước "vô chủ" không phân công được |
| C5 | Có điểm bắt đầu và điểm kết thúc rõ ràng (không mở vô định) | Không biết luồng kết thúc khi nào là xong |

## Checklist tự kiểm

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | Sơ đồ có đúng 1 điểm bắt đầu (oval "Bắt đầu") và ít nhất 1 điểm kết thúc? | | |
| 2 | Có bước nào không rõ actor thực hiện (người hay hệ thống)? | | |
| 3 | Mỗi hình thoi (Gateway) đã có nhãn điều kiện ở **tất cả** nhánh ra chưa? | | |
| 4 | Có nhánh ra nào không dẫn tới đâu (nhánh cụt)? | | |
| 5 | Có nhánh vào nào không xuất phát từ đâu? | | |
| 6 | Số actor tham gia là bao nhiêu? Nếu > 3 đã dùng swimlane chưa? | | |
| 7 | Số điểm rẽ nhánh (Gateway) là bao nhiêu? Nếu > 2 đã vẽ BPMN đầy đủ chưa? | | |
| 8 | Ký hiệu dùng có đúng BPMN 2.0 (oval/chữ nhật/hình thoi)? | | |
| 9 | Tên bước dùng **động từ + đối tượng** ("Duyệt đơn", không phải "Đơn hàng")? | | |
| 10 | Có bước nào mô tả chung chung kiểu "Xử lý dữ liệu" mà không nói xử lý gì? | | |
| 11 | Mọi đường ngoại lệ đã có nhánh xử lý (lỗi, timeout, huỷ giữa chừng)? | | |
| 12 | Có bước nào trùng chức năng với bước khác (lặp không cần thiết)? | | |
| 13 | Trạng thái dữ liệu quan trọng có được đánh dấu (tạo/sửa/xoá bản ghi nào)? | | |
| 14 | Luồng As-is và To-be đã đối chiếu và chỉ ra **khác biệt cụ thể** chưa? | | |
| 15 | Mọi thuật ngữ trong sơ đồ có khớp `glossary.md`? | | |
| 16 | User Journey Map (nếu có) có khớp số bước với Process Flow không? | | |
| 17 | Đã có phần ghi chú các quyết định thiết kế luồng (ai chốt, ở Q&A Log nào)? | | |
| 18 | Sơ đồ đã được PO/khách hàng xác nhận bằng văn bản chưa? | | |

**Ngưỡng đạt:** toàn bộ C1–C5 = Đạt và không còn câu hỏi nào ở trạng thái "Không đạt".

## Ký hiệu BPMN 2.0 được dùng trong dự án

| Ký hiệu | Tên | Dùng khi |
|---|---|---|
| Oval (bo tròn) | Start / End Event | Bắt đầu và kết thúc luồng |
| Chữ nhật | Task / Activity | Một hành động cụ thể do người hoặc hệ thống làm |
| Hình thoi | Gateway | Điểm rẽ nhánh — **bắt buộc có nhãn điều kiện** |
| Chữ nhật có góc gấp | Sub-process | Nhóm bước gộp (có sơ đồ con riêng) |
| Dải ngang/dọc | Swimlane / Pool | Phân biệt actor — bắt buộc khi > 3 actor |
| Mũi tên đứt | Message Flow | Trao đổi giữa 2 hệ thống/tổ chức khác nhau |

## Ví dụ ĐÚNG vs SAI

**Gateway thiếu nhãn — SAI:**
```
[Kiểm tra hạn mức] --> <> --> [Duyệt tự động]
                       |
                       +--> [Chuyển duyệt cấp 2]
```
Không biết điều kiện nào rẽ sang nhánh nào → dev phải đoán.

**Gateway có nhãn — ĐÚNG:**
```
[Kiểm tra hạn mức] --> <Số tiền <= 50 triệu?> --Có--> [Duyệt tự động]
                                        |
                                        +--Không--> [Chuyển duyệt cấp 2]
```

**Nhánh cụt — SAI:**
```
<Ký hợp đồng thành công?> --Có--> [Tạo dự án]
                           |
                           +--Không--> (không có gì)
```
Khách không ký nữa thì hệ thống làm gì? → phải có nhánh "Đóng cơ hội + ghi lý do".

**Bước vô chủ — SAI:** `[Duyệt yêu cầu]` (ai duyệt? hệ thống hay người?)
**ĐÚNG:** `[Trưởng phòng duyệt yêu cầu]` hoặc `[Hệ thống tự duyệt theo hạn mức]`.

## Khi nào tự động CHẶN (block)

Điều kiện cứng — **không được vượt qua**, kể cả khi có lý do "tiến độ gấp". Các mục này trùng với bảng Quy tắc bắt buộc ở trên; ở đây nêu rõ **hệ quả cụ thể** khi vi phạm.

| # | Điều kiện chặn | Hệ quả nếu vi phạm | Ai chặn |
|---|---|---|---|
| 1 | Còn **nhánh cụt** (Gateway không có đường ra, hoặc đường đi vào ngõ cụt) | Dev tự bịa xử lý cho tình huống chưa định nghĩa → sinh lỗi ở Production | BA (tự chặn) · AI báo lỗi |
| 2 | Có **Gateway thiếu nhãn điều kiện** ở bất kỳ nhánh ra | Không biết rẽ nhánh khi nào → test không viết được case, code sai logic | BA · Test Lead |
| 3 | Luồng **> 3 actor hoặc > 2 điểm rẽ nhánh** nhưng chỉ vẽ bản rút gọn | Mất trách nhiệm từng actor; bỏ sót luồng ngoại lệ | BA (tự chặn) |
| 4 | Có bước **không ghi actor** (ai làm: vai trò nào / hệ thống) | Không phân công được, không biết test ai kiểm | BA · PO |
| 5 | **Thiếu điểm bắt đầu hoặc điểm kết thúc** | Không biết luồng kết thúc khi nào là xong | BA |
| 6 | **Không có bảng As-is/To-be** đối chiếu | Không chứng minh được cải thiện gì; khách không thấy giá trị | BA · PO |
| 7 | **Không gửi PO/khách hàng xác nhận** bằng văn bản | Luồng sai được phát hiện muộn ở UAT → sửa tốn kém | PO (Gate 1) |

**Nguyên tắc:** nếu bất kỳ mục 1–6 ở trên "Không đạt", BA **không được chuyển tài liệu sang B4**. Sửa tại chỗ ở B3 — dồn sang bước sau sẽ khiến spec, plan, test đều dựa trên luồng sai.

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.10 (rules/bpm-rules.md) — tài liệu gốc nội bộ
- BPMN 2.0 Specification, Object Management Group — https://www.omg.org/spec/BPMN/
- BPMN 2.0 Quick Guide (sơ đồ ký hiệu) — https://www.bpmnquickguide.com/
- BABOK v3, IIBA — chương Techniques, mục Process Modelling — https://www.iiba.org/

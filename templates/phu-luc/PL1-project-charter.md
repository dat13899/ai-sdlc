---
title: "PL1 — Project Charter & Kick-off"
for: "B1. Project Charter & Kick-off (Giai đoạn 0 — Khởi tạo)"
owner: "PM (R/A) · Sponsor/PO (A — ký duyệt) · AI (draft)"
nguồn: "AI-SDLC v5.9 Phụ lục 1 + mục 2 B1; PMBOK Guide (PMI)"
---

# PL1 — Project Charter & Kick-off

> **Cách dựng:** PM lên lịch họp kick-off (gửi agenda trước tối thiểu 1 ngày), AI ghi âm và tóm tắt thành biên bản nháp, PM dùng Claude/ChatGPT draft cả 3 tài liệu từ bản tóm tắt đó, PM rà soát đối chiếu thực tế ngân sách/phạm vi rồi trình Sponsor/PO ký. **AI chỉ draft — PM chịu trách nhiệm nội dung cuối cùng và không được để AI tự quyết định số liệu ngân sách/phạm vi.**

---

## Phần 1 — Project Charter

### 1.1. Thông tin chung

| Trường | Nội dung |
|---|---|
| Tên dự án | [Tên dự án] |
| Mã dự án | [Mã] |
| Project Manager | [Tên] |
| Sponsor | [Tên] |
| Product Owner | [Tên] |
| Tech Lead | [Tên] |
| Ngày bắt đầu | [YYYY-MM-DD] |
| Ngày kết thúc dự kiến | [YYYY-MM-DD] |
| Loại dự án | ☐ Nội bộ ☐ Cho khách hàng (outsource) ☐ Sản phẩm |
| Có dữ liệu khách hàng / NDA? | ☐ Có ☐ Không — nếu có, bắt buộc qua đánh giá ATTT công cụ AI |

### 1.2. Mục tiêu dự án (SMART)

Mỗi mục tiêu phải **cụ thể, đo được, khả thi, liên quan, có hạn**.

| # | Mục tiêu | Chỉ số đo (KPI) | Hiện tại | Mục tiêu | Hạn |
|---|---|---|---|---|---|
| 1 | [Giảm thời gian xử lý đơn hàng] | [Thời gian trung bình/đơn] | [10 phút] | [≤ 2 phút] | [YYYY-MM-DD] |
| 2 | [Có kênh tiếp nhận yêu cầu trực tuyến] | [Tỷ lệ yêu cầu vào hệ thống] | [0%] | [≥ 80%] | [YYYY-MM-DD] |
| 3 | [ ] | [ ] | [ ] | [ ] | [ ] |

### 1.3. Phạm vi dự án

**In-scope (làm trong dự án này):**

- [ ]
- [ ]

**Out-of-scope (KHÔNG làm — ghi rõ để tránh hiểu nhầm về sau):**

- [ ]
- [ ]

> Ghi rõ out-of-scope quan trọng hơn in-scope: phần lớn tranh chấp phạm vi đến từ việc hai bên hiểu khác nhau về những gì **không** được làm.

### 1.4. Ngân sách dự kiến

| Khoản | Số tiền | Ghi chú |
|---|---|---|
| Nhân sự (ngày công × đơn giá) | [ ] | |
| Hạ tầng / cloud / tên miền | [ ] | |
| Công cụ AI (seat/API) | [ ] | Theo `ai-tool-scope.md` |
| Kiểm thử bảo mật độc lập (nếu cần) | [ ] | Bắt buộc nếu chạm dữ liệu cá nhân/thanh toán |
| Dự phòng (10–20%) | [ ] | |
| **Tổng** | **[ ]** | |

> ⚠️ Số liệu ngân sách **do PM/Sponsor quyết định** — AI không được tự điền hoặc suy đoán.

### 1.5. Các mốc thời gian quan trọng (Milestones)

| STT | Mốc | Ngày dự kiến | Đầu ra (Deliverables) | Gate |
|---|---|---|---|---|
| 1 | Chốt Spec (Gate 1) | [Ngày] | Tài liệu Spec được ký duyệt | ⛔ Gate 1 — PO/PM ký |
| 2 | Chốt Kiến trúc (Gate 2) | [Ngày] | Technical Plan & C4 Model | ⛔ Gate 2 — Tech Lead duyệt |
| 3 | Sẵn sàng UAT (Gate 4a/4b/4c đạt) | [Ngày] | Hệ thống deploy lên Staging; ATTT & Hiệu năng đạt | ⛔ Gate 4a/4b/4c |
| 4 | UAT Sign-off (Gate 4) | [Ngày] | Biên bản UAT ký bởi PO | ⛔ Gate 4 — PO ký |
| 5 | Go-live (Gate 5: Go/No-Go) | [Ngày] | Triển khai Production + Hypercare | ⛔ Gate 5 — họp Go/No-Go |

### 1.6. Rủi ro cấp dự án

| # | Rủi ro | Ảnh hưởng | Khả năng | Mức | Đối sách | Owner |
|---|---|---|---|---|---|---|
| 1 | [Thiếu người có quyền quyết định ở các buổi chốt] | Cao | Trung bình | Cao | Chốt lịch gate với Sponsor/PO từ lúc kick-off | PM |
| 2 | [Phạm vi phình ra giữa dự án] | Cao | Cao | Cao | Mọi thay đổi qua PL2 Change Request | PM |
| 3 | [Dữ liệu sẵn có bẩn, cần làm sạch] | Trung bình | Cao | Trung bình | Khảo sát dữ liệu ở B3, tính ngày công vào kế hoạch | BA |
| 4 | [Đối tác không cung cấp API đúng hạn] | Cao | Trung bình | Cao | Ghi vào giả định, có phương án mock | Tech Lead |
| 5 | [ ] | | | | | |

### 1.7. Tiêu chí thành công của dự án

- [ ] Tất cả mốc Gate 1–5 đạt đúng tiêu chí đã định
- [ ] Không còn bug S1–S2 khi go-live (Zero-Bug với lỗi nghiêm trọng)
- [ ] Đạt chỉ số KPI mục 1.2
- [ ] Bàn giao đầy đủ tài liệu (constitution, Runbook, Post-mortem quy trình)
- [ ] Nghiệm thu có chữ ký (PL6)

---

## Phần 2 — Stakeholder Register

| # | Họ và tên | Vai trò trong dự án | Đơn vị | Mức ảnh hưởng | Quan tâm điều gì | Cách tương tác |
|---|---|---|---|---|---|---|
| 1 | [Tên] | Sponsor | [ ] | Cao | Ngân sách, tiến độ, kết quả kinh doanh | Báo cáo theo mốc, ký duyệt Charter |
| 2 | [Tên] | Product Owner | [ ] | Cao | Giá trị nghiệp vụ, mức độ đáp ứng nhu cầu | Họp hằng tuần, ký Gate 1/4 |
| 3 | [Tên] | Người dùng cuối | [ ] | Trung bình | Tính dễ dùng, tốc độ | UAT (Gate 4), phỏng vấn ở B3 |
| 4 | [Tên] | Quản trị hệ thống CNTT | [ ] | Trung bình | Bảo mật, khả năng vận hành, hạ tầng | Review ATTT (Gate 4b) |
| 5 | [Tên] | Kế toán / Tài chính | [ ] | Trung bình | Tính đúng đắn số liệu, lưu vết | Xác nhận quy tắc nghiệp vụ (B3) |
| 6 | [Tên] | Đơn vị pentest (nếu có) | [ ] | Thấp | Phạm vi kiểm thử | Gate 4b |

**Ai là người quyết định cuối (A) cho từng loại vấn đề:**

| Loại vấn đề | Người quyết định |
|---|---|
| Phạm vi, ưu tiên tính năng | PO |
| Ngân sách, nhân sự, tiến độ | Sponsor + PM |
| Kiến trúc kỹ thuật | Tech Lead |
| Nghiệm thu cuối | PO / khách hàng |
| Điều kiện bảo mật để go-live | Security Lead |

---

## Phần 3 — Communication Plan

| STT | Loại thông tin | Đối tượng nhận | Tần suất | Kênh | Người gửi |
|---|---|---|---|---|---|
| 1 | Tiến độ sprint | Toàn đội | Hằng tuần | [Họp + ghi chú] | PM |
| 2 | Báo cáo mốc Gate | Sponsor, PO | Theo mốc | [Email/Confluence] | PM |
| 3 | Thay đổi phạm vi | PO, PM, Tech Lead | Khi phát sinh | PL2 Change Request | Người đề xuất |
| 4 | Sự cố Production | PM, PO, Tech Lead | Ngay lập tức | Kênh sự cố | Đội trực |
| 5 | Bàn giao release | PO, vận hành | Mỗi release | Release Note + CHANGELOG | Tech Lead |
| 6 | Nghiệm thu UAT | PO, khách hàng | Theo mốc | PL6 Sign-off | Test Lead |

**Quy tắc:** quyết định quan trọng phải được ghi lại bằng văn bản (`4.5-QA-log.md` hoặc biên bản họp) — không chỉ trao đổi miệng hoặc qua chat.

---

## Checklist hoàn thành B1

- [ ] Đã họp kick-off có Sponsor/PO và các thành viên chủ chốt (thiếu người có quyền quyết định thì phải họp lại)
- [ ] Đã **xin phép người tham dự trước khi ghi âm** (bắt buộc theo tài liệu gốc)
- [ ] Charter đã được PM rà soát, đối chiếu thực tế ngân sách/phạm vi
- [ ] Đã gửi Sponsor/PO xem trước và tổng hợp góp ý **trước** buổi ký
- [ ] Charter đã được **Sponsor/PO ký duyệt chính thức** (Human Gate của B1)
- [ ] Đã lưu Charter vào [Confluence/SharePoint] và khởi tạo project trên [Jira/Azure DevOps]
- [ ] Stakeholder Register và Communication Plan đã hoàn thành
- [ ] Mọi số liệu ngân sách/phạm vi do PM/Sponsor quyết định, không do AI đề xuất

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 1 và mục 2 B1 (bảng chi tiết 7 bước) — tài liệu gốc nội bộ
- PMBOK Guide, Project Management Institute — https://www.pmi.org/
- PMI — Project Charter — https://www.pmi.org/learning/library/charter-selling-project-7473
- Atlassian — Project Charter template — https://www.atlassian.com/software/confluence/templates

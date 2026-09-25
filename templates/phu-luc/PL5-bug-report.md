---
title: "PL5 — Biểu mẫu Bug Report"
for: "Mọi bước từ B9 trở đi (B9, B11, B12, B14) — mọi bug phát sinh"
owner: "Người phát hiện (R) · Test Lead (chủ trì Triage) · Dev (R — sửa) · QA (R — đóng bug)"
nguồn: "AI-SDLC v5.9 Phụ lục 5 + mục 3 (Định nghĩa Severity/Priority, vòng đời bug, Hotfix); ISTQB"
---

# PL5 — Biểu mẫu Bug Report

> **Cách dựng:** mọi bug report phải theo template này (tài liệu gốc yêu cầu bắt buộc: steps to reproduce, expected vs actual, evidence). AI hỗ trợ gom cụm bug trùng lặp và phân tích log tìm root cause. Bug không theo template sẽ bị Triage Board trả lại.

## Thông tin chung

| Trường | Nội dung |
|---|---|
| **Bug ID** | BUG-[xxxx] *(tự sinh, VD: BUG-0142)* |
| **Dự án / Module** | [Tên dự án / module] |
| **Người báo lỗi** | [Tên] |
| **Ngày phát hiện** | [DD/MM/YYYY] |
| **Môi trường phát hiện** | ☐ DEV ☐ CI/TEST ☐ STAGING ☐ UAT ☐ PRODUCTION |
| **Phiên bản / Build** | [Số version hoặc commit SHA] |
| **Thiết bị / Trình duyệt / OS** | [Chi tiết nếu liên quan] |

## Phân loại

### Severity (mức độ nghiêm trọng kỹ thuật)

| Mức | Chọn | Định nghĩa | SLA sửa lỗi (từ lúc xác nhận) |
|---|---|---|---|
| **S1 — Blocker** | ☐ | Hệ thống down, mất dữ liệu, chặn toàn bộ luồng nghiệp vụ chính, lỗ hổng bảo mật khai thác được ngay | **4 giờ** |
| **S2 — Critical** | ☐ | Một chức năng chính không dùng được, không có workaround, ảnh hưởng nhiều người dùng | **1 ngày làm việc** |
| **S3 — Major** | ☐ | Chức năng phụ lỗi, hoặc chức năng chính lỗi nhưng có workaround | **3–5 ngày làm việc** (theo sprint) |
| **S4 — Minor** | ☐ | Lỗi giao diện, chính tả, không ảnh hưởng nghiệp vụ | **Backlog**, xử lý theo ưu tiên sprint |

### Priority (mức độ ưu tiên xử lý)

| Mức | Chọn | Ý nghĩa |
|---|---|---|
| **P1 — Khẩn cấp** | ☐ | Xử lý ngay lập tức, có thể phá quy trình sprint bình thường → **áp dụng quy trình Hotfix** |
| **P2 — Cao** | ☐ | Ưu tiên xử lý trong sprint hiện tại |
| **P3 — Trung bình** | ☐ | Đưa vào backlog, lên kế hoạch sprint kế tiếp |
| **P4 — Thấp** | ☐ | Xử lý khi có nguồn lực rảnh, không cam kết thời gian |

> **Severity ≠ Priority.** Severity là mức độ nghiêm trọng kỹ thuật; Priority là mức độ ưu tiên nghiệp vụ. Một lỗi S4 có thể là P1 (ví dụ sai tên công ty trên hoá đơn), một lỗi S2 có thể là P3 (tính năng ít dùng).

## Chi tiết lỗi

### Các bước tái hiện (Steps to reproduce)

```
1. [Vào màn hình ...]
2. [Nhập ...]
3. [Bấm ...]
4. [Quan sát ...]
```

**Tần suất tái hiện:** ☐ Luôn luôn (100%) ☐ Thường xuyên ☐ Thỉnh thoảng ☐ Chỉ 1 lần

**Điều kiện đặc biệt (nếu có):** [VD: chỉ xảy ra khi có > 100 bản ghi; chỉ trên Safari; chỉ khi mất mạng giữa lúc lưu]

### Kết quả mong đợi (Expected result)

[Kết quả đúng theo Acceptance Criteria / Spec — ghi rõ mã AC nếu có: "Theo AC-014, hệ thống phải..."]

### Kết quả thực tế (Actual result)

[Kết quả sai thực tế xảy ra — càng cụ thể càng tốt, kèm số liệu quan sát được]

### Bằng chứng (Evidence)

| Loại | Đường dẫn / Nội dung |
|---|---|
| Ảnh chụp màn hình | [Đính kèm / link] |
| Video quay màn hình | [Đính kèm / link] |
| Log / thông báo lỗi | [Dán log hoặc link] |
| Mã traceId / request ID | [Nếu có] |
| Dữ liệu mẫu gây lỗi | [Nếu có] |

⚠️ **Không dán dữ liệu cá nhân thật** (số điện thoại, CMND, số thẻ) vào bằng chứng — che/masking trước khi đính kèm.

### Liên kết

| Trường | Nội dung |
|---|---|
| Acceptance Criteria liên quan | [AC-xxx] |
| Test Case liên quan | [TC-xxx] |
| Yêu cầu gốc | [FR-xxx trong BRD/spec.md] |
| Bug trùng lặp / liên quan | [BUG-xxxx] |
| Ticket xử lý | [Link] |

## Thông tin xử lý (Dev/QA điền)

| Trường | Nội dung |
|---|---|
| Người được gán | [Tên] |
| Ngày gán | [DD/MM/YYYY] |
| Nguyên nhân gốc (Dev phân tích) | [ ] |
| Phương án sửa | [ ] |
| Nhánh / Commit sửa | [Link] |
| Có cần migration / hotfix? | ☐ Không ☐ Có — mô tả: [ ] |
| Ngày sửa xong | [DD/MM/YYYY] |
| Người kiểm thử lại | [Tên] |
| Kết quả retest | ☐ Đạt ☐ Không đạt → Reopen |
| Ngày đóng | [DD/MM/YYYY] |

## Vòng đời bug

```
New → Triage → Assigned → In Progress → Fixed → Retest → Closed
                                              ↓
                                          Reopen (nếu retest fail)
```

| Trạng thái | Ai chuyển | Ghi chú |
|---|---|---|
| New | Người phát hiện | Bug vừa được tạo |
| Triage | Test Lead chủ trì | Triage Board họp **hằng ngày** khi dự án đang test tích cực, có PM/Tech Lead tham gia — quyết định Severity/Priority chính thức, gán người xử lý |
| Assigned | Triage Board | Đã có người chịu trách nhiệm |
| In Progress | Dev | Đang sửa |
| Fixed | Dev | Đã sửa, chờ kiểm thử lại |
| Retest | Tester | Đang kiểm thử lại |
| Closed | **Người báo lỗi hoặc Tester** | ⚠️ **Dev KHÔNG được tự đóng bug mình sửa** |
| Reopen | Tester | Retest fail |

## Tiêu chí kiểm soát

- **Zero-Bug với lỗi nghiêm trọng:** tuyệt đối **không** đưa lên UAT hoặc Go-live nếu còn bug **Severity 1–2**.
- Mọi bug report phải theo template này — thiếu steps to reproduce hoặc evidence sẽ bị Triage Board trả lại.
- AI hỗ trợ gom cụm bug trùng lặp và phân tích log tìm root cause (tài liệu gốc mục 3).
- Bug ở PRODUCTION được ghi nhận là **escaped defect** — dùng để đo KPI và phân tích trong post-mortem (xem `quy-chuan/dora-metrics.md`).

## Checklist trước khi gửi bug report

- [ ] Có Bug ID và ngày phát hiện
- [ ] Đã ghi rõ môi trường phát hiện (DEV/CI-TEST/STAGING/UAT/PRODUCTION)
- [ ] Đã chọn Severity **và** Priority (không chỉ một trong hai)
- [ ] Steps to reproduce đánh số, người khác làm theo tái hiện được
- [ ] Có cả Expected **và** Actual
- [ ] Có ít nhất một loại bằng chứng (ảnh/video/log)
- [ ] Đã liên kết AC / Test Case liên quan
- [ ] Đã kiểm tra bug chưa được báo trước đó (tránh trùng lặp)
- [ ] Đã che dữ liệu cá nhân trong bằng chứng

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 5 và mục 3 (Phân loại & phân tích, bảng Severity/Priority/SLA, vòng đời bug, Hotfix Production) — tài liệu gốc nội bộ
- ISTQB — Defect Management, Defect Life Cycle — https://www.istqb.org/
- ISO/IEC/IEEE 29119 — Software Testing — https://www.iso.org/standard/81291.html
- Atlassian — Bug report template best practices — https://www.atlassian.com/software/jira/guides/issue-types/bugs

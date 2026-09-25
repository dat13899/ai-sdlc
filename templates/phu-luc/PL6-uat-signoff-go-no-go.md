---
title: "PL6 — UAT Sign-off & Go/No-Go Checklist"
for: "B12 (Gate 4 — UAT Sign-off) và B13 (Gate 5 — Go/No-Go)"
owner: "Test Lead + Security Lead + Tech Lead (ký Gate 4a/4b/4c) · PO (A — ký Gate 4) · PM (chủ trì họp Go/No-Go)"
nguồn: "AI-SDLC v5.9 Phụ lục 6 + mục 2 B12, B13; ISO/IEC/IEEE 29119"
---

# PL6 — UAT Sign-off & Go/No-Go Checklist

> **Cách dựng:** Gate 4 tách thành 3 sign-off thành phần theo chuyên môn (Test Lead, Security Lead, Tech Lead); **PO chỉ ký sign-off cuối cùng sau khi cả 3 thành phần đã "xanh"**. Gate 5 là họp Go/No-Go bắt buộc trước go-live, chỉ go-live khi **tất cả** mục checklist là "Đạt" — có mục "Không đạt" thì quyết định **No-Go** và dời lịch.

---

# PHẦN 1 — Biên bản UAT Sign-off (Gate 4)

## 1.1. Thông tin chung

| Trường | Nội dung |
|---|---|
| Dự án | [Tên dự án] |
| Phiên bản / Build | [Số version / commit SHA] |
| Môi trường UAT | [URL] |
| Ngày bắt đầu UAT | [YYYY-MM-DD] |
| Ngày kết thúc UAT | [YYYY-MM-DD] |
| Người chạy kịch bản UAT | [Tên PO/khách hàng] |
| Test Lead | [Tên] |
| Security Lead | [Tên] |
| Tech Lead | [Tên] |

## 1.2. Điều kiện bắt buộc (Gate 4a / 4b / 4c)

| # | Tiêu chí | Kết quả | Ghi chú / Bằng chứng |
|---|---|---|---|
| 1 | Regression suite tự động xanh **100%** | ☐ Đạt ☐ Không đạt | [Link báo cáo CI] |
| 2 | Bug **Severity 1–2** đang mở **= 0** | ☐ Đạt ☐ Không đạt | [Link danh sách bug] |
| 3 | **Gate 4a** — SIT/Regression (Test Lead ký) | ☐ Đạt ☐ Không đạt | [Link biên bản SIT] |
| 4 | **Gate 4b** — ATTT (Security Lead ký) | ☐ Đạt ☐ Không đạt | [Link báo cáo DAST/pentest] |
| 5 | **Gate 4c** — Hiệu năng (Tech Lead xác nhận) | ☐ Đạt ☐ Không đạt | [Link báo cáo load test] |
| 6 | Toàn bộ kịch bản UAT đã chạy với PO/khách hàng | ☐ Đạt ☐ Không đạt | [Link kịch bản + kết quả] |

## 1.3. Chi tiết Gate 4a — SIT/Regression (Test Lead)

Test Lead sở hữu gate này (A/R).

- [ ] Build đã deploy lên môi trường **STAGING** (bản sao cấu hình gần Production nhất)
- [ ] Regression suite tự động **xanh 100%**
- [ ] **RTM (Requirements Traceability Matrix) phủ 100% Acceptance Criteria**
- [ ] SIT (System Integration Test) đã hoàn thành, các luồng tích hợp giữa module đã kiểm
- [ ] Không dùng dữ liệu Production chưa xử lý — chỉ dùng synthetic data hoặc dữ liệu đã masking/anonymize

| Trường | Nội dung |
|---|---|
| Tổng số test case | [ ] |
| Đã chạy | [ ] |
| Đạt | [ ] |
| Không đạt | [ ] |
| Tỷ lệ phủ AC (RTM) | [ ]% |

## 1.4. Chi tiết Gate 4b — An toàn thông tin (Security Lead hoặc pentest độc lập)

Security Lead sở hữu gate này (A/R).

- [ ] **DAST** (Dynamic Application Security Testing) đã chạy trên môi trường **Staging**
- [ ] **Penetration Testing** giả lập — với hệ thống chạm dữ liệu cá nhân/thanh toán, **bắt buộc thuê đơn vị pentest độc lập bên ngoài**, tần suất tối thiểu **1 lần/release lớn**
- [ ] Kiểm tra cấu hình tường lửa cơ sở dữ liệu (**DBF**) và **EDR/EPP**
- [ ] Đánh giá phân quyền, cơ chế **PAM** và **MFA** cho tài khoản quản trị
- [ ] **Không còn lỗ hổng mức Critical/High chưa vá**

| Trường | Nội dung |
|---|---|
| Đơn vị pentest (nếu có) | [Tên] |
| Số lỗ hổng Critical phát hiện / đã vá | [ ] / [ ] |
| Số lỗ hổng High phát hiện / đã vá | [ ] / [ ] |
| Số lỗ hổng Medium còn lại | [ ] |
| Ngày hoàn thành kiểm thử ATTT | [YYYY-MM-DD] |

## 1.5. Chi tiết Gate 4c — Hiệu năng (Tech Lead)

Tech Lead tham vấn, xác nhận gate này.

- [ ] **Load & Stress test** bằng JMeter/k6 trên môi trường cấu hình **tương đương Production**
- [ ] Đánh giá **Scalability** (auto-scaling) của hệ thống/microservices
- [ ] Giám sát tài nguyên CPU/RAM/Băng thông; xác nhận **đạt SLA hiệu năng đã cam kết trong Spec**

| Trường | Nội dung |
|---|---|
| Số người dùng đồng thời đã test | [ ] |
| Thời gian phản hồi trung bình | [ ] ms |
| Thời gian phản hồi P95 | [ ] ms |
| Tỷ lệ lỗi dưới tải | [ ]% |
| SLA trong Spec | [ ] |
| Đạt SLA? | ☐ Đạt ☐ Không đạt |

## 1.6. Kết quả kịch bản UAT

| # | Kịch bản | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | [Kịch bản 1] | ☐ Đạt ☐ Không đạt | |
| 2 | [Kịch bản 2] | ☐ Đạt ☐ Không đạt | |
| 3 | [Kịch bản 3] | ☐ Đạt ☐ Không đạt | |

## 1.7. Ký xác nhận Gate 4

Bằng việc ký dưới đây, các bên xác nhận các tiêu chí thuộc phần mình phụ trách đã đạt.

| Vai trò | Họ tên | Ký | Ngày |
|---|---|---|---|
| Test Lead *(Gate 4a — SIT/Regression)* | ________________ | ________ | ___/___/20__ |
| Security Lead *(Gate 4b — ATTT)* | ________________ | ________ | ___/___/20__ |
| Tech Lead *(Gate 4c — Hiệu năng)* | ________________ | ________ | ___/___/20__ |
| Product Owner / Khách hàng *(Gate 4 — UAT)* | ________________ | ________ | ___/___/20__ |

**Điều kiện để PO ký:** cả 3 gate 4a + 4b + 4c đã đạt **và** regression xanh 100% **và** bug S1–S2 đang mở = 0.

> Sau khi ký, nếu phát sinh yêu cầu thay đổi → phải qua **PL2 Change Request**, không sửa trực tiếp.

---

# PHẦN 2 — Checklist Go/No-Go (Gate 5 — trước Go-live)

## 2.1. Thành phần họp Go/No-Go (bắt buộc có mặt)

| Vai trò | Người | Có mặt |
|---|---|---|
| PM (chủ trì) | [Tên] | ☐ |
| Tech Lead | [Tên] | ☐ |
| Test Lead | [Tên] | ☐ |
| Security Lead | [Tên] | ☐ |
| PO | [Tên] | ☐ |

**Thời điểm họp:** [YYYY-MM-DD HH:MM]
**Người chủ trì:** PM

## 2.2. Checklist bắt buộc

| # | Hạng mục | Kết quả | Ghi chú / Bằng chứng |
|---|---|---|---|
| 1 | UAT Sign-off đã ký (Phần 1 ở trên) | ☐ Đạt ☐ Không đạt | |
| 2 | **Rollback Plan đã được viết và diễn tập** | ☐ Đạt ☐ Không đạt | [Link kế hoạch + biên bản diễn tập] |
| 3 | Build artifact deploy Production **giống hệt** build đã qua UAT (build-once-promote-many) | ☐ Đạt ☐ Không đạt | [Commit SHA / artifact ID] |
| 4 | Kế hoạch truyền thông người dùng / thông báo downtime (nếu có) | ☐ Đạt ☐ Không đạt | [Link] |
| 5 | Đội trực **Hypercare** đã sẵn sàng (lịch trực, kênh escalation) | ☐ Đạt ☐ Không đạt | [Link lịch trực] |
| 6 | Giám sát / Dashboard / Alerting đã cấu hình cho hệ thống mới | ☐ Đạt ☐ Không đạt | [Link dashboard] |

## 2.3. Kiểm tra bổ sung trước go-live

- [ ] Chiến lược triển khai đã chọn: ☐ Blue-green ☐ Canary ☐ Khác: [ ]
- [ ] Môi trường Production có kiểm soát truy cập nghiêm ngặt qua hệ thống **PAM**
- [ ] Chỉ deploy qua **CI/CD pipeline** — không deploy tay/copy file thủ công
- [ ] Mọi thay đổi cấu hình hạ tầng đã qua **IaC + Pull Request**
- [ ] Đã có người trực sẵn sàng trong và sau khung giờ deploy
- [ ] Đã thông báo cho các bên liên quan (theo Communication Plan)
- [ ] Đã sao lưu dữ liệu trước khi deploy (nếu có migration)
- [ ] Thời điểm deploy tránh giờ cao điểm

## 2.4. Quyết định

**Quyết định:** ☐ **GO** ☐ **NO-GO**

**Nếu NO-GO — nêu rõ lý do và ngày dự kiến xem xét lại:**

| Trường | Nội dung |
|---|---|
| Lý do No-Go | [ ] |
| Hạng mục chưa đạt | [ ] |
| Ngày dự kiến xem xét lại | [YYYY-MM-DD] |
| Người chịu trách nhiệm khắc phục | [Tên] |

**Kế hoạch sau go-live:**

| Trường | Nội dung |
|---|---|
| Thời điểm go-live | [YYYY-MM-DD HH:MM] |
| Người thực hiện deploy | [Tên] |
| Thời gian Hypercare | [1–2 tuần] — từ [ngày] đến [ngày] |
| Kênh báo sự cố | [ ] |
| Người quyết định rollback | [Tech Lead / người trực S1] |

## 2.5. Ký xác nhận Gate 5

| Vai trò | Họ tên | Ký | Ngày |
|---|---|---|---|
| Project Manager (chủ trì họp Go/No-Go) | ________________ | ________ | ___/___/20__ |
| Tech Lead | ________________ | ________ | ___/___/20__ |
| Test Lead | ________________ | ________ | ___/___/20__ |
| Security Lead | ________________ | ________ | ___/___/20__ |
| Product Owner | ________________ | ________ | ___/___/20__ |

## 2.6. Sau go-live (Hypercare)

- [ ] Đội Dev/DevOps trực tăng cường trong **1–2 tuần** sau go-live
- [ ] Theo dõi sát các chỉ số: uptime, tỉ lệ lỗi, thời gian phản hồi (xem `bo-sung/runbook.md`)
- [ ] Ghi nhận mọi sự cố theo `phu-luc/PL5-bug-report.md`
- [ ] Kết thúc Hypercare: họp đánh giá + cập nhật `quy-chuan/dora-metrics.md` (Change Failure Rate, Time to Restore)
- [ ] Nếu có sự cố S1: bắt buộc post-mortem trong **48 giờ** (xem `bo-sung/postmortem.md`)

---

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 6, mục 2 B12 (Gate 4a/4b/4c + Gate 4) và B13 (luật thăng cấp môi trường, họp Go/No-Go, Hypercare) — tài liệu gốc nội bộ
- ISO/IEC/IEEE 29119 — Software Testing — https://www.iso.org/standard/81291.html
- ISTQB — Acceptance Testing, UAT — https://www.istqb.org/
- OWASP ASVS — https://owasp.org/www-project-application-security-verification-standard/
- Google SRE Book — Release Engineering, Canarying — https://sre.google/sre-book/release-engineering/
- Atlassian — Go/No-Go decision checklist — https://www.atlassian.com/software/confluence/templates

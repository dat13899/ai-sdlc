---
title: "Test Plan — Kế hoạch kiểm thử"
for: "B11. Test Plan & Test Case — Giai đoạn 4 (Kiểm thử)"
owner: "Test Lead (A/R) · Tester · AI (sinh test case từ AC)"
nguồn: "AI-SDLC v5.9 dòng 906–944; ISO/IEC/IEEE 29119-3 (Test documentation); ISTQB"
---

# Kế hoạch kiểm thử: [Tên dự án / Tên tính năng]

**Phiên bản**: [1.0] · **Ngày**: [Ngày] · **Người lập**: [Tên Test Lead]

**Trạng thái**: Draft | Đã duyệt (Human Gate nhẹ — Test Lead)

**Tham chiếu**: `./spec.md` (AC) · `./plan.md` (kiến trúc) · `./test-case-rtm.md` (Test Case + RTM)

---

## 1. Bối cảnh (Context)

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu kiểm thử | [Ví dụ: xác nhận toàn bộ AC của US-001…US-003 hoạt động đúng trên Staging] |
| Phạm vi kiểm thử (In scope) | [Danh sách module/chức năng] |
| Ngoài phạm vi (Out of scope) | [Ví dụ: hệ thống kế toán cũ không thuộc phạm vi release này] |
| Đối tượng hưởng lợi | [PO, PM, Tech Lead, khách hàng] |
| Cơ sở đánh giá (Test basis) | spec.md, plan.md, OpenAPI, AC (Gherkin) |

---

## 2. Hạng mục kiểm thử (Test Items)

| # | Hạng mục | Phiên bản/Artifact | Toàn vẹn dữ liệu |
|---|---|---|---|
| 1 | [Dịch vụ A] | `[build-#, tag]` | [ ] |
| 2 | [Web App] | `[build-#, tag]` | [ ] |
| 3 | [Cơ sở dữ liệu] | `[migration #]` | [ ] |

---

## 3. Đặc trưng cần kiểm thử (Features to be Tested)

| Mã | Đặc trưng | Rủi ro | Mức ưu tiên kiểm thử | AC liên quan |
|---|---|---|---|---|
| F-01 | [Đăng ký tài khoản] | Cao | P1 | AC-001 |
| F-02 | [Thanh toán] | Cao | P1 | AC-002 |
| F-03 | [Báo cáo thống kê] | Trung bình | P2 | AC-003 |

**Không kiểm thử (Features not to be tested)**: [Liệt kê + lý do]

---

## 4. Phương pháp kiểm thử (Test Approach)

| Loại kiểm thử | Kỹ thuật | Công cụ | Người thực hiện | Môi trường |
|---|---|---|---|---|
| Unit | Hộp trắng, TDD | [Jest/pytest/JUnit] | Dev/AI | DEV/CI |
| Integration (SIT) | Hộp đen, luồng nghiệp vụ | [Postman/pytest] | Tester | STAGING |
| Regression | Bộ tự động | [Playwright] | Tester + AI | STAGING |
| UAT | Kịch bản nghiệp vụ | Thủ công | PO + BA | UAT |
| Hiệu năng (Gate 4c) | Load/Stress | [k6/JMeter] | Tech Lead + DevOps | Staging cấu hình ~Production |
| Bảo mật (Gate 4b) | DAST + Pentest | [OWASP ZAP + đơn vị độc lập] | Security Lead | STAGING |
| Khả năng tiếp cận | Thủ công + công cụ | [axe DevTools] | Tester | UAT |

**Chiến lược dữ liệu test**: chỉ dùng **dữ liệu tổng hợp (synthetic)** do AI sinh hoặc **dữ liệu production đã che (masking/anonymize)**. Cấm dùng dữ liệu thật chưa xử lý trên Staging/UAT.

---

## 5. Tiêu chí Đạt / Không đạt (Entry & Exit Criteria)

### Tiêu chí đầu vào (Entry)
- [ ] Build đã deploy lên STAGING theo CI/CD (build-once, promote nhiều lần)
- [ ] Test case đã viết và được Test Lead duyệt
- [ ] Dữ liệu test đã chuẩn bị, môi trường ổn định
- [ ] Không còn bug Severity 1–2 từ vòng trước ở trạng thái "Open" chặn kiểm thử

### Tiêu chí kết thúc (Exit)
- [ ] Regression suite tự động xanh **100%**
- [ ] RTM phủ **100% Acceptance Criteria**
- [ ] Không còn bug Severity 1–2 chưa đóng
- [ ] Bug Severity 3–4 đã phân loại, có quyết định xử lý/hoãn
- [ ] Coverage đơn vị ≥ [X]%, mutation score ≥ [Y]% *(nếu áp dụng)*
- [ ] Báo cáo kết quả kiểm thử đã ký

---

## 6. Lịch & Phân công (Schedule & Roles)

| Hoạt động | Bắt đầu | Kết thúc | Người thực hiện | Phụ thuộc |
|---|---|---|---|---|
| Viết test plan/case | [Ngày] | [Ngày] | Test Lead + AI | Gate 2 |
| Viết automation | [Ngày] | [Ngày] | Tester + AI | Test case duyệt |
| SIT + Regression (4a) | [Ngày] | [Ngày] | Tester | Deploy Staging |
| ATTT (4b) | [Ngày] | [Ngày] | Security Lead | 4a |
| Load test (4c) | [Ngày] | [Ngày] | Tech Lead + DevOps | 4a |
| UAT | [Ngày] | [Ngày] | PO + BA | 4a+4b+4c |
| UAT Sign-off (Gate 4) | [Ngày] | [Ngày] | PO | UAT xong |

---

## 7. Môi trường & Công cụ (Environments & Tools)

| Môi trường | Mục đích | Dữ liệu | Ghi chú |
|---|---|---|---|
| CI/TEST | Unit + Integration | Dữ liệu giả lập sinh tự động | Chạy mỗi PR |
| STAGING | SIT / Regression / ATTT / Hiệu năng | Synthetic hoặc đã mask | Bản sao gần nhất của Production |
| UAT | Nghiệm thu người dùng | Synthetic hoặc đã mask | Chỉ deploy sau khi 4a+4b+4c đạt |
| PRODUCTION | Smoke test sau go-live | Dữ liệu thật | Chỉ đọc, không phá dữ liệu |

**Công cụ**: [Playwright] (E2E) · [k6/JMeter] (hiệu năng) · [OWASP ZAP] (DAST) · [Jira/Xray] (quản lý test case + bug) · [Allure] (báo cáo)

---

## 8. Quản lý bug trong giai đoạn kiểm thử

Bug phát hiện dùng mẫu **Bug Report — Phụ lục 5** (steps to reproduce, expected vs actual, evidence). Bug phải có cả **Severity** và **Priority** — hai chiều độc lập.

| Severity | Định nghĩa | SLA sửa (từ lúc xác nhận) |
|---|---|---|
| S1 — Blocker | Hệ thống down, mất dữ liệu, chặn toàn bộ luồng chính, lỗ hổng khai thác được ngay | 4 giờ |
| S2 — Critical | Một chức năng chính không dùng được, không có workaround, ảnh hưởng nhiều người dùng | 1 ngày làm việc |
| S3 — Major | Chức năng phụ lỗi, hoặc chức năng chính lỗi nhưng có workaround | 3–5 ngày làm việc (theo sprint) |
| S4 — Minor | Lỗi giao diện, chính tả, không ảnh hưởng nghiệp vụ | Backlog, theo ưu tiên sprint |

**Vòng đời bug**: New → Triage → Assigned → In Progress → Fixed → Retest → Closed (hoặc → Reopen nếu retest fail).
**Quyền đóng bug**: chỉ người báo lỗi/Tester được đóng ở bước Retest — Dev KHÔNG được tự đóng bug mình sửa.

**Nguyên tắc kiểm soát chung**: Zero-Bug với lỗi nghiêm trọng. **Tuyệt đối không đưa lên UAT hoặc Go-live nếu còn bug Severity 1–2.**

---

## 9. Rủi ro kiểm thử (Test Risks)

| # | Rủi ro | Xác suất | Tác động | Ứng phó |
|---|---|---|---|---|
| TR1 | Staging khác Production → kết quả không đại diện | TB | Cao | Đối chiếu cấu hình, ghi nhận sai lệch |
| TR2 | Bộ regression không ổn định (flaky) | Cao | TB | Cô lập test flaky, retry có kiểm soát, không tắt test |
| TR3 | Thiếu dữ liệu test đại diện | TB | Cao | Sinh dữ liệu tổng hợp sớm từ AC |
| TR4 | Không đủ thời gian kiểm thử phi chức năng | TB | Cao | Chạy load test sớm song song SIT |

---

## 10. Kết quả bàn giao (Deliverables)

- [ ] `test-plan.md` (file này) — đã duyệt
- [ ] `test-case-rtm.md` — Test Case + RTM phủ 100% AC
- [ ] Automation script trong `[tests/e2e/]`
- [ ] Báo cáo kết quả kiểm thử theo vòng (kèm bằng chứng log/screenshot)
- [ ] Danh sách bug kèm Severity/Priority
- [ ] Biên bản ký Gate 4a (Test Lead) · 4b (Security Lead) · 4c (Tech Lead) · UAT (PO — PL 6)

---

## 11. Checklist duyệt Test Plan (Test Lead)

- [ ] Có đủ Entry/Exit criteria đo lường được
- [ ] Phủ hết AC trong spec.md, có ánh xạ sang test-case-rtm.md
- [ ] Có kế hoạch kiểm thử phi chức năng (hiệu năng, ATTT, tiếp cận)
- [ ] Dữ liệu test hợp lệ về tuân thủ dữ liệu cá nhân
- [ ] Đã xác nhận môi trường, công cụ, lịch với DevOps
- [ ] Test Lead đã ký duyệt (Human Gate nhẹ)

---

## Nguồn tham chiếu

- AI-SDLC v5.9 — B11 (dòng 906–944), B12/Gate 4 (dòng 945–1053), quản lý bug (dòng 1180–1243)
- ISO/IEC/IEEE 29119-3 — Test documentation (Test Plan, Test Design Specification, Test Case Specification)
- ISTQB Foundation Level — thuật ngữ và kỹ thuật thiết kế test
- `./spec.md` · `./test-case-rtm.md` · `../phu-luc/` Bug Report (PL 5), UAT Sign-off (PL 6)

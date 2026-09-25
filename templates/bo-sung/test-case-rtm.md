---
title: "Test Case & Requirements Traceability Matrix (RTM)"
for: "B11. Test Plan & Test Case — Gate 4a yêu cầu RTM phủ 100% AC"
owner: "Tester (R) · Test Lead (A/R) · AI (sinh test case từ AC)"
nguồn: "AI-SDLC v5.9 dòng 906–944, 945–1053; ISO/IEC/IEEE 29119-3; ISTQB; Playwright"
---

# Test Case & Ma trận truy vết yêu cầu: [Tên tính năng]

**Phiên bản**: [1.0] · **Ngày**: [Ngày] · **Người lập**: [Tên Tester]

**Nguồn dẫn xuất**: Acceptance Criteria (Gherkin) trong `./spec.md` — mỗi AC phải có **tối thiểu 1 test case**.

> Quy tắc Gate 4a: **RTM phải phủ 100% Acceptance Criteria**, nếu không thì không được ký Gate 4a.

---

## 1. Quy ước mã

| Tiền tố | Ý nghĩa | Ví dụ |
|---|---|---|
| `US-xxx` | User Story | US-001 |
| `AC-xxx` | Acceptance Criteria (kịch bản Gherkin) | AC-001 |
| `FR-xxx` | Functional Requirement | FR-001 |
| `TC-xxx` | Test Case | TC-001 |
| `BUG-xxx` | Bug Report | BUG-007 |

**Loại test**: `U` = Unit · `I` = Integration/SIT · `E` = E2E/Regression · `P` = Performance · `S` = Security · `M` = Manual/UAT

**Mức ưu tiên**: P1 (đường găng, bắt buộc có automation) · P2 (quan trọng) · P3 (bổ trợ)

---

## 2. Danh sách Test Case

### TC-001 — [Tên test case ngắn]

| Trường | Nội dung |
|---|---|
| Mã | TC-001 |
| Truy vết | AC-001 · US-001 · FR-001 |
| Loại | U / I / E / P / S / M |
| Ưu tiên | P1 |
| Điều kiện tiên quyết | [Ví dụ: đã đăng nhập với vai trò [X], DB có [bản ghi Y]] |
| Dữ liệu test | [Ví dụ: email `test+001@example.com`, mật khẩu đạt độ mạnh] |
| Bước thực hiện | 1. [Bước 1]<br>2. [Bước 2]<br>3. [Bước 3] |
| Kết quả mong đợi | [Kết quả quan sát được] |
| Kết quả thực tế | [Điền khi chạy] |
| Trạng thái | Pass / Fail / Blocked / Not Run |
| Bằng chứng | [Link screenshot/log/Allure] |
| Kịch bản tự động | `[tests/e2e/tc-001.spec.ts]` |
| Người chạy · Ngày | [Tên] · [Ngày] |

---

### TC-002 — [Tên test case ngắn]

| Trường | Nội dung |
|---|---|
| Mã | TC-002 |
| Truy vết | AC-002 · US-001 · FR-002 |
| Loại | I |
| Ưu tiên | P1 |
| Điều kiện tiên quyết | [Mô tả] |
| Dữ liệu test | [Mô tả] |
| Bước thực hiện | 1. [Bước 1]<br>2. [Bước 2] |
| Kết quả mong đợi | [Kết quả] |
| Kết quả thực tế | — |
| Trạng thái | Not Run |
| Kịch bản tự động | `[tests/integration/tc-002.spec.ts]` |

---

### TC-003 — [Trường hợp biên / tiêu cực]

| Trường | Nội dung |
|---|---|
| Mã | TC-003 |
| Truy vết | AC-003 · US-002 |
| Loại | I |
| Ưu tiên | P2 |
| Kịch bản | **Given** [trạng thái], **When** [hành động sai/ biên], **Then** [lỗi mong đợi] |
| Kết quả mong đợi | [Mã lỗi + thông báo đúng, không lộ chi tiết hệ thống] |
| Kịch bản tự động | `[tests/integration/tc-003.spec.ts]` |

---

### TC-004 — Kiểm thử bảo mật/phi chức năng

| Trường | Nội dung |
|---|---|
| Mã | TC-004 |
| Truy vết | NFR-002 |
| Loại | S |
| Ưu tiên | P1 |
| Kịch bản | [Ví dụ: gọi endpoint không có token → phải trả 401; thử injection vào ô nhập] |
| Kết quả mong đợi | [Từ chối truy cập, có log audit, không rò rỉ thông tin] |
| Công cụ | [OWASP ZAP] |

---

### TC-005 — Kiểm thử hiệu năng

| Trường | Nội dung |
|---|---|
| Mã | TC-005 |
| Truy vết | NFR-001 |
| Loại | P |
| Ưu tiên | P1 |
| Kịch bản tải | [X] người dùng đồng thời trong [Y] phút, ramp-up [Z] |
| Kết quả mong đợi | p95 ≤ [X] ms, tỷ lệ lỗi < [Y]% |
| Công cụ | [k6/JMeter] |
| Báo cáo | [Link dashboard/artifact] |

---

## 3. Ma trận truy vết yêu cầu (RTM)

### 3.1 AC → Test Case

| User Story | Acceptance Criteria | Test Case | Loại | Ưu tiên | Trạng thái | Bug liên quan |
|---|---|---|---|---|---|---|
| US-001 | AC-001 | TC-001 | E | P1 | Not Run | — |
| US-001 | AC-002 | TC-002 | I | P1 | Not Run | — |
| US-002 | AC-003 | TC-003 | I | P2 | Not Run | — |
| — | NFR-001 | TC-005 | P | P1 | Not Run | — |
| — | NFR-002 | TC-004 | S | P1 | Not Run | — |

### 3.2 Tổng hợp độ phủ

| Chỉ số | Giá trị | Ngưỡng Gate 4a | Đạt? |
|---|---|---|---|
| Tổng số Acceptance Criteria | [N] | — | — |
| AC có ít nhất 1 test case | [N] | 100% | [ ] |
| AC có automation | [N] | ≥ [X]% *(luồng chính bắt buộc 100%)* | [ ] |
| Tổng số test case | [N] | — | — |
| Test case Pass | [N] | — | — |
| Test case Fail | [N] | 0 với P1 | [ ] |
| Bug S1–S2 đang mở | [N] | 0 | [ ] |

> **Không được ký Gate 4a** khi: độ phủ AC < 100%, hoặc còn bug Severity 1–2 chưa đóng, hoặc regression suite chưa xanh 100%.

### 3.3 Requirement → Test Case (chiều ngược)

| Mã yêu cầu | Test Case phủ | Có lỗ hổng phủ? |
|---|---|---|
| FR-001 | TC-001 | Không |
| FR-002 | TC-002 | Không |
| FR-003 | [—] | **CÓ — cần bổ sung test case** |
| NFR-003 (khả dụng) | TC-005 | [Kiểm tra monitoring gián tiếp] |

---

## 4. Kế hoạch tự động hoá (Automation)

| Test Case | Công cụ | File | Chạy ở đâu | Trạng thái |
|---|---|---|---|---|
| TC-001 | Playwright | `[tests/e2e/tc-001.spec.ts]` | CI + STAGING | [ ] |
| TC-002 | Playwright | `[tests/e2e/tc-002.spec.ts]` | CI + STAGING | [ ] |
| TC-005 | k6 | `[tests/perf/tc-005.js]` | STAGING | [ ] |

**Quy ước**: sinh khung ban đầu bằng Playwright codegen → Tester/AI chỉnh sửa → review như code (PR riêng) → chạy trong pipeline CI.

---

## 5. Vòng chạy kiểm thử (Test Cycles)

| Vòng | Môi trường | Build | Ngày | Pass | Fail | Blocked | Bug mới | Người chạy |
|---|---|---|---|---|---|---|---|---|
| 1 | STAGING | `[build-#]` | [Ngày] | [N] | [N] | [N] | [N] | [Tên] |
| 2 | STAGING | `[build-#]` | [Ngày] | [N] | [N] | [N] | [N] | [Tên] |
| 3 | UAT | `[build-#]` | [Ngày] | [N] | [N] | [N] | [N] | [PO/Tester] |

---

## 6. Checklist trước khi trình ký Gate 4a

- [ ] RTM phủ 100% Acceptance Criteria (đối chiếu tự động, không đếm thủ công)
- [ ] Mọi test case P1 đã chạy và Pass
- [ ] Regression suite tự động xanh 100%
- [ ] Bug S1–S2 = 0
- [ ] Mọi test case Fail đều đã có bug tương ứng trong hệ thống quản lý lỗi
- [ ] Bằng chứng (log/screenshot/báo cáo) đã đính kèm
- [ ] Test Lead đã ký Gate 4a

---

## Nguồn tham chiếu

- AI-SDLC v5.9 — B11 (dòng 906–944), Gate 4a/4 — RTM phủ 100% AC (dòng 945–1053)
- ISO/IEC/IEEE 29119-3 — Test Case Specification, Traceability
- ISTQB — thiết kế test theo kỹ thuật hộp đen/hộp trắng, test biên
- Playwright — codegen và test runner (khuyến nghị tại B11)
- `./spec.md` · `./test-plan.md` · `../phu-luc/` Bug Report (PL 5)

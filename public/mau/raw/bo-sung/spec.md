---
title: "spec.md — Đặc tả tính năng"
for: "B4. Viết Spec (Specify) — Giai đoạn 1 (Khởi tạo & Yêu cầu)"
owner: "BA (A/R) · Tech Lead (C) · Test (C) · AI (draft)"
nguồn: "AI-SDLC v5.9 dòng 500–563; GitHub Spec Kit spec-template.md; ISO/IEC/IEEE 29148; INVEST; Gherkin"
---

# Đặc tả tính năng: [Tên tính năng]

**Nhánh tính năng (Feature Branch)**: `[###-ten-tinh-nang]`

**Ngày tạo**: [Ngày] · **Người tạo**: [Tên BA]

**Trạng thái**: Draft | In Review | **Final (đã qua Gate 1)**

**Đầu vào**: Mô tả người dùng: "[Tóm tắt 1–3 câu yêu cầu nghiệp vụ]"

**Tham chiếu nguồn**: BRD `[đường dẫn]` · Biên bản họp `[đường dẫn]` · Glossary `[đường dẫn]`

---

## 1. Bối cảnh & Mục tiêu

**Vấn đề hiện tại**: [Mô tả pain point đang có]

**Mục tiêu nghiệp vụ**: [Mục tiêu đo lường được]

**Phạm vi (In scope)**: [Danh sách nằm trong phạm vi]

**Ngoài phạm vi (Out of scope)**: [Danh sách cố tình KHÔNG làm ở phiên bản này — rất quan trọng để chặn tính năng AI "tự chế"]

> Quy tắc B4: BA rà soát và loại bỏ mọi tính năng AI sinh ra nhưng **không nằm trong phạm vi BRD/ biên bản họp**.

---

## 2. User Scenarios & Testing *(bắt buộc theo Spec Kit)*

User Story phải được **ưu tiên hoá** và **kiểm thử độc lập**: chỉ làm 1 story vẫn phải có MVP dùng được.

### User Story 1 — [Tiêu đề ngắn] (Ưu tiên: P1)

Là **[vai trò]**, tôi muốn **[hành động]**, để **[giá trị nhận được]**.

**Vì sao ưu tiên này**: [Giá trị + lý do]

**Kiểm thử độc lập**: [Cách kiểm thử chỉ với story này — "Có thể kiểm thử đầy đủ bằng [hành động cụ thể] và mang lại [giá trị cụ thể]"]

**Acceptance Scenarios (Gherkin)**:

1. **Given** [trạng thái ban đầu], **When** [hành động], **Then** [kết quả mong đợi]
2. **Given** [trạng thái ban đầu], **When** [hành động], **Then** [kết quả mong đợi]

**Mã yêu cầu (trace ID)**: `US-001` → `AC-001`, `AC-002`

---

### User Story 2 — [Tiêu đề ngắn] (Ưu tiên: P2)

Là **[vai trò]**, tôi muốn **[hành động]**, để **[giá trị nhận được]**.

**Vì sao ưu tiên này**: [Giá trị + lý do]

**Kiểm thử độc lập**: [Mô tả]

**Acceptance Scenarios**:

1. **Given** [...], **When** [...], **Then** [...]

**Mã yêu cầu**: `US-002` → `AC-003`

---

### User Story 3 — [Tiêu đề ngắn] (Ưu tiên: P3)

Là **[vai trò]**, tôi muốn **[hành động]**, để **[giá trị nhận được]**.

**Kiểm thử độc lập**: [Mô tả]

**Acceptance Scenarios**:

1. **Given** [...], **When** [...], **Then** [...]

---

## 3. Kiểm tra chuẩn INVEST cho từng User Story

| Story | I (Independent) | N (Negotiable) | V (Valuable) | E (Estimable) | S (Small) | T (Testable) | Đạt? |
|---|---|---|---|---|---|---|---|
| US-001 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa |
| US-002 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Chưa |

> Điều kiện DoR: mọi US phải tick đủ 6 ô trước khi đưa vào Gate 1 (đối chiếu `../quy-chuan/dor-dod.md`).

---

## 4. Edge Cases & Trường hợp biên

- Điều gì xảy ra khi [điều kiện biên]?
- Hệ thống xử lý thế nào khi [kịch bản lỗi]?
- Khi [tác nhân] mất kết nối giữa luồng [X] thì sao?
- Dữ liệu rỗng / dữ liệu cực lớn / ký tự đặc biệt tiếng Việt (dấu, emoji)?
- Tranh chấp đồng thời (concurrency) trên cùng [thực thể]?

---

## 5. Requirements — Yêu cầu chức năng *(bắt buộc)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI [khả năng cụ thể]
- **FR-002**: Hệ thống PHẢI [khả năng cụ thể]
- **FR-003**: Người dùng PHẢI có thể [tương tác chính]
- **FR-004**: Hệ thống PHẢI [yêu cầu dữ liệu]
- **FR-005**: Hệ thống PHẢI ghi log mọi [sự kiện bảo mật]
- **FR-006**: Hệ thống PHẢI xác thực người dùng qua [CẦN LÀM RÕ: chưa xác định phương thức — email/mật khẩu, SSO, OAuth?]

> Mọi điểm chưa rõ dùng nhãn `[CẦN LÀM RÕ: ...]`; BA tổng hợp toàn bộ các nhãn này thành Q&A Log ở B5.

### Yêu cầu phi chức năng (NFR)

| Mã | Loại | Yêu cầu | Ngưỡng đo được | Nguồn |
|---|---|---|---|---|
| NFR-001 | Hiệu năng | Thời gian phản hồi API [X] | p95 ≤ [X] ms | [SLA khách hàng] |
| NFR-002 | Bảo mật | Tuân thủ OWASP ASVS Level [1/2/3] | [Không còn lỗ hổng Critical/High] | [ASVS] |
| NFR-003 | Khả dụng | Uptime dịch vụ | ≥ [X]% / tháng | [Hợp đồng] |
| NFR-004 | Khả năng mở rộng | Chịu tải | [X] người dùng đồng thời | [Dự báo] |
| NFR-005 | Tuân thủ | Dữ liệu cá nhân | [Nghị định 13/2023/NĐ-CP — nếu liên quan] | [Pháp lý] |

### Key Entities *(nếu tính năng có dữ liệu)*

- **[Thực thể 1]**: [Ý nghĩa, thuộc tính chính — không mô tả cài đặt]
- **[Thực thể 2]**: [Ý nghĩa, quan hệ với thực thể khác]

---

## 6. Success Criteria — Tiêu chí thành công *(bắt buộc, không phụ thuộc công nghệ)*

### Kết quả đo lường được

- **SC-001**: [Chỉ số đo được, ví dụ "Người dùng hoàn tất tạo tài khoản dưới 2 phút"]
- **SC-002**: [Ví dụ "Hệ thống chịu 1000 người dùng đồng thời không suy giảm"]
- **SC-003**: [Ví dụ "Tỷ lệ người dùng hoàn thành tác vụ chính trong lần đầu ≥ 90%"]
- **SC-004**: [Chỉ số nghiệp vụ, ví dụ "Giảm 50% ticket hỗ trợ liên quan [X]"]

---

## 7. Giả định (Assumptions)

- [Giả định về người dùng, ví dụ "Người dùng có kết nối Internet ổn định"]
- [Giả định về phạm vi, ví dụ "Hỗ trợ mobile nằm ngoài phạm vi v1"]
- [Giả định về dữ liệu/môi trường, ví dụ "Tái sử dụng hệ thống xác thực hiện có"]
- [Phụ thuộc hệ thống/dịch vụ ngoài, ví dụ "Cần quyền truy cập API hồ sơ người dùng hiện có"]

---

## 8. Truy vết (Traceability) — đầu vào cho RTM

| Mã US | Mã AC | Mã FR | Test Case (B11) | Trạng thái |
|---|---|---|---|---|
| US-001 | AC-001 | FR-001 | [TC-001] | Chưa |
| US-001 | AC-002 | FR-002 | [TC-002] | Chưa |
| US-002 | AC-003 | FR-003 | [TC-003] | Chưa |

---

## 9. Danh mục câu hỏi mở `[CẦN LÀM RÕ]`

| # | Câu hỏi | Bên trả lời | Ngày hỏi | Trả lời | Trạng thái |
|---|---|---|---|---|---|
| Q1 | [Câu hỏi] | PO | [Ngày] | — | Mở |
| Q2 | [Câu hỏi] | Kiến trúc sư | [Ngày] | — | Mở |

> B5 (GATE 1): gom toàn bộ mục này → Q&A Log → chốt spec.md bản final → khoá bằng tag/branch protection. Sau Gate 1, mọi thay đổi phải qua **CR Form (Phụ lục 2)**.

---

## 10. Checklist trước khi trình Gate 1

- [ ] Tất cả User Story đã tick đủ 6 tiêu chí INVEST
- [ ] Mỗi AC viết dạng Gherkin Given–When–Then, kiểm thử được
- [ ] FR/NFR có mã định danh, không mâu thuẫn
- [ ] Mọi `[CẦN LÀM RÕ]` đã được trả lời
- [ ] Tech Lead đã sanity-check khả thi kỹ thuật (B4 bước 4 — chưa phải Gate 2)
- [ ] glossary.md đã cập nhật thuật ngữ mới (PL 3.16)
- [ ] AI đã chạy `/speckit.clarify` để dò mâu thuẫn/mơ hồ
- [ ] Biên bản duyệt Spec đã ký bởi PO/PM

---

## Nguồn tham chiếu

- AI-SDLC v5.9 — B4 (dòng 500–563), B5 GATE 1 (dòng 564–623)
- GitHub Spec Kit — `refs/spec-kit-spec.md`, `/speckit.specify`, `/speckit.clarify`
- ISO/IEC/IEEE 29148 — Kỹ thuật yêu cầu (Requirements engineering)
- INVEST — Bill Wake (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Gherkin / Cucumber — cú pháp Given–When–Then
- `../rules/` — constitution.md, code-review-rules.md · `../quy-chuan/dor-dod.md` · `../phu-luc/` Q&A Log (PL 4.5), glossary (PL 3.16), CR Form (PL 2)

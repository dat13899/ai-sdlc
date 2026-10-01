---
title: Checklist AI tự kiểm Test Case — rules/testcase-rules.md
for: B11 bước 1–2 (AI sinh Test Case từ AC) trước khi Tester/Test Lead review
owner: AI (tự kiểm) · Test Lead (A/R) · Tester (R)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.14; ISO/IEC/IEEE 29119; ISTQB CTFL; Gherkin
---

# rules/testcase-rules.md — Checklist AI tự kiểm Test Case

## Mục đích

Test Case sinh tay thì lỗi ở mức "quên một nhánh". Test Case do AI sinh hàng chục cái một lượt thì lỗi có hệ thống: **AI bám sát AC một cách máy móc** — tách mỗi câu Given/When/Then thành một case, thiếu hẳn nhóm negative và edge, và đôi khi tự thêm nghiệp vụ mà AC không nói.

Linter này chặn loại lỗi thứ hai và bảo đảm Test Case đủ sức làm đầu vào cho RTM ở B11 bước 2.

> Linter này song song với `rules/test-rules.md` (Unit Test, B9). Một bên rà **code test**, bên này rà **tài liệu test case**.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B11 bước 1 — AI sinh Test Plan/Case | AI | Acceptance Criteria (Gherkin) + tài liệu yêu cầu |
| B11 bước 2 — AI tự kiểm | AI | Test Case vừa sinh + AC nguồn để đối chiếu |
| B11 bước 3 — Ánh xạ RTM | Tester | Test Case đã qua linter |
| B11 bước 4 — Duyệt | Test Lead | Test Plan/Test Case + RTM |

**Điều kiện tiên quyết:** AI phải có **AC nguồn** trong context. Không có AC thì không được sinh Test Case — phải ghi `[CẦN LÀM RÕ]` và dừng, không đoán.

## 6 câu hỏi bắt buộc (từ tài liệu gốc)

| # | Câu hỏi | Vì sao chặn |
|---|---|---|
| 1 | Test Case có bám sát đúng Acceptance Criteria nguồn, **không suy diễn thêm nghiệp vụ ngoài phạm vi**? | AC không nói "cho huỷ đơn trong 24h" thì không được sinh case huỷ đơn — sinh thêm là đang tự đặt yêu cầu mới |
| 2 | Đã có đủ 3 nhóm case: **positive** (happy path), **negative** và **edge case** (biên giá trị, dữ liệu rỗng, sai định dạng)? | Thiếu negative/edge là lỗi phổ biến nhất của AI — happy path gần như luôn xanh |
| 3 | Mỗi Test Case có **gắn ID tham chiếu rõ ràng** tới AC nguồn? | Không có ID thì bước 2 (RTM) không thể chứng minh phủ 100% AC |
| 4 | **Steps** và **Expected Result** tách bạch, người khác đọc vào làm theo được ngay? | Nhiều mẫu gộp "thực hiện và kiểm tra" trong một ô → không test lại được bởi người khác |
| 5 | **Không chứa dữ liệu cá nhân/nhạy cảm thật** — chỉ dùng dữ liệu giả lập theo `data-classification.md`? | Test data lấy từ Production vi phạm chính sách dữ liệu dù chỉ nằm trong test |
| 6 | Có Test Case nào **trùng lặp hoặc chồng chéo** phạm vi với case khác không — đã gộp lại chưa? | Case trùng làm RTM báo phủ giả, và mỗi lần sửa bug phải sửa nhiều case |

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Hệ quả khi vi phạm |
|---|---|---|
| C1 | **Mỗi Test Case phải truy được về ít nhất 1 AC** bằng ID | Không map được → không chứng minh được coverage, Gate 4a lộ |
| C2 | Không được sinh nghiệp vụ **ngoài phạm vi AC** — thiếu thông tin thì ghi `[CẦN LÀM RÕ]` | Tự thêm nghiệp vụ = đặt yêu cầu mới ngoài Spec đã duyệt |
| C3 | Phải có **cả 3 nhóm**: positive, negative, edge — trừ khi AC có tính chất không thể có negative (ghi rõ lý do) | Thiếu negative/edge → lỗi chỉ lộ ở production |
| C4 | Test data **không chứa PII/dữ liệu thật** | Vi phạm `data-classification.md`, không đưa vào môi trường test |
| C5 | Ghi **nhãn nguồn gốc** cho từng case: `AI-generated` / `Manual` | Không phân biệt được case AI lệch với case người duyệt ở B11 bước 2 |

## Checklist tự kiểm (mở rộng)

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | Tổng số Test Case có khớp với số nhóm kiểm thử trong Test Plan không? | | |
| 2 | **Positive:** mỗi AC có ít nhất 1 case đúng luồng chuẩn? | | |
| 3 | **Negative:** đã có case khi input sai định dạng, thiếu quyền, dữ liệu không tồn tại? | | |
| 4 | **Edge:** đã có case biên giá trị (min/max/0/âm), chuỗi rỗng, danh sách rỗng, ký tự đặc biệt/Unicode? | | |
| 5 | Có case nào kiểm thứ **ngoài phạm vi AC** đã duyệt? (liệt kê mã) | | |
| 6 | Có chỗ nào AI tự bịa nghiệp vụ mà AC không nói? Đã chuyển thành `[CẦN LÀM RÕ]` chưa? | | |
| 7 | Mỗi Test Case có cột "Tham chiếu AC" điền đủ mã AC? | | |
| 8 | Có AC nào **không được Test Case nào** bảo phủ? (liệt kê mã AC) | | |
| 9 | Steps có đủ chi tiết để người khác (không phải người viết) thực hiện lại được? | | |
| 10 | Expected Result có **kiểm chứng được** bằng dữ liệu quan sát được, không mơ hồ kiểu "hiển thị đúng"? | | |
| 11 | Một ô có gộp cả hành động lẫn kết quả mong đợi không? | | |
| 12 | Có Test Case nào dùng dữ liệu thật từ Production (tên, SĐT, email, số tài khoản, hồ sơ khách hàng)? | | |
| 13 | Dữ liệu test có được đánh dấu rõ là dữ liệu giả lập? | | |
| 14 | Có case nào trùng/chồng chéo với case khác không (cùng AC, cùng điều kiện kiểm)? | | |
| 15 | Đã gắn nhãn **AI-generated / Manual** cho từng case chưa? | | |
| 16 | Với case `AI-generated`, đã được Test Lead đọc lại trước khi duyệt chưa? | | |
| 17 | Case có phụ thuộc thứ tự chạy (case sau cần dữ liệu case trước tạo ra) không? | | |
| 18 | Điều kiện tiên quyết (precondition) và dữ liệu đầu vào của case có được nêu rõ? | | |
| 19 | Case có nêu rõ môi trường/role dùng để chạy (VD: tài khoản khách hàng / admin)? | | |
| 20 | Với case bảo mật, đã có case kiểm truy cập trái phép và phân quyền sai vai trò? | | |

**Ngưỡng đạt:** C1–C5 = Đạt, câu 5 (không có case ngoài phạm vi AC) = Đạt, câu 8 (không AC nào bỏ trống) = Đạt, số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**Tách máy móc 1 AC = 1 case, thiếu negative — SAI:**

| TC | Tham chiếu AC | Loại | Precondition | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-01 | AC-12 | Positive | Đã đăng nhập | 1. Vào trang đơn hàng | Hiển thị danh sách đơn |
| TC-02 | AC-12 | Positive | Đã đăng nhập | 1. Nhấn "Huỷ đơn" | Đơn bị huỷ |

AI chỉ tách lệnh trong AC thành case, không có case khi **không đủ điều kiện huỷ**, không có case huỷ trùng, không kiểm case người dùng khác không huỷ được.

**ĐÚNG — nhóm case gắn với AC-12:**

| TC | Tham chiếu AC | Loại | Precondition | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-01 | AC-12 | Positive | Đăng nhập, đơn ở trạng thái NEW | 1. Mở đơn 2. Nhấn Huỷ 3. Xác nhận | Đơn chuyển CANCELLED, hiển thị thông báo thành công |
| TC-02 | AC-12 | Negative | Đơn đã CANCELLED | 1. Mở đơn 2. Kiểm tra nút Huỷ | Nút Huỷ không hiển thị hoặc bị từ chối, trả lỗi nghiệp vụ tương ứng |
| TC-03 | AC-12 | Negative | Đăng nhập tài khoản khách hàng B | 1. Mở đơn của khách hàng A | Từ chối truy cập — không lộ dữ liệu đơn |
| TC-04 | AC-12 | Edge | Đơn NEW, thời điểm huỷ đúng mốc giới hạn | 1. Huỷ đơn tại mốc biên | Đúng kết quả đã chốt ở AC-12 (ghi rõ quy tắc biên trong AC) |

**Test data lấy từ production — SAI:** `Khách hàng: Nguyễn Văn A, SĐT 0912345678, số tài khoản 1234567890`
**ĐÚNG:** `Khách hàng: KH_TEST_001 (dữ liệu giả lập), SĐT 0900000001`

**Case không gắn ID AC — SAI:** bước RTM không chứng minh được phủ 100% AC → Gate 4a lộ.
**ĐÚNG:** mọi dòng trong bảng Test Case đều có cột "Tham chiếu AC" điền mã.

## Khi nào chặn (block)

Không được chuyển sang bước 2 (RTM) nếu:

- [ ] Có Test Case không gắn ID AC (C1)
- [ ] Có Test Case kiểm nghiệp vụ ngoài phạm vi AC mà chưa chuyển thành `[CẦN LÀM RÕ]` (C2)
- [ ] Thiếu nhóm negative hoặc edge mà không ghi rõ lý do (C3)
- [ ] Test data chứa PII / dữ liệu thật từ Production (C4)
- [ ] Thiếu nhãn `AI-generated` / `Manual` trên case (C5)
- [ ] Có AC nào chưa được bất kỳ Test Case nào bao phủ

## Ghi chú liên kết

- **B11 bước 2 (Ánh xạ RTM):** mỗi Test Case gắn nhãn nguồn gốc `AI-generated` / `Manual`, RTM phủ 100% Acceptance Criteria.
- **B11 bước 3 (Viết automation):** script automation do AI sinh phải qua `rules/code-review-rules.md` như code thật trước khi merge.
- **B11 bước 1:** AI sinh Test Case bằng prompt B11 trong `b2/prompts.md`.

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.14 — tài liệu gốc nội bộ
- ISO/IEC/IEEE 29119 Software Testing — https://www.iso.org/standard/81291.html
- ISTQB Certified Tester Foundation Level Syllabus — https://www.istqb.org/
- Cucumber/Gherkin Reference — https://cucumber.io/docs/gherkin/
- OWASP WSTG — Web Security Testing Guide (cho nhóm negative/security case)

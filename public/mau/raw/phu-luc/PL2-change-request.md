---
title: "PL2 — Change Request Form (Yêu cầu thay đổi)"
for: "Sau Gate 1 — mọi thay đổi phạm vi / thiết kế / yêu cầu nghiệp vụ"
owner: "Người đề xuất (R) · PM (R) · PO (A — duyệt)"
nguồn: "AI-SDLC v5.9 Phụ lục 2 + mục 2 B5 (quy tắc sau Gate 1); PMBOK (PMI) — Integrated Change Control"
---

# PL2 — Change Request Form

> **Khi nào dùng:** sau khi Spec đã qua **Gate 1**, mọi thay đổi về phạm vi / thiết kế / yêu cầu nghiệp vụ **bắt buộc** đệ trình qua biểu mẫu này và được **PM + PO duyệt trước khi tiến hành**. Không nhận thay đổi qua tin nhắn miệng hoặc chat.

## 1. Thông tin yêu cầu

| Trường | Nội dung |
|---|---|
| Mã yêu cầu | CR-[YYYY]-[xxx] |
| Ngày đề xuất | [YYYY-MM-DD] |
| Người đề xuất | [Tên, vai trò] |
| Dự án / Module | [ ] |
| Loại thay đổi | ☐ Phạm vi ☐ Yêu cầu nghiệp vụ ☐ Thiết kế/kiến trúc ☐ Phi chức năng ☐ Giao diện ☐ Dữ liệu/migration ☐ Tiến độ |
| Mức độ khẩn cấp | ☐ Gấp (chặn tiến độ) ☐ Bình thường ☐ Có thể chờ sprint sau |

## 2. Nội dung thay đổi

### 2.1. Hiện trạng (đã chốt ở Spec)

[Mô tả chính xác điều đang được ghi trong `spec.md` / BRD, kèm mã yêu cầu: FR-xxx / AC-xxx]

### 2.2. Yêu cầu thay đổi

[Mô tả điều muốn đổi thành gì — cụ thể, đo được]

### 2.3. Lý do

[Vì sao cần đổi: khách hàng đổi yêu cầu / phát hiện thiếu sót / quy định thay đổi / lỗi hiểu sai từ đầu]

### 2.4. Phương án thay thế đã cân nhắc

| Phương án | Ưu điểm | Nhược điểm | Được chọn? |
|---|---|---|---|
| [Không làm gì] | Không tốn công | Không đáp ứng nhu cầu | ☐ |
| [Làm theo yêu cầu mới] | [ ] | [ ] | ☐ |
| [Làm phiên bản tối giản] | [ ] | [ ] | ☐ |

## 3. Đánh giá tác động

### 3.1. Tác động kỹ thuật

| Hạng mục | Đánh giá chi tiết |
|---|---|
| Tài liệu bị ảnh hưởng | ☐ spec.md ☐ plan.md ☐ tasks.md ☐ ADR ☐ OpenAPI ☐ Test Plan ☐ BRD ☐ constitution.md |
| Có đổi data model / migration DB? | ☐ Không ☐ Có — mô tả: [ ] |
| Có ảnh hưởng API công khai (breaking change)? | ☐ Không ☐ Có — cần tăng version: [ ] |
| Có ảnh hưởng bảo mật/phân quyền? | ☐ Không ☐ Có — cần Security Lead xem: [ ] |
| Có ảnh hưởng yêu cầu phi chức năng (hiệu năng, bảo mật)? | ☐ Không ☐ Có — mô tả: [ ] |
| Có ảnh hưởng kiến trúc đã ký ở Gate 2? | ☐ Không ☐ Có — cần ADR mới: [ ] |

### 3.2. Tác động tiến độ & công sức

| Hạng mục | Số ngày công | Ai làm |
|---|---|---|
| Phân tích & cập nhật tài liệu | [ ] | BA |
| Thiết kế lại (nếu cần) | [ ] | Tech Lead |
| Lập trình | [ ] | Dev |
| Viết/bổ sung test | [ ] | Dev + Tester |
| Kiểm thử lại & regression | [ ] | Tester |
| **Tổng** | **[ ]** | |

**Ảnh hưởng tiến độ:** [Trễ X ngày / không ảnh hưởng mốc nào / ảnh hưởng mốc: ...]

### 3.3. Tác động chi phí

| Khoản | Trước | Sau | Chênh lệch |
|---|---|---|---|
| Ngày công | [ ] | [ ] | [ ] |
| Hạ tầng | [ ] | [ ] | [ ] |
| Công cụ | [ ] | [ ] | [ ] |

### 3.4. Tác động tới phần đã hoàn thành

| Câu hỏi | Trả lời |
|---|---|
| Có phải làm lại phần nào đã xong? | [ ] |
| Có test nào phải viết lại? | [ ] |
| Có ảnh hưởng dữ liệu Production hiện có? | [ ] |
| Có cần thông báo cho người dùng? | [ ] |

## 4. Quyết định

| Trường | Nội dung |
|---|---|
| Quyết định | ☐ Chấp thuận ☐ Chấp thuận một phần ☐ Hoãn ☐ Từ chối |
| Điều kiện kèm theo | [Nếu chấp thuận có điều kiện — ghi rõ] |
| Người duyệt (PM) | [Tên] — Ngày: [YYYY-MM-DD] |
| Người duyệt (PO) | [Tên] — Ngày: [YYYY-MM-DD] |
| Người duyệt (Tech Lead — nếu ảnh hưởng kiến trúc) | [Tên] — Ngày: [YYYY-MM-DD] |
| Người duyệt (Security Lead — nếu ảnh hưởng ATTT) | [Tên] — Ngày: [YYYY-MM-DD] |
| Lý do từ chối / hoãn | [ ] |

## 5. Theo dõi thực hiện

| Việc | Owner | Hạn | Trạng thái |
|---|---|---|---|
| Cập nhật spec.md | [ ] | [ ] | ☐ |
| Cập nhật plan.md / ADR | [ ] | [ ] | ☐ |
| Cập nhật OpenAPI | [ ] | [ ] | ☐ |
| Bổ sung test case + RTM | [ ] | [ ] | ☐ |
| Cập nhật Q&A Log | [ ] | [ ] | ☐ |
| Thông báo các bên liên quan | [ ] | [ ] | ☐ |
| Ghi vào CHANGELOG | [ ] | [ ] | ☐ |

## 6. Quy tắc áp dụng

| Quy tắc | Nội dung |
|---|---|
| Khi nào bắt buộc dùng form này | Sau Gate 1, mọi thay đổi phạm vi / thiết kế / yêu cầu nghiệp vụ |
| Ai phải duyệt | PM + PO. Thêm Tech Lead nếu ảnh hưởng kiến trúc; thêm Security Lead nếu ảnh hưởng ATTT |
| Thay đổi nhỏ thì sao? | Vẫn dùng form, chỉ điền phần liên quan — bỏ qua form dễ tạo tiền lệ lách quy trình |
| Có được làm trước khi duyệt? | ❌ Không. Việc làm trước khi duyệt không được tính vào phạm vi chính thức |
| Thay đổi trong lúc sự cố Production (hotfix)? | Dùng quy trình Hotfix (mục 3 tài liệu gốc) — sau khi ổn định vẫn phải bổ sung form này |
| Ghi lại ở đâu | Lưu vào thư mục dự án + cập nhật `4.5-QA-log.md` |

### Phân biệt: khi nào dùng Change Request, khi nào không

| Tình huống | Dùng PL2? |
|---|---|
| Khách đổi thời hạn hoàn tiền từ 7 ngày thành 3 ngày | ✅ Có — thay đổi yêu cầu nghiệp vụ |
| Dev phát hiện bug trong lúc code và sửa | ❌ Không — bug fix trong phạm vi Spec |
| Làm rõ một câu hỏi mơ hồ trong Spec (không đổi ý nghĩa) | ❌ Không — ghi Q&A Log |
| Thêm tính năng mới không có trong Spec | ✅ Có |
| Đổi cấu trúc API đã publish cho đối tác | ✅ Có — có breaking change |
| Sửa lỗi chính tả trong tài liệu | ❌ Không |
| Thay đổi mức phân quyền của một vai trò | ✅ Có — ảnh hưởng ATTT |

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 2 và mục 2 B5 (quy tắc: sau Gate 1 mọi thay đổi phải qua Change Request) — tài liệu gốc nội bộ
- PMBOK Guide — Perform Integrated Change Control, PMI — https://www.pmi.org/
- IIBA BABOK v3 — Managing Requirements Changes — https://www.iiba.org/
- Atlassian — Change management process — https://www.atlassian.com/itsm/change-management

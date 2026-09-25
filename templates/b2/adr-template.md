---
title: ADR Template (MADR)
for: B6 — Thiết kế kiến trúc (mọi quyết định kiến trúc quan trọng)
owner: Tech Lead (A/R) · Dev (R) · AI (draft từ prompt B6)
nguồn: MADR (Markdown Architectural Decision Records); AI-SDLC v5.9 Phụ lục 3 mục 3.3
---

# ADR Template (MADR)

> Copy khối dưới đây vào `docs/adr/NNNN-tieu-de-ngan.md` cho mỗi quyết định kiến trúc. Đánh số tuần tự, không tái sử dụng số. Kiểm bằng `rules/adr-rules.md` trước khi mở PR.

---

## Khối mẫu

```markdown
---
title: "ADR-0001: [Tiêu đề ngắn gọn quyết định]"
status: proposed | accepted | rejected | deprecated | superseded by ADR-XXXX
date: YYYY-MM-DD
decision-makers: [Tên Tech Lead, tên người liên quan]
consulted: [Tên người được hỏi ý kiến]
informed: [Tên người cần được thông báo]
nguồn: AI-SDLC v5.9 B6
---

# ADR-0001: [Tiêu đề]

## Trạng thái (Status)

`accepted` — ngày YYYY-MM-DD

## Bối cảnh và vấn đề (Context and Problem Statement)

[Mô tả bối cảnh và vấn đề cần quyết định, 2–5 câu. Không nêu giải pháp ở mục này.]

## Yếu tố quyết định (Decision Drivers)

- [Yếu tố 1: VD hiệu năng — 10.000 request/giây]
- [Yếu tố 2: VD đội chỉ có 2 backend, không đủ người vận hành microservices]
- [Yếu tố 3: VD ngân sách hạ tầng ≤ X triệu/tháng]

## Các phương án đã cân nhắc (Considered Options)

1. [Phương án 1]
2. [Phương án 2]
3. [Phương án 3 — nếu có]

## Quyết định (Decision Outcome)

**Đã chọn:** [Phương án X]

**Lý do:** [Vì sao chọn phương án này thay vì các phương án khác, gắn với Decision Drivers]

## Hệ quả (Consequences)

### Tích cực

- [ ]

### Tiêu cực / mặt phải chấp nhận

- [ ]  ← BẮT BUỘC có ít nhất 1 mục

### Rủi ro còn lại

- [ ]

## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)

### Phương án 1 — [Tên]

[Mô tả]

- ✅ Tốt: [ ]
- ❌ Xấu: [ ]

### Phương án 2 — [Tên]

[Mô tả]

- ✅ Tốt: [ ]
- ❌ Xấu: [ ]

## Liên kết (Links / More Information)

- [Tài liệu liên quan / ADR liên quan / spec.md mục ...]
- [Bằng chứng benchmark, tài liệu tham khảo]
```

> **Ghi chú:** MADR 3.x gọi phần này là **"More Information"**; MADR 4.x đổi thành **"Links"**. Dùng tên nào cũng được — miễn là có mục này ở cuối ADR.

---

## Quy tắc viết ADR

| Quy tắc | Nội dung |
|---|---|
| **Khi nào phải viết ADR** | Quyết định ảnh hưởng kiến trúc, khó đảo ngược, hoặc ảnh hưởng nhiều người: chọn CSDL, chọn framework, chọn mô hình xác thực, tách service, chiến lược cache, chọn cloud |
| **Khi nào KHÔNG cần ADR** | Chi tiết trong một module (copy của 1 hàm, đặt tên biến), chọn thư viện nhỏ dùng nội bộ 1 nơi, việc revert được trong 1 ngày |
| **Tối thiểu bao nhiêu phương án** | **≥ 2** phương án thực sự cân nhắc. Chỉ có 1 phương án nghĩa là chưa phân tích |
| **Bắt buộc nêu mặt xấu** | Mọi ADR phải có ít nhất 1 tiêu cực/hệ quả phải chấp nhận — không có ADR nào hoàn hảo |
| **AI sinh ADR** | AI draft được, nhưng **quyết định cuối thuộc Tech Lead**. AI không được tự đổi status thành `accepted` |
| **Đổi quyết định cũ** | Không sửa nội dung ADR cũ. Tạo ADR mới và ghi vào ADR cũ: `superseded by ADR-XXXX` |
| **Ai duyệt** | Tech Lead duyệt qua Pull Request. Số ADR phải nằm trong `docs-index.md` |

## Ví dụ ADR đã điền (mẫu tham khảo)

Đây là một ADR hoàn chỉnh, đã điền — copy và sửa theo dự án của bạn.

```markdown
---
title: "ADR-0001: Dùng PostgreSQL cho CSDL chính"
status: accepted
date: 2026-09-14
decision-makers: [Nguyễn Văn A (Tech Lead)]
consulted: [Trần Thị B (Dev senior), Lê Văn C (DevOps)]
informed: [Phạm Thị D (PM), Hoàng Văn E (PO)]
nguồn: AI-SDLC v5.9 B6
---

# ADR-0001: Dùng PostgreSQL cho CSDL chính

## Trạng thái (Status)

`accepted` — ngày 2026-09-14

## Bối cảnh và vấn đề (Context and Problem Statement)

Dự án [Tên dự án] cần chọn CSDL chính cho hệ thống quản lý đơn hàng.
Dữ liệu có quan hệ chặt (đơn hàng ↔ chi tiết đơn ↔ sản phẩm), cần đảm bảo
tính toàn vẹn khi thanh toán, và đội chỉ có 2 backend developer.

## Yếu tố quyết định (Decision Drivers)

- Dữ liệu quan hệ chặt, cần transaction ACID (bắt buộc cho luồng thanh toán)
- Đội chỉ có 2 backend, không đủ người vận hành hệ CSDL phân tán
- Ngân sách hạ tầng ≤ [X] triệu/tháng
- Cần tìm kiếm toàn văn trên mô tả sản phẩm (không muốn thêm dịch vụ ngoài)

## Các phương án đã cân nhắc (Considered Options)

1. **PostgreSQL**
2. **MongoDB**
3. **MySQL**

## Quyết định (Decision Outcome)

**Đã chọn:** PostgreSQL

**Lý do:** đáp ứng đủ 4 yếu tố quyết định — có transaction ACID đầy đủ cho luồng
thanh toán, đội chỉ cần vận hành một hệ CSDL duy nhất, hỗ trợ JSONB cho dữ liệu
bán cấu trúc và full-text search đủ dùng (yếu tố 4) — nên không phải thêm dịch vụ.

## Hệ quả (Consequences)

### Tích cực

- Transaction ACID đầy đủ → luồng thanh toán an toàn, không cần tự viết bù trừ
- Một hệ CSDL cho cả dữ liệu quan hệ, JSON và tìm kiếm toàn văn → ít thành phần vận hành
- Kiến thức PostgreSQL phổ biến, dễ tuyển người

### Tiêu cực / mặt phải chấp nhận

- Schema thay đổi phải qua migration — thêm bước vào quy trình phát hành
- Đội chưa quen PostgreSQL: cần khoảng 3 ngày làm quen (ước lượng nội bộ, chưa benchmark)
- Sharding dọc theo tenant phức tạp hơn MongoDB nếu sau này dữ liệu tăng rất lớn

### Rủi ro còn lại

- Chưa đo hiệu năng full-text search với dữ liệu thật; nếu không đạt NFR thì phải
  bổ sung index hoặc chuyển sang dịch vụ tìm kiếm riêng (sẽ cần ADR mới)

## Ưu / nhược điểm của từng phương án (Pros and Cons of the Options)

### Phương án 1 — PostgreSQL

- ✅ Tốt: ACID đầy đủ; JSONB; full-text search native; miễn phí, cộng đồng lớn
- ❌ Xấu: migration cần kỷ luật; đội cần thời gian làm quen; scale ngang khó hơn NoSQL

### Phương án 2 — MongoDB

- ✅ Tốt: linh hoạt schema; scale ngang dễ; tốt cho dữ liệu phi cấu trúc
- ❌ Xấu: transaction nhiều document phức tạp hơn; dữ liệu quan hệ chặt bị "nhồi" vào document; thêm dịch vụ cần vận hành

### Phương án 3 — MySQL

- ✅ Tốt: đội đã quen; phổ biến; hiệu năng tốt cho CRUD đơn giản
- ❌ Xấu: JSONB kém linh hoạt hơn PostgreSQL; full-text search yếu hơn → dễ phải thêm dịch vụ tìm kiếm riêng

## Liên kết (Links)

- `spec.md` mục NFR — yêu cầu hiệu năng và toàn vẹn dữ liệu
- `plan.md` mục Data Model
- ADR-0007 (nếu có) — chiến lược migration CSDL
```

## Ví dụ viết đúng vs viết sai

| | Ví dụ |
|---|---|
| ❌ **Sai** | "Chọn PostgreSQL. Vì nó tốt và phổ biến." *(1 phương án, không có mặt xấu, không có yếu tố quyết định)* |
| ✅ **Đúng** | "Chọn PostgreSQL thay vì MongoDB. Yếu tố quyết định: dữ liệu quan hệ chặt (đơn ↔ chi tiết đơn), cần transaction ACID cho thanh toán. Mặt phải chấp nhận: schema thay đổi cần migration; đội chưa quen PostgreSQL sẽ cần ~3 ngày làm quen. Đã cân nhắc MongoDB (linh hoạt schema, nhưng transaction nhiều document phức tạp) và MySQL (quen thuộc hơn nhưng JSONB và full-text search yếu hơn)." |

## Nguồn tham chiếu

- MADR — Markdown Architectural Decision Records — https://adr.github.io/madr/
- ADR GitHub org — https://adr.github.io/
- AI-SDLC v5.9, Phụ lục 3 mục 3.3 và mục 2 B6 — tài liệu gốc nội bộ
- Michael Nygard — Documenting Architecture Decisions — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

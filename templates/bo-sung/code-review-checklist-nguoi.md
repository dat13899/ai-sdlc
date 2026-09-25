---
title: "Checklist Code Review tầng 2 (Human Review)"
for: "B10. Code Review 2 tầng — GATE 3 (bước 5: Reviewer dùng checklist)"
owner: "Reviewer (người khác tác giả) · Tech Lead (A/R) · Security (C)"
nguồn: "AI-SDLC v5.9 dòng 839–904; OWASP ASVS; OWASP LLM Top 10; GitHub PR review"
---

# Checklist Code Review tầng 2 (do con người thực hiện)

**PR/MR**: `[link]` · **Tác giả**: [Tên] · **Reviewer**: [Tên] · **Ngày**: [Ngày]

**Phân tầng review (B10)**:
- **Tầng 1 — AI review (tự động, CI)**: quét bug, convention, code smell, bảo mật; SAST + secret scan. Dev phải sửa hết finding mức **High/Critical** trước khi mời review người.
- **Tầng 2 — Human review (file này)**: tập trung **nghiệp vụ, kiến trúc, bảo mật, khả năng bảo trì, tác động chéo**. Bắt buộc để được merge.

> Nguyên tắc: **reviewer khác tác giả**; module lõi/bảo mật cần **tối thiểu 2 reviewer**. Reviewer không được approve khi còn mục Critical ở trạng thái "Không đạt".

---

## 0. Điều kiện tiên quyết trước khi review

- [ ] PR mô tả rõ mục tiêu, gắn link `spec.md` (AC) và `tasks.md` (task ID + ticket)
- [ ] CI xanh: build, unit test, lint, AI review tầng 1
- [ ] Không còn finding High/Critical từ tầng 1
- [ ] PR nhỏ, tập trung một phạm vi (khuyến nghị < 400 dòng thay đổi)
- [ ] Không có thay đổi ngoài phạm vi task (không "tiện tay" refactor)
- [ ] Branch đúng quy ước, commit message theo Conventional Commits
- [ ] Không có file nghịch lý trong diff: `node_modules`, `.env`, lock file thay đổi không chủ đích, file build

---

## 1. Nghiệp vụ & Acceptance Criteria

- [ ] Code thực thi **đúng AC** trong `spec.md` — chỉ ra AC nào được thoả (AC-xxx)
- [ ] Truy vết: có test tương ứng cho mỗi AC mới/sửa
- [ ] Không tự thêm tính năng ngoài phạm vi spec (chặn "feature creep")
- [ ] Trường hợp biên trong spec mục 4 đã được xử lý
- [ ] Thông báo lỗi hiển thị cho người dùng đúng ngữ cảnh tiếng Việt, không lộ chi tiết kỹ thuật
- [ ] Đơn vị tiền tệ, định dạng ngày, số điện thoại, mã số thuế theo chuẩn Việt Nam *(nếu liên quan)*

---

## 2. Kiến trúc & Thiết kế

- [ ] Thay đổi khớp với C4/ADR đã duyệt ở Gate 2; nếu lệch → phải có ADR mới hoặc lý do ghi trong PR
- [ ] Không có phụ thuộc vòng (circular dependency) giữa module
- [ ] Ranh giới tầng đúng: controller không chứa logic nghiệp vụ, repository không chứa luật nghiệp vụ
- [ ] Không dùng lại anti-pattern đã bị ghi nhận trong `constitution.md`
- [ ] Thay đổi data model có migration và đường rollback
- [ ] Không phá vỡ hợp đồng API đã công bố (OpenAPI); nếu breaking change → đã thống nhất version
- [ ] Không thêm dependency mới chưa qua đánh giá (license + bảo mật)

---

## 3. Bảo mật (bắt buộc — đối chiếu OWASP ASVS/Top 10)

- [ ] **Kiểm soát truy cập**: mọi endpoint mới có kiểm tra quyền; không tin dữ liệu client gửi lên để quyết định quyền
- [ ] **Injection**: truy vấn dùng tham số hoá/prepared statement; không nối chuỗi SQL/command
- [ ] **XSS**: dữ liệu người dùng được escape khi render; không dùng `innerHTML`/`dangerouslySetInnerHTML` với dữ liệu chưa lọc
- [ ] **Xác thực/Phiên**: token có thời hạn, không lưu secret trong localStorage nếu không có biện pháp bù
- [ ] **Dữ liệu nhạy cảm**: PII/số thẻ/token được che trong log; không log mật khẩu, OTP, số CCCD
- [ ] **Secret**: không có API key/chuỗi kết nối trong code, chỉ lấy từ secret store/biến môi trường
- [ ] **CSRF/CORS**: cấu hình đúng cho các luồng đổi trạng thái
- [ ] **Upload file**: kiểm tra loại/kích thước, không thực thi file tải lên
- [ ] **Rate limit**: endpoint xác thực/OTP/tìm kiếm có giới hạn tần suất
- [ ] **Lỗi**: thông báo lỗi không lộ stack trace/phiên bản thư viện ra ngoài
- [ ] **Mã do AI sinh**: đã đọc kỹ, không chấp nhận thư viện/hàm "ảo giác" không tồn tại; đã bật lọc trùng lặp mã nguồn công khai trên công cụ AI
- [ ] **Prompt injection** *(nếu PR chạm AI agent / nạp tài liệu chỉ dẫn ngoài)*: đã đọc toàn bộ `skill.md`/system prompt của đối tác trước khi nạp vào ngữ cảnh; không có chỉ dẫn ẩn làm rò rỉ secret hay dữ liệu ra ngoài

---

## 4. Chất lượng & Khả năng bảo trì

- [ ] Tên biến/hàm/class diễn tả đúng ý định, không viết tắt mơ hồ
- [ ] Hàm ngắn, một trách nhiệm; độ phức tạp trong ngưỡng quy định
- [ ] Không lặp code (DRY) nhưng cũng không trừu tượng hoá quá sớm (YAGNI)
- [ ] Xử lý lỗi tường minh: không bắt `catch {}` rỗng, không nuốt lỗi
- [ ] Comment giải thích **tại sao**, không giải thích cái hiển nhiên; **tiếng Việt có dấu** hoặc tiếng Anh nhất quán theo convention dự án
- [ ] Không còn mã debug, `console.log`, `print`, TODO không gắn ticket
- [ ] Mã chết (dead code) đã xoá, không comment-out giữ lại
- [ ] Const/immutable ưu tiên hơn mutable khi có thể
- [ ] Xử lý thời gian theo UTC ở tầng lưu trữ, chỉ đổi sang giờ Việt Nam (UTC+7) ở tầng hiển thị
- [ ] Encoding UTF-8, xử lý đúng tiếng Việt có dấu ở mọi điểm vào/ra

---

## 5. Kiểm thử

- [ ] Unit test cho logic mới, có ý nghĩa (không test hình thức kiểu assert true)
- [ ] Test đã ở trạng thái **RED trước khi viết code** (TDD) — bằng chứng trong lịch sử commit/nhánh
- [ ] Test bao phủ các nhánh lỗi và trường hợp biên, không chỉ đường hạnh phúc (happy path)
- [ ] Test độc lập, không phụ thuộc thứ tự chạy, không flaky
- [ ] Không mock quá mức làm test mất giá trị kiểm chứng
- [ ] Coverage không giảm so với nhánh chính
- [ ] Dữ liệu test không chứa dữ liệu cá nhân thật

---

## 6. Hiệu năng & Khả năng mở rộng

- [ ] Không có truy vấn trong vòng lặp (N+1 query)
- [ ] Truy vấn mới có index phù hợp khi chạm bảng lớn
- [ ] Không tải toàn bộ tập dữ liệu vào bộ nhớ khi chỉ cần một phần (phân trang/stream)
- [ ] Cache (nếu có) có chiến lược vô hiệu hoá rõ ràng
- [ ] Xử lý tác vụ nặng bất đồng bộ, không chặn luồng phản hồi
- [ ] Thay đổi không làm giảm chỉ số hiệu năng đã cam kết (NFR trong spec)

---

## 7. Tác động chéo & Vận hành

- [ ] Xác định đúng các module/hệ thống bị ảnh hưởng, đã kiểm tra không gãy
- [ ] Thay đổi schema/config có kế hoạch triển khai theo thứ tự (backward compatible một nhịp deploy)
- [ ] Tính năng mới có feature flag *(nếu cần triển khai dần/rollback nhanh)*
- [ ] Log/metric đủ để chẩn đoán sự cố sau này (correlation ID, log có cấu trúc)
- [ ] Ảnh hưởng tới Runbook/tài liệu vận hành đã được cập nhật
- [ ] Thông báo cho team/dependency liên quan bằng kênh đúng quy ước

---

## 8. Tuân thủ quy trình AI-SDLC

- [ ] Có truy vết PR → task → AC → spec
- [ ] Tuân thủ `constitution.md` và `code-review-rules.md` (tầng 1 đã chạy)
- [ ] Không có dấu hiệu "merge mù" code AI sinh: reviewer hiểu và giải thích được mọi đoạn code quan trọng
- [ ] Nếu dùng công cụ AI ngoài danh sách được duyệt → đã có phê duyệt Tech Lead + An ninh thông tin
- [ ] Kết quả kiểm tra license dependency (nếu có dependency mới) đạt

---

## 9. Kết luận review

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Nghiệp vụ/AC | Đạt / Không đạt | [Ghi chú] |
| Kiến trúc | Đạt / Không đạt | [Ghi chú] |
| Bảo mật | Đạt / Không đạt | [Ghi chú] |
| Chất lượng/Test | Đạt / Không đạt | [Ghi chú] |
| Tác động chéo | Đạt / Không đạt | [Ghi chú] |

**Quyết định**: Approve | Request changes | Comment
**Số reviewer đã approve**: [1 hoặc 2 — 2 nếu module lõi/bảo mật]
**Comment còn mở (blocking)**: [Số lượng] — phải bằng 0 để merge.

> Merge bị chặn bởi **branch protection** nếu thiếu review hoặc CI chưa xanh. Merge PR = **Gate 3**, do Tech Lead/Reviewer thực hiện.

---

## Nguồn tham chiếu

- AI-SDLC v5.9 — B10 Code Review 2 tầng, GATE 3 (dòng 839–904)
- OWASP ASVS — Application Security Verification Standard (`refs/asvs-readme.md`, `refs/asvs5.md`)
- OWASP Top 10 — rủi ro bảo mật ứng dụng web · OWASP LLM Top 10 — rủi ro khi dùng AI
- `../rules/code-review-rules.md` (PL 3.14) · `../rules/constitution.md` (PL 3.1)
- `./threat-model-STRIDE.md` — mô hình hoá mối đe doạ liên quan

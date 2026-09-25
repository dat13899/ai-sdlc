---
title: CHANGELOG
for: B13 — Release & triển khai môi trường (mọi bản phát hành)
owner: Tech Lead (R) · Dev (R) · PM (I)
nguồn: AI-SDLC v5.9 dòng 1056-1133; Keep a Changelog 1.1.0; Semantic Versioning 2.0.0
---

# Changelog

Mọi thay đổi đáng chú ý của dự án được ghi ở file này.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Cách dựng:** Tech Lead cập nhật khi chuẩn bị Release (B13). Nội dung lấy từ commit Conventional Commits giữa 2 tag — không viết tay từ trí nhớ. File này là đầu vào của Release Note gửi khách hàng.

## Quy tắc ghi

| Quy tắc | Chi tiết |
|---|---|
| Ngôn ngữ | Viết cho **người dùng cuối** đọc hiểu — không phải log kỹ thuật, không mã PR |
| Định dạng ngày | ISO 8601: `YYYY-MM-DD` |
| Thứ tự phiên bản | Mới nhất lên đầu |
| Nhóm mục | Chỉ dùng 6 nhóm dưới, **không tự đặt nhóm mới** |
| Mục rỗng | Không để nhóm rỗng trong phiên bản đã phát hành |
| Liên kết | Mỗi mục nên có link tới issue/ticket nếu có |
| Người dùng không thấy | Thay đổi nội bộ (refactor, test, CI) ghi rõ "[nội bộ]" |

## Sáu nhóm mục

| Nhóm | Dùng khi |
|---|---|
| **Added** | Tính năng mới |
| **Changed** | Thay đổi hành vi của tính năng đang có |
| **Deprecated** | Tính năng sắp bị bỏ (vẫn còn dùng được) |
| **Removed** | Tính năng đã bị bỏ hẳn |
| **Fixed** | Sửa lỗi |
| **Security** | Vá lỗ hổng, thay đổi liên quan bảo mật (nên mô tả **không lộ chi tiết khai thác** trước khi người dùng cập nhật) |

## Liên hệ với Semantic Versioning

| Loại thay đổi | Tăng phiên bản | Ví dụ |
|---|---|---|
| Breaking change (không tương thích ngược) | **MAJOR** — `2.0.0` | Đổi cấu trúc API, bỏ endpoint, đổi định dạng dữ liệu |
| Thêm tính năng tương thích ngược | **MINOR** — `1.3.0` | Thêm endpoint mới, thêm trường tuỳ chọn |
| Sửa lỗi tương thích ngược | **PATCH** — `1.3.1` | Fix bug không đổi interface |
| Chỉ sửa nội bộ (refactor, docs, CI) | Không bắt buộc release | Ghi vào Unreleased |

## Khi nào cập nhật

- [ ] Trong lúc làm: thêm mục vào `Unreleased` ngay khi merge PR có thay đổi đáng chú ý
- [ ] Khi cắt release (B13): chuyển `Unreleased` → phiên bản cụ thể kèm ngày phát hành
- [ ] Sau release: tạo lại mục `Unreleased` trống
- [ ] Trước Gate 5 (Go/No-Go): kiểm tra Changelog đã phản ánh đủ thay đổi của release

---

## [Unreleased]

### Added
- [Tính năng đang phát triển]

### Changed
- [Thay đổi hành vi đang chờ phát hành]

### Fixed
- [Lỗi đang chờ phát hành]

### Security
- [Vá bảo mật đang chờ phát hành]

---

## [1.3.0] — [YYYY-MM-DD]

### Added
- Xuất báo cáo doanh thu theo tháng ra file Excel, kèm bộ lọc theo chi nhánh. ([TICKET-142](link))
- Cảnh báo tự động qua Telegram khi số dư ví dưới ngưỡng cấu hình. ([TICKET-155](link))

### Changed
- Trang danh sách đơn hàng mặc định sắp xếp theo ngày tạo mới nhất (trước đây sắp theo mã đơn).
- Thời gian chờ tối đa của API tìm kiếm tăng từ 5s lên 15s cho dữ liệu lớn.

### Deprecated
- Endpoint `GET /api/v1/report/export` sẽ bị bỏ ở phiên bản 2.0.0 — dùng `GET /api/v1/reports/export` thay thế.

### Fixed
- Sửa lỗi tổng tiền hiển thị sai 1 đơn vị khi sản phẩm có giá lẻ (làm tròn sai). ([BUG-0087](link))
- Sửa lỗi không đăng xuất được khi token đã hết hạn ở tab khác.
- [nội bộ] Sửa flaky test ở module thanh toán.

### Security
- Vá lỗ hổng cho phép truy cập dữ liệu đơn hàng của người dùng khác qua tham số ID. Ảnh hưởng phiên bản 1.2.0–1.2.4; khuyến nghị cập nhật. ([SEC-0031](link))

---

## [1.2.0] — [YYYY-MM-DD]

### Added
- Tính năng đăng nhập bằng Zalo OA.
- Tự động đồng bộ tồn kho mỗi 15 phút.

### Changed
- Giao diện quản lý người dùng chuyển sang dạng bảng có tìm kiếm và phân trang.

### Removed
- Bỏ chức năng xuất file CSV (đã có thay thế là xuất Excel).

### Fixed
- Sửa lỗi mất dữ liệu nháp khi người dùng mất mạng giữa lúc lưu.

---

## [1.1.0] — [YYYY-MM-DD]

### Added
- Phiên bản đầu tiên có tính năng báo cáo.

### Security
- Bật xác thực 2 lớp cho tài khoản quản trị.

---

## [1.0.0] — [YYYY-MM-DD]

### Added
- Phát hành chính thức: quản lý đơn hàng, khách hàng, thanh toán.

---

## Mẫu cho release sắp tới

Khi chuẩn bị cắt release, thay tiêu đề và điền:

```markdown
## [1.4.0] — 2026-10-01

### Added
- <lấy từ: git log --pretty='%s' v1.3.0..HEAD | grep '^feat'>

### Fixed
- <lấy từ: git log --pretty='%s' v1.3.0..HEAD | grep '^fix'>
```

Lệnh gợi ý để gom nội dung Changelog từ Conventional Commits:

```bash
# Xem commit giữa 2 phiên bản, nhóm theo type
git log v1.3.0..HEAD --pretty='%s' | sort

# Chỉ lấy feature và fix
git log v1.3.0..HEAD --pretty='%s' | grep -E '^(feat|fix)'
```

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 2 B13 — tài liệu gốc nội bộ
- Keep a Changelog 1.1.0 — https://keepachangelog.com/en/1.1.0/
- Semantic Versioning 2.0.0 — https://semver.org/spec/v2.0.0.html
- Conventional Commits 1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/
- GNU Coding Standards — Change Logs — https://www.gnu.org/prep/standards/html_node/Change-Logs.html

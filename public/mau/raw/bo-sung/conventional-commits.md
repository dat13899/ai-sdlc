---
title: Conventional Commits — quy ước commit của dự án
for: B8 bước 5 — Commit & mở PR
owner: Dev (R) · Tech Lead (A) · AI (sinh commit message — người kiểm)
nguồn: AI-SDLC v5.9 dòng 734-789 + mục 5; Conventional Commits 1.0.0; Semantic Versioning
---

# Conventional Commits — quy ước commit

> **Cách dựng:** Tech Lead đặt quy ước này ở B2 (thuộc `CODING_CONVENTION.md`), áp dụng từ B8. Commit message đúng chuẩn là đầu vào tự động của `CHANGELOG.md` (B13) và của Semantic Versioning.

## 1. Định dạng

```
<type>[phạm vi tuỳ chọn]: <mô tả ngắn>

[phần thân tuỳ chọn]

[footer tuỳ chọn]
```

### Quy tắc viết

| Thành phần | Quy tắc |
|---|---|
| `type` | Bắt buộc, chọn từ bảng ở mục 2 |
| `phạm vi` (scope) | Tuỳ chọn, trong ngoặc đơn: `feat(auth):` — là module/tầng bị ảnh hưởng |
| `mô tả ngắn` | Bắt buộc, **không viết hoa chữ đầu**, **không dấu chấm cuối**, mệnh lệnh thức ("thêm", "sửa" — không phải "đã thêm") |
| Độ dài dòng tiêu đề | ≤ 72 ký tự |
| Phần thân | Tuỳ chọn — giải thích **vì sao**, không lặp lại **cái gì** (đã có ở tiêu đề) |
| Footer | Tuỳ chọn — `Refs:`, `Closes:`, `Co-authored-by:`, `Reviewed-by:`, `BREAKING CHANGE:` |
| Ngôn ngữ | Thống nhất 1 ngôn ngữ trong toàn dự án — chọn tiếng Việt hoặc tiếng Anh, không trộn |

## 2. Bảng type đầy đủ

| Type | Dùng khi | Vào CHANGELOG? | Ảnh hưởng SemVer |
|---|---|---|---|
| `feat` | Thêm tính năng mới cho người dùng | ✅ Added | MINOR |
| `fix` | Sửa lỗi | ✅ Fixed | PATCH |
| `docs` | Chỉ sửa tài liệu | ❌ | — |
| `style` | Format, dấu cách, dấu chấm phẩy — không đổi hành vi | ❌ | — |
| `refactor` | Đổi cấu trúc code, không đổi hành vi, không sửa lỗi | ❌ | — |
| `perf` | Cải thiện hiệu năng | ✅ (nếu người dùng thấy) | PATCH |
| `test` | Thêm/sửa test | ❌ | — |
| `build` | Thay đổi build system, dependency | ❌ | — |
| `ci` | Thay đổi cấu hình CI/CD | ❌ | — |
| `chore` | Việc lặt vặt không thuộc nhóm trên | ❌ | — |
| `revert` | Hoàn tác một commit trước đó | — | — |
| `security` | Vá bảo mật | ✅ Security | PATCH (hoặc MAJOR nếu buộc đổi cấu hình) |

## 3. Breaking change

Đánh dấu thay đổi phá vỡ tương thích bằng **dấu `!`** sau type/scope, **và** ghi footer `BREAKING CHANGE:` mô tả cụ thể.

```
feat(api)!: đổi định dạng trả về của endpoint /orders

BREAKING CHANGE: trường `items` đổi từ mảng sang object có khoá theo SKU.
Client cũ cần cập nhật trước khi nâng lên 2.0.0. Xem hướng dẫn chuyển đổi ở docs/migration-2.0.md
```

→ Breaking change buộc tăng **MAJOR**.

## 4. Ví dụ ĐÚNG

```
feat(orders): thêm bộ lọc đơn hàng theo khoảng ngày

Bộ lọc nhận `from` và `to` dạng ISO 8601, áp dụng ở tầng truy vấn nên không
ảnh hưởng hiệu năng khi danh sách lớn.

Refs: TICKET-142
```

```
fix(payment): sửa lỗi tính sai tổng tiền khi sản phẩm có giá lẻ

Nguyên nhân: dùng float để tính tổng nên sai số làm tròn ở 2 chữ số thập phân.
Chuyển sang tính bằng số nguyên (đơn vị nhỏ nhất) rồi mới chia.

Closes: BUG-0087
```

```
docs(readme): bổ sung hướng dẫn chạy test cục bộ
```

```
test(auth): thêm test cho trường hợp token hết hạn giữa phiên
```

```
refactor(users): tách logic validate ra module riêng

[nội bộ] Không đổi hành vi. Chuẩn bị cho tính năng nhập danh sách người dùng ở sprint sau.
```

## 5. Ví dụ SAI

| Commit | Sai ở đâu | Sửa lại |
|---|---|---|
| `update code` | Không có type, không nói làm gì | `fix(cart): sửa lỗi không xoá được sản phẩm khỏi giỏ` |
| `Fix bug.` | Type viết hoa, có dấu chấm cuối | `fix(login): xử lý lỗi khi mật khẩu chứa ký tự đặc biệt` |
| `feat: Thêm tính năng xuất Excel` | Viết hoa chữ đầu | `feat(report): thêm xuất báo cáo doanh thu ra Excel` |
| `fixed some issues and also added new API endpoint for users and updated docs` | Gộp nhiều việc vào 1 commit, quá dài | Tách thành 3 commit: `fix`, `feat`, `docs` |
| `feat(api): đổi cấu trúc response` (không có `!`) | Breaking change nhưng không đánh dấu | Thêm `!` và footer `BREAKING CHANGE:` |
| `chore: sửa lỗi tính tiền` | Sai type (đây là bug fix, người dùng thấy) | `fix(billing): sửa lỗi tính tiền sai khi có giảm giá` |
| `feat: WIP` | Ghi việc đang làm dở vào commit chính | Squash lại trước khi merge, hoặc dùng nhánh tạm |

## 6. Quy tắc riêng cho commit do AI sinh

Tài liệu gốc yêu cầu: dev phải hiểu và chịu trách nhiệm về code AI sinh. Áp dụng cho commit:

- [ ] Commit do AI tạo **phải ghi rõ AI hỗ trợ** trong footer: `Co-authored-by: [AI tool] <noreply@...>`
- [ ] Người mở PR **phải đọc và hiểu** toàn bộ diff — không mở PR với code mình chưa đọc
- [ ] Commit message do AI viết phải được **người sửa lại** cho đúng ngữ nghĩa nghiệp vụ (AI hay viết chung chung kiểu "update logic")
- [ ] Không commit code AI sinh mà chưa có test tương ứng (B9)
- [ ] Nếu AI sinh code từ nguồn công khai → kiểm tra license trước khi commit (xem `ai-tool-scope.md`)

Ví dụ commit cho code AI hỗ trợ:

```
feat(inventory): thêm cảnh báo tồn kho dưới ngưỡng

Co-authored-by: Claude Code <noreply@anthropic.com>
Reviewed-by: [Tên người kiểm]
Refs: TICKET-155
```

## 7. Nối commit → CHANGELOG → phiên bản

```
commit (feat/fix/...)  →  gom theo type  →  CHANGELOG.md  →  Semantic Versioning  →  Release Note (B13)
```

Lệnh gom nội dung cho release:

```bash
# Lấy commit từ tag gần nhất
git log v1.3.0..HEAD --pretty='%s'

# Chỉ lấy thay đổi người dùng thấy
git log v1.3.0..HEAD --pretty='%s' | grep -E '^(feat|fix|perf|security)'

# Kiểm tra có breaking change không (quyết định MAJOR hay không)
git log v1.3.0..HEAD --pretty='%s' | grep -E '^(feat|fix)(\(.+\))?!:'
```

## 8. Kiểm tra tự động (khuyến nghị cấu hình ở B2/B10)

| Công cụ | Kiểm gì |
|---|---|
| `commitlint` + `husky` | Định dạng type/scope/mô tả ngay khi commit |
| `commitizen` | Hướng dẫn tạo commit đúng chuẩn |
| `standard-version` / `semantic-release` | Sinh CHANGELOG + tăng version tự động |
| CI check trên PR title | PR title cũng theo Conventional Commits để squash commit sạch |

Cấu hình gợi ý `commitlint.config.js`:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat','fix','docs','style','refactor','perf',
      'test','build','ci','chore','revert','security'
    ]],
    'subject-case': [2, 'never', ['sentence-case','start-case','upper-case']],
    'header-max-length': [2, 'always', 72],
  },
};
```

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 2 B8 và mục 5 (Tóm tắt chuẩn áp dụng) — tài liệu gốc nội bộ
- Conventional Commits 1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/
- Semantic Versioning 2.0.0 — https://semver.org/spec/v2.0.0.html
- Keep a Changelog 1.1.0 — https://keepachangelog.com/en/1.1.0/
- commitlint — https://commitlint.js.org/
- Chris Beams, "How to Write a Git Commit Message" — https://cbea.ms/git-commit/

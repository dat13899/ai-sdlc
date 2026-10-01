---
title: Conventional Commits — quy ước commit của dự án INS Platform
for: B8 bước 5 — Commit & mở MR
owner: Dev (R) · Tech Lead (A) · AI (sinh commit message — người kiểm)
nguồn: Lịch sử commit thật của ins-infrastructure, ins-purchase-service, ins-payment-service, ins-cms-fe, ins-miniapp-fe (~300 commit gần nhất mỗi repo); INS Naming Standards v1.4.1 §4; LESSONS.md §2, §6, §11
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/bo-sung/conventional-commits.md

# Conventional Commits — quy ước commit

> Rút từ commit thật. Commit gần đây đã theo `<type>(<scope>): <mô tả>` khá đều; commit cũ còn nhiều dạng tự do (`Fix`, `fix sonar`, `Update TSD`…) — mục 5 dùng chính các dạng đó làm ví dụ SAI.

## 1. Định dạng

```
<type>(<scope>): <mô tả ngắn>

<đoạn "Lỗi thật:" / vì sao — tuỳ chọn>
- <gạch đầu dòng thay đổi theo class/file>

Test: <kết quả chạy thật>

<Deploy TRƯỚC/SAU <service> — nếu có phụ thuộc>
<Chạy <file.sql> (<db>) TRƯỚC khi deploy — nếu có>

Co-Authored-By: <AI tool> <noreply@...>
```

### Quy tắc viết

| Thành phần | Quy tắc (theo thực tế) |
|---|---|
| `type` | Bắt buộc, chữ thường — bảng mục 2 |
| `scope` | Gần như luôn có. Là **tên service/module** (`purchase`, `payment`, `policy`, `adaptor`, `notification`), **khu vực hạ tầng** (`sql`, `k8s`, `kafka`, `seed`, `mongo`, `sonar`), **tài liệu** (`tsd`, `tsd-<service>`), hoặc **màn/feature FE** (`orders`, `policies`, `product`, `cms-orders`, `cms-users`, `reference-list`, `roles`, `tooling`) |
| ⚠️ Scope theo Naming Standards | Chuẩn ghi `<type>(JIRA): msg` (vd `feat(INS-1234): add order endpoint`) — **thực tế không dùng mã ticket** trong commit; cần Tech Lead chốt một trong hai |
| `mô tả ngắn` | Tiếng Việt, chữ thường đầu câu, không dấu chấm cuối. Viết theo **hành vi người dùng/vận hành thấy**, không theo tên hàm |
| Ngôn ngữ / dấu | Tiếng Việt **trộn có dấu và không dấu** (không dấu phổ biến hơn ở commit gần đây). Tên kỹ thuật giữ nguyên (`PAYMENT_FAILED`, `reissue-policy`, `S1192`) |
| Độ dài tiêu đề | Không có giới hạn cứng; đa số ≤ 100 ký tự |
| Phần thân | Giải thích **lỗi thật / vì sao**, liệt kê thay đổi theo class; ghi rõ hành vi **không** đổi |
| `Test:` | Kết quả thật: tên lớp test + số pass, hoặc số theo module (`domain 178/0 · application 230/41`), ghi rõ test đỏ **sẵn** |
| Thứ tự deploy | `Deploy TRUOC ins-miniapp-fe.` / `Deploy SAU ins-policy-service.` — bắt buộc khi có phụ thuộc (LESSONS §11) |
| Guard đối chiếu | Buộc phải tách nhánh xử lý mới cho nghiệp vụ đã có → ghi danh sách guard đã đối chiếu vào body (LESSONS §2) |
| Footer AI | `Co-Authored-By: <AI tool> <noreply@...>` khi AI hỗ trợ |

## 2. Bảng type đầy đủ

Số liệu đếm trên ~300 commit gần nhất mỗi repo (commit có type).

| Type | Dùng khi (thực tế) | Tần suất | Vào CHANGELOG? | Ảnh hưởng SemVer |
|---|---|---|---|---|
| `feat` | Tính năng mới cho khách/CMS, seed dữ liệu sản phẩm mới | Rất cao (FE + service) | ✅ | MINOR |
| `fix` | Sửa lỗi nghiệp vụ, sửa Sonar (`fix(sonar): …`) | Cao nhất ở service/FE | ✅ | PATCH |
| `refactor` | Đổi cấu trúc, hạ độ phức tạp (Sonar S3776) | Trung bình | ❌ | — |
| `docs` | TSD, tài liệu kỹ thuật (`docs(tsd-<service>)`) | Cao ở repo infrastructure | ❌ | — |
| `chore` | Script SQL/k8s/kafka, việc lặt vặt | Trung bình | ❌ | — |
| `sql` | Script DDL/DROP/backfill — **type riêng của dự án**, dùng cả có scope (`sql(payment): …`) và không (`sql: …`) | Chỉ repo infrastructure | ❌ | — |
| `test` | Thêm/sửa test | Thấp | ❌ | — |
| `perf` | Tối ưu hiệu năng (miniapp) | Thấp | ✅ nếu thấy được | PATCH |
| `style` | Format | Thấp | ❌ | — |
| `build` | Build/dependency | Thấp | ❌ | — |
| `revert` | `revert(<scope>): …` hoặc `Revert "…"` do git sinh | Thấp | — | — |
| `merge` | Commit merge viết tay (`merge(cms): …`) | Thấp | ❌ | — |
| `config` | Cấu hình service (`config(purchase): …`) | Rất thấp | ❌ | — |

> ⚠️ `sql`, `merge`, `config` không có trong Conventional Commits chuẩn. Đang dùng thật; nếu bật commitlint phải thêm vào `type-enum` hoặc chuyển về `chore(sql)` — cần Tech Lead chốt. Type `debug` (miniapp) không nên dùng.

## 3. Breaking change

Dùng `!` sau scope, phần thân mô tả cụ thể cái gì phải đổi. Ví dụ thật (rút gọn):

```
refactor(order)!: bỏ PRECHECK_PENDING + SYSTEM_PRECHECK_SUCCESS/FAILED khỏi state machine

State machine đơn hàng còn 3 trạng thái chết. Bỏ cả ba, đơn sau checkout NẰM CHỜ validate NCC
ở chính ORDER_INIT.
...
TRUY VẤN VẬN HÀNH phải đổi từ `status_id = 2` sang
`status_id = 1 AND submitted_time IS NOT NULL` — thiếu mệnh đề thứ hai sẽ đếm lẫn đơn nháp.
```

Dự án chưa dùng footer `BREAKING CHANGE:`; tác động được ghi thẳng trong thân. Chưa có quy trình tăng MAJOR — xem mục 7.

## 4. Ví dụ ĐÚNG

Lấy từ lịch sử thật, đã ẩn danh.

```
fix(purchase): don nhap gom theo SAN PHAM - moi NCC mot nhap rieng

Loi that: san pham gop (TNDS xe may Insurer-A / Insurer-D / ...) doi tab NCC trong ngay thi
nhap cua NCC chon sau GOP vao nhap cua NCC truoc (khoa cu 1 nhap/(khach, LOAI SP, ngay)).

- SaveOrderDraftUseCaseImpl: khoa gom 1 nhap/(khach, productCode, ngay).
- Client khong gui productCode -> giu hanh vi cu (nhap moi nhat cung loai).
- belongsTo tach isBlank (S1067); test doi literal lap sang hang (S1192).

Test: SaveOrderDraftUseCaseImplTest 8/8. Toan bo test purchase-service pass.

Deploy TRUOC ins-miniapp-fe.

Co-Authored-By: <AI tool> <noreply@...>
```

```
feat(purchase): reissue-policy ghi luon nguoi / thoi gian cap nhat HD

- Best-effort: ghi loi chi log, khong bao hong ca thao tac.
- Idempotency-Key moi cho moi lan bam (key co dinh se bi filter tra ket qua cu).
- HEADER_TENANT_ID / HEADER_IDEMPOTENCY_KEY thay literal lap 3 lan (S1192).

Test: ReissuePolicyOperatorTest (4 test moi). Toan bo test purchase-service pass.

Deploy SAU ins-policy-service.
```

```
feat(orders): popup Sua don lay trang thai dich tu master data ORDER_EDIT_TARGET_STATUS

Test: tsc sach (app + spec), eslint 0 loi.

Chay TSD/sql_scripts/seed-order-edit-target-status-reference.sql (product_db) TRUOC khi deploy.
```

```
sql(purchase): index cho orders.partner_transaction_id — callback NCC đang full-scan
```

```
chore(k8s): khai INS_ERROR_EXPOSE_DETAIL cho purchase-service (mac dinh false)
```

```
docs(tsd-identity): bỏ tick khống + sửa số liệu sai — nhóm D và E theo review file 10
```

```
refactor(purchase): ha do phuc tap buildRegistrationAttributes (Sonar S3776)
```

```
revert(authz): rut phan quyen order.view/.manage khoi develop (chua test)
```

## 5. Ví dụ SAI

Tất cả là commit thật trong lịch sử.

| Commit | Sai ở đâu | Sửa lại |
|---|---|---|
| `Fix` / `fix` / `Fix bug` | Không type chuẩn, không scope, không nói làm gì | `fix(cms-orders): khoa o ngay thanh toan khi don da co paid_time` |
| `fix sonar` | Thiếu `:` và scope, không nói rule nào | `fix(sonar): S1172 fillFallback — log tenant/txn thay vì bỏ tham số` |
| `Update TSD` | Không type, không nói phần nào | `docs(tsd-purchase): neo baseline <commit> + đồng bộ mục …` |
| `UT` | Viết tắt, không type | `test(order): them test markPaid tu PAYMENT_FAILED` |
| `feat/cms-orders` | Dán **tên nhánh** làm commit message | `feat(cms-orders): nut Sua chi hien khi don co ma giao dich` |
| `ix(...)` / `Fix(...)` | Gõ sai / viết hoa type | `fix(...)` |
| `debug(...)` | Type không có trong bảng; commit debug không nên vào nhánh chung | Bỏ khỏi lịch sử trước khi merge, hoặc `chore(...)` nếu thật sự cần |
| `Refactor error handling in various components to utilize apiErrorDetail utility…` | Không type, tiếng Anh lẫn vào dự án viết tiếng Việt, gộp nhiều component | `refactor(error): dung apiErrorDetail cho thong bao loi o <màn>` |
| `Merge branch '<tên-người>' into develop` | Không sai chuẩn nhưng làm loãng lịch sử; tên nhánh theo tên người | Nhánh theo chuẩn `feature-<JIRA>-<slug>` |

## 6. Quy tắc riêng cho commit do AI sinh

- [ ] Có footer `Co-Authored-By: <AI tool> <noreply@...>` (đang dùng đều ở commit gần đây)
- [ ] Người commit đọc và hiểu toàn bộ diff; mục `Test:` là kết quả **đã chạy thật**, không phải dự đoán
- [ ] AI **không** `git add -A` — stage từng file, kiểm `git diff --cached --name-only` không lẫn file người khác (LESSONS §6.2)
- [ ] Commit sửa Sonar chỉ chứa đúng issue được giao, ghi mã rule trong tiêu đề hoặc thân (`(Sonar S3776)`, `(S1192)`)
- [ ] Body ghi rõ thứ tự deploy và script SQL phải chạy trước, nếu có
- [ ] TODO: dự án chưa quy định footer `Reviewed-by:` — cần Tech Lead bổ sung nếu muốn

## 7. Nối commit → CHANGELOG → phiên bản

> TODO: dự án chưa có — các repo có **0 tag**, không có `CHANGELOG.md` phát hành (chỉ có CHANGELOG của các bộ review TSD trong `TSD/review-*/`), không có công cụ sinh release note. Naming Standards chỉ quy định tag dạng `v<M>.<m>.<p>`. Nhánh phát hành đang dùng: `release`, `goliveV1`. Cần Tech Lead bổ sung.

Lệnh gom khi đã có tag (để sẵn):

```bash
git log v1.3.0..HEAD --pretty='%s' | grep -E '^(feat|fix|perf)(\(.+\))?!?:'
git log v1.3.0..HEAD --pretty='%s' | grep -E '^[a-z]+(\(.+\))?!:'      # breaking
git log v1.3.0..HEAD --pretty='%b' | grep -E '^Deploy (TRUOC|SAU|TRƯỚC)'   # thứ tự deploy
```

## 8. Kiểm tra tự động (khuyến nghị cấu hình ở B2/B10)

| Công cụ | Hiện trạng |
|---|---|
| `husky` | Có ở 2 app FE — `pre-commit` chạy lint-staged (eslint + prettier). **Không** có hook `commit-msg` |
| `commitlint` | Chưa có ở repo nào |
| Hook BE | Chưa có |
| CI check tiêu đề MR | TODO: dự án chưa có — cần DevOps bổ sung |

Cấu hình gợi ý nếu bật commitlint (khớp type đang dùng thật):

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat','fix','docs','style','refactor','perf','test',
      'build','ci','chore','revert','sql','merge','config'
    ]],
    'scope-empty': [1, 'never'],
    'subject-case': [0],          // tiếng Việt có/không dấu — không ép case
    'header-max-length': [1, 'always', 100],
  },
};
```

## Nguồn tham chiếu

- Lịch sử commit thật (đọc bằng `git log`, không sửa): ins-infrastructure, ins-purchase-service, ins-payment-service, ins-cms-fe, ins-miniapp-fe
- INS Naming Standards v1.4.1 §4 — branch / tag / commit
- `LESSONS.md` §2 (ghi guard đối chiếu vào commit), §6.2 (cấm `git add -A`), §11 (thứ tự deploy)
- Conventional Commits 1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/
- commitlint — https://commitlint.js.org/

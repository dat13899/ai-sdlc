---
title: dor-dod.md — Definition of Ready / Definition of Done
for: B2 — dựng cùng constitution.md; áp dụng mọi sprint từ B7 trở đi
owner: PM + Tech Lead (A/R) · PO (C) · Toàn đội (R)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.17 + mục 2 B7; Scrum Guide (scrum.org)
---

# dor-dod.md — Definition of Ready / Definition of Done

> **Definition of Ready (DoR)** = điều kiện để một hạng mục được **đưa vào** sprint. **Definition of Done (DoD)** = điều kiện để một hạng mục được coi là **xong hoàn toàn**.
>
> Điểm mấu chốt: mọi tiêu chí phải **khách quan, kiểm được** — không dùng từ cảm tính như "code sạch", "chạy tốt". Nếu hai người nhìn vào mà trả lời khác nhau, tiêu chí đó chưa đạt yêu cầu.

## 1. Definition of Ready (DoR) — trước khi đưa vào sprint

### 1.1. DoR theo từng mức

| Mức | Tiêu chí |
|---|---|
| **DoR của User Story** | Story đủ điều kiện để lập trình viên bắt đầu làm |
| **DoR của Sprint** | Toàn bộ story trong sprint đã đạt DoR — nếu không, sprint không được bắt đầu |
| **DoR của Task** | Task có đủ thông tin để một người không tham gia phân tích vẫn làm được |

### 1.2. Checklist DoR cho một User Story

- [ ] Có User Story theo chuẩn INVEST (độc lập, thương lượng được, có giá trị, ước lượng được, nhỏ, kiểm thử được)
- [ ] Có **Acceptance Criteria** đo được, viết dạng Given/When/Then hoặc checklist
- [ ] Truy vết được về yêu cầu gốc (mã FR trong BRD/spec.md) và tới test case
- [ ] Đã làm rõ các **edge case** (trường hợp biên) — không còn câu hỏi mở chặn việc code
- [ ] Đã xác định phụ thuộc (dependency) và không bị chặn bởi story khác chưa xong
- [ ] Có thiết kế/mockup giao diện nếu thay đổi UI
- [ ] Có hợp đồng API (OpenAPI) nếu cần gọi API mới/sửa API
- [ ] Đã ước lượng (story point / ngày công) và nhỏ đủ để xong trong 1 sprint
- [ ] Ràng buộc phi chức năng đã ghi rõ (hiệu năng, bảo mật, phân quyền)
- [ ] Mọi câu hỏi mở đã được trả lời — không còn mục 🔴 Mở trong Q&A Log liên quan story này
- [ ] Không còn phụ thuộc vào thông tin chỉ có ở ngoài (chờ khách hàng trả lời, chờ hệ thống khác)
- [ ] Thẻ công việc đã có người thực hiện dự kiến và người review

### 1.3. Câu hỏi tự kiểm cho DoR

| Câu hỏi | Nếu trả lời "Không" |
|---|---|
| Một người mới vào dự án có làm được story này chỉ nhờ thẻ + spec không? | Chưa đạt DoR — bổ sung thông tin |
| Dev có biết chính xác test sẽ kiểm gì không? | Chưa đạt — viết AC rõ hơn |
| Ước lượng được trong ≤ 1 sprint? | Chưa đạt — tách nhỏ story |
| Có câu hỏi nào chặn việc bắt đầu code? | Chưa đạt — trả lời trước |

## 2. Definition of Done (DoD)

### 2.1. Checklist DoD cho một hạng mục (áp dụng từ B8 trở đi)

Bảng dưới đây là **bản có cột "Cách kiểm chứng"** — dùng khi cần chứng minh tiêu chí đã đạt (review, audit, gate). Bản checklist nhanh ở mục 2.4 dùng cho việc hằng ngày.

| Nhóm | # | Tiêu chí | Cách kiểm chứng (đo được) | Đạt |
|---|---|---|---|---|
| Code | C1 | Tuân `CODING_CONVENTION.md`, không vi phạm `constitution.md` | `npm run lint` → 0 lỗi mức error; đối chiếu `constitution.md` từng mục | ☐ |
| Code | C2 | Qua review tầng 1 (AI) + tầng 2 (người) | Có ≥ 1 approve ngoài tác giả trên PR | ☐ |
| Code | C3 | Không còn TODO không ticket, code chết, debug log | `grep -rn "TODO\|console.log\|debugger" <diff>` — mỗi TODO có mã ticket | ☐ |
| Code | C4 | Không có secret hardcode hoặc in ra log | `gitleaks detect` / `trufflehog` → 0 phát hiện | ☐ |
| Test | T1 | Unit test cho logic mới, assert kiểm giá trị thật | Đọc assert: có so sánh giá trị cụ thể, không chỉ `toBeTruthy()` | ☐ |
| Test | T2 | CI xanh: build + lint + type check + test | Trạng thái CI trên PR = ✅ xanh | ☐ |
| Test | T3 | Coverage đạt ngưỡng cho phần code mới | Báo cáo coverage: ≥ [X]% cho file/diff mới (ngưỡng dự án) | ☐ |
| Test | T4 | Edge case + negative case đã kiểm | Danh sách test: có case null/rỗng/biên/không quyền/hết hạn | ☐ |
| Test | T5 | Test case truy vết tới AC | `test-case-rtm.md`: mỗi AC ↔ ≥ 1 test case | ☐ |
| Tài liệu | D1 | Cập nhật tài liệu liên quan | `openapi.yaml` / ADR / `glossary.md` đã sửa trong cùng PR | ☐ |
| Tài liệu | D2 | PR mô tả rõ + kết quả test thật | Nội dung PR có mục "Test đã chạy" ghi kết quả thực tế | ☐ |
| Phi chức năng | N1 | Phân quyền đúng (không xem được dữ liệu ngoài quyền) | Test IDOR: đổi id trên URL → nhận 403/404 | ☐ |
| Phi chức năng | N2 | Không đưa dữ liệu cá nhân vào log | `grep` log output: không có email/số điện thoại/mã định danh | ☐ |
| Phi chức năng | N3 | Không còn lỗ hổng Critical/High | SAST + dependency scan: 0 phát hiện Critical/High chưa xử lý | ☐ |
| Tích hợp | I1 | Deploy được lên STAGING và chạy được | URL STAGING truy cập OK; smoke test xanh | ☐ |
| Tích hợp | I2 | Không gây regression | Regression suite: **xanh 100%** | ☐ |

**Ngưỡng chặn cứng khi đóng task:** C4, T2, T3, N1, N3, I2 phải Đạt — không có ngoại lệ. Các mục còn lại có thể ghi lại lý do và xử lý trong 48h nếu là hotfix khẩn cấp.

**Checksum nhóm (để kiểm nhanh):**

| Nhóm | Số tiêu chí | Bắt buộc đạt |
|---|---|---|
| Code | 4 | C2, C4 |
| Test | 5 | T2, T3 |
| Tài liệu | 2 | D2 |
| Phi chức năng | 3 | N1, N3 |
| Tích hợp | 2 | I2 |

### 2.4. Checklist nhanh hằng ngày

**Code**

- [ ] Code tuân `CODING_CONVENTION.md`, không vi phạm `constitution.md`
- [ ] Đã qua review tầng 1 (AI) và tầng 2 (người) — có ít nhất 1 người approve ngoài tác giả
- [ ] Không còn comment "TODO" không có ticket theo dõi
- [ ] Không có code chết, code bị comment ra, log debug còn sót
- [ ] Không có secret/khoá bị hardcode hoặc in ra log

**Test**

- [ ] Unit test đã viết cho logic mới, **assert kiểm giá trị thật** (không phải test luôn xanh)
- [ ] CI xanh: build + lint + type check + test
- [ ] Coverage đạt ngưỡng dự án cho phần code mới
- [ ] Đã kiểm edge case (giá trị biên, rỗng, trùng, sai quyền, mất mạng)
- [ ] Đã kiểm negative case (input sai, không có quyền, hết hạn)
- [ ] Test case đã cập nhật vào `test-case-rtm.md` và truy vết được tới AC

**Tài liệu**

- [ ] Đã cập nhật tài liệu liên quan: `spec.md` / `openapi.yaml` / ADR / `glossary.md`
- [ ] Nếu đổi public API: đã cập nhật OpenAPI và ghi rõ breaking change
- [ ] PR mô tả rõ: làm gì, test nào đã chạy (kết quả thật), chỗ nào chưa chắc

**Phi chức năng**

- [ ] Đã kiểm phân quyền (không truy cập được dữ liệu không thuộc quyền)
- [ ] Không đưa dữ liệu cá nhân vào log
- [ ] Không có lỗ hổng Critical/High chưa xử lý trong phần code mới (theo SAST/secret scan)

**Tích hợp**

- [ ] Đã merge vào nhánh phát triển; không còn nhánh mồ côi
- [ ] Đã deploy được lên môi trường STAGING và chạy được
- [ ] Không làm regression (kiểm thử lại các chức năng liên quan)

### 2.2. DoD tăng dần theo cấp

Định nghĩa "xong" khác nhau ở mỗi cấp — ghi rõ để tránh hiểu nhầm "code xong rồi mà sao chưa dùng được".

| Cấp | "Xong" nghĩa là | Ai xác nhận |
|---|---|---|
| **Task** | Code viết xong, có test, CI xanh, PR đã merge | Reviewer + Tech Lead |
| **User Story** | Tất cả AC đạt, đã test trên STAGING, tài liệu đã cập nhật | Test Lead + PO |
| **Sprint** | Mọi story đạt DoD; build deployable; demo cho PO | PO |
| **Release (Gate 4)** | UAT sign-off ký; bug S1–S2 = 0; ATTT & hiệu năng đạt | Test Lead + Security Lead + Tech Lead + PO |
| **Go-live (Gate 5)** | Checklist Go/No-Go tất cả "Đạt"; Rollback Plan đã diễn tập | PM + cả hội đồng |

### 2.3. Gắn DoD với các Gate

| Gate | DoD bắt buộc đạt |
|---|---|
| **Gate 1** — Chốt Spec | Spec đã hoàn thành; Q&A Log không còn mục Mở; BRD/spec đã xác nhận |
| **Gate 2** — Chốt Kiến trúc | Có ADR cho mọi quyết định lớn; có ≥ 2 phương án đã cân nhắc; OpenAPI đã định hình |
| **Gate 3** — Merge | Code + test đạt DoD cấp Task/Story; review 2 tầng xong; SAST/secret scan sạch |
| **Gate 4a/4b/4c** | SIT xanh 100%; ATTT không còn Critical/High; hiệu năng đạt SLA |
| **Gate 4** — UAT Sign-off | Kịch bản UAT đã chạy với PO; bug S1–S2 = 0; RTM phủ 100% AC |
| **Gate 5** — Go/No-Go | Checklist PL6 Phần 2 tất cả "Đạt"; Rollback diễn tập xong |

## 3. Ví dụ tiêu chí đạt vs không đạt

| ❌ Tiêu chí kém | ✅ Tiêu chí kiểm được |
|---|---|
| "Code sạch sẽ" | "Không có cảnh báo lint ở mức error; độ phức tạp hàm ≤ 15" |
| "Chạy tốt" | "Đã chạy 200 request đồng thời, thời gian phản hồi P95 ≤ 500 ms" |
| "Có test" | "Coverage phần code mới ≥ 80%; mutation score ≥ 60% trên module này" |
| "Bảo mật tốt" | "Không còn finding Critical/High từ SAST và secret scan" |
| "Tài liệu đầy đủ" | "OpenAPI cập nhật và merge cùng PR; ADR đã thêm cho quyết định mới" |
| "UI đẹp" | "Khớp mockup; độ tương phản chữ ≥ 4.5:1; vùng chạm ≥ 44×44 px" |

## 4. Quy tắc áp dụng

| Quy tắc | Nội dung |
|---|---|
| Được phép linh hoạt? | DoR/DoD có thể chỉnh theo dự án **nhưng phải làm ở B2**, không sửa giữa sprint để hợp thức hoá việc chưa xong |
| Ai được sửa | PM + Tech Lead; thay đổi qua PR và thông báo toàn đội |
| Story không đạt DoR | Không đưa vào sprint. Đẩy về backlog làm rõ — không "vừa code vừa hỏi" |
| Hạng mục không đạt DoD | Không tính vào velocity. Không được coi là "gần xong" |
| Ngoại lệ khẩn cấp (Hotfix) | Được phép lùi một số mục tài liệu, nhưng **phải bổ sung trong 48h** và ghi vào post-mortem |
| Đo lường | Đo tỷ lệ story đạt DoD ngay lần đầu (first-time-right) — chỉ số phản ánh chất lượng thật |

## 5. Checklist dựng dor-dod.md

- [ ] DoR và DoD là **hai checklist tách biệt**, không gộp
- [ ] Mọi tiêu chí đều **khách quan, đo được**
- [ ] Đã gắn DoD với từng Gate (mục 2.3)
- [ ] Có ví dụ tiêu chí đạt/không đạt để đội hiểu cách áp dụng
- [ ] Đã thống nhất ai xác nhận "xong" ở mỗi cấp
- [ ] Toàn đội đã đọc và đồng ý (không áp từ trên xuống)
- [ ] Đã commit cùng `constitution.md` ở B2, không sửa giữa sprint

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.17 và mục 2 B7 — tài liệu gốc nội bộ
- Scrum Guide — Definition of Done — https://scrumguides.org/
- Scrum.org — Definition of Done và Definition of Ready — https://www.scrum.org/resources/what-definition-done
- Agile Alliance — INVEST, Definition of Ready — https://www.agilealliance.org/glossary/invest/
- Mountain Goat Software — Definition of Ready — https://www.mountaingoatsoftware.com/blog/the-dangers-of-a-definition-of-ready

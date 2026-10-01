---
title: dor-dod.md — Definition of Ready / Definition of Done (INS Platform)
for: B2 — dựng cùng constitution.md; áp dụng mọi sprint từ B7 trở đi
owner: PM + Tech Lead (A/R) · PO (C) · Toàn đội (R)
nguồn: RULES.md §F, RULES_ANGULAR.md §J, SonarClean.md (checklist), LESSONS.md §0/§5/§7/§11, Architecture.md §2.7, lệnh build/test thật của repo
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/dor-dod.md

# dor-dod.md — Definition of Ready / Definition of Done

> **DoR** = điều kiện để hạng mục được **đưa vào** sprint. **DoD** = điều kiện để hạng mục **xong hoàn toàn**. Mọi tiêu chí phải kiểm được. Ở dự án này DoD có dữ liệu thật (RULES/LESSONS/lệnh test); DoR phần lớn **chưa có** trong nguồn — để TODO, không bịa.

## 1. Definition of Ready (DoR) — trước khi đưa vào sprint

### 1.1. DoR theo từng mức

| Mức | Tiêu chí |
|---|---|
| **DoR của User Story** | > TODO: dự án chưa có — cần PM/PO bổ sung |
| **DoR của Sprint** | > TODO: dự án chưa có — cần PM bổ sung |
| **DoR của Task** | > TODO: dự án chưa có — cần Tech Lead bổ sung |

### 1.2. Checklist DoR cho một User Story

Chỉ các mục có căn cứ trong nguồn:

- [ ] Có SRS đã duyệt cho luồng (repo có các SRS "Approved" cho quản lý đơn hàng, truy vấn kết quả tạo hợp đồng, callback kết quả tạo hợp đồng…) — story truy vết được về SRS
- [ ] Nếu story tạo service/aggregate mới: đã thiết kế aggregate theo SRS riêng (Architecture.md §3 bước 4)
- [ ] Nếu gọi API mới giữa service: đã chốt path theo Naming Standards `/ins/<service>/<public|private>/v1/<resource>` và nhóm public/CMS/webhook/private
- [ ] Nếu cần giá trị enum mới đọc từ DB / realm role mới / cột mới: đã xác định thứ tự deploy (LESSONS §11)
- [ ] Nếu viết lại một nghiệp vụ đã có ở đường khác: đã tìm đường cũ và **liệt kê guard** trước khi làm (LESSONS §2)
- [ ] Nếu làm lại việc từng bị revert: đã đọc lý do lần trước hỏng (LESSONS §10)
- [ ] TODO: dự án chưa có — AC dạng Given/When/Then, ước lượng, mockup UI, định nghĩa NFR theo story, người review dự kiến: cần PM/PO bổ sung

### 1.3. Câu hỏi tự kiểm cho DoR

| Câu hỏi | Nếu trả lời "Không" |
|---|---|
| Đã biết story đụng những service nào và service đó chạy `ddl-auto` gì? | Chưa đạt — tra LESSONS §7.1 / `application.yml` của service |
| Đã biết đường xử lý cũ (nếu có) và guard của nó? | Chưa đạt — làm LESSONS §2 bước 1 |
| Đã biết BE hay FE deploy trước? | Chưa đạt — chốt theo LESSONS §11 |
| TODO: dự án chưa có — các câu hỏi DoR khác | cần PM bổ sung |

## 2. Definition of Done (DoD)

### 2.1. Checklist DoD cho một hạng mục (áp dụng từ B8 trở đi)

| Nhóm | # | Tiêu chí | Cách kiểm chứng (đo được) | Đạt |
|---|---|---|---|---|
| Code | C1 | Format đúng chuẩn | BE: spotless chỉ trên file đã sửa (không chạy toàn service — LESSONS §6.3). FE: `npm run format:check` sạch; lint-staged đã chạy ở pre-commit | ☐ |
| Code | C2 | Lint / Sonar sạch | FE: `npm run lint` 0 error. BE: checklist SonarClean đạt; `grep -nE '@SuppressWarnings\("(java:S\|unchecked\|rawtypes)\|// *NOSONAR' <file>` rỗng; `grep -nE 'log\.(trace\|debug\|info\|warn\|error)\([^)]*( \+ \|\.[a-zA-Z]+\()' <file>` rỗng | ☐ |
| Code | C3 | Ranh giới kiến trúc | `./mvnw test -pl adapter -Dtest='ArchitectureTest'` — không thêm vi phạm so với mốc (`controller_should_go_through_facade` = 3) | ☐ |
| Code | C4 | Không debug/rác | Không `System.out`/`printStackTrace` (BE), `console.log`/`debugger` (FE); không import/biến/method thừa; không magic string/number (S1192: literal ≥ 3 lần → hằng, hằng đã có thì dùng mọi chỗ) | ☐ |
| Code | C5 | Không secret, không PII raw trong log | Đọc diff: không password/key/token hard-code; log mask CCCD/SĐT/token | ☐ |
| Code | C6 | Guard & nhánh | Guard đứng trước side-effect; không nhánh thứ hai làm mất guard (LESSONS §0 mục 1–2) | ☐ |
| Code | C7 | Qua review 2 tầng | Tầng 1 theo `rules/code-review-rules.md`; tầng 2 theo `bo-sung/code-review-checklist-nguoi.md` (PL04/PL05) | ☐ |
| Test | T1 | Unit test domain/usecase mới | `./mvnw test -pl domain` và `-pl application` (không cần Docker) | ☐ |
| Test | T2 | Chạy riêng lớp test của use case vừa sửa | `./mvnw test -pl <module> -Dtest='<ClassName>'` pass — so theo **danh tính** test fail, không theo tổng (LESSONS §5.2, §5.3) | ☐ |
| Test | T3 | Số test đọc đúng | Chạy với `-Dmaven.test.failure.ignore=true`, `clean` nếu chỉ đổi test; đọc dòng `Tests run:` trong `[INFO] Results:` từng module (LESSONS §5.1) | ☐ |
| Test | T4 | Integration test golden path cho endpoint mới | `./mvnw test -pl adapter -Dtest='*IntegrationTest'` (Testcontainers, cần Docker) | ☐ |
| Test | T5 | FE test | `npm test` (Karma, cần `CHROME_BIN`) pass | ☐ |
| Test | T6 | Coverage | > TODO: dự án chưa có ngưỡng — cần Tech Lead bổ sung | ☐ |
| Tài liệu | D1 | Javadoc / JSDoc cho public API; comment + javadoc khớp hành vi mới | Đọc diff | ☐ |
| Tài liệu | D2 | Commit body ghi `Test:` (kết quả thật) + thứ tự deploy + script SQL cần chạy | Đọc commit message | ☐ |
| Dữ liệu | M1 | Đổi schema có script đi kèm | Script DDL/migration trong cùng thay đổi (RULES §F); đụng `@Entity`/DDL đã kiểm `ddl-auto` của service (LESSONS §7.1) | ☐ |
| Dữ liệu | M2 | Xoá bảng/cột đúng thứ tự | Gỡ code → deploy → mới DROP; xoá cả `CREATE TABLE` trong `TSD/sql_scripts/` | ☐ |
| Phi chức năng | N1 | Phân quyền | Mọi endpoint có `@PreAuthorize` hoặc tenant filter (RULES §F); route FE nhạy cảm có AuthGuard | ☐ |
| Phi chức năng | N2 | Truy vấn có giới hạn | Mọi SQL query có `Pageable`/`LIMIT` | ☐ |
| Phi chức năng | N3 | Resource / exception | Resource đóng qua try-with-resources; mọi catch có log + bảo lưu cause | ☐ |
| Phi chức năng | N4 | FE | Subscribe có unsubscribe/`async`/`takeUntilDestroyed`; `trackBy` list lớn; OnPush; lazy load; text qua `translate`; không PII/token trong localStorage; query param encode; Reactive Forms cho form phức tạp (RULES_ANGULAR §J) | ☐ |
| Tích hợp | I1 | Stage sạch | `git status` trước khi stage; không `git add -A`; `git diff --cached --name-only` chỉ chứa file của mình (LESSONS §6.2) | ☐ |
| Tích hợp | I2 | Deploy STAGING / regression | > TODO: dự án chưa có tiêu chí smoke test / regression suite trong nguồn — cần Test Lead bổ sung | ☐ |

**Ngưỡng chặn cứng khi đóng task:** C2 (không suppress Sonar mới), C3, C5, C6, T2, M1/M2 (khi có đổi schema), I1. Các mục khác theo RULES đều mức **Bắt buộc** — nguồn không định nghĩa ngoại lệ hotfix.

**Checksum nhóm (để kiểm nhanh):**

| Nhóm | Số tiêu chí | Bắt buộc đạt |
|---|---|---|
| Code | 7 | C2, C3, C5, C6 |
| Test | 6 | T2 |
| Tài liệu | 2 | — |
| Dữ liệu | 2 | M1, M2 (nếu có đổi schema) |
| Phi chức năng | 4 | — (đều Bắt buộc theo RULES) |
| Tích hợp | 2 | I1 |

### 2.4. Checklist nhanh hằng ngày

**Sáu câu của LESSONS §0 — chạy trước khi viết commit message**

- [ ] Guard có đứng trước tác dụng phụ không?
- [ ] Có đang viết nhánh thứ hai cho nghiệp vụ đã có không?
- [ ] Đã chạy RIÊNG lớp test của use case vừa sửa, so theo danh tính?
- [ ] `git status` trước khi stage?
- [ ] Đụng `@Entity`/DDL → đã kiểm `ddl-auto` của service đó?
- [ ] Kết luận "code chết" → đã chứng minh đủ?

**Java — RULES.md §F**

- [ ] Format; `./mvnw test -pl domain,application` pass; `ArchitectureTest` pass
- [ ] Không `System.out.println` / `e.printStackTrace()`; không magic string/number; không import/biến/method thừa
- [ ] Đối chiếu SonarClean (đặc biệt S1192 cả hai biến thể)
- [ ] Javadoc public; try-with-resources; catch có log + cause; SQL có Pageable/LIMIT; endpoint có authorization
- [ ] PII/secret không log raw; có script schema nếu đổi schema; unit test domain/usecase; integration test golden path cho endpoint mới

**Angular — RULES_ANGULAR.md §J**

- [ ] `ng lint`, `ng test`, Prettier pass; không `console.log`/`debugger`; không `any` thừa
- [ ] Không magic (hằng/enum đúng file); không import/biến/method thừa
- [ ] Subscribe có unsubscribe; `trackBy`; OnPush; lazy load; `translate`; không DOM trực tiếp; không PII/token trong localStorage; query param encode; Reactive Forms
- [ ] Date picker lưu ISO, hiển thị `dd/MM/yyyy` (LESSONS §9)

**Sonar — SonarClean.md**

- [ ] S1192 · S2139 · S107 · S2160 · S5738/S1874 · unchecked/rawtypes · S1168 · S2065 · S2629 · không `@SuppressWarnings`/`// NOSONAR` mới

### 2.2. DoD tăng dần theo cấp

| Cấp | "Xong" nghĩa là | Ai xác nhận |
|---|---|---|
| **Task** | DoD 2.1 đạt, đã merge vào `develop` | > TODO: dự án chưa có — cần Tech Lead bổ sung người xác nhận |
| **User Story** | > TODO: dự án chưa có — cần PO bổ sung | |
| **Sprint** | > TODO: dự án chưa có — cần PM bổ sung | |
| **Release** | Merge `develop → release` đúng quy trình stash + kiểm `git status` (LESSONS §6.2); deploy theo thứ tự LESSONS §11. Tiêu chí ký release: TODO — cần PM/Test Lead bổ sung | |
| **Go-live** | > TODO: dự án chưa có trong nguồn đã rà — cần PM bổ sung | |

### 2.3. Gắn DoD với các Gate

| Gate | DoD bắt buộc đạt |
|---|---|
| **Gate 1** — Chốt Spec | SRS đã "Approved" cho luồng; TODO: tiêu chí khác cần PO bổ sung |
| **Gate 2** — Chốt Kiến trúc | Tuân Architecture.md §2; path/topic/schema theo Naming Standards; ADR cho quyết định lớn (repo đang tham chiếu ADR-03, 04, 07, 08, 09) |
| **Gate 3** — Merge | DoD 2.1 cấp Task; review 2 tầng xong; Sonar sạch, không suppress mới |
| **Gate 4a/4b/4c** | > TODO: dự án chưa có — cần Test Lead bổ sung (SLA mục tiêu có ở Architecture.md §2.5: p95 < 2s, TPS 200, pricing < 200ms) |
| **Gate 4** — UAT Sign-off | > TODO: dự án chưa có — cần PO/Test Lead bổ sung |
| **Gate 5** — Go/No-Go | > TODO: dự án chưa có — cần PM bổ sung |

## 3. Ví dụ tiêu chí đạt vs không đạt

| ❌ Tiêu chí kém | ✅ Tiêu chí kiểm được (dự án) |
|---|---|
| "Code sạch Sonar" | "grep `@SuppressWarnings("java:S` / `NOSONAR` trên file sửa ra rỗng; S1192: `grep -n '"status"' <file>` chỉ còn dòng khai hằng" |
| "Đã test" | "`SaveOrderDraftUseCaseImplTest` 8/8; `domain 178/0 · application 230/41` với 41 là số đỏ **sẵn** đã biết, danh sách test fail trước/sau khớp nhau (`comm -13` rỗng)" |
| "Kiến trúc đúng" | "`ArchitectureTest` không vượt mốc 3 vi phạm `controller_should_go_through_facade`" |
| "An toàn khi deploy" | "Commit ghi `Deploy SAU ins-policy-service`; script SQL đã chạy trước; service đích chạy `validate` đã có cột" |
| "Không ảnh hưởng người khác" | "`git diff --cached --name-only` chỉ chứa file của task" |

## 4. Quy tắc áp dụng

| Quy tắc | Nội dung |
|---|---|
| Được phép linh hoạt? | Rule trong RULES.md / RULES_ANGULAR.md đều **Bắt buộc**; cập nhật khi có version mới của tài liệu nguồn (PL03/PL04/PL05) |
| Ai được sửa | > TODO: dự án chưa có — cần PM + Tech Lead bổ sung |
| Story không đạt DoR | > TODO: dự án chưa có — cần PM bổ sung |
| Hạng mục không đạt DoD | Vi phạm rule Bắt buộc là lý do REJECT trong code review |
| Ngoại lệ khẩn cấp (Hotfix) | Nhánh hotfix theo chuẩn `feature-<JIRA>-hotfix-<slug>`; nới DoD cho hotfix: TODO — cần Tech Lead bổ sung |
| Đo lường | > TODO: dự án chưa có — cần PM bổ sung |

## 5. Checklist dựng dor-dod.md

- [x] DoR và DoD là hai checklist tách biệt
- [x] Tiêu chí DoD có lệnh/cách kiểm cụ thể
- [ ] Đã gắn DoD với từng Gate — mới có Gate 2, 3 (còn TODO)
- [x] Có ví dụ tiêu chí đạt/không đạt
- [ ] Đã thống nhất ai xác nhận "xong" ở mỗi cấp — TODO
- [ ] Toàn đội đã đọc và đồng ý — TODO
- [ ] Đã commit cùng `constitution.md` ở B2 — TODO

## Nguồn tham chiếu

- `RULES.md` §F — checklist tự kiểm trước commit (Java)
- `RULES_ANGULAR.md` §J — checklist tự kiểm trước commit (Angular)
- `SonarClean.md` — checklist trước khi xong 1 file + lệnh verify
- `LESSONS.md` §0 (6 câu sau khi code), §5 (đo test), §6 (git), §7 (ddl-auto), §11 (thứ tự deploy)
- `Architecture.md` §2.5 (SLA), §2.7 (testing + lệnh build), §3 (checklist tạo service mới)
- Scrum Guide — https://scrumguides.org/

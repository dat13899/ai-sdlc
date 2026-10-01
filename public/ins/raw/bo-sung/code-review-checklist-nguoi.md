---
title: "Checklist Code Review tầng 2 (Human Review) — INS Platform"
for: "B10. Code Review 2 tầng — GATE 3 (bước 5: Reviewer dùng checklist)"
owner: "Reviewer (người khác tác giả) · Tech Lead (A/R)"
nguồn: "PL04 Checklist Java backend review code (qua RULES.md); PL05 Checklist Code Review for Angular (qua RULES_ANGULAR.md); LESSONS.md; Architecture.md"
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/bo-sung/code-review-checklist-nguoi.md

# Checklist Code Review tầng 2 (do con người thực hiện)

**MR**: `[link]` · **Tác giả**: [Tên] · **Reviewer**: [Tên] · **Ngày**: [Ngày] · **Loại**: Java (PL04) / Angular (PL05)

**Phân tầng review (B10)**:
- **Tầng 1 — AI review + tool**: `rules/code-review-rules.md`, SonarQube, ESLint/Prettier (lint-staged), `ArchitectureTest`. Dev sửa hết Critical/High trước khi mời người.
- **Tầng 2 — Human review (file này)**: tập trung vào những thứ **AI hay bỏ sót mà LESSONS.md đã ghi nhận là lỗi thật** — thứ tự guard, nhánh trùng lặp, lỗi im lặng, thứ tự deploy, cấu hình theo môi trường.

> Nguyên tắc: reviewer khác tác giả. Checklist gốc bắt buộc: **PL04** cho MR Java backend, **PL05** cho MR Angular — mọi mục mức Bắt buộc, vi phạm là lý do REJECT.
>
> TODO: dự án chưa quy định số reviewer tối thiểu cho module lõi (purchase/payment/policy) — cần Tech Lead bổ sung.

---

## 0. Điều kiện tiên quyết trước khi review

- [ ] MR mô tả rõ mục tiêu; commit body có mục **"Test:"** ghi kết quả thật (theo module, vd `domain x/0, application y/z`) và dòng **"Deploy TRƯỚC/SAU <service>"** nếu có phụ thuộc
- [ ] Tầng 1 đã chạy: Sonar sạch, `ng lint` sạch (FE), `ArchitectureTest` không thêm vi phạm so với mốc (BE)
- [ ] Không còn finding Critical/High từ tầng 1
- [ ] Diff chỉ chứa file của tác giả — worktree dùng chung, đã có commit gộp nhầm việc người khác (đổi tên realm Keycloak, xoá 6 dòng `ins.scheduler.*`) và push không rút lại được (LESSONS §6.2)
- [ ] Không có reflow hàng loạt do `spotless:apply` toàn service (LESSONS §6.3); không có file FE bị đổi toàn bộ sang CRLF (LESSONS §9)
- [ ] Commit theo `bo-sung/conventional-commits.md`
- [ ] Sửa đúng repo thật (`ins-infrastructure`, `ins-cms-fe`, `ins-miniapp-fe`) — không phải `ins-client`/`ins-bit`
- [ ] TODO: dự án chưa có — cần Tech Lead bổ sung ngưỡng kích thước MR và liên kết ticket bắt buộc

---

## 1. Nghiệp vụ & Acceptance Criteria

- [ ] Code làm đúng AC/SRS — TODO: dự án chưa có quy ước truy vết AC ↔ commit/MR, cần PO/Tech Lead bổ sung
- [ ] **Nhánh thứ hai cho nghiệp vụ đã có?** (LESSONS §2) — nếu MR viết lại một luồng đã tồn tại ở chỗ khác (vd cấp lại hợp đồng từ CMS song song đường Temporal), reviewer **tự liệt kê guard của đường cũ** và đánh dấu từng cái ở nhánh mới:

  | Guard ở đường cũ | Có ở nhánh mới? |
  |---|---|
  | Kiểm chứng thanh toán / trạng thái cho phép (`RESUMABLE`…) | ☐ |
  | Guard trạng thái đứng **trước** side-effect | ☐ |
  | Null-check kết quả gọi ngoài (vd `policyId`) → 422 | ☐ |
  | Kiểm tenant (không chỉ khai tham số rồi bỏ) | ☐ |
  | Idempotency | ☐ |

  Ca thật: nhánh mới mất **5/5** guard, trong đó có guard repo đã từng phát hiện và vá. Ưu tiên tái dùng hàm chung; buộc phải tách thì commit message phải ghi danh sách guard đã đối chiếu.
- [ ] Bản sao công thức nghiệp vụ: MR có sửa **một** trong nhiều bản sao (hạn hợp đồng có 3 bản sao; ngày hiệu lực có 3 nơi lưu: `orders.effective_date`, `attributes.startEffectiveTime`, `display_snapshot`) mà bỏ sót bản còn lại?
- [ ] Tiền VND là `Long` (đồng), mọi tính tiền/chiết khấu ở BE (S4, AR10)
- [ ] Thông báo cho người dùng đi qua `translate` (FE) / bảng mã lỗi (BE); message exception không ra client

---

## 2. Kiến trúc & Thiết kế

- [ ] `adapter → application → domain`; domain không import Spring/JPA/Hibernate/Temporal (AR1, AR2) — ArchUnit chỉ bắt được phần đã có rule, reviewer vẫn đọc import
- [ ] Controller/Scheduler/Consumer/Temporal activity đi qua **Facade**; Facade chỉ map + delegate, không gọi JPA/outbound trực tiếp (AR4, AR5)
- [ ] UseCase không `@Service`/`@Component`, wire trong `UseCaseConfig` (AR3)
- [ ] 1 transaction = 1 aggregate; state đổi qua method của aggregate root; domain event past-tense, emit từ root (AR6, AR7)
- [ ] Kafka ra ngoài qua Transactional Outbox, không dual-write trong request (AR12) — ngoại lệ có chủ đích: SMS publisher bắn Kafka trực tiếp để tin nhắn không bị cuốn theo transaction; vì thế guard trước nó càng phải đúng
- [ ] Path REST đúng nhóm `/ins/<service>/<public|private>/v1/...`, CMS có `cms/`; private không gắn lên gateway public (Naming §7)
- [ ] Mỗi service chỉ **một** `@RestControllerAdvice`; không thêm handler `Exception.class` ở advice khác (LESSONS §4.2)
- [ ] FE: Component → Service → ApiClient/Store; không HTTP trong component (PL05 G3); dùng bộ component dùng chung (M4); feature mới lazy load (M3)
- [ ] Lib mới qua MR riêng có Tech Lead approve (TP1)

---

## 3. Bảo mật (PL04 Security / PL05 Security)

- [ ] **Tenant & quyền**: endpoint mới có `@PreAuthorize`/tenant filter; `TenantContext.get()` được dùng thật (S7, AR9). Không nhầm JWT `sub` (= `keycloak_user_id`) với `customers.id` (LESSONS §7.4)
- [ ] **CSRF**: POST ẩn danh mới khai **cả** `public-paths` và `csrfIgnoredPaths` — thiếu thì âm thầm gãy đăng ký / quên mật khẩu / SSO đối tác (LESSONS §4.6)
- [ ] **Injection**: không concat SQL (S2); không thao tác DOM trực tiếp / `[innerHTML]` chưa sanitize (D1, D2)
- [ ] **PII**: CCCD/SĐT/tên/địa chỉ mask trong log (S11); không JWT/PII trong localStorage ngoài `TokenStorageService` (PL05 S2)
- [ ] **Secret**: không hard-code (S3; FE dùng `environment.*` + CI inject)
- [ ] **Thẻ**: tokenization only, không PAN (S12)
- [ ] **Mã do AI sinh**: reviewer đọc hiểu từng đoạn quan trọng; không có `@SuppressWarnings`/`NOSONAR` mới được thêm để "qua" Sonar
- [ ] **Thay đổi đã từng bị revert** (throw `TENANT_MISMATCH` ở payment initiate, `signalWithStart`, cột `usage_count`) — MR có giải thích vì sao lần này khác? (LESSONS §10)

---

## 4. Chất lượng & Khả năng bảo trì

- [ ] **Guard trước side-effect** (LESSONS §1): đọc method của facade/use case **từ dưới lên**, với mỗi guard hỏi *"nếu dòng trên đã chạy thì guard này còn cứu được gì?"*. Thứ tự đúng: nạp entity → **tất cả** guard → gọi ngoài (REST/Kafka) → ghi DB
- [ ] **Lỗi im lặng** (LESSONS §4): có hàm `*BestEffort` / catch chỉ `log.warn` rồi đi tiếp? Kết quả `null` hoặc cache replay có bị coi là thành công? Có fallback đoán giá trị?
- [ ] **Jackson snake/camel** (LESSONS §4.1, đã dính 3 lần): DTO mới/sửa đi qua service nào — purchase, payment, policy, promotion đặt `property-naming-strategy: SNAKE_CASE` toàn cục, service khác mặc định camelCase. Client REST gọi chéo service phải khớp strategy của **bên kia**. Field nhiều từ `null` → nghi naming trước
- [ ] **Config mới có người đọc không?** Grep ra bean đọc config trước khi tin (LESSONS §4.5); tên biến môi trường khớp deployment (LESSONS §7.3)
- [ ] **Xoá "code chết"** đã chứng minh đủ (LESSONS §3): truy theo **port/interface**; grep FE với `-i`; hằng endpoint trong `api.constants.ts` không phải call site; kiểm `k8s/gateway/httproutes.yaml`, `@KafkaListener`, seed `TSD/sql_scripts/seed-*.sql`; cùng tên bảng ở nhiều schema có số phận khác nhau (`audit_log` có ở 4 DB, một bản đang ghi thật). Không tin file audit bảng — tự truy code
- [ ] Sonar: S1192 cả biến thể "hằng đã có"; S2139; S107 → record; S2629 dùng `{}`; không `return null` cho collection
- [ ] Không magic string/number; hằng FE ở `*.constants.ts`/`*.enums.ts`; `===`/`!==`; không `any`
- [ ] Javadoc/JSDoc public; comment và javadoc cập nhật cùng hành vi mới
- [ ] **FE ngày tháng** (LESSONS §9): date picker lưu **ISO**, chỉ format `dd/MM/yyyy` khi hiển thị; kiểm **mọi** chỗ đọc field ngày trong payload (ca thật: tính phí đọc `dd/MM/yyyy` đúng nhưng cấp đơn đọc `insuredBirthDate` dạng ISO → NCC nhận sai)
- [ ] Timestamp BE `+07:00` qua `DTime` (AR11)

---

## 5. Kiểm thử

- [ ] Unit test cho domain/usecase mới; integration test golden path nếu là endpoint mới (RULES §F)
- [ ] Tác giả chạy **RIÊNG** lớp test của use case vừa sửa — purchase-service có ~40 test đỏ nền ở `application`, so tổng số fail không thấy được assertion sai mới (LESSONS §5.3)
- [ ] So kết quả theo **danh tính** test fail trước/sau, không theo số (LESSONS §5.2)
- [ ] Số test lấy từ dòng `Tests run:` trong `[INFO] Results:` của **từng module**; đã chạy với `-Dmaven.test.failure.ignore=true` (không thì dừng ở module đầu tiên đỏ, bỏ qua `adapter`) và `clean` nếu chỉ đổi file test (LESSONS §5.1)
- [ ] Đổi hành vi thì sửa test + javadoc tương ứng, không để test cũ đỏ "nền"
- [ ] FE: `ng test` pass (Karma headless cần `CHROME_BIN`)
- [ ] TODO: dự án chưa có — ngưỡng coverage, cần Tech Lead bổ sung

---

## 6. Hiệu năng & Khả năng mở rộng

- [ ] Mọi SELECT có `Pageable`/`LIMIT` (SQ3); không function trên cột index trong WHERE (SQ1); cột truy vấn thường xuyên/FK/sort có index (SQ4) — ca thật: callback NCC full-scan vì thiếu index `orders.partner_transaction_id`
- [ ] Bảng giao dịch có partition key trong WHERE (SQ5)
- [ ] Connection qua pool (P4); không `new Thread()` (P1)
- [ ] Redis key có TTL + prefix `ins:<service>:`; không `KEYS`/`SCAN` hot path
- [ ] FE: unsubscribe/`takeUntilDestroyed`, `trackBy`, OnPush, `async` pipe (R1, P1, P2, P4)

---

## 7. Tác động chéo & Vận hành

- [ ] **Đụng `@Entity`/DDL → kiểm `ddl-auto` của đúng service** (LESSONS §7.1):

  | Service | yml | k8s | Nếu DROP trước khi deploy |
  |---|---|---|---|
  | payment, identity | `update` | `none` | Bảng **mọc lại** (rỗng, sai index) |
  | insurer-partner, promotion, purchase | `validate` | `none` | Service **không boot** |
  | callback | `none` | `none` | An toàn |

  `application.yml` hiện tại của cms, insurer-adaptor, notification, policy, product cũng đặt `validate` (giá trị k8s của các service này chưa được ghi trong LESSONS — kiểm manifest trước khi kết luận).

  `validate` chỉ kiểm chiều entity → schema (thừa cột không fail, thiếu mới fail). k8s `none` thiếu migration không chết lúc boot mà trả **500 ở request**.
- [ ] **Thứ tự deploy** được ghi trong commit/MR (LESSONS §11):

  | Thay đổi | Thứ tự bắt buộc |
  |---|---|
  | Thêm giá trị enum đọc từ DB | Deploy BE **trước**, set dữ liệu **sau** |
  | Xoá bảng | Gỡ `@Entity` → deploy → mới `DROP` (và xoá cả `CREATE TABLE` trong `TSD/sql_scripts/`) |
  | Thêm cột/migration | Chạy schema **trước**, deploy code sau |
  | Thêm realm role | Tạo role + gán user **trước** khi deploy code kiểm role |
  | Gộp config SMS template | Deploy `notification` **trước** `purchase` |
  | BE đổi contract mà FE phụ thuộc | Ghi rõ "Deploy TRƯỚC/SAU `ins-miniapp-fe`/`ins-cms-fe`" |

- [ ] Script SQL/seed cần chạy trước deploy được nêu tên file và DB đích trong commit
- [ ] Manifest k8s: sửa `deployment-template.yaml` + `generate-manifests.sh`, không sửa file generated
- [ ] Log đủ chẩn đoán: `STANDARD_LOG` một dòng/request theo schema Tập đoàn X, `requestContent`/`responseContent` đã mask PII (Naming §9)

---

## 8. Tuân thủ quy trình AI-SDLC

- [ ] Code AI sinh đã tuân `RULES.md`/`RULES_ANGULAR.md`/`SonarClean.md` — reviewer giải thích được mọi đoạn quan trọng
- [ ] AI không tự mở rộng phạm vi sửa Sonar ngoài issue được giao (LESSONS §8)
- [ ] Commit có footer `Co-Authored-By:` khi AI hỗ trợ (đang được dùng trong lịch sử commit)
- [ ] Lib mới có Tech Lead approve và license phù hợp (TP1, TP2)

---

## 9. Kết luận review

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Nghiệp vụ / guard / nhánh trùng | Đạt / Không đạt | [Ghi chú] |
| Kiến trúc (PL04 / PL05) | Đạt / Không đạt | [Ghi chú] |
| Bảo mật | Đạt / Không đạt | [Ghi chú] |
| Lỗi im lặng / Test | Đạt / Không đạt | [Ghi chú] |
| ddl-auto / thứ tự deploy | Đạt / Không đạt | [Ghi chú] |

**Quyết định**: Approve | Request changes | Comment
**Comment còn mở (blocking)**: [Số lượng] — phải bằng 0 để merge.

---

## Nguồn tham chiếu

- PL04 — Checklist Java backend review code (tổng hợp trong `RULES.md` §A–§F)
- PL05 — Checklist Code Review for Angular (tổng hợp trong `RULES_ANGULAR.md` §A–§J)
- `LESSONS.md` §1–§11 — lỗi đã thực sự xảy ra trong repo
- `Architecture.md` §2; INS Naming Standards v1.4.1 §7, §9
- `../rules/code-review-rules.md` (tầng 1) · `../b2/CODING_CONVENTION.md` · `../b2/dor-dod.md`

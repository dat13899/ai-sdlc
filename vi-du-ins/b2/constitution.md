---
title: constitution.md — Hiến pháp dự án INS Platform
for: B2 bước 1–2 — ví dụ điền thật
owner: Tech Lead (người duyệt duy nhất) — PM đồng ký tại Gate B2
nguồn: workspace CLAUDE.md, LESSONS.md, ins-infrastructure/{CLAUDE.md, Architecture.md, RULES.md, SonarClean.md}
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/constitution.md

# constitution.md — Hiến pháp dự án INS Platform

> Dự án **không** dựng file này bằng `/speckit.constitution`. Các quy tắc bất biến đang nằm rải ở `Architecture.md §2`, `RULES.md` (43 Java rule + các mục "INS-extra"), `SonarClean.md` và `LESSONS.md`. File này gom chúng về 7 nguyên tắc theo khung Rule / Rationale / Application; phần **Rationale** ưu tiên dẫn sự cố thật đã ghi trong `LESSONS.md`.

## Metadata

| Trường | Giá trị | Ghi chú |
|---|---|---|
| Tên dự án | INS Platform (Insurance Middleware Platform, kiến trúc MACH) | Workspace gồm 4 phần: `BE/ins-infrastructure`, `FE/ins-cms-fe`, `FE/ins-miniapp-fe`, `server-fake` |
| Version | > TODO: dự án chưa có — cần Tech Lead bổ sung | Tài liệu nguồn tự ghi "Phiên bản 1.0 — 2026-04-29" (`Architecture.md`, `RULES.md`); chưa có version riêng cho hiến pháp |
| Ratified (ngày phê chuẩn) | > TODO: dự án chưa có — cần Tech Lead + PM bổ sung | Chưa có Gate B2 chính thức |
| Last Amended | 2026-08-28 (lần rà `LESSONS.md` gần nhất) | Không phải ngày tu chính hiến pháp — chỉ là mốc dữ liệu nguồn |
| Owner / Người duyệt | Tech Lead | ADR của dự án ghi `deciders: tech-lead, secops-lead, architect…` |
| Đồng ký Gate B2 | > TODO: dự án chưa có — cần PM bổ sung | |
| Tech stack đã chốt | Java 21 LTS (Virtual Threads) + Spring Boot 3.5 + Spring Cloud · MariaDB 11.4 · MongoDB 8.x · Valkey 9.0 · Kafka ≥4.1 (KRaft) · Temporal 1.26 · Keycloak 26 · MinIO · OpenL Tablets 6.0 · KGateway 2.1 · Kubernetes · Angular 20 (FE) | `Architecture.md §1.2` |
| Template phụ thuộc | > TODO: dự án chưa dùng Spec Kit — không có `plan/spec/tasks-template.md` | Tài liệu thiết kế đi theo bộ TSD 00..08 mỗi service |
| Phạm vi áp dụng | 14 thư mục service + `ins-common` trong `ins-infrastructure`, 2 app Angular | `server-fake` là proxy dev, ngoài phạm vi |

## Core Principles

### Nguyên tắc 1 — Hexagonal 3 module & luồng request một chiều

**Rule**

- Mỗi service **MUST** là Maven multi-module 3 tầng `domain` ← `application` ← `adapter`; chiều phụ thuộc chỉ `adapter → application → domain`.
- `domain/` **MUST NOT** import `org.springframework.*`, `jakarta.persistence.*`, `org.hibernate.*`, `io.temporal.*` — chỉ Java thuần + `platform-libs:domain-core`.
- Luồng xử lý **MUST** là **Controller → Facade → Port → UseCase → Repository**. Scheduler, Kafka consumer, Temporal activity cũng **MUST** đi qua Facade.
- UseCase **MUST NOT** mang `@Service/@Component/@Repository` — khởi tạo bằng `@Bean` trong `UseCaseConfig`.
- Facade (`@Component @Transactional`) **MUST** chỉ map DTO ↔ Command/Result và delegate; không business logic, không gọi JPA repository hay outbound adapter trực tiếp.
- `@WorkflowInterface` / `@ActivityInterface` chỉ ở `adapter/inbound/temporal/`; `adapter.inbound..` **MUST NOT** import `adapter.outbound..`.

**Rationale**

- ArchUnit là cổng khách quan duy nhất cho kiến trúc: `ArchitectureTest` trong `adapter/src/test/.../` làm build fail khi tầng trong import tầng ngoài.
- Mốc hiện tại (`LESSONS §5.4`): `ArchitectureTest#controller_should_go_through_facade` đang đỏ với **3 vi phạm** — con số này là mốc, thêm 1 là hồi quy.
- `LESSONS §2`: viết lại nghiệp vụ cấp hợp đồng ở một nhánh Facade mới (`AdminPurchaseFacade.reissueNonPartnerPolicy`) đã **mất 5/5 guard** của đường cũ. Đó là lý do `CheckoutWorkflowImpl` cố ý cho run thường và run hồi sinh dùng chung `issuePolicyAndFinish`.

**Application**

- Trước khi merge: `./mvnw test -pl adapter -Dtest='ArchitectureTest'` (không cần Docker).
- Logic nghiệp vụ nằm trong aggregate; UseCase chỉ điều phối + ranh giới transaction; Command/Query/Result là `record`.
- Nhánh xử lý mới cho nghiệp vụ đã có: liệt kê từng guard của đường cũ, ưu tiên tái dùng hàm chung; buộc phải tách thì ghi danh sách guard đã đối chiếu vào commit message.

### Nguyên tắc 2 — Aggregate, sự kiện miền và thứ tự tác dụng phụ

**Rule**

- Aggregate root (`extends Aggregate<TId>`) là ranh giới nhất quán: **1 transaction = 1 aggregate**; mọi thay đổi trạng thái đi qua method của root; collection lộ ra ngoài phải `Collections.unmodifiableList(...)`.
- Domain Event **MUST** ở thì quá khứ (`OrderConfirmedEvent`), là `record` bất biến, phát từ aggregate root qua `DomainEventPublisher.publish(...)`; application/controller **MUST NOT** tự phát.
- Kafka ra ngoài **MUST** dùng Transactional Outbox (lưu aggregate + insert outbox atomic); **MUST NOT** dual-write Kafka trong cùng request.
- Trong Facade/UseCase, thứ tự **MUST** là: (1) nạp entity → (2) **tất cả guard** (trạng thái, tenant, quyền, idempotency) → (3) gọi ngoài (REST/Kafka) → (4) ghi DB.

**Rationale**

- `@Transactional` chỉ rollback DB của service đang chạy; nó **không** gỡ được hợp đồng đã tạo bên `policy-service` qua REST, SMS đã bắn (`KafkaTemplateSmsPublisher` cố ý bắn Kafka trực tiếp, không qua outbox), hay yêu cầu đã gửi sang NCC.
- `LESSONS §1` — ba ca thật trong cùng một commit: guard `requireStatusIn` đặt sau bước gửi SMS → khách có HĐ + SMS nhưng đơn không đổi (HĐ mồ côi); `save(order)` ghi đè ngày hiệu lực rồi mới kiểm `RESUMABLE` → API trả 400 nhưng dữ liệu đã commit; `createPolicyFromOrder` trả `null` không ai kiểm → SMS "HĐ đã kích hoạt" khi không có HĐ.

**Application**

- Review method **từ dưới lên**, hỏi: "guard này còn cứu được gì nếu dòng trên đã chạy?"
- Factory `X.create(...)` validate + sinh ID; `X.reconstitute(...)` cho persistence (không validate, không sinh ID).
- Vi phạm nghiệp vụ → `BusinessRuleViolationException`; không tìm thấy → `ResourceNotFoundException`; validate bằng `AssertionConcern`.
- Topic Kafka theo SAD: `ins.{domain}.events | requests | results`, `ins.audit.stream`.

### Nguyên tắc 3 — Đa tenant và quy ước dữ liệu

**Rule**

- Mọi bảng **MUST** có `tenant_id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`; truy cập tenant qua `TenantContext.get()` (`ins-common`). Ngoại lệ duy nhất: `identity-service` (cross-tenant). MariaDB dùng RLS dạng view.
- Mọi domain ID **MUST** là UUID v7 qua `UuidValueGenerator.generate()`.
- Tiền VND **MUST** là `Long` (đơn vị đồng); **MUST NOT** dùng `BigDecimal`.
- Timestamp **MUST** theo `+07:00` (Asia/Ho_Chi_Minh) qua `DTime`; **MUST NOT** khai `static` `Calendar`/`SimpleDateFormat`.
- Xoá **MUST** là soft delete (`deleted_at = NOW()`), trừ batch cleanup.

**Rationale**

- `LESSONS §7.5`: tenant mặc định là all-zeros; đã có bug seed nhầm tenant khiến một sản phẩm sức khoẻ không hiện ở `products?categoryCode=HEALTH`.
- `LESSONS §7.4`: JWT `sub` = `keycloak_user_id`, **khác** `customers.id`; purchase / policy / payment / promotion đều lưu `customer_id = JWT sub` — nhầm không gian ID là lỗi lan rộng.
- FE (`LESSONS §9`): date picker lấy `dd/MM/yyyy` cho getFee nhưng cấp đơn đọc ISO → NCC nhận sai ngày sinh.

**Application**

- Sản phẩm/đơn "không hiện" → kiểm `tenant_id` trong Mongo/MariaDB trước khi debug sâu.
- FE lưu ngày dạng ISO, chỉ format `dd/MM/yyyy` khi hiển thị.
- Enum trong JPA dùng `AttributeConverter`; JPA entity (`JpaXxx`) tách khỏi aggregate, map qua MapStruct.

### Nguyên tắc 4 — Schema, `ddl-auto` và thứ tự triển khai

**Rule**

- Migration **MUST** qua Flyway (`db/migration/V{n}__{desc}.sql`); ngoài local, `spring.jpa.hibernate.ddl-auto` **MUST** là `validate` (hoặc `none`) — **MUST NOT** `update`.
- Trước khi đụng `@Entity`/DDL **MUST** kiểm `ddl-auto` thực tế của **đúng service đó** (yml + profile develop + k8s).
- Xoá bảng/cột **MUST** theo thứ tự: gỡ code (`@Entity`) → **deploy** → mới `DROP`.
- Thêm cột/migration: chạy schema **trước**, deploy code **sau**. Thêm giá trị enum đọc từ DB: deploy BE **trước**, set dữ liệu **sau**. Thêm realm role: tạo role + gán user **trước** khi deploy code kiểm role. Gộp config SMS template: deploy `notification` **trước** `purchase`.

**Rationale**

- `LESSONS §7.1` — `ddl-auto` khác nhau theo service:

  | Service | yml + develop | k8s | Nếu DROP trước khi deploy |
  |---|---|---|---|
  | payment, identity | `update` | `none` | Bảng mọc lại (rỗng, sai index) |
  | insurer-partner, promotion, purchase | `validate` | `none` | **Service không boot** |
  | callback | `none` | `none` | An toàn |

- `validate` chỉ đối chiếu chiều entity → schema: bảng/cột **thừa** không fail, chỉ **thiếu** mới fail. Ở k8s `ddl-auto=none`, thiếu migration không chết lúc boot mà trả **500 ở request** — khó truy hơn nhiều.
- `LESSONS §7.2`: DDL trong `TSD/sql_scripts/` không phải nguồn sự thật — `orders.partner_transaction_id` có trong `JpaOrder` nhưng DDL gốc không tạo; dựng DB mới từ DDL gốc thì service không boot.

**Application**

- Xoá bảng thì xoá luôn `CREATE TABLE` tương ứng trong `TSD/sql_scripts/`, nếu không môi trường mới tạo lại bảng.
- Mỗi cột/bảng mới phải đánh giá index ngay ở migration; bảng giao dịch phải có partition key (`created_at`/`tenant_id`) trong WHERE; mọi SELECT có `LIMIT`/`Pageable`.
- ⚠️ **Lệch giữa quy định và thực tế:** checkout hiện tại có **0 file** `db/migration/*.sql` trong cả 15 thư mục `ins-*` (14 service + `ins-common`); thay đổi schema đang đi qua script tay `alter-* / drop-* / fix-*.sql` trong `TSD/sql_scripts/`.
  > TODO: dự án chưa có — cần Tech Lead chốt: đưa về Flyway thật, hay chính thức hoá quy trình script tay (ai chạy, ở đâu, rollback thế nào).

### Nguyên tắc 5 — Bảo mật mặc định

**Rule**

- PII (tên, CCCD, SĐT, địa chỉ) **MUST** mã hoá AES-256 at-rest và mask trong log; health data **MUST** dùng MongoDB Queryable Encryption; thẻ thanh toán **MUST** tokenization — **MUST NOT** lưu PAN.
- Giao tiếp ngoài cluster **MUST** TLS ≥1.2 (ưu tiên 1.3 — ADR-03).
- **MUST NOT** hard-code password, API key, token, connection string; credential NCC **MUST NOT** nằm plaintext trong DB/`application.yml`, chỉ lưu ref Vault (ADR-ADP-07).
- Mọi endpoint **MUST** kiểm phân quyền (RBAC + tenant) — `@PreAuthorize` hoặc tenant filter; mặc định deny.
- SQL **MUST** parameterized (JPA/JPQL/`?`), **MUST NOT** nối chuỗi. Logic tính tiền/chiết khấu **MUST** chỉ chạy ở backend.
- Audit log **MUST** append-only, bất biến, lưu ≥5 năm, stream qua `ins.audit.stream`.

**Rationale**

- `LESSONS §4.6`: endpoint POST ẩn danh chỉ khai `public-paths` mà quên `csrfIgnoredPaths` → register / forgot-password / SSO đối tác gãy **âm thầm**. Phân biệt: 403 trong ~1ms = CSRF; 401 = thiếu `public-paths`.
- `LESSONS §10`: bản vá IDOR ở payment initiate (throw `TENANT_MISMATCH`) phải **revert về detection-only** vì chặn nhầm khách thật — thay đổi auth cần review riêng, không vá vội.

**Application**

- Kênh auth: B2C JWT (Keycloak realm `customer`); nhân sự NCC (`insurer-admin`); đối tác B2B API Key + HMAC-SHA256; M2M nội bộ `client_credentials` (`internal`).
- Webhook ra ngoài chỉ qua `ins-callback-service` (HMAC-SHA256, retry exponential backoff). Tích hợp NCC chỉ qua `ins-insurer-adaptor` (Resilience4j circuit breaker, retry 3× exponential, timeout 10s).
- Thư viện third-party mới **MUST** được Tech Lead duyệt, sửa `pom.xml` qua MR riêng; license MIT / Apache-2.0 / BSD, tránh GPL.

### Nguyên tắc 6 — Chất lượng: Sonar sạch, test đúng lớp, cảnh giác lỗi im lặng

**Rule**

- Code **MUST** sạch Sonar **trước** khi commit; **MUST NOT** dùng `@SuppressWarnings("java:S…")`, `"unchecked"`, `// NOSONAR` để né rule. Ngoại lệ duy nhất đã duyệt: S4502 (CSRF) ở endpoint đối tác, kèm comment giải thích. Gặp suppress cũ trong file đang sửa → gỡ và fix thật.
- Mỗi tầng có test riêng: `domain` (JUnit thuần), `application` (mock port, không Spring), `adapter` ArchUnit (bắt buộc pass), `*IntegrationTest` (Testcontainers MariaDB/Kafka/Redis).
- Sau khi sửa UseCase **MUST** chạy **riêng** lớp test của UseCase đó và so theo **danh tính test**, không so tổng số.
- **MUST NOT** `catch (Exception)`/`Throwable` chung chung trừ ranh giới hệ thống; catch phải log/forward exception gốc.

**Rationale**

- `LESSONS §5.3`: purchase-service có 40+ test đỏ nền (do `messages.properties` chỉ ở module adapter → `Msg.get` trả tên KEY); một assertion **sai thật** nằm im trong đó nhiều tuần vì mọi người chỉ so tổng số fail.
- `LESSONS §5.1`: `./mvnw -o -q test` dừng ở module đỏ đầu tiên → bỏ qua hẳn `adapter`; `awk` trên surefire `.txt` đếm thiếu (337 ra 303) do `@Nested` có display name tiếng Việt.
- `LESSONS §4`: nhóm lỗi nguy hiểm nhất trả 200 mà dữ liệu sai — Jackson snake_case ↔ camelCase làm field lặng lẽ `null` (đã dính **3 lần**); `GlobalExceptionHandler` có `@ExceptionHandler(Exception.class)` biến 400 thành 500; hàm `*BestEffort` log `warn` rồi đi tiếp khiến SMS không tới khách mà endpoint vẫn 200.
- `LESSONS §8`: tự grep quét thêm lỗi Sonar rồi sửa đã đẻ ra S1144 đòi xoá fallback circuit-breaker.

**Application**

- Đếm test bằng `-Dmaven.test.failure.ignore=true`, `clean` trước khi đọc kết quả, chỉ tin dòng `Tests run:` trong khối `[INFO] Results:` của từng module.
- Chỉ sửa đúng issue Sonar được giao; tên method trong annotation (`fallbackMethod`) để literal; S107 → parameter object là `record`.
- Field nhiều từ bị `null` bất thường → nghi naming strategy Jackson **trước**.
- Mốc test đỏ nền (2026-08-28) ghi ở `LESSONS §5.4`; nhiều hơn mốc = hồi quy.
- ⚠️ Ngưỡng coverage: > TODO: dự án chưa có — cần Tech Lead bổ sung (chưa thấy cổng coverage trong nguồn).

### Nguyên tắc 7 — Kiểm soát thay đổi & quản trị AI agent

**Rule**

- AI agent **MUST** chỉ commit/push khi người dùng bảo rõ; mặc định dừng ở working tree.
- Trước khi làm **MUST** pull `develop` trên **toàn bộ** git repo của workspace (3 repo ngoài + 15 repo con lồng trong `BE/ins-infrastructure`).
- **MUST NOT** `git add -A` / `git add .`; **MUST** `git status` trước khi stage và chỉ stage từng file của mình.
- **MUST NOT** chạy `./mvnw spotless:apply` không giới hạn phạm vi.
- **MUST** chỉ làm trong `ins-infrastructure`, `ins-cms-fe`, `ins-miniapp-fe`; **MUST NOT** sửa `ins-bit` (clone cũ nhánh staging) hay `ins-client` (bản stale, untracked).
- Kết luận "code chết" **MUST** có chứng minh đủ trước khi xoá (`LESSONS §3`); việc đã từng revert (`LESSONS §10`) **MUST NOT** làm lại theo cách cũ.

**Rationale**

- `LESSONS §6.2`: worktree dùng chung, người khác commit xen giữa — gặp **4 lần trong một phiên**. Một commit đã gộp nhầm việc người khác (đổi tên realm Keycloak `realms/customer` → `realms/ins-customer`, xoá 6 dòng `ins.scheduler.*`) và đã push, không rút lại được.
- `LESSONS §6.3`: một lần `spotless:apply` reflow javadoc **120 file không liên quan**.
- `LESSONS §6.1`: đã nhầm `ins-bit` (chậm 339 commit) với repo thật **2 lần**.
- `LESSONS §3`: suýt khai tử `payment_method_gateways` vì grep tên class impl ra 0 caller — caller inject qua **port**.

**Application**

- Stage theo danh sách: `git status --porcelain` → lọc file người khác → `git add -- <file>`; kiểm `git diff --cached --name-only` không chứa file người khác.
- Merge `develop → release`: `git stash push -u -- <file cụ thể>` → merge → `git stash pop` → **kiểm lại `git status`**; báo người dùng các commit của người khác bị kéo theo.
- Chứng minh code chết: truy theo tên **port/interface**; grep FE có `-i`, tách "khai hằng" với "call site"; kiểm `k8s/gateway/httproutes.yaml`, `@KafkaListener`, seed `TSD/sql_scripts/seed-*.sql`; Java bị `.gitignore` nên dùng `rg --no-ignore -g '*.java'`.
- ⚠️ Kích thước PR, branch protection, bắt buộc review: > TODO: dự án chưa có — cần Tech Lead bổ sung.

## Governance

### Ai được sửa

| Vai trò | Quyền với constitution.md |
|---|---|
| Tech Lead | Người duyệt duy nhất. Thực tế: là "decider" trong ADR (`TSD/docs/design/decisions/`) và duyệt thư viện third-party (RULES TP1) |
| Architect / SecOps Lead / DPO / Legal Lead | Xuất hiện ở `deciders`/`consulted` của ADR bảo mật, lưu trữ dữ liệu |
| PM | > TODO: dự án chưa có — cần PM bổ sung vai trò đồng ký |
| Thành viên / Dev | Đề xuất qua MR |
| AI Agent | **MUST NOT** tự sửa; chỉ soạn nháp khi được yêu cầu |

### Quy trình sửa đổi (Amendment Procedure)

- [ ] 1. Mở MR sửa file, kèm lý do và **sự cố cụ thể** (dự án đã có thói quen này: mỗi mục `LESSONS.md` là một lỗi đã thực sự xảy ra).
- [ ] 2. Nêu nguyên tắc bị ảnh hưởng và tác động tới `RULES.md`, `SonarClean.md`, `SKILL.md`, `AGENTS.md`.
- [ ] 3. Tech Lead duyệt.
- [ ] 4. Cập nhật Version / Last Amended. > TODO: dự án chưa có — cần Tech Lead bổ sung quy ước version.
- [ ] 5. Đồng bộ file phụ thuộc trong cùng MR — `RULES.md §C13` đã áp dụng nguyên tắc "một nguồn": Sonar chỉ ghi ở `SonarClean.md`, không chép sang `RULES.md`.
- [ ] 6. Sync Impact Report. > TODO: dự án chưa có.

### Chính sách phiên bản (Versioning Policy — Semantic Versioning)

> TODO: dự án chưa có — cần Tech Lead bổ sung. Hiện chỉ có dòng "Phiên bản: 1.0 — 2026-04-29" ở cuối `Architecture.md` và `RULES.md`. ADR thì có quy ước thay thế qua trường `supersedes` / `superseded_by`.

| Loại bump | Điều kiện |
|---|---|
| **MAJOR** | > TODO |
| **MINOR** | > TODO |
| **PATCH** | > TODO |

### Rà soát tuân thủ (Compliance Review)

- **Tự động hiện có:** `ArchitectureTest` (ArchUnit) mỗi service; Sonar (có server staging bắt thêm rule, theo `SonarClean.md`); Husky + lint-staged ở 2 app FE (`eslint --fix` + `prettier --write`).
- **Thủ công hiện có:** checklist review PL04 (Java) / PL05 (Angular); `LESSONS §0` trước mỗi commit; `RULES.md §F` trước mỗi commit/PR.
- Rà soát định kỳ: > TODO: dự án chưa có — cần Tech Lead bổ sung chu kỳ.

## Checklist ký duyệt tại Gate B2 (Human Gate)

- [ ] Không còn placeholder chưa giải thích — **còn TODO**: version, ngày phê chuẩn, đồng ký PM, coverage, branch protection, Flyway thực tế.
- [x] Mỗi nguyên tắc có đủ Rule / Rationale / Application.
- [ ] Ngày ISO, Version nhất quán — chưa có version.
- [ ] Template phụ thuộc đã đồng bộ — dự án chưa dùng Spec Kit.
- [ ] Tech Lead + PM đã ký.

## Nguồn tham chiếu

- `CLAUDE.md` (workspace) và `BE/ins-infrastructure/CLAUDE.md`
- `BE/ins-infrastructure/Architecture.md` §1.2, §1.4, §2.1–§2.7, §3
- `BE/ins-infrastructure/RULES.md` (PL03 + PL04 + mục E, F)
- `BE/ins-infrastructure/SonarClean.md` (POLICY)
- `LESSONS.md` §0–§11
- ADR: `TSD/docs/design/decisions/ADR-ADP-07-credential-vault-never-plaintext.md`

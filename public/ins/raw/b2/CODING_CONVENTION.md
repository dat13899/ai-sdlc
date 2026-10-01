---
title: CODING_CONVENTION.md — Quy chuẩn viết code (INS Platform)
for: B2 bước 2 — Soạn cùng constitution.md (Tech Lead + AI); áp dụng mọi giai đoạn từ B6 trở đi
owner: Tech Lead
nguồn: RULES.md (PL03 + PL04), RULES_ANGULAR.md (PL05), SonarClean.md, Architecture.md, Naming Standards v1.4.1, LESSONS.md, cấu hình lint/format thật của repo
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/CODING_CONVENTION.md

# CODING_CONVENTION.md — Quy chuẩn viết code

> Dự án không viết lại style guide: nền là **Oracle Code Conventions + google-java-format** (Java) và **Angular Style Guide + Prettier mặc định + ESLint** (TypeScript). File này chỉ ghi phần **siết chặt**. Chi tiết gốc nằm ở `RULES.md` (Java), `RULES_ANGULAR.md` (Angular), `SonarClean.md` (Sonar) trong repo `ins-infrastructure` — mục 10 tóm lược từng rule 1 dòng, giữ nguyên mã rule.

## 1. Phạm vi áp dụng

| Hạng mục | Nội dung |
|---|---|
| Áp dụng cho | 15 microservice Java 21 + Spring Boot 3.5 và thư viện chung `ins-common` (repo `ins-infrastructure`); 2 app Angular 20: `ins-cms-fe` (admin), `ins-miniapp-fe` (khách hàng) |
| Đối tượng tuân thủ | Dev, mọi AI agent sinh code, người review — "vi phạm là lý do REJECT trong code review" (RULES.md) |
| Quan hệ với chuẩn gốc | Mọi rule trong RULES.md / RULES_ANGULAR.md mức **Bắt buộc** |
| Thứ tự ưu tiên khi rule mâu thuẫn | Java: `Architecture.md §2` > security > performance > style. Angular: security > architecture (Presentation/Business/Data) > performance > style |
| Cơ chế thực thi | BE: ArchUnit test mỗi service (build fail nếu vi phạm tầng), SonarQube, spotless (chạy tay). FE: husky `pre-commit` → lint-staged (`eslint --fix` + `prettier --write`) |
| Ngoại lệ | Sonar: chỉ **S4502** (CSRF) ở endpoint đối tác, kèm comment giải thích. Ngoài ra không có cơ chế ngoại lệ được ghi |
| Liên quan | `LESSONS.md` (lỗi đã thực sự xảy ra), `rules/code-review-rules.md`, `bo-sung/code-review-checklist-nguoi.md`, `b2/dor-dod.md` |

## 2. Naming convention

Nguồn: RULES.md G2 + Naming Standards v1.4.1 (trạng thái REVIEW, 2026-06-05) — code hiện tại đã theo chuẩn path mới của Naming Standards.

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Class / Interface Java | `PascalCase` (Oracle Code Conventions) | `SaveOrderDraftUseCaseImpl`, `PurchaseExceptionHandler` |
| Method / field / biến | `camelCase` | `createPolicyFromOrder`, `markPaid` |
| Constant | `static final` `UPPER_SNAKE_CASE` | `KEY_ORDER_ID`, `FIELD_PRODUCT_CODE` |
| Package | lowercase, `com.example.platform.ins.<service>.<layer>` | `com.example.platform.ins.purchase.domain` |
| JPA entity / Domain event / Param-object | `Jpa<Xxx>` tách khỏi aggregate; event thì quá khứ; record `<Name>Cmd/Spec/State/Input` (S107) | `JpaOrder`, `OrderConfirmedEvent`, `PolicyResultCmd` |
| File Angular | Angular Style Guide: `feature.component.ts`, `feature.service.ts`; hằng/enum ở `*.constants.ts`, `*.enums.ts` | `customer-order.service.ts`, `api.constants.ts` |
| Component selector | ESLint: `cms-` (CMS) / `app-` (miniapp), element `kebab-case`; directive attribute `camelCase` | `<cms-page-header>` |
| REST path | `/ins/<service>/<public\|private>/v<n>/<resource>`; CMS thêm `cms/` sau `v1`; resource số nhiều `kebab-case`; path var / query / JSON DTO `camelCase` | `/ins/purchase/public/v1/order-drafts`, `/ins/identity/private/v1/customers/{customerId}` |
| DB schema / table / column | schema `ins_<service>_db`; table `snake_case` số nhiều; column `snake_case` số ít; PK `id`, FK `<ref_table_singular>_id` | `ins_purchase_db`, `orders`, `tenant_id` |
| Index / Unique / FK | `idx_<table>_<cols>` / `uk_<table>_<cols>` / `fk_<table>_<ref_table>` | `idx_orders_tenant_id_status` |
| Kafka topic / consumer-group | lowercase + `-`, không dùng `.`, không version trong tên | `ins-purchase-events`, `ins-purchase-dlq`, `ins-purchase-events-consumer` |
| `event_type` / envelope | `<Domain>.<Aggregate>.<Event>` PascalCase + dấu chấm; field envelope `snake_case` | `Order.Issuance.OrderIssued`, `event_id`, `tenant_id` |
| Redis key | `ins:<service>:<entity>:<id>[:<attr>]`, lowercase + `:`; **TTL bắt buộc** | `ins:payment:idem:<idempotency_key>` (TTL 48h) |
| Keycloak | realm không prefix (`customer`, `tenant-admin`, `internal`); client-id `ins-<service>-service` | |
| Nhánh Git | Chuẩn: `feature-<JIRA>-<slug>`, `feature-<JIRA>-hotfix-<slug>`; tag `v<M>.<m>.<p>` | `feature-INS-1234-add-order-api` |
| Biến môi trường | `INS_<NHÓM>_*` | `INS_PURCHASE_DB_*`, `INS_REDIS_*` |

**Ghi chú siết chặt / mâu thuẫn cần biết:**

- [ ] Tên có nghĩa, tránh viết tắt mơ hồ (G2). Tránh reserved keyword khi đặt bảng (`order` → `orders`, `user` → `users`).
- [ ] Status trong DB: `TINYINT` + bảng ref, **không** `ENUM` (Naming §2).
- [ ] ⚠️ Timestamp: Naming Standards ghi `created_time/updated_time/deleted_time` (UTC); RULES.md ghi `created_at/updated_at/deleted_at` và `+07:00` qua `DTime`. Theo cột đang có của bảng đang sửa.
- [ ] ⚠️ Tiền: Java dùng `Long` (đồng), cấm `BigDecimal` (AR10); Naming Standards ghi cột DB `DECIMAL(18,4)`.
- [ ] ⚠️ RULES.md G10/AR13 vẫn ghi path `/api/v1/{resource}` — đã bị Naming Standards thay (gateway không hỗ trợ URL rewrite nên controller phải khai full path).
- [ ] ⚠️ Nhánh thực tế chưa theo chuẩn: có `develop`, `release`, `goliveV1`, `main` và nhánh kiểu `feature/...`, `fix/...`, `feat/...`, nhánh theo tên người.

## 3. Formatting & Linting — công cụ bắt buộc theo ngôn ngữ

| Ngôn ngữ | Formatter | Linter | Config file | Phiên bản ghim |
|---|---|---|---|---|
| Java 21 | spotless-maven-plugin + `googleJavaFormat`, `removeUnusedImports`, `trimTrailingWhitespace`, `endWithNewline` | SonarQube (+ SpotBugs theo G1); ArchUnit cho ranh giới tầng | `pom.xml` gốc mỗi service (`pluginManagement`) | spotless `2.44.4`, ArchUnit `1.3.0` |
| TypeScript (Angular 20) | Prettier (không có `.prettierrc` → cấu hình mặc định) | ESLint 9 flat config: `@eslint/js` recommended, `typescript-eslint` recommended + stylistic, `angular-eslint` tsRecommended, template recommended + accessibility, `eslint-config-prettier` | `eslint.config.js`, `tsconfig.json` (`strict`, `strictTemplates`, `noImplicitReturns`…) | Prettier `^3.8.3`, ESLint `^9.39.4`, TypeScript `~5.9.2`, theo `package-lock.json` |
| SCSS / JSON | Prettier | — | lint-staged trong `package.json` | |

**Rule ESLint dự án tự thêm (cả hai app):** `eqeqeq: always` (error) · `@typescript-eslint/no-explicit-any` (error) · `consistent-type-definitions: interface` (error) · `no-var`, `prefer-const`, `no-debugger` (error) · `no-console` chỉ cho `warn`/`error` (warn) · `no-restricted-globals` chặn `localStorage`/`sessionStorage` ngoài `TokenStorageService` (error) · `prefer-on-push-component-change-detection` (warn) · `no-floating-promises` (warn) · `explicit-function-return-type` (warn). Khác nhau: `prettier/prettier` là `warn` ở CMS, `off` ở miniapp.

**Lệnh:**

```bash
# FE (trong thư mục app)
npm run lint          # ng lint
npm run lint:fix
npm run format        # prettier --write "src/**/*.{ts,html,scss}"
npm run format:check
# BE (trong ins-<service>/)
./mvnw spotless:apply   # CHỈ trên file mình sửa — xem quy tắc dưới
```

**Quy tắc:**

- [ ] Format theo formatter, không tùy chỉnh tay (G11 Java, G12 Angular).
- [ ] **CẤM `./mvnw spotless:apply` không giới hạn phạm vi** — một lần chạy đã reflow javadoc 120 file không liên quan (LESSONS §6.3). spotless không gắn vào lifecycle build, phải chạy tay.
- [ ] Code sạch Sonar **trước** khi commit, không đợi pipeline báo (SO1). Cấm `@SuppressWarnings("java:S…")`, `"unchecked"`, `// NOSONAR` (SO2).
- [ ] FE: kiểm CRLF sau khi AI/Edit tool ghi file — prettier báo ``Delete `␍` `` mọi dòng; `grep -c $'\r$' file` phải = 0 (LESSONS §9).
- [ ] Không format lại file không liên quan trong cùng commit.

## 4. Cấu trúc thư mục chuẩn

**Backend — mỗi service là Maven 3 module (`domain` ← `application` ← `adapter`):**

```text
ins-<service>/
├── pom.xml                  # parent (packaging=pom), repo vendored libs/ (platform-libs)
├── domain/                  # Pure Java — KHÔNG Spring/JPA/Hibernate/Temporal
│   └── .../domain/{aggregate,value,event,repository,criteria}/
├── application/             # UseCase + Port + Command/Query/Result (record)
│   └── .../application/{usecase,port/{inbound,outbound},dto}/
├── adapter/                 # Spring Boot runtime
│   └── .../adapter/
│       ├── configuration/   # KafkaConfig, RedisConfig, TemporalConfig, UseCaseConfig, SecurityConfig
│       ├── inbound/{restful,messaging,scheduler,temporal,facade}/
│       └── outbound/{persistence,messaging}/
│   └── src/test/.../ArchitectureTest.java
├── docker/docker-compose.yml
└── mvnw, libs/
```

**Frontend — `ins-cms-fe` / `ins-miniapp-fe` (standalone bootstrap):**

```text
src/app/
├── components/              # component dùng chung (toast, pagination, date-picker…)
│   └── api/{constants,guards,interceptors,models,services,utils,i18n}/
│                            # tầng Data: *.service.ts gọi HTTP, api.constants.ts khai endpoint
├── showcase/{layout,pages,pipes}/   # màn hình theo feature (pages/<feature>/…)
└── styles/
```

**Quy tắc ranh giới (đo lường được):**

- [ ] `adapter → application → domain`, không chiều ngược; `adapter.inbound..` không import `adapter.outbound..` — ArchUnit enforce (AR1).
- [ ] Controller / Scheduler / Kafka consumer / Temporal activity → **Facade** → Port → UseCase → Repository; không bypass (AR4). Mốc hiện tại `ArchitectureTest#controller_should_go_through_facade` đỏ **3 vi phạm** — nhiều hơn là hồi quy (LESSONS §5.4).
- [ ] UseCase không là Spring bean — wire bằng `@Bean` trong `UseCaseConfig` (AR3); chỉ orchestration + transaction, logic ở aggregate.
- [ ] Facade `@Component @Transactional` chỉ map DTO ↔ Command/Result + delegate, không gọi JPA/outbound trực tiếp (AR5).
- [ ] `@WorkflowInterface`/`@ActivityInterface` chỉ ở `adapter/inbound/temporal/` (AR14).
- [ ] FE: Component (presentation) → Service (business) → ApiClient/Store (data); component **không** gọi HTTP trực tiếp (Angular G3). Hằng/enum ở file `*.constants.ts`/`*.enums.ts` của feature (G5).
- [ ] Chỉ sửa ở repo thật: `ins-infrastructure`, `ins-cms-fe`, `ins-miniapp-fe`. `ins-client` (stale, untracked) và `ins-bit` (clone cũ nhánh staging) **không sửa, không đọc để kết luận** (LESSONS §6.1, §9).

## 5. Error handling

| Quy tắc | Mức | Ghi chú |
|---|---|---|
| Không `throw` exception thẳng từ Controller — map sang response lỗi (J18) | MUST | |
| Catch phải log/forward exception gốc: `log.error(msg, e)` hoặc `throw new XxxException(msg, e)` (J33, S1166) | MUST | Cấm `catch (Exception e) {}` |
| Không vừa log vừa rethrow (S2139) | MUST NOT | Nhét context vào message exception, bỏ log |
| Catch đúng loại — không catch `Exception`/`Throwable` trừ ranh giới hệ thống (SC2) | MUST | |
| Không `throw new RuntimeException(...)` chung — dùng exception chuyên biệt (S112) | MUST NOT | vd `PurchaseApplicationException` |
| Domain: `AssertionConcern.assertArgument…`; vi phạm nghiệp vụ → `BusinessRuleViolationException`; không thấy → `ResourceNotFoundException` | MUST | Architecture §2.1 |
| Fail-fast: validate đầu method, `@Valid @RequestBody` (SC8) | MUST | |
| Không `printStackTrace()` / `System.out` (J32, ML6) | MUST NOT | |
| Không log PII raw (CCCD, SĐT, mật khẩu, token) — phải mask | MUST NOT | |
| **Handler `Exception.class` nuốt lỗi validation → 400 thành 500** | Đã xảy ra | LESSONS §4.2: handler không `extends ResponseEntityExceptionHandler` mà có `@ExceptionHandler(Exception.class)`. Mỗi service chỉ giữ **một** `@RestControllerAdvice` `@Order(HIGHEST_PRECEDENCE)` — advice thứ hai sẽ cướp exception |
| **Hàm `*BestEffort` log `warn` rồi đi tiếp** | Đã xảy ra | LESSONS §4.3: SMS thiếu `Idempotency-Key` → 400 bị nuốt, SMS không tới khách, endpoint vẫn 200; `createPolicyFromOrder` trả `null` mà luồng vẫn báo thành công. Kết quả best-effort phải được kiểm, không mặc định là thành công |
| Fallback im lặng (LESSONS §4.7) | SHOULD NOT | Biến lỗi thành "chạy đúng nhờ đoán trúng" |

**Mẫu body lỗi thống nhất (shape thật của purchase-service):**

```json
{ "success": false, "errorCode": "<mã trong bảng mã của service>", "message": "<thông điệp đã phân giải>", "timestamp": "..." }
```

- Message của exception **không** ra client, chỉ vào log; nội dung hiển thị phân giải theo thứ tự: hệ thống thông điệp lỗi tập trung → default của backend → lỗi hệ thống.
- ⚠️ Naming Standards ghi chuẩn lỗi là **RFC 7807 Problem Details** — code hiện tại đã bỏ `ProblemDetail` vì trước đây `detail = ex.getMessage()` lộ chuỗi kỹ thuật ra FE. Cần Tech Lead chốt một chuẩn.
- FE: dùng util `api-error.util.ts` và `error.constants.ts` của app; text lỗi qua `translate` (G13).

## 6. Documentation

- [ ] Mọi `public` class/method/field Java có **Javadoc** (G3) — đặc biệt module shared `ins-common` và port interface.
- [ ] Mọi `public` class/method/`@Input`/`@Output` Angular có **JSDoc** (G11).
- [ ] Comment đồng bộ với code; sửa code thì sửa comment (G7/G8). Ca thật: commit đổi hành vi `RESUMABLE` mà không sửa test lẫn javadoc → assertion sai nằm im nhiều tuần (LESSONS §5.3).
- [ ] Không để code bị comment-out (S125) và không viết comment **trông giống code** (tránh `=`, `;` cuối dòng, `()`, `→`, `obj.field`) (LESSONS §8).
- [ ] `TODO` phải có ticket và việc cụ thể: `// TODO(JIRA-123): <việc>` (S1135); method rỗng ghi `// no-op: <lý do>` (S1186).
- [ ] Tài liệu thiết kế kỹ thuật (TSD) nằm trong repo (`TSD/`), cập nhật bằng commit `docs(tsd-<service>)`. DDL trong `TSD/sql_scripts/` **không** phải nguồn sự thật — entity + DB thật mới là (LESSONS §7.2).

## 7. Git & Commit

| Hạng mục | Quy tắc |
|---|---|
| Nhánh | Tích hợp trên `develop`; merge `develop → release`. Chuẩn đặt tên nhánh: `feature-<JIRA>-<slug>` (chưa tuân thủ đều — xem mục 2) |
| Commit message | Conventional Commits `<type>(<scope>): <mô tả>` — chi tiết ở `bo-sung/conventional-commits.md` |
| Stage | **CẤM `git add -A`** — worktree dùng chung, đã gộp nhầm việc người khác và push không rút lại được (LESSONS §6.2). Stage theo từng file, kiểm `git diff --cached --name-only` |
| Merge develop → release | `git stash push -u -- <file cụ thể>` → merge → `git stash pop` → **kiểm lại `git status`**; báo cho người liên quan nếu merge kéo theo commit của người khác |
| Library mới | Tech Lead approve, sửa `pom.xml`/`package.json` qua **MR riêng** (TP1); chỉ MIT/Apache-2.0/BSD, tránh GPL (TP2); commit `package-lock.json` (TP4) |
| Kích thước PR | > TODO: dự án chưa có — cần Tech Lead bổ sung |
| Nội dung PR | > TODO: dự án chưa có template PR — cần Tech Lead bổ sung (commit body hiện đang gánh: "Test:", "Deploy TRƯỚC/SAU …") |
| File sinh tự động | Không sửa file manifest generated — sửa `deployment-template.yaml` rồi chạy `generate-manifests.sh [TAG]` (LESSONS §7.3) |

## 8. Ranh giới khi AI agent sinh code

- [ ] **Bắt buộc đọc** `RULES.md` (Java) / `RULES_ANGULAR.md` (Angular) và `SonarClean.md` trước khi sinh/sửa code; không sinh code vi phạm rule Bắt buộc kể cả khi user không nhắc; rule mâu thuẫn yêu cầu → ưu tiên rule hoặc hỏi lại (RULES §G, RULES_ANGULAR §K).
- [ ] **Không né Sonar**: cấm `@SuppressWarnings("java:S…")`/`"unchecked"`/`// NOSONAR`; gặp suppress cũ trong file đang sửa → gỡ và fix thật (SonarClean POLICY).
- [ ] **Chỉ sửa đúng issue Sonar được giao** — không tự grep quét thêm rồi sửa: tự tách hằng `fallbackMethod` đã đẻ ra S1144 đòi xoá fallback circuit-breaker; tên method trong annotation phải để literal (LESSONS §8).
- [ ] Review code có sẵn thấy vi phạm → cảnh báo và đề xuất, không tự ý lờ đi.
- [ ] Trước khi kết luận "code chết" và xoá → chứng minh đủ (truy theo **port/interface** chứ không theo class impl; grep FE `-i`; tách "khai hằng" với "call site"; kiểm route k8s, `@KafkaListener`, seed SQL). Java bị `.gitignore` nên Grep tool mù — dùng `rg --no-ignore -g '*.java'` (LESSONS §3).
- [ ] Trước khi làm lại việc đã từng revert (`signalWithStart`, cột `usage_count`, throw `TENANT_MISMATCH` ở payment initiate) → đọc lý do lần trước hỏng (LESSONS §10).
- [ ] Không chạy `spotless:apply` toàn service; không `git add -A`; kiểm CRLF sau khi ghi file FE.

## 9. Checklist trước khi mở PR

- [ ] BE: `./mvnw test -pl domain,application` pass; `./mvnw test -pl adapter -Dtest='ArchitectureTest'` pass (không thêm vi phạm so với mốc).
- [ ] BE: chạy **riêng** lớp test của use case vừa sửa, so theo **danh tính** test fail chứ không theo tổng số (LESSONS §5).
- [ ] FE: `ng lint` pass, `ng test` pass (Karma cần `CHROME_BIN`), Prettier sạch.
- [ ] Checklist Sonar (mục 10.3) đạt; không `System.out`, `printStackTrace`, `console.log`, `debugger`.
- [ ] Không magic string/number; không import/biến/method thừa; public API có Javadoc/JSDoc.
- [ ] Guard đứng trước side-effect; không viết nhánh thứ hai làm mất guard (LESSONS §1, §2).
- [ ] Đụng `@Entity`/DDL → đã kiểm `ddl-auto` của service đó và thứ tự deploy (LESSONS §7.1, §11).
- [ ] `git status` trước khi stage; commit đúng Conventional Commits.

## 10. Phụ lục — tóm lược rule bắt buộc (giữ mã rule)

### 10.1 Java — RULES.md (PL03 + PL04)

| Nhóm | Mã — tóm tắt |
|---|---|
| General | **G1** pass SonarQube/SpotBugs · **G2** naming Oracle · **G3** Javadoc public · **G4** cấm magic string/number → constant/enum · **G5** xoá code chết/import thừa · **G6** tái dùng thư viện sẵn (`platform-libs`, `ins-common`, Commons, Guava) · **G7** comment đồng bộ code · **G8** SRP · **G9** DRY · **G10** RESTful + `ApiResponse.of(...)` · **G11** format google-java-format/spotless |
| Security | **S1** encode input chống XSS · **S2** chỉ JPA/JPQL/parameterized, cấm concat SQL · **S3** cấm hard-code secret · **S4** tính tiền/số dư/chiết khấu chỉ ở BE · **S5** CSRF hoặc JWT cho API đổi state · **S6** lọc path `/`, `\`, null + whitelist extension · **S7** mọi endpoint kiểm RBAC + tenant, mặc định deny · **S8** login fail message chung · **S9** cookie HttpOnly+Secure+SameSite · **S10** đổi session ID sau login · **S11** PII AES-256 at-rest, mask log · **S12** thẻ chỉ tokenization, không lưu PAN · **S13** TLS ≥ 1.2 |
| Object & equality | **J3** equals ↔ hashCode · **J4** equals kiểm null + getClass trước cast · **J11** Cloneable phải override clone · **J12** equals ↔ compareTo · **J36** so kiểu bằng `instanceof`, không `getSimpleName()` · **J39** literal bên trái `equals` |
| Null safety | **J8** null-check trước truy cập · **J10** null-check ở vế đầu `&&`/`\|\|` · **SC5** `Optional`/`requireNonNull` |
| Control flow | **J5** không `return` trong `finally` · **J16** block switch bắt đầu bằng `case` · **J27** bỏ nhánh không xảy ra · **J28** không bỏ giá trị trả về · **J29** dùng `&&`/`\|\|` short-circuit · **J30** case kết thúc `break/return/throw` · **J34** không điều kiện luôn true/false · **J37** hai vế nhị phân không giống nhau · **J38** bỏ dead store |
| Numeric | **J1** `longBitsToDouble` chỉ nhận `long` · **J20** không `==` với float/double · **J25** cẩn thận `Math.abs(MIN_VALUE)` · **INS-extra/AR10** tiền VND = `Long` |
| Collection | **J17** không truyền collection vào method của chính nó · **J40/SC3** đa luồng dùng `ConcurrentHashMap`/collection thread-safe |
| Resource & exception | **J9/ML1/ML2** đóng resource bằng try-with-resources · **J18** không throw từ Controller · **J32** không `printStackTrace` · **J33** log/forward cause · **SC2** catch đúng loại · **SC8** fail-fast |
| Concurrency | **J2** không `synchronized` trên `Lock` · **J6** không gán lại obj đang lock · **J7** không wait/notify trên Thread · **J22** static init synchronized/volatile · **J23** unlock trong `finally` cùng method · **J31** không gọi `run()` trực tiếp · **J35** không static `SimpleDateFormat`/`Calendar`, dùng `java.time` · **J43** hạn chế synchronized, dùng Atomic* · **P1** dùng ExecutorService |
| Static & encapsulation | **J15** public static phải final · **J21** không sửa static từ instance method · **J24** không public static mutable · **P3** xoá static không dùng · **SC1** field private (aggregate dùng accessor `order.status()`) |
| Logging | **ML6** không `System.out` · **SC3** log đủ ca lỗi/business event · **SC4** đúng log level · **INS-extra** không log PII raw |
| Cast / Misc | **SC7** kiểm `instanceof` trước cast · **J13/J14** biến điều kiện `for` nhất quán, không đổi trong thân · **J19** không `System.gc()` · **J26** không serialize class không `Serializable` |
| Third-party / Sonar | **TP1** lib mới qua Tech Lead + MR riêng · **TP2** license MIT/Apache/BSD · **SO1** sạch Sonar trước commit · **SO2** cấm suppress (ngoại lệ S4502) |
| Performance | **P2** `StringBuilder` khi concat trong loop · **P4/J41** connection pool (HikariCP, Lettuce, pooling HTTP) · **P5** đọc file lớn streaming · **J42** không `jedis.sync()` sau mỗi op |
| SQL | **SQ1** không function trên cột có index trong WHERE · **SQ2** `COUNT(CASE WHEN…)` thay N câu COUNT · **SQ3** mọi SELECT có LIMIT/Pageable (mặc định 20) · **SQ4** đánh giá index khi thêm cột/bảng · **SQ5** bảng giao dịch có partition key trong WHERE · migration qua Flyway `V{n}__{desc}.sql`, prod `ddl-auto=validate` · mọi bảng có `tenant_id` + audit columns · soft delete `deleted_at` |
| Kiến trúc | **AR1** dependency direction · **AR2** domain thuần Java · **AR3** UseCase không là bean · **AR4** Controller→Facade→Port→UseCase · **AR5** Facade chỉ map + delegate · **AR6** 1 transaction = 1 aggregate, collection `unmodifiableList` · **AR7** domain event quá khứ, immutable, emit từ root · **AR8** UUID v7 · **AR9** `tenant_id` + `TenantContext.get()` · **AR11** `+07:00` qua `DTime` · **AR12** Transactional Outbox, không dual-write Kafka · **AR13** wrap `ApiResponse.of` · **AR14** annotation Temporal chỉ ở adapter |

> ⚠️ RULES.md ghi migration "phải qua Flyway", nhưng checkout hiện tại không có thư mục `db/migration` hay dependency Flyway; DDL nằm ở `sql/<service>.sql` và `TSD/sql_scripts/`, commit `sql(...)`. Cần Tech Lead xác nhận nguồn migration chính thức.

### 10.2 Angular — RULES_ANGULAR.md (PL05)

| Nhóm | Mã — tóm tắt |
|---|---|
| General | **G1** pass ESLint/Prettier/Stylelint · **G2** đặt tên theo Style Guide · **G3** Component → Service → ApiClient/Store, không HTTP từ component · **G4/G5** không magic, hằng/enum ở `*.constants.ts`/`*.enums.ts` · **G6** xoá code chết · **G7** tái dùng RxJS/lodash-es/built-in · **G8** comment đồng bộ · **G9** cấm `var` · **G10** cấm `any` (`strict`) · **G11** JSDoc public/@Input/@Output · **G12** Prettier + ESLint · **G13** text qua `translate` pipe (`@ngx-translate/core`) · **G14** chỉ `===`/`!==`, kể cả check null |
| Module & component | **M1** `provideHttpClient()` 1 lần ở root · **M2** không khai component nhiều NgModule · **M3** lazy load feature (`loadChildren`/`loadComponent`) · **M4** dùng bộ component dùng chung của project · **M5** kiểm directive/pipe built-in trước khi tự viết |
| DOM & template | **D1** cấm thao tác DOM trực tiếp (`getElementById`, `innerHTML`…) → Renderer2/binding · **D2** không `[innerHTML]` với input chưa sanitize · **D3** không inline `<script>` · **D4** Reactive Forms cho form phức tạp |
| Security | **S1** encode query param (dùng `HttpParams`) · **S2** cấm JWT/PII/OTP/thẻ trong localStorage/sessionStorage · **S3** không inline script · **S4** CSP ở gateway · **S5** không hard-code secret, dùng `environment.*` + CI inject · **S6** password `autocomplete="new-password"`/`off` · **S7** route nhạy cảm có AuthGuard + role |
| Source code | **SC1** field private khi không cần expose · **SC2** cấm `console.*` ở production · **SC3** = M5 · **SC4** `interface` cho data model · **SC5** `readonly` · **SC6** logic nặng tách sang Service/Pipe · **SC7** OnPush khi @Input immutable |
| Performance | **P1** `trackBy` cho list lớn · **P2** OnPush · **P3** lazy load · **P4** `async` pipe thay subscribe tay · **P5** `@defer` cho component nặng · **P6** `loading="lazy"` cho ảnh · **P7** kiểm bundle size định kỳ |
| RxJS & memory | **R1** unsubscribe ở `ngOnDestroy`/`takeUntilDestroyed()` · **R2** ưu tiên `async` pipe · **R3** `shareReplay({bufferSize:1, refCount:true})` · **R4** không nest subscribe, dùng `switchMap`/… · **R5** gỡ event listener · **R6** clear interval/timeout |
| NgRx | **ST1** action qua `createAction`/class · **ST2** chỉ đưa vào store thứ share/persist/effect · **ST3** reducer pure · **ST4** side effect ở effects · **ST5** truy vấn qua selector · **ST6** collection lớn dùng `@ngrx/entity` · **ST7** state có interface |
| Third-party | **TP1** Tech Lead approve · **TP2** license · **TP3** `npm audit` định kỳ · **TP4** commit `package-lock.json` |
| Dự án (LESSONS §9) | Date picker **lưu ISO**, chỉ hiển thị `dd/MM/yyyy` — trộn hai dạng đã gửi sai ngày sinh cho NCC |

### 10.3 Sonar — SonarClean.md

| Rule | Tóm tắt cách viết đúng |
|---|---|
| **S1192** (CRITICAL) | Literal lặp ≥ 3 lần/file → `static final`; **và** hằng đã có thì dùng ở MỌI chỗ (biến thể "already-defined constant" bị ngay từ 1 lần lặp, kể cả trong annotation và `Map.of`) — không tạo hằng thứ hai cùng giá trị |
| **S2139** (MAJOR) | Không vừa log vừa rethrow trong catch |
| **S107** | Method/ctor > 7 tham số → `record` param-object (canonical ctor được miễn) |
| **S2160** | Subclass thêm field → override `equals/hashCode` theo id |
| **S5738 / S1874** | Không gọi API deprecated (Spring Security 6 lambda DSL) |
| unchecked / rawtypes | Không `(Class) X.class`, không raw generic |
| **S1168** | Không `return null` cho collection/array |
| **S2065** | Bỏ `transient` thừa |
| **S2629** | Log dùng `{}`, không concat/method-call trong đối số |
| Dọn rác | **S1481** biến local thừa · **S1854** dead store · **S1144/S1068** private method/field thừa · **S1128** import thừa · **S125** code comment-out · **S1135** TODO không ticket · **S1186** method rỗng không lý do · **S1172** tham số thừa (trừ fallback `@CircuitBreaker` phải khớp signature) |
| Logging / exception | **S106** không `System.out` · **S112** không exception chung · **S1166** không nuốt exception |
| Cấu trúc | **S1118** utility class có private ctor · **S3776** cognitive complexity cao → tách method · **S1066** gộp if lồng · **S1126** `return condition;` · **S2589/S2583** điều kiện/nhánh thừa |
| Idiom | **S1612** method reference · **S1602** lambda bỏ `{}` · **S2864** `entrySet()` · **S2095** try-with-resources · **S1149** không `Vector`/`Hashtable`/`StringBuffer` |
| Naming | **S00100/S00101/S00116/S00117** camelCase / PascalCase / UPPER_SNAKE / lowercase package |

Verify nhanh (mỗi file):

```bash
grep -nE '@SuppressWarnings\("(java:S|unchecked|rawtypes)|// *NOSONAR' <file>     # rỗng
grep -nE 'log\.(trace|debug|info|warn|error)\([^)]*( \+ |\.[a-zA-Z]+\()' <file>   # rỗng (S2629)
```

## Nguồn tham chiếu

- `RULES.md` v1.0 (2026-04-29) — PL03 (43 Java rule) + PL04 checklist review Java backend + Architecture rules
- `RULES_ANGULAR.md` v1.0 (2026-04-29) — PL05 checklist review Angular + Angular Style Guide
- `SonarClean.md`; `Architecture.md` v1.0; INS Naming Standards v1.4.1 (REVIEW)
- `LESSONS.md` §1–§11 (lỗi đã thực sự xảy ra)
- Cấu hình thật: `eslint.config.js`, `package.json` (scripts, lint-staged), `.husky/pre-commit`, `tsconfig.json` của 2 app FE; `pom.xml` (spotless) của service BE
- Angular Style Guide: https://angular.dev/style-guide · google-java-format: https://github.com/google/google-java-format · Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/

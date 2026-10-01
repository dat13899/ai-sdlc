---
title: AGENTS.md — Chỉ dẫn liên công cụ, INS Platform
for: B2 — ví dụ điền thật
owner: Tech Lead (A/R)
nguồn: workspace CLAUDE.md, LESSONS.md §6, ins-infrastructure/{CLAUDE.md, Architecture.md, README.md}, package.json 2 app FE, git log
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/AGENTS.md

# AGENTS.md

> Ở dự án này, vai trò AGENTS.md do **`CLAUDE.md` ở gốc workspace** đảm nhận (dùng cho Claude Code); `BE/ins-infrastructure/CLAUDE.md` là file cấp dưới cho backend. Chưa có file cho tool khác (Cursor/Copilot…).

## 1. Mục đích

Một file cho mọi AI coding tool biết: workspace gồm những repo nào, build/test ra sao, và những việc **đã từng gây hỏng thật** (dẫn `LESSONS.md`) mà agent không được lặp lại.

## 2. Phạm vi áp dụng

Gốc workspace **không phải git repo** — là thư mục chứa nhiều repo độc lập:

| Phạm vi | File | Ghi chú |
|---|---|---|
| Toàn workspace | `CLAUDE.md` ở gốc | Chỉ ghi điều đúng cho cả workspace |
| Backend | `BE/ins-infrastructure/CLAUDE.md` | Đọc **trước** khi sửa Java; trỏ tới `Architecture.md`, `RULES.md`, `RULES_ANGULAR.md`, `SonarClean.md` |
| Bài học sự cố | `LESSONS.md` ở gốc | Đọc trước thay đổi không tầm thường |
| FE | `FE/ins-cms-fe/README.md`, `FE/ins-miniapp-fe/README.md` | Không có file chỉ dẫn AI riêng |
| Riêng tool | > TODO: dự án chưa có — cần Tech Lead bổ sung nếu dùng tool ngoài Claude Code | |

Cấu trúc repo:

```text
BE/ins-infrastructure/   14 service Java/Spring Boot + ins-common + tài liệu chung (mỗi thư mục ins-* là 1 git repo con)
FE/ins-cms-fe/           Angular CMS quản trị
FE/ins-miniapp-fe/       Angular miniapp khách hàng
server-fake/             Proxy Node.js CORS/TLS-bypass tới staging Ví X — chỉ dùng dev local, không có .git
LESSONS.md               Sự cố/cạm bẫy thật của codebase
```

## 3. Khai báo lệnh build / test (phần quan trọng nhất)

### Backend — chạy **trong từng** `ins-{service}/` (không có aggregator pom ở gốc)

| Việc | Lệnh | Ghi chú |
|---|---|---|
| Build 1 service | `./mvnw clean install -DskipTests` | Mỗi service có `mvnw` và `libs/` (vendored `platform-libs`) riêng |
| Unit test domain | `./mvnw test -pl domain` | JUnit thuần, không Docker |
| Unit test use case | `./mvnw test -pl application` | Mock port, không Docker |
| ArchUnit | `./mvnw test -pl adapter -Dtest='ArchitectureTest'` | Không Docker; mốc hiện tại 3 vi phạm `controller_should_go_through_facade` |
| Integration test | `./mvnw test -pl adapter -Dtest='*IntegrationTest'` | Testcontainers (MariaDB/Kafka/Redis) — cần Docker |
| Test 1 class | `./mvnw test -pl <module> -Dtest='ClassName'` | |
| Test 1 method | `./mvnw test -pl <module> -Dtest='ClassName#methodName'` | |
| Đếm test toàn service | `./mvnw clean test -Dmaven.test.failure.ignore=true` | Không có cờ này thì dừng ở module đỏ đầu tiên, bỏ qua `adapter` (LESSONS §5.1) |
| Chạy local | `./mvnw spring-boot:run -pl adapter` | |
| Hạ tầng local 1 service | `docker compose up -d` trong `ins-{service}/docker/` | Không có stack `docker/` chung ở gốc |

### Frontend — chạy trong thư mục app

| Việc | Lệnh | Ghi chú |
|---|---|---|
| Cài phụ thuộc | `npm install` | Theo README; > TODO: chưa có quy ước `npm ci` cho CI |
| Dev | `npm start` | cms-fe cổng 4200 (`/admin/login`), miniapp-fe cổng 4201 (`/home`) |
| Dev theo môi trường | `npm run start:staging` · `npm run start:uat` | Chỉ miniapp-fe |
| Build | `npm run build:prod` | Có `--base-href` + `gulp build-assets`; miniapp-fe thêm `build:staging`, `build:uat` |
| Test | `npm test` | Karma — headless cần `CHROME_BIN` |
| Lint | `npm run lint` · `npm run lint:fix` | ESLint 9, bắt buộc `===`/`!==` (`eqeqeq`) |
| Format | `npm run format` · `npm run format:check` | Prettier 3 |
| Pre-commit | Husky + lint-staged tự chạy | `*.{ts,html}`: eslint --fix + prettier; `*.scss`, `*.json`: prettier |

### server-fake

Proxy dev local một file (`server.js`, Node ≥18, không cần `npm install`), chuyển mọi path tới `TARGET_ORIGIN`. Agent không cần build/test nó; chỉ cần biết khi debug qua proxy: header `Origin`/`Referer` bị bỏ, lỗi upstream luôn thành `502`.

| Hạng mục | Nội dung |
|---|---|
| Ngôn ngữ / phiên bản | Java 21 LTS, Spring Boot 3.5.x; Angular 20.3, TypeScript 5.9 (strict), RxJS 7.8; Node ≥18 cho server-fake. Node cho FE: > TODO: chưa ghi trong nguồn |
| Trình quản lý gói | Maven Wrapper (`./mvnw`) theo từng service; npm cho FE |
| Biến môi trường cần thiết (tên, không giá trị) | `INS_{SERVICE}_DB_*`, `INS_REDIS_*`, `INS_VALKEY_*` (7 service dùng Redisson đọc tên này), `INS_PII_ENCRYPTION_KEY` (identity), `INS_ERROR_EXPOSE_DETAIL` (purchase, mặc định false), `CHROME_BIN` (Karma); server-fake: `TARGET_ORIGIN`, `PORT`, `HOST`, `ALLOWED_ORIGINS` |
| Dữ liệu test | Testcontainers cho integration test; seed MariaDB/Mongo ở `TSD/sql_scripts/seed-*.sql` (và `.js`). Không dùng dữ liệu Production |

## 4. Quy tắc cho AI agent

### Được làm tự động

- Đọc mọi file trong 3 repo thật (`ins-infrastructure` kèm 15 repo con, `ins-cms-fe`, `ins-miniapp-fe`) và `LESSONS.md`
- Chạy build / test / ArchUnit / lint / format:check ở máy local
- Sửa file trong phạm vi nhiệm vụ, theo `RULES.md`, `RULES_ANGULAR.md`, `SonarClean.md`
- `git pull` nhánh `develop` trên **mọi** repo trước khi làm (kể cả 15 repo con)
- `git status`, `git diff`, `git log` (chỉ đọc)

### Phải hỏi trước

- **Commit / push** — chỉ khi người dùng bảo rõ; mặc định dừng ở working tree
- Merge `develop → release` (phải báo commit của người khác bị kéo theo)
- Thêm thư viện third-party (RULES TP1: Tech Lead duyệt, sửa `pom.xml` qua MR riêng)
- Sửa `@Entity`/DDL, viết script `TSD/sql_scripts/*.sql` — chỉ tạo file, không tự chạy
- Xoá code bị nghi "chết" (phải chứng minh theo LESSONS §3 trước)
- Sửa `k8s/services/deployment-template.yaml` + chạy `generate-manifests.sh`; `kubectl apply -k k8s/` lên k8s local
- Làm lại việc nằm trong bảng "đã revert" (LESSONS §10)

### Cấm

- `git add -A` / `git add .` — worktree dùng chung (LESSONS §6.2); vì cùng lý do, **không** dùng `commit-all-services.sh` (script này `add -A` mọi repo)
- `./mvnw spotless:apply` không giới hạn phạm vi (LESSONS §6.3 — từng reflow 120 file)
- `@SuppressWarnings("java:S…")`, `"unchecked"`, `// NOSONAR` (trừ S4502 đã duyệt)
- Sửa `ins-bit/` (clone cũ nhánh staging) hoặc `ins-client/` (stale, untracked)
- Sửa file generated `k8s/services/generated/*.yaml` bằng tay
- Chạy `redeploy-all.sh`, `redeploy-miniapp.sh`, `reset-all.sh` (git reset --hard + clean), `switch-infra-config.sh`, `scripts/kafka-delete-unused-topics.sh`
- Đọc/in `k8s/base/secrets.yaml` hay giá trị biến môi trường secret
- Bịa số test — số đúng chỉ lấy từ dòng `Tests run:` trong `[INFO] Results:` của từng module

## 5. Ranh giới (không được vượt)

| Ranh giới | Nội dung |
|---|---|
| Phạm vi thay đổi | Chỉ stage file của mình, từng file một; `git diff --cached --name-only` không được chứa file người khác |
| Kích thước PR | > TODO: dự án chưa có — cần Tech Lead bổ sung |
| Thư mục cấm chạm | `ins-bit/`, `ins-client/`, `k8s/services/generated/`, `k8s/base/secrets.yaml`, `libs/` (vendored — chỉ đổi đồng bộ mọi service khi nâng version) |
| File do người khác tạo | Không sửa ngoài nhiệm vụ; đặc biệt file đang dirty của người khác trong worktree |
| Comment/lint | Không suppress Sonar/ESLint; không viết comment trông giống code (Sonar S125) |
| Sonar | Chỉ sửa đúng issue được giao, không tự quét thêm (LESSONS §8) |

## 6. Định dạng commit & PR

**Commit** — Conventional Commits, mô tả tiếng Việt (có dấu hoặc không dấu đều đang dùng), scope là tên service rút gọn hoặc loại tài liệu. Ví dụ theo `git log` thật:

```text
fix(purchase): thanh toan lai 0d trong ngay - don khong ket PAYMENT_FAILED
feat(orders,policies): hien Nguon tien + loc "Nguon" tim tuong doi
refactor(purchase): ha do phuc tap buildRegistrationAttributes (Sonar S3776)
docs(tsd-identity): B.6 — sửa §7.1 register DTO cho khớp InitRegisterRequest
chore(sql): seed reference list ORDER_EDIT_TARGET_STATUS cho popup Sua don CMS
chore(k8s): khai INS_ERROR_EXPOSE_DETAIL cho purchase-service (mac dinh false)
```

- Type đang dùng: `feat`, `fix`, `refactor`, `docs`, `chore`; scope gặp: `purchase`, `cms`, `orders`, `product`, `tnds-xe-may`, `tsd-<service>`, `sql`, `seed`, `k8s`, `kafka`.
- Nhánh tách khỏi nghiệp vụ đã có → ghi danh sách guard đã đối chiếu vào thân commit (LESSONS §2).
- Dòng "AI-assisted / Người kiểm": > TODO: dự án chưa có quy ước.
- Repo `ins-cms-fe`: hook lint-staged cần git ≥2.45; git 2.33 trong shell báo lỗi "Needed a single revision".

**Pull Request / MR:** > TODO: dự án chưa có template MR — cần Tech Lead bổ sung (đề xuất theo template: làm gì, test đã chạy + kết quả thật, chỗ AI chưa chắc).

## 7. Ví dụ mẫu hoàn chỉnh (AGENTS.md thật của dự án, rút gọn)

```markdown
# CLAUDE.md (gốc workspace INS Platform)

## Workspace
Gốc KHÔNG phải git repo. Gồm BE/ins-infrastructure (14 service + ins-common,
mỗi thư mục là repo con), FE/ins-cms-fe, FE/ins-miniapp-fe, server-fake (proxy dev),
LESSONS.md. Backend: đọc BE/ins-infrastructure/CLAUDE.md trước.

## Trước thay đổi không tầm thường
Đọc LESSONS.md. §0 là checklist trước commit; §4 là các lỗi "200 nhưng sai dữ liệu".

## Lệnh backend (trong ins-{service}/)
| Việc | Lệnh |
|---|---|
| Build | ./mvnw clean install -DskipTests |
| Unit | ./mvnw test -pl domain · ./mvnw test -pl application |
| ArchUnit | ./mvnw test -pl adapter -Dtest='ArchitectureTest' |
| Integration | ./mvnw test -pl adapter -Dtest='*IntegrationTest' (cần Docker) |
| Run | ./mvnw spring-boot:run -pl adapter |
Không có root aggregator pom, không có docker/ chung — README gốc ghi có là stale.

## Lệnh FE (trong app)
npm start (4200 / 4201) · npm run build:prod · npm test (cần CHROME_BIN)
· npm run lint · npm run format:check

## Quy tắc kiến trúc
- adapter → application → domain; domain không import Spring/JPA/Hibernate/Temporal
- Controller → Facade → Port → UseCase → Repository
- UseCase không là Spring bean (wire @Bean trong UseCaseConfig)
- 1 transaction = 1 aggregate; domain event thì quá khứ, bất biến
- UUID v7 · VND = Long · +07:00 qua DTime · tenant_id + TenantContext.get()
- Kafka qua outbox, không dual-write
- ddl-auto validate/none ngoài local; gỡ code → deploy → rồi mới DROP

## FE
=== / !== bắt buộc; không any; Component → Service → ApiClient/Store;
mọi text qua @ngx-translate/core; date picker lưu ISO, hiển thị dd/MM/yyyy.
App thật: ins-miniapp-fe, ins-cms-fe. ins-client là stale — không sửa.

## Cấm
- git add -A · spotless:apply toàn cục · @SuppressWarnings/NOSONAR
- commit/push khi chưa được bảo
- sửa ins-bit/, ins-client/, k8s/services/generated/
```

## 8. Checklist dựng AGENTS.md

- [x] File nằm ở thư mục gốc (gốc workspace)
- [x] Lệnh trong bảng lấy từ `package.json` / `Architecture.md §2.7` thật — ⚠️ lệnh aggregator trong `README.md` gốc **không** chạy được (không có `pom.xml` ở gốc), đã loại
- [x] Có ghi phiên bản runtime (trừ Node cho FE — TODO)
- [x] Có danh sách biến môi trường (tên, không giá trị)
- [x] Có phân biệt tự động / phải hỏi / cấm
- [x] Có liệt kê thư mục cấm chạm
- [ ] Có quy định PR — TODO
- [x] Không chứa secret
- [ ] Thư mục con có AGENTS.md riêng chỉ ghi khác biệt — backend có, FE chưa có
- [ ] Commit trước commit tính năng đầu tiên — không áp dụng (file ra đời sau)

## Nguồn tham chiếu

- `CLAUDE.md` gốc workspace; `BE/ins-infrastructure/CLAUDE.md`, `Architecture.md §2.7`, `README.md`
- `LESSONS.md` §5.1, §6, §8, §10
- `FE/ins-cms-fe/package.json`, `FE/ins-miniapp-fe/package.json` (scripts), README 2 app
- `git log --oneline` của `ins-infrastructure`, `ins-purchase-service`, 2 app FE
- AGENTS.md — https://agents.md/ · Conventional Commits — https://www.conventionalcommits.org/

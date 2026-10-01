> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/quy-chuan/standards-index.md

# Chỉ mục chuẩn đang áp dụng — INS Platform

**Dùng cho:** toàn quy trình — tra "việc này theo chuẩn nào" · **Owner:** Tech Lead (A/R) · PM (C)

> Bảng dưới chỉ liệt kê **tên chuẩn** và nơi áp dụng; nội dung chi tiết nằm trong file gốc của dự án (PDF/MD nội bộ), không chép lại ở đây. Các chuẩn trong template gốc mà dự án **không** có bằng chứng đang dùng (Spec Kit, BABOK, BPMN, ISO 29119, DORA…) được bỏ khỏi bảng — xem mục 3.

## 1. Bảng chuẩn theo bước

### 1.1 Chuẩn nội bộ (bộ quy chuẩn của đơn vị chủ quản + của dự án)

| Chuẩn | Tổ chức ban hành | Áp ở bước | Dùng để làm gì | Bắt buộc? | Vị trí |
|---|---|---|---|---|---|
| BM01 — Template SRS cho 1 chức năng | Nội bộ | B3, B4 | Khung viết SRS mỗi chức năng | ✅ Bắt buộc | `documents/BM01_Tai lieu SRS_Template cho 1 chức năng.pdf` |
| Bộ 8 template TSD (template-01 … template-08) | Nội bộ (Architect dự án) | B6 | Khung thiết kế chi tiết per service: 01 Architecture · 02 Security · 03 Domain · 04 Event-Driven · 05 Application · 06 Data & API · 07 Testing · 08 Coding Standards | ✅ Bắt buộc | `documents/template-0N-*.pdf`; tóm tắt: `documents/TSD_TEMPLATES_SUMMARY.md` |
| Quy chuẩn thiết kế CSDL | Nội bộ | B6, B8 | Convention DDL MariaDB: `BINARY(16)` PK UUID v7, `DATETIME(3)`, `tenant_id`, `deleted_time`, utf8mb4, snake_case, `COMMENT` mọi cột | ✅ Bắt buộc | `documents/Quy_chuan_thiet_ke_CSDL.pdf` |
| INS Naming Standards v1.0 | Nội bộ | B6, B8 | Đặt tên package / class / method / Kafka topic / schema | ✅ Bắt buộc | `INS-Naming-Standards-v1.0.pdf` |
| PL03 — Hướng dẫn lập trình tránh lỗi tiềm ẩn | Đơn vị chủ quản (bộ phụ lục PL) | B8, B10 | 43 quy tắc Java tránh lỗi tiềm ẩn | ✅ Bắt buộc | `documents/PL03_ Huong dan lap trinh tranh loi tiem an.pdf` → tóm tắt vào `RULES.md §A–D` |
| PL04 — Checklist Java backend review code | Đơn vị chủ quản (bộ phụ lục PL) | B10 | Checklist review: General / Security / Source code / Memory leak / Performance / SQL | ✅ Bắt buộc | `documents/PL04_Checklist_Java backend review code.pdf` → `RULES.md` |
| PL05 — Checklist Code Review for Angular | Đơn vị chủ quản (bộ phụ lục PL) | B8, B10 | Checklist review Angular/TypeScript | ✅ Bắt buộc | `documents/PL05_Checklist_Code Review for Angular.pdf` → `RULES_ANGULAR.md` |
| Sonar Quality Gate `INS-Gate` + profile `sonar-X` (PL02, 403 rule) | Đơn vị chủ quản | B8, B10 | New code (chặn MR): Bugs Blocker+Critical = 0, Vulnerabilities = 0, Hotspots reviewed 100%, Coverage ≥ 80%, Duplicated < 3%, Rating ≥ A | ✅ Bắt buộc | template-08 §SonarQube Quality Gate |
| SonarClean — chính sách "không suppress" | Dự án | B8, B10 | CẤM `@SuppressWarnings("java:S…")`/`"unchecked"`/`// NOSONAR`; 9 rule hay vấp (S1192, S2139, S107, S2160, S5738/S1874, unchecked, S1168, S2065, S2629) + rule bổ sung | ✅ Bắt buộc | `SonarClean.md` |
| Architecture.md — kiến trúc & quy tắc coding | Dự án (Tech Lead) | B6, B8 | Tech stack khoá, 15 service, dependency rule, request flow Controller → Facade → Port → UseCase → Repository | ✅ Bắt buộc | `Architecture.md` |
| RULES.md (Java) / RULES_ANGULAR.md (client) | Dự án (Tech Lead) | B8, B10 | Hợp nhất PL03 + PL04 + luật kiến trúc (Java); PL05 + Angular Style Guide (client). Vi phạm = lý do REJECT review | ✅ Bắt buộc | `RULES.md`, `RULES_ANGULAR.md` |
| ArchUnit `ArchitectureTest` | Dự án | B8, B9, B10 | Chặn build khi vi phạm: domain chỉ phụ thuộc domain; domain không import Spring/JPA/Hibernate/Temporal; UseCase không `@Service/@Component/@Repository`; inbound không import outbound | ✅ Bắt buộc | `adapter/src/test/.../ArchitectureTest.java` mỗi service |
| Coverage gate JaCoCo | Đơn vị chủ quản | B9 | LINE ≥ 80%, BRANCH ≥ 80%; domain module ≥ 90% line. CẤM 70/60 | ✅ Bắt buộc | template-07, prompt TSD §1.4j |
| OWASP Dependency-Check | Dự án | B10, B13 | `dependency-check-maven` với `failBuildOnCVSS=7` | ✅ Bắt buộc | prompt TSD §1.4t |
| Git flow + PR rules | Dự án (template-08) | B8, B10 | Nhánh `main`/`develop`/`feature/*`/`bugfix/*`/`hotfix/*`/`release/*`; PR ≥ 2 reviewer (1 peer + 1 Tech Lead); CI xanh; cấm force push nhánh protected | ✅ Bắt buộc | template-08 §Git flow |
| Tiêu chí dùng Temporal | Dự án | B6 | Nghiệp vụ MUST dùng Temporal khi thoả ≥ 1 trong 8 tiêu chí (multi-step > 2 service, external call có thể timeout, có bước async, long-running > 1 phút, cron, cần compensation…) | ✅ Bắt buộc | `documents/temporal-workflows.md §1.1` |
| LESSONS.md — checklist §0 sau khi code | Dự án | B8, B14 | 6 mục: guard trước side-effect; không viết nhánh thứ hai; chạy riêng test use case vừa sửa; `git status` trước khi stage; đụng `@Entity` kiểm `ddl-auto`; chứng minh code chết | ✅ Bắt buộc (theo CLAUDE.md workspace) | `LESSONS.md` |
| Thứ tự triển khai | Dự án | B13 | Thêm enum đọc từ DB: BE trước, dữ liệu sau · Xoá bảng: gỡ `@Entity` → deploy → DROP · Thêm cột: schema trước, code sau · Thêm realm role: tạo + gán trước khi deploy code | ✅ Bắt buộc | `LESSONS.md §11` |

### 1.2 Chuẩn bên ngoài đang được tham chiếu

| Chuẩn | Tổ chức ban hành | Áp ở bước | Dùng để làm gì | Bắt buộc? | Link chính thống |
|---|---|---|---|---|---|
| Conventional Commits 1.0.0 | Conventional Commits | B8, B13 | `<type>(<scope>): <mô tả>`, type ∈ {feat, fix, refactor, docs, test, chore, perf, revert}; footer có mã ticket | ✅ Bắt buộc | https://www.conventionalcommits.org/en/v1.0.0/ |
| OpenAPI Specification 3.x | OpenAPI Initiative | B6 | Fragment đặc tả API per endpoint trong TSD file 06 | ✅ Bắt buộc | https://spec.openapis.org/ |
| RFC 7807 (Problem Details) | IETF | B6, B8 | Định dạng lỗi 4xx/5xx; cấm `{code, message}` phẳng | ✅ Bắt buộc | https://www.rfc-editor.org/rfc/rfc7807 |
| RFC 2119 (MUST/SHOULD/MAY) | IETF | B6 | Từ khoá mức bắt buộc trong TSD, in hoa + bold | ✅ Bắt buộc | https://www.rfc-editor.org/rfc/rfc2119 |
| MADR (Markdown ADR) | MADR project | B6 | Khuôn ADR `ADR-<SERVICE>-NN-<slug>` | ✅ Bắt buộc | https://adr.github.io/madr/ |
| OWASP Top 10 | OWASP | B6, B10 | Mỗi risk có mitigation + verify trong TSD file 02 | ✅ Bắt buộc | https://owasp.org/www-project-top-ten/ |
| OpenID FAPI 2.0 | OpenID Foundation | B6 | Auth Code + PKCE, RS256, JWKS rotation, mTLS M2M; dùng grant khác phải có ADR exception | ✅ Bắt buộc | https://openid.net/wg/fapi/ |
| PCI-DSS | PCI Security Standards Council | B6, B8 | Thẻ thanh toán chỉ tokenization, không lưu PAN | ✅ Bắt buộc | https://www.pcisecuritystandards.org/ |
| Nghị định 13/2023/NĐ-CP (bảo vệ dữ liệu cá nhân) | Chính phủ Việt Nam | B2, B6 | Phân loại PII, data residency, right-to-be-forgotten, consent | ✅ Bắt buộc | TODO: cần Security Lead bổ sung link văn bản chính thức |
| Angular Style Guide | Angular team (Google) | B8, B10 | Nguồn phụ của `RULES_ANGULAR.md` | ✅ Bắt buộc | https://angular.io/guide/styleguide |
| Oracle Code Conventions (Java) | Oracle | B8 | Naming class/method/field/constant (RULES.md G2) | ✅ Bắt buộc | https://www.oracle.com/java/technologies/javase/codeconventions-contents.html |
| Gherkin (Given–When–Then) | Cucumber | B11 | AC viết inline trong TSD file 07, Test ID `TC-<module>-<seq>` cho journey P0 (không cần file `.feature`) | ✅ Bắt buộc | https://cucumber.io/docs/gherkin/ |
| C4 model | Simon Brown | B6 | C4 Context/Container ở tài liệu kiến trúc tổng; TSD per service không vẽ lại | 🔶 Tham chiếu | https://c4model.com/ |

**Chú thích:** ✅ = bắt buộc áp dụng · 🔶 = tham chiếu khi cần.

## 2. Công cụ AI đang dùng trong dự án

| Công cụ | Dùng ở bước | Vai trò |
|---|---|---|
| Claude Code | B6, B8, B10 | Agentic coding có ngữ cảnh repo; đọc `CLAUDE.md` (root workspace + repo backend) làm chỉ dẫn bắt buộc; sinh TSD theo `PROMPT_GENERATE_TSD.md` |
| Skill `/seqdiag` (Claude) | B3, B6 | Sinh sequence diagram SVG từ source code hoặc tài liệu SRS (`documents/seqdiag_guide.md`) |
| Bộ nhớ phiên AI (memory) | B14 | Tích luỹ bài học qua nhiều phiên; 141 memory đã được rút gọn thành `LESSONS.md` (rà ngày 2026-08-28) |

> TODO: dự án chưa có danh sách công cụ AI đã qua đánh giá bảo mật dữ liệu (ZDR, vùng lưu trữ) — cần Tech Lead + ATTT bổ sung vào `ai-tool-scope.md`.

## 3. Ghi chú khi dùng chuẩn

- **Tài liệu gốc có chỗ đã cũ.** `README.md` của repo backend nhắc root aggregator pom và thư mục `docker/` dùng chung — hai thứ này không còn trong checkout. Coi README là stale ở điểm này; mỗi service có `docker-compose.yml` và `mvnw` riêng.
- **Quy chuẩn path REST đang lệch nhau.** `Architecture.md`/`RULES.md G10` ghi `/api/v1/{resource}`; path thật đang chạy có dạng `/ins/<service>/public/v1/...`; tài liệu tham chiếu ghi nhận khoảng 600 chỗ `/api/v1/` trong OpenAPI của TSD bị drift. TODO: cần Tech Lead chốt một quy chuẩn duy nhất.
- **Chuẩn Flyway vs thực tế.** `Architecture.md` bắt migration qua Flyway và `ddl-auto` chỉ được `validate`/`none` ngoài local; kế hoạch triển khai lại ghi DB hiện "execute SQL trực tiếp (không Flyway)" và `ddl-auto` khác nhau theo service. Trước khi đụng `@Entity`/DDL phải kiểm cấu hình của đúng service đó.
- **Chuẩn trong template gốc chưa có bằng chứng áp dụng:** Spec Kit, AGENTS.md, PMBOK, BABOK, BPMN 2.0, INVEST, ISO/IEC/IEEE 29148 & 29119, ISTQB, Structurizr, SemVer, Keep a Changelog, OWASP ASVS, OWASP LLM Top 10, NIST AI RMF, ISO/IEC 42001, ISO/IEC 27001, Google SRE, DORA, 12-Factor, Scrum Guide, STRIDE, CWE Top 25. TODO: cần Tech Lead xác nhận có áp dụng hay không.
- **Tài liệu chuẩn khác có trong kho nhưng chưa phân loại:** `01-architecture.pdf`, `03-coding-standards.pdf`, `04-security.pdf`, `05-testing.pdf`, `keycloak-integration-guide-vi.pdf`. TODO: cần Tech Lead xác định quan hệ với bộ template-0N.

## Nguồn tham chiếu

- `Architecture.md`, `CLAUDE.md`, `RULES.md`, `RULES_ANGULAR.md`, `SonarClean.md`, `LESSONS.md` — tài liệu nội bộ
- `documents/TSD_TEMPLATES_SUMMARY.md`, `documents/PROMPT_GENERATE_TSD.md`, `documents/temporal-workflows.md`
- Danh mục PDF trong `documents/` (PL03, PL04, PL05, Quy_chuan_thiet_ke_CSDL, template-01…08, BM01, INS Naming Standards)
- Link chuẩn bên ngoài lấy từ trang chính thống của từng tổ chức

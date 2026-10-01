---
title: docs-index.md — Bản đồ tài liệu INS Platform
for: B2 — ví dụ điền thật
owner: Tech Lead (A/R) · PM (C)
nguồn: cây thư mục thật của workspace + CLAUDE.md, LESSONS.md §3, §6.1, §7.2, §9
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/docs-index.md

# docs-index.md — Bản đồ tài liệu dự án

> Dự án có **hàng trăm** tài liệu (12 bộ TSD × 9 file, 109 ADR, SRS .docx, spec API NCC, báo cáo test…) và **nhiều chỗ đã lệch code**. Bảng dưới ghi rõ file nào là nguồn sự thật và file nào **đã biết là không đáng tin**.
>
> **Quy tắc của dự án:** code + DB thật thắng mọi tài liệu. `RULES.md §C13` đã áp dụng "một nguồn": Sonar chỉ ghi ở `SonarClean.md`, không chép sang.

## 1. Bảng nguồn sự thật (source of truth)

| Thông tin | File là nguồn sự thật | Ai sở hữu | Khi nào cập nhật |
|---|---|---|---|
| Bố cục workspace, lệnh build/test | `CLAUDE.md` (gốc workspace) | Tech Lead | Khi thêm/bớt repo, đổi lệnh |
| Kiến trúc, stack, danh sách service/port, luật tầng | `BE/ins-infrastructure/Architecture.md` | Tech Lead / Architect | Khi đổi base project hoặc tài liệu kiến trúc |
| Luật Java bắt buộc | `BE/ins-infrastructure/RULES.md` (PL03 + PL04 + mục E) | Tech Lead | Khi có bản mới của PL03/PL04 |
| Luật Angular bắt buộc | `BE/ins-infrastructure/RULES_ANGULAR.md` (PL05) | Tech Lead | Khi có bản mới của PL05 |
| Luật Sonar | `BE/ins-infrastructure/SonarClean.md` | Tech Lead | Khi gặp rule Sonar mới hay vấp |
| Sự cố thật & cạm bẫy | `LESSONS.md` (gốc workspace) | Tech Lead | Sau mỗi sự cố; lần rà gần nhất 2026-08-28 |
| **Schema DB** | **DB thật** + JPA entity (`JpaXxx`) ở service chạy `ddl-auto=validate` | DBA / Tech Lead | Mỗi thay đổi schema |
| Thiết kế từng service | `TSD/ins-{service}/00_overview.md … 08_coding-standards.md` | Team service | Đang "neo baseline" theo nhánh release (xem git log `docs(tsd-*)`) |
| Quyết định kiến trúc | `TSD/docs/design/decisions/ADR-*.md` (có `status`, `supersedes`, `superseded_by`) | Tech Lead + deciders ghi trong ADR | Bất biến khi `Accepted` — tạo ADR mới |
| Catalogue sự kiện | `TSD/docs/design/events/catalogue.md` | Tech Lead | Khi thêm event |
| Saga / workflow Temporal | `documents/temporal-workflows/WF-*.md` | Team purchase/policy | Khi đổi workflow |
| Vận hành service | `TSD/docs/runbooks/*.md` (7 service) | Team service | Khi có sự cố mới |
| Hợp đồng API | > TODO: dự án chưa có file OpenAPI được chỉ định là nguồn — cần Tech Lead bổ sung (hiện nằm trong `TSD/*/06_data-and-api-design.md` + bộ `postman/`) | | |
| Spec API từng NCC | `documents/*-API*.md`, `documents/Carrier-API-Request-Response-Specs.md` | Team insurer-adaptor | Khi NCC đổi API |
| Yêu cầu nghiệp vụ | SRS `.docx` đã duyệt (tên `Approved_SRS_*.docx`, `APPROVED_srs_*.docx`) ở gốc `ins-infrastructure` | BA | Qua bản SRS mới (có `TSD/_srs_v2_diff/`) |
| Triển khai k8s | `k8s/services/deployment-template.yaml` → sinh ra `generated/` bằng `generate-manifests.sh` | DevOps | Sửa template, **không** sửa generated |
| Route gateway | `k8s/gateway/httproutes.yaml` | DevOps | Khi thêm/xoá endpoint (route trỏ path đã xoá = config chết) |
| Bài học chi tiết từng ca | Memory của agent (ngoài repo) | — | `LESSONS.md` chỉ giữ phần rút thành quy tắc |
| Glossary, DoR/DoD, phân loại dữ liệu, tool AI được duyệt | > TODO: dự án chưa có file riêng — cần Tech Lead / Security Lead bổ sung | | |

### Tài liệu ĐÃ BIẾT là không đáng tin (đừng dùng làm nguồn)

| File / thư mục | Vì sao | Nguồn |
|---|---|---|
| `TSD/sql_scripts/` (DDL gốc) | Thiếu cột có thật trong DB (`orders.partner_transaction_id`); dựng DB mới từ đây → service `validate` không boot | LESSONS §7.2 |
| `TSD/db-table-audit.csv` (không còn trong checkout hiện tại — nếu gặp bản cũ, đừng tin) | Sai ≥7 chỗ; 14/28 nhóm "bảng thừa" là bảng ma cào từ comment | LESSONS §3 |
| `BE/ins-infrastructure/README.md` | Ghi có aggregator `pom.xml` gốc — không tồn tại | CLAUDE.md gốc |
| `BE/ins-infrastructure/CLAUDE.md` (mục `./docker/`, `ins-base-project/`) | Cả hai thư mục không có trong checkout; mỗi service có `docker/docker-compose.yml` riêng | Kiểm cây thư mục |
| `Architecture.md §1.3` (15 service) | Checkout có 14 thư mục service + `ins-common`; không có `ins-transaction-management-service` (chỉ có TSD); k8s chỉ deploy 12 (bỏ uw, claims, recommendation) | Kiểm cây thư mục, `k8s/README.md` |
| Cấu hình `ins.cache.*` | Không bean nào đọc — TTL thật 30 phút, không phải 1 giờ | LESSONS §4.5 |
| TSD dẫn `.claude/rules/security.md`, `database.md` | File không tồn tại trong checkout | Kiểm cây thư mục |
| `ins-bit/` | Clone cũ nhánh staging, chậm 339 commit | LESSONS §6.1 |
| `ins-client/` | Bản FE cũ, untracked — cùng cấu trúc với 2 app thật, rất dễ grep nhầm | LESSONS §9 |
| Hằng endpoint trong `api.constants.ts` (FE) | "Khai hằng ≠ có người gọi" — đã gặp 3 hằng không có call site | LESSONS §3 |

## 2. Thứ tự AI nên đọc (bắt buộc)

```text
1.  CLAUDE.md (gốc workspace)
2.  LESSONS.md
3.  BE/ins-infrastructure/CLAUDE.md
4.  BE/ins-infrastructure/Architecture.md
5.  BE/ins-infrastructure/RULES.md
6.  BE/ins-infrastructure/SonarClean.md
7.  BE/ins-infrastructure/RULES_ANGULAR.md      ← khi đụng FE
8.  docs-index.md (file này)                    ← biết tài liệu nào không đáng tin
9.  TSD/ins-{service}/00..08                    ← service đang sửa
10. TSD/docs/design/decisions/ADR-*.md          ← ADR liên quan
11. documents/temporal-workflows/WF-*.md        ← khi đụng workflow
12. Code + DB thật                              ← trọng tài cuối cùng
```

**Nếu thiếu file:** dừng và hỏi.

## 3. Cây thư mục tài liệu

```text
<workspace>/                              ← KHÔNG phải git repo
├── CLAUDE.md
├── LESSONS.md
├── server-fake/                          ← proxy dev, không .git
├── FE/
│   ├── ins-cms-fe/        README.md, PL05 checklist (.pdf)
│   └── ins-miniapp-fe/    README.md, docs/, PL05 checklist (.pdf)
└── BE/ins-infrastructure/
    ├── CLAUDE.md
    ├── Architecture.md
    ├── README.md                         ← stale (aggregator pom)
    ├── RULES.md · RULES_ANGULAR.md · SonarClean.md
    ├── TEST_COVERAGE_REPORT.md · TEST_REPORT_<ngày>.md
    ├── DEPLOYMENT_CHECKLIST_<ngày>.md · RUNTIME_HEALTHCHECK_CHECKLIST_<ngày>.md
    ├── WF-01-order-purchase-saga.md · FLOW_Huy_Don_Hang.md · PLAN_*.md
    ├── INS_2.0_Comprehensive_Reference_<ngày>.md
    ├── *SRS*.docx · API_Partner_PolicyCallback_INS_v*.docx
    ├── documents/
    │   ├── template-01..08-*.pdf         ← khung thiết kế (architecture, security, domain, event, application, data&API, testing, coding)
    │   ├── PL03 · PL04 · PL05 (.pdf)     ← chuẩn code & checklist review
    │   ├── INS_Database_Design_v1.2.0.docx · INS_Database_Design_v2.0_Full.pdf
    │   ├── Thiet ke tong the - INS-v1.docx
    │   ├── <Insurer>-*-API*.md · Carrier-API-Request-Response-Specs.md
    │   ├── Tai_lieu_tich_hop_<Mail-Gateway|Ticket-System|Feature-Flag|CS-System>.pdf
    │   ├── temporal-workflows/  WF-01, WF-02a, WF-02b, WF-03, WF-09 + diagrams/
    │   ├── gap-analysis/        1 file / service
    │   └── PROMPT_GENERATE_TSD.md · TSD_TEMPLATES_SUMMARY.md
    ├── TSD/
    │   ├── ins-{service}/       00_overview … 08_coding-standards (12 bộ)
    │   ├── docs/design/decisions/   109 ADR (ADR-ADP, CB, CMS, IDENT, IPS, NOTIF, PAY, POL, PRODUCT, PROM, PUR, TXM, INFRA)
    │   ├── docs/design/events/catalogue.md
    │   ├── docs/runbooks/       7 runbook
    │   ├── sql_scripts/         alter-*, drop-*, fix-*, seed-* (KHÔNG phải nguồn sự thật)
    │   ├── temporal-workflows/
    │   ├── review-*/            review TSD (có đợt review đối tác sai, đã revert)
    │   └── _srs_v2_diff/ · _srs_v2_reference/
    ├── k8s/                     README.md, base/, gateway/, services/, scripts/
    ├── postman/
    └── ins-{service}/           14 service + ins-common — mỗi cái 1 git repo con, có README.md
```

## 4. Quy tắc cập nhật

| Tình huống | Cập nhật gì |
|---|---|
| Thêm/xoá tài liệu | Cập nhật file này (> TODO: dự án chưa có docs-index thật — đây là bản dựng lần đầu) |
| Tài liệu lệch code | Sửa tài liệu theo code (các commit `docs(tsd-*): … đối chiếu code` là tiền lệ); ghi rõ "hiện trạng" vs "thiết kế mục tiêu" |
| Review đối tác yêu cầu sửa TSD | Đối chiếu code trước — đã có lần phải revert vì review sai |
| Xoá bảng | Xoá cả `CREATE TABLE` trong `TSD/sql_scripts/` (LESSONS §7.2) |
| Xoá endpoint | Xoá route tương ứng trong `k8s/gateway/httproutes.yaml` |
| Tài liệu hết dùng | > TODO: dự án chưa có thư mục `archive/`; hiện có `TSD/sql_scripts/archive/` cho script |

## 5. Checklist

- [ ] Mọi thông tin quan trọng có đúng một nguồn sự thật — **còn thiếu**: OpenAPI, glossary, DoR/DoD
- [x] Đã ghi rõ các file tự nhận là nguồn nhưng sai (mục 1, bảng thứ hai)
- [ ] Thư mục thực tế khớp cây mục 3 — đã khớp tại thời điểm rà; cần rà lại mỗi đợt release
- [ ] Mỗi file có ghi ai sở hữu — phần lớn **chưa**, cần Tech Lead gán
- [x] AI đọc được file này (bước 8 trong thứ tự đọc)

## Nguồn tham chiếu

- Cây thư mục thật của workspace (đã ẩn danh)
- `CLAUDE.md` gốc, `LESSONS.md` §3, §4.5, §6.1, §7.2, §9
- `BE/ins-infrastructure/CLAUDE.md`, `Architecture.md`, `README.md`, `k8s/README.md`
- Diátaxis — https://diataxis.fr/

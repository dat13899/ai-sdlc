# Ví dụ điền thật — INS Platform

Bộ file trong thư mục này là các template ở `templates/` được **điền bằng dữ liệu thật** của một dự án nền tảng bảo hiểm (15 microservice Java/Spring Boot + 2 app Angular), đã **ẩn danh hoá** (tên dự án, đối tác, công ty bảo hiểm, domain, IP đều đã thay bằng tên chung).

Mục đích: cho thấy một template AI-SDLC trông thế nào khi áp vào dự án thật — kể cả chỗ dự án **chưa có** (ghi `> TODO`, không bịa) và chỗ **tài liệu lệch code** (ghi `⚠️`).

## Danh sách file

| File | Template gốc | Nguồn dữ liệu chính |
|---|---|---|
| [b2/constitution.md](b2/constitution.md) | templates/b2/constitution.md | Architecture §1–2, CLAUDE.md, LESSONS §7/§11 |
| [b2/AGENTS.md](b2/AGENTS.md) | templates/b2/AGENTS.md | CLAUDE.md workspace, LESSONS §6, package.json FE |
| [b2/SKILL.md](b2/SKILL.md) | templates/b2/SKILL.md | CLAUDE.md backend, LESSONS §0, RULES §F |
| [b2/CODING_CONVENTION.md](b2/CODING_CONVENTION.md) | templates/b2/CODING_CONVENTION.md | RULES, RULES_ANGULAR, SonarClean, Naming Standards |
| [b2/docs-index.md](b2/docs-index.md) | templates/b2/docs-index.md | Cây tài liệu thật, LESSONS §7.2 |
| [b2/dor-dod.md](b2/dor-dod.md) | templates/b2/dor-dod.md | RULES §F, LESSONS §0, SonarClean checklist |
| [b2/glossary.md](b2/glossary.md) | templates/b2/glossary.md | Comprehensive Reference, trạng thái Order/Policy |
| [b2/data-classification.md](b2/data-classification.md) | templates/b2/data-classification.md | Architecture §2.4, LESSONS §4.4 |
| [b2/tool-permissions.md](b2/tool-permissions.md) | templates/b2/tool-permissions.md | LESSONS §6, script vận hành |
| [b2/prompts.md](b2/prompts.md) | templates/b2/prompts.md | Prompt sinh TSD, chỉ dẫn AI trong repo |
| [b2/adr-template.md](b2/adr-template.md) | templates/b2/adr-template.md | 3 ADR thật: Outbox, VND Long, IDOR revert |
| [rules/api-rules.md](rules/api-rules.md) | templates/rules/api-rules.md | Architecture §2.3/2.6, LESSONS §4.1/4.2/4.6 |
| [rules/test-rules.md](rules/test-rules.md) | templates/rules/test-rules.md | Architecture §2.7, LESSONS §5, test report |
| [rules/code-review-rules.md](rules/code-review-rules.md) | templates/rules/code-review-rules.md | RULES §F, RULES_ANGULAR §J, LESSONS |
| [bo-sung/code-review-checklist-nguoi.md](bo-sung/code-review-checklist-nguoi.md) | templates/bo-sung/… | LESSONS, PL04/PL05 |
| [bo-sung/conventional-commits.md](bo-sung/conventional-commits.md) | templates/bo-sung/… | git log thật |
| [bo-sung/runbook.md](bo-sung/runbook.md) | templates/bo-sung/runbook.md | Deployment/healthcheck checklist, k8s, LESSONS §11 |
| [bo-sung/postmortem.md](bo-sung/postmortem.md) | templates/bo-sung/postmortem.md | Sự cố Jackson snake_case↔camelCase (LESSONS §4.1) |
| [bo-sung/plan.md](bo-sung/plan.md) | templates/bo-sung/plan.md | Plan truy vấn kết quả tạo hợp đồng |
| [quy-chuan/standards-index.md](quy-chuan/standards-index.md) | templates/quy-chuan/… | PL03/04/05, Quy chuẩn CSDL, TSD 01–08 |
| [quy-chuan/ai-governance.md](quy-chuan/ai-governance.md) | templates/quy-chuan/… | Chỉ dẫn AI trong repo, rủi ro từ LESSONS |

**Chưa làm** (dự án không có dữ liệu hoặc là biểu mẫu theo từng tính năng): `ai-tool-scope`, `dora-metrics`, `threat-model-STRIDE`, `spec`, `tasks`, `test-plan`, `test-case-rtm`, `CHANGELOG`, toàn bộ `b3/` và `phu-luc/`.

## Bài học rút ra khi điền

Điền template vào dự án thật làm lộ ra các chỗ tài liệu nói một đằng, code làm một nẻo:

- Quy tắc ghi "Flyway-only" nhưng không service nào có `db/migration` — DDL thực tế chạy tay qua script.
- Tài liệu ghi path `/api/v1/...`, code thật dùng `/ins/{svc}/public|private/v1/...`.
- TSD ghi lỗi theo RFC 7807, code trả envelope `{success, errorCode, message, timestamp}`.
- Chuẩn đặt tên và bộ rule Java lệch nhau về timestamp (`created_time` UTC vs `created_at` +07:00) và kiểu tiền (DECIMAL vs Long).
- Script tiện ích chạy `git add -A` trên mọi repo — đúng thứ bài học sự cố đã cấm.
- Không có CI pipeline, JaCoCo, commitlint hay branch protection — nên cột "cơ chế thực thi" của nhiều template phải để TODO.

→ Đây chính là giá trị của Gate B2: viết constitution/AGENTS/SKILL buộc đội phải đối chiếu quy tắc với thực tế.

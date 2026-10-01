---
title: tool-permissions.md — Phân quyền công cụ cho AI Agent, INS Platform
for: B2 — ví dụ điền thật
owner: Tech Lead (A/R) · Security Lead (C/A về ATTT)
nguồn: LESSONS.md §5, §6, §7, §11; workspace CLAUDE.md; các script ở gốc ins-infrastructure; k8s/README.md
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/tool-permissions.md

# tool-permissions.md — Phân quyền công cụ cho AI Agent

> Nguyên tắc: least-privilege, mặc định từ chối. Ở dự án này, mỗi mục "cấm" dưới đây đều gắn với một sự cố thật hoặc một script phá huỷ có sẵn trong repo.

## 1. Ba mức quyền — định nghĩa

| Mức | Ký hiệu | Nghĩa | Ai quyết định |
|---|---|---|---|
| **Được tự chạy** | ✅ | Không ảnh hưởng hệ thống thật, không đụng worktree của người khác | Đã allowlist |
| **Phải hỏi trước** | ⚠️ | Dừng, mô tả việc + rủi ro, chờ xác nhận trong chat | Người dùng / Tech Lead |
| **Cấm tuyệt đối** | ❌ | Không làm kể cả khi được yêu cầu trong chat — đề xuất lệnh để người tự chạy | Không giao cho AI |

**Ví dụ cốt lõi của 3 mức (theo dự án):**

| Mức | Ví dụ |
|---|---|
| ✅ | `./mvnw test -pl domain`, `./mvnw test -pl adapter -Dtest='ArchitectureTest'`, `npm run lint`, `git status`, `git diff`, `git pull` nhánh `develop` trên mọi repo |
| ⚠️ | `git commit` / `git push` (chỉ khi được bảo), `git merge develop → release`, thêm dependency `pom.xml`/`package.json`, viết script SQL, `kubectl apply -k k8s/` lên k8s local |
| ❌ | `git add -A`, `./mvnw spotless:apply` toàn repo, `redeploy-all.sh`, `reset-all.sh`, `commit-all-services.sh`, chạy SQL lên DB server, đọc `k8s/base/secrets.yaml` |

## 2. Bảng phân quyền theo hành động

Môi trường của dự án: **LOCAL** (máy dev: Docker Desktop K8s + `docker/docker-compose.yml` từng service), **DEV server** (`api.example.vn`, deploy bằng `redeploy-all.sh` từ bản checkout `release/` trên server), **STAGING** (hệ thống staging của Ví X — `wallet-staging.example.vn`, miniapp có cấu hình `staging`), **UAT** (miniapp có cấu hình `uat`), **PRODUCTION**.

| # | Hành động | LOCAL | CI | DEV server | STAGING / UAT | PRODUCTION |
|---|---|---|---|---|---|---|
| 1 | Đọc file trong 3 repo thật | ✅ | > TODO | ❌ | ❌ | ❌ |
| 2 | Sửa code trong phạm vi nhiệm vụ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 3 | Sửa `ins-bit/`, `ins-client/` | ❌ (LESSONS §6.1, §9) | — | — | — | — |
| 4 | `./mvnw` build / test / ArchUnit | ✅ | > TODO | ❌ | ❌ | ❌ |
| 5 | `*IntegrationTest` (Testcontainers) | ✅ nếu có Docker | > TODO | ❌ | ❌ | ❌ |
| 6 | `./mvnw spotless:apply` | ⚠️ chỉ file mình sửa · ❌ toàn repo (LESSONS §6.3) | — | — | — | — |
| 7 | `npm start / test / lint / format:check` | ✅ | > TODO | ❌ | ❌ | ❌ |
| 8 | `git pull develop` mọi repo | ✅ bắt buộc trước khi làm | — | — | — | — |
| 9 | `git add` | ⚠️ từng file, sau `git status` · ❌ `-A` / `.` (LESSONS §6.2) | — | — | — | — |
| 10 | `git commit` / `git push` | ⚠️ chỉ khi được bảo rõ | ❌ | ❌ | ❌ | ❌ |
| 11 | `pull-all-services.sh <branch>` | ⚠️ (`DRY_RUN=1` trước) | — | ❌ | ❌ | ❌ |
| 12 | `commit-all-services.sh` | ❌ (script chạy `add -A` mọi repo) | ❌ | ❌ | ❌ | ❌ |
| 13 | Merge `develop → release` | ⚠️ stash đúng file, kiểm `git status` sau pop, báo commit người khác kéo theo | — | ❌ | ❌ | ❌ |
| 14 | Merge MR / push thẳng nhánh chung | > TODO: chưa có quy định branch protection | | | | |
| 15 | `reset-all.sh` (git reset --hard + clean) | ❌ | ❌ | ❌ | ❌ | ❌ |
| 16 | Thêm thư viện third-party | ⚠️ Tech Lead duyệt, MR riêng (RULES TP1) | ❌ | ❌ | ❌ | ❌ |
| 17 | Xoá file / "code chết" | ⚠️ sau khi chứng minh theo LESSONS §3 | ❌ | ❌ | ❌ | ❌ |
| 18 | Sửa `k8s/services/deployment-template.yaml` + `generate-manifests.sh` | ⚠️ | — | ❌ | ❌ | ❌ |
| 19 | Sửa tay `k8s/services/generated/*.yaml` | ❌ (LESSONS §7.3) | — | — | — | — |
| 20 | `k8s/scripts/up.sh`, `kubectl apply -k k8s/` | ⚠️ chỉ context `docker-desktop` | ❌ | ❌ | ❌ | ❌ |
| 21 | `switch-infra-config.sh` (sửa manifest + `application.yml` hàng loạt) | ❌ | ❌ | ❌ | ❌ | ❌ |
| 22 | `redeploy-all.sh`, `redeploy-miniapp.sh` | ❌ | ❌ | ❌ (người chạy) | ❌ | ❌ |
| 23 | Viết script `TSD/sql_scripts/*.sql` / `.js` | ⚠️ chỉ tạo file | — | — | — | — |
| 24 | **Chạy SQL / Mongo script** | ⚠️ chỉ DB container local của mình | ❌ | ❌ | ❌ | ❌ |
| 25 | `scripts/kafka-delete-unused-topics.sh` | ❌ | ❌ | ❌ | ❌ | ❌ |
| 26 | Đọc/in `k8s/base/secrets.yaml`, key mã hoá PII, credential NCC | ❌ | > TODO | ❌ | ❌ | ❌ |
| 27 | Chạy `server-fake` (proxy tới staging) | ⚠️ chỉ bind `localhost` (mặc định của `HOST`), không dùng cho gì giống production | — | — | — | — |
| 28 | Truy cập dữ liệu thật của khách hàng | ❌ | ❌ | ❌ | ❌ | ❌ |

## 3. Mức tự chủ theo môi trường

| Môi trường | Mức tự chủ của AI | Ví dụ được phép | Bắt buộc |
|---|---|---|---|
| **LOCAL** | Cao, trừ git ghi | Sửa code, build, test, k8s Docker Desktop | Không `add -A`; không commit khi chưa được bảo; worktree có thể đang có file dirty của người khác |
| **CI** | > TODO: dự án chưa có — không tìm thấy file pipeline trong các repo (`Architecture.md` ghi GitLab CI/CD; nhánh release neo theo Bitbucket) | | |
| **DEV server** | Không | — | Deploy bằng script trên server, do người chạy |
| **STAGING / UAT** | Không | — | Chỉ tiếp cận qua `server-fake` ở local khi được yêu cầu |
| **PRODUCTION** | Không | — | > TODO: nguồn chưa phân biệt rõ — `redeploy-all.sh` gọi máy chủ `api.example.vn` là "PROD" trong khi `server-fake` gọi cùng host là `dev`. Cần Tech Lead xác nhận |

### Vì sao chặn các script ở gốc `ins-infrastructure`

- `reset-all.sh` chạy `git reset --hard` + `git clean -fd` trên mọi repo — xoá luôn việc dở của người khác trên worktree dùng chung.
- `commit-all-services.sh` dùng `add -A` — đúng hành vi đã làm hỏng một commit đã push (LESSONS §6.2).
- `switch-infra-config.sh` ghi đè host hạ tầng trong template, 12 manifest generated và `application.yml` các service.
- Sai thứ tự deploy làm hỏng live (LESSONS §11): thêm enum phải deploy BE trước; thêm cột phải chạy schema trước; xoá bảng phải gỡ `@Entity` → deploy → rồi mới DROP; service `validate` sẽ **không boot** nếu DROP sớm (LESSONS §7.1).

## 4. Ma trận công cụ cụ thể

| Công cụ | Cho phép dùng | Môi trường | Ghi chú |
|---|---|---|---|
| Claude Code (agent chính) | ✅ | LOCAL | Chỉ dẫn qua `CLAUDE.md` gốc + backend |
| Grep tool | ✅ có giới hạn | LOCAL | Mù với Java bị `.gitignore` → dùng `rg --no-ignore -g '*.java'`; FE luôn `-i` |
| Edit/Write tool trên FE | ✅ | LOCAL | Có thể ghi CRLF → kiểm `grep -c $'\r$' file` trước khi để prettier chạy |
| Maven Wrapper `./mvnw` | ✅ | LOCAL | `-o -q test` dừng ở module đỏ đầu — dùng `-Dmaven.test.failure.ignore=true` |
| git (shell) | ✅ đọc · ⚠️ ghi | LOCAL | Repo `ins-cms-fe` cần git ≥2.45 cho hook lint-staged |
| Docker / Testcontainers | ✅ | LOCAL | |
| kubectl / helm | ⚠️ | LOCAL (`docker-desktop`) | |
| Truy vấn DB (MariaDB / Mongo) | ⚠️ đọc | LOCAL | ❌ với mọi DB có dữ liệu thật |
| Sonar | > TODO: chưa rõ AI có quyền đọc server Sonar không | | Chỉ sửa đúng issue được giao |
| Tool deploy | ❌ AI | — | Người chạy |

## 5. Hành động không hoàn tác được — luôn cần người xác nhận

- `git push` (commit gộp nhầm việc người khác đã push thì không rút lại được — LESSONS §6.2)
- `DROP TABLE` / xoá cột / xoá topic Kafka
- Chạy script `fix-*`, `backfill-*`, `drop-*` trong `TSD/sql_scripts/`
- Gửi SMS / Zalo / email thật qua `notification-service` (SMS bắn Kafka trực tiếp, không nằm trong transaction)
- Gọi API NCC tạo/huỷ hợp đồng thật; gọi cổng thanh toán
- Tạo/đổi realm, role, client Keycloak (phải làm **trước** khi deploy code kiểm role)
- Deploy / redeploy bất kỳ môi trường server nào

## 6. Cơ chế thực thi (không chỉ ghi trên giấy)

| Lớp | Cách thực thi |
|---|---|
| 1. Chỉ dẫn cho AI | `CLAUDE.md` gốc + backend, `LESSONS.md`, file này |
| 2. Cấu hình tool | > TODO: chưa thấy allowlist/denylist của agent trong repo — cần Tech Lead bổ sung (vd chặn `git add -A`, `spotless:apply`, `reset-all.sh`) |
| 3. Cấu hình repo | > TODO: chưa có dữ liệu về branch protection trên GitLab/Bitbucket |
| 4. Hạ tầng | Secret k8s tập trung ở `k8s/base/secrets.yaml`; credential NCC chỉ ref Vault (ADR-ADP-07). PAM / MFA: > TODO |
| 5. Quy trình | Checklist `DEPLOYMENT_CHECKLIST_<ngày>.md`, `RUNTIME_HEALTHCHECK_CHECKLIST_<ngày>.md`; thứ tự deploy LESSONS §11 |

## 7. Khi AI cần thực hiện hành động bị chặn

```text
1. DỪNG      — không dùng lệnh khác để đạt cùng kết quả (vd không thay add -A bằng vòng lặp add mọi file)
2. MÔ TẢ     — muốn làm gì, vì sao, rủi ro (service nào ddl-auto gì, ai đang có file dirty)
3. ĐỀ XUẤT   — lệnh cụ thể + thứ tự deploy để người tự chạy
4. NGƯỜI quyết định
5. GHI LẠI   — nếu là bài học mới, đề xuất bổ sung LESSONS.md qua MR
```

## 8. Checklist rà soát định kỳ

- [ ] Danh sách script cấm ở mục 2 còn khớp các script `*.sh` ở gốc `ins-infrastructure`
- [ ] Mốc test đỏ nền (LESSONS §5.4) và mốc ArchUnit (3 vi phạm) đã cập nhật
- [ ] Bảng `ddl-auto` theo service (LESSONS §7.1) còn đúng với yml + k8s
- [ ] Branch protection — TODO
- [ ] Secret không nằm trong code/log (`INS_PII_ENCRYPTION_KEY` chưa set → adapter rơi về DEV key hardcode — phải chắc chắn đã set ở server)
- [ ] Chu kỳ rà: > TODO: dự án chưa có

## Nguồn tham chiếu

- `LESSONS.md` §3, §5, §6, §7, §9, §11
- `CLAUDE.md` gốc (server-fake), `BE/ins-infrastructure/k8s/README.md`
- Header các script: `redeploy-all.sh`, `redeploy-miniapp.sh`, `reset-all.sh`, `commit-all-services.sh`, `pull-all-services.sh`, `switch-infra-config.sh`
- `TSD/ins-identity-service/02_security-design.md` §4 (PII key)
- OWASP LLM Top 10 — LLM08 Excessive Agency — https://genai.owasp.org/llm-top-10/

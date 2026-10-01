---
title: Runbook vận hành (ví dụ INS Platform)
for: B14 bước 1 — Vận hành theo Runbook
owner: DevOps/Ops (R) · Tech Lead (A) · Đội trực (R)
nguồn: templates/bo-sung/runbook.md; Deployment Checklist (2026-06-17); Runtime Health Check Checklist (2026-06-17); k8s/README.md; LESSONS.md §4, §7, §11; scripts redeploy-all.sh, redeploy-miniapp.sh, pull-all-services.sh, reset-all.sh, switch-infra-config.sh
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/bo-sung/runbook.md

# Runbook vận hành — INS Platform

> Viết cho người trực: lệnh copy được, không giải thích dài. `<ns>` = namespace k8s của ứng dụng, `<INFRA_DIR>` = thư mục checkout `ins-infrastructure` trên server. Không ghi IP, secret, tên node vào file này.

## 1. Thông tin hệ thống

| Trường | Giá trị |
|---|---|
| Tên hệ thống | INS Platform — nền tảng bảo hiểm (15 microservice, 12 service đang deploy lên k8s; uw / claims / recommendation chưa deploy) |
| Môi trường | BE qua gateway: `https://api.example.vn` · Miniapp khách: `https://app.example.vn/ins/miniapp/` · CMS: `https://cms.example.vn/ins/cms-admin/` |
| Hạ tầng | Ubuntu 22.04 + k3s (tắt servicelb + traefik) + KGateway 2.1.x + nginx reverse proxy + Let's Encrypt; data layer (MariaDB, MongoDB, Valkey, Kafka, MinIO, Keycloak, Temporal) chạy Docker Compose |
| Dashboard giám sát | `/actuator/prometheus` mỗi service; `kubectl top pods -n <ns>` (cần metrics-server). > TODO: dự án chưa có dashboard Grafana chính thức — cần DevOps bổ sung link |
| Log | ECS JSON (logback-spring.xml, có `trace.id`, `span.id`); `kubectl logs -n <ns> -l app=<svc>`. Loki/ELK và Jaeger là Phase 2 |
| Kênh cảnh báo | > TODO: dự án chưa có — cần DevOps bổ sung |
| Kênh sự cố | > TODO: dự án chưa có — cần PM bổ sung |
| Mức độ ảnh hưởng nghiệp vụ | ☐ Thấp ☐ Trung bình ☐ Cao ☑ Sống còn — luồng tiền (thanh toán → cấp hợp đồng bảo hiểm) |
| Giờ cao điểm | > TODO: dự án chưa có số liệu — cần PO bổ sung |
| SLA mục tiêu | TPS 200 · p95 < 2s · pricing < 200ms · voucher validate < 50ms (Architecture §2.5) |

## 2. Liên hệ khẩn cấp & leo thang

| Vai trò | Người | Liên hệ | Khi nào gọi |
|---|---|---|---|
| Trực cấp 1 | > TODO | > TODO | Mọi cảnh báo đầu tiên |
| Trực cấp 2 (Dev) | > TODO | > TODO | Sau 15 phút chưa xác định được nguyên nhân |
| Tech Lead | > TODO | > TODO | Sự cố S1, quyết định rollback, sự cố luồng tiền |
| PM | > TODO | > TODO | Cần thông báo đối tác / khách hàng |
| Security Lead | > TODO | > TODO | Nghi xâm nhập / rò rỉ PII |
| Platform team (Ví X) | > TODO | > TODO | Sự cố ví / cổng thanh toán phía đối tác |
| Đầu mối NCC (Insurer-A…F) | > TODO | > TODO | NCC không trả kết quả cấp hợp đồng |

> TODO: dự án chưa có danh bạ trực — cần PM bổ sung. Sign-off Deployment Checklist yêu cầu "on-call contact list current" trước go-live.

**Quy tắc leo thang:** S1 leo thang ngay; S2 sau 30 phút chưa có hướng; không ai trả lời trong 10 phút → gọi điện trực tiếp.

## 3. Bảng sự cố thường gặp

| Mã | Triệu chứng | Nguyên nhân khả dĩ | Cách kiểm tra | Lệnh hành động | Người gọi | Mức |
|---|---|---|---|---|---|---|
| INC-01 | Pod `CrashLoopBackOff` | App crash lúc boot | `kubectl logs -n <ns> <pod> --previous` | Sửa theo stack trace; xem INC-02/03/04 | Trực cấp 1 | S2 |
| INC-02 | Service **không boot** sau khi DROP bảng/cột | Service chạy `ddl-auto=validate` (insurer-partner, promotion, purchase) mà entity còn tham chiếu | Log Hibernate schema validation | Khôi phục bảng/cột; quy tắc: gỡ code → **deploy** → mới DROP | Trực cấp 2 | S1 |
| INC-03 | 500 ở **request**, boot vẫn OK | k8s chạy `ddl-auto=none` mà migration chưa chạy (cột mới chưa có) | Log SQL lỗi cột không tồn tại | Chạy migration Flyway rồi `kubectl rollout restart` | Trực cấp 2 | S1 |
| INC-04 | `RedisConnectionException` khi deploy | **Không phải Redis chết**: 7 service dùng Redisson đọc `INS_VALKEY_*`, deployment chỉ set `INS_REDIS_*` → fallback `localhost:16379` | `kubectl exec ... env \| grep -E 'VALKEY\|REDIS'` | Set đủ biến trong `deployment-template.yaml` → `generate-manifests.sh [TAG]` → apply (không sửa file generated) | Dev | S2 |
| INC-05 | `ImagePullBackOff` | Image chưa import vào k3s containerd | `sudo k3s ctr images ls \| grep ins-` | `docker save <img> \| sudo k3s ctr images import -` | Trực cấp 1 | S3 |
| INC-06 | `Readiness probe failed` | Spring Boot khởi động 30–60s; Redis health contributor chậm | `kubectl describe pod` | Tăng `initialDelaySeconds` + `timeoutSeconds` | DevOps | S3 |
| INC-07 | `OOMKilled` | Limit 512Mi không đủ cho Spring Boot | `kubectl describe pod` | Tăng `resources.limits.memory` (≥1Gi) trong template, regenerate, apply | DevOps | S2 |
| INC-08 | actuator `/health` = DOWN | Một component (db / mongo / redis / kafka / minio / temporal) không kết nối được | `kubectl exec -n <ns> $POD -- curl -s localhost:<PORT>/actuator/health \| jq '.components \| to_entries[] \| select(.value.status != "UP")'` | Sửa biến môi trường tương ứng (bảng mục 3.1) | Trực cấp 1 | S2 |
| INC-09 | 403 trả về ~1ms ở endpoint ẩn danh (đăng ký, quên mật khẩu, SSO) | POST ẩn danh thiếu `csrfIgnoredPaths` | So config `public-paths` vs `csrfIgnoredPaths` | Thêm path vào `csrfIgnoredPaths`, redeploy service | Dev | S2 |
| INC-10 | 401 ở endpoint public | Thiếu path trong `ins.security.public-paths` (đã gặp: `/ins/cms/public/v1/banners/**`) | Log security matcher | Thêm path, redeploy | Dev | S2 |
| INC-11 | 403 `SCOPE_xxx required` | Thiếu client scope / audience mapper trên Keycloak | Decode JWT, xem `aud` / `scope` | Cấu hình client scope + audience mapper (hậu tố `-svc`) | Dev | S2 |
| INC-12 | Login CMS `unauthorized_client` | Secret client lệch giữa BE và Keycloak | Log Keycloak | Đồng bộ secret client (lấy từ secret store, không ghi vào runbook) | DevOps | S2 |
| INC-13 | Browser chặn preflight "Invalid CORS request" | Sai tên env CORS, hoặc TrafficPolicy thiếu `allowCredentials: true` | `kubectl get trafficpolicy -n <ns> -o yaml \| grep -A3 cors` | Env đúng tên `INS_SECURITY_CORS_ALLOWED_ORIGINS_0`; patch TrafficPolicy | DevOps | S2 |
| INC-14 | FE sau deploy vẫn gọi `localhost` | Build dùng `environment.ts` mặc định | `grep -c localhost dist/.../*.js` | Tạo `environment.prod.ts` + `fileReplacements` trong `angular.json` (script redeploy tự làm) | Dev | S2 |
| INC-15 | FE 404 ở `/ins/miniapp/...` | Copy dist sai thư mục so với base-href | `grep "base href" index.html` | Deploy vào `/var/www/<fe-root>/ins/miniapp/` đúng subpath | DevOps | S3 |
| INC-16 | Ảnh MinIO bị chặn mixed-content | Presigned URL HTTP trong trang HTTPS | DevTools console | nginx HTTPS proxy phía trước MinIO | DevOps | S3 |
| INC-17 | nginx không start / cổng 80 bị chiếm | klipper-lb / kube-proxy chiếm port 80 | `sudo ss -ltnp \| grep :80` | Cài k3s `--disable=servicelb --disable=traefik`; patch gateway sang NodePort và sync `proxy_pass` nginx | DevOps | S2 |
| INC-18 | Hợp đồng không tạo được, log `UnknownHost` | Gọi S2S khác namespace bằng tên ngắn | Log outbound | Dùng FQDN `<svc>.<ns>.svc.cluster.local` trong `INS_*_SERVICE_URL` | Dev | S1 |
| INC-19 | Đơn ghi `POLICY_REQUEST_FAILED` nhưng NCC **đã cấp** hợp đồng | Timeout caller ≤ timeout chặng adaptor → NCC | So timeout purchase → adaptor với connect + read của adaptor → NCC | Timeout caller phải > tổng chặng sau (hiện 45s > 3s + 30s); cấp lại HĐ qua CMS `reissue-policy` | Trực cấp 2 | S1 |
| INC-20 | SMS không tới khách, API vẫn 200 | Gọi notification thiếu `Idempotency-Key` → 400 bị hàm best-effort nuốt | Log `warn` của hàm `*BestEffort`; mã `INS00748` | Bổ sung header; gửi lại SMS | Dev | S2 |
| INC-21 | Sản phẩm không hiện | Seed sai `tenant_id` (tenant mặc định all-zeros) | Kiểm `tenant_id` trong Mongo/DB | Sửa seed / env `INS_TENANT_DEFAULT` | Dev | S3 |
| INC-22 | Field nhiều từ lặng lẽ `null`, API 200 | Lệch snake_case ↔ camelCase | So khoá JSON thật với DTO | Xem `postmortem.md`; sửa quy ước naming | Dev | S2 |
| INC-23 | Bảng `payment_*` xuất hiện trong DB purchase | Env DB của payment-service trỏ nhầm `${INS_PURCHASE_DB_*}` | `SHOW TABLES` | Sửa env DB của service | Dev | S2 |

### 3.1. Fix nhanh khi actuator DOWN

| Component | Kiểm env | Ghi chú |
|---|---|---|
| `db` | `INS_DB_HOST` / password | Reseed schema nếu thiếu bảng |
| `mongo` | `SPRING_DATA_MONGODB_URI` | |
| `redis` | `INS_REDIS_HOST` **và** `INS_VALKEY_*` | Xem INC-04 |
| `kafka` | `SPRING_KAFKA_BOOTSTRAP_SERVERS` | Topic tự tạo khi BE boot |
| `minio` | `INS_MINIO_ENDPOINT` / access key | |
| Keycloak | realm + audience mapper | JWT verify fail |
| `temporal` | `TEMPORAL_HOST` | |

## 4. Quy trình xử lý sự cố

```text
1. XÁC NHẬN   (≤ 5 phút)  — chạy ~/healthcheck.sh (mục 6); sự cố có chạm luồng tiền không?
2. THÔNG BÁO  (≤ 10 phút) — báo kênh sự cố: "Đang xử lý INC-xx, mức Sx, phụ trách: <tên>"
3. CÔ LẬP     (≤ 30 phút) — chặn lan rộng TRƯỚC khi tìm nguyên nhân
4. KHẮC PHỤC             — hotfix theo thứ tự deploy ở mục 4.1; hoặc rollback (mục 5)
5. XÁC NHẬN ỔN ĐỊNH      — ~/post-deploy-smoke.sh exit 0, theo dõi ≥ 30 phút
6. RCA       (≤ 48 giờ)  — post-mortem blameless (postmortem.md)
7. CẬP NHẬT RUNBOOK      — thêm dòng vào bảng mục 3; bài học code thì thêm vào LESSONS
```

**Đặc thù INS:** lỗi nguy hiểm nhất là lỗi **im lặng** (200, log sạch, dữ liệu sai — LESSONS §4). Khi "không crash nhưng số liệu sai", quét nhóm này trước: naming JSON, `catch (Exception)` biến 400 thành 500, hàm best-effort nuốt lỗi, log mask `***` kể cả khi giá trị null (thấy `field=***` **không** có nghĩa là có dữ liệu), config chết không bean nào đọc (grep bean đọc config trước khi tin nó).

### 4.1. Thứ tự triển khai bắt buộc (sai thứ tự là hỏng live)

| Thay đổi | Thứ tự bắt buộc |
|---|---|
| Thêm giá trị enum đọc từ DB | Deploy **BE trước**, set dữ liệu **sau** |
| Xoá bảng / cột | Gỡ `@Entity` / field → **deploy** → mới `DROP`; xoá cả `CREATE TABLE` trong script DDL gốc, không thì môi trường mới tạo lại |
| Thêm cột / migration | Chạy **schema trước**, deploy code sau |
| Thêm realm role | **Tạo role + gán user TRƯỚC** khi deploy code kiểm role |
| Gộp config SMS template | Deploy `notification` **TRƯỚC** `purchase` |
| Đổi nhịp chờ / nhánh Temporal workflow | Qua version marker; **không xoá** key config cũ mà run đang replay còn đọc |

**`ddl-auto` khác nhau theo service — kiểm trước khi đụng `@Entity`/DDL:**

| Service | yml + develop | k8s | Nếu DROP trước khi deploy |
|---|---|---|---|
| payment, identity | `update` | `none` | Bảng **mọc lại** (rỗng, sai index) |
| insurer-partner, promotion, purchase | `validate` | `none` | **Service không boot** |
| callback | `none` | `none` | An toàn |

`validate` chỉ đối chiếu chiều entity → schema: bảng/cột **thừa** không fail, chỉ **thiếu** mới fail. Script DDL gốc trong repo **không phải** nguồn sự thật (đã có cột entity đòi mà DDL gốc không tạo) — dựng môi trường mới phải kiểm bằng boot thật.

### 4.2. Redeploy

**Toàn bộ BE + 2 FE** — `redeploy-all.sh` (idempotent, `set -eu`):

| Bước | Việc |
|---|---|
| Auto-fix | Pin `maven-compiler-plugin` 3.13.0 trong `ins-common/pom.xml` nếu thiếu |
| A1 | `mvn clean install -DskipTests` cho `ins-common` (phải build **trước**) |
| A2 | `TAG=$TAG ./k8s/scripts/build-images.sh` |
| A3 | `docker save <img> \| sudo k3s ctr images import -` từng image |
| A4 | `kubectl apply -k k8s/` |
| A5 | `kubectl set env` lại CORS origins, `SERVER_FORWARD_HEADERS_STRATEGY=framework`, MinIO endpoint, tenant mặc định |
| A6 | `kubectl rollout restart deployment -n <ns>` + `rollout status --timeout=600s` |
| A7 | Patch gateway sang NodePort, `sed` cập nhật `proxy_pass` nginx, `nginx -t && systemctl reload nginx` |
| B/C | Mỗi FE: tạo/ép `environment.prod.ts` + `fileReplacements`, thay URL `localhost` hard-code, xoá cache, `npm ci`, `npm run build:prod`, **kiểm bundle không còn `localhost` và có URL production** (thiếu → exit 1), copy vào web root đúng subpath |
| D | Reload nginx, `kubectl get pods`, curl smoke 3 domain |

**Chỉ miniapp** — `redeploy-miniapp.sh`: cùng cơ chế phần B, deploy vào subpath `/ins/miniapp/`. `apiUrl` prod là **host-only** (không kèm `/api/v1`) vì hằng path phía FE đã tự nối đường dẫn đầy đủ.

Sau redeploy: báo người dùng hard reload (Ctrl+Shift+R).

**Lưu ý script:** dùng `set -eu`, **không** `pipefail` cho script redeploy — `grep | wc -l` trả 1 làm script thoát sớm (Known Pitfall #13).

**Cập nhật code trên server** — `pull-all-services.sh <branch>`: lặp từng repo service, `fetch` + `checkout` + `pull --ff-only`. Cờ: `DRY_RUN=1`, `STASH=1`, `REBASE=1`, `SKIP=svc1,svc2`, `TIMEOUT` (mặc định 120s/lệnh git); chạy non-interactive (không hỏi passphrase).

**Chuyển cấu hình hạ tầng** — `switch-infra-config.sh <1|2>`: đổi host Keycloak / MariaDB / MongoDB / Valkey trong `deployment-template.yaml`, manifest generated và `application.yml` có giá trị hard-code. Sau đó apply lại manifest.

**⚠️ Phá huỷ** — `reset-all.sh`: `git reset --hard` + `git clean -fd` **mọi repo** dưới thư mục release. Mất toàn bộ thay đổi chưa commit. Chỉ chạy khi Tech Lead yêu cầu; mặc định có xác nhận, `-y` bỏ xác nhận, `--no-clean` giữ file untracked, truyền tên repo để giới hạn phạm vi.

### 4.3. k8s (kustomize)

```bash
./k8s/scripts/check-prereqs.sh          # tool + context + cổng data layer
./k8s/scripts/build-images.sh [svc]     # 12 image, hoặc 1 service
./k8s/scripts/up.sh                     # CRD Gateway API + KGateway (Helm) + generate + apply + patch /tmp cho proxy
./k8s/scripts/down.sh                   # gỡ app + Gateway (DELETE_KGATEWAY=1 gỡ cả controller)
# biến: TAG, SKIP_PREREQS=1, SKIP_KGATEWAY=1, KGATEWAY_VER, REGENERATE=1
```

- Sửa `services/deployment-template.yaml` rồi `generate-manifests.sh [TAG]` — **không sửa file trong `generated/`**.
- `Selector immutable` khi re-apply → `down.sh` rồi `up.sh`.
- KGateway proxy crash "Failed to create temporary file" → patch thêm `emptyDir` mount `/tmp` (`up.sh` đã tự làm).
- Timeout gateway theo route: 5s (product, promotion, transaction-management) · 10s (policy, cms) · 12s (insurer-adaptor) · 15s (purchase, payment, insurer-partner) · 30s (identity).

## 5. Rollback nhanh

| Bước | Lệnh / hành động | Xác nhận |
|---|---|---|
| 1 | Xem image đang chạy: `kubectl get deploy -n <ns> -o wide` | Ghi lại tag hiện tại + tag trước |
| 2 | `kubectl set image deployment/ins-<svc>-service ins-<svc>-service=ins/ins-<svc>-service:<old-tag> -n <ns>` | `kubectl rollout status deployment/ins-<svc>-service -n <ns>` |
| 3 | Nếu phải revert code/manifest: `git revert <commit>` trong repo infrastructure, build lại image tag cũ | |
| 4 | Kiểm health + smoke | `~/healthcheck.sh` và `~/post-deploy-smoke.sh` exit 0 |
| 5 | Thông báo đã rollback | Kênh sự cố + PM |

**Rollback có schema:** không rollback code về bản còn tham chiếu cột/bảng đã DROP (service `validate` sẽ không boot). Backup trước khi DROP: MariaDB dump hằng ngày 02:00, giữ 14 ngày (`mysqldump --single-transaction` từng schema, gzip); MinIO `mc mirror` sang remote.

- [ ] Rollback Plan đã diễn tập với 1 service (điều kiện sign-off go-live)
- [ ] Thời gian rollback mục tiêu: > TODO: dự án chưa có — cần Tech Lead bổ sung
- [ ] Người có quyền ra lệnh rollback: > TODO: dự án chưa ghi — cần PM bổ sung

## 6. Checklist vận hành định kỳ

### Sau mỗi lần deploy

- [ ] `~/healthcheck.sh` exit 0: 7 component hạ tầng (MariaDB ping, Mongo ping, Valkey PONG, Kafka broker, MinIO ready, Keycloak ready, Temporal SERVING) + 12 service `actuator/health` = `UP`
- [ ] `kubectl get pods -n <ns>` — 12 pod `Running 1/1`, restart = 0 (insurer-adaptor có label **không** hậu tố `-service`)
- [ ] 12 schema MariaDB có đủ bảng so với TSD của từng service
- [ ] `kafka-consumer-groups.sh --list` ≈ 12 group
- [ ] Gọi thử 1 REST M2M qua gateway: 200 hoặc 404 đều OK (route + JWT verify thông); 5xx = service DOWN hoặc HTTPRoute sai
- [ ] `~/post-deploy-smoke.sh` exit 0: node Ready, KGateway Running, 12 pod, ≥ 8 container hạ tầng, 3 domain HTTPS 2xx/3xx, CORS `allow-credentials: true`, cert hợp lệ, ≥ 15 topic, ≥ 8 bucket

### Hằng ngày

- [ ] Backup MariaDB 02:00 chạy thành công
- [ ] Xem log lỗi 24 giờ qua (`kubectl logs`), đặc biệt `warn` của hàm `*BestEffort`
- [ ] > TODO: dự án chưa có dashboard uptime / tỉ lệ lỗi — cần DevOps bổ sung

### Hằng tuần

- [ ] MinIO mirror sang remote
- [ ] Kiểm dung lượng đĩa (`df -h`) và `kubectl top`
- [ ] Rà tài khoản có quyền truy cập Production

### Hằng tháng

- [ ] `sudo certbot certificates` — hạn cert > 30 ngày
- [ ] Rà cảnh báo ồn
- [ ] Cập nhật runbook với sự cố mới

## 7. Dấu hiệu cần DỪNG hệ thống ngay

- [ ] Nghi rò rỉ PII đang tiếp diễn (CCCD, SĐT — dữ liệu phải AES-256 at-rest, mask trong log)
- [ ] Ghi sai dữ liệu tài chính không đảo ngược được: khách **đã thu tiền** mà không được cấp hợp đồng hàng loạt, hoặc hợp đồng + SMS đã bắn trong khi đơn không đổi trạng thái (hợp đồng mồ côi — LESSONS §1)
- [ ] Hệ thống bị tấn công không kiểm soát được
- [ ] Sự cố lan sang hệ thống đối tác dùng chung dữ liệu (Ví X, NCC)

Người có quyền ra lệnh dừng: **Tech Lead, Security Lead, hoặc PM** (theo mức S1). Sau khi dừng: báo PM + PO, ghi mốc thời gian, **không xoá dữ liệu/log**, không chạy `reset-all.sh`.

## 8. Nguồn tham chiếu

- Deployment Checklist 2026-06-17 — Phase 6, 11, 12, 13, Known Pitfalls, Verification Commands, Phase 15
- Runtime Health Check Checklist 2026-06-17 — mục A–F
- `k8s/README.md` — quy trình 3 bước, routing matrix, troubleshoot
- `LESSONS.md` §4, §7.1–§7.5, §11
- Scripts: `redeploy-all.sh`, `redeploy-miniapp.sh`, `pull-all-services.sh`, `switch-infra-config.sh`, `reset-all.sh`
- Google SRE Book — Emergency Response — https://sre.google/sre-book/emergency-response/
- Template gốc: `templates/bo-sung/runbook.md`

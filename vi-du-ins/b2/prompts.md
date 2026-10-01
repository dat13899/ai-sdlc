> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/prompts.md

# prompts.md — Thư viện Prompt theo giai đoạn (INS Platform)

**Dùng cho:** B2, dùng xuyên suốt B3–B14 · **Owner:** Tech Lead (A) · BA (R cho prompt nghiệp vụ) · AI (draft)

> Nguồn: prompt thật `documents/PROMPT_GENERATE_TSD.md` (1447 dòng — bản dưới đây là bản rút gọn dùng được, giữ đủ các ràng buộc cứng) và chỉ dẫn cho AI trong `CLAUDE.md`, `RULES.md §G`, `RULES_ANGULAR.md §K`, `SonarClean.md`, `LESSONS.md`. Giai đoạn nào dự án chưa có prompt thì ghi TODO, không tự viết thêm.

## Nguyên tắc chung cho mọi prompt (theo quy chuẩn dự án)

| Nguyên tắc | Nội dung ở INS |
|---|---|
| Nêu vai trò | Prompt TSD mở đầu bằng "Software Architect kiêm Senior Backend/Angular Engineer" |
| Neo vào nguồn | Bắt AI đọc **toàn bộ** SRS baseline + 8 template + `CLAUDE.md`/`Architecture.md`/`RULES.md` trước khi viết; mỗi quyết định phải trích nguồn cụ thể (VD "SRS 'Đăng ký' bước 6 + RULES.md §Dependency Rule + template-05 §3.2") |
| Quy chuẩn thắng yêu cầu | Rule mâu thuẫn với yêu cầu user → ưu tiên rule hoặc hỏi lại. Rule mâu thuẫn nhau (Java): `Architecture.md §2` > security > performance > style. (Angular): security > architecture > performance > style |
| Yêu cầu nêu điểm chưa chắc | TSD có mục "Open question / Trade-off lớn" để human review; chỉ hỏi user khi không tự quyết được dựa trên quy chuẩn |
| Chống scope creep | CẤM thêm cột DB / field DTO ngoài SRS; muốn thêm phải BA confirm + ghi Open Issue |
| Không đưa dữ liệu thật | CẤM nhúng domain/IP/host môi trường dev/staging vào tài liệu — chỉ dùng placeholder `${ENV_VAR}`; test data dùng Faker, không CCCD/SĐT thật |

---

## B3 — Thu thập & phân tích yêu cầu (BRD)

> TODO: dự án chưa có prompt B3 — cần BA bổ sung (SRS do BA viết tay; nguồn không lưu prompt transcript → BRD / vẽ luồng / lint BRD).

---

## B4 — Đặc tả chi tiết (spec.md)

> TODO: dự án chưa có prompt B4 — cần BA/Tech Lead bổ sung. Tài liệu đặc tả thực tế (VD `FLOW_Huy_Don_Hang.md`) dùng quy ước nhãn `[SRS]` / `[INFER]` / `[CODE]` / `[GAP]` cho từng dòng — nên đưa quy ước này vào prompt khi viết.

---

## B6 — Thiết kế kiến trúc (TSD per service, plan, ADR, OpenAPI)

### P-B6-01 · Sinh ADR

> TODO: dự án chưa có prompt sinh ADR riêng — cần Tech Lead bổ sung. Quy ước đã có (đưa vào prompt khi viết): tên `ADR-<SERVICE>-NN-<slug>`, khuôn MADR 5 mục (Bối cảnh / Các lựa chọn đã xem xét / Quyết định / Hệ quả / Tương thích kiến trúc), ADR cũ không xoá mà set `Superseded by`, ADR critical phải `Accepted` trước go-live.

### P-B6-02 · Sinh OpenAPI

> TODO: dự án chưa có prompt OpenAPI riêng — OpenAPI hiện sinh dạng fragment inline trong file `06_data-and-api-design.md` của P-B6-03.

### P-B6-03 · Sinh bộ TSD cho một service (rút gọn từ `PROMPT_GENERATE_TSD.md`)

```text
Vai trò: Bạn là Software Architect kiêm Senior Backend/Angular Engineer của INS Platform
— Insurance Middleware Platform kiến trúc MACH, 15 microservice Java 21 + Spring Boot 3.5
+ shared lib ins-common; mỗi service Maven 3 module Clean/Hexagonal (domain ← application ← adapter).

INPUT (đọc HẾT trước khi viết, không bỏ bước nào):
- Tên service: {{SERVICE_NAME}}   (VD ins-policy-service — đúng tên folder, đúng hậu tố -service theo HLD)
- Toàn bộ SRS baseline: <SRS_BASELINE>/*.docx — trích actor, pre/postcondition, main/alt flow,
  validation, error code, acceptance criteria, NFR
- 8 template: documents/template-01…08-*.pdf (mỗi file TSD ánh xạ 1-1 với 1 template)
- Quy chuẩn: CLAUDE.md, Architecture.md, RULES.md (43 rule PL03 + checklist PL04),
  RULES_ANGULAR.md (PL05), documents/Quy_chuan_thiet_ke_CSDL.pdf
- Source code hiện có của {{SERVICE_NAME}} (khảo sát trước khi đề xuất design)

YÊU CẦU:
1. Lập bảng mapping SRS ↔ Service ↔ Feature, phủ 100% SRS đã đọc (SRS không liên quan
   vẫn ghi 1 dòng "không liên quan"). Chỉ deep-dive phần của {{SERVICE_NAME}};
   phần service khác ghi "delegated to ins-xxx-service".
2. Sinh ĐÚNG 9 file vào documents/tsd/{{SERVICE_NAME}}/:
   00_overview · 01_architecture-design · 02_security-design · 03_domain-design ·
   04_event-driven-design · 05_application-design · 06_data-and-api-design ·
   07_testing-design · 08_coding-standards. Mỗi file gom theo feature area.
3. Viết theo thứ tự 03 → 05 → 06 → 04 → 02 → 01 → 07 → 08, rồi quay lại 00
   điền tóm tắt deliverable + open question.
4. 06_data-and-api-design: ER Mermaid + DDL MariaDB CREATE TABLE đầy đủ (BINARY(16) UUID v7,
   tenant_id, created/updated/deleted_time, utf8mb4, snake_case, IF NOT EXISTS), index cho
   mọi query nghiệp vụ + FK, seed ON DUPLICATE KEY UPDATE, COMMENT cho MỌI cột và bảng
   (tác dụng, đơn vị, enum hợp lệ, reference, JSON schema rút gọn), OpenAPI 3 fragment
   per endpoint, lỗi theo RFC 7807 ProblemDetail.
5. Ràng buộc cứng phải thể hiện trong TSD: tiền VND = Long; timestamp +07:00 qua DTime;
   response ApiResponse.of(...); Transactional Outbox (aggregate + outbox cùng @Transactional
   ở Facade, UseCase KHÔNG @Transactional); domain event emit từ aggregate; event envelope
   snake_case; Idempotency-Key cho mọi POST/PUT/DELETE (Valkey TTL 48h); realm
   customer / tenant-admin / internal; JaCoCo LINE ≥ 80% + BRANCH ≥ 80% (domain ≥ 90%);
   Sonar + OWASP dependency-check (failBuildOnCVSS=7); state machine cho mọi aggregate có
   status; NFR ≥ 12 NFR ID dạng bảng; tech stack PIN đúng patch version.
6. Mỗi quyết định kỹ thuật: 1–2 câu lý do + 1 dòng alternative đã loại + trích nguồn.
7. Áp dụng bộ "Lessons learned" của các vòng review TSD trước (unique trên cột soft-delete
   dùng generated column, check tồn tại đủ mọi field unique, error code riêng cho từng
   trạng thái, circuit breaker cho từng external, test cross-tenant 4 kịch bản, test JWT
   6 kịch bản, không Lombok @Data trên JPA entity…).

ĐỊNH DẠNG OUTPUT:
- Mỗi file: frontmatter YAML (title, version, date, status DRAFT|REVIEW|APPROVED, owner,
  service, template_ref, upstream) + H1 duy nhất + mục "Liên kết chéo" + mục "Self-Check"
  10 dòng ở cuối.
- Tiếng Việt có dấu cho diễn giải, thuật ngữ kỹ thuật giữ tiếng Anh; RFC 2119 MUST/SHOULD/MAY
  in hoa, bold.
- Diagram Mermaid inline; code mẫu ≤ 30 dòng/snippet.
- Trả lời trong chat CHỈ gồm: link 9 file + tóm tắt 8–15 dòng (số SRS/feature area cover,
  số bảng/endpoint/event/topic mới, điểm cần human review) + câu hỏi nếu thật sự cần.

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không sinh artifact ngoài 9 file MD (openapi.yaml, asyncapi.yaml, trace-matrix, *.puml,
  realm json, sonar-project.properties, CHANGELOG, README, tên file migration V<n>__*.sql).
- Không đề xuất thiết kế vi phạm CLAUDE.md / RULES.md / RULES_ANGULAR.md; SRS mâu thuẫn
  quy chuẩn → flag ở 00_overview và đề xuất phương án.
- Không hardcode secret, domain, IP, host dev/staging — chỉ ${ENV_VAR}.
- Không ghi version mơ hồ (3.5.x, latest).
- Không thêm cột/field ngoài phạm vi SRS.
- Không dán toàn bộ nội dung TSD vào chat.
```

**Kiểm dữ liệu trước khi dán:** SRS có thể chứa dữ liệu mẫu cá nhân — kiểm theo `data-classification.md` trước khi đưa vào tool.

---

## B8 — Sinh / sửa code

> Nguồn không có prompt văn bản riêng cho B8; hai khối dưới đây dựng lại **nguyên ý** từ chỉ dẫn AI đã có trong `CLAUDE.md`, `RULES.md §G`, `SonarClean.md` và `LESSONS.md §0, §8`.

### P-B8-01 · Sinh / sửa Java backend

```text
INPUT: yêu cầu thay đổi + RULES.md + SonarClean.md (dán/nhắc 2 file này mỗi lần sinh code Java)

YÊU CẦU:
1. Tuân thủ tuyệt đối RULES.md và SonarClean.md kể cả khi user không nhắc.
2. Luồng Controller → Facade → Port → UseCase → Repository; UseCase không là Spring bean.
3. Trong facade/use case: nạp entity → TẤT CẢ guard (trạng thái, tenant, quyền,
   idempotency) → gọi ngoài (REST/Kafka) → ghi DB.
4. Implement lại nghiệp vụ đã có ở chỗ khác → liệt kê từng guard của đường cũ trước,
   ưu tiên tái dùng hàm chung.
5. Đụng @Entity/DDL → kiểm ddl-auto của đúng service đó trước.

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không @SuppressWarnings("java:S…") / "unchecked" / // NOSONAR — phải fix gốc
  (ngoại lệ duy nhất đã ghi nhận: S4502 CSRF).
- Sửa Sonar: chỉ sửa đúng issue được dán vào, không tự grep quét thêm rồi sửa.
- Không chạy spotless:apply toàn repo; không git add -A (worktree dùng chung).
- Rule mâu thuẫn yêu cầu → ưu tiên rule hoặc hỏi lại.
```

### P-B8-02 · Sinh / sửa Angular client

```text
INPUT: yêu cầu thay đổi + RULES_ANGULAR.md

YÊU CẦU: Component (presentation) → Service (business) → ApiClient/Store (data), không gọi
HTTP từ component; mọi text qua @ngx-translate; magic string/number vào *.constants.ts /
*.enums.ts; chỉ dùng ===/!==; date picker lưu ISO, chỉ format dd/MM/yyyy khi hiển thị.

ĐIỀU KHÔNG ĐƯỢC LÀM: không dùng any; không sửa app stale (chỉ ins-miniapp-fe và ins-cms-fe
là source thật).
```

---

## B9 — Sinh unit test

> TODO: dự án chưa có prompt sinh test — cần Tech Lead bổ sung. Quy tắc đo lường đã có để đưa vào prompt: chạy RIÊNG lớp test của use case vừa sửa, so sánh kết quả theo danh tính test chứ không theo số lượng, đọc số từ dòng `Tests run:` trong khối `[INFO] Results:` của từng module (LESSONS §5).

---

## B10 — Review code tầng 1 (AI)

### P-B10-01 · Review theo checklist dự án

> Dựng lại từ `RULES.md §G.4`, checklist PL04/PL05 và `LESSONS.md §0–§4` (nguồn không có prompt văn bản riêng).

```text
INPUT: diff + RULES.md (PL03/PL04) hoặc RULES_ANGULAR.md (PL05) + LESSONS.md §0

YÊU CẦU:
1. Báo mọi vi phạm rule Bắt Buộc kèm file + dòng + cách sửa đề xuất (không tự lờ đi).
2. Đọc từng method TỪ DƯỚI LÊN, hỏi "guard này còn cứu được gì nếu dòng trên đã chạy?".
3. Quét riêng nhóm lỗi im lặng: lệch snake_case/camelCase khi (de)serialize,
   catch(Exception) biến 400 thành 500, hàm *BestEffort nuốt lỗi, config không bean nào đọc,
   fallback che lỗi.
4. Kết luận "code chết" chỉ khi đã truy theo tên PORT, grep FE không phân biệt hoa thường,
   kiểm route gateway, @KafkaListener và seed SQL.

ĐIỀU KHÔNG ĐƯỢC LÀM: không tự sửa code; không kết luận "sạch" mà không liệt kê đã kiểm gì.
```

---

## B13 — Release

> TODO: dự án chưa có prompt sinh CHANGELOG/Release Note — cần Tech Lead bổ sung. Quy ước commit đã có: Conventional Commits `<type>(<scope>): <mô tả>`, footer có mã ticket.

---

## Lịch sử thay đổi prompt

| Ngày | Prompt | Thay đổi | Vì sao | Người sửa |
|---|---|---|---|---|
| 2026-05 → 2026-06 | P-B6-03 (bản gốc) | Bổ sung các mục "Lessons learned" Round-2, Round-3, Round-3/4 sau mỗi vòng review TSD (identity, policy, cms, product, purchase, notification, promotion, insurer-partner, insurer-adaptor, TXM) | Mỗi vòng review phát hiện lỗi lặp lại → đưa thành ràng buộc cho service sau | Tech Lead |
| — | P-B6-03 | Chuyển phạm vi TSD từ "theo feature" sang "theo service" | Một service gom nhiều tính năng rải ở nhiều SRS | Tech Lead |

> ⚠️ **Điểm cần sửa trong prompt gốc (phát hiện khi rút gọn):**
> - Mục vai trò ghi "16 microservice", trong khi mục khác bắt "HLD service count 15, KHÔNG ghi 16".
> - Wording outbox chuẩn nhắc "Debezium CDC tự pickup từ binlog", trong khi tài liệu tham chiếu ghi Phase 1 dùng polling relay, Debezium defer (ADR-POL-06).
> - Event envelope: một chỗ ghi "9 field bắt buộc" nhưng liệt kê 11 field; chỗ khác đòi `event_version` thay cho `version`.
> - Quy tắc path `/api/v1/{resource}` khác path thật đang chạy dạng `/ins/<service>/public/v1/...`.
> - Đường dẫn tuyệt đối trỏ tới máy cá nhân của một thành viên — nên đổi thành placeholder.
>
> TODO: cần Tech Lead chốt và sửa bản gốc.

## Checklist dựng prompts.md

- [ ] Có prompt cho mọi giai đoạn AI tham gia — **mới có B6 (TSD), B8, B10**; B3, B4, B9, B13 còn TODO
- [x] Mỗi prompt ghi rõ Input / Yêu cầu / Định dạng output / Điều KHÔNG được làm
- [x] Có yêu cầu "nêu chỗ chưa chắc" (Open question trong TSD) và chống bịa (trích nguồn, chống scope creep)
- [x] Có neo "đọc hết nguồn trước khi viết"
- [x] Có ghi chú kiểm `data-classification.md` trước khi dán dữ liệu
- [ ] Lịch sử thay đổi ghi theo từng lần sửa có ngày cụ thể — TODO: bản gốc không lưu ngày từng lần sửa — cần Tech Lead bổ sung

## Nguồn tham chiếu

- `documents/PROMPT_GENERATE_TSD.md` — prompt sinh TSD per service (tài liệu nội bộ)
- `documents/TSD_TEMPLATES_SUMMARY.md` — tóm tắt 8 template TSD
- `CLAUDE.md`, `RULES.md §G`, `RULES_ANGULAR.md §K`, `SonarClean.md`, `LESSONS.md`

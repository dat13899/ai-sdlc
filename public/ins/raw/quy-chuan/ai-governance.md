> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/quy-chuan/ai-governance.md

# Quản trị rủi ro AI — INS Platform

**Dùng cho:** B2 (chính sách), B6/B8/B10 (biện pháp kỹ thuật), B14 (cập nhật bài học) · **Owner:** Tech Lead (A/R) · Security Lead (R) · PM (I)

> **Phạm vi dữ liệu nguồn:** dự án chưa có tài liệu quản trị AI riêng. Nội dung dưới đây chỉ lấy từ các chỉ dẫn cho AI đang có trong repo: `CLAUDE.md` (workspace + backend), `RULES.md §G`, `RULES_ANGULAR.md §K`, `SonarClean.md`, `PROMPT_GENERATE_TSD.md` và `LESSONS.md` (rút từ 141 memory của các phiên làm việc với AI). Phần nào không có dữ liệu để TODO.

## 1. Nguyên tắc nền

| Nguyên tắc | Nội dung ở INS | Nguồn |
|---|---|---|
| Quy chuẩn thắng yêu cầu | AI không được sinh code vi phạm bất kỳ rule Bắt Buộc nào, kể cả khi user không nhắc. Rule mâu thuẫn yêu cầu → ưu tiên rule hoặc hỏi lại user | `CLAUDE.md`, `RULES.md §G` |
| Đọc quy chuẩn trước khi sinh | Mỗi lần sinh/sửa Java phải tham chiếu `RULES.md` + `SonarClean.md`; Angular phải tham chiếu `RULES_ANGULAR.md`; trước thay đổi không nhỏ phải đọc `LESSONS.md` | `CLAUDE.md` |
| Không né công cụ kiểm | CẤM `@SuppressWarnings("java:S…")` / `"unchecked"` / `// NOSONAR` để qua Sonar; gặp suppress cũ trong file đang sửa → gỡ và fix thật | `SonarClean.md` |
| Review có sẵn thì phải báo | Phát hiện vi phạm trong code có sẵn → cảnh báo user + đề xuất sửa, không tự lờ đi | `RULES.md §G.4` |
| Máy chặn, không chỉ người nhớ | Output AI phải qua ArchUnit (build fail), Sonar Quality Gate `INS-Gate` (chặn MR), JaCoCo ≥ 80%, OWASP dependency-check | `standards-index.md` |
| Không đưa dữ liệu môi trường thật vào tài liệu AI sinh | TSD do AI sinh CẤM chứa domain/IP/host dev/staging, secret — chỉ `${ENV_VAR}`; test data dùng Faker | `PROMPT_GENERATE_TSD.md §4.14, §1.5.6` |
| AI không giữ vai trò A | TODO: dự án chưa có RACI ghi rõ AI — cần PM bổ sung. RACI hiện có chỉ gồm Tech Lead / Backend / Frontend / BA / DevOps / Security | — |
| Công cụ qua danh sách duyệt | TODO: dự án chưa có danh sách công cụ AI đã duyệt — cần Tech Lead + ATTT bổ sung | — |

## 2. OWASP LLM Top 10 — đủ 10 rủi ro và biện pháp

> Dự án **chưa có tính năng sản phẩm gọi LLM**; bảng dưới áp cho việc **dùng AI trong quá trình phát triển** (agentic coding, sinh TSD).

| # | Rủi ro | Mô tả ngắn | Biện pháp đang có ở INS | Bước | Ai chịu |
|---|---|---|---|---|---|
| LLM01 | Prompt Injection | Chỉ dẫn độc hại lẫn trong input/dữ liệu | TODO: dự án chưa có — cần Tech Lead bổ sung (chưa có quy định đọc/duyệt file chỉ dẫn agent của bên thứ ba) | B2, B8 | Tech Lead |
| LLM02 | Insecure Output Handling | Dùng output AI mà không kiểm | Code AI sinh phải qua ArchUnit + Sonar gate + review PR ≥ 2 người (1 peer + 1 Tech Lead) | B8, B10 | Dev + Tech Lead |
| LLM03 | Training Data Poisoning | Nguồn dữ liệu cho AI sai | Cảnh báo nguồn không đáng tin: DDL trong `TSD/sql_scripts/` không phải nguồn sự thật; `TSD/db-table-audit.csv` sai ≥ 7 chỗ; `README.md` stale một phần → AI phải tự truy code | B6, B8 | Tech Lead |
| LLM04 | Model Denial of Service | Chi phí/độ trễ tăng vọt | TODO: dự án chưa có — cần DevOps bổ sung | B13, B14 | DevOps |
| LLM05 | Supply Chain Vulnerabilities | Dependency có CVE/license xấu | OWASP dependency-check `failBuildOnCVSS=7`; tech stack PIN đúng patch version, cấm `latest` | B10, B13 | Tech Lead |
| LLM06 | Sensitive Information Disclosure | Prompt/log/tài liệu lộ dữ liệu nhạy cảm | Cấm host/IP/secret trong tài liệu AI sinh; PII mask trong log; test data Faker, không CCCD/SĐT thật. TODO: chưa có quy định dữ liệu nào được dán vào prompt — cần Security Lead bổ sung | B2, B6 | Security Lead |
| LLM07 | Insecure Plugin Design | Tool/agent có quyền rộng | TODO: dự án chưa có — cần Tech Lead bổ sung | B2 | Tech Lead |
| LLM08 | Excessive Agency | Agent tự làm hành động rộng hơn yêu cầu | Cấm `git add -A` (worktree dùng chung — đã từng commit nhầm việc người khác, đã push không rút lại được); cấm `spotless:apply` không giới hạn (từng reflow 120 file không liên quan); sửa Sonar chỉ sửa đúng issue được dán, không tự quét thêm | B8 | Tech Lead |
| LLM09 | Overreliance | Tin kết luận/báo cáo của AI | Kết luận "code chết" phải chứng minh đủ (truy theo port, grep FE không phân biệt hoa thường, kiểm route/listener/seed); số test đọc từ `[INFO] Results:` từng module, so theo danh tính test; chạy riêng lớp test của use case vừa sửa | B9, B10 | Dev |
| LLM10 | Model Theft | Lộ key/model/system prompt | TODO: dự án chưa có — cần Security Lead bổ sung | B2 | Security Lead |

## 3. NIST AI RMF — 4 chức năng áp ở cấp dự án

| Chức năng | Việc cụ thể đang có ở INS | Đầu ra |
|---|---|---|
| **Govern** | Chỉ dẫn bắt buộc cho AI đặt trong repo (`CLAUDE.md` ở workspace và repo backend, trỏ tới `RULES.md`, `RULES_ANGULAR.md`, `SonarClean.md`, `LESSONS.md`) | Các file trên |
| **Map** | TODO: dự án chưa có — cần Tech Lead bổ sung (chưa có bảng AI dùng ở bước nào, dữ liệu nào đi vào AI) | — |
| **Measure** | Đo gián tiếp qua gate: Sonar new code (Bugs Blocker+Critical = 0, Vulnerabilities = 0, Coverage ≥ 80%), mốc test đỏ sẵn theo service, số vi phạm `ArchitectureTest` làm mốc (tăng = hồi quy). TODO: chưa có KPI riêng cho AI | `LESSONS.md §5.4` |
| **Manage** | Vòng phản hồi thật: (1) mỗi vòng review TSD sinh bằng prompt → finding được rút thành "Lessons learned" nạp lại vào `PROMPT_GENERATE_TSD.md` cho service sau (VD 73 finding của TSD identity-service → 24 pattern); (2) sự cố khi làm việc với AI → memory → rút thành quy tắc trong `LESSONS.md` | `PROMPT_GENERATE_TSD.md §1.5`, `LESSONS.md` |

## 4. Bảng tổng hợp rủi ro AI theo bước quy trình

| Rủi ro AI | Bước liên quan | Biện pháp | Ai chịu trách nhiệm |
|---|---|---|---|
| AI sinh TSD vượt phạm vi SRS (thêm cột/field, thêm tính năng) | B6 | Prompt TSD cấm scope creep; bắt bảng mapping phủ 100% SRS; mỗi quyết định trích nguồn + alternative đã loại | Tech Lead |
| AI sinh code vi phạm kiến trúc/convention | B8 | `CLAUDE.md` bắt đọc RULES/SonarClean; ArchUnit chặn build | Tech Lead |
| AI né Sonar bằng suppress, hoặc tự "dọn" thêm rồi đẻ lỗi mới | B8, B10 | Chính sách không suppress; chỉ sửa đúng issue được dán (tách hằng `fallbackMethod` từng đẻ ra S1144 đòi xoá fallback circuit-breaker) | Dev |
| AI đọc/sửa nhầm repo bản cũ | B8 | Chỉ làm ở repo chính; app FE thật chỉ là `ins-miniapp-fe` và `ins-cms-fe`, bản `ins-client` stale không được sửa; clone cũ chậm 339 commit đã gây kết luận sai 2 lần | Tech Lead |
| Công cụ tìm kiếm của AI "mù" một phần | B8, B10 | Grep tool bỏ qua cây Java do `.gitignore` → dùng `rg --no-ignore -g '*.java'`; grep FE luôn `-i` | Dev |
| Công cụ ghi file của AI đổi line ending | B8 | Edit/Write tool từng ghi lại toàn bộ file thành CRLF → prettier báo lỗi mọi dòng; kiểm `grep -c $'\r$'` | Dev |
| AI viết nhánh xử lý thứ hai làm mất guard | B8, B10 | Checklist LESSONS §0–§2: liệt kê guard của đường cũ trước khi viết nhánh mới, ưu tiên tái dùng hàm chung (ca thật: 5/5 guard bị mất ở nhánh cấp HĐ viết lại) | Dev + Tech Lead |
| AI báo cáo số test sai | B9 | Không dùng `awk` trên surefire `.txt` (đếm thiếu với `@Nested` tên tiếng Việt); `-Dmaven.test.failure.ignore=true`; `clean` trước khi đọc kết quả | Dev |
| Dữ liệu môi trường thật lọt vào tài liệu | B6 | Cấm host/IP/secret trong TSD; chỉ placeholder | Security Lead |

## 5. ISO/IEC 42001 — áp ở mức nào

> TODO: dự án chưa có — cần PM + Security Lead bổ sung (chưa có đánh giá hay quyết định áp dụng ISO/IEC 42001).

## 6. Quy trình duyệt công cụ AI mới

> TODO: dự án chưa có quy trình duyệt công cụ AI — cần Tech Lead + ATTT bổ sung. Công cụ đang thấy dùng thực tế: Claude Code, skill `/seqdiag` (xem `standards-index.md §2`), chưa có hồ sơ đánh giá ZDR / vùng lưu trữ dữ liệu.

## 7. Checklist tuân thủ (rà soát định kỳ)

- [ ] Mọi tool AI đang dùng có trong `ai-tool-scope.md` và đã qua đánh giá bảo mật dữ liệu — **chưa**
- [x] Không có secret/host/IP trong tài liệu AI sinh — có quy định trong prompt TSD (cần kiểm định kỳ trên file thật)
- [ ] Dữ liệu gửi vào AI đúng mức phân loại — **chưa có** `data-classification.md` cho việc dùng AI
- [ ] `tool-permissions.md` theo môi trường — **chưa có**; mới có các lệnh cấm cụ thể (`git add -A`, `spotless:apply` toàn repo)
- [ ] Có người chịu trách nhiệm cuối cho mọi đầu ra AI — PR ≥ 2 reviewer, nhưng chưa ghi thành RACI có AI
- [x] Có vòng cập nhật bài học AI vào quy chuẩn (`LESSONS.md`, Lessons learned trong prompt TSD)
- [x] Có chính sách không né công cụ kiểm (không suppress Sonar)
- [ ] Chi phí AI có ngân sách và cảnh báo — TODO: dự án chưa có

## Nguồn tham chiếu

- `CLAUDE.md` (workspace + repo backend), `RULES.md §G`, `RULES_ANGULAR.md §K`, `SonarClean.md`, `LESSONS.md` — tài liệu nội bộ
- `documents/PROMPT_GENERATE_TSD.md` — §1.5 Lessons learned, §4 yêu cầu chất lượng
- OWASP LLM Top 10 — https://genai.owasp.org/llm-top-10/
- NIST AI Risk Management Framework — https://www.nist.gov/itl/ai-risk-management-framework
- ISO/IEC 42001:2023 — https://www.iso.org/standard/81230.html

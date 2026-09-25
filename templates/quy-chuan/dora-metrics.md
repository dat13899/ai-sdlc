---
title: Chỉ số DORA & KPI chất lượng
for: B14 — Vận hành & cải tiến; đo liên tục từ B8 trở đi
owner: Tech Lead (A/R) · DevOps/Ops (R) · PM (C)
nguồn: AI-SDLC v5.9 mục 8 (KPI theo dõi hiệu quả); DORA / Google Cloud; DORA State of DevOps
---

# Chỉ số DORA & KPI chất lượng

> **Cách dựng:** DevOps/Ops cấu hình thu thập tự động trong CI/CD từ B8 trở đi; Tech Lead báo cáo ở Retrospective/Post-mortem (B14). Mục 8 của tài liệu gốc nêu 4 KPI — file này định nghĩa cách đo được chúng và bổ sung 4 chỉ số DORA làm nền tảng.

## 1. Bốn chỉ số DORA

### 1.1 Deployment Frequency — tần suất triển khai

| Trường | Nội dung |
|---|---|
| Định nghĩa | Số lần triển khai thành công lên Production trong một khoảng thời gian |
| Cách đo | Đếm số lần release thành công ÷ số ngày. Nguồn: log CI/CD pipeline, tag git, lịch sử deploy |
| Nguồn dữ liệu | CI/CD (GitHub Actions / GitLab CI), tag release, deployment log |
| Vì sao quan trọng | Tần suất thấp = lô thay đổi lớn = rủi ro cao mỗi lần deploy |

| Mức | Tần suất |
|---|---|
| Elite | Nhiều lần/ngày (on-demand) |
| High | 1 lần/ngày → 1 lần/tuần |
| Medium | 1 lần/tuần → 1 lần/tháng |
| Low | < 1 lần/tháng |

### 1.2 Lead Time for Changes — thời gian từ code đến Production

| Trường | Nội dung |
|---|---|
| Định nghĩa | Thời gian từ lúc commit được tạo đến lúc commit đó chạy trên Production |
| Cách đo | (Thời điểm deploy Production) − (Thời điểm commit đầu tiên của thay đổi). Lấy trung vị (median), không lấy trung bình — tránh bị lệch bởi ngoại lệ |
| Nguồn dữ liệu | git log + deployment log, nối bằng commit SHA |
| Vì sao quan trọng | Lead time dài = thay đổi nằm chờ lâu = khó truy vết khi có sự cố |

| Mức | Thời gian |
|---|---|
| Elite | < 1 giờ |
| High | 1 ngày → 1 tuần |
| Medium | 1 tuần → 1 tháng |
| Low | > 1 tháng |

> **KPI riêng của tài liệu gốc — "Lead time từ Spec đến Code merge":** đo từ khi spec được ký (Gate 1) đến khi PR cuối cùng của tính năng đó được merge. Đây là chỉ số đo hiệu quả của cả quy trình AI-SDLC, không chỉ của khâu deploy.

### 1.3 Change Failure Rate — tỷ lệ thay đổi gây lỗi

| Trường | Nội dung |
|---|---|
| Định nghĩa | Tỷ lệ % thay đổi lên Production gây ra suy giảm dịch vụ và cần khắc phục (hotfix, rollback, patch) |
| Cách đo | (Số lần deploy gây sự cố ÷ Tổng số lần deploy) × 100 |
| Nguồn dữ liệu | Deployment log + danh sách incident/hotfix (mục 3 tài liệu gốc) |
| Vì sao quan trọng | Đo chất lượng thật của quy trình kiểm thử và review |

| Mức | Tỷ lệ |
|---|---|
| Elite | 0–5% |
| High | 5–10% |
| Medium | 10–15% |
| Low | > 15% |

### 1.4 Time to Restore Service — thời gian khôi phục dịch vụ

| Trường | Nội dung |
|---|---|
| Định nghĩa | Thời gian từ khi sự cố bắt đầu ảnh hưởng người dùng đến khi dịch vụ hoạt động bình thường trở lại (đã xử lý xong hoặc rollback) |
| Cách đo | (Thời điểm khôi phục) − (Thời điểm bắt đầu ảnh hưởng). Ghi trong post-mortem mục 3 (dòng thời gian) |
| Nguồn dữ liệu | Post-mortem, incident log, cảnh báo monitoring |
| Vì sao quan trọng | Đo năng lực phản ứng, phụ thuộc Runbook và khả năng rollback |

| Mức | Thời gian |
|---|---|
| Elite | < 1 giờ |
| High | < 1 ngày |
| Medium | 1 ngày → 1 tuần |
| Low | > 1 tuần |

## 2. Chỉ số chất lượng bổ sung

### 2.1 Escaped Defects — lỗi lọt ra sau UAT

| Trường | Nội dung |
|---|---|
| Định nghĩa | Số bug được phát hiện ở Production (hoặc sau khi UAT đã ký) mà lẽ ra phải bắt được ở B9/B11/B12 |
| Cách đo | Đếm bug report có trường "Môi trường phát hiện = PRODUCTION" trong PL5 (Bug Report) theo từng release |
| Nguồn dữ liệu | Bug tracker, trường Severity/Priority |
| Cách phân tích | Với mỗi escaped defect, ghi rõ **vì sao bị lọt**: thiếu test? thiếu AC? review bỏ sót? → đầu vào cho post-mortem |
| Ngưỡng gợi ý | Không có bug S1–S2 lọt; S3 trở xuống: theo dõi xu hướng, phấn đấu giảm dần |

**Chỉ số dẫn xuất hữu ích:** tỷ lệ escaped defects ÷ tổng defects. Tỷ lệ cao nghĩa là khâu kiểm thử nội bộ chưa hiệu quả, không phải "khách khó tính".

### 2.2 Mutation Score — chất lượng thật của test

| Trường | Nội dung |
|---|---|
| Định nghĩa | Tỷ lệ % các đột biến (mutation) do công cụ tạo ra bị test **phát hiện** (làm test fail) |
| Cách đo | Công cụ tự sửa code một chút (đổi dấu so sánh, đổi hằng số, xoá điều kiện) rồi chạy test suite. Mutation bị "giết" = test phát hiện được |
| Nguồn dữ liệu | Stryker (JS/TS), PIT (Java), mutmut (Python), cargo-mutants (Rust) |
| Vì sao quan trọng | Coverage cao nhưng mutation score thấp = test chạy qua code mà không kiểm chứng gì (đúng rủi ro của test do AI sinh — xem `rules/test-rules.md`) |
| Tần suất chạy | Hằng tuần hoặc trên module thay đổi nhiều (đắt hơn chạy unit test) |
| Ngưỡng gợi ý | ≥ 60% toàn dự án; ≥ 80% cho module lõi (thanh toán, phân quyền) |

### 2.3 KPI riêng cho việc dùng AI

| Chỉ số | Cách đo | Ngưỡng gợi ý |
|---|---|---|
| Tỷ lệ PR bị AI chặn lỗi trước khi tới người | Số PR có finding Critical/High do tầng 1 phát hiện ÷ tổng PR | Càng cao càng tốt — nghĩa là lưới lọc hoạt động (theo KPI mục 8 tài liệu gốc) |
| Thời gian tiết kiệm nhờ AI (ước lượng) | So sánh thời gian hoàn thành hạng mục có AI hỗ trợ vs. baseline | Ghi nhận, không dùng để đánh giá cá nhân |
| Chi phí AI trên mỗi release | Tổng chi phí API/seat ÷ số release | Theo ngân sách dự án; cảnh báo khi vượt ngưỡng (Runbook INC-09) |
| Tỷ lệ nội dung AI sinh bị phải sửa lại đáng kể | Số lần phải viết lại > 50% ÷ tổng số lần dùng AI ở bước đó | Nếu cao → prompt/`rules/` ở B2 chưa đủ tốt, cần cập nhật |

## 3. Ánh xạ vào mục 8 của tài liệu gốc

| KPI mục 8 tài liệu gốc | Đo bằng | Chỉ số nền |
|---|---|---|
| Lead time từ Spec đến Code merge (DORA metrics) | Gate 1 ký → PR cuối merge | 1.2 Lead Time for Changes |
| Tỷ lệ PR bị AI chặn lỗi trước khi tới người | Finding tầng 1 (B10) ÷ tổng PR | 2.3 KPI riêng cho AI |
| Escaped defects (bug lọt ra sau UAT) | Bug PRODUCTION trong PL5 ÷ release | 2.1 Escaped Defects |
| Mutation score đo chất lượng test | Công cụ mutation testing | 2.2 Mutation Score |

**Chỉ số nên bổ sung** (không có trong tài liệu gốc nhưng cần để đo toàn diện): Deployment Frequency, Change Failure Rate, Time to Restore Service — đặc biệt quan trọng vì quy trình này có Hypercare 1–2 tuần sau go-live, cần số liệu để biết Hypercare có hiệu quả không.

## 4. Thu thập tự động từ CI/CD

| Chỉ số | Cách thu thập | Ghi chú triển khai |
|---|---|---|
| Deployment Frequency | Đếm event "deploy Production success" trong pipeline | GitHub Actions: filter workflow `deploy-prod` |
| Lead Time for Changes | Nối commit SHA đầu tiên của PR với thời điểm deploy chứa nó | Cần ghi commit SHA vào metadata deploy |
| Change Failure Rate | Đối chiếu deploy với incident/hotfix trong cùng khung giờ | Cần gắn nhãn "hotfix" cho commit/PR |
| Time to Restore | Từ cảnh báo đầu tiên đến khi cảnh báo tự tắt | Dùng dữ liệu monitoring (Uptime Kuma / Prometheus) |
| Escaped Defects | Truy vấn bug tracker: môi trường = PRODUCTION | Cần trường môi trường bắt buộc trong PL5 |
| Mutation Score | Chạy mutation tool trong pipeline theo lịch (không mỗi commit) | Báo cáo riêng, không chặn merge |
| Coverage | Coverage report của test runner | Chặn merge nếu dưới ngưỡng (B9) |

**Gợi ý dashboard tối thiểu gồm 6 ô:** tần suất deploy, lead time, tỷ lệ deploy gây lỗi, thời gian khôi phục, escaped defects theo release, coverage/mutation score.

## 5. Cách dùng số liệu (quan trọng)

- **Đo để cải tiến, không để đánh giá cá nhân.** Dùng số liệu để tìm nút thắt quy trình; dùng để xếp hạng dev sẽ khiến người ta che số liệu.
- **Luôn xem xu hướng, không xem giá trị tuyệt đối một lần.** Một release có change failure rate 20% chưa nói lên gì; 5 release liên tiếp tăng mới là vấn đề.
- **Đặt mục tiêu theo bước nhỏ.** Đang ở mức Low thì mục tiêu tiếp theo là Medium, không phải Elite.
- **Nếu một chỉ số không dẫn tới hành động nào — bỏ nó đi.** Đo mà không ai dùng chỉ làm tốn thời gian thu thập.

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 8 (KPI theo dõi hiệu quả) — tài liệu gốc nội bộ
- DORA — DevOps Research and Assessment — https://dora.dev/
- DORA Four Key Metrics — https://dora.dev/guides/dora-metrics-four-keys/
- Google Cloud — DORA Metrics guide — https://cloud.google.com/devops
- Accelerate (Nicole Forsgren, Jez Humble, Gene Kim) — cơ sở nghiên cứu của 4 chỉ số DORA
- Stryker Mutator (mutation testing JS/TS, .NET, Scala) — https://stryker-mutator.io/
- PIT Mutation Testing (Java/JVM) — https://pitest.org/
- Google Testing Blog (coverage ≠ chất lượng test) — https://testing.googleblog.com/

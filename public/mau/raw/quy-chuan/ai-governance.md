---
title: Quản trị rủi ro AI
for: B2 (chính sách), B6/B10/B12 (biện pháp kỹ thuật), B14 (cập nhật bài học)
owner: Tech Lead (A/R) · Security Lead (R) · PM (I)
nguồn: AI-SDLC v5.9 mục 5 & 7; OWASP LLM Top 10; NIST AI RMF; ISO/IEC 42001
---

# Quản trị rủi ro AI

> **Cách dựng:** Tech Lead dựng ở B2 cùng lúc với `ai-tool-scope.md` và `data-classification.md`. File này trả lời câu hỏi: "Khi dùng AI trong dự án này, ta đang nhận những rủi ro nào và chặn bằng cách nào?"

## 1. Nguyên tắc nền

| Nguyên tắc | Nội dung |
|---|---|
| AI không giữ vai trò A (Accountable) | Theo RACI của quy trình: mọi kết quả cuối cùng do con người chịu trách nhiệm. AI chỉ draft/đề xuất/sinh nháp |
| Mặc định từ chối | Quyền mặc định của AI agent là **không được làm**; chỉ những hành động trong allowlist mới được tự động (`tool-permissions.md`) |
| Dữ liệu quyết định phạm vi | Loại dữ liệu (Public → Restricted) quyết định AI được chạm tới hay không (`data-classification.md`) |
| Minh bạch nguồn | Mọi nội dung AI sinh phải ghi rõ AI hỗ trợ + người kiểm (commit, tài liệu, PR) |
| Không bí mật trong prompt | Không đưa API key, tên khách hàng khác, know-how định giá vào prompt/skill.md dùng chung |
| Công cụ qua danh sách duyệt | Tool ngoài danh sách phải có phê duyệt của Tech Lead + An ninh thông tin |

## 2. OWASP LLM Top 10 — đủ 10 rủi ro và biện pháp

| # | Rủi ro | Mô tả ngắn | Biện pháp áp dụng trong quy trình này | Bước | Ai chịu |
|---|---|---|---|---|---|
| LLM01 | Prompt Injection | Kẻ tấn công chèn chỉ dẫn vào input/dữ liệu để AI làm việc khác ý định | Tách rõ dữ liệu người dùng và chỉ dẫn hệ thống; **Tech Lead đọc toàn bộ** `SKILL.md`/file chỉ dẫn của đối tác trước khi nạp (mục 7 tài liệu gốc — vector injection qua file cấu hình agent); kiểm output trước khi thực thi; không đặt bí mật trong system prompt | B2, B6, B10 | Tech Lead |
| LLM02 | Insecure Output Handling | Output của model được dùng trực tiếp (render HTML, chạy lệnh, ghép SQL) mà không kiểm | Escape theo ngữ cảnh; validate output theo schema; không `eval`/`exec`; coi output AI như input không tin cậy | B10 | Dev |
| LLM03 | Training Data Poisoning | Dữ liệu huấn luyện/RAG bị nhiễm nội dung sai hoặc độc hại | Kiểm nguồn dữ liệu; phân loại theo `data-classification.md`; truy vết nguồn cho mỗi mẩu dữ liệu RAG; kiểm chứng lại thông tin quan trọng | B2, B6 | Tech Lead |
| LLM04 | Model Denial of Service | Input cực dài/lặp làm tăng chi phí, độ trễ, cạn quota | Giới hạn độ dài input; rate limit theo tài khoản; timeout + circuit breaker; ngân sách chi phí AI theo ngày kèm cảnh báo | B6, B13, B14 | DevOps/Ops |
| LLM05 | Supply Chain Vulnerabilities | Model/thư viện/plugin AI từ nguồn không kiểm chứng; dependency có CVE hoặc license xấu | Chỉ dùng tool trong `ai-tool-scope.md`; quét CVE + license (FOSSA/Snyk) trước release; pin version; bật public-code duplication filter | B2, B13 | Tech Lead |
| LLM06 | Sensitive Information Disclosure | Prompt/log/response chứa dữ liệu Confidential/Restricted hoặc PII | Chỉ đưa Public/Internal vào prompt; masking/ẩn danh dữ liệu trước khi gửi; không log prompt chứa PII; chọn tool có Zero Data Retention | B2, B12 | Security Lead |
| LLM07 | Insecure Plugin Design | Tool/agent có quyền gọi API nội bộ với tham số không bị giới hạn | Allowlist tham số cho mỗi tool; kiểm quyền ở phía server của tool (không tin tham số agent gửi); least-privilege theo `tool-permissions.md` | B2, B6 | Tech Lead |
| LLM08 | Excessive Agency | Agent tự làm hành động nguy hiểm (xoá dữ liệu, gửi email, deploy) không cần người xác nhận | Phân mức tự chủ theo môi trường; hành động phá huỷ/không hoàn tác được phải có người xác nhận; mặc định deny | B2, B8 | Tech Lead |
| LLM09 | Overreliance | Tin output AI là đúng, không kiểm — code/số liệu sai vẫn vào sản phẩm | Human review bắt buộc trước merge; dev phải đọc test assert thay vì tin báo cáo AI; AI không giữ vai trò A trong RACI | B9, B10 | Dev + Tech Lead |
| LLM10 | Model Theft | Rò rỉ model tự huấn luyện, system prompt có giá trị, hoặc API key | Không commit key/model; phân quyền endpoint nội bộ; không trả system prompt ra client; xoay key định kỳ | B2, B10 | Security Lead |

## 3. NIST AI RMF — 4 chức năng áp ở cấp dự án

| Chức năng | Nghĩa | Việc cụ thể trong dự án này | Đầu ra |
|---|---|---|---|
| **Govern** | Thiết lập chính sách, vai trò, trách nhiệm về AI | Chính sách 2 tầng `skill.md`; danh sách tool được duyệt; phân vai RACI có AI; quy định "AI không giữ vai trò A" | `constitution.md`, `SKILL.md`, `ai-tool-scope.md`, `tool-permissions.md` |
| **Map** | Nhận diện bối cảnh, mục đích, đối tượng chịu ảnh hưởng của hệ thống AI | Xác định chỗ nào dùng AI trong 14 bước; dữ liệu nào đi vào AI; ai bị ảnh hưởng khi AI sai | Bảng ở mục 4 dưới đây + `threat-model-STRIDE.md` |
| **Measure** | Đo và theo dõi rủi ro | KPI: tỷ lệ PR bị AI chặn lỗi; escaped defects; mutation score; chi phí AI/ngày; số finding AI review bỏ sót | `dora-metrics.md` + dashboard vận hành |
| **Manage** | Xử lý, ưu tiên, giảm thiểu và khôi phục | Mức tự chủ theo môi trường; quy trình hotfix; post-mortem 48 giờ có mục "bài học về quy trình AI" cập nhật `constitution.md`/`rules/` | Runbook, post-mortem, ADR |

## 4. Bảng tổng hợp rủi ro AI theo bước quy trình

| Rủi ro AI | Bước liên quan | Biện pháp | Ai chịu trách nhiệm |
|---|---|---|---|
| AI hiểu sai domain → sinh spec sai | B3, B4 | BA rà soát loại bỏ tính năng AI tự chế ngoài phạm vi; Gate 1 do PO/PM ký | BA + PO |
| AI sinh code không tuân convention | B8 | AI đọc `constitution.md` + `CODING_CONVENTION.md` trước khi code; AI dừng hỏi khi mâu thuẫn tài liệu | Tech Lead |
| AI sinh unit test giả (luôn xanh) | B9 | `rules/test-rules.md`; dev đọc assert; mutation score | Dev |
| AI review tầng 1 bỏ sót lỗi bảo mật | B10 | `rules/code-review-rules.md` cụ thể hoá ASVS; SAST/secret scan song song; human review bắt buộc | Security Lead |
| AI sinh kiến trúc không phù hợp ("architecture by autocomplete") | B6 | Gate 2 — Tech Lead duyệt; Design Review phản biện; ADR phải nêu ≥ 2 phương án | Tech Lead |
| Bí mật công ty lọt vào skill.md dùng chung với đối tác | B2, B8 | Không đưa bí mật vào tài liệu dùng chung; Tech Lead đọc toàn bộ file chỉ dẫn đối tác | Tech Lead |
| Dữ liệu khách hàng gửi vào model dùng để train | B2, B6 | Chỉ dùng tool có Zero Data Retention cho dữ liệu Confidential; đánh giá bảo mật dữ liệu trước khi dùng | Security Lead |
| Dùng dữ liệu Production thật làm dữ liệu test | B12 | Chỉ dùng synthetic data hoặc dữ liệu đã masking/ẩn danh | Test Lead |
| Code AI sinh trùng mã nguồn công khai có license GPL | B8, B13 | Bật public-code duplication filter; quét license dependency; điều khoản hợp đồng nêu rõ trách nhiệm | Tech Lead + PM |
| Chi phí gọi model tăng vọt | B13, B14 | Ngân sách theo ngày + cảnh báo; rate limit; theo dõi trong Runbook (INC-09) | DevOps/Ops |
| Phụ thuộc quá mức vào AI, mất khả năng tự làm | B9, B14 | Mutation score đo chất lượng test thật; post-mortem nêu bài học quy trình AI; đào tạo định kỳ | PM + Tech Lead |

## 5. ISO/IEC 42001 — áp ở mức nào

ISO/IEC 42001 là chuẩn **hệ thống quản lý AI** ở cấp tổ chức (không phải cấp dự án). Với dự án phần mềm, áp dụng ở mức tương đương như sau:

| Yêu cầu của chuẩn (khái quát) | Việc dự án làm |
|---|---|
| Chính sách AI của tổ chức | Chính sách 2 tầng `skill.md` + danh sách tool được duyệt |
| Vai trò và trách nhiệm | RACI 14 bước × 7 vai trò; AI không giữ vai trò A |
| Đánh giá rủi ro AI | File này (`ai-governance.md`) + `threat-model-STRIDE.md` |
| Kiểm soát vận hành | `tool-permissions.md` theo môi trường; phân loại dữ liệu |
| Đánh giá tác động tới cá nhân/tổ chức | Kiểm tra khi hệ thống chạm dữ liệu cá nhân (Gate 4b — ATTT) |
| Cải tiến liên tục | Post-mortem 48 giờ, cập nhật `constitution.md`/`rules/` từ bài học B14 |

> Dự án quy mô vừa thường **không cần chứng nhận** ISO 42001 — mục đích là dùng nó như checklist để không bỏ sót hạng mục quản trị. Nếu khách hàng/đối tác yêu cầu chứng nhận, việc đó nằm ở cấp công ty, không phải cấp dự án.

## 6. Quy trình duyệt công cụ AI mới

```text
1. ĐỀ XUẤT   — Ai muốn dùng tool gì, cho việc gì, ở bước nào → ghi vào ticket
2. ĐÁNH GIÁ  — Tech Lead + An ninh thông tin kiểm 3 câu hỏi bắt buộc:
               (a) Dữ liệu gửi vào có bị dùng để train model không?
               (b) Có tuỳ chọn opt-out / Zero Data Retention không?
               (c) Dữ liệu lưu trữ ở khu vực địa lý nào?
3. PHÂN LOẠI — Tool dùng cho dữ liệu gì: Public / Internal / Confidential / Restricted
4. PHÊ DUYỆT — Có trong danh sách duyệt? Không → cần phê duyệt riêng của Tech Lead + ATTT
5. GHI NHẬN  — Thêm vào ai-tool-scope.md kèm trạng thái ZDR + ngày đánh giá + người đánh giá
6. RÀ SOÁT   — Định kỳ mỗi quý: tool còn đúng chính sách? License/cost còn phù hợp?
```

**Điều kiện chặn:** không được dùng tool ngoài danh sách cho dữ liệu Confidential/Restricted, kể cả chỉ để thử.

## 7. Checklist tuân thủ (rà soát định kỳ)

- [ ] Mọi tool AI đang dùng đều có trong `ai-tool-scope.md` và đã qua đánh giá bảo mật dữ liệu
- [ ] Không có bí mật/API key nào trong prompt, `skill.md`, hay tài liệu dùng chung với đối tác
- [ ] Dữ liệu gửi vào AI đúng mức phân loại (`data-classification.md`)
- [ ] `tool-permissions.md` đã cập nhật theo môi trường hiện tại
- [ ] Có người chịu trách nhiệm cuối cho mọi đầu ra AI (không có mục nào "do AI quyết")
- [ ] Bảng OWASP LLM Top 10 đã điền cho mọi tính năng có gọi AI
- [ ] Chi phí AI có ngân sách và cảnh báo
- [ ] Post-mortem gần nhất đã cập nhật bài học về quy trình AI vào `constitution.md`/`rules/`

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 5 (Quản trị công cụ AI, bản quyền/IP code AI) và mục 7 (chính sách skill.md, prompt injection) — tài liệu gốc nội bộ
- OWASP LLM Top 10 — https://genai.owasp.org/llm-top-10/
- OWASP GenAI Security Project — https://genai.owasp.org/
- NIST AI Risk Management Framework (AI RMF 1.0) — https://www.nist.gov/itl/ai-risk-management-framework
- NIST AI RMF Playbook — https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook
- ISO/IEC 42001:2023 — AI management system — https://www.iso.org/standard/81230.html
- ISO/IEC 27001 — https://www.iso.org/standard/27001
- EU AI Act (tham chiếu quốc tế) — https://artificialintelligenceact.eu/

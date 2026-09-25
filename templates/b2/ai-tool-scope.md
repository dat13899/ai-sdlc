---
title: ai-tool-scope.md — Danh mục công cụ AI được duyệt
for: B2 — dựng cùng SKILL.md; rà soát mỗi quý và mỗi khi thêm tool mới
owner: Tech Lead (A/R) · Security Lead (A — duyệt ATTT) · PM (C)
nguồn: AI-SDLC v5.9 mục 5 & 7 + Phụ lục 3 mục 3.7; OWASP LLM Top 10 (LLM05 Supply Chain)
---

# ai-tool-scope.md — Danh mục công cụ AI được duyệt

> Mọi công cụ AI dùng trong dự án **phải có tên trong bảng này**. Dùng tool ngoài danh sách — dù chỉ để thử — là vi phạm chính sách dữ liệu.

## 1. Bảng công cụ đã duyệt

| Công cụ | Mục đích dùng | Môi trường | Dữ liệu tối đa được đưa vào | Zero Data Retention | Ngày đánh giá | Người đánh giá | Trạng thái |
|---|---|---|---|---|---|---|---|
| [Tool sinh code] | Viết code, sinh test | DEV | Internal | ☐ Có ☐ Không ☐ Không rõ | [YYYY-MM-DD] | [Tên] | ✅ Duyệt |
| [Tool ghi họp] | Ghi âm + transcript cuộc họp | DEV | Confidential *(có consent)* | ☐ | [YYYY-MM-DD] | [Tên] | ✅ Duyệt |
| [Tool tổng hợp tài liệu] | Draft BRD, spec | DEV | Internal | ☐ | [YYYY-MM-DD] | [Tên] | ✅ Duyệt |
| [Tool review code] | Review tầng 1 | CI | Internal | ☐ | [YYYY-MM-DD] | [Tên] | ✅ Duyệt |
| [Tool AI nội bộ] | Xử lý dữ liệu nhạy cảm | Nội bộ | Confidential | ✅ (self-hosted) | [YYYY-MM-DD] | [Tên] | ✅ Duyệt |
| [Tool khác] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | ⏳ Chờ duyệt |

**Chú thích trạng thái:** ✅ Duyệt · ⏳ Chờ duyệt · ⚠️ Duyệt có điều kiện · ❌ Không duyệt.

## 2. Bảng công cụ KHÔNG được duyệt (denylist)

| Công cụ | Lý do |
|---|---|
| [Tool không có chính sách dữ liệu rõ ràng] | Không xác định được dữ liệu lưu ở đâu, có dùng train hay không |
| [Extension AI trình duyệt không rõ nguồn gốc] | Đọc được toàn bộ nội dung trang → rủi ro supply chain |
| [Tool ghi họp tự động không hỏi consent] | Vi phạm yêu cầu xin phép trước khi ghi âm |

## 3. Ba câu hỏi bắt buộc trước khi duyệt một tool

Mọi tool muốn vào danh sách phải trả lời được:

| # | Câu hỏi | Vì sao |
|---|---|---|
| 1 | **Dữ liệu gửi vào có bị dùng để train model không?** | Nếu có → dữ liệu Internal trở lên bị rò rỉ vĩnh viễn, không thu hồi được |
| 2 | **Có tuỳ chọn opt-out / Zero Data Retention không?** | ZDR là điều kiện để dùng với dữ liệu Confidential |
| 3 | **Dữ liệu được lưu ở khu vực địa lý nào, trong bao lâu?** | Yêu cầu pháp lý về lưu trữ dữ liệu; một số khách hàng yêu cầu dữ liệu không rời lãnh thổ |

**Bổ sung:**

| # | Câu hỏi |
|---|---|
| 4 | Tool có yêu cầu quyền truy cập gì (đọc file, shell, mạng)? Quyền đó có cần thiết không? |
| 5 | Có phụ thuộc vào model/thư viện bên thứ ba nào không? Đã kiểm CVE chưa? |
| 6 | Chi phí thế nào (seat/API)? Có nằm trong ngân sách dự án không? |
| 7 | Nếu tool ngừng hoạt động, quy trình có bị chặn không? Có phương án thay thế? |

## 4. Quy trình duyệt công cụ mới

```text
1. ĐỀ XUẤT   — Ai muốn dùng tool gì, cho việc gì, ở bước nào → ghi vào ticket
               (nêu rõ: cần cho mục đích gì, thay thế quy trình nào)
2. ĐÁNH GIÁ  — Tech Lead + Security Lead trả lời 7 câu hỏi ở mục 3
               Công cụ: thử với dữ liệu Public trước, KHÔNG test bằng dữ liệu thật
3. PHÂN LOẠI — Xác định mức dữ liệu tối đa tool được dùng (theo data-classification.md)
4. PHÊ DUYỆT — Tech Lead duyệt kỹ thuật; Security Lead duyệt ATTT
               Dữ liệu Restricted → cần thêm ý kiến Ban lãnh đạo/ATTT cấp công ty
5. GHI NHẬN  — Thêm vào bảng mục 1 kèm trạng thái ZDR + ngày + người đánh giá
6. PHỔ BIẾN  — Thông báo cho đội cách dùng đúng (dữ liệu nào được đưa vào)
7. RÀ SOÁT   — Mỗi quý: tool còn đúng chính sách? License/chi phí còn phù hợp? Có sự cố nào?
```

## 5. Điều khoản Zero Data Retention (ZDR) — vì sao quan trọng

| Không có ZDR | Có ZDR |
|---|---|
| Prompt có thể được lưu và dùng để train model | Nhà cung cấp cam kết không lưu và không dùng train |
| Dữ liệu đã gửi **không thể thu hồi** | Hợp đồng ràng buộc về xử lý dữ liệu |
| Chỉ được dùng cho dữ liệu Public | Có thể dùng cho Internal, Confidential có phê duyệt |
| Miễn phí/thấp | Thường là gói doanh nghiệp, chi phí cao hơn |

**Kết luận thực tế:** nếu dự án chạm dữ liệu khách hàng (Confidential/Restricted) thì **phải** dùng gói doanh nghiệp có ZDR, hoặc AI chạy nội bộ. Dùng gói miễn phí cho dữ liệu khách hàng là vi phạm — kể cả khi công cụ "uy tín".

## 7. Bản quyền & IP của code do AI sinh

Tài liệu gốc (mục 5) yêu cầu quản lý rủi ro **code AI sinh trùng mã nguồn công khai** — có thể kéo theo nghĩa vụ license (đặc biệt GPL/copyleft) vào sản phẩm.

| Rủi ro | Cách chặn | Ai làm |
|---|---|---|
| Code AI sinh trùng mã nguồn công khai có license copyleft (GPL/AGPL) | Bật **public code duplication filter** của tool AI (GitHub Copilot, Amazon CodeWhisperer… đều có tuỳ chọn này) | Tech Lead (cấu hình) |
| Dependency mới mang license không tương thích | Quét license tự động trong CI — **FOSSA**, **Snyk**, hoặc `license-checker`/`pip-licenses` | CI + Tech Lead |
| Không rõ nguồn gốc một đoạn code | Yêu cầu dev giải thích; tra lại; nếu nghi ngờ → viết lại | Reviewer tầng 2 |
| Điều khoản hợp đồng với khách hàng không nêu trách nhiệm IP code AI | PM bổ sung điều khoản: ai chịu trách nhiệm nếu có tranh chấp bản quyền | PM + pháp chế |

**Ngưỡng chặn cứng:** dependency có license GPL/AGPL trong sản phẩm đóng → **không được merge** cho tới khi Tech Lead phê duyệt bằng văn bản hoặc thay thế.

**Ghi nhận minh bạch:** commit/code do AI sinh phải ghi rõ trong commit message (`AI-assisted: yes | Người kiểm: [Tên]`) — xem `conventional-commits.md`.

## 8. Quy tắc dùng công cụ AI

| Quy tắc | Nội dung |
|---|---|
| Tool ngoài danh sách | ❌ Không dùng, kể cả để thử với dữ liệu thật |
| Thử tool mới | Chỉ với dữ liệu **Public** hoặc synthetic |
| Tool extension/plugin trình duyệt | Phải qua đánh giá như mọi tool khác — chúng đọc được toàn bộ trang |
| Tool do đối tác cung cấp | Đọc kỹ chính sách dữ liệu; ghi vào bảng với mức dữ liệu phù hợp |
| Tài khoản dùng tool | Dùng tài khoản công ty, không dùng tài khoản cá nhân cho công việc dự án |
| Khi có sự cố bảo mật của nhà cung cấp | Tạm dừng dùng, đánh giá, ghi vào post-mortem |
| Hết hạn đánh giá | Rà soát mỗi quý, hoặc khi nhà cung cấp đổi chính sách |

## 9. Checklist duy trì danh mục

- [ ] Mọi tool đang dùng thực tế đều có trong bảng mục 1
- [ ] Mọi tool đã qua 7 câu hỏi ở mục 3
- [ ] Cột Zero Data Retention đã điền cho mọi tool
- [ ] Mức dữ liệu tối đa đã điền cho mọi tool
- [ ] Có ngày đánh giá + người đánh giá
- [ ] Đội đã được phổ biến cách tra bảng trước khi dùng tool
- [ ] Đã rà soát trong quý này
- [ ] Có theo dõi sự cố bảo mật của các nhà cung cấp đang dùng

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 5 (Quản trị công cụ AI, bản quyền/IP code sinh bởi AI) và mục 7 — tài liệu gốc nội bộ
- OWASP LLM Top 10 — LLM05 Supply Chain, LLM06 Sensitive Information Disclosure — https://genai.owasp.org/llm-top-10/
- NIST AI RMF — Govern function — https://www.nist.gov/itl/ai-risk-management-framework
- Nghị định 13/2023/NĐ-CP — bảo vệ dữ liệu cá nhân — https://vanban.chinhphu.vn/
- Vendor Zero Data Retention policies (kiểm tra từng nhà cung cấp khi đánh giá)

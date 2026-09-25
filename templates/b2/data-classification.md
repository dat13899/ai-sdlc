---
title: data-classification.md — Phân loại dữ liệu & quy tắc dùng với AI
for: B2 — dựng cùng SKILL.md; áp dụng mọi bước có đưa dữ liệu vào AI (B3, B9, B10)
owner: Security Lead (A/R) · Tech Lead (R) · PM (I)
nguồn: AI-SDLC v5.9 mục 7 + Phụ lục 3 mục 3.6; NIST SP 800-60; GDPR/PDPD (VN)
---

# data-classification.md — Phân loại dữ liệu & quy tắc dùng với AI

> File này trả lời **một câu hỏi duy nhất**: *loại dữ liệu này có được đưa vào prompt/AI không?* Mọi người trong dự án phải biết câu trả lời trước khi copy-paste bất cứ thứ gì vào công cụ AI.

## 1. Bốn mức phân loại

| Mức | Định nghĩa | Ví dụ | Hậu quả nếu lộ |
|---|---|---|---|
| **Public** | Đã hoặc có thể công bố công khai, không gây hại | Tài liệu marketing, giá niêm yết, nội dung website, mã nguồn mở | Không đáng kể |
| **Internal** | Dùng nội bộ, không bí mật nhưng không dành cho bên ngoài | Quy trình nội bộ, kiến trúc hệ thống, tài liệu dự án, mã nguồn nội bộ | Ảnh hưởng nhẹ tới lợi thế cạnh tranh |
| **Confidential** | Thông tin nhạy cảm của công ty hoặc khách hàng | Dữ liệu khách hàng, hợp đồng, giá đàm phán, chiến lược kinh doanh, log hệ thống chứa dữ liệu người dùng | Thiệt hại tài chính, vi phạm hợp đồng |
| **Restricted** | Cao nhất — có quy định pháp lý hoặc ảnh hưởng nghiêm trọng | Dữ liệu cá nhân (PII: CMND/CCCD, số điện thoại, địa chỉ), dữ liệu thanh toán/thẻ, mật khẩu, khoá API, bí mật kinh doanh, dữ liệu sức khỏe | Vi phạm pháp luật, mất uy tín nghiêm trọng, phạt tiền |

## 2. BẢNG QUYẾT ĐỊNH — dữ liệu nào được đưa vào prompt AI

| Mức dữ liệu | Đưa vào công cụ AI công cộng (ChatGPT/Claude/Gemini bản thường) | Đưa vào công cụ AI có Zero Data Retention (ZDR) + hợp đồng doanh nghiệp | Đưa vào AI chạy nội bộ (self-hosted) |
|---|---|---|---|
| **Public** | ✅ Được | ✅ Được | ✅ Được |
| **Internal** | ⚠️ **Chỉ khi khách hàng/ATTT chấp thuận** và đã che thông tin nhận dạng | ✅ Được | ✅ Được |
| **Confidential** | ❌ **Không** | ⚠️ Chỉ khi có hợp đồng + ZDR + được Security Lead phê duyệt | ✅ Được |
| **Restricted** | ❌ **Không, tuyệt đối** | ❌ **Không** | ⚠️ Chỉ khi hệ thống nội bộ được phê duyệt cho mức này, có kiểm soát truy cập |

**Quy tắc đơn giản để nhớ:** nếu dữ liệu chứa **tên/số điện thoại/CCCD/số thẻ/mật khẩu/khoá** → **Restricted** → **không** đưa vào bất kỳ AI công cộng nào.

## 3. Câu hỏi tự kiểm trước khi paste vào AI

- [ ] Dữ liệu này thuộc mức nào (Public / Internal / Confidential / Restricted)?
- [ ] Công cụ AI tôi đang dùng có nằm trong `ai-tool-scope.md` không?
- [ ] Công cụ đó có **Zero Data Retention** không?
- [ ] Tôi có quyền chia sẻ dữ liệu này ra ngoài hệ thống công ty không?
- [ ] Đã **masking/ẩn danh** các trường nhận dạng chưa?
- [ ] Nếu dữ liệu này bị công khai ngày mai, có ai bị tổn hại không?

Nếu bất kỳ câu nào khiến bạn chùn lại → **không paste**, hỏi Security Lead.

## 4. Quy tắc masking / ẩn danh

### Bắt buộc thay thế trước khi đưa vào AI

| Trường | Thay bằng |
|---|---|
| Họ tên người thật | `[KHÁCH HÀNG_A]`, `[NHÂN VIÊN_B]` |
| Số điện thoại | `[SĐT]` hoặc `090xxxx123` |
| Email | `[EMAIL]` hoặc `user***@example.com` |
| CMND/CCCD | `[SỐ_CCCD]` |
| Số thẻ / tài khoản ngân hàng | `[SỐ_THẺ]` |
| Địa chỉ nhà | `[ĐỊA_CHỈ]` |
| Tên công ty khách hàng | `[KHÁCH_HÀNG_A]` (nếu chưa được phép nêu) |
| Khoá API / token / mật khẩu | **Xoá hoàn toàn.** Không bao giờ đưa vào AI, kể cả AI nội bộ |
| Log có chứa dữ liệu người dùng | Lọc bỏ/serialize lại trước khi gửi |

### Dữ liệu giả để test

- Dùng **synthetic data** (dữ liệu tự sinh) cho mọi môi trường không phải Production.
- Nếu buộc phải dùng dữ liệu thật (tái hiện bug Production) → **masking/anonymize trước**, chỉ giữ cấu trúc và giá trị cần thiết để tái hiện.
- **Không** copy CSDL Production xuống máy dev. **Không** dùng dữ liệu Production thật làm dữ liệu test (tài liệu gốc — B11/B12).

## 5. Quy tắc theo môi trường

| Môi trường | Dữ liệu được phép dùng với AI |
|---|---|
| DEV | Public, Internal, và dữ liệu giả (synthetic). Không dữ liệu thật |
| CI | Public, Internal; secret lấy qua secret store, không ghi ra log |
| STAGING | Chỉ dữ liệu đã masking/ẩn danh |
| PRODUCTION | **Không đưa vào AI.** Chỉ đọc log đã lọc và đã được phê duyệt, có mục đích rõ ràng |

## 6. Trách nhiệm

| Vai trò | Trách nhiệm |
|---|---|
| Security Lead | Ban hành bảng phân loại, phê duyệt tool cho dữ liệu Confidential/Restricted, rà soát định kỳ |
| Tech Lead | Đảm bảo tool và quy trình tuân theo phân loại; cấu hình allowlist |
| Dev / BA / Tester | Tự phân loại dữ liệu trước khi dùng với AI; masking khi cần |
| PM | Đảm bảo hợp đồng với khách hàng quy định rõ việc dùng AI xử lý dữ liệu của họ |
| Cả đội | Báo ngay khi phát hiện dữ liệu mức cao đã bị đưa vào AI sai quy định |

## 7. Khi phát hiện vi phạm (dữ liệu đã bị đưa vào AI sai)

```text
1. DỪNG    — không tiếp tục dùng công cụ đó với dữ liệu tương tự
2. BÁO     — báo ngay Security Lead + Tech Lead (trong ngày)
3. ĐÁNH GIÁ— dữ liệu gì, mức nào, đã lộ bao lâu, tool có lưu lại không
4. XỬ LÝ   — yêu cầu xoá dữ liệu khỏi tool (nếu tool hỗ trợ); xoay khoá nếu là bí mật
5. GHI LẠI — ghi vào post-mortem; cập nhật quy trình để không lặp lại
6. THÔNG BÁO— nếu là dữ liệu cá nhân và ảnh hưởng tới cá nhân, đánh giá nghĩa vụ thông báo theo quy định
```

## 8. Checklist dựng & duy trì

- [ ] Đã xác định mức phân loại cho từng loại dữ liệu dự án đang dùng
- [ ] Mọi tool AI dùng cho dữ liệu Internal trở lên đã có đánh giá ZDR
- [ ] Đội đã được phổ biến bảng quyết định ở mục 2
- [ ] Đã có quy ước masking (mục 4) và mọi người biết dùng
- [ ] Môi trường DEV/STAGING chỉ dùng dữ liệu giả hoặc đã masking
- [ ] Không có dữ liệu Production thật trong test
- [ ] Đã có quy trình xử lý khi phát hiện vi phạm (mục 7)
- [ ] Đã rà soát lại mỗi quý hoặc khi có loại dữ liệu/quy định mới

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 7 và Phụ lục 3 mục 3.6 — tài liệu gốc nội bộ
- Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (Việt Nam) — https://vanban.chinhphu.vn/
- NIST SP 800-60 — Guide for Mapping Types of Information and Systems to Security Categories — https://csrc.nist.gov/pubs/sp/800/60/v2/final
- ISO/IEC 27001 — thông tin & phân loại tài sản — https://www.iso.org/standard/27001
- OWASP LLM Top 10 — LLM06 Sensitive Information Disclosure — https://genai.owasp.org/llm-top-10/
- GDPR — https://gdpr-info.eu/

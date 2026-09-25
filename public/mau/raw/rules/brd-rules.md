---
title: "brd-rules.md — Linter tự kiểm BRD"
for: "B3 bước 3 (Tự kiểm BRD) — Giai đoạn 1: Thu thập & phân tích yêu cầu"
owner: "BA (Business Analyst) — chủ sở hữu checklist; PO/Sponsor (C) khi xác nhận sơ bộ"
nguồn: "AI-SDLC v5.9 dòng 380–499 (B3) và dòng 2003–2008 (rules/brd-rules.md); BABOK v3 (IIBA); ISO/IEC/IEEE 29148; INVEST"
---

# brd-rules.md — Linter cho BRD (B3)

## 1. Mục đích

Chặn lỗi *rẻ nhất có thể sửa*: yêu cầu mơ hồ, không đo lường được, lẫn giải pháp vào yêu cầu nghiệp vụ, hoặc không truy vết được về mục tiêu kinh doanh. Những lỗi này nếu để qua B4 sẽ nở ra thành spec sai → code sai → test vô nghĩa. Linter này biến BRD thành thứ **kiểm chứng được bằng mắt thường**, không cần diễn giải.

## 2. Khi nào chạy

| Mục | Nội dung |
|---|---|
| Bước | **B3 — bước 3 "Tự kiểm BRD"** (ngay sau khi AI trích xuất BRD nháp từ transcript họp) |
| Người chạy | **BA** (đọc từng câu hỏi, đánh dấu Đạt/Không đạt). AI có thể tự chạy trước khi BA đọc |
| Đầu vào | `4.3-BRD.md` (bản nháp), `4.2-bien-ban-hop.md`, `glossary.md` |
| Đầu ra | BRD đã đạt — nguồn để gửi PO/khách hàng xác nhận sơ bộ (B3 bước 6) và làm đầu vào B4 |
| Chạy lại khi | BRD có bất kỳ thay đổi nội dung nào (kể cả sửa 1 câu) |

## 3. Cách dùng

1. AI tự chạy linter này trên BRD nháp, xuất **bảng chấm điểm** theo đúng bảng ở mục 4, kèm trích dẫn câu/ô cụ thể trong BRD làm bằng chứng cho mỗi mục "Không đạt".
2. BA đọc lại bảng đó, tự kiểm chéo các mục AI báo "Đạt" (không tin máy 100%).
3. **Mục nào Không đạt → sửa BRD ngay tại chỗ**, không dồn sang B4, không ghi vào "danh sách nợ kỹ thuật".
4. Chỉ khi **100% mục Không đạt đã đóng** mới được gửi BRD xác nhận sơ bộ. Mục nào cố tình chấp nhận sai → ghi rõ lý do + người chấp nhận vào cột Ghi chú.
5. Toàn bộ bảng chấm điểm đã điền là **phụ lục bắt buộc** của BRD khi trình Gate 1 (B5).

## 4. Bảng checklist chính

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | Bảng "Yêu cầu chức năng" có đủ 4 cột bắt buộc: **ID · Tính năng · Mô tả · Độ ưu tiên**? Thiếu bất kỳ cột nào là Không đạt | ☐ | |
| 2 | Mọi ID yêu cầu có dạng duy nhất và dùng lại được khi tham chiếu (VD `FR-012`, `NFR-004`), không trùng ID nào? | ☐ | |
| 3 | Mỗi câu mô tả nêu **một** yêu cầu duy nhất (không dùng "và/hoặc" để gộp 2 yêu cầu vào 1 dòng)? | ☐ | |
| 4 | Yêu cầu chức năng viết ở dạng **User Action** ("Hệ thống cho phép [vai trò] [hành động] [đối tượng]"), không viết dạng trạng thái mơ hồ? | ☐ | |
| 5 | Mỗi yêu cầu **kiểm chứng được**: tồn tại ít nhất 1 tiêu chí nghiệm thu kèm theo để kiểm đúng/sai? | ☐ | |
| 6 | Cột "Độ ưu tiên" dùng đúng thang đã chốt (MoSCoW hoặc P0–P3), không để trống, không dùng "cao/thấp" tuỳ hứng? | ☐ | |
| 7 | Ba yêu cầu ưu tiên cao nhất có được các bên (PO/Sponsor) xác nhận, không chỉ do BA tự gán? | ☐ | |
| 8 | Mọi **NFR đều định lượng có số + đơn vị** (VD "p95 ≤ 500 ms", "uptime ≥ 99,5%"), không có câu kiểu "nhanh", "ổn định", "thân thiện"? | ☐ | |
| 9 | NFR được phân loại rõ theo nhóm (hiệu năng, bảo mật, khả dụng, khả năng mở rộng, tuân thủ), không trộn lẫn FR và NFR trong cùng một bảng? | ☐ | |
| 10 | Mỗi yêu cầu truy vết được về **ít nhất 1 mục tiêu kinh doanh** có mã (VD `BO-02`); không có yêu cầu "mồ côi"? | ☐ | |
| 11 | Mỗi mục tiêu kinh doanh có **chỉ số đo lường** (baseline → mục tiêu → thời hạn)? | ☐ | |
| 12 | Không có yêu cầu nào **trộn giải pháp vào yêu cầu** (không nêu tên công nghệ, framework, bảng CSDL, tên service trong mục "Yêu cầu")? | ☐ | |
| 13 | Mục "Phạm vi" và mục "Giả định" không mâu thuẫn nhau (thứ bị loại khỏi phạm vi không xuất hiện lại như giả định)? | ☐ | |
| 14 | Mục "Ngoài phạm vi" (Out of scope) có nội dung thật, không để trống hoặc ghi "chưa xác định"? | ☐ | |
| 15 | Mọi thuật ngữ nghiệp vụ dùng trong BRD đều **có trong `glossary.md`** với đúng định nghĩa đang dùng? | ☐ | |
| 16 | Không còn từ ngữ mơ hồ không đo được ("nhanh", "nhiều", "thường xuyên", "tối ưu", "linh hoạt")? | ☐ | |
| 17 | Mọi ràng buộc đã nêu (thời hạn, ngân sách, quy định pháp lý) đều có nguồn dẫn chứng (điều luật, hợp đồng, biên bản)? | ☐ | |
| 18 | Các xung đột giữa stakeholder được ghi nhận **đầy đủ cả hai ý kiến** trong Q&A Log, không tự chọn một bên? | ☐ | |
| 19 | Mọi con số, tỉ lệ, ngưỡng trong BRD đều truy được về nguồn (biên bản họp / tài liệu cũ / quy định) — không có số tự suy diễn? | ☐ | |
| 20 | BRD nêu rõ **biên (edge case) và trường hợp lỗi nghiệp vụ** cho mỗi luồng chính, không chỉ luồng thành công? | ☐ | |
| 21 | BRD không chứa thiết kế kỹ thuật chi tiết (sơ đồ CSDL, chữ ký hàm, cấu trúc thư mục, mã nguồn mẫu)? | ☐ | |
| 22 | Mọi tài liệu tham chiếu (biên bản họp, biểu mẫu cũ) được ghi đúng đường dẫn và còn tồn tại? | ☐ | |

## 5. Ví dụ viết ĐÚNG vs viết SAI

### 5.1 Yêu cầu chức năng — viết ĐÚNG vs viết SAI

| Viết ĐÚNG | Viết SAI |
|---|---|
| `FR-012` · Hoàn tiền đơn hàng · **Hệ thống cho phép Kế toán trưởng phê duyệt hoàn tiền tối đa 50.000.000 VND cho một đơn hàng, trong vòng 24 giờ kể từ khi nhận yêu cầu** · Must | `FR-012` · Hoàn tiền · *Hệ thống xử lý hoàn tiền nhanh chóng và linh hoạt cho khách hàng* · Cao |
| Vì sao đúng: có vai trò (Kế toán trưởng), có hành động (phê duyệt), có ngưỡng số (50.000.000 VND), có thời hạn (24 giờ) → test được. | Vì sao sai: không rõ ai làm, không rõ giới hạn, "nhanh chóng/linh hoạt" không đo được → không thể viết test, không thể nghiệm thu. |

### 5.2 Yêu cầu phi chức năng — viết ĐÚNG vs viết SAI

| Viết ĐÚNG | Viết SAI |
|---|---|
| `NFR-004` (Hiệu năng) · **API tra cứu đơn hàng đạt p95 ≤ 500 ms với 200 request/giây, đo tại tầng API gateway trong giờ cao điểm (8h–18h)** · Must | `NFR-004` · *Hệ thống phải chạy nhanh và chịu tải tốt* · — |
| Vì sao đúng: có chỉ số (p95), ngưỡng số (500 ms), tải (200 rps), điểm đo, khung thời gian → có thể dựng test tải và pass/fail rõ ràng. | Vì sao sai: không có số nên không ai phản đối được, cũng không ai nghiệm thu được. |

### 5.3 Truy vết về mục tiêu kinh doanh — viết ĐÚNG vs viết SAI

| Viết ĐÚNG | Viết SAI |
|---|---|
| **Mục tiêu `BO-02`**: giảm tỉ lệ đơn hoàn tiền xử lý thủ công từ 80% (baseline 2026-Q1) xuống ≤ 20% trước 2026-Q4. **Yêu cầu map**: `FR-012`, `FR-013`, `NFR-004`. | Mục tiêu: *"Nâng cao trải nghiệm khách hàng và số hoá quy trình"*. Không có yêu cầu nào map, không có chỉ số, không có mốc thời gian. |
| Vì sao đúng: đo được, có baseline và đích, kiểm tra được yêu cầu nào đang phục vụ mục tiêu nào. | Vì sao sai: là khẩu hiệu, không dùng được để ưu tiên cắt/giữ yêu cầu khi hết thời gian. |

## 6. Khi nào tự động CHẶN (block)

Các điều kiện **cứng** dưới đây không được vượt qua, kể cả khi đang gấp:

1. Thiếu cột bắt buộc (ID / Tính năng / Mô tả / Độ ưu tiên) trong bảng yêu cầu chức năng.
2. Còn bất kỳ NFR nào **không có số** — chặn tuyệt đối, không ghi "sẽ bổ sung sau".
3. Có yêu cầu không truy vết được về mục tiêu kinh doanh nào (yêu cầu mồ côi).
4. Phạm vi và Giả định mâu thuẫn trực tiếp với nhau.
5. Có yêu cầu trộn giải pháp/công nghệ vào phần yêu cầu nghiệp vụ → phải tách ra mục "Ràng buộc kỹ thuật".
6. Có từ mơ hồ không đo được trong câu yêu cầu (nhanh, nhiều, tối ưu, thân thiện...).
7. Thuật ngữ dùng trong BRD không khớp `glossary.md` (hoặc glossary chưa có thuật ngữ đó mà chưa bổ sung).
8. Xung đột stakeholder chưa được ghi nhận đầy đủ hai phía trong Q&A Log.
9. BRD chưa có bảng chấm điểm linter này làm phụ lục → không được trình Gate 1.

## Nguồn tham chiếu

- AI-SDLC v5.9 — B3 (dòng 380–499), nhóm rules (dòng 1999–2008).
- IIBA, *BABOK v3 — Business Analysis Body of Knowledge*: https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/babok/
- ISO/IEC/IEEE 29148:2018 — *Systems and software engineering — Life cycle processes — Requirements engineering*: https://www.iso.org/standard/72089.html
- Agile Alliance, *INVEST in Good Stories*: https://agilealliance.org/glossary/invest/
- Cucumber, *Gherkin Reference*: https://cucumber.io/docs/gherkin/reference/
- OMG, *BPMN 2.0 Specification* (đối chiếu luồng nghiệp vụ B3 bước 4): https://www.omg.org/spec/BPMN/2.0/

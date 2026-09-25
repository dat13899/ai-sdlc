---
title: glossary.md — Từ điển thuật ngữ dự án
for: B2 (khởi tạo) → cập nhật liên tục từ B3 tới B14
owner: BA (R — khởi tạo & cập nhật) · PO (A — chốt nghĩa nghiệp vụ) · Tech Lead (C)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.16 + mục 2 B3 bước 5
---

# glossary.md — Từ điển thuật ngữ dự án

> **Vì sao cần:** cùng một từ có thể mang nghĩa khác nhau giữa khách hàng, BA và dev. Một thuật ngữ hiểu sai ở B3 sẽ lan thành hàng chục lỗi ở code, test và UAT.
>
> **Quy tắc của tài liệu gốc (B3 bước 5):** thuật ngữ mới phải được cập nhật vào glossary **ngay trong B3**, không chờ tới cuối dự án. AI đọc file này ở bước 5 của thứ tự đọc (`SKILL.md`).

## 1. Từ nào BẮT BUỘC phải vào glossary

| Loại | Ví dụ | Vì sao |
|---|---|---|
| Thuật ngữ nghiệp vụ của khách hàng | "đơn hàng chuẩn", "hợp đồng khung", "kỳ thanh toán" | Khách hiểu một kiểu, đội hiểu một kiểu khác |
| Từ có định nghĩa khác với nghĩa thông thường | "khách hàng", "đại lý", "thành viên" | Kèm trạng thái/kênh đăng ký khác nhau |
| Viết tắt & từ tiếng Anh trong ngữ cảnh Việt | SLA, KPI, PII, UAT, SIT | Người mới không hiểu; AI có thể dùng sai |
| Tên trạng thái trong hệ thống | "Chờ duyệt", "Đã duyệt", "Từ chối" | Phải khớp chính xác với code và giao diện |
| Tên vai trò / phân quyền | "Quản trị viên", "Nhân viên CSKH", "Trưởng phòng" | Sai một chữ là sai quyền |
| Từ dễ gây tranh chấp về phạm vi | "báo cáo", "thông báo", "tích hợp" | "Thông báo" là email hay Zalo hay trong app? |

**Không cần vào glossary:** từ kỹ thuật phổ quát (function, array, HTTP), tên công nghệ (React, PostgreSQL) — trừ khi dự án dùng theo nghĩa riêng.

## 2. Bảng thuật ngữ

| Thuật ngữ | Định nghĩa | Ví dụ / Ngữ cảnh | KHÔNG phải là | Ghi chú |
|---|---|---|---|---|
| [Đơn hàng chuẩn] | [Đơn có đủ thông tin bắt buộc và đã được kiểm tra tồn kho] | ["Khách tạo đơn có mã SP và số lượng → đơn chuẩn"] | [Đơn nháp chưa qua kiểm tra] | [Khác với "đơn nháp"] |
| [Khách hàng] | [Cá nhân/tổ chức đã ký hợp đồng] | [ ] | [Người dùng thử chưa ký] | [ ] |
| [Người dùng] | [Bất kỳ ai có tài khoản đăng nhập] | [ ] | [Không chỉ khách hàng] | [Bao gồm cả nhân viên nội bộ] |
| [Đại lý] | [Đối tác bán lại, có mức chiết khấu riêng] | [ ] | [Không phải khách hàng cuối] | [ ] |
| [Chờ duyệt] | [Trạng thái đơn đã gửi nhưng chưa được người có quyền xác nhận] | [ ] | [Không phải đang xử lý] | [ ] |
| [SLA] | [Cam kết mức dịch vụ — VD phản hồi ≤ 2 giây, uptime ≥ 99.5%] | [ ] | [Không phải thời hạn xử lý ticket nội bộ] | [ ] |
| [PII] | [Thông tin định danh cá nhân] | [Họ tên, CCCD, SĐT, email, địa chỉ] | [Không gồm dữ liệu đã ẩn danh] | [Thuộc mức Restricted] |
| [UAT] | [User Acceptance Test — kiểm thử nghiệm thu do PO/khách hàng thực hiện] | [Gate 4] | [Không phải SIT] | [ ] |
| [SIT] | [System Integration Test — kiểm thử tích hợp hệ thống] | [Gate 4a] | [Không phải UAT] | [Do Test Lead thực hiện] |
| [Hypercare] | [Giai đoạn trực tăng cường 1–2 tuần sau go-live] | [ ] | [Không phải bảo hành] | [ ] |
| [ ] | [ ] | [ ] | [ ] | [ ] |

### 2.2. Thuật ngữ kỹ thuật & quy trình (dùng chung cả quy trình)

Các thuật ngữ dưới đây **đã được định nghĩa sẵn** vì dùng xuyên suốt tài liệu — không cần điền lại, chỉ tra khi cần.

| Thuật ngữ | Định nghĩa | Ví dụ / Ngữ cảnh | KHÔNG phải là | Ghi chú |
|---|---|---|---|---|
| **Smoke test** | Bộ test rất ngắn chạy sau khi deploy để xác nhận hệ thống còn "sống" và các luồng chính hoạt động | Sau deploy lên STAGING: đăng nhập, tạo 1 đơn, xem danh sách | Không phải regression test (không kiểm toàn bộ) | Chạy tự động ngay sau deploy |
| **Regression test** | Bộ test kiểm lại toàn bộ chức năng đã có để chắc thay đổi mới không làm hỏng thứ cũ | Trước Gate 4a: chạy full suite | Không phải smoke test | Phải **xanh 100%** mới qua Gate 4a |
| **SIT** (System Integration Test) | Kiểm thử tích hợp giữa các module/hệ thống với nhau | Gate 4a | Không phải UAT (UAT là khách kiểm) | Do Test Lead sở hữu |
| **UAT** (User Acceptance Test) | Kiểm thử nghiệm thu do PO/khách hàng thực hiện theo kịch bản nghiệp vụ | Gate 4 | Không phải SIT | Kết thúc bằng PL6 Sign-off |
| **RTM** (Requirements Traceability Matrix) | Bảng ánh xạ yêu cầu ↔ test case ↔ kết quả, chứng minh mọi AC đều được kiểm | "RTM phủ 100% AC" | Không phải danh sách test case đơn thuần | Bắt buộc ở Gate 4a |
| **ADR** (Architecture Decision Record) | Bản ghi một quyết định kiến trúc kèm bối cảnh, phương án đã cân nhắc và hệ quả | `docs/adr/0001-chon-csdl.md` | Không phải tài liệu thiết kế chi tiết | Bất biến — đổi thì tạo ADR mới |
| **DoR** (Definition of Ready) | Điều kiện để một story được đưa vào sprint | Trước Sprint Planning | Không phải DoD | Gắn Gate 1/2 |
| **DoD** (Definition of Done) | Điều kiện để một hạng mục được coi là xong hoàn toàn | Cuối task/sprint | Không phải DoR | Gắn Gate 3/4/5 |
| **Escaped defect** | Bug lọt ra Production mà lẽ ra phải bắt được ở B9/B11/B12 | Bug có "Môi trường phát hiện = PRODUCTION" | Không phải bug phát hiện ở DEV/STAGING | Chỉ số chất lượng — xem `dora-metrics.md` |
| **Mutation score** | Tỷ lệ % đột biến do công cụ tạo ra bị test phát hiện — đo chất lượng thật của test | Stryker, PIT | Không phải coverage (coverage cao vẫn có thể mutation thấp) | Ngưỡng gợi ý ≥ 60% |
| **Hypercare** | Giai đoạn trực tăng cường 1–2 tuần ngay sau go-live | Sau Gate 5 | Không phải bảo hành dài hạn | Đội Dev/DevOps trực tăng cường |
| **Blue-green deployment** | Hai môi trường giống nhau (xanh/lam); deploy vào môi trường nhàn rồi chuyển traffic sang | Chiến lược triển khai ở B13 | Không phải canary (canary chuyển dần %) | Rollback = chuyển traffic về môi trường cũ |
| **Canary release** | Phát hành cho một phần nhỏ người dùng trước, theo dõi rồi mới mở rộng | "5% người dùng trong 24 giờ đầu" | Không phải blue-green | Cần dashboard theo dõi tỉ lệ lỗi |
| **Prompt injection** | Kẻ tấn công chèn chỉ dẫn vào dữ liệu/input để AI làm việc ngoài ý định | File `skill.md` của đối tác chứa mệnh lệnh ẩn | Không phải lỗi AI "hiểu sai" thông thường | OWASP LLM01 — xem `ai-governance.md` |
| **Least-privilege** | Nguyên tắc cấp quyền tối thiểu vừa đủ để làm việc; mặc định từ chối | AI không được push thẳng `main` | Không phải "không cấp quyền gì" | Nền tảng của `tool-permissions.md` |
| **Zero Data Retention (ZDR)** | Cam kết của nhà cung cấp: không lưu và không dùng dữ liệu gửi vào để train model | Điều kiện để dùng tool với dữ liệu Confidential | Không phải "không log" | Bắt buộc cho dữ liệu Confidential/Restricted |
| **SAST** | Phân tích mã nguồn tĩnh để tìm lỗ hổng trước khi chạy | Chạy trong CI ở B10 | Không phải DAST (DAST kiểm ứng dụng đang chạy) | Chặn merge nếu có Critical/High |
| **DAST** | Kiểm thử bảo mật trên ứng dụng đang chạy | Gate 4b | Không phải SAST | Cùng pentest tạo nên Gate 4b |
| **PAM** | Quản lý truy cập đặc quyền — kiểm soát và ghi vết tài khoản quản trị | Tài khoản admin Production | Không phải xác thực người dùng thường | Bắt buộc cho môi trường Production |
| **IDOR** | Lỗi phân quyền: đổi id trên URL là xem được dữ liệu người khác | "Đổi `/orders/5` thành `/orders/6` → xem được đơn người khác" | Không phải lỗi xác thực (đã đăng nhập vẫn dính) | Mức High trong `code-review-rules.md` |
| **Escalation** | Quy trình leo thang khi sự cố vượt khả năng xử lý của người trực | "S1: leo thang ngay, không chờ" | Không phải báo cáo thông thường | Chi tiết ở `runbook.md` |

## 3. Nguyên tắc viết định nghĩa

| Nguyên tắc | Đúng | Sai |
|---|---|---|
| Định nghĩa phải phân biệt được | "Đơn chuẩn = đơn đã kiểm tra tồn kho" | "Đơn chuẩn là đơn bình thường" |
| Nêu rõ cái **KHÔNG** phải | Ghi cột "KHÔNG phải là" | Chỉ nêu ví dụ đúng |
| Dùng ví dụ cụ thể | "Đơn ORD-2026-0012" | "một số đơn" |
| Không dùng chính từ đó để định nghĩa | "Báo cáo là bản báo cáo tổng hợp" | Vòng lặp |
| Ghi nguồn khi khách hàng định nghĩa | "Theo biên bản họp 14/09/2026, mục 3" | Không biết ai nói |
| Một thuật ngữ = một dòng | Mỗi khái niệm một entry | Gộp nhiều nghĩa vào 1 dòng |

## 4. Ghi chú sử dụng

- Thuật ngữ trong bảng này **phải dùng thống nhất** ở: BRD, spec, ADR, OpenAPI, tên biến trong code, nhãn giao diện, test case, biên bản họp.
- Khi phát hiện tài liệu/code dùng từ khác glossary → sửa cho khớp, hoặc cập nhật glossary nếu cách dùng mới hợp lý hơn ( và báo BA).
- Khi tên trạng thái trong code khác nhãn hiển thị cho người dùng → ghi cả hai vào bảng: `Trạng thái hệ thống: PENDING_APPROVAL | Nhãn hiển thị: "Chờ duyệt"`.
- Từ song ngữ: giữ thuật ngữ tiếng Anh khi chuẩn hơn (SLA, UAT) nhưng **phải có định nghĩa tiếng Việt** để người không chuyên cũng hiểu.

## 5. Checklist

- [ ] Đã có entry cho mọi thuật ngữ nghiệp vụ riêng của dự án
- [ ] Mọi từ viết tắt dùng trong tài liệu đều có trong bảng
- [ ] Tên trạng thái trong hệ thống đã ghi kèm nhãn hiển thị
- [ ] Tên vai trò/phân quyền đã có entry khớp với code
- [ ] Cột "KHÔNG phải là" đã điền cho các thuật ngữ dễ gây nhầm
- [ ] Không có hai entry mâu thuẫn nhau
- [ ] Đã cập nhật trong B3 (không chờ tới cuối dự án)
- [ ] AI agent đọc được file này ở bước 5 (theo `SKILL.md`)

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.16 và mục 2 B3 bước 5 (cập nhật glossary ngay trong B3) — tài liệu gốc nội bộ
- BABOK v3, IIBA — Glossary, Business Vocabulary — https://www.iiba.org/
- ISO/IEC/IEEE 29148 — Requirements engineering, định nghĩa thuật ngữ — https://www.iso.org/standard/72089.html
- Diátaxis — Reference documentation — https://diataxis.fr/reference/

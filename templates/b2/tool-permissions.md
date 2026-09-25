---
title: tool-permissions.md — Phân quyền công cụ cho AI Agent
for: B2 — dựng cùng SKILL.md; áp dụng mọi môi trường DEV/CI/STAGING/PROD
owner: Tech Lead (A/R) · Security Lead (C/A về ATTT)
nguồn: AI-SDLC v5.9 mục 7 + Phụ lục 3 mục 3.5; nguyên tắc least-privilege (NIST)
---

# tool-permissions.md — Phân quyền công cụ cho AI Agent

> Nguyên tắc gốc: **least-privilege (đặc quyền tối thiểu)** và **mặc định từ chối**. AI chỉ được tự động làm những việc có trong allowlist; mọi việc khác phải có người xác nhận.

## 1. Ba mức quyền — định nghĩa

| Mức | Ký hiệu | Nghĩa | Ai quyết định |
|---|---|---|---|
| **Được tự chạy** | ✅ | AI thực hiện không cần hỏi; có thể hoàn tác hoặc không ảnh hưởng hệ thống thật | Đã allowlist sẵn |
| **Phải hỏi trước** | ⚠️ | AI phải dừng, mô tả việc muốn làm + rủi ro, chờ người xác nhận | Người có thẩm quyền (Tech Lead/Dev) |
| **Cấm tuyệt đối** | ❌ | Không được làm trong mọi trường hợp, kể cả có yêu cầu — kể cả khi người dùng chat yêu cầu | Không ai được phép giao cho AI |

**Ví dụ cốt lõi của 3 mức:**

| Mức | Ví dụ |
|---|---|
| ✅ **Được tự chạy** | Chạy test/lint/build cục bộ; đọc file repo; tạo nhánh; commit + push **nhánh của mình**; mở PR |
| ⚠️ **Phải hỏi trước** | Cài package mới; xoá file không phải do mình tạo; chạy migration CSDL (chỉ **tạo file** migration, không tự chạy); sửa `constitution.md` |
| ❌ **Cấm tuyệt đối** | Chạy migration DB; push thẳng lên `main`; merge PR; deploy tay lên Staging trở lên; đọc/ghi secret; sửa `.github/workflows/**` |

## 2. Bảng phân quyền theo hành động

| # | Hành động | DEV (máy dev) | CI (pipeline) | STAGING | UAT | PRODUCTION |
|---|---|---|---|---|---|---|
| 1 | Đọc file trong repo | ✅ Tự động | ✅ Tự động | ⚠️ Chỉ đọc file cấu hình | ⚠️ Chỉ đọc file cấu hình | ⚠️ Chỉ đọc file cấu hình |
| 2 | Sinh/sửa code trong thư mục dự án | ✅ Tự động | ❌ Không | ❌ Không | ❌ Không | ❌ Không |
| 3 | Chạy test / lint / build | ✅ Tự động | ✅ Tự động | ❌ Không | ❌ Không | ❌ Không |
| 4 | Tạo nhánh git | ✅ Tự động | ❌ Không | ❌ Không | ❌ Không | ❌ Không |
| 5 | Commit | ✅ Tự động (nhánh của mình) | ❌ Không | ❌ Không | ❌ Không | ❌ Không |
| 6 | Push nhánh của mình | ✅ Tự động | ❌ Không | ❌ Không | ❌ Không | ❌ Không |
| 7 | **Push thẳng `main`/`develop`** | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 8 | Mở Pull Request | ✅ Tự động | ⚠️ Chỉ bot CI | ❌ Không | ❌ Không | ❌ Không |
| 9 | **Merge PR** | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 10 | Cài package mới | ⚠️ Phải hỏi | ❌ Không | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 11 | Xoá file | ⚠️ Phải hỏi (file không phải mình tạo: ❌) | ❌ Không | ❌ Không | ❌ Không | ❌ Cấm |
| 12 | Sửa file CI/CD (`.github/workflows/**`) | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 13 | Sửa `constitution.md` / `SKILL.md` | ⚠️ Qua PR + Tech Lead duyệt | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 14 | Đọc/ghi `.env`, secret, khoá API | ❌ Cấm | ⚠️ Chỉ qua secret store của CI | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 15 | **Chạy migration CSDL** | ⚠️ Chỉ tạo file, KHÔNG tự chạy | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 16 | **Xoá / sửa dữ liệu** | ❌ Cấm (ngoài DB test local) | ❌ Cấm | ❌ Cấm | ❌ Cấm |
| 17 | **Deploy** | ❌ Cấm | ⚠️ Chỉ khi pipeline có phê duyệt | ❌ Cấm | ❌ Cấm (chỉ người) |
| 18 | Gọi API bên ngoài | ⚠️ Chỉ trong `ai-tool-scope.md` | ❌ Không | ❌ Cấm | ❌ Cấm |
| 19 | Truy cập dữ liệu Production | ❌ Cấm | ❌ Cấm | ⚠️ Chỉ dữ liệu đã masking | ❌ Cấm |
| 20 | Rollback | ❌ Không | ❌ Không | ⚠️ Chỉ qua Runbook | ✅ Qua Runbook, có người xác nhận |

**Cách đọc:** ✅ được tự động · ⚠️ phải hỏi/có điều kiện · ❌ cấm hoàn toàn.

## 3. Mức tự chủ theo môi trường

| Môi trường | Mức tự chủ của AI | Ví dụ được phép | Bắt buộc |
|---|---|---|---|
| **DEV** (máy dev cá nhân) | Cao | Sinh code, chạy test, commit, push nhánh, tạo PR | Không có secret thật ở máy dev |
| **CI** (pipeline tự động) | Rất thấp | Chạy test/lint/build, báo cáo kết quả | Đọc secret qua secret store; không ghi secret ra log |
| **STAGING** | Không (chỉ đọc) | Xem log, xem cấu hình | Chỉ dữ liệu đã masking/ẩn danh; **không dùng dữ liệu Production thật** |
| **UAT** | Không (chỉ đọc) | Xem log, xem cấu hình | Môi trường khách hàng kiểm thử; AI không được ghi/sửa gì — chỉ Test Lead/PO thao tác |
| **PRODUCTION** | Không | — | Mọi thao tác do **con người** thực hiện qua PAM + CI/CD, có 4-mắt |

### Vì sao STAGING/PRODUCTION chặn gần hết

- Dữ liệu Production chứa dữ liệu cá nhân → AI đọc là vi phạm phân loại dữ liệu (`data-classification.md`).
- Hành động trên Production khó hoàn tác → phải có người chịu trách nhiệm (AI không giữ vai trò A).
- Tài liệu gốc: deploy Production chỉ qua CI/CD pipeline, kiểm soát truy cập qua **PAM**, mọi thay đổi hạ tầng qua **IaC + PR**.

## 4. Ma trận công cụ cụ thể (điền theo dự án)

| Công cụ | Cho phép dùng | Môi trường | Ghi chú |
|---|---|---|---|
| [Tool AI viết code] | ✅ | DEV | Theo `ai-tool-scope.md` |
| [Tool đọc log] | ✅ chỉ đọc | STAGING (log đã masking) | |
| [Tool truy vấn CSDL] | ⚠️ phải hỏi | DEV (CSDL test) | ❌ với mọi CSDL có dữ liệu thật |
| [Tool deploy] | ❌ AI | — | Chỉ con người |
| [Tool tạo tài liệu] | ✅ | DEV | |
| [Terminal/shell] | ✅ có giới hạn | DEV | Chặn lệnh phá huỷ (`rm -rf /`, `DROP TABLE`) |

## 5. Hành động không hoàn tác được — luôn cần người xác nhận

Danh sách này **không có ngoại lệ**, kể cả môi trường DEV:

- Xoá dữ liệu / bảng / nhánh git đã push / thư mục
- Ghi đè hoặc xoá dữ liệu Production
- Gửi email / tin nhắn tới người dùng thật hoặc khách hàng
- Gọi API tính phí hoặc thay đổi trạng thái hệ thống bên thứ ba
- Đổi quyền truy cập, mật khẩu, khoá
- Publish/release (đóng gói phát hành)
- Bất kỳ thao tác nào có chi phí tài chính

## 6. Cơ chế thực thi (không chỉ ghi trên giấy)

| Lớp | Cách thực thi |
|---|---|
| 1. Chỉ dẫn cho AI | File này + `SKILL.md` + `AGENTS.md` |
| 2. Cấu hình tool | Allowlist/denylist trong cấu hình tool AI (quyền shell, đường dẫn được chạm) |
| 3. Cấu hình repo | Branch protection: cấm push thẳng `main`, bắt buộc PR review, bắt buộc CI xanh |
| 4. Cấu hình hạ tầng | PAM, MFA cho tài khoản quản trị, CI/CD chỉ dùng service account có quyền tối thiểu |
| 5. Quy trình | 4-mắt cho thay đổi Production; họp Go/No-Go trước go-live |

> ⚠️ **Chỉ ghi quy định vào tài liệu là không đủ.** Cấm AI push thẳng `main` phải được thể hiện ở branch protection, không chỉ ở dòng chữ trong file này.

## 7. Khi AI cần thực hiện hành động bị chặn

```text
1. AI DỪNG LẠI — không tự tìm cách lách (không dùng lệnh khác để đạt cùng kết quả)
2. AI MÔ TẢ   — muốn làm gì, vì sao cần, rủi ro nếu sai
3. AI ĐỀ XUẤT — lệnh/kịch bản cụ thể để con người tự chạy
4. NGƯỜI quyết định và thực hiện (hoặc từ chối)
5. GHI LẠI    — nếu việc quan trọng, ghi vào Q&A Log / Change Request
```

## 8. Checklist rà soát định kỳ (mỗi quý)

- [ ] Mọi mục trong ma trận công cụ vẫn còn đúng thực tế
- [ ] Branch protection còn bật (cấm push thẳng `main`, bắt buộc review)
- [ ] Không có AI tool nào ngoài `ai-tool-scope.md` đang được dùng
- [ ] Secret không nằm trong code/log/repo (đã scan)
- [ ] Tài khoản quản trị Production còn qua PAM + MFA
- [ ] CI/CD dùng service account có quyền tối thiểu
- [ ] Đã có 4-mắt cho mọi thay đổi Production
- [ ] Danh sách "hành động không hoàn tác được" đã cập nhật theo hệ thống hiện tại

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 7 và Phụ lục 3 mục 3.5 — tài liệu gốc nội bộ
- NIST SP 800-53 — Access Control, Least Privilege — https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- OWASP LLM Top 10 — LLM08 Excessive Agency — https://genai.owasp.org/llm-top-10/
- OWASP ASVS — https://owasp.org/www-project-application-security-verification-standard/
- GitHub Docs — About protected branches — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches

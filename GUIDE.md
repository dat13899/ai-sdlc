# Hướng dẫn AI-SDLC v5.9

> **AI-SDLC** (AI-Integrated Software Development Lifecycle) — quy trình phát triển phần mềm tích hợp AI, kết hợp **Spec-Driven Development** (GitHub Spec Kit) + **Agile/Scrum** + **DevOps**, bổ sung **AI Gate** và **Human Gate**. 14 bước, 5 giai đoạn, 8 điểm kiểm soát — AI làm được nhiều việc, nhưng mọi quyết định cuối cùng vẫn thuộc về con người.

**Website minh họa**: https://ai.btdat.io.vn/  
**Repo**: https://github.com/dat13899/ai-sdlc

---

## 1. Tổng quan

### 1.1 Vai trò của AI-SDLC

AI-SDLC là framework quản lý vòng đời phát triển phần mềm, trong đó AI 참여 vào hầu hết các bước nhưng **con người vẫn giữ vai trò quyết định cuối cùng** qua các Human Gate.

### 1.2 5 giai đoạn, 14 bước

| Giai đoạn | Mã | Tên bước | Gate |
|-----------|-----|----------|------|
| **Giai đoạn 1: Khởi định** | B1 | Project Charter & Kick-off | — |
| | B2 | Constitution & skill.md | Human Gate |
| **Giai đoạn 2: Yêu cầu** | B3 | Thu thập & phân tích yêu cầu | — |
| | B4 | Viết Spec (Specify) | — |
| | B5 | Làm rõ & chốt Spec (Clarify) | Human Gate |
| **Giai đoạn 3: Thiết kế & Phát triển** | B6 | Technical Plan & Kiến trúc | — |
| | B7 | Phân rã Task & sprint planning | — |
| | B8 | Coding (AI-assisted / agentic) | AI Gate |
| | B9 | Unit Test | AI Gate |
| | B10 | Code Review 2 tầng | Human Gate |
| **Giai đoạn 4: Kiểm thử & Triển khai** | B11 | Test Plan & Test Case | — |
| | B12 | SIT / Regression / UAT / ATTT & Hiệu năng | Human Gate |
| | B13 | Release & triển khai môi trường | Human Gate |
| **Giai đoạn 5: Vận hành** | B14 | Vận hành, giám sát & cải tiến | — |

### 1.3 8 điểm kiểm soát (Gate)

| Nhãn | Bước | Mô tả |
|------|------|-------|
| Human Gate #1 | B2 | Chốt Constitution & skill.md — xác định quy tắc AI, phạm vi, công cụ được phép dùng |
| Human Gate #2 | B5 | Chốt Spec sau khi làm rõ — xác nhận yêu cầu đã đủ chi tiết để triển khai |
| AI Gate #1 | B8 | AI review code tự động trước khi提交 — kiểm tra chất lượng, convention, security cơ bản |
| AI Gate #2 | B9 | Kiểm tra unit test coverage — AI đánh giá mức độ phủ test |
| Human Gate #3 | B10 | Review code 2 tầng — AI comment + người review/final approve |
| Human Gate #4 | B12 | Sign-off UAT/ATTT — xác nhận hệ thống đáp ứng yêu cầu & bảo mật |
| Human Gate #5 | B13 | Go/No-Go release — quyết định triển khai production |
| Human Gate #6 | B14 | Post-mortem & cập nhật constitution — rút kinh nghiệm, điều chỉnh quy trình |

### 1.4 Các bên liên quan (RACI)

| Vai trò | Trách nhiệm chính |
|---------|------------------|
| **Product Owner / Stakeholder** | Xác định yêu cầu, phê duyệt charter, sign-off UAT |
| **Business Analyst** | Thu thập yêu cầu, viết BRD, process flow, user journey |
| **Tech Lead / Architect** | Technical plan, kiến trúc, ADR, phân rã task |
| **Developer (AI-assisted)** | Coding, unit test, thực hiện convention commits |
| **QA / Tester** | Test plan, test case, thực hiện SIT/Regression/UAT |
| **DevOps / Release Manager** | Release note, rollback plan, triển khai môi trường |
| **Operations** | Vận hành, giám sát, post-mortem |

---

## 2. Cài đặt & Khởi động

### 2.1 Yêu cầu hệ thống

- **Node.js 18+** (không cần cài package gì thêm — zero dependency)
- **Cloudflared** (nếu muốn public tunnel)

### 2.2 Khởi động thủ công

```bash
cd ai-sdlc
node server.js
```

Server lắng nghe trên `http://localhost:3200`.

### 2.3 Khởi động tự động (Windows)

File `start.bat` là idempotent — chạy lần nào cũng được, đang chạy thì thoát.

Đã thêm vào `Startup\btdat-startup.bat` (chạy trước cloudflared) để tự động sau reboot.

---

## 3. Cấu trúc thư mục chi tiết

```
ai-sdlc/
├── .gitignore               # Quy tắc bỏ qua file khi commit
├── build.js                 # Generator chính: đọc src/ -> sinh public/
├── minws.js                 # Mini whitespace/tool phụ trợ
├── server.js                # Static server port 3200, bind 127.0.0.1, chặn path traversal
├── start.bat                # Script khởi động idempotent
├── test-scrollspy.js        # Test script kiểm tra scrollspy sidebar
├── zip.js                   # Tool nén các file mẫu thành zip
│
├── GUIDE.md                 # File hướng dẫn này
├── README.md                # README ngắn (tiếng Việt + tiếng Anh)
│
├── src/                     # NGUỒN (sửa ở đây)
│   ├── data.js              # Meta, 14 bước tóm tắt, gate, B2, bug, release, KPI — nội dung biên tập
│   ├── steps-detail.json    # 82 hàng bảng chi tiết 5 cột: Bước \| Người thực hiện \| Cách thức \| Lưu ý \| Biểu mẫu
│   ├── flow-mapping.json    # B1→B14 -> đường dẫn ảnh lưu đồ tương ứng
│   ├── templates.json       # Danh sách các file mẫu: id, label, đường dẫn
│   ├── styles.css           # CSS dark premium (Linear/Stripe): #0a0a0f, Inter, gradient violet→blue
│   ├── md.js                # Module chuyển đổi .md -> HTML cho popup
│   ├── tables-raw.json      # Dữ liệu bảng gốc (nguồn cho steps-detail.json)
│   ├── styles.css.bak       # Backup styles.css (xóa khi không cần)
│   └── steps-detail.json.bak # Backup steps-detail.json (xóa khi không cần)
│
├── templates/               # 43 FILE MẪU NGUYÊN (.md) — dùng làm template cho project thực tế
│   ├── phu-luc/             # Phụ lục (6 file)
│   │   ├── PL1-project-charter.md
│   │   ├── PL2-change-request.md
│   │   ├── PL3-bo-tai-lieu-b2.md
│   │   ├── PL4-bo-bieu-mau-b3.md
│   │   ├── PL5-bug-report.md
│   │   └── PL6-uat-signoff-go-no-go.md
│   │
│   ├── b2/                  # Biên bản & tài liệu kết quả (11 file)
│   │   ├── 4.1-interview-guide.md
│   │   ├── 4.2-bien-ban-hop.md
│   │   ├── 4.3-BRD.md
│   │   ├── 4.4-process-flow-user-journey.md
│   │   ├── 4.5-QA-log.md
│   │   ├── AGENTS.md
│   │   ├── CODING_CONVENTION.md
│   │   ├── SKILL.md
│   │   ├── adr-template.md
│   │   ├── ai-tool-scope.md
│   │   ├── constitution.md
│   │   ├── data-classification.md
│   │   ├── docs-index.md
│   │   ├── dor-dod.md
│   │   ├── glossary.md
│   │   ├── prompts.md
│   │   └── tool-permissions.md
│   │
│   ├── b3/                  # Báo cáo & tài liệu B3 (5 file)
│   │   ├── B3-1-bao-cao-thanh-thien.md
│   │   ├── B3-2-bao-cao-test.md
│   │   ├── B3-3-bao-cao-deploy.md
│   │   ├── B3-4-bao-cao-postmortem.md
│   │   └── ...
│   │
│   ├── rules/               # Quy tắc (7 file)
│   │   ├── brd-rules.md
│   │   ├── bpm-rules.md
│   │   ├── api-rules.md
│   │   ├── adr-rules.md
│   │   ├── code-review-rules.md
│   │   ├── test-rules.md
│   │   └── security-rules.md (nếu có)
│   │
│   ├── bo-sung/             # Bổ sung — template nghiệp vụ (10 file)
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── test-plan.md
│   │   ├── test-case-rtm.md
│   │   ├── code-review-checklist-nguoi.md
│   │   ├── conventional-commits.md
│   │   ├── runbook.md
│   │   ├── postmortem.md
│   │   └── CHANGELOG.md
│   │
│   └── quy-chuan/           # Quy ước chuẩn (5 file)
│       ├── standards-index.md
│       ├── dora-metrics.md
│       ├── ai-governance.md
│       ├── code-standards.md
│       └── naming-standards.md
│
├── public/                  # OUTPUT — Generated by build.js. KHÔNG SỬA TAY.
│   │
│   ├── index.html           # Trang chủ — bảng 14 bước + sidebar trái + sidebar phải + popup
│   │
│   ├── assets/
│   │   ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf   # PDF gốc 82 trang
│   │   ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt   # Text trích từ PDF
│   │   ├── luu-do/
│   │   │   ├── B1.png  ...  B14.png                            # 14 lưu đồ PNG
│   │   │
│   │   └── mau/                              # File mẫu đã render HTML (cho popup)
│   │       ├── index.html                    # Trang danh sách tất cả mẫu
│   │       ├── mau-va-tai-lieu.html         # (nếu có)
│   │       ├── AI-SDLC-mau-tat-ca.zip       # Nén tất cả file mẫu .md
│   │       │
│   │       ├── {ten-mau}.html                # Mỗi file mẫu -> 1 HTML (popup)
│   │       ├── adr-rules.html
│   │       ├── adr-template.html
│   │       ├── agents.html
│   │       ├── ai-governance.html
│   │       ├── ai-tool-scope.html
│   │       ├── api-rules.html
│   │       ├── brd.html
│   │       ├── brd-rules.html
│   │       ├── changelog.html
│   │       ├── code-review-human.html
│   │       ├── code-review-rules.html
│   │       ├── coding-convention.html
│   │       ├── constitution.html
│   │       ├── conventional-commits.html
│   │       ├── data-classification.html
│   │       ├── docs-index.html
│   │       ├── dora-metrics.html
│   │       ├── dor-dod.html
│   │       ├── glossary.html
│   │       ├── interview-guide.html
│   │       ├── meeting-minutes.html
│   │       ├── pl1-project-charter.html
│   │       ├── pl2-change-request.html
│   │       ├── pl3-bo-tai-lieu-b2.html
│   │       ├── pl4-bo-bieu-mau-b3.html
│   │       ├── pl5-bug-report.html
│   │       ├── pl6-uat-go-no-go.html
│   │       ├── plan.html
│   │       ├── postmortem.html
│   │       ├── process-flow.html
│   │       ├── prompts.html
│   │       ├── qa-log.html
│   │       ├── runbook.html
│   │       ├── skill.html
│   │       ├── spec.html
│   │       ├── standards-index.html
│   │       ├── tasks.html
│   │       ├── test-case-rtm.html
│   │       ├── test-plan.html
│   │       ├── test-rules.html
│   │       ├── threat-model.html
│   │       └── tool-permissions.html
│   │       │
│   │       └── raw/                          # Copy .md gốc để tải về
│   │           ├── b2/
│   │           │   ├── adr-template.md
│   │           │   ├── AGENTS.md
│   │           │   ├── ai-tool-scope.md
│   │           │   ├── CODING_CONVENTION.md
│   │           │   ├── constitution.md
│   │           │   ├── data-classification.md
│   │           │   ├── docs-index.md
│   │           │   ├── dor-dod.md
│   │           │   ├── glossary.md
│   │           │   ├── prompts.md
│   │           │   ├── SKILL.md
│   │           │   └── tool-permissions.md
│   │           │
│   │           ├── b3/
│   │           │   ├── 4.1-interview-guide.md
│   │           │   ├── 4.2-bien-ban-hop.md
│   │           │   ├── 4.3-BRD.md
│   │           │   ├── 4.4-process-flow-user-journey.md
│   │           │   └── 4.5-QA-log.md
│   │           │
│   │           ├── bo-sung/
│   │           │   ├── CHANGELOG.md
│   │           │   ├── code-review-checklist-nguoi.md
│   │           │   ├── conventional-commits.md
│   │           │   ├── plan.md
│   │           │   ├── postmortem.md
│   │           │   ├── runbook.md
│   │           │   ├── spec.md
│   │           │   ├── tasks.md
│   │           │   ├── test-case-rtm.md
│   │           │   ├── test-plan.md
│   │           │   └── threat-model-STRIDE.md
│   │           │
│   │           ├── phu-luc/
│   │           │   ├── PL1-project-charter.md
│   │           │   ├── PL2-change-request.md
│   │           │   ├── PL3-bo-tai-lieu-b2.md
│   │           │   ├── PL4-bo-bieu-mau-b3.md
│   │           │   ├── PL5-bug-report.md
│   │           │   └── PL6-uat-signoff-go-no-go.md
│   │           │
│   │           ├── quy-chuan/
│   │           │   ├── ai-governance.md
│   │           │   ├── dora-metrics.md
│   │           │   └── standards-index.md
│   │           │
│   │           └── rules/
│   │               ├── adr-rules.md
│   │               ├── api-rules.md
│   │               ├── bpm-rules.md
│   │               ├── brd-rules.md
│   │               ├── code-review-rules.md
│   │               └── test-rules.md
│
└── refs/                    # TÀI LIỆU THAM KHẢO (không sinh ra, không sửa bằng build)
    ├── spec-kit-tasks.md        # GitHub Spec Kit — tasks.md
    ├── spec-kit-spec.md         # GitHub Spec Kit — spec.md
    ├── spec-kit-plan.md         # GitHub Spec Kit — plan.md
    ├── spec-kit-constitution.md # GitHub Spec Kit — constitution.md
    ├── spec-driven.md           # Spec-Driven Development tổng quan
    ├── madr-template.md         # MADR template đầy đủ
    ├── madr-minimal.md          # MADR minimal version
    ├── madr-docs.md             # Hướng dẫn viết Architecture Decision Records
    ├── asvs5.md                # OWASP Application Security Verification Standard 5.0
    ├── asvs403.md              # OWASP ASVS 4.0.3
    ├── asvs.csv                # Danh sách requirement ASVS (dạng bảng)
    ├── asvs-readme.md          # Hướng dẫn sử dụng ASVS trong project
    └── agents-fallback.md      # Chiến lược fallback khi AI agent không hoạt động
```

---

## 4. Cách cập nhật nội dung

### 4.1 Sửa nội dung biên tập (meta, tóm tắt)

File: `src/data.js`

Chứa: tiêu đề, mô tả ngắn, 14 bước tóm tắt, danh sách gate, B2, bug, release, KPI...

### 4.2 Sửa bảng chi tiết 14 bước (82 hàng)

File: `src/steps-detail.json`

Mỗi hàng có 6 phần tử:

```json
[
  "Tên bước",
  "Người thực hiện",
  "Cách thức",
  "Lưu ý",
  "Tên hiển thị trong ô Biểu mẫu",
  [ {"id": "id-cua-bieu-mau", "label": "Nhãn hiển thị"} ]
]
```

- `id` phải khớp với một mục trong `src/templates.json`
- `build.js` render thành link `/mau/<id>.html`
- Nếu id không tồn tại → in chữ thường, không tạo link hỏng

### 4.3 Thêm/Sửa file mẫu

File mẫu nằm trong `templates/`. Có 2 tháng này:

**Cách 1 — Thêm vào `src/templates.json`**:
```json
{
  "id": "ten-file-moi",
  "label": "Nhãn hiển thị trong popup",
  "file": "duong-dan/den/file.md"
}
```

**Cách 2 — Liên kết với bước**:
Thêm `{"id": "ten-file-moi", "label": "Nhãn"}` vào mảng links (phần tử thứ 6) của hàng tương ứng trong `src/steps-detail.json`.

### 4.4 Sinh lại trang

```bash
node build.js
```

Kết quả:
- Đọc `src/data.js`, `src/steps-detail.json`, `src/templates.json`, `src/styles.css`
- Render `public/index.html` (~620 KB, ~154 KB gzipped/brotli)
- Render `public/mau/*.html` cho từng file mẫu (popup)
- Copy `templates/*` → `public/mau/raw/` để user tải về

Server đọc file từ đĩa mỗi request — **không cần restart**.

---

## 5. Các file mẫu (43 file)

### 5.1 Phụ lục (phu-luc) — 6 file

| File | Mô tả |
|------|-------|
| `PL1-project-charter.md` | Project Charter — khung bắt đầu dự án |
| `PL2-change-request.md` | Change Request — yêu cầu thay đổi phạm vi |
| `PL3-bo-tai-lieu-b2.md` | Báo cáo tài liệu B2 — hướng dẫn làm tài liệu B2 |
| `PL4-bo-bieu-mau-B3.md` | Báo biểu mẫu B3 — template báo cáo B3 |
| `PL5-bug-report.md` | Bug Report — template báo cáo lỗi |
| `PL6-uat-signoff-go-no-go.md` | UAT Sign-off / Go-No-Go — template quyết định release |

### 5.2 Biên bản & tài liệu B2 (b2) — 11 file

| File | Mô tả |
|------|-------|
| `4.1-interview-guide.md` | Hướng dẫn phỏng vấn stakeholder |
| `4.2-bien-ban-hop.md` | Biên bản họp — template họp yêu cầu |
| `4.3-BRD.md` | Business Requirements Document — template BRD |
| `4.4-process-flow-user-journey.md` | Process flow + User journey |
| `4.5-QA-log.md` | Q&A Log — ghi chép câu hỏi & câu trả lời làm rõ |
| `AGENTS.md` | Hướng dẫn cấu hình AI agent |
| `CODING_CONVENTION.md` | Coding convention — quy ước viết code |
| `SKILL.md` | Skill definition — kỹ năng cần thiết cho AI |
| `adr-template.md` | Architecture Decision Record template |
| `ai-tool-scope.md` | Phạm vi công cụ AI được phép dùng |
| `constitution.md` | Constitution — điều lệ quy trình AI |
| `data-classification.md` | Phân loại dữ liệu — phân loại sensitivity |
| `docs-index.md` | Index tài liệu — danh sách tài liệu project |
| `dor-dod.md` | Definition of Ready / Definition of Done |
| `glossary.md` | Glossary — từ điển thuật ngữ |
| `prompts.md` | Prompts — tập prompts dùng cho AI |
| `tool-permissions.md` | Quyền hạn công cụ — ai làm gì với công cụ nào |

### 5.3 Báo cáo & tài liệu B3 (b3) — 5 file

| File | Mô tả |
|------|-------|
| `B3-1-bao-cao-thanh-thien.md` | Báo cáo thanh tích — tiến độ thực tế vs kế hoạch |
| `B3-2-bao-cao-test.md` | Báo cáo test — kết quả test, bug, coverage |
| `B3-3-bao-cao-deploy.md` | Báo cáo deploy — log triển khai, vấn đề, rollback |
| `B3-4-bao-cao-postmortem.md` | Báo cáo hậu sự — rút kinh nghiệm sau sự cố |
| *(còn tiếp trong templates/b3)* | |

### 5.4 Quy tắc (rules) — 7 file

| File | Mô tả |
|------|-------|
| `brd-rules.md` | Quy tắc viết BRD |
| `bpm-rules.md` | Quy tắc BPM/BPMN |
| `api-rules.md` | Quy tắc thiết kế API |
| `adr-rules.md` | Quy tắc viết ADR |
| `code-review-rules.md` | Quy tắc code review |
| `test-rules.md` | Quy tắc Testing |
| `security-rules.md` | Quy tắc bảo mật |

### 5.5 Bổ sung (bo-sung) — 10 file

| File | Mô tả |
|------|-------|
| `spec.md` | Template spec (Spec-Driven Development) |
| `plan.md` | Template Technical Plan |
| `tasks.md` | Template tasks.md (phân rã task) |
| `test-plan.md` | Template Test Plan |
| `test-case-rtm.md` | Template Test Case + RTM (Requirements Traceability Matrix) |
| `code-review-checklist-nguoi.md` | Checklist code review dành cho người review |
| `conventional-commits.md` | Quy ước đặt tên commit (Conventional Commits) |
| `runbook.md` | Template Runbook — hướng dẫn vận hành |
| `postmortem.md` | Template Post-mortem — phân tích sau sự cố |
| `CHANGELOG.md` | Template CHANGELOG — ghi chép thay đổi |

### 5.6 Quy ước chuẩn (quy-chuan) — 5 file

| File | Mô tả |
|------|-------|
| `standards-index.md` | Index các chuẩn áp dụng |
| `dora-metrics.md` | Metrics DORA — đo lường hiệu suất DevOps |
| `ai-governance.md` | Quản trị AI — nguyên tắc, phạm vi, rủi ro |
| `code-standards.md` | Chuẩn code — style, convention, best practice |
| `naming-standards.md` | Chuẩn đặt tên — biến, hàm, class, file, branch |

---

## 6. Tài liệu tham khảo (refs/)

| Tên file | Nội dung |
|----------|----------|
| `spec-kit-tasks.md` | GitHub Spec Kit — định dạng tasks.md |
| `spec-kit-spec.md` | GitHub Spec Kit — định dạng spec.md |
| `spec-kit-plan.md` | GitHub Spec Kit — định dạng plan.md |
| `spec-kit-constitution.md` | GitHub Spec Kit — constitution.md |
| `spec-driven.md` | Tổng quan Spec-Driven Development |
| `madr-template.md` | MADR (Markdown Architecture Decision Records) template đầy đủ |
| `madr-minimal.md` | MADR minimal — phiên bản ngắn gọn |
| `madr-docs.md` | Hướng dẫn viết Architecture Decision Record |
| `asvs5.md` | OWASP ASVS 5.0 — chuẩn bảo mật ứng dụng web |
| `asvs403.md` | OWASP ASVS 4.0.3 — bản cũ hơn |
| `asvs.csv` | Danh sách requirement ASVS dạng bảng (dễ tra cứu) |
| `asvs-readme.md` | Hướng dẫn áp dụng ASVS trong project |
| `agents-fallback.md` | Chiến lược fallback khi AI agent gặp lỗi |

---

## 7. Lưu đồ (Flowcharts)

14 lưu đồ PNG trong `public/assets/luu-do/`, sinh từ PDF gốc:

| File | Bước | Nội dung |
|------|------|----------|
| `B1.png` | B1 | Project Charter & Kick-off — khởi động dự án |
| `B2.png` | B2 | Constitution & skill.md — thiết lập quy tắc |
| `B3.png` | B3 | Thu thập & phân tích yêu cầu — BRD, process flow, user journey |
| `B4.png` | B4 | Viết Spec — spec.md, user story, acceptance criteria, SRS |
| `B5.png` | B5 | Làm rõ & chốt Spec — Q&A log, biên bản duyệt Spec |
| `B6.png` | B6 | Technical Plan & Kiến trúc — plan.md, ADR, C4 Model, ERD, OpenAPI 3.x |
| `B7.png` | B7 | Phân rã Task & sprint planning — tasks.md, Jira ticket, sprint backlog |
| `B8.png` | B8 | Coding — code, commit theo Conventional Commits, PR |
| `B9.png` | B9 | Unit Test — unit test, coverage report, mutation score |
| `B10.png` | B10 | Code Review 2 tầng — AI comment + người review + PR merge |
| `B11.png` | B11 | Test Plan & Test Case — test plan, test case, RTM, automation script |
| `B12.png` | B12 | SIT / Regression / UAT / ATTT & Hiệu năng — biên bản, báo cáo |
| `B13.png` | B13 | Release & triển khai — release note, rollback plan, checklist Go/No-Go |
| `B14.png` | B14 | Vận hành, giám sát & cải tiến — runbook, post-mortem, constitution.md cập nhật |

---

## 8. Đăng_triển online (Cloudflare Tunnel)

### 8.1 Cloudflare Tunnel

Ingress trong `~/.cloudflared/config.yml`:

```yaml
- hostname: ai.btdat.io.vn
  service: http://localhost:3200
```

Kiểm tra:

```bash
cloudflared tunnel ingress rule https://ai.btdat.io.vn/ \
  --config "C:/Users/datel/.cloudflared/config.yml"
# -> Matched rule #7  hostname: ai.btdat.io.vn  service: http://localhost:3200
```

### 8.2 DNS Record (thủ công — cần làm 1 lần)

Trong Cloudflare Dashboard:

| Trường | Giá trị |
|--------|---------|
| Type | `CNAME` |
| Name | `ai` |
| Target | `b3e9ea6a-9ed9-41fc-be71-66f52b31fef3.cfargotunnel.com` |
| Proxy | **ON** (màu cam) |

Chờ ~1 phút là `https://ai.btdat.io.vn/` hoạt động.

---

## 9. Sử dụng trang web

### 9.1 Navigation

- **Sidebar trái**: danh sách 14 bước (B1→B14), click để scroll đến bước tương ứng
- **Sidebar phải**: danh sách file mẫu, click để mở POPUP xem nội dung

### 9.2 Xem chi tiết từng bước

1. Click vào bước trong sidebar trái → trang scroll đến vị trí bước đó
2. Xem bảng chi tiết 5 cột: **Bước | Người thực hiện | Cách thức | Lưu ý | Biểu mẫu**
3. Click vào ô **Biểu mẫu** → mở POPUP xem nội dung file mẫu tương ứng

### 9.3 Xem file mẫu (popup)

- Nhấp **Biểu mẫu** trong bảng → popup hiển thị nội dung file `.md` đã render HTML
- Các nút trong popup:
  - **"Mở trang riêng ↗"** — mở file mẫu trong tab mới
  - **"⬇ Tải .md"** — tải file `.md` gốc về máy
- Đóng popup: `Esc`, nút ✕, hoặc click ngoài popup
- **Ctrl/Cmd/Shift/Alt-click** hoặc **click chuột giữa** → mở tab mới (như mặc định trình duyệt)

### 9.4 Tải tất cả mẫu về

Đường dẫn: `https://ai.btdat.io.vn/assets/mau/AI-SDLC-mau-tat-ca.zip`

Hoặc nếu chạy local: `http://localhost:3200/assets/mau/AI-SDLC-mau-tat-ca.zip`

---

## 10. Xử lý sự cố

### Server không chạy

```bash
# Kiểm tra port
netstat -ano | findstr :3200

# Kill process nếu cần (thay PID)
taskkill /F /PID <PID>

# Restart
node server.js
```

### Cloudflare Tunnel không kết nối

```bash
# Kiểm tra tunnel
cloudflared tunnel list

# Restart tunnel
cloudflared tunnel --config "C:/Users/datel/.cloudflared/config.yml" run
```

### Trang không cập nhật sau khi sửa

```bash
# Sinh lại
node build.js

# Kiểm tra server log
type server.log
```

### Lỗi popup không hiển thị mẫu

- Kiểm tra `src/templates.json` — id có tồn tại không
- Kiểm tra `src/steps-detail.json` — cấu trúc mỗi hàng đúng 6 phần tử không
- Chạy lại `node build.js` để nhúng nội dung mẫu mới

### Lỗi CORS hoặc đường dẫn hỏng

- Kiểm tra `src/templates.json` — id phải khớp với file trong `templates/`
- Kiểm tra `src/steps-detail.json` — cấu trúc mỗi hàng phải đúng 6 phần tử
- Đảm bảo đường dẫn trong `flow-mapping.json` khớp với file PNG thực tế

---

## 11. Các file utility

| File | Mô tả |
|------|-------|
| `build.js` | Generator chính — đọc src/ → sinh public/ |
| `minws.js` | Mini tool phụ trợ (nén/whitespace) |
| `zip.js` | Tạo file zip chứa tất cả mẫu (dùng để sinh `AI-SDLC-mau-tat-ca.zip`) |
| `test-scrollspy.js` | Test script kiểm tra sidebar scrollspy hoạt động đúng |
| `start.bat` | Script khởi động Windows (idempotent) |

---

## 12. Kiểm chứng

- Origin: HTTP 200, HTML ~70.5 KB, `Host: ai.btdat.io.vn` trả 200.
- Ảnh lưu đồ: 14/14 trả 200, `naturalWidth > 0` (không ảnh vỡ).
- Responsive: `scrollWidth == clientWidth` ở 390px / 768px / 1340px.
- Các site khác trên cùng tunnel: btdat.io.vn 200, daily 200, uptime 302 — không bị ảnh hưởng.
- Popup: mở/đóng bình thường, không phụ thuộc external JS, chạy được cả `file://`.

---

## 13. Liên hệ

- Website: https://ai.btdat.io.vn/
- GitHub: https://github.com/dat13899/ai-sdlc
- Source PDF gốc: `public/assets/quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf`
- Nội dung text trích: `public/assets/quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt`

# Hướng dẫn AI-SDLC v5.9

> **AI-SDLC** (AI-Integrated Software Development Lifecycle) — quy trình phát triển phần mềm tích hợp AI, kết hợp **Spec-Driven Development** (GitHub Spec Kit) + **Agile/Scrum** + **DevOps**, bổ sung **AI Gate** và **Human Gate**. 14 bước, 5 giai đoạn, 8 điểm kiểm soát — AI làm được nhiều việc, nhưng mọi quyết định cuối cùng vẫn thuộc về con người.

Website minh họa: https://ai.btdat.io.vn/

---

## Tổng quan

### 5 giai đoạn, 14 bước

| Giai đoạn | Bước | Tên bước | Gate |
|-----------|------|----------|------|
| **Giai đoạn 1: Khởi định** | B1 | Project Charter & Kick-off | |
| | B2 | Constitution & skill.md | Human Gate |
| **Giai đoạn 2: Yêu cầu** | B3 | Thu thập & phân tích yêu cầu | |
| | B4 | Viết Spec (Specify) | |
| | B5 | Làm rõ & chốt Spec (Clarify) | Human Gate |
| **Giai đoạn 3: Thiết kế & Phát triển** | B6 | Technical Plan & Kiến trúc | |
| | B7 | Phân rã Task & sprint planning | |
| | B8 | Coding (AI-assisted / agentic) | AI Gate |
| | B9 | Unit Test | AI Gate |
| | B10 | Code Review 2 tầng | Human Gate |
| **Giai đoạn 4: Kiểm thử & Triển khai** | B11 | Test Plan & Test Case | |
| | B12 | SIT / Regression / UAT / ATTT & Hiệu năng | Human Gate |
| | B13 | Release & triển khai môi trường | Human Gate |
| **Giai đoạn 5: Vận hành** | B14 | Vận hành, giám sát & cải tiến | |

### 8 điểm kiểm soát (Gate)

| Gate | Mục đích | Bước |
|------|----------|------|
| **Human Gate #1** | Chốt Constitution & skill.md — xác định quy tắc AI, phạm vi, công cụ | B2 |
| **AI Gate #1** | Kiểm tra code trước khi merge — AI review tự động | B8 |
| **AI Gate #2** — kiểm tra unit test coverage | B9 |
| **Human Gate #2** — review code 2 tầng (AI + người) | B10 |
| **Human Gate #3** — chốt Spec sau khi làm rõ | B5 |
| **Human Gate #4** — Sign-off UAT/ATTT | B12 |
| **Human Gate #5** — Go/No-Go release | B13 |
| **Human Gate #6** — Post-mortem & cập nhật constitution | B14 |

---

## Cài đặt & Chạy

### Yêu cầu
- Node.js 18+ (không cần package nào khác — zero dependency)

### Khởi động

```bash
# Vào thư mục
cd ai-sdlc

# Chạy server
node server.js
```

Server lắng nghe trên `http://localhost:3200`.

### Tự động khởi động sau reboot

Đã thêm vào `Startup\btdat-startup.bat` (chạy trước cloudflared). Hoặc chạy tay: `start.bat` (idempotent — đang chạy thì thoát).

---

## Cấu trúc thư mục

```
ai-sdlc/
├── server.js                  # Static server, port 3200, bind 127.0.0.1
├── build.js                   # Generator: data.js + steps-detail.json -> public/index.html
├── start.bat                  # Khởi động idempotent
├── .gitignore                 # Các file cần bỏ qua khi commit
├── GUIDE.md                   # File này
├── README.md                  # README chính (tiếng Anh + tiếng Việt)
├── src/
│   ├── data.js                # Nội dung biên tập (meta, 14 bước, gate, B2, bug, release, KPI…)
│   ├── steps-detail.json      # 82 hàng bảng "Bước/Người thực hiện/Cách thức/Lưu ý/Biểu mẫu" trích từ PDF
│   ├── flow-mapping.json      # B1..B14 -> đường dẫn ảnh lưu đồ
│   ├── styles.css             # Dark premium (Linear/Stripe): #0a0a0f, Inter, gradient violet→blue
│   └── templates.json         # Danh sách file mẫu (.md) để render popup
├── templates/                 # 43 file mẫu (.md) cho các bước
│   ├── phu-luc/               # Phụ lục (7 file)
│   ├── b2/                    # Biên bản (4 file)
│   ├── rules/                 # Quy tắc (7 file)
│   ├── b3/                    # Báo cáo (4 file)
│   ├── bo-sung/               # Bổ sung (10 file)
│   └── quy-chuan/             # Quy ước (5 file)
├── refs/                      # Tài liệu tham khảo
│   ├── spec-kit-tasks.md
│   ├── spec-kit-spec.md
│   ├── spec-kit-plan.md
│   ├── spec-kit-constitution.md
│   ├── spec-driven.md
│   ├── madr-template.md
│   ├── madr-minimal.md
│   ├── madr-docs.md
│   ├── asvs5.md
│   ├── asvs403.md
│   ├── asvs.csv
│   ├── asvs-readme.md
│   └── agents-fallback.md
└── public/                    # OUTPUT của build.js + assets (không sửa tay)
    ├── index.html             # Trang chủ (tự động sinh)
    └── assets/
        ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf   # Bản gốc, không sửa
        ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt   # Text trích
        ├── luu-do/B1..B14.png                                    # 14 lưu đồ
        ├── mau/interview-guide.html
        └── mau/index.html
```

---

## Cập nhật nội dung

### Sửa nội dung biên tập

Mở `src/data.js` — chứa meta, 14 bước tóm tắt, gate, B2, bug, release, KPI…

### Sửa bảng chi tiết 14 bước

Mở `src/steps-detail.json` — chứa 82 hàng chi tiết (Bước | Người thực hiện | Cách thức | Lưu ý | Biểu mẫu).

**CẤU TRÚC MỘT HÀNG:**
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

### Thêm/Sửa file mẫu

File mẫu nằm trong `templates/`. Để liên kết mẫu với bước:

1. Thêm mục trong `src/templates.json` (nếu chưa có)
2. Thêm `{id, label}` vào mảng links của bước tương ứng trong `src/steps-detail.json`
3. Chạy `node build.js` để sinh lại `public/index.html`

### Sinh lại trang

```bash
node build.js
```

Server đọc file từ đĩa mỗi request — không cần restart.

---

## Đăng triễn online (Cloudflare Tunnel)

### 1. Cloudflare Tunnel

Ingress đã cấu hình trong `~/.cloudflared/config.yml`:

```yaml
- hostname: ai.btdat.io.vn
  service: http://localhost:3200
```

Kiểm tra:

```bash
cloudflared tunnel ingress rule https://ai.btdat.io.vn/ --config "C:/Users/datel/.cloudflared/config.yml"
# -> Matched rule #7  hostname: ai.btdat.io.vn  service: http://localhost:3200
```

### 2. DNS Record (thủ công — cần làm 1 lần)

Trong Cloudflare Dashboard:

| Trường | Giá trị |
|--------|---------|
| Type | `CNAME` |
| Name | `ai` |
| Target | `b3e9ea6a-9ed9-41fc-be71-66f52b31fef3.cfargotunnel.com` |
| Proxy | **ON** (màu cam) |

Chờ ~1 phút là `https://ai.btdat.io.vn/` hoạt động.

---

## Sử dụng trang web

### Navigation

- **Sidebar trái**: danh sách 14 bước, click để scroll đến bước tương ứng
- **Sidebar phải**: liên kết đến các file mẫu (POPUP khi click)

### Xem chi tiết từng bước

1. Click vào bước trong sidebar trái → trang scroll đến vị trí bước đó
2. Xem bảng chi tiết 5 cột: Bước | Người thực hiện | Cách thức | Lưu ý | Biểu mẫu
3. Click vào **Biểu mẫu** → mở POPUP xem nội dung file mẫu (không rời trang)

### Tải file mẫu

Trong popup, click **"⬇ Tải .md"** để download file mẫu về.

### Mở trang mẫu riêng

Trong popup, click **"Mở trang riêng ↗"** để mở file mẫu trong tab mới.

---

## Các file mẫu (43 file)

### Phụ lục (phu-luc) — 7 file
| File | Mô tả |
|------|-------|
| PL1-project-charter.md | Charter dự án |
| PL2-change-request.md | Yêu cầu thay đổi |
| PL3-bo-tai-lieu-b2.md | Báo cáo tài liệu B2 |
| PL4-bo-bieu-mau-B3.md | Báo biểu mẫu B3 |
| PL5-bug-report.md | Báo cáo lỗi |
| PL6-uat-signoff-go-no-go.md | UAT Sign-off / Go-No-Go |

### Biên bản (b2) — 4 file
| File | Mô tả |
|------|-------|
| B2-1-biên-bản-hep.md | Biên bản họp |
| B2-2-biên-bản-review.md | Biên bản review |
| B2-3-biên-bản-phai.md | Biên bản phân công |
| B2-4-biên-bản-duyet.md | Biên bản phê duyệt |

### Quy tắc (rules) — 7 file
| File | Mô tả |
|------|-------|
| brd-rules.md | Quy tắc BRD |
| bpm-rules.md | Quy tắc BPM |
| api-rules.md | Quy tắc API |
| adr-rules.md | Quy tắc ADR |
| code-review-rules.md | Quy tắc code review |
| test-rules.md | Quy tắc test |
| security-rules.md | Quy tắc bảo mật |

### Báo cáo (b3) — 4 file
| File | Mô tả |
|------|-------|
| B3-1-bao-cao-thanh-thien.md | Báo cáo thanh tích |
| B3-2-bao-cao-test.md | Báo cáo test |
| B3-3-bao-cao-deploy.md | Báo cáo deploy |
| B3-4-bao-cao-postmortem.md | Báo cáo hậu sự |

### Bổ sung (bo-sung) — 10 file
| File | Mô tả |
|------|-------|
| spec.md | Template spec |
| plan.md | Template technical plan |
| tasks.md | Template tasks |
| test-plan.md | Template test plan |
| test-case-rtm.md | Template test case / RTM |
| code-review-checklist-nguoi.md | Checklist code review (người) |
| conventional-commits.md | Quy ước conventional commits |
| runbook.md | Template runbook |
| postmortem.md | Template postmortem |
| CHANGELOG.md | Template CHANGELOG |

### Quy ước (quy-chuan) — 5 file
| File | Mô tả |
|------|-------|
| standards-index.md | Index các chuẩn |
| dora-metrics.md | Metrics DORA |
| ai-governance.md | Quản trị AI |
| code-standards.md | Chuẩn code |
| naming-standards.md | Chuẩn đặt tên |

---

## Tài liệu tham khảo

| File | Nội dung |
|------|----------|
| `refs/spec-kit-tasks.md` | GitHub Spec Kit — tasks.md |
| `refs/spec-kit-spec.md` | GitHub Spec Kit — spec.md |
| `refs/spec-kit-plan.md` | GitHub Spec Kit — plan.md |
| `refs/spec-kit-constitution.md` | GitHub Spec Kit — constitution.md |
| `refs/spec-driven.md` | Spec-Driven Development tổng quan |
| `refs/madr-template.md` | MADR template đầy đủ |
| `refs/madr-minimal.md` | MADR minimal |
| `refs/madr-docs.md` | Hướng dẫn viết MADR |
| `refs/asvs5.md` | OWASP ASVS 5.0 |
| `refs/asvs403.md` | OWASP ASVS 4.0.3 |
| `refs/asvs.csv` | Danh sách requirement ASVS |
| `refs/asvs-readme.md` | Hướng dẫn sử dụng ASVS |
| `refs/agents-fallback.md` | Fallback khi agent không hoạt động |

---

## Lưu đồ (Flowcharts)

14 lưu đồ PNG trong `public/assets/luu-do/`:

| File | Bước | Mô tả |
|------|------|-------|
| B1.png | B1 | Project Charter & Kick-off |
| B2.png | B2 | Constitution & skill.md |
| B3.png | B3 | Thu thập & phân tích yêu cầu |
| B4.png | B4 | Viết Spec (Specify) |
| B5.png | B5 | Làm rõ & chốt Spec (Clarify) |
| B6.png | B6 | Technical Plan & Kiến trúc |
| B7.png | B7 | Phân rã Task & sprint planning |
| B8.png | B8 | Coding (AI-assisted / agentic) |
| B9.png | B9 | Unit Test |
| B10.png | B10 | Code Review 2 tầng |
| B11.png | B11 | Test Plan & Test Case |
| B12.png | B12 | SIT / Regression / UAT / ATTT & Hiệu năng |
| B13.png | B13 | Release & triển khai môi trường |
| B14.png | B14 | Vận hành, giám sát & cải tiến |

---

## Kiểm chứng

- Origin: HTTP 200, 70,5 KB HTML, `Host: ai.btdat.io.vn` trả 200.
- Ảnh lưu đồ: 14/14 trả 200, `naturalWidth > 0` (không ảnh vỡ).
- Không tràn ngang: `scrollWidth == clientWidth` ở 390px / 768px / 1340px.
- Các site khác trên cùng tunnel: btdat.io.vn 200, daily 200, uptime 302 — không bị ảnh hưởng.

---

## Xử lý sự cố

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

### Lỗi CORS hoặc đường dẫn hỏng
- Kiểm tra `src/templates.json` — id phải khớp với file trong `templates/`
- Kiểm tra `src/steps-detail.json` — cấu trúc mỗi hàng phải đúng 6 phần tử

---

## Liên hệ

- Website: https://ai.btdat.io.vn/
- Repo: https://github.com/dat13899/ai-sdlc
- Source PDF gốc: `public/assets/quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf`

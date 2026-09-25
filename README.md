# AI-SDLC site — ai.btdat.io.vn

Web hoá quy trình **AI-SDLC v5.9** (Quy trình phát triển phần mềm tích hợp AI) — 14 bước, 5 giai đoạn, 8 gate, 17 file luật cho AI.

Nội dung **trích tự động từ PDF gốc**, không gõ lại tay: 82 hàng bảng chi tiết (5 cột) + 14 lưu đồ PNG.

## Chạy

```bash
node server.js          # http://localhost:3200
```

Zero dependency — chỉ cần Node.js. Serve tĩnh thư mục `public/`, có chặn path traversal.

Tự lên sau khi reboot: đã thêm vào `Startup\btdat-startup.bat` (chạy trước cloudflared).
Hoặc chạy tay: `start.bat` (idempotent — đang chạy thì thoát).

## Cấu trúc

```
ai-sdlc/
├── server.js                  # static server, port 3200, bind 127.0.0.1
├── build.js                   # generator: data.js + steps-detail.json -> public/index.html
├── start.bat                  # khởi động idempotent
├── src/
│   ├── data.js                # nội dung biên tập (meta, 14 bước, gate, B2, bug, release, KPI…)
│   ├── steps-detail.json      # 82 hàng bảng "Bước/Người thực hiện/Cách thức/Lưu ý/Biểu mẫu" trích từ PDF
│   ├── flow-mapping.json      # B1..B14 -> đường dẫn ảnh lưu đồ
│   ├── styles.css             # dark premium (Linear/Stripe): #0a0a0f, Inter, gradient violet→blue
│   └── steps-detail.json      # (nguồn) — sửa ở đây nếu PDF đổi
└── public/                    # OUTPUT của build.js + assets (không sửa tay)
    ├── index.html
    └── assets/
        ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf   # bản gốc, không sửa
        ├── quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt   # text trích
        └── luu-do/B1..B14.png                                    # 14 lưu đồ
```

## Cập nhật nội dung

```bash
# sửa src/data.js (nội dung biên tập) hoặc src/steps-detail.json (bảng chi tiết)
node build.js     # -> public/index.html
```

Không cần restart server: `server.js` đọc file từ đĩa mỗi request.

### Cột "Biểu mẫu" — gắn link tới file mẫu

Mỗi hàng trong `src/steps-detail.json` có 6 phần tử:

```
["Bước", "Người thực hiện", "Cách thức", "Lưu ý", "tên hiển thị trong ô Biểu mẫu", {"links":[{"id","label"}]}]
```

`id` phải khớp một mục trong `src/templates.json`; `build.js` render thành link
`/mau/<id>.html` (kèm tooltip = tiêu đề mẫu + số dòng). Id không tồn tại → in chữ
thường, không tạo link gãy. Muốn thêm link: thêm `{id,label}` vào mảng rồi chạy `node build.js`.

### Popup xem mẫu

Link ở cột "Biểu mẫu" (bảng chi tiết 14 bước) mở **popup** thay vì rời trang; link ở
**sidebar phải vẫn là link thường** như trước.

- `modalLayer()` trong `build.js` sinh `<div id="mm">` + 1 `<template id="tpl-<id>">`
  cho mỗi file mẫu, nội dung `.md` render sẵn trong trang → popup không `fetch`, không
  iframe, chạy được cả khi mở `file://` và không phụ thuộc JS của trang mẫu.
- JS trong `shell()` bắt click `a[data-form]`; Ctrl/Cmd/Shift/Alt-click và chuột giữa
  vẫn mở trang riêng (tab mới) như mặc định của trình duyệt.
- Đóng bằng `Esc`, nút ✕ hoặc bấm nền; cuộn nền bị khoá khi popup mở.
- Nút trong popup: "Mở trang riêng ↗" (`/mau/<id>.html`, tab mới) và "⬇ Tải .md"
  (`/mau/raw/<file>`, thuộc tính `download`).
- Thêm mẫu mới: không phải sửa gì — `modalLayer()` tự lặp qua `allFiles`, nhưng **phải
  chạy `node build.js`** để nhúng nội dung mẫu vào `index.html` (trang chính nặng hơn:
  ~620 KB, ~154 KB gzipped/brotli).

CSS của popup nằm ở cuối khối "tables" trong `src/styles.css` (`.mm`, `.mm-win`,
`.mm-b`…); `body.mm-lock` khoá cuộn nền.

## Public qua Cloudflare Tunnel

Ingress đã thêm trong `~/.cloudflared/config.yml`:

```yaml
- hostname: ai.btdat.io.vn
  service: http://localhost:3200
```

Kiểm tra rule khớp đúng:

```bash
cloudflared tunnel ingress rule https://ai.btdat.io.vn/ --config "C:/Users/datel/.cloudflared/config.yml"
# -> Matched rule #7  hostname: ai.btdat.io.vn  service: http://localhost:3200
```

⚠️ Còn thiếu **1 bước thủ công**: tạo DNS record trên Cloudflare Dashboard (config file không tự tạo được):

- Type: `CNAME` · Name: `ai` · Target: `b3e9ea6a-9ed9-41fc-be71-66f52b31fef3.cfargotunnel.com` · Proxy: **ON**

Sau đó chờ ~1 phút là `https://ai.btdat.io.vn/` lên.

## Đã kiểm chứng

- Origin: HTTP 200, 70,5 KB HTML, `Host: ai.btdat.io.vn` trả 200.
- Ảnh lưu đồ: 14/14 trả 200, `naturalWidth > 0` (không ảnh vỡ).
- Không tràn ngang: `scrollWidth == clientWidth` ở 390px / 768px / 1340px.
- Các site khác trên cùng tunnel: btdat.io.vn 200, daily 200, uptime 302 — không bị ảnh hưởng.

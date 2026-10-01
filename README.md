# AI-SDLC site — ai.btdat.io.vn

Web hoá quy trình **AI-SDLC v5.9** (Quy trình phát triển phần mềm tích hợp AI) — 14 bước, 5 giai đoạn, 8 gate, 17 file luật/template cho AI (thực tế 43 file mẫu).

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

## Bản v5.9 cập nhật (song song bản gốc)

`public/assets/AI-SDLC_V5_9_updated.pdf` + `.txt` là bản cập nhật, đặt **cạnh bản gốc**
(`quy-trinh-...-v5.9.pdf/.txt` không đổi). Cập nhật đã áp vào nội dung biên tập:

- **B11 bước 1**: nguồn sinh Test Case ghi rõ "(Tài liệu nghiệp vụ / yêu cầu, Tài liệu
  thiết kế, Tài liệu dự án,..)"; biểu mẫu → "Biểu mẫu do đối tác yêu cầu/Test Plan theo
  chuẩn ISTQB".
- **B11 bước 2**: thêm yêu cầu gắn nhãn nguồn gốc `AI-generated`/`Manual` cho từng Test Case.
- **B11 bước 3**: Lưu ý "Script AI sinh phải qua `rules/code-review-rules.md` trước khi merge".
- **B11 bước 4**: `4. Duyệt Test Plan/ Test Case`, Lưu ý `Human Gate.`
- **`rules/testcase-rules.md`** — mẫu mới (mục 3.14), đặt giữa `test-rules.md` (3.13) và
  `code-review-rules.md`. Đánh số lại: code-review 3.15, docs-index 3.16, glossary 3.17,
  dor-dod 3.18 → **18 file** thay vì 17.
- **`b2/prompts.md`** — thêm 2 prompt `P-B11-01` (AC → Test Case) và `P-B11-02` (tự kiểm
  Test Case trước bàn giao). Thư viện prompt nay phủ B3/B4/B6/B9/B10/B11/B13.

Sau khi đổi đánh số PL, phải cập nhật **cả 4 nơi**, nếu không sẽ lệch:

| Nơi | Cái gì |
|---|---|
| `src/templates.json` | `for` của từng file rules/ + insert `testcase-rules` giữa `test-rules` và `code-review-rules` |
| `src/md.js` | thêm `'rules/testcase-rules.md': 'testcase-rules'` vào `MD_LINK_MAP` |
| `src/data.js` | `b2Groups` (số `n`) + `steps.out` B2 + `appendices` (3.1–3.18) + `assets` + `gaps` B11 |
| `src/steps-detail.json` | nhãn `"3.x …"` trong cột Biểu mẫu + các chuỗi `"PL 3.x"` |

Template `.md` cũng phải sửa: `phu-luc/PL3-bo-tai-lieu-b2.md`, `b2/dor-dod.md`
(3.17→3.18), `b2/docs-index.md` (3.15→3.16).

## Dòng gạch ngang trong bảng chi tiết

Bước đã bỏ khỏi quy trình vẫn giữ trong `src/steps-detail.json` để đối chiếu được tài liệu
gốc, nhưng hiển thị gạch ngang. Khai báo trong `build.js`:

```js
const STRUCK_ROWS = {
  B11: ['3. Viết automation'],   // khóa = mã bước, giá trị = danh sách tên dòng
};
```

`stepBlock()` gắn `class="struck"` vào `<tr>` khi khớp; CSS ở `src/styles.css`:
`tr.struck td{text-decoration:line-through;…}`. Khóa theo **mã bước** chứ không chỉ tên dòng
để không gạch nhầm dòng trùng tên ở bước khác.

## Ví dụ điền thật — INS Platform (`/ins/`)

21 template của bộ mẫu đã được điền bằng dữ liệu thật của một dự án nền tảng bảo hiểm
(đã ẩn danh), nằm ở `vi-du-ins/` — **copy nguyên trạng** từ
`C:/Users/datel/insurance-platform/insurance-platform`. Khi thư mục nguồn đổi, copy lại
vào `vi-du-ins/` rồi chạy `node build.js` (nội dung `.md` được đọc lúc build, không tự sync).

```
vi-du-ins/                     # nguồn: 4 nhóm, 21 file .md + README
src/ins-examples.json          # registry: group / slug / title / for / file (sinh tay 1 lần)
public/ins/index.html          # chỉ mục 21 ví dụ, kèm cột "Mẫu gốc" trỏ ngược /mau/<id>.html
public/ins/<slug>.html         # từng ví dụ, có warn TODO/⚠️ + link tải .md
public/ins/raw/<đường/dẫn>     # bản .md gốc
public/assets/ins/AI-SDLC-vi-du-INS-Platform.zip
```

- Mỗi ví dụ tự tra ngược **mẫu gốc** theo tên file (`insOriginTemplate()` trong `build.js`,
  khớp basename không phân biệt hoa/thường và `_`↔`-`) → chip "Mẫu trống tương ứng".
- Section trên trang chính là `insExample()` (id `vi-du-ins`), đã thêm vào `NAV` và
  `SECTION_IDS` trong script scroll-spy. Link sidebar phải + header: `/ins/index.html`.
- Quy ước trong nội dung ví dụ: `> TODO` = dự án chưa có dữ liệu, `⚠️` = tài liệu lệch code
  — cố ý giữ nguyên, không bịa cho đủ.
- **Ký hiệu ◆ = "đã có bản điền thật"**, hiện ở 3 nơi: cây 14 bước (menu trái), cuối
  mỗi dòng trong danh sách file mẫu (menu phải — icon nằm trong cùng hàng, không phải
  dòng riêng), và nút pill trên trang mẫu `/mau/<id>.html`.
  Ánh xạ 2 chiều do `build.js` tự suy ra, không hard-code:
  - `insByStep` — từ trường `for` của file ví dụ, **chỉ lấy bước đầu tiên**
    (`/^\s*(B\d{1,2})\b/`) vì `dor-dod.md` ghi "B2 … áp dụng mọi sprint từ B7 trở đi" —
    lấy mọi match sẽ gắn nhầm ◆ cho B7.
  - `insByOrigin` — từ `insOriginTemplate()` (khớp basename file ví dụ ↔ mẫu gốc).
  Thêm file ví dụ mới thì chỉ cần copy `.md` vào `vi-du-ins/` + khai báo trong
  `src/ins-examples.json` (nếu `for` không bắt đầu bằng `Bx` thì sửa `for` cho đúng bước).

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

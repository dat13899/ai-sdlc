# AI-SDLC CMS

CMS theo dõi tiến độ thật của các dự án qua quy trình **AI-SDLC v5.9**: 14 bước (B1–B14), checklist chi tiết từng bước, 8 gate có người ký, tài liệu đầu ra (link hoặc file), dashboard tổng nhiều dự án và nhật ký thay đổi.

Định nghĩa quy trình lấy từ repo [`ai-sdlc`](..) (site ai.btdat.io.vn); biểu mẫu trống link sang site đó.

## Kiến trúc

- **Backend**: Fastify (`server.js`) với API JSON ở `/api/*` (`lib/api.js`). Dữ liệu lưu trong file JSON.
- **Giao diện**: React 18 + Ant Design 5 (thuần, không Pro Components) + TanStack Query + React Router, build bằng Vite. Mã nguồn ở `web/`. Server tự phục vụ bản build `web/dist`, vẫn chỉ **1 tiến trình, 1 cổng**, không dùng CDN.

## Chạy

```bash
npm install
npm run build        # cài + build giao diện (web/) — chạy lại mỗi khi sửa web/
npm start            # http://localhost:3300
npm test             # kiểm tra API (không cần server chạy)
```

Lần đầu chạy, server tạo tài khoản `admin` và **in mật khẩu tạm ra console** — đăng nhập rồi đổi ở trang Tài khoản.

### Chế độ phát triển (hot reload)

```bash
npm run dev          # mở http://localhost:5173
```

Lệnh này chạy cùng lúc hai thứ (`dev.js`):
- **Giao diện** (Vite, cổng 5173): sửa `web/src` là trình duyệt cập nhật ngay, không mất trạng thái trang (HMR).
- **API** (`node --watch`, cổng 3300): sửa `server.js`, `lib/` hoặc `process.json` là server tự khởi động lại.

Nếu cổng 3300 đang có `npm start` chạy, đổi cổng API: `PORT=3302 npm run dev`. Bấm Ctrl+C để dừng cả hai. Kiểm tra kiểu dữ liệu bằng `npm run typecheck`.

`npm start` là **chế độ chạy thật**: phục vụ bản build `web/dist`, không hot reload, nên sửa giao diện xong phải `npm run build` lại.

Biến môi trường: `PORT` (mặc định 3300), `HOST` (mặc định 127.0.0.1), `CMS_DATA` (thư mục dữ liệu, mặc định `./data`), `BACKUP_DIR` (nơi lưu bản sao lưu, mặc định `./backups`), `CMS_DIST` (thư mục giao diện đã build, mặc định `web/dist`; hữu ích khi server thật đang giữ `web/dist` nên `npm run build` báo EPERM).

**Tự chạy khi bật máy (Windows)**: nhấn `Win+R`, gõ `shell:startup`, rồi tạo shortcut tới `start.bat` trong thư mục đó. `start.bat` tự bỏ qua nếu cổng 3300 đã có server, và tự build giao diện nếu chưa có `web/dist`.

## Triển khai lên hosting (SFTP / panel)

```bash
npm run pack         # build giao diện + gom vào deploy/ (khoảng 2,5 MB, không có node_modules/data)
```

**Tải lên tự động bằng SFTP**: copy `.env.deploy.example` thành `.env.deploy`, rồi điền `SFTP_PASSWORD` (file này đã nằm trong `.gitignore`, không bao giờ được commit hay đóng gói). Sau đó:

```bash
npm run deploy       # = npm run pack + node upload.js
```

`upload.js` dừng ngay nếu khoá máy chủ không khớp `SFTP_FINGERPRINT`, nên không bao giờ gửi mật khẩu cho máy chủ giả. Script chỉ thêm hoặc ghi đè file, **không xoá gì trên server** và không đụng `data/`.

Hoặc tải thủ công toàn bộ nội dung `deploy/` lên thư mục gốc của server. Sau đó cấu hình trên panel:

- **Node.js 20.19 trở lên** (khuyên dùng 22). Lệnh khởi động `npm start` hoặc file chạy chính là `server.js`. Host phải tự chạy `npm install` từ `package.json`.
- **Cổng**: server đọc `PORT`, nếu không có thì đọc `SERVER_PORT` (cổng panel cấp). Có `SERVER_PORT` thì server tự nghe trên `0.0.0.0`.
- **HTTPS**: cookie đăng nhập mặc định có cờ `Secure`. Nếu host chỉ có `http://ip:port` thì đặt biến `COOKIE_SECURE=false` để đăng nhập được. Khi đó mật khẩu truyền đi không mã hoá, nên chỉ dùng tạm.
- **Dữ liệu**: thư mục `data/` được tạo trên server ở lần chạy đầu. **Không ghi đè hay xoá** thư mục này khi cập nhật code. Mật khẩu `admin` tạm in ở console của panel lần chạy đầu.

## Cập nhật quy trình

Khi `ai-sdlc/src` thay đổi (thêm/bớt hàng, đổi gate…):

```bash
npm run sync         # đọc ../src → process.json, rồi restart server
```

Mỗi dự án lưu `processVersion` lúc tạo; trang dự án báo nếu lệch với quy trình hiện tại.

## Dữ liệu

```
data/users.json            # tài khoản (mật khẩu băm scrypt)
data/projects/<id>.json    # mỗi dự án 1 file
data/uploads/<id>/<docId>  # file tài liệu đính kèm
data/audit.jsonl           # nhật ký: ai, lúc nào, đổi gì
data/sessions.json         # phiên đăng nhập (chỉ lưu SHA-256 của mã phiên)
data/settings.json         # cấu hình (Telegram…), được sao lưu
data/secrets.json          # token bot Telegram — KHÔNG sao lưu, không bao giờ trả ra API
```

Ghi file theo kiểu ghi tạm rồi đổi tên nên không có file ghi dở. Chỉ chạy **1 tiến trình** server trên cùng một thư mục dữ liệu.

**Sao lưu tự động**: khi server chạy, mỗi ngày tạo một bản `data-YYYY-MM-DD` trong `BACKUP_DIR`, giữ 14 bản gần nhất (kiểm tra mỗi giờ nên máy tắt ban đêm vẫn có bản khi bật lại; không sao lưu `sessions.json` và `secrets.json`). **Nên đặt `BACKUP_DIR` sang ổ hoặc thư mục khác máy chủ** (ví dụ ổ mạng): mặc định `./backups` cùng ổ chỉ cứu được khi xoá nhầm, không cứu được khi hỏng ổ. Khôi phục: dừng server, chép thư mục `data-…` cần dùng thành `data/`, chạy lại, rồi nhập lại token Telegram.

## Nền tảng và hạng mục

Mỗi dự án gồm:

- **Nền tảng (B1–B2)**: Charter, constitution/skill.md, rules… làm **1 lần**, mọi hạng mục dùng chung.
- **Hạng mục (B3–B14)**: mỗi tính năng / đợt phát hành là một hạng mục riêng, có checklist, tài liệu và gate riêng. Có 3 loại:
  - **Tính năng**: đi đủ B3–B14 và 8 gate.
  - **Change Request**: thay đổi sau khi spec đã khoá ở Gate 1. Ghi mã hoặc link PL2 vào ô "Tham chiếu".
  - **Fast-track**: việc dưới 0,5 ngày công. Tự đánh "Bỏ qua" B4–B7; Gate 1/2 thành "Không áp dụng".

Bất kỳ tài khoản nào cũng tạo được hạng mục, ở mục "+ Thêm hạng mục" trên trang dự án. Dashboard hiện mỗi hạng mục thành một dòng, gom dưới tên dự án.

- **Fast-track phải trả lời 3 câu hỏi** theo điều kiện của tài liệu (dưới 0,5 ngày công, không chạm phân quyền/thanh toán, không đổi data model); server từ chối nếu đáp án không đúng, và lưu lại đáp án.
- **Change Request bắt buộc có mã CR (PL2)**, kèm lý do/phạm vi thay đổi.
- Chỉ tạo được hạng mục khi dự án đã **sẵn sàng dùng AI** (xem mục dưới). Admin được bỏ qua có chủ đích (hộp thoại xác nhận, ghi vào nhật ký).

## Quản lý việc dùng AI

Phần cốt lõi của hệ thống: quản lý **cách dùng AI** theo quy trình AI-SDLC, không chỉ tiến độ.

**Vai trò và gate.** Quy trình có 8 vai trò theo RACI: PM, BA, PO / Sponsor / Khách hàng, Tech Lead, Dev, Tester / Test Lead, Security, DevOps. Mỗi dự án khai báo thành viên và vai trò ở tab Nền tảng (một người kiêm nhiều vai trò được). Khi dự án **đã có thành viên**, chỉ đúng vai trò mới ký được gate; admin cũng không ngoại lệ, nên phải gán vai trò cho mình nếu cần ký:

| Gate | Vai trò được ký |
|---|---|
| Gate 1 | PO, PM |
| Gate 2 | Tech Lead |
| Gate 3 | Tech Lead, Dev |
| Gate 4a | Tester / Test Lead |
| Gate 4b | Security |
| Gate 4c | Tech Lead |
| Gate 4 | PO |
| Gate 5 | PM, PO |

Bảng này nằm ở `GATE_ROLES` trong `sync-process.js`. Dự án **chưa có thành viên** (dự án cũ) thì chưa kiểm soát: ai cũng ký được, để không bị kẹt. Sửa thành viên: admin hoặc PM của dự án.

**Thiết lập AI của dự án (B2).** Công cụ AI được duyệt, mức nhạy cảm dữ liệu, và 6 file luật bắt buộc (constitution, SKILL.md, docs-index, tool-permissions, data-classification, ai-tool-scope). Dự án "sẵn sàng" khi B2 xong, có công cụ, có mức dữ liệu và đủ 6 file. Sửa: admin, PM hoặc Tech Lead của dự án.

**Nhật ký dùng AI.** Mỗi bước có mục "Dùng AI": công cụ (chọn trong danh sách đã duyệt), model, mục đích, mã prompt (ví dụ `P-B11-01`) và nhãn nguồn gốc `AI-generated` / `AI + sửa tay` / `Manual`. **Không lưu nội dung prompt** vì có thể chứa dữ liệu nhạy cảm.
- Nội dung do AI sinh phải được **người khác người ghi** duyệt (Chấp nhận / Đã sửa / Loại bỏ).
- **Human Gate**: không ký "Đạt" được khi còn mục AI chưa duyệt từ đầu hạng mục tới bước của gate.
- Mục đã duyệt chỉ admin xoá được (giữ dấu vết); người ghi xoá được khi chưa ai duyệt.

**Tài liệu bắt buộc.** Mỗi bước có danh sách biểu mẫu bắt buộc (`REQUIRED` trong `sync-process.js`: BRD ở B3, spec ở B4, plan ở B6, tasks ở B7, test plan và RTM ở B11…). Thiếu thì thẻ bước và gate hiện cảnh báo; chỉ cảnh báo, không chặn.

**Việc của tôi.** Trang riêng gồm bước được giao, gate đang chờ vai trò của mình ký, và nội dung AI chờ mình duyệt; số việc hiện ở menu. Cùng danh sách này có trên Telegram: gửi `/viec` cho bot (chat riêng, đã liên kết tài khoản).

**Dễ dùng cho người mới.** Menu *Hướng dẫn* (`/help`): 5 bước dùng hằng ngày, việc của từng vai trò, bảng thuật ngữ, 14 bước và gate. Dashboard có thẻ giới thiệu đóng được. Thuật ngữ khó (Gate, Human Gate, PL2, RACI, Fast-track…) có dấu "?" giải thích khi rê chuột; nội dung giải thích nằm một chỗ ở `GLOSSARY` trong `web/src/components.tsx`. Trang hạng mục: thẻ *Bước hiện tại* có link, lý do đang kẹt và người phụ trách; chỉ bước hiện tại mở sẵn (có nút Mở hết / Thu gọn hết, thanh B3…B14 có chấm trạng thái); nền tảng có checklist *Bắt đầu nhanh*; form bước báo "Chưa lưu" và hỏi trước khi rời trang. Màn hình hẹp (< 992px) menu thành ngăn kéo.

**Báo cáo & số liệu** (menu *Báo cáo*, mọi tài khoản xem được): tiến độ theo dự án, thời gian từng bước (từ bắt đầu tới xong), gate đạt / không đạt (đếm từ nhật ký ký nên không mất lần trượt đã sửa lại) và thời gian chờ ký, dùng AI (nguồn gốc, tỉ lệ bị loại / phải sửa, theo công cụ), bước quá hạn, việc đang mở theo người. Mốc thời gian thật của bước (`startedAt` / `doneAt`) chỉ ghi từ khi có tính năng này, nên bước cũ chưa có số liệu thời gian.

## File .md: dùng chung hay riêng từng hạng mục

File `.md` thật nằm trong **repo Git của dự án**. CMS chỉ lưu link trỏ tới, không giữ bản sao. Khai báo "Repo URL" và "Nhánh chính" cho dự án: admin điền khi tạo dự án, hoặc sửa ở tab Nền tảng. Mỗi hạng mục có "Thư mục spec", mặc định `specs/NNN-ten-hang-muc`; fast-track thì để trống.

Mỗi biểu mẫu được gắn phạm vi trong `sync-process.js` (bảng `PLACES`):

| Phạm vi | Ví dụ | Gắn ở đâu |
|---|---|---|
| dùng chung | constitution, SKILL.md, AGENTS.md, glossary, `rules/*` | Tab Nền tảng. Tab hạng mục chỉ hiện chúng ở dòng "Luật dùng chung áp dụng" |
| cộng dồn | ADR (`docs/adr/`), CHANGELOG, runbook | Hạng mục nào sinh ra thì gắn ở hạng mục đó; vẫn hiện trong "Tài liệu chung đang áp dụng" của mọi hạng mục |
| riêng hạng mục | BRD, spec, plan, tasks, test-plan, RTM, threat-model, CR (PL2) | `{thư mục spec}/…` của hạng mục |
| theo sự kiện | postmortem, bug | `postmortems/…`, tracker |

Khi chọn biểu mẫu ở ô "Thêm tài liệu", CMS tự điền link GitHub hoặc GitLab tới đúng vị trí gợi ý, ví dụ `…/blob/main/specs/002-thanh-toan-qr/BRD.md`.

## Trang Tài liệu và xem file .md

- Hiện **chỉ nhận file Markdown (`.md`)**, tối đa 5 MB. Server kiểm tra cả đuôi file lẫn nội dung: phải là văn bản UTF-8, không chứa byte 0. Ngoài file thì vẫn gắn được link (vd link tới file `.md` trong repo).
- Nút **"Tài liệu"** trên trang dự án mở một bảng gồm mọi tài liệu của dự án: tìm theo tên, lọc theo phạm vi, hạng mục, bước và loại (file hoặc link), sắp xếp, phân trang. Có thể xem, tải về hoặc xoá ngay trên bảng.
- Bấm vào file `.md` (ở trang Tài liệu, trong từng bước, hoặc ở mục tài liệu chung) để mở **trình xem** có hai chế độ:
  - **Dạng đẹp**: hiển thị Markdown kèm bảng, checklist và khối code (GFM).
  - **Dạng thô**: văn bản gốc có số dòng.
  - Có nút sao chép nội dung và tải về.
- **An toàn**: HTML nhúng trong file chỉ hiện như chữ thường, không được chạy; link `javascript:` bị vô hiệu. API trả nội dung dạng `text/plain` kèm `Content-Security-Policy: sandbox`.

## Người phụ trách

Mỗi bước chọn được **nhiều tài khoản** từ dropdown. Tài khoản bị khoá không hiện để chọn mới, nhưng vẫn giữ nếu đã được giao từ trước. Dashboard hiện tên người phụ trách khi rê chuột vào ô. Dữ liệu cũ ghi người phụ trách bằng chữ tự do vẫn hiện dòng "Ghi cũ: …" cho tới khi bước được lưu lại.

Dữ liệu tạo trước khi có hạng mục được tự chuyển ở lần đọc đầu tiên: B1–B2 thành Nền tảng, B3–B14 thành hạng mục "Phát hành đầu tiên".

## Quy tắc nghiệp vụ

- % bước = số hàng checklist đã tick; bước "Xong"/"Bỏ qua" = 100%. % dự án = trung bình các bước không bị bỏ qua.
- Tiến độ, bước hiện tại và gate chặn được tính **riêng cho từng hạng mục** (và cho nền tảng).
- **Gate đang chặn** = gate đầu tiên chưa "Đạt" nằm ở bước đã tới (≤ bước hiện tại). Gate ở bước "Bỏ qua" không áp dụng, không chặn.
- **Gate 4** chỉ ký "Đạt" khi Gate 4a/4b/4c đều đạt; nếu một trong ba bị đổi khỏi "Đạt", Gate 4 tự về "Chưa ký".
- Người ký gate = tài khoản đang đăng nhập (ghi cả thời điểm).
- Admin tạo tài khoản và dự án; mọi tài khoản đều cập nhật được bước/gate/tài liệu.

## Thông báo Telegram

Cấu hình ngay trong CMS, không phải sửa file: menu **Quản trị → Cấu hình Telegram** (chỉ admin).

1. **Kết nối bot**: tạo bot với `@BotFather` (`/newbot`), dán token vào ô, bấm "Lưu & kiểm tra". Server gọi thử `getMe`; token sai hoặc máy chủ không ra được `api.telegram.org` thì báo lỗi ngay và không lưu. Token chỉ lưu ở `data/secrets.json`, không hiển thị lại, không vào bản sao lưu và nhật ký.
2. **Thông báo**: bật/tắt, chọn nhóm nhận tóm tắt, giờ gửi, địa chỉ site (để gắn link vào tin) và từng loại sự kiện:

   | Sự kiện | Gửi cho |
   |---|---|
   | Được giao bước | Người được giao (tin riêng) |
   | Gate chờ ký | Người có vai trò ký gate khi gate tới lượt |
   | Gate không đạt | PM của dự án |
   | Nội dung AI chờ duyệt | PM / Tech Lead của dự án, trừ người ghi |
   | Tóm tắt buổi sáng | Nhóm: việc đang chạy, gate chờ, bước quá hạn, AI chờ duyệt |

   Không bao giờ báo cho chính người vừa thao tác. Sự kiện về gate và AI chỉ gửi khi dự án đã khai báo thành viên. Có các nút gửi thử (vào nhóm, cho tôi, tóm tắt).
3. **Liên kết tài khoản**: mỗi người vào **Tài khoản → Liên kết Telegram**, bấm "Lấy mã liên kết", rồi mở link bot (hoặc gửi `/start MÃ`). Mã dùng một lần, hết hạn sau 10 phút, trang tự cập nhật khi xong. Gửi `/huy` cho bot để huỷ; admin cũng huỷ được ở bảng cuối trang cấu hình.

**Chọn nhóm**: thêm bot vào nhóm rồi gửi `/chatid` trong nhóm — nhóm hiện trong danh sách chọn (cần bật thông báo và lưu trước vì bot chỉ nhận lệnh khi đang bật).

**Cách hoạt động**: server chủ động hỏi Telegram (long polling), không cần mở cổng vào hay webhook nên chạy được sau Cloudflare Tunnel. Tóm tắt buổi sáng được kiểm tra mỗi phút, gửi khi tới giờ (trong vòng 3 giờ sau giờ đặt, để máy bật muộn vẫn gửi), mỗi ngày một lần. Tin gửi nền, lỗi chỉ ghi log và không làm hỏng thao tác của người dùng. Máy chạy CMS cần ra được `api.telegram.org`; nếu công ty bắt qua proxy, đặt `HTTPS_PROXY` và `NODE_USE_ENV_PROXY=1` trước khi chạy server (Node 24).

## Giao diện

Theo đặc tả admin dashboard nội bộ, dùng chính Ant Design. Token đặt ở `web/src/main.tsx`: màu chủ đạo #0958D9 (đậm hơn mặc định để chữ trắng trên nút đạt AA), xanh #52C41A, vàng #FAAD14, đỏ #FF4D4F, nền #F8F9FA, Inter 14px, giao diện tiếng Việt (`antd/es/locale/vi_VN`).

- **Layout.Sider + Menu**: sidebar cố định 248px, thu gọn còn 64px (trình duyệt nhớ lựa chọn). Menu gồm Dashboard, các dự án (bung ra Nền tảng và các hạng mục) và Quản trị.
- **Table** (kèm thanh lọc phía trên) ở Dashboard, Quản trị, Nhật ký và Tài liệu: tìm kiếm không cần gõ dấu, lọc, sắp xếp, phân trang. Dashboard là bảng dạng cây (dự án → hạng mục), lọc theo loại hạng mục, tình trạng gate và "Việc của tôi".
- Trang dự án: tab Nền tảng và từng hạng mục. Mỗi bước là một Card gồm form, `Select` chọn nhiều người phụ trách, checklist tự lưu khi tick, tài liệu (`Upload`) và ký gate.
- Nút chính (`type="primary"`): Lưu bước, Ký gate, Tạo…. Nút phụ (viền): Thêm tài liệu, Sửa, Lưu trữ.

## Bảo mật

Cookie phiên `HttpOnly` + `SameSite=Strict` + `Secure`, kiểm tra `Origin` với mọi POST/PUT/DELETE, Helmet (CSP chỉ cho script từ chính server; style cho phép inline vì Ant Design chèn CSS lúc chạy), giới hạn 10 lần đăng nhập / 5 phút / IP, file upload chỉ nhận .md (UTF-8, tối đa 5 MB), tải về luôn dạng attachment. File trong `/assets/` chỉ phục vụ tên an toàn trong `web/dist/assets`, nén brotli/gzip một lần rồi giữ trong RAM (giao diện tách theo trang, chỉ dùng Ant Design thuần: vào Dashboard tải khoảng 320 KB; toàn bộ giao diện khoảng 435 KB sau nén). Mật khẩu đặt lại chỉ trả về đúng 1 lần và không ghi vào nhật ký.

Phiên đăng nhập lưu ra `data/sessions.json` (chỉ SHA-256 của mã phiên, lộ file cũng không dùng lại được cookie) nên khởi động lại server không làm mọi người bị đăng xuất. Đặt lại mật khẩu hoặc khoá tài khoản sẽ thu hồi các phiên của người đó.

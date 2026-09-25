---
title: Checklist AI review tầng 1 — rules/code-review-rules.md
for: B10 bước 1–2 (AI review tầng 1, song song SAST/secret scan) — GATE 3
owner: AI (chạy) · Dev (sửa finding) · Reviewer (duyệt tầng 2) · Tech Lead (A)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.14; OWASP ASVS; OWASP Top 10; OWASP LLM Top 10
---

# rules/code-review-rules.md — Checklist AI review tầng 1

## Mục đích

Tầng 1 là **lưới lọc tự động** để con người không phải review những lỗi máy kiểm được. Tầng 2 (người) dành thời gian cho nghiệp vụ, kiến trúc, tác động chéo — những thứ AI chưa đủ tin cậy.

Linter này cụ thể hoá OWASP ASVS thành câu hỏi kiểm được trên từng PR.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B10 bước 1 — Dev mở PR | CI (tự động) | PR diff + ruleset này + SAST + secret scan |
| B10 bước 2 — AI comment finding | AI | PR diff, `constitution.md`, `CODING_CONVENTION.md` |
| B10 bước 3 — Dev sửa | Dev | Danh sách finding |
| B10 bước 4 — Mời reviewer người | Dev | Sau khi hết finding High/Critical |
| B10 bước 6–7 — Approve & merge | Reviewer | PR + CI xanh |

## Phân loại mức độ

| Mức | Định nghĩa | Ví dụ | Được merge? |
|---|---|---|---|
| **Critical** | Khai thác được ngay, ảnh hưởng dữ liệu/bảo mật nghiêm trọng, hoặc phá vỡ luồng nghiệp vụ chính | SQL injection có thể khai thác; secret thật bị commit; xác thực bị vô hiệu | ❌ Không |
| **High** | Lỗ hổng hoặc lỗi logic rõ, cần sửa trước khi phát hành | Thiếu kiểm tra phân quyền (IDOR); mật khẩu hash bằng MD5; lỗi rò rỉ dữ liệu trong log | ❌ Không |
| **Medium** | Rủi ro trong điều kiện nhất định, hoặc nợ kỹ thuật có ảnh hưởng | Thiếu rate limit; xử lý lỗi che mất nguyên nhân; thiếu kiểm tra input phía server | ⚠️ Cần Tech Lead chấp thuận có ghi lý do |
| **Low** | Chất lượng code, khả năng bảo trì, style | Đặt tên khó hiểu; hàm quá dài; comment lạc hậu; test thiếu edge case | ✅ Có thể merge, ghi vào backlog |

## Ví dụ viết ĐÚNG vs viết SAI

Ba tiêu chí quan trọng nhất — minh hoạ bằng code thật để AI và dev nhận ra ngay khi đọc diff.

### 1. Injection — truy vấn có tham số hoá (tiêu chí A1, A3)

**❌ SAI — ghép chuỗi từ input:**

```js
// id đến từ query param của người dùng → SQL injection
const sql = `SELECT * FROM orders WHERE id = '${req.query.id}'`;
db.query(sql);
```

**✅ ĐÚNG — tham số hoá:**

```js
const sql = 'SELECT * FROM orders WHERE id = ?';
db.query(sql, [req.query.id]);
```

**Vì sao chặn:** input `' OR '1'='1` biến truy vấn thành trả về toàn bộ bảng. Critical — khai thác được ngay, không cần quyền đặc biệt.

### 2. Phân quyền theo đối tượng — IDOR (tiêu chí B2)

**❌ SAI — chỉ kiểm đã đăng nhập, không kiểm sở hữu:**

```js
// Ai đăng nhập cũng đọc được đơn của người khác — chỉ cần đổi số id
app.get('/api/orders/:id', auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});
```

**✅ ĐÚNG — kiểm cả sở hữu:**

```js
app.get('/api/orders/:id', auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  // Trả 404 (không phải 403) để không lộ sự tồn tại của bản ghi
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json(order);
});
```

**Vì sao chặn:** lỗi phổ biến nhất của ứng dụng nhiều người dùng. `auth` chỉ chứng minh "đã đăng nhập", không chứng minh "được xem bản ghi này".

### 3. Log lộ dữ liệu nhạy cảm (tiêu chí C2, C3)

**❌ SAI — log cả object request:**

```js
console.log('Đăng nhập:', req.body);   // lộ mật khẩu ra file log
logger.info('Thanh toán', { user, card: req.body.cardNumber }); // lộ số thẻ
```

**✅ ĐÚNG — log có chọn lọc, chỉ mã đối tượng:**

```js
logger.info('Đăng nhập thành công', { userId: user.id, ip: req.ip });
```

**Vì sao chặn:** log được thu vào hệ thống tập trung, lưu lâu, nhiều người đọc, dễ xuất ra ngoài — mức Confidential/Restricted bị vi phạm chỉ bằng một dòng `console.log`.

## Khi nào tự động CHẶN (block) — điều kiện cứng

| # | Điều kiện | Ai chặn |
|---|---|---|
| B1 | Còn bất kỳ finding mức **Critical** hoặc **High** chưa sửa | Không được mời review tầng 2 (B10 bước 3 theo tài liệu gốc) |
| B2 | CI chưa xanh (unit test, lint, build, SAST, secret scan) | Branch protection tự chặn merge |
| B3 | Chưa có review của người **khác tác giả** (2 người với module lõi/bảo mật) | Branch protection |
| B4 | Phát hiện **secret thật** trong diff (API key, mật khẩu, token, private key) | Chặn tuyệt đối + **thu hồi/rotate secret ngay** (xoá khỏi lịch sử git, không chỉ xoá ở commit mới) |
| B5 | Coverage test dưới ngưỡng dự án | Coverage gate |
| B6 | Có dependency mới bị dính lỗ hổng đã biết (Critical/High) hoặc license GPL/copyleft không tương thích | Dependency scan / license scan |
| B7 | Sửa code nhưng không cập nhật test tương ứng (khi hành vi thay đổi) | Cần ghi lý do nếu chủ ý |
| B8 | Thay đổi hạ tầng/deploy thủ công (không qua IaC + PR) | Theo luật thăng cấp môi trường B13 |

## Checklist chi tiết theo nhóm

### A. Bảo mật — injection & input

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| A1 | Có câu truy vấn nào ghép chuỗi từ input người dùng (SQL/NoSQL/LDAP injection)? | Critical | |
| A2 | Input người dùng có được validate/kiểm kiểu **ở phía server** (không chỉ client)? | High | |
| A3 | Có dùng truy vấn tham số hoá (prepared statement) hoặc ORM an toàn? | Critical | |
| A4 | Output có được escape đúng ngữ cảnh (HTML, JS, URL, SQL, shell) để chống XSS? | Critical | |
| A5 | Có gọi lệnh hệ thống / deserialize dữ liệu không tin cậy (RCE risk)? | Critical | |
| A6 | Upload file có kiểm loại/kích thước/lưu ngoài webroot? | High | |
| A7 | Có dùng `eval`, `exec`, hoặc nối chuỗi thành code động với input? | Critical | |

### B. Bảo mật — xác thực & phân quyền

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| B1 | Endpoint mới có được gắn middleware xác thực? | Critical | |
| B2 | Có kiểm tra **phân quyền theo đối tượng** (không chỉ theo vai trò) — tức IDOR? | High | |
| B3 | Có lộ thông tin qua message lỗi/mã HTTP khác nhau (user enumeration)? | Medium | |
| B4 | Mật khẩu/token có được hash bằng thuật toán mạnh (bcrypt/argon2, không MD5/SHA1 thuần)? | Critical | |
| B5 | Session/token có thời hạn và thu hồi được? | High | |
| B6 | Có bypass xác thực qua tham số (debug flag, header `X-Internal`, query `?admin=1`)? | Critical | |
| B7 | Cơ chế phân quyền có được kiểm tập trung (không rải rác từng controller)? | Medium | |

### C. Bảo mật — dữ liệu & secret

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| C1 | Diff có chứa secret thật (API key, token, mật khẩu, private key, connection string)? | Critical | |
| C2 | Log có ghi mật khẩu, token, số thẻ, CMND, thông tin cá nhân (PII)? | High | |
| C3 | Dữ liệu nhạy cảm có được mã hoá khi lưu và khi truyền (TLS)? | High | |
| C4 | Có dùng thuật toán mã hoá lỗi thời (DES, RC4) hay hard-code IV/khoá? | High | |
| C5 | Biến môi trường/.env có bị commit, có nằm trong `.gitignore`? | High | |
| C6 | Dữ liệu test có phải là dữ liệu Production chưa masking (vi phạm `data-classification.md`)? | High | |

### D. Phụ thuộc & chuỗi cung ứng

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| D1 | Dependency mới có bị dính CVE Critical/High đã biết? | High | |
| D2 | License của dependency mới có tương thích (không GPL/copyleft trong sản phẩm đóng)? | High | |
| D3 | Có thêm thư viện chỉ để làm một việc nhỏ mà tự viết được? | Low | |
| D4 | Package có được pin version (lockfile được commit)? | Medium | |
| D5 | Có dùng mã nguồn copy từ nơi công khai mà không rõ license? | High | |

### E. Logic & xử lý lỗi

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| E1 | Có nhánh lỗi nào bị nuốt im lặng (catch rỗng, bỏ qua lỗi)? | Medium | |
| E2 | Thao tác nhiều bước có được bọc transaction khi cần tính nguyên tử? | High | |
| E3 | Có nguy cơ race condition / đồng thời (double submit, double spend)? | High | |
| E4 | Xoá mềm hay xoá cứng — có đúng với yêu cầu nghiệp vụ và quy định lưu trữ? | Medium | |
| E5 | Có hard-code cấu hình (số điện thoại, URL, mã bí mật) vào code? | Medium | |
| E6 | Có ràng buộc nào bị bỏ qua ở server vì "client đã kiểm rồi"? | High | |
| E7 | Phép tính tiền/lãi/phí có dùng số thực dấu phẩy động (float) gây sai số? | High | |

### F. Hiệu năng & tài nguyên

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| F1 | Có truy vấn trong vòng lặp (N+1 query)? | Medium | |
| F2 | Endpoint trả danh sách có phân trang, có giới hạn trên? | Medium | |
| F3 | Có tài nguyên nào không được giải phóng (file handle, kết nối DB, thread)? | Medium | |
| F4 | Có xử lý nặng chạy đồng bộ trong request mà nên đưa vào queue? | Medium | |
| F5 | Có cache thiếu cơ chế vô hiệu hoá khi dữ liệu thay đổi? | Medium | |

### G. Code có gọi AI / LLM (OWASP LLM Top 10)

Áp dụng khi PR có gọi API model, thêm prompt, hoặc xử lý output của AI.

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| G1 | Input người dùng có được đưa thẳng vào system prompt (prompt injection)? | High | |
| G2 | Output của model có được kiểm/escape trước khi hiển thị hoặc thực thi (insecure output handling)? | High | |
| G3 | Prompt/system prompt có chứa bí mật, token, dữ liệu Restricted? | Critical | |
| G4 | AI có quyền thực hiện hành động nguy hiểm mà không cần người xác nhận (excessive agency)? | High | |
| G5 | Có giới hạn tần suất/khối lượng gọi model để chống model DoS và chi phí bất ngờ? | Medium | |
| G6 | Có kiểm tra dữ liệu dùng để fine-tune/huấn luyện (training data poisoning)? | Medium | |
| G7 | Có phụ thuộc hoàn toàn vào output AI mà không có người kiểm (overreliance)? | Medium | |
| G8 | Có ghi log cả prompt và output chứa dữ liệu cá nhân? | High | |

### H. Chất lượng code & khả năng bảo trì (chuyển tầng 2 nếu không rõ)

| # | Câu hỏi | Mức điển hình | Đạt/Không đạt |
|---|---|---|---|
| H1 | Code tuân thủ `CODING_CONVENTION.md` (naming, cấu trúc, format)? | Low | |
| H2 | Hàm/class có một trách nhiệm rõ ràng, độ dài hợp lý? | Low | |
| H3 | Có comment lạc hậu hoặc comment mô tả lại code (vô nghĩa)? | Low | |
| H4 | Có code bị comment-out hoặc debug log còn sót? | Low | |
| H5 | Có mâu thuẫn với `constitution.md` (kiến trúc, logging, bảo mật)? | High | |
| H6 | Có thay đổi nào ảnh hưởng API công khai mà không tăng version? | High | |

## Định dạng báo cáo finding của AI

Mỗi finding cần đủ 6 thông tin để dev sửa được ngay:

```
[Mức] <tiêu đề ngắn>
File: src/api/orders.js:88-95
Vấn đề: Truy vấn ghép chuỗi trực tiếp từ req.query.keyword → SQL injection.
Quy tắc: rules/code-review-rules.md A1, A3 · OWASP A03
Đề xuất: dùng parameterized query: db.query('... WHERE name ILIKE $1', [`%${kw}%`])
Kiểm chứng: thêm test case với keyword chứa dấu nháy đơn
```

Không có "File" và "Đề xuất" thì dev không sửa được → finding bị bỏ qua.

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.14 — tài liệu gốc nội bộ
- OWASP ASVS (Application Security Verification Standard) — https://owasp.org/www-project-application-security-verification-standard/
- OWASP Top 10 — https://owasp.org/www-project-top-ten/
- OWASP API Security Top 10 — https://owasp.org/API-Security/
- OWASP LLM Top 10 (GenAI Security Project) — https://genai.owasp.org/llm-top-10/
- CWE Top 25 — https://cwe.mitre.org/top25/
- OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org/

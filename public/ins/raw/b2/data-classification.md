---
title: data-classification.md — Phân loại dữ liệu & quy tắc dùng với AI, INS Platform
for: B2 — ví dụ điền thật
owner: Security Lead (A/R) · Tech Lead (R) · PM (I)
nguồn: Architecture.md §2.4; RULES.md B/S11–S12, C9; LESSONS.md §4.4; TSD/ins-{identity,purchase,callback}-service/02_security-design.md §4; ADR-CB-05, ADR-ADP-07
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/b2/data-classification.md

# data-classification.md — Phân loại dữ liệu & quy tắc dùng với AI

> INS Platform là nền tảng trung gian bảo hiểm: dữ liệu đi qua gồm thông tin người mua và người được bảo hiểm (CCCD, SĐT, ngày sinh, địa chỉ, hộ chiếu), thông tin xe cho TNDS xe máy / ô tô (biển số, số khung, số máy), dữ liệu sức khoẻ, giao dịch thanh toán và credential tích hợp NCC.
>
> ⚠️ **Hai thang phân loại đang cùng tồn tại trong TSD:** bộ `callback` dùng **L1–L4** (L1 Public / L2 Internal / L3 Confidential = PII / L4 Restricted = PII nhạy cảm), bộ `purchase` dùng "**Loại 1–3**" cho PII. Cả hai dẫn tới `.claude/rules/security.md §3.1` — file này **không có** trong checkout. File dưới đây quy về thang L1–L4.
> > TODO: dự án chưa có — cần Security Lead chốt một thang duy nhất và khôi phục `security.md`.

## 1. Bốn mức phân loại

| Mức | Định nghĩa | Ví dụ trong INS Platform | Bảo vệ hiện có |
|---|---|---|---|
| **Public (L1)** | Công bố được | Catalog sản phẩm, nội dung CMS (banner / landing / FAQ / T&C), master-data `/public/v1/master-data/**`, mã hợp đồng & link giấy chứng nhận trong payload callback (định danh nghiệp vụ); ảnh avatar (công khai có điều kiện — URL tĩnh, chỉ mở prefix `avatars/*`) | — |
| **Internal (L2)** | Nội bộ | Mã nguồn, TSD, ADR, `LESSONS.md`, cấu hình k8s (trừ secret), `client_ip` trong callback; theo TSD purchase: `orders.customer_full_name`, `orders.customer_address` | Log mask IP `xxx.xxx.xxx.YYY`; tên mask 50%; địa chỉ mask số nhà |
| **Confidential (L3 — PII)** | Dữ liệu cá nhân của khách | CCCD người mua / người được BH, SĐT, email, ngày sinh, mã số thuế (hoá đơn VAT), JSON form động `order_items.product_attributes` / `display_snapshot` (họ tên, ngày sinh người được BH, **biển số**, hộ chiếu…), `VehicleInfo` ở policy (biển số, số khung, số máy), `raw_body` / `headers_json` callback của NCC, ảnh KYC CCCD (MinIO prefix `kyc/`) | CCCD & SĐT: AES-256-GCM + cột HMAC-SHA256 để tìm kiếm; `raw_body`: field-level AES-256-GCM, giữ 10 năm rồi crypto-shred (ADR-CB-05); KYC: presigned URL TTL ngắn, không anonymous |
| **Restricted (L4)** | Nhạy cảm nhất / bí mật | Dữ liệu sức khoẻ; dữ liệu thẻ thanh toán; mật khẩu; OTP; JWT; credential NCC (API key, HMAC secret, RSA key, mTLS cert); key mã hoá PII (`INS_PII_ENCRYPTION_KEY`, Vault path data key / HMAC key); `k8s/base/secrets.yaml` | Health: MongoDB Queryable Encryption, compartment riêng; thẻ: tokenization only, không lưu PAN (PCI-DSS); mật khẩu chỉ ở Keycloak (bcrypt cost 12); OTP: SHA-256 có salt theo phiên trong Valkey; credential NCC: chỉ ref Vault (ADR-ADP-07) |

**Lệch đã biết, cần xử lý:**
- JSON `product_attributes` / `display_snapshot` đang lưu **plaintext** dù có thể chứa biển số, hộ chiếu, ngày sinh (TSD purchase §4). > TODO: cần Security Lead quyết định có mã hoá không.
- `INS_PII_ENCRYPTION_KEY` chưa set → adapter identity dùng **DEV key hardcode**; nếu lọt lên server thì mọi CCCD đã mã hoá bằng dev key (TSD identity §4).
- Audit log: `Architecture.md §2.4` yêu cầu append-only, lưu ≥5 năm qua `ins.audit.stream`; TSD identity ghi service **không còn** ghi audit vào DB riêng, pipeline tập trung chưa implement.

## 2. BẢNG QUYẾT ĐỊNH — dữ liệu nào được đưa vào prompt AI

> TODO: dự án chưa có — cần Security Lead phê duyệt. Chưa có `ai-tool-scope.md` và chưa có đánh giá Zero Data Retention cho tool đang dùng. Cho tới khi có, áp dụng **mặc định chặt nhất** dưới đây (giữ nguyên chính sách của template).

| Mức dữ liệu | AI công cộng | AI có ZDR + hợp đồng doanh nghiệp | AI self-hosted |
|---|---|---|---|
| **L1 Public** | ✅ | ✅ | ✅ |
| **L2 Internal** (code, TSD, ADR) | ⚠️ Chỉ khi được chấp thuận | ⚠️ TODO — chờ đánh giá ZDR | ✅ |
| **L3 Confidential** (CCCD, SĐT, biển số, payload NCC) | ❌ | ❌ cho tới khi Security Lead duyệt | ⚠️ |
| **L4 Restricted** (health, thẻ, secret, key, token) | ❌ tuyệt đối | ❌ | ❌ |

**Quy tắc nhớ nhanh:** có CCCD / SĐT / biển số / số khung / ngày sinh / token / key → **không** đưa vào AI.

## 3. Câu hỏi tự kiểm trước khi paste vào AI

- [ ] Log / payload này có đi qua `LogMaskingFilter` / `MaskingLayout` chưa, và regex có phủ trường này không?
- [ ] Trong đó có JSON `product_attributes` / `display_snapshot` không? (chứa PII người được BH, **không** được mã hoá)
- [ ] Có `raw_body` / `headers_json` của callback NCC không? (L3)
- [ ] Có dòng `field=***` không? Nhớ: `***` **không** chứng minh field có dữ liệu (LESSONS §4.4) — và cũng không chứng minh chuỗi đã sạch PII ở chỗ khác
- [ ] Có header `Authorization`, JWT (`eyJ…`), API key NCC, giá trị env nào không?
- [ ] Dữ liệu lấy từ DB server hay từ Testcontainers / seed local?

Chùn lại ở câu nào → không paste, hỏi Security Lead.

## 4. Quy tắc masking / ẩn danh

### Quy ước mask đang dùng trong log (theo TSD)

| Trường | Mask trong log | Nơi định nghĩa |
|---|---|---|
| SĐT | `09*****678` (identity) · giữ 4 số cuối (purchase) | `MaskingLayout` (Logback, multi-regex) / `LogMaskingFilter` (`ins-common`) |
| Email | `abc***@domain.com` | như trên |
| CCCD (9 hoặc 12 số) | chỉ giữ 4 số cuối `********1234` | như trên |
| JWT | `Bearer ***JWT-REDACTED***` | như trên |
| IP | `xxx.xxx.xxx.YYY` | callback-service |
| Họ tên / địa chỉ | mask 50% ký tự / mask số nhà, giữ phường-quận | purchase-service |
| Địa chỉ (identity), mật khẩu, OTP | **không log** | identity-service |

⚠️ **Cạm bẫy thật (LESSONS §4.4):** `buildGetFeeBody` luôn `put("nguoidbhNgaysinh", …)` rồi `maskDeep` thay giá trị bằng `***` **kể cả khi null** → nhìn log tưởng có dữ liệu. Masking làm log vô dụng cho việc kết luận "có/không có data"; muốn kiểm phải dùng test hoặc DB local.

### Bắt buộc thay thế trước khi đưa vào AI

| Trường | Thay bằng |
|---|---|
| Họ tên | `[KHÁCH_HÀNG_A]`, `[NGƯỜI_ĐƯỢC_BH_B]` |
| SĐT | `0900000000` |
| CCCD / hộ chiếu | `[SỐ_CCCD]` / `000000000000` |
| Biển số, số khung, số máy | `[BIỂN_SỐ]`, `[SỐ_KHUNG]`, `[SỐ_MÁY]` |
| Mã số thuế | `[MST]` |
| Số hợp đồng / mã đơn thật | `POL-0001`, `ORD-0001` |
| Tên NCC thật trong payload | `Insurer-A` … `Insurer-F` |
| Credential NCC, key PII, JWT, secret k8s | **Xoá hoàn toàn** — không bao giờ đưa vào AI |
| `raw_body` callback | Không đưa; nếu cần cấu trúc thì dựng payload giả cùng schema |

### Dữ liệu giả để test

- Integration test dùng **Testcontainers** (MariaDB, Kafka, Redis) — dữ liệu tự sinh trong test.
- Seed cấu hình sản phẩm / tham chiếu NCC ở `TSD/sql_scripts/seed-*.sql` và `seed-*-mongo.js` — là dữ liệu cấu hình, không phải dữ liệu khách.
- Kịch bản demo sản phẩm TNDS xe máy có tài liệu riêng trong `documents/`.
- > TODO: dự án chưa có — quy định chính thức cấm copy DB server về máy dev, và bộ dữ liệu khách giả dùng chung.

## 5. Quy tắc theo môi trường

| Môi trường | Dữ liệu được phép dùng với AI |
|---|---|
| LOCAL | L1, L2 (theo mục 2), dữ liệu Testcontainers / seed cấu hình. **Không** dữ liệu khách thật |
| DEV server | > TODO: chưa rõ server có dữ liệu khách thật hay không — cần Tech Lead xác nhận; tới lúc đó coi như có |
| STAGING (Ví X) / UAT | Không đưa vào AI. `server-fake` chuyển tiếp cookie/response của staging về localhost — nội dung đó không paste vào AI |
| PRODUCTION | Không đưa vào AI |

## 6. Trách nhiệm

| Vai trò | Trách nhiệm |
|---|---|
| Security Lead (SecOps Lead) | Chốt thang phân loại; duyệt ADR bảo mật (có tên trong `deciders` của ADR-ADP-07); xác nhận chính sách xoay key KMS (TSD callback ghi "pending — 90 ngày") |
| DPO / Legal Lead | Căn cứ lưu trữ theo Nghị định 13/2023/NĐ-CP (vd giữ `raw_body` 10 năm — ADR-CB-05) |
| Tech Lead | Đảm bảo `LogMaskingFilter` / `MaskingLayout` bật ở mọi service; review "PII / secret không log raw" (RULES §F) |
| Dev | Không `log.info("user=" + customer)`; không log PII raw kể cả DEBUG; tự phân loại trước khi dùng AI |
| Admin CMS | Anonymize file upload nếu chứa PII (TSD cms-service) |
| Cả đội | Báo ngay khi PII / secret lọt vào AI hoặc log |

## 7. Khi phát hiện vi phạm (dữ liệu đã bị đưa vào AI sai)

```text
1. DỪNG     — ngừng dùng tool đó với dữ liệu tương tự
2. BÁO      — Security Lead + Tech Lead trong ngày
3. ĐÁNH GIÁ — dữ liệu gì (L3/L4), bao nhiêu bản ghi, tool có lưu không
4. XỬ LÝ    — yêu cầu xoá khỏi tool; nếu là key / credential NCC → xoay trong Vault; nếu là key PII → đánh giá mã hoá lại
5. GHI LẠI  — thêm vào LESSONS.md (đúng thói quen của dự án: mỗi mục là một sự cố thật)
6. THÔNG BÁO— đánh giá nghĩa vụ theo Nghị định 13/2023/NĐ-CP
```

> TODO: dự án chưa có quy trình sự cố dữ liệu chính thức — cần Security Lead bổ sung người nhận báo và thời hạn.

## 8. Checklist dựng & duy trì

- [x] Đã liệt kê loại dữ liệu dự án đang xử lý (mục 1)
- [ ] Một thang phân loại duy nhất — **chưa** (L1–L4 vs "Loại 1–3")
- [ ] Đánh giá ZDR cho tool AI — **chưa**
- [x] Có quy ước masking log (mục 4)
- [ ] JSON form động (`product_attributes`) được bảo vệ tương xứng — **chưa**
- [ ] `INS_PII_ENCRYPTION_KEY` đã set ở mọi server — cần kiểm
- [ ] Rà soát mỗi quý — > TODO

## Nguồn tham chiếu

- `Architecture.md §2.4` (bảng bảo mật & tuân thủ) · `RULES.md` S11, S12, C9 (INS-extra: log không chứa PII raw)
- `LESSONS.md §4.4`
- `TSD/ins-identity-service/02_security-design.md §4` · `TSD/ins-purchase-service/02_security-design.md §4` · `TSD/ins-callback-service/02_security-design.md §4`
- `TSD/docs/design/decisions/ADR-CB-05-crypto-shred.md`, `ADR-ADP-07-credential-vault-never-plaintext.md`
- Nghị định 13/2023/NĐ-CP — https://vanban.chinhphu.vn/
- OWASP LLM Top 10 — LLM06 Sensitive Information Disclosure — https://genai.owasp.org/llm-top-10/

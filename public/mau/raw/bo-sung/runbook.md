---
title: Runbook vận hành
for: B14 bước 1 — Vận hành theo Runbook
owner: DevOps/Ops (R) · Tech Lead (A) · Đội trực (R)
nguồn: AI-SDLC v5.9 dòng 1134-1179; Google SRE Book; Atlassian Incident Management Handbook
---

# Runbook vận hành — [Tên hệ thống]

> **Cách dựng:** DevOps/Ops soạn khi hệ thống gần lên Production (cuối B13), cập nhật sau mỗi sự cố thực tế. Runbook viết cho **người đang trực lúc 2 giờ sáng** — ngắn, có lệnh copy được, không giải thích dài dòng.
>
> Tài liệu gốc ghi rõ mẫu này "chưa có" — file này lấp khoảng trống đó theo chuẩn Google SRE.

## 1. Thông tin hệ thống

| Trường | Giá trị |
|---|---|
| Tên hệ thống | [Tên] |
| Môi trường Production | [URL] |
| Dashboard giám sát | [Link] |
| Kênh cảnh báo | [Telegram/Slack kênh] |
| Kênh sự cố (incident channel) | [Link] |
| Mức độ ảnh hưởng nghiệp vụ | ☐ Thấp ☐ Trung bình ☐ Cao ☐ Sống còn |
| Giờ cao điểm | [Khung giờ] — tránh deploy trong khung này |

## 2. Liên hệ khẩn cấp & leo thang

| Vai trò | Người | Liên hệ | Khi nào gọi |
|---|---|---|---|
| Trực cấp 1 | [Tên] | [SĐT/Telegram] | Mọi cảnh báo đầu tiên |
| Trực cấp 2 (Dev) | [Tên] | [SĐT] | Sau 15 phút chưa xác định được nguyên nhân |
| Tech Lead | [Tên] | [SĐT] | Sự cố S1, hoặc cần quyết định rollback |
| PM | [Tên] | [SĐT] | Cần thông báo khách hàng |
| Security Lead | [Tên] | [SĐT] | Nghi ngờ xâm nhập / rò rỉ dữ liệu |
| Hạ tầng / Cloud | [Nhà cung cấp + số hỗ trợ] | [Link ticket] | Sự cố hạ tầng ngoài tầm kiểm soát |

**Quy tắc leo thang:**

- Sự cố S1: leo thang ngay lập tức, không chờ đủ 15 phút.
- Sự cố S2: leo thang sau 30 phút chưa có hướng khắc phục.
- Không ai trả lời trong 10 phút → gọi trực tiếp qua điện thoại, không chỉ nhắn tin.

## 3. Bảng sự cố thường gặp

| Mã | Triệu chứng | Nguyên nhân khả dĩ | Cách kiểm tra | Lệnh hành động | Người gọi | Mức |
|---|---|---|---|---|---|---|
| INC-01 | Site trả 502/503 | App crash / hết tài nguyên / port không listen | `curl -I http://localhost:[PORT]/` · `netstat -ano \| grep :[PORT]` | Khởi động lại app theo quy trình; xem log 100 dòng cuối | Trực cấp 1 | S2 |
| INC-02 | Site trả 530 (Cloudflare) | Tunnel down hoặc origin down | `tasklist \| grep cloudflared` · `curl -I localhost:[PORT]` | Khởi động lại tunnel theo script chuẩn | Trực cấp 1 | S2 |
| INC-03 | Trang cũ vẫn hiện sau khi deploy | Cache CDN / Service Worker / cache trình duyệt | Kiểm tra ETag/Cache-Control; mở ẩn danh | Purge cache CDN; tăng version asset | Dev | S3 |
| INC-04 | DB kết nối bị từ chối | Hết connection pool / DB down / sai mật khẩu | Kiểm tra health endpoint; xem log DB | Restart pool; kiểm tra số kết nối | Trực cấp 2 | S1 |
| INC-05 | Chậm bất thường (response > 5s) | Truy vấn chậm / N+1 / thiếu index / tài nguyên cạn | Xem dashboard latency; xem slow query log | Bật index tạm / tắt tính năng nặng / mở rộng tài nguyên | Trực cấp 2 | S2 |
| INC-06 | Lỗi xác thực hàng loạt | Token hết hạn / secret bị rotate / đồng hồ lệch | Kiểm tra log 401/403; so giờ hệ thống | Đồng bộ NTP; cập nhật secret | Dev | S1 |
| INC-07 | Tác vụ nền không chạy (job treo) | Worker chết / queue đầy / lỗi dữ liệu đầu vào | Kiểm tra trạng thái worker + độ dài queue | Restart worker; xử lý lại job lỗi | Trực cấp 2 | S2 |
| INC-08 | Dung lượng đĩa đầy | Log không xoay vòng / file tạm tích tụ | `df -h` / kiểm tra kích thước log | Xoá log cũ; bật logrotate; cảnh báo ngưỡng | DevOps | S2 |
| INC-09 | Chi phí API AI tăng vọt | Vòng lặp gọi model / thiếu rate limit / bị lạm dụng | Xem bảng chi phí theo giờ; đếm request | Tắt tính năng AI tạm thời; áp rate limit | Dev + Tech Lead | S2 |
| INC-10 | Nghi ngờ xâm nhập | IP lạ, truy cập bất thường, leo thang quyền | Xem log truy cập; kiểm tra tài khoản mới | **Cô lập hệ thống**, gọi Security Lead ngay, giữ nguyên log | Security Lead | S1 |
| INC-11 | Dữ liệu hiển thị sai (không crash) | Lỗi logic / cache cũ / dữ liệu đồng bộ lệch | So sánh dữ liệu nguồn vs hiển thị | Xác định phạm vi ảnh hưởng trước khi sửa; báo PM | Dev | S2 |
| INC-12 | Website bị chèn nội dung lạ | Lỗ hổng injection / tài khoản admin bị chiếm | Kiểm tra diff nội dung; log đăng nhập admin | Cô lập, khôi phục từ bản sao sạch, rotate toàn bộ secret | Security Lead | S1 |

## 4. Quy trình xử lý sự cố

```text
1. XÁC NHẬN   (≤ 5 phút)  — Sự cố có thật? Ảnh hưởng bao nhiêu người? Mức S?
2. THÔNG BÁO  (≤ 10 phút) — Báo vào kênh sự cố: "Đang xử lý INC-xx, mức Sx, phụ trách: [tên]"
3. CÔ LẬP     (≤ 30 phút) — Chặn lan rộng (tắt tính năng, giới hạn truy cập) TRƯỚC KHI tìm nguyên nhân
4. KHẮC PHỤC             — Sửa theo quy trình Hotfix Production (xem PL5 / mục 3 tài liệu gốc)
5. XÁC NHẬN ỔN ĐỊNH      — Giám sát trực tiếp ≥ 30 phút sau khi fix
6. RCA       (≤ 48 giờ)  — Post-mortem blameless (xem postmortem.md)
7. CẬP NHẬT RUNBOOK      — Bổ sung sự cố mới vào bảng mục 3
```

**Nguyên tắc:** cô lập trước, tìm nguyên nhân sau. Trong lúc sự cố, ưu tiên khôi phục dịch vụ hơn là tìm hiểu đầy đủ lý do.

## 5. Rollback nhanh

| Bước | Lệnh / hành động | Xác nhận |
|---|---|---|
| 1 | Xác định build đang chạy và build trước đó | [Lệnh xem version] |
| 2 | Chuyển traffic về build trước (blue-green / canary rollback) | [Lệnh] |
| 3 | Khôi phục cấu hình nếu có thay đổi | [Link lịch sử cấu hình] |
| 4 | Kiểm tra hệ thống sau rollback | `curl -I [URL]` + chạy smoke test |
| 5 | Thông báo đã rollback | Kênh sự cố + PM |

- [ ] Rollback Plan đã được **diễn tập** ít nhất 1 lần trước go-live (yêu cầu Gate 5)
- [ ] Thời gian rollback mục tiêu: [X] phút
- [ ] Ai có quyền ra lệnh rollback: Tech Lead hoặc người trực S1

## 6. Checklist vận hành định kỳ

### Hằng ngày

- [ ] Kiểm tra dashboard: uptime, tỉ lệ lỗi, thời gian phản hồi
- [ ] Xem cảnh báo qua đêm, xử lý cái còn treo
- [ ] Kiểm tra tác vụ nền/backup đã chạy thành công
- [ ] Xem log lỗi 24 giờ qua

### Hằng tuần

- [ ] Kiểm tra dung lượng đĩa và xu hướng tăng
- [ ] Cập nhật dependency bảo mật (nếu có bản vá Critical)
- [ ] Rà soát tài khoản có quyền truy cập Production (còn ai đã nghỉ?)
- [ ] Diễn tập khôi phục từ backup

### Hằng tháng

- [ ] Rà soát chi phí hạ tầng + chi phí API AI
- [ ] Kiểm tra chứng chỉ SSL còn hạn
- [ ] Rà soát cảnh báo: cái nào ồn (false positive) → chỉnh ngưỡng
- [ ] Cập nhật Runbook với sự cố mới trong tháng

## 7. Dấu hiệu cần DỪNG hệ thống ngay

Dừng dịch vụ (thay vì tiếp tục xử lý) khi:

- [ ] Nghi ngờ rò rỉ dữ liệu người dùng đang tiếp diễn
- [ ] Ghi sai dữ liệu tài chính không thể đảo ngược
- [ ] Hệ thống đang bị tấn công và không kiểm soát được
- [ ] Sự cố lan sang hệ thống khác dùng chung dữ liệu

Người có quyền ra lệnh dừng: **Tech Lead, Security Lead, hoặc PM** (theo mức S1).

Sau khi dừng: thông báo ngay cho PM + PO, ghi lại mốc thời gian, không xoá dữ liệu/log.

## 8. Nguồn tham chiếu

- AI-SDLC v5.9, mục 2 B14 và mục 3 (Quản lý bug, Hotfix Production) — tài liệu gốc nội bộ
- Google SRE Book — Emergency Response — https://sre.google/sre-book/emergency-response/
- Google SRE Book — Being On-Call — https://sre.google/sre-book/being-on-call/
- Google SRE Workbook — On-Call — https://sre.google/workbook/on-call/
- Atlassian Incident Management Handbook — https://www.atlassian.com/incident-management/handbook
- PagerDuty Incident Response — https://response.pagerduty.com/

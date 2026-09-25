---
title: "tasks.md — Phân rã công việc (Task Breakdown)"
for: "B7. Phân rã Task — Giai đoạn 2 (Thiết kế)"
owner: "Tech Lead (R) · PM (A) · AI (sinh task + estimate)"
nguồn: "AI-SDLC v5.9 dòng 681–733; GitHub Spec Kit tasks-template.md; Jira/Atlassian Intelligence"
---

# Danh sách Task: [Tên tính năng]

**Đầu vào**: `./plan.md` (bắt buộc) · `./spec.md` (User Story + AC) · `specs/[###]/data-model.md` · `specs/[###]/contracts/`

**Tiền đề**: Spec đã qua **Gate 1**, plan.md đã qua **Gate 2**. Chưa qua 2 gate này thì không sinh task.

**Tổ chức**: Task nhóm theo User Story để mỗi story có thể triển khai, kiểm thử và demo độc lập.

---

## Định dạng task: `[ID] [P?] [Story] Mô tả`

- **[P]**: có thể chạy song song (khác file, không phụ thuộc nhau)
- **[Story]**: thuộc User Story nào (US1, US2, US3...)
- Mô tả **bắt buộc ghi rõ đường dẫn file** sẽ tạo/sửa
- **Mỗi task ≤ 1 ngày công** (quy tắc Tech Lead review tại B7 bước 3)
- Mỗi task có **AC riêng** — điều kiện hoàn thành kiểm chứng được

## Quy ước đường dẫn

- Dự án đơn: `src/`, `tests/`
- Web app: `backend/src/`, `frontend/src/`
- Mobile: `api/src/`, `ios/src/` hoặc `android/src/`

---

## Phase 1 — Setup (Hạ tầng dùng chung)

**Mục đích**: khởi tạo dự án và cấu trúc nền.

- [ ] T001 Tạo cấu trúc dự án theo plan.md (mục 8) — AC: cây thư mục khớp plan.md, build chạy được
- [ ] T002 Khởi tạo dự án [ngôn ngữ] với framework [X], khoá phiên bản dependency — AC: `[build command]` chạy thành công
- [ ] T003 [P] Cấu hình lint + formatter (ESLint/Prettier/Checkstyle) — AC: lint xanh trên mã nguồn rỗng
- [ ] T004 [P] Cấu hình CI pipeline chạy lint + test trên mọi PR — AC: CI đỏ khi test fail

**Checkpoint**: môi trường dev chạy được, CI hoạt động.

---

## Phase 2 — Foundational (Tiền đề chặn — BẮT BUỘC xong trước mọi US)

**⚠️ CRITICAL**: Không User Story nào được bắt đầu trước khi phase này hoàn tất.

- [ ] T005 Thiết lập schema CSDL + framework migration — AC: `migrate up`/`down` chạy sạch
- [ ] T006 [P] Cài đặt khung xác thực/phân quyền — AC: endpoint bảo vệ trả 401 khi thiếu token
- [ ] T007 [P] Thiết lập định tuyến API + middleware (logging, error handler, CORS) — AC: lỗi trả về đúng RFC 7807
- [ ] T008 Tạo model/thực thể nền dùng chung cho các story — AC: unit test cho các model xanh
- [ ] T009 Cấu hình logging + thu thập metric cơ bản — AC: log xuất ra stdout có correlation ID
- [ ] T010 Thiết lập quản lý cấu hình theo môi trường (.env / secret store) — AC: không có secret trong repo

**Checkpoint**: nền đã sẵn sàng — bắt đầu triển khai song song các User Story.

---

## Phase 3 — User Story 1: [Tiêu đề] (Ưu tiên: P1) 🎯 MVP

**Mục tiêu**: [Story này mang lại gì]

**Kiểm thử độc lập**: [Cách kiểm chứng chỉ riêng story này]

- [ ] T011 [US1] Viết test thất bại cho AC-001 (RED) — AC: test đỏ đúng lý do `[tests/...]`
- [ ] T012 [US1] Triển khai [thành phần] để AC-001 xanh — AC: `[tests/...]` xanh `[src/...]`
- [ ] T013 [P] [US1] Viết test cho AC-002 — AC: test đỏ trước, xanh sau
- [ ] T014 [US1] Triển khai [thành phần] cho AC-002 `[src/...]`
- [ ] T015 [US1] Viết test tích hợp luồng chính của US1 `[tests/integration/...]`
- [ ] T016 [US1] Ghi log audit cho hành động quan trọng — AC: log có user_id, hành động, timestamp

**Checkpoint**: US1 kiểm thử độc lập được, có thể demo.

---

## Phase 4 — User Story 2: [Tiêu đề] (Ưu tiên: P2)

- [ ] T017 [US2] Viết test thất bại cho AC-003 `[tests/...]`
- [ ] T018 [US2] Triển khai [thành phần] — AC: test xanh `[src/...]`
- [ ] T019 [P] [US2] Xử lý trường hợp biên đã ghi ở spec mục 4 `[src/...]`
- [ ] T020 [US2] Viết tài liệu API/OpenAPI cho endpoint mới `[contracts/openapi.yaml]`

**Checkpoint**: US1 + US2 độc lập, có thể phát hành từng phần.

---

## Phase 5 — User Story 3: [Tiêu đề] (Ưu tiên: P3)

- [ ] T021 [US3] Viết test cho AC-004 `[tests/...]`
- [ ] T022 [US3] Triển khai [thành phần] `[src/...]`

---

## Phase 6 — Hoàn thiện & bàn giao (Polish & Handoff)

- [ ] T023 [P] Bổ sung test cho các edge case AI/Dev phát hiện thêm
- [ ] T024 [P] Cập nhật README/quickstart cho tính năng `[docs/...]`
- [ ] T025 Chạy security scan (SAST + secret scan) trên nhánh tính năng — AC: không còn finding Critical/High
- [ ] T026 Kiểm tra coverage đạt ngưỡng `[X]%` — AC: báo cáo coverage đính kèm PR

---

## Ma trận đường găng (Critical Path)

| Task | Phụ thuộc | Chặn task nào | Ghi chú |
|---|---|---|---|
| T001 | — | T002…T026 | Phải xong đầu tiên |
| T005 | T002 | T008, T011+ | Chặn toàn bộ US |
| T011 | T005 | T012 | Đường găng US1 |

---

## Ước lượng & Sprint Backlog

| Task | Story | Người thực hiện | Ước lượng (ngày công) | Sprint | Trạng thái Jira |
|---|---|---|---|---|---|
| T001 | — | [Tên] | [0.5] | [Sprint 1] | [PROJ-101] |
| T011 | US1 | [Tên] | [0.5] | [Sprint 1] | [PROJ-102] |

**Nguyên tắc estimate**: AI đề xuất dựa trên dữ liệu lịch sử (Jira/Atlassian Intelligence) → Tech Lead điều chỉnh → PM chốt khi duyệt Sprint Backlog.

**Đẩy ticket**: dùng `/speckit.taskstoissues` để sinh ticket Jira/Azure DevOps (giữ nguyên mã T0xx trong tiêu đề để truy vết).

---

## Checklist duyệt Sprint Backlog (Human Gate nhẹ)

- [ ] Mọi task ≤ 1 ngày công (task lớn hơn phải tách)
- [ ] Mỗi task có AC kiểm chứng được
- [ ] Đã ánh xạ đủ task cho toàn bộ User Story P1 (MVP)
- [ ] Có task kiểm thử song song, không dồn test về cuối
- [ ] Ước lượng khớp năng lực đội trong sprint
- [ ] PM đã duyệt backlog chính thức
- [ ] Ticket đã đồng bộ lên Jira/Azure DevOps, có link tới spec.md + plan.md

---

## Truy vết ngược

| User Story | Task | Test Case (B11) |
|---|---|---|
| US-001 | T011–T016 | [TC-001…TC-004] |
| US-002 | T017–T020 | [TC-005…TC-007] |
| US-003 | T021–T022 | [TC-008] |

---

## Nguồn tham chiếu

- AI-SDLC v5.9 — B7 Phân rã Task (dòng 681–733)
- GitHub Spec Kit — `refs/spec-kit-tasks.md`, lệnh `/speckit.tasks`, `/speckit.taskstoissues`
- Atlassian Intelligence / Jira — ước lượng effort dựa trên dữ liệu lịch sử
- `./spec.md` (US + AC) · `./plan.md` (kiến trúc) · `../quy-chuan/dor-dod.md`

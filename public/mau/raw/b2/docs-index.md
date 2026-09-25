---
title: docs-index.md — Bản đồ tài liệu dự án
for: B2 — dựng sau constitution.md; AI đọc ở bước 4 của thứ tự đọc file (SKILL.md)
owner: Tech Lead (A/R) · PM (C)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.15; GitHub Spec Kit (docs structure)
---

# docs-index.md — Bản đồ tài liệu dự án

> **Vấn đề file này giải quyết:** khi có 30+ tài liệu, không ai biết thông tin nào nằm ở đâu và **file nào là nguồn sự thật (source of truth)**. Khi hai tài liệu mâu thuẫn, phải biết nghe theo file nào.
>
> **Quy tắc:** một thông tin chỉ có **một** nguồn sự thật chính thức. Các file khác tham chiếu tới nó, không chép lại.

## 1. Bảng nguồn sự thật (source of truth)

| Thông tin | File là nguồn sự thật | Ai sở hữu | Khi nào cập nhật |
|---|---|---|---|
| Ai quyết định gì, khi nào | `Q&A-log.md` (`b3/4.5-QA-log.md`) | BA | Liên tục từ B3 tới B5 |
| Quy tắc bất biến của dự án | `constitution.md` | Tech Lead | Từ bài học B14, qua PR |
| AI được làm gì | `SKILL.md` + `tool-permissions.md` | Tech Lead | Khi đổi công cụ/phạm vi quyền |
| Naming, format, cấu trúc code | `CODING_CONVENTION.md` | Tech Lead | Khi thêm ngôn ngữ/framework |
| Thuật ngữ nghiệp vụ | `glossary.md` | BA | Liên tục từ B3 |
| Mục tiêu kinh doanh, yêu cầu | `BRD.md` (`b3/4.3-BRD.md`) | BA | Qua Change Request sau Gate 1 |
| Đặc tả chi tiết (làm gì) | `spec.md` | BA + PO | Qua Change Request sau Gate 1 |
| Thiết kế kỹ thuật (làm thế nào) | `plan.md` | Tech Lead | Qua ADR mới |
| Quyết định kiến trúc | `docs/adr/*.md` | Tech Lead | Bất biến — tạo ADR mới khi đổi |
| Hợp đồng API | `openapi.yaml` | Tech Lead | Qua PR + versioning |
| Phân rã công việc | `tasks.md` | Tech Lead | Mỗi sprint |
| Tiêu chí Done/Ready | `dor-dod.md` | PM + Tech Lead | Khi tiêu chí không còn phù hợp |
| Phân loại dữ liệu | `data-classification.md` | Security Lead | Khi có loại dữ liệu mới |
| Tool AI được duyệt | `ai-tool-scope.md` | Tech Lead + ATTT | Mỗi quý |
| Kế hoạch kiểm thử | `test-plan.md` | Test Lead | Khi phạm vi/AC đổi |
| Test case & truy vết | `test-case-rtm.md` | Test Lead | Khi AC đổi |
| Bug | `PL5-bug-report.md` (từng bug) | Người báo | Liên tục |
| Biên bản UAT & Go/No-Go | `PL6-uat-signoff-go-no-go.md` | Test Lead + PO | Mỗi release |
| Lịch sử phát hành | `CHANGELOG.md` | Tech Lead | Mỗi release |
| Vận hành & xử lý sự cố | `runbook.md` | DevOps/Ops | Khi có sự cố mới |
| Sự cố & bài học | `postmortem.md` (từng sự cố) | PM | Trong 48h sau sự cố S1 |
| Chỉ số chất lượng | `dora-metrics.md` | DevOps + Tech Lead | Hằng sprint/tháng |
| Thay đổi phạm vi | `PL2-change-request.md` | PM + PO | Khi phát sinh |

## 2. Thứ tự AI nên đọc (bắt buộc)

```text
1.  SKILL.md                ← luật điều khiển AI
2.  constitution.md         ← quy tắc bất biến
3.  CODING_CONVENTION.md    ← cách viết code
4.  docs-index.md           ← file này (bản đồ tài liệu)
5.  glossary.md             ← thuật ngữ nghiệp vụ
6.  tool-permissions.md     ← được làm gì
7.  data-classification.md  ← dữ liệu nào được dùng với AI
8.  spec.md                 ← làm cái gì
9.  plan.md + ADR liên quan ← làm thế nào
10. tasks.md                ← task cụ thể của mình
11. rules/<loại>.md         ← tiêu chí tự kiểm theo loại nội dung
```

**Nếu thiếu file:** dừng lại và hỏi — không tự suy diễn quy tắc.

## 3. Cây thư mục tài liệu

```text
repo/
├── AGENTS.md                  ← chỉ dẫn AI dùng chung nhiều tool
├── SKILL.md                   ← luật điều khiển AI Agent
├── constitution.md            ← quy tắc bất biến
├── CODING_CONVENTION.md
├── docs-index.md              ← file này
├── glossary.md
├── dor-dod.md
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── data-classification.md
│   ├── ai-tool-scope.md
│   ├── tool-permissions.md
│   ├── prompts.md
│   └── adr/
│       ├── 0001-chon-csdl.md
│       └── 0002-chien-luoc-xac-thuc.md
├── spec/
│   ├── spec.md                ← đặc tả (B4)
│   ├── plan.md                ← thiết kế (B6)
│   ├── tasks.md               ← phân rã (B7)
│   ├── BRD.md                 ← B3
│   ├── QA-log.md              ← B3→B5
│   ├── process-flow.md        ← B3
│   └── openapi.yaml           ← B6
├── tests/
│   ├── test-plan.md
│   └── test-case-rtm.md
├── runbook.md
└── postmortems/
    └── 2026-09-14-su-co-thanh-toan.md
```

## 4. Quy tắc cập nhật

| Tình huống | Cập nhật gì |
|---|---|
| Thêm/xoá tài liệu | Cập nhật **file này** — nếu không, người sau không biết tài liệu tồn tại |
| Đổi thông tin thuộc một nguồn sự thật | Sửa **đúng file nguồn sự thật** đó, không sửa bản copy |
| Hai file mâu thuẫn nhau | Bảng mục 1 quyết định file nào thắng; sửa file còn lại thành tham chiếu |
| Phát hiện thông tin trùng ở 2 nơi | Giữ 1 nơi là nguồn sự thật; nơi kia chuyển thành "xem file X" |
| Tài liệu hết dùng | Chuyển vào `archive/` kèm ghi chú lý do, không xoá âm thầm |
| Sau mỗi Gate | Rà soát lại bảng mục 1 xem còn đúng không |

## 5. Checklist

- [ ] Mọi thông tin quan trọng đều có đúng **một** nguồn sự thật được ghi trong bảng mục 1
- [ ] Không có hai file cùng tuyên bố là nguồn sự thật cho cùng một thông tin
- [ ] Thư mục thực tế khớp với cây ở mục 3
- [ ] Mỗi file có ghi rõ **ai sở hữu** và **khi nào cập nhật**
- [ ] Đã commit trước commit code tính năng đầu tiên
- [ ] AI agent đọc được file này ở bước 4 (theo `SKILL.md`)

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.15 — tài liệu gốc nội bộ
- GitHub Spec Kit — cấu trúc tài liệu spec-driven — https://github.com/github/spec-kit
- AGENTS.md — https://agents.md/
- Diátaxis — cấu trúc tài liệu kỹ thuật (tutorial/how-to/reference/explanation) — https://diataxis.fr/

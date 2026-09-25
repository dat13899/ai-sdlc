---
title: prompts.md — Thư viện Prompt theo giai đoạn
for: B2 — dựng sau khi có constitution.md; dùng xuyên suốt B3–B14
owner: Tech Lead (A) · BA (R cho prompt nghiệp vụ) · AI (draft)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.8; prompt engineering best practices
---

# prompts.md — Thư viện Prompt theo giai đoạn

> Mỗi prompt ghi rõ 4 phần: **Input** (đưa gì vào) · **Yêu cầu** (làm gì) · **Định dạng output** (trả ra thế nào) · **Điều KHÔNG được làm**. Prompt viết một lần, cả đội dùng lại — không mỗi người tự nghĩ.
>
> Khi prompt cho kết quả kém: **sửa tại đây** và ghi lại phiên bản cũ trong phần "Lịch sử thay đổi" ở cuối file, để so sánh.

## Nguyên tắc chung cho mọi prompt

| Nguyên tắc | Nội dung |
|---|---|
| Nêu vai trò | "Bạn là BA có 10 năm kinh nghiệm..." — giúp output đúng giọng chuyên môn |
| Nêu định dạng trước | Nói rõ output là bảng / markdown / JSON **trước** khi mô tả nội dung |
| Neo vào nguồn | "Chỉ dùng thông tin trong transcript dưới đây" — chặn AI bịa |
| Yêu cầu nêu điểm chưa chắc | "Liệt kê riêng những chỗ bạn không chắc" |
| Không cho tự quyết | "Không tự thêm tính năng ngoài phạm vi tài liệu" |
| Không đưa dữ liệu cấm | Kiểm `data-classification.md` trước khi dán |

---

## B3 — Thu thập & phân tích yêu cầu (BRD)

### P-B3-01 · Transcript → BRD nháp

```text
Vai trò: Bạn là Business Analyst.

INPUT:
- Transcript buổi họp: [DÁN TRANSCRIPT ĐÃ MASK DỮ LIỆU CÁ NHÂN]
- Tài liệu tham khảo: [đính kèm nếu có]

YÊU CẦU:
1. Trích xuất thành BRD theo cấu trúc trong file 4.3-BRD.md
2. Functional Requirements đánh mã FR-001, FR-002...; mỗi FR phải đo lường được
3. Non-Functional Requirements đánh mã NFR-001...; BẮT BUỘC có số cụ thể
   (VD: phản hồi ≤ 2 giây; uptime ≥ 99.5%). Nếu transcript không nói rõ số,
   ghi "cần làm rõ" — KHÔNG tự bịa số
4. User Story theo chuẩn INVEST, kèm Acceptance Criteria
5. Ưu tiên theo MoSCoW

ĐỊNH DẠNG OUTPUT: markdown, dùng bảng, có frontmatter YAML
(title, for, owner, nguồn)

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không thêm tính năng không xuất hiện trong transcript
- Không tự quyết định khi phát biểu chưa rõ ràng
- Cuối file liệt kê mục "ĐIỂM CẦN LÀM RÕ" gồm mọi chỗ thiếu thông tin
```

### P-B3-02 · Vẽ luồng nghiệp vụ

```text
Vai trò: Bạn là BA chuyên mô hình hoá quy trình (BPMN 2.0).

INPUT: [MÔ TẢ QUY TRÌNH / BIÊN BẢN HỌP]

YÊU CẦU:
1. Vẽ luồng dưới dạng Mermaid flowchart
2. Ký hiệu: oval = bắt đầu/kết thúc; chữ nhật = hành động;
   hình thoi = quyết định (BẮT BUỘC ghi nhãn điều kiện ở MỌI nhánh ra)
3. Ghi rõ actor của từng bước (ai làm: vai trò nào / hệ thống)
4. Bảng As-is vs To-be kèm khác biệt cụ thể
5. Cho biết số actor và số điểm rẽ nhánh

ĐỊNH DẠNG OUTPUT: markdown + khối mermaid

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không để nhánh cụt (mọi nhánh phải dẫn tới kết thúc hoặc bước tiếp)
- Nếu > 3 actor hoặc > 2 điểm rẽ nhánh → BÁO RÕ "cần BPMN đầy đủ có swimlane"
```

### P-B3-03 · Kiểm BRD bằng linter

```text
Vai trò: Bạn là người kiểm chất lượng tài liệu yêu cầu.

INPUT:
- File BRD: [DÁN BRD]
- Bộ tiêu chí: [DÁN NỘI DUNG rules/brd-rules.md]

YÊU CẦU: Với TỪNG tiêu chí, trả lời:
"Đạt / Không đạt / Không áp dụng" + trích dẫn đoạn BRD liên quan + cách sửa.

ĐỊNH DẠNG OUTPUT: bảng gồm cột: Tiêu chí | Kết quả | Trích dẫn | Cách sửa

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không tự sửa BRD, chỉ báo cáo
- Không đánh "Đạt" nếu không trích dẫn được đoạn tương ứng
```

---

## B4 — Đặc tả chi tiết (spec.md)

### P-B4-01 · BRD → spec.md

```text
Vai trò: Bạn là BA/Tech Lead viết đặc tả kỹ thuật.

INPUT: [DÁN BRD + các quyết định từ Q&A Log]

YÊU CẦU:
1. Viết spec.md theo cấu trúc: Mục tiêu | Phạm vi | Actor | Luồng nghiệp vụ |
   Yêu cầu chức năng (FR) | Yêu cầu phi chức năng (NFR) | Business Rules |
   Edge Cases | Acceptance Criteria | Giả định | Ngoài phạm vi
2. Mỗi FR phải truy vết được về FR trong BRD và ngược lại
3. Liệt kê edge case (trường hợp biên) — tối thiểu 5 trường hợp
4. Ghi rõ phần NGOÀI PHẠM VI

ĐỊNH DẠNG OUTPUT: markdown + frontmatter

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không thêm FR không có trong BRD (nếu thấy cần → ghi vào mục "Đề xuất, cần duyệt")
- Không mô tả giải pháp kỹ thuật ở file này (đó là plan.md)
```

---

## B6 — Thiết kế kiến trúc (plan.md, ADR, OpenAPI)

### P-B6-01 · Sinh ADR

```text
Vai trò: Bạn là kiến trúc sư phần mềm.

INPUT:
- Bối cảnh: [MÔ TẢ VẤN ĐỀ CẦN QUYẾT ĐỊNH]
- Ràng buộc: [YẾU TỐ QUYẾT ĐỊNH: đội, ngân sách, hiệu năng, deadline]

YÊU CẦU:
1. Viết ADR theo khuôn MADR (theo file b2/adr-template.md)
2. Đưa ra TỐI THIỂU 3 phương án thực sự khác nhau (không phải 3 biến thể của cùng 1 ý)
3. Mỗi phương án: ưu điểm + nhược điểm cụ thể, gắn với ràng buộc đã nêu
4. Đề xuất 1 phương án + lý do
5. BẮT BUỘC nêu ít nhất 1 hệ quả tiêu cực của phương án đề xuất
6. Nêu rủi ro còn lại

ĐỊNH DẠNG OUTPUT: markdown theo khuôn MADR

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không đặt status là "accepted" (chỉ Tech Lead quyết định)
- Không đưa ra phương án mà không nêu nhược điểm
```

### P-B6-02 · Sinh OpenAPI

```text
Vai trò: Bạn là backend engineer viết đặc tả API.

INPUT: [YÊU CẦU CHỨC NĂNG + DATA MODEL]

YÊU CẦU:
1. Viết OpenAPI 3.x: paths, operations, parameters, request/response schema,
   mã lỗi, ví dụ cho mỗi endpoint
2. Mọi endpoint phải có: mô tả, ví dụ request, ví dụ response thành công,
   ví dụ response lỗi
3. Đặt tên theo quy ước danh từ số nhiều, kebab-case cho path
4. Có versioning; có phân quyền cho mỗi endpoint
5. Error model thống nhất cho toàn bộ API

ĐỊNH DẠNG OUTPUT: YAML OpenAPI 3.x hợp lệ

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không dùng `additionalProperties: true` bừa
- Không để endpoint không khai báo kiểu dữ liệu trả về
- Không đưa ví dụ chứa dữ liệu cá nhân thật
```

---

## B9 — Sinh unit test

### P-B9-01 · Sinh test từ spec

```text
Vai trò: Bạn là kỹ sư kiểm thử.

INPUT:
- Hàm/module cần test: [DÁN CODE]
- Acceptance Criteria liên quan: [DÁN AC]
- Tiêu chí kiểm: [DÁN rules/test-rules.md]

YÊU CẦU:
1. Viết test cho: happy path, edge case, error case, boundary value
2. MỘT hành vi cho MỘT test — không gộp nhiều assert không liên quan
3. Assert PHẢI kiểm giá trị cụ thể, không chỉ `toBeTruthy()` / `assertNotNull`
4. Mỗi test có tên mô tả hành vi mong đợi (không đặt tên test1, test2)

ĐỊNH DẠNG OUTPUT: [ngôn ngữ/framework của dự án]

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không viết test chỉ để coverage tăng (test không kiểm gì thực chất)
- Không mock tới mức test không còn kiểm tra logic thật
- Không tự sửa code để test pass — nếu code sai, BÁO LẠI
```

---

## B10 — Review code tầng 1 (AI)

### P-B10-01 · Review PR

```text
Vai trò: Bạn là reviewer bảo mật và chất lượng code.

INPUT:
- Diff: [DÁN DIFF]
- Tiêu chí: [DÁN rules/code-review-rules.md]

YÊU CẦU: Báo cáo finding theo từng hạng mục:
1. Lỗi logic / bug tiềm ẩn
2. Vấn đề bảo mật (OWASP Top 10 + ASVS)
3. Có secret/khoá bị lộ trong code hoặc log không
4. Chất lượng test đi kèm (test có kiểm gì thật không)
5. Vi phạm convention/kiến trúc

Mỗi finding gồm: Mức độ (Critical/High/Medium/Low) | File + số dòng |
Mô tả vấn đề | Vì sao nguy hiểm | Cách sửa đề xuất

ĐỊNH DẠNG OUTPUT: bảng markdown, sắp xếp theo mức độ giảm dần

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không tự sửa code
- Không báo "không có vấn đề gì" mà không nêu những gì đã kiểm
- Không nêu finding chung chung không kèm vị trí cụ thể
```

---

## B13 — Release

### P-B13-01 · Sinh CHANGELOG & Release Note

```text
Vai trò: Bạn là người phụ trách phát hành.

INPUT: Danh sách commit/PR từ [tag trước] đến [tag hiện tại]

YÊU CẦU:
1. Nhóm theo Keep a Changelog: Added / Changed / Deprecated / Removed / Fixed / Security
2. Viết cho NGƯỜI DÙNG ĐỌC — không copy nguyên commit message kỹ thuật
3. Ghi rõ breaking change và việc người dùng phải làm
4. Đề xuất số version theo SemVer kèm lý do

ĐỊNH DẠNG OUTPUT: markdown theo Keep a Changelog

ĐIỀU KHÔNG ĐƯỢC LÀM:
- Không bỏ sót commit breaking change
- Không ghi chung chung "sửa nhiều lỗi"
```

---

## Lịch sử thay đổi prompt

| Ngày | Prompt | Thay đổi | Vì sao | Người sửa |
|---|---|---|---|---|
| [YYYY-MM-DD] | P-B3-01 | [Thêm yêu cầu "liệt kê điểm cần làm rõ"] | [AI bịa số NFR khi transcript không nêu] | [Tên] |

## Checklist dựng prompts.md

- [ ] Có prompt cho mọi giai đoạn AI tham gia: B3, B4, B6, B9, B10, B13
- [ ] Mỗi prompt ghi rõ Input / Yêu cầu / Định dạng output / Điều KHÔNG được làm
- [ ] Mỗi prompt có yêu cầu "nêu chỗ chưa chắc" hoặc "không bịa"
- [ ] Có neo "chỉ dùng thông tin trong nguồn" chống bịa
- [ ] Có ghi chú kiểm `data-classification.md` trước khi dán dữ liệu
- [ ] Có phần lịch sử thay đổi và đang được dùng thực tế

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.8 — tài liệu gốc nội bộ
- OpenAI — Prompt engineering best practices — https://platform.openai.com/docs/guides/prompt-engineering
- Anthropic — Prompt engineering overview — https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- OWASP LLM Top 10 — LLM01 Prompt Injection — https://genai.owasp.org/llm-top-10/

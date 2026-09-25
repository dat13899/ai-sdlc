---
title: Chỉ mục chuẩn đang áp dụng
for: Toàn quy trình — tra cứu nhanh "việc này theo chuẩn nào"
owner: Tech Lead (A/R) · PM (C)
nguồn: AI-SDLC v5.9 mục 5 (Tóm tắt chuẩn áp dụng & công cụ AI); các tổ chức ban hành chuẩn
---

# Chỉ mục chuẩn đang áp dụng

> **Cách dựng:** Tech Lead duy trì file này ở B2. Khi dự án dùng thêm chuẩn mới, thêm một dòng vào bảng — không viết lại quy trình. Mỗi chuẩn ghi rõ **áp ở bước nào** để không ai phải đoán.

## 1. Bảng chuẩn theo bước

| Chuẩn | Tổ chức ban hành | Áp ở bước | Dùng để làm gì | Bắt buộc? | Link chính thống |
|---|---|---|---|---|---|
| Spec-Driven Development / Spec Kit | GitHub | B2, B4, B5, B6, B7 | Bộ công cụ + cấu trúc tài liệu spec/plan/tasks; `/speckit.*` sinh và lan truyền thay đổi | ✅ Bắt buộc | https://github.com/github/spec-kit |
| AGENTS.md (chuẩn chỉ dẫn agent) | Cộng đồng agents.md | B2 | File chỉ dẫn agent dùng chung nhiều công cụ (de-facto 2026) | ✅ Bắt buộc | https://agents.md/ |
| PMBOK Guide | PMI | B1, B7 | Project Charter, Stakeholder Register, quản lý phạm vi/tiến độ | ✅ Bắt buộc (phần Charter) | https://www.pmi.org/ |
| BABOK v3 (Business Analysis Body of Knowledge) | IIBA | B3 | Kỹ thuật elicit, phân tích yêu cầu, BRD, xử lý xung đột stakeholder | ✅ Bắt buộc | https://www.iiba.org/ |
| BPMN 2.0 | OMG | B3, B4 | Ký hiệu và quy tắc vẽ sơ đồ luồng nghiệp vụ | ✅ Bắt buộc | https://www.omg.org/spec/BPMN/ |
| User Story + INVEST | Bill Wake / cộng đồng Agile | B4 | Tiêu chí chất lượng User Story | ✅ Bắt buộc | https://www.agilealliance.org/glossary/invest/ |
| Gherkin (Given–When–Then) | Cucumber | B4, B11 | Định dạng Acceptance Criteria kiểm chứng được, chuyển thành test | ✅ Bắt buộc | https://cucumber.io/docs/gherkin/ |
| ISO/IEC/IEEE 29148 | ISO / IEEE | B3, B4 | Kỹ nghệ yêu cầu — cấu trúc spec, chất lượng yêu cầu | 🔶 Khuyến nghị (tham chiếu) | https://www.iso.org/standard/72089.html |
| ISO/IEC/IEEE 29119 | ISO / IEEE | B11, B12 | Quy trình và tài liệu kiểm thử phần mềm (Test Plan/Test Case) | ✅ Bắt buộc | https://www.iso.org/standard/81291.html |
| ISTQB | ISTQB | B11 | Thuật ngữ và kỹ thuật kiểm thử chuẩn (Severity/Priority, test design) | 🔶 Khuyến nghị | https://www.istqb.org/ |
| C4 model | Simon Brown | B6 | 4 mức sơ đồ kiến trúc (Context / Container / Component / Code) | ✅ Bắt buộc | https://c4model.com/ |
| Structurizr | Structurizr | B6 | Vẽ C4 bằng mã (diagram-as-code) thay vì công cụ kéo thả | 🔶 Khuyến nghị | https://structurizr.com/ |
| ADR (Architecture Decision Record) | Cộng đồng ADR | B6 | Ghi lại quyết định kiến trúc kèm bối cảnh và hệ quả | ✅ Bắt buộc | https://adr.github.io/ |
| MADR (Markdown ADR) | MADR project | B2, B6 | Khuôn mẫu ADR chuẩn bằng markdown | ✅ Bắt buộc | https://adr.github.io/madr/ |
| OpenAPI Specification 3.x | OpenAPI Initiative | B6, B12 | Đặc tả API (contract) giữa các bên | ✅ Bắt buộc | https://spec.openapis.org/ |
| Conventional Commits 1.0.0 | Conventional Commits | B8, B13 | Quy ước commit message → sinh CHANGELOG tự động | ✅ Bắt buộc | https://www.conventionalcommits.org/en/v1.0.0/ |
| Semantic Versioning 2.0.0 | semver.org | B13 | Quy tắc đánh số phiên bản theo mức thay đổi | ✅ Bắt buộc | https://semver.org/spec/v2.0.0.html |
| Keep a Changelog 1.1.0 | Keep a Changelog | B13 | Định dạng CHANGELOG cho người dùng đọc | ✅ Bắt buộc | https://keepachangelog.com/en/1.1.0/ |
| OWASP ASVS (Application Security Verification Standard) | OWASP | B6, B10, B12 | Tiêu chuẩn kiểm chứng bảo mật ứng dụng; cơ sở cho `rules/code-review-rules.md` | ✅ Bắt buộc | https://owasp.org/www-project-application-security-verification-standard/ |
| OWASP Top 10 | OWASP | B10, B12 | 10 nhóm rủi ro bảo mật web phổ biến nhất | ✅ Bắt buộc | https://owasp.org/www-project-top-ten/ |
| OWASP LLM Top 10 | OWASP GenAI Security Project | B2, B6, B10, B12 | 10 rủi ro riêng khi tích hợp AI/LLM | ✅ Bắt buộc (khi có AI) | https://genai.owasp.org/llm-top-10/ |
| OWASP API Security Top 10 | OWASP | B6, B12 | Rủi ro riêng của API | 🔶 Khuyến nghị | https://owasp.org/API-Security/ |
| NIST AI Risk Management Framework | NIST | B2, B6 | Khung quản trị rủi ro AI (Govern / Map / Measure / Manage) | 🔶 Khuyến nghị | https://www.nist.gov/itl/ai-risk-management-framework |
| ISO/IEC 42001 (AI management system) | ISO / IEC | B2, B14 | Hệ thống quản lý AI ở cấp tổ chức | 🔶 Khuyến nghị | https://www.iso.org/standard/81230.html |
| ISO/IEC 27001 | ISO / IEC | B2, B12 | Hệ thống quản lý an toàn thông tin (phân loại dữ liệu, kiểm soát truy cập) | 🔶 Khuyến nghị | https://www.iso.org/standard/27001 |
| Google SRE (Runbook, Post-mortem, On-call) | Google | B13, B14 | Vận hành, xử lý sự cố, post-mortem blameless | ✅ Bắt buộc (cho Runbook/Post-mortem) | https://sre.google/sre-book/table-of-contents/ |
| DORA metrics | DORA / Google Cloud | B14 | 4 chỉ số đo hiệu quả kỹ thuật | ✅ Bắt buộc (đo) | https://dora.dev/ |
| 12-Factor App | Adam Wiggins / Heroku | B6, B13 | Nguyên tắc thiết kế ứng dụng 12 yếu tố (config, log, stateless) | 🔶 Khuyến nghị | https://12factor.net/ |
| Scrum Guide | Scrum.org / Ken Schwaber & Jeff Sutherland | B7, B14 | Khung Scrum, Sprint, Retrospective | ✅ Bắt buộc (nếu chạy Scrum) | https://scrumguides.org/ |
| Definition of Done | Scrum.org | B2, B7, B11 | Tiêu chí "hoàn thành" khách quan cho mỗi task/sprint | ✅ Bắt buộc | https://www.scrum.org/resources/what-definition-done |
| STRIDE threat modeling | Microsoft | B6, B12 | Phân loại mối đe dọa hệ thống | ✅ Bắt buộc | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats |
| CWE Top 25 | MITRE | B10 | 25 loại lỗ hổng phần mềm nguy hiểm nhất | 🔶 Khuyến nghị | https://cwe.mitre.org/top25/ |

**Chú thích:** ✅ = bắt buộc áp dụng trong quy trình này · 🔶 = khuyến nghị/tham chiếu khi cần.

## 2. Công cụ AI nổi bật theo tài liệu gốc

| Công cụ | Dùng ở bước | Vai trò |
|---|---|---|
| GitHub Spec Kit | B2, B4–B7 | Sinh và lan truyền spec/plan/tasks; `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.clarify` |
| Claude Code | B6, B8, B9 | Agentic coding có ngữ cảnh repo |
| CodeRabbit | B10 | AI review tầng 1 trên PR |
| Playwright | B11 | Sinh và chạy automation test |
| Fireflies / Otter.ai | B1, B3 | Ghi âm và tóm tắt cuộc họp |
| JMeter / k6 | B12 | Load & stress test (Gate 4c) |
| FOSSA / Snyk | B13 | Quét license và lỗ hổng dependency |

## 3. Ghi chú khi dùng chuẩn

- **Chuẩn là mức tối thiểu, không phải mục tiêu.** Đừng biến việc tuân chuẩn thành mục đích tự thân — nếu một chuẩn không phù hợp quy mô dự án, ghi rõ lý do trong `constitution.md` thay vì lặng lẽ bỏ qua.
- **Chỉ áp phần liên quan.** ISO/IEC 29119 đầy đủ là bộ tài liệu rất lớn; dự án nhỏ dùng cấu trúc Test Plan ở mục B11 là đủ.
- **Ưu tiên chuẩn đo được.** Chuẩn chỉ có giá trị khi kiểm chứng được: "NFR phải định lượng" tốt hơn "hệ thống phải nhanh".
- **Cập nhật khi chuẩn đổi phiên bản.** Ghi lại phiên bản đang áp (ví dụ BPMN 2.0, OpenAPI 3.1, MADR) để tránh tranh cãi về sau.

## Nguồn tham chiếu

- AI-SDLC v5.9, mục 5 (Tóm tắt chuẩn áp dụng & công cụ AI) và mục 7 — tài liệu gốc nội bộ
- Các tổ chức ban hành chuẩn: liệt kê ở cột "Tổ chức ban hành" — link lấy từ trang chính thống của từng tổ chức
- Mọi link trong bảng trên đã được kiểm tra trỏ tới trang gốc của chuẩn; nhãn `[cần kiểm tra]` không xuất hiện trong file này tại thời điểm soạn.

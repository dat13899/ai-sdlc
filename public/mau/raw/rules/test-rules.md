---
title: Linter cho Unit Test do AI sinh — rules/test-rules.md
for: B9 bước 2 (AI tự kiểm) trước khi CI chạy coverage gate
owner: AI (tự kiểm) · Dev (R) · Tech Lead (A)
nguồn: AI-SDLC v5.9 Phụ lục 3 mục 3.13; ISO/IEC/IEEE 29119; ISTQB; Google Testing Blog
---

# rules/test-rules.md — Checklist AI tự kiểm Unit Test

## Mục đích

Rủi ro lớn nhất của unit test do AI sinh là **test giả**: test luôn xanh, coverage cao, nhưng không kiểm chứng gì. Bộ test như vậy tệ hơn không có test — vì nó tạo cảm giác an toàn giả và chặn việc bổ sung test thật.

Linter này chặn test giả **trước khi CI báo coverage xanh**.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B9 bước 1 — AI sinh test | AI | code + `spec.md` (AC) |
| B9 bước 2 — AI tự kiểm | AI | test vừa sinh |
| B9 bước 3 — Dev đọc assert | Dev | test đã qua linter |
| B9 bước 4 — CI chạy | CI | toàn bộ suite + coverage gate |
| B10 — review tầng 1 | AI review | test trong PR |

**Quy tắc bắt buộc của tài liệu gốc:** Dev phải **đọc assert** thay vì tin mù vào kết quả AI báo. Linter này giúp dev biết đọc chỗ nào.

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Vì sao chặn |
|---|---|---|
| C1 | **Mọi test phải có assert thật** — không test nào chỉ chạy code mà không kiểm kết quả | Test không assert luôn xanh, vô nghĩa |
| C2 | Không được assert luôn đúng kiểu `expect(true).toBe(true)` / `assert True` / `assertNotNull(obj)` cho object vừa tạo trong chính test | Assert vô nghĩa, không kiểm logic |
| C3 | **Một hành vi mỗi test** — không gộp nhiều hành vi vào 1 test | Test gộp thì fail không biết lỗi ở đâu |
| C4 | Test **không được phụ thuộc thứ tự chạy** hoặc phụ thuộc test khác | Chạy riêng lẻ fail, chạy cả suite pass → flaky |
| C5 | Không được **mock chính đối tượng đang test** hoặc mock đến mức test chỉ kiểm tra mock | Test kiểm tra mock = không test gì cả |
| C6 | Không hard-code dữ liệu/danh tính thật từ Production | Rò rỉ dữ liệu cá nhân (vi phạm `data-classification.md`) |

## Checklist tự kiểm

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú |
|---|---|---|---|
| 1 | Mọi test function đều có ít nhất 1 assert? | | |
| 2 | Có assert nào so sánh với chính giá trị vừa gán trong test (tautology)? | | |
| 3 | Có assert kiểu `assertTrue(true)` / `toBeTruthy()` trên object luôn truthy? | | |
| 4 | Mỗi test kiểm **một** hành vi (tên test nói rõ hành vi đó)? | | |
| 5 | Tên test mô tả hành vi mong đợi, không phải tên hàm (`tính tổng trả về 0 khi giỏ rỗng`, không phải `testSum`)? | | |
| 6 | Test có phụ thuộc thứ tự chạy (dùng biến toàn cục, DB dùng chung, `beforeAll` tạo dữ liệu mà `afterAll` không xoá)? | | |
| 7 | Chạy riêng từng test — có test nào fail mà chạy cả suite lại pass? | | |
| 8 | Có test nào mock chính class/hàm đang được test? | | |
| 9 | Có test nào chỉ assert rằng mock đã được gọi (không kiểm kết quả nghiệp vụ)? | | |
| 10 | Đã bao phủ **edge case**: giá trị null/rỗng, chuỗi rỗng, mảng rỗng, số 0, số âm, giá trị biên (min/max), ký tự đặc biệt/Unicode? | | |
| 11 | Đã bao phủ **đường lỗi**: input sai, lỗi mạng/timeout, quyền bị từ chối, tài nguyên không tồn tại? | | |
| 12 | Có test nào hard-code tên người/số điện thoại/email/CMND thật? | | |
| 13 | Có test nào gọi API/DB thật ra ngoài (không mock) làm test chậm và không ổn định? | | |
| 14 | Test có kiểm **giá trị biên chính xác** thay vì chỉ kiểm "khác null"? | | |
| 15 | Mỗi Acceptance Criteria trong `spec.md` đã có ít nhất 1 test tương ứng? | | |
| 16 | Có AC nào không có test nào bao phủ? (liệt kê mã AC) | | |
| 17 | Coverage đạt ngưỡng của dự án? | | |
| 18 | Coverage có bị "làm đầy" bằng test vô nghĩa chỉ để đủ số? | | |
| 19 | Có test nào bị `skip` / `xit` / `@Ignore` mà không ghi lý do? | | |
| 20 | Thời gian chạy toàn bộ suite unit test còn trong ngưỡng (thường < 5 phút)? | | |
| 21 | Khi sửa code sai đi (mutation), có test nào fail không? (kiểm nhanh bằng mutation testing nếu có) | | |
| 22 | Đã loại bỏ test trùng lặp hoàn toàn với test khác? | | |
| 23 | Test có khẳng định rõ side-effect (đã ghi log, đã gửi email, đã cập nhật DB) khi hành vi đó quan trọng? | | |

**Ngưỡng đạt:** C1–C6 = Đạt, câu 17 = Đạt, và số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**Không assert — SAI:**
```js
test('tính tổng giỏ hàng', () => {
  const total = cart.total([{ price: 100 }, { price: 200 }]);
  console.log(total);          // chỉ in, không kiểm gì
});
```

**ĐÚNG:**
```js
test('tính tổng giỏ hàng có 2 sản phẩm', () => {
  const total = cart.total([{ price: 100 }, { price: 200 }]);
  expect(total).toBe(300);
});
```

**Assert vô nghĩa — SAI:**
```js
test('tạo đơn hàng', () => {
  const order = createOrder({ id: 1 });
  expect(order).toBeDefined();          // object vừa tạo luôn defined
  expect(order.id).toBe(1);             // chỉ lặp lại input
});
```

**ĐÚNG:**
```js
test('tạo đơn hàng gán trạng thái NEW và sinh mã theo định dạng ORD-YYYYMM-xxxx', () => {
  const order = createOrder({ customerId: 'c1', items: [{ sku: 'A1', qty: 2 }] });
  expect(order.status).toBe('NEW');
  expect(order.code).toMatch(/^ORD-\d{6}-\d{4}$/);
  expect(order.totalAmount).toBe(200000);
});
```

**Test phụ thuộc thứ tự — SAI:**
```js
let createdId;
test('tạo user', () => { createdId = createUser(); });
test('xoá user', () => { deleteUser(createdId); });   // chạy riêng sẽ fail
```
**ĐÚNG:** mỗi test tự tạo dữ liệu của mình trong `beforeEach`, tự dọn trong `afterEach`.

**Mock quá mức — SAI:** mock `calculateTax()` rồi assert `calculateTax` được gọi — không kiểm số thuế đúng hay sai.
**ĐÚNG:** cho `calculateTax()` chạy thật với vài mức thu nhập, assert số tiền thuế cụ thể; chỉ mock phần I/O (gọi API, ghi DB).

## Khi nào tự động CHẶN (block)

Không được mở PR / CI phải đỏ nếu:

- [ ] Có test không có assert nào (C1)
- [ ] Có assert tautology `assertTrue(true)` / so sánh với chính giá trị vừa set (C2)
- [ ] Có test phụ thuộc thứ tự chạy (C4)
- [ ] Có test hard-code dữ liệu cá nhân thật từ Production (C6)
- [ ] Coverage dưới ngưỡng dự án (câu 17)
- [ ] Có AC trong `spec.md` không được test nào bao phủ (câu 16)

## Ngưỡng gợi ý cho dự án

| Chỉ số | Ngưỡng tối thiểu | Ghi chú |
|---|---|---|
| Line coverage | ≥ 70% | Tài liệu gốc yêu cầu "coverage gate tự động" |
| Branch coverage | ≥ 60% | Quan trọng hơn line coverage cho logic rẽ nhánh |
| Mutation score | ≥ 60% | Đo chất lượng test thật — KPI mục 8 tài liệu gốc |
| Module lõi (thanh toán, phân quyền) | ≥ 90% | Không thoả hiệp |
| Thời gian chạy suite | < 5 phút | Nếu vượt, tách unit/integration |

## Nguồn tham chiếu

- AI-SDLC v5.9, Phụ lục 3 mục 3.13 — tài liệu gốc nội bộ
- ISO/IEC/IEEE 29119 Software Testing — https://www.iso.org/standard/81291.html
- ISTQB Foundation Level Syllabus — https://www.istqb.org/
- Google Testing Blog — https://testing.googleblog.com/
- Mutation Testing (PIT / Stryker) — https://pitest.org/ · https://stryker-mutator.io/
- Test Desiderata (Kent Beck) — https://kentbeck.github.io/TestDesiderata/

---
title: Linter cho Unit Test do AI sinh — rules/test-rules.md (ví dụ INS Platform)
for: B9 bước 2 (AI tự kiểm) trước khi CI chạy coverage gate
owner: AI (tự kiểm) · Dev (R) · Tech Lead (A)
nguồn: templates/rules/test-rules.md; Architecture.md §2.7; LESSONS.md §5; TEST_COVERAGE_REPORT (2026-06-25); TEST_REPORT (2026-06-21); TSD purchase-service 07_testing-design.md
---

> Ví dụ điền thật từ dự án INS Platform (đã ẩn danh). Template gốc: templates/rules/test-rules.md

# rules/test-rules.md — Checklist AI tự kiểm Unit Test (INS Platform)

## Mục đích

INS Platform có 15 microservice Java 21 + Spring Boot 3.5, mỗi service là Maven 3 module `domain` ← `application` ← `adapter`. Rủi ro test giả ở đây có bằng chứng cụ thể: purchase-service từng có **40+ test đỏ nền** và **một assertion sai thật nằm im trong đó nhiều tuần** vì mọi người chỉ so tổng số fail (LESSONS §5.3). File này quy định tầng test, cách chạy, cách **đếm và so sánh test cho đúng**, và mốc đỏ sẵn để AI không báo "xanh" giả.

## Khi nào chạy

| Mốc | Ai chạy | Đầu vào |
|---|---|---|
| B9 bước 1 — AI sinh test | AI | code + SRS (AC Gherkin `TC-{SVC}-NN` trong TSD `07_testing-design.md` §11) |
| B9 bước 2 — AI tự kiểm | AI | test vừa sinh + **chạy RIÊNG lớp test của use case vừa sửa** |
| B9 bước 3 — Dev đọc assert | Dev | test đã qua linter |
| B9 bước 4 — chạy cả module | Dev/CI | `-Dmaven.test.failure.ignore=true`, so theo danh tính với mốc |
| B10 — review tầng 1 | AI review | test trong PR + `ArchitectureTest` |

**Quy tắc bắt buộc của tài liệu gốc:** Dev phải **đọc assert** thay vì tin mù vào kết quả AI báo.

## Tầng test & lệnh chạy

| Tầng | Module | Công cụ | Quy ước | Docker? |
|---|---|---|---|---|
| Domain unit | `domain/` | JUnit 5 + AssertJ thuần, **không Spring**, thường không có Mockito trong pom | Dựng value object trực tiếp; test factory (happy + reject), chuyển trạng thái + guard, event accumulator (`pullEvents`/`flushEvents`) | Không |
| UseCase unit | `application/` | JUnit 5 + Mockito | UseCase **không phải Spring bean** → `new XUseCase(...)` qua constructor (hoặc param-object `*Deps`); chỉ mock **port**; record DTO là `final` → dựng thật; `repo.save → thenAnswer(inv -> inv.getArgument(0))` | Không |
| ArchUnit | `adapter/` | `archunit-junit5` | `ArchitectureTest` — domain không phụ thuộc Spring/JPA/Temporal, application không phụ thuộc adapter, UseCase không `@Service`/`@Component`, controller chỉ gọi facade | Không |
| Controller | `adapter/` | Standalone MockMvc | `MockMvcBuilders.standaloneSetup(new XController(mockFacade)).build()` | Không |
| Temporal workflow | `adapter/` | `TestWorkflowEnvironment` (mock activity) + `WorkflowReplayer` | Mọi thay đổi nhịp poll / nhánh phải đi qua version marker; test replay phải xanh | Không |
| Integration | `adapter/` (`*IntegrationTest` / `*IT`) | Testcontainers (MariaDB, Kafka, Redis/Valkey), WireMock | Pin version image, **cấm `latest`** | **Có** |

```bash
# chạy từ trong ins-{service}/
./mvnw test -pl domain                                   # no Docker
./mvnw test -pl application                              # no Docker
./mvnw test -pl adapter -Dtest='ArchitectureTest'        # no Docker
./mvnw test -pl adapter -Dtest='*IntegrationTest'        # Docker required
./mvnw test -pl <module> -Dtest='ClassName#methodName'   # 1 method

# chạy 1 lớp ở application khi reactor có module khác không khớp pattern
mvn -o -pl application -am test -Dtest='XUseCaseTest' -Dsurefire.failIfNoSpecifiedTests=false
```

**Hiện trạng tầng integration:** không đồng đều. `ins-insurer-adaptor` có sẵn integration test Testcontainers. Ở purchase-service (baseline TSD), pom **không có Testcontainers, WireMock, Pact** — integration/contract/E2E trong TSD là **đặc tả target**, chưa có công cụ để viết. Không được báo "đã có integration test" cho service chưa có dependency.

**Gotcha build (đã gặp):**
- Lần đầu chạy phải **online** để tải provider `surefire-junit-platform`; sau đó `-o` được.
- `-pl application test` không kèm `-am` mà `.m2` còn jar domain cũ → `TestEngine 'junit-jupiter' failed to discover tests` — là lỗi linkage, **không phải lỗi test**. Thêm `-am` hoặc `mvn -o -pl domain install -DskipTests` trước.
- Maven incremental **không build lại** khi chỉ đổi file test → `clean` trước khi đọc kết quả.
- `messages.properties` nằm ở module adapter, không có trên classpath test của domain/application → `Msg.get` trả **tên KEY** thay vì message → nguồn gốc 40+ test đỏ nền ở purchase.

## Đếm test & so sánh theo danh tính

1. `./mvnw -o -q test` **DỪNG ở module đầu tiên đỏ** → bỏ qua hẳn module `adapter` (nơi nhiều test nhất). **Bắt buộc** `-Dmaven.test.failure.ignore=true`.
2. **Không** đếm bằng `awk` trên file surefire `.txt`: lớp `@Nested` có display name tiếng Việt làm lệch cột. Sai thật: 337 đếm ra 303, 178 → 70, 671 → 668.
3. Nguồn số đúng duy nhất = dòng `Tests run:` trong khối `[INFO] Results:` của **từng module**.
4. `tr -d '\r'` trước khi grep log, nếu không grep báo "binary file matches".
5. **So theo DANH TÍNH, không theo số** — số test có thể tăng vì người khác vừa commit; chuỗi `Time elapsed` làm `diff` log vô nghĩa:

```bash
grep -aoE "[A-Za-z]+Test\.[A-Za-z0-9_]+ -- Time elapsed: [0-9.]+ s <<< (FAILURE|ERROR)!" log.txt \
  | sed 's/ -- Time.*<<< / /' | sort -u > sau.txt
comm -13 truoc.txt sau.txt   # rỗng = không hồi quy
```

## Mốc đỏ sẵn (2026-08-28)

Số dạng `chạy / đỏ`. Đỏ **nhiều hơn** mốc = hồi quy; bằng mốc **chưa chắc** an toàn — vẫn phải so danh tính.

| Service | domain | application | adapter |
|---|---|---|---|
| purchase | 178 / 0 | 231 / **40** | 692 / **2** |
| promotion | 117 / **32** | 171 / **51 + 1 error** | 265 / 0 |
| insurer-adaptor | 27 / 0 | 24 / 0 | 337 / 0 |

`ArchitectureTest#controller_should_go_through_facade` đỏ với **3 vi phạm** — số này là mốc, nhiều hơn = hồi quy.

## Quy tắc bắt buộc (điều kiện chặn)

| # | Quy tắc | Vì sao chặn |
|---|---|---|
| C1 | **Mọi test phải có assert thật** trên kết quả nghiệp vụ | Test không assert luôn xanh |
| C2 | Không assert tautology / `assertNotNull` trên object vừa dựng trong test | Không kiểm logic |
| C3 | Một hành vi mỗi test; tên test (hoặc `@DisplayName` tiếng Việt) nói rõ hành vi | Fail không biết lỗi ở đâu |
| C4 | Không phụ thuộc thứ tự chạy / dữ liệu dùng chung | Flaky |
| C5 | Không mock chính use case/aggregate đang test; **chỉ mock port** | Test kiểm tra mock = không test gì |
| C6 | Không hard-code CCCD/SĐT/email thật — dùng `net.datafaker:datafaker` hoặc giá trị giả rõ ràng (`0900000000`) | Rò rỉ PII |
| C7 | **Không sửa code main để test pass** | Quy ước đã chốt của đợt nâng coverage |
| C8 | Đổi hành vi thì sửa **cùng commit** cả test lẫn javadoc; chạy RIÊNG lớp test của use case vừa sửa | Một commit đổi hành vi `RESUMABLE` mà không sửa test → assertion sai thật nằm im nhiều tuần giữa 40 test đỏ nền |

## Checklist tự kiểm

| # | Câu hỏi kiểm tra | Đạt/Không đạt | Ghi chú dự án |
|---|---|---|---|
| 1 | Mọi test function có ít nhất 1 assert? | | AssertJ `assertThat(...)` |
| 2 | Có assert so với chính giá trị vừa gán? | | |
| 3 | Có `assertTrue(true)` / `isNotNull()` trên object luôn tồn tại? | | |
| 4 | Mỗi test kiểm **một** hành vi? | | |
| 5 | Tên test mô tả hành vi? | | Ví dụ thật: `paymentFailThenSuccess_keepsAliveAndIssues` |
| 6 | Có phụ thuộc thứ tự chạy? | | |
| 7 | Chạy riêng từng lớp — có lớp fail mà chạy cả suite lại pass (hoặc ngược lại)? | | Bắt buộc chạy riêng lớp của use case vừa sửa |
| 8 | Có test mock chính class đang test? | | |
| 9 | Có test chỉ `verify(mock)` mà không kiểm kết quả nghiệp vụ? | | Side-effect quan trọng (REST/Kafka/SMS) thì verify **kèm** assert trạng thái |
| 10 | Đã phủ edge case (null, rỗng, 0, âm, biên, Unicode)? | | Các nhánh `??` / `\|\|` / parse blank/overflow |
| 11 | Đã phủ đường lỗi (NCC từ chối, timeout, sai tenant, không tồn tại)? | | Guard phải đứng **trước** side-effect — test đường lỗi phải khẳng định **không** có REST/Kafka/SMS nào đã bắn (LESSONS §1) |
| 12 | Có dữ liệu cá nhân thật? | | Datafaker locale `vi` |
| 13 | Có test unit gọi API/DB thật? | | Unit dùng mock port; I/O thật chỉ ở `*IntegrationTest` |
| 14 | Kiểm giá trị biên chính xác thay vì chỉ "khác null"? | | Tiền VND so `Long` chính xác |
| 15 | Mỗi AC trong SRS/TSD có ít nhất 1 test? | | Map `TC-{SVC}-NN` → lớp test ("Test hiện có: ...") |
| 16 | Có AC nào không có test? | | AC viết cho thành phần đã xoá phải gỡ hoặc thay, không để treo |
| 17 | Coverage đạt ngưỡng? | | Xem "Ngưỡng" — đo JaCoCo ad-hoc |
| 18 | Coverage có bị làm đầy bằng test vô nghĩa? | | Getter/enum chỉ để đủ số không tính là "phủ hành vi" |
| 19 | Có test `@Disabled` không lý do? | | |
| 20 | Suite unit chạy trong ngưỡng thời gian? | | > TODO: dự án chưa có số đo thời gian suite — cần Tech Lead bổ sung |
| 21 | Có mutation testing? | | > TODO: dự án chưa có — cần Tech Lead quyết có dùng PIT không |
| 22 | Có test trùng lặp? | | |
| 23 | Side-effect quan trọng đã được khẳng định? | | Outbox row được ghi, SMS **không** gửi khi guard chặn |
| 24 | Đã đếm test theo "Results" từng module + so danh tính với mốc? | | Mục "Đếm test" ở trên |
| 25 | Test đọc message dựa vào `Msg.get`? | | Trên domain/application sẽ nhận **tên KEY** — assert theo mã lỗi, không theo câu chữ |

**Ngưỡng đạt:** C1–C8 = Đạt, câu 17 = Đạt, câu 24 = Đạt, và số câu "Không đạt" = 0.

## Ví dụ ĐÚNG vs SAI

**UseCase — SAI** (mock chính đối tượng, chỉ verify):
```java
XUseCase useCase = mock(XUseCase.class);
useCase.execute(cmd);
verify(useCase).execute(cmd);        // không kiểm gì
```

**ĐÚNG** (dựng thật, chỉ mock port, assert kết quả nghiệp vụ):
```java
when(orderRepo.findById(id)).thenReturn(Optional.of(order));
when(orderRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
var useCase = new CancelOrderUseCase(orderRepo, promotionPort);

var result = useCase.execute(new CancelOrderCommand(id, tenantId));

assertThat(result.status()).isEqualTo(OrderStatus.CANCEL_BY_CUSTOMER);
```

**Đường lỗi — SAI:** chỉ assert ném `BusinessRuleViolationException`.
**ĐÚNG:** assert ném **và** `verifyNoInteractions(policyPort, smsPublisher)` — vì `@Transactional` không gỡ được hợp đồng đã tạo qua REST hay SMS đã bắn thẳng Kafka.

**Đếm test — SAI:** "Tổng fail vẫn là 42 như hôm qua → không hồi quy."
**ĐÚNG:** chạy `comm -13 truoc.txt sau.txt` theo danh tính `Class.method`; kết quả rỗng mới là không hồi quy.

**Message — SAI:** `assertThat(ex.getMessage()).isEqualTo("Đơn hàng không thể huỷ")` ở module application (nhận tên KEY → đỏ nền).
**ĐÚNG:** assert theo mã lỗi / loại exception.

## Khi nào tự động CHẶN (block)

Không được mở PR nếu:

- [ ] Có test không assert (C1) hoặc assert tautology (C2)
- [ ] Có test phụ thuộc thứ tự chạy (C4)
- [ ] Có dữ liệu cá nhân thật (C6)
- [ ] Code main bị sửa chỉ để test pass (C7)
- [ ] `ArchitectureTest` có **hơn 3** vi phạm `controller_should_go_through_facade`, hoặc đỏ ở rule khác
- [ ] `comm -13` giữa danh sách fail trước/sau **không rỗng**
- [ ] Coverage dưới ngưỡng dự án (câu 17)
- [ ] Có AC không test nào bao phủ (câu 16)

## Ngưỡng gợi ý cho dự án

**Ngưỡng mục tiêu (TSD purchase `07_testing-design.md` §9):**

| Module | LINE | BRANCH |
|---|:-:|:-:|
| `domain/` | ≥ 90% | ≥ 80% |
| `application/` | ≥ 80% | ≥ 80% |
| `adapter/` | ≥ 70% | ≥ 70% |
| Toàn service | ≥ 80% | ≥ 80% |

Gate CI đặc tả: GitLab stage `test` chạy `./mvnw verify`, fail MR nếu coverage giảm > 1% so với nhánh base. **Hiện trạng:** JaCoCo **chưa có trong pom** — đang đo ad-hoc:

```bash
cd <service> && mvn -pl domain,application \
    org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent test \
    org.jacoco:jacoco-maven-plugin:0.8.12:report
# → <module>/target/site/jacoco/index.html (CSV: jacoco.csv)
```
(Đợt 2026-06-25 dùng JaCoCo 0.8.13 vì 0.8.12 không instrument được trên JDK 25.)

**Coverage thực tế (JaCoCo 2026-06-25, 12 service, chỉ domain + application):**

| Chỉ số | Giá trị |
|---|---|
| Test class / test method | 474 / 2.673 |
| LINE | **91,6%** (từ 67,1%) |
| BRANCH | **74,3%** (từ ≈ 50%) |
| Service đạt LINE ≥ 85% | 12/12 (thấp nhất 87,6%) |
| BRANCH thấp nhất | 60,2% (product), 64,9% (cms) |
| `ins-common` | 38,4% LINE (chưa đo lại) |
| Tầng adapter | **chưa đo** — coverage toàn service thực tế **thấp hơn** các số trên |

→ LINE đạt ngưỡng; **BRANCH chưa đạt 80%** theo TSD; adapter chưa có số. Không được báo "coverage đạt" khi chỉ đo 2/3 module.

## Nguồn tham chiếu

- `Architecture.md` §2.7 (Testing), §1.4 (dependency rule)
- `LESSONS.md` §5.1–§5.4, §1
- Báo cáo Unit Test & Coverage (2026-06-25) §1, §3, §5, §6
- Báo cáo Unit Test (2026-06-21) — mục "Công cụ đo coverage"
- TSD purchase-service `07_testing-design.md` §1, §2.6, §5, §8, §9, §10
- Template gốc: `templates/rules/test-rules.md`

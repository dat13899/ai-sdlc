// Trung tâm Trợ giúp & Tài liệu Tương tác (Interactive Help & Knowledge Hub) AI-SDLC
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Input,
  List,
  Radio,
  Row,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BookOutlined,
  BugOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  KeyOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useProcess } from '../api';
import { GLOSSARY, PageHeader } from '../components';
import { useTheme } from '../ThemeContext';
import { fold, GATE_COLOR, STEP_COLOR } from '../util';

// 8 Vai trò chuẩn và chi tiết trách nhiệm
const ROLES_INFO: Record<
  string,
  {
    title: string;
    badgeColor: string;
    summary: string;
    steps: string[];
    gates: string[];
    tasks: string[];
    aiGuidance: string;
  }
> = {
  PM: {
    title: 'Project Manager (Quản lý Dự án)',
    badgeColor: 'blue',
    summary: 'Chịu trách nhiệm khởi tạo, phân bổ nguồn lực, theo dõi tiến độ tổng thể, quản trị rủi ro và điều phối quy trình SDLC.',
    steps: ['B1', 'B2', 'B5', 'B13', 'B14'],
    gates: ['g1', 'g5', 'g6'],
    tasks: [
      'Khởi tạo dự án, thiết lập thành viên & ma trận vai trò ở tab Nền tảng (B1–B2).',
      'Cấu hình bộ công cụ AI được phép dùng và phân loại cấp độ dữ liệu (Public, Internal, Confidential).',
      'Theo dõi tiến độ, kiểm soát điểm nghẽn qua sơ đồ Gantt và Báo cáo DORA.',
      'Ký Gate 1 (Yêu cầu) cùng PO và Gate 5 (Quyết định phát hành Go/No-Go).',
      'Xử lý thông báo khi có Gate bị đánh "Không đạt" hoặc có Bug S1/S2 cản trở.',
    ],
    aiGuidance: 'Giám sát việc tuân thủ công cụ AI; không cho phép dùng công cụ ngoài danh mục đã được phê duyệt.',
  },
  PO: {
    title: 'Product Owner / Sponsor / Khách hàng',
    badgeColor: 'cyan',
    summary: 'Đại diện cho tiếng nói nghiệp vụ, xác định mục tiêu sản phẩm, thứ tự ưu tiên tính năng và nghiệm thu sản phẩm cuối cùng.',
    steps: ['B1', 'B3', 'B12'],
    gates: ['g1', 'g5'],
    tasks: [
      'Cung cấp bối cảnh kinh doanh, mục tiêu và phạm vi cho Project Charter (B1).',
      'Tham gia làm rõ yêu cầu nghiệp vụ, xem xét và chốt tài liệu BRD ở bước B3.',
      'Ký Gate 1 (Khóa yêu cầu): Xác nhận phạm vi và bộ tiêu chí chấp nhận (Acceptance Criteria).',
      'Phê duyệt các Change Request (CR theo mẫu PL2) nếu có thay đổi yêu cầu phát sinh.',
      'Tham gia nghiệm thu UAT ở B12 và đồng ký Gate 5 (Go/No-Go) trước khi đưa lên production.',
    ],
    aiGuidance: 'Đánh giá kỹ các tài liệu BRD hoặc User Story do AI phác thảo để đảm bảo không bị suy diễn sai nghiệp vụ.',
  },
  BA: {
    title: 'Business Analyst (Chuyên viên Phân tích Nghiệp vụ)',
    badgeColor: 'purple',
    summary: 'Cầu nối giữa nghiệp vụ và kỹ thuật, chuyển hóa yêu cầu của người dùng thành tài liệu đặc tả chi tiết, kiểm thử được.',
    steps: ['B3', 'B4', 'B5', 'B11'],
    gates: [],
    tasks: [
      'Ghi nhận yêu cầu từ các buổi phỏng vấn, tạo tài liệu BRD theo mẫu chuẩn (B3).',
      'Mô hình hóa quy trình nghiệp vụ BPMN 2.0 (vẽ luồng bằng cú pháp Mermaid).',
      'Viết tài liệu đặc tả kỹ thuật spec.md (B4) gồm FR, NFR, Business Rules và Edge Cases.',
      'Phân rã User Story theo chuẩn INVEST, định nghĩa Acceptance Criteria dạng Gherkin.',
      'Phối hợp với QA xây dựng ma trận truy vết yêu cầu (RTM) ở bước B11.',
    ],
    aiGuidance: 'Được dùng AI để tóm tắt transcript họp, chuyển BRD sang spec.md. Tuyệt đối không để AI tự bịa số liệu SLA/NFR.',
  },
  TechLead: {
    title: 'Tech Lead / Solution Architect',
    badgeColor: 'gold',
    summary: 'Chịu trách nhiệm kiến trúc kỹ thuật, chuẩn hóa công nghệ, thiết kế API, chất lượng mã nguồn và an ninh hệ thống.',
    steps: ['B2', 'B6', 'B7', 'B8', 'B10', 'B14'],
    gates: ['g2', 'g3', 'g4c'],
    tasks: [
      'Xây dựng tệp quy ước kỹ thuật constitution.md và skill.md cho toàn dự án (B2).',
      'Ra quyết định kiến trúc ADR theo mẫu MADR, phân tích tối thiểu 3 phương án (B6).',
      'Thiết kế OpenAPI 3.x, schema CSDL, data model và ký Gate 2 (Phê duyệt kiến trúc).',
      'Phân rã kỹ thuật thành các task lập trình độc lập (B8).',
      'Thực hiện Code Review tầng 2 (Human Review) ở B10; ký Gate 3 và Gate 4c (An ninh & Hiệu năng).',
    ],
    aiGuidance: 'Duyệt các nhật ký AI do Dev ghi lại; rà soát kỹ code do AI sinh ra để phát hiện lỗi logic tiềm ẩn và lỗ hổng OWASP.',
  },
  Dev: {
    title: 'Developer (Lập trình viên)',
    badgeColor: 'geekblue',
    summary: 'Hiện thực hóa các tính năng theo spec, áp dụng TDD, viết unit test toàn diện và tự động hóa kiểm thử mã nguồn.',
    steps: ['B8', 'B9', 'B10'],
    gates: ['g3'],
    tasks: [
      'Nghiên cứu spec.md và plan.md trước khi bắt đầu viết code (B8).',
      'Viết mã nguồn tuân thủ coding conventions, đặt tên biến rõ ràng, xử lý trường hợp biên (B9).',
      'Viết unit test đầy đủ cho happy path, error case và boundary values; đảm bảo độ bao phủ test thực chất.',
      'Tuân thủ quy ước đặt tên commit (Conventional Commits: feat, fix, chore, refactor...).',
      'Ghi nhật ký AI bắt buộc khi dùng AI hỗ trợ code/test; nhờ đồng nghiệp duyệt chéo (4 mắt).',
      'Tham gia Code Review tầng 1 (AI review) và tạo Pull Request cho Tech Lead review (B10).',
    ],
    aiGuidance: 'Ghi nhật ký trung thực mọi công cụ AI sử dụng; không paste trực tiếp secret/API key/dữ liệu thật vào prompt.',
  },
  Test: {
    title: 'Tester / QA / Test Lead',
    badgeColor: 'green',
    summary: 'Bảo đảm chất lượng sản phẩm qua các vòng kiểm thử chức năng, phi chức năng, hồi quy và xác thực tiêu chí chấp nhận.',
    steps: ['B11', 'B12'],
    gates: ['g4a'],
    tasks: [
      'Xây dựng Kế hoạch Kiểm thử (Test Plan) và thiết kế Test Case từ Acceptance Criteria (B11).',
      'Lập Ma trận Truy vết Yêu cầu (RTM) để đảm bảo 100% AC có Test Case tương ứng.',
      'Thực hiện kiểm thử chức năng, kiểm thử tích hợp hệ thống (SIT), kiểm thử hồi quy (Regression) (B12).',
      'Quản lý vòng đời Bug trên CMS: tạo bug, phân loại mức độ nghiêm trọng (S1–S4), retest khi Dev sửa xong.',
      'Ký Gate 4a (Sẵn sàng UAT) khi toàn bộ SIT xanh và không còn bug blocker S1/S2 mở.',
    ],
    aiGuidance: 'Sử dụng prompt mẫu P-B11-01 để sinh test case tự động từ AC; kiểm tra kỹ tính khả thi trước khi chạy test.',
  },
  Security: {
    title: 'Security Engineer (Kỹ sư An toàn Thông tin)',
    badgeColor: 'red',
    summary: 'Bảo vệ hệ thống khỏi các lỗ hổng bảo mật, kiểm soát rủi ro dữ liệu và đảm bảo tuân thủ tiêu chuẩn an ninh mạng.',
    steps: ['B2', 'B6', 'B7', 'B10', 'B12'],
    gates: ['g4b'],
    tasks: [
      'Thiết lập chính sách phân loại dữ liệu và quy định công cụ AI an toàn (B2).',
      'Xây dựng mô hình hóa mối đe dọa (Threat Model theo STRIDE) cho kiến trúc mới (B6).',
      'Kiểm tra thiết kế bảo mật cho API (Authentication, Authorization, Rate Limiting, CORS) ở B7.',
      'Rà soát quét mã tĩnh (SAST), kiểm tra phụ thuộc mã nguồn mở (SCA/CVE) ở B10 & B12.',
      'Thực hiện kiểm thử xâm nhập (Penetration Testing) và ký Gate 4b (An toàn thông tin).',
    ],
    aiGuidance: 'Giám sát việc áp dụng AI bảo mật; kiểm tra xem có code AI nào tạo ra backdoor hoặc cấu hình lỏng lẻo không.',
  },
  DevOps: {
    title: 'DevOps / SRE / Release Engineer',
    badgeColor: 'volcano',
    summary: 'Vận hành hạ tầng, tự động hóa CI/CD, chuẩn bị kịch bản triển khai, giám sát hệ thống và khắc phục sự cố sau phát hành.',
    steps: ['B2', 'B13', 'B14'],
    gates: ['g6'],
    tasks: [
      'Thiết lập pipeline CI/CD, môi trường Dev, Staging và Production (B2).',
      'Soạn thảo kịch bản triển khai (Runbook) và phương án hoàn nguyên (Rollback plan) ở B13.',
      'Thực hiện triển khai lên Production theo lệnh phê duyệt Go từ Gate 5.',
      'Thiết lập dashboard giám sát (Prometheus, Grafana, Log alert) cho dịch vụ mới (B14).',
      'Theo dõi các chỉ số DORA sau phát hành; chủ trì họp phân tích sự cố (Postmortem) nếu có lỗi phát sinh.',
      'Ký Gate 6 (Đóng phát hành): Hoàn tất chu kỳ phát hành sản phẩm an toàn.',
    ],
    aiGuidance: 'Dùng AI hỗ trợ viết kịch bản script CI/CD, phân tích log lỗi nhưng phải kiểm tra cú pháp chạy thử trên sandbox.',
  },
};

// Ma trận RACI cho 14 bước
const RACI_MATRIX = [
  { step: 'B1', name: 'Project Charter', r: 'PM', a: 'PM', c: 'PO, TechLead', i: 'Toàn đội' },
  { step: 'B2', name: 'Constitution & AI Setup', r: 'TechLead, Security', a: 'PM', c: 'DevOps', i: 'Dev, BA' },
  { step: 'B3', name: 'Yêu cầu & BRD', r: 'BA', a: 'BA', c: 'PO, TechLead', i: 'PM, Dev' },
  { step: 'B4', name: 'Đặc tả spec.md', r: 'BA', a: 'TechLead', c: 'Dev, Test', i: 'PM' },
  { step: 'B5', name: 'Kế hoạch plan.md', r: 'TechLead', a: 'PM', c: 'BA, Dev', i: 'PO' },
  { step: 'B6', name: 'Kiến trúc ADR & Threat Model', r: 'TechLead', a: 'TechLead', c: 'Security, Dev', i: 'PM' },
  { step: 'B7', name: 'Thiết kế API & CSDL', r: 'Dev, TechLead', a: 'TechLead', c: 'Security, Test', i: 'BA' },
  { step: 'B8', name: 'Task Breakdown', r: 'Dev', a: 'TechLead', c: 'PM', i: 'Test' },
  { step: 'B9', name: 'Lập trình & Unit Test', r: 'Dev', a: 'Dev', c: 'TechLead', i: 'Test' },
  { step: 'B10', name: 'Code Review 2 tầng', r: 'TechLead, Dev', a: 'TechLead', c: 'Security', i: 'PM' },
  { step: 'B11', name: 'Test Design & RTM', r: 'Test', a: 'Test', c: 'BA, Dev', i: 'PM' },
  { step: 'B12', name: 'SIT, UAT & An ninh', r: 'Test, Security', a: 'Security, Test', c: 'TechLead', i: 'PO, PM' },
  { step: 'B13', name: 'Triển khai & Runbook', r: 'DevOps', a: 'PM', c: 'TechLead', i: 'Toàn đội' },
  { step: 'B14', name: 'Vận hành & Postmortem', r: 'DevOps, TechLead', a: 'PM', c: 'Dev, Test', i: 'PO' },
];

export default function Help() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const proc = useProcess().data;

  const [activeTab, setActiveTab] = useState('quick');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('PM');

  // Interactive Decision Tree State
  const [wSmall, setWSmall] = useState<boolean | null>(null);
  const [wSensitive, setWSensitive] = useState<boolean | null>(null);
  const [wModel, setWModel] = useState<boolean | null>(null);
  const [wAfterG1, setWAfterG1] = useState<boolean | null>(null);

  const resetWizard = () => {
    setWSmall(null);
    setWSensitive(null);
    setWModel(null);
    setWAfterG1(null);
  };

  const wizardResult = useMemo(() => {
    if (wSmall === null || wSensitive === null || wModel === null || wAfterG1 === null) return null;
    if (wSmall && !wSensitive && !wModel && !wAfterG1) {
      return {
        kind: 'fast',
        title: 'Fast-track (Luồng rút gọn)',
        color: '#52c41a',
        badge: 'Rút gọn B4–B7',
        desc: 'Công việc nhỏ dưới 0.5 ngày, không đổi CSDL và không chạm thanh toán/phân quyền. Mô tả thẳng giải pháp vào ticket, được bỏ qua spec.md, plan.md, ADR. Vẫn bắt buộc Unit Test + Review 2 tầng!',
      };
    }
    if (wAfterG1) {
      return {
        kind: 'cr',
        title: 'Change Request (Phụ lục PL2)',
        color: '#faad14',
        badge: 'Cần mã CR',
        desc: 'Yêu cầu phát sinh hoặc thay đổi sau khi đã ký Gate 1. Bắt buộc có mã CR (ví dụ: CR-001) và ghi rõ lý do thay đổi. Phải được PO/PM xem xét đánh giá tác động trước khi thực hiện.',
      };
    }
    return {
      kind: 'full',
      title: 'Hạng mục Tính năng Đầy đủ (Full Feature)',
      color: '#1677ff',
      badge: 'B1–B14 đầy đủ',
      desc: 'Tính năng tiêu chuẩn của dự án. Thực hiện đầy đủ các bước từ B3 (Yêu cầu) đến B14 (Vận hành), đi qua toàn bộ các cổng Quality Gates theo quy trình.',
    };
  }, [wSmall, wSensitive, wModel, wAfterG1]);

  if (!proc) return null;

  const roleLabel = (k: string) => proc.roles.find((r) => r.key === k)?.label || k;

  const term = fold(search.trim());

  return (
    <>
      <PageHeader
        title="Trung tâm Trợ giúp & Tài liệu AI-SDLC"
        crumbs={[{ title: 'Dự án', to: '/' }, { title: 'Trợ giúp' }]}
        extra={
          <Input.Search
            placeholder="Tìm kiếm hướng dẫn, vai trò, bước, gate, phím tắt..."
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 340 }}
          />
        }
      />

      {/* Banner thông báo quy trình chính */}
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="Hệ thống Quản trị Vòng đời Phát triển Phần mềm Tăng tốc bởi Trí tuệ Nhân tạo (AI-SDLC CMS)"
        description={
          <div>
            CMS này theo dõi việc áp dụng quy trình AI-SDLC vào từng dự án và từng hạng mục tính năng qua 14 bước và 8 cổng kiểm soát chất lượng (Quality Gates).
            Tài liệu quy trình chuẩn và biểu mẫu gốc tham khảo tại{' '}
            <a href={proc.site} target="_blank" rel="noopener noreferrer">
              Cổng quy trình AI-SDLC (ai.btdat.io.vn) ↗
            </a>
            .
          </div>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'quick',
            label: (
              <Space size={6}>
                <RocketOutlined />
                <span>Bắt đầu nhanh</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="4 bước làm việc mỗi ngày trên CMS">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} lg={6}>
                      <Card
                        size="small"
                        type="inner"
                        title={<Space><Badge count={1} style={{ backgroundColor: '#1677ff' }} /><b>Mở Việc của tôi</b></Space>}
                        style={{ height: '100%' }}
                      >
                        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                          Trang đầu tiên nên mở mỗi sáng: kiểm tra các bước được phân công, các gate đang chờ bạn ký và các mục AI chờ bạn duyệt.
                        </Typography.Paragraph>
                        <Button type="link" size="small" onClick={() => navigate('/tasks')} style={{ padding: 0 }}>
                          Đến Việc của tôi →
                        </Button>
                      </Card>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Card
                        size="small"
                        type="inner"
                        title={<Space><Badge count={2} style={{ backgroundColor: '#52c41a' }} /><b>Chọn Hạng mục</b></Space>}
                        style={{ height: '100%' }}
                      >
                        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                          Mỗi tính năng là một hạng mục riêng. Xem Thẻ Bước hiện tại ở đầu trang để biết tiến độ dự án đang ở đâu và có bị kẹt Gate không.
                        </Typography.Paragraph>
                        <Button type="link" size="small" onClick={() => navigate('/')} style={{ padding: 0 }}>
                          Đến Dashboard →
                        </Button>
                      </Card>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Card
                        size="small"
                        type="inner"
                        title={<Space><Badge count={3} style={{ backgroundColor: '#fa8c16' }} /><b>Làm & Đính kèm</b></Space>}
                        style={{ height: '100%' }}
                      >
                        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                          Mở thẻ bước, tick checklist việc đã làm, kéo thả tài liệu đính kèm (Word, PDF, Excel, Ảnh, MD ≤ 30MB), chuyển trạng thái sang Xong.
                        </Typography.Paragraph>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          (Hỗ trợ xem trực tiếp không cần tải)
                        </Typography.Text>
                      </Card>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Card
                        size="small"
                        type="inner"
                        title={<Space><Badge count={4} style={{ backgroundColor: '#722ed1' }} /><b>Dùng AI & Ký Gate</b></Space>}
                        style={{ height: '100%' }}
                      >
                        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                          Ghi nhật ký khi dùng AI và nhờ đồng nghiệp duyệt chéo (4 mắt). Người đúng vai trò sẽ ký duyệt Gate để chuyển sang bước kế tiếp.
                        </Typography.Paragraph>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          (Nhận thông báo qua Telegram)
                        </Typography.Text>
                      </Card>
                    </Col>
                  </Row>
                </Card>

                {/* Phím tắt thao tác nhanh */}
                <Card title="Phím tắt & Mẹo thao tác nhanh">
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Space align="start">
                        <Tag color="blue" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Ctrl + K / Cmd + K</Tag>
                        <div>
                          <Typography.Text strong>Command Palette</Typography.Text>
                          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                            Mở trung tâm lệnh nhanh: tìm dự án, nhảy đến bước, đổi giao diện sáng/tối.
                          </Typography.Paragraph>
                        </div>
                      </Space>
                    </Col>

                    <Col xs={24} md={8}>
                      <Space align="start">
                        <Tag color="green" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Ctrl + S</Tag>
                        <div>
                          <Typography.Text strong>Lưu nhanh Markdown</Typography.Text>
                          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                            Lưu ngay bản sửa đổi mới trong trình soạn thảo Markdown mà không cần bấm chuột.
                          </Typography.Paragraph>
                        </div>
                      </Space>
                    </Col>

                    <Col xs={24} md={8}>
                      <Space align="start">
                        <Tag color="purple" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Drag & Drop</Tag>
                        <div>
                          <Typography.Text strong>Kéo thả tệp tin</Typography.Text>
                          <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                            Kéo trực tiếp file Word, PDF, Excel, Ảnh vào thẻ bước để tự động upload tức thì.
                          </Typography.Paragraph>
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },

          {
            key: 'roles',
            label: (
              <Space size={6}>
                <TeamOutlined />
                <span>8 Vai trò & RACI</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Bộ chọn vai trò tương tác */}
                <Card title="Chọn vai trò để xem hướng dẫn chi tiết">
                  <Radio.Group
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{ marginBottom: 16 }}
                    buttonStyle="solid"
                  >
                    {Object.keys(ROLES_INFO).map((rKey) => (
                      <Radio.Button key={rKey} value={rKey}>
                        {rKey}
                      </Radio.Button>
                    ))}
                  </Radio.Group>

                  {/* Chi tiết vai trò đang chọn */}
                  {ROLES_INFO[selectedRole] && (
                    <Card
                      type="inner"
                      title={
                        <Space>
                          <Tag color={ROLES_INFO[selectedRole].badgeColor} style={{ fontSize: 14 }}>
                            {selectedRole}
                          </Tag>
                          <Typography.Text strong>{ROLES_INFO[selectedRole].title}</Typography.Text>
                        </Space>
                      }
                    >
                      <Typography.Paragraph>{ROLES_INFO[selectedRole].summary}</Typography.Paragraph>

                      <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Các bước phụ trách chính">
                          <Space wrap>
                            {ROLES_INFO[selectedRole].steps.map((s) => (
                              <Tag key={s} color="blue">{s}</Tag>
                            ))}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Quyền ký duyệt Gate">
                          <Space wrap>
                            {ROLES_INFO[selectedRole].gates.length > 0 ? (
                              ROLES_INFO[selectedRole].gates.map((g) => (
                                <Tag key={g} color="orange">{g.toUpperCase()}</Tag>
                              ))
                            ) : (
                              <Typography.Text type="secondary">Không trực tiếp ký gate (Cung cấp đầu vào)</Typography.Text>
                            )}
                          </Space>
                        </Descriptions.Item>
                      </Descriptions>

                      <Typography.Title level={5}>Nhiệm vụ & Trách nhiệm cụ thể:</Typography.Title>
                      <ul style={{ paddingLeft: 20 }}>
                        {ROLES_INFO[selectedRole].tasks.map((t, idx) => (
                          <li key={idx} style={{ marginBottom: 6 }}>{t}</li>
                        ))}
                      </ul>

                      <Alert
                        type="warning"
                        showIcon
                        icon={<RobotOutlined />}
                        message="Lưu ý khi sử dụng công cụ AI cho vai trò này:"
                        description={ROLES_INFO[selectedRole].aiGuidance}
                        style={{ marginTop: 12 }}
                      />
                    </Card>
                  )}
                </Card>

                {/* Bảng Ma trận RACI */}
                <Card title="Ma trận Phân nhiệm RACI (14 bước quy trình)">
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                    <b>R (Responsible)</b>: Người trực tiếp làm · <b>A (Accountable)</b>: Người chịu trách nhiệm phê duyệt · <b>C (Consulted)</b>: Người được tham vấn · <b>I (Informed)</b>: Người được thông báo
                  </Typography.Paragraph>
                  <Table
                    size="small"
                    rowKey="step"
                    dataSource={RACI_MATRIX}
                    pagination={false}
                    scroll={{ x: 700 }}
                    columns={[
                      { title: 'Bước', dataIndex: 'step', width: 70, render: (v) => <Tag color="blue">{v}</Tag> },
                      { title: 'Tên bước', dataIndex: 'name', width: 200, render: (v) => <b>{v}</b> },
                      { title: 'Responsible (R)', dataIndex: 'r', render: (v) => <Tag color="green">{v}</Tag> },
                      { title: 'Accountable (A)', dataIndex: 'a', render: (v) => <Tag color="orange">{v}</Tag> },
                      { title: 'Consulted (C)', dataIndex: 'c' },
                      { title: 'Informed (I)', dataIndex: 'i' },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          {
            key: 'steps',
            label: (
              <Space size={6}>
                <ApartmentOutlined />
                <span>14 Bước & 8 Gates</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Alert
                  type="info"
                  showIcon
                  message="Mô hình 5 giai đoạn khép kín từ Khởi tạo đến Vận hành"
                  description="Mỗi hạng mục bắt buộc hoàn thành các bước tuần tự và chỉ có thể chuyển giai đoạn khi Quality Gate tương ứng được ký 'Đạt'."
                />

                <Collapse
                  defaultActiveKey={['GĐ 1', 'GĐ 2', 'GĐ 3']}
                  items={proc.phases.map((ph) => {
                    const phaseSteps = ph.steps.map((c) => proc.steps.find((s) => s.code === c)!);
                    return {
                      key: ph.id,
                      label: (
                        <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 16 }}>
                          <Space size={8}>
                            <Tag color="blue" style={{ fontSize: 13 }}>{ph.id}</Tag>
                            <Typography.Text strong style={{ fontSize: 15 }}>{ph.name}</Typography.Text>
                          </Space>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {phaseSteps.length} bước: {ph.steps.join(' · ')}
                          </Typography.Text>
                        </Flex>
                      ),
                      children: (
                        <Table
                          size="small"
                          rowKey="code"
                          pagination={false}
                          scroll={{ x: 800 }}
                          dataSource={phaseSteps}
                          columns={[
                            {
                              title: 'Mã bước',
                              dataIndex: 'code',
                              width: 90,
                              render: (code) => <Tag color="blue" style={{ fontWeight: 600 }}>{code}</Tag>,
                            },
                            {
                              title: 'Tên bước & Mục tiêu',
                              key: 'info',
                              render: (_, s) => (
                                <Space direction="vertical" size={2}>
                                  <Typography.Text strong>{s.name}</Typography.Text>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    Đầu ra: {s.out}
                                  </Typography.Text>
                                </Space>
                              ),
                            },
                            {
                              title: 'Biểu mẫu chuẩn',
                              key: 'tpl',
                              width: 220,
                              render: (_, s) => (
                                <Space direction="vertical" size={2}>
                                  {s.templates.map((t) => (
                                    <Tag key={t.id} color="default" style={{ fontSize: 11 }}>
                                      {t.required ? '★ ' : ''}{t.title}
                                    </Tag>
                                  ))}
                                </Space>
                              ),
                            },
                            {
                              title: 'Quality Gate & Điều kiện ký',
                              key: 'gate',
                              width: 280,
                              render: (_, s) => {
                                const gates = proc.gates.filter((g) => g.at === s.code);
                                if (!gates.length) return <Typography.Text type="secondary">—</Typography.Text>;
                                return (
                                  <Space direction="vertical" size={4}>
                                    {gates.map((g) => (
                                      <div key={g.key} style={{ padding: '4px 6px', background: isDark ? '#1a1a1a' : '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
                                        <Space size={4} wrap>
                                          <Tag color="orange" style={{ fontWeight: 600 }}>{g.id}</Tag>
                                          <Typography.Text strong style={{ fontSize: 12 }}>
                                            {g.roles.length ? g.roles.map(roleLabel).join(' / ') : 'Tất cả'}
                                          </Typography.Text>
                                        </Space>
                                        <div style={{ fontSize: 11, color: isDark ? '#d4d4d4' : '#595959', marginTop: 2 }}>
                                          {g.check}
                                        </div>
                                      </div>
                                    ))}
                                  </Space>
                                );
                              },
                            },
                          ]}
                        />
                      ),
                    };
                  })}
                />
              </div>
            ),
          },

          {
            key: 'features',
            label: (
              <Space size={6}>
                <AppstoreOutlined />
                <span>Cẩm nang Tính năng CMS</span>
              </Space>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card
                    title={<Space><ThunderboltOutlined style={{ color: '#1677ff' }} /><b>Command Palette (Ctrl + K)</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Thanh điều hướng tập trung toàn hệ thống. Mở nhanh bất kỳ lúc nào bằng tổ hợp phím <code>Ctrl + K</code> (Windows) hoặc <code>Cmd + K</code> (macOS), hoặc gõ phím <code>/</code>.
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li>Tìm kiếm tức thì theo tên dự án, mã dự án hoặc tên bước.</li>
                      <li>Xem và sao chép nhanh 11 prompt mẫu chuẩn (P-B3-01, P-B6-01...).</li>
                      <li>Chuyển đổi giao diện Sáng / Tối trực tiếp.</li>
                      <li>Điều hướng nhanh tới Việc của tôi, Báo cáo DORA, Quản trị.</li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<Space><CalendarOutlined style={{ color: '#52c41a' }} /><b>Interactive Timeline Gantt</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Sơ đồ tiến độ trực quan hiển thị trên từng dự án:
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li>Biểu diễn thanh tiến độ các bước theo ngày bắt đầu và ngày kết thúc thực tế.</li>
                      <li>Cắm cờ cột mốc Quality Gates (G1–G6) để kiểm soát thời điểm thẩm định.</li>
                      <li>Tô màu theo trạng thái: Xanh lá (Hoàn thành), Vàng (Đang làm), Xám (Chưa làm), Tím (Bỏ qua).</li>
                      <li>Cảnh báo trực quan bước bị quá hạn (overdue).</li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<Space><BarChartOutlined style={{ color: '#722ed1' }} /><b>Báo cáo DORA & Cycle Time</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Theo dõi hiệu năng kỹ thuật theo tiêu chuẩn DevOps Research and Assessment (DORA):
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li><b>Deployment Frequency</b>: Tần suất triển khai thành công lên production.</li>
                      <li><b>Lead Time for Changes</b>: Thời gian từ khi bắt đầu yêu cầu đến khi release.</li>
                      <li><b>Change Failure Rate</b>: Tỷ lệ triển khai gặp lỗi cần sửa hoặc rollback.</li>
                      <li><b>Time to Restore Service</b>: Thời gian khôi phục hệ thống khi có sự cố.</li>
                      <li>Phân tích thời gian chu kỳ qua 5 giai đoạn, phát hiện điểm nghẽn và đo lường % tăng tốc từ AI.</li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<Space><EyeOutlined style={{ color: '#fa8c16' }} /><b>Bộ xem Tài liệu Đa Định Dạng (In-App)</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Xem và tương tác trực tiếp với tài liệu ngay trong CMS mà không cần tải về máy:
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li><b>PDF</b>: Trình xem nhúng browser canvas kèm thanh công cụ in ấn, mở tab mới, tải về.</li>
                      <li><b>Excel/CSV</b>: Hỗ trợ nhiều Sheet, hiển thị ô lưới (Grid A, B, C...) kèm thanh tìm kiếm ô tức thì.</li>
                      <li><b>Word (.docx)</b>: Render văn bản dạng trang in A4 giữ nguyên bảng biểu, ảnh nhúng, hỗ trợ 1-click chuyển Markdown.</li>
                      <li><b>Hình ảnh</b>: Lightbox thu phóng, xoay 90°, xem tỉ lệ 1:1, kiểm tra kích thước thực.</li>
                      <li><b>Markdown</b>: Soạn thảo Live Preview, phím tắt Ctrl+S, Visual Diff so sánh phiên bản cũ.</li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<Space><BugOutlined style={{ color: '#ff4d4f' }} /><b>Quản lý Bug & Chặn Gate</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Quy trình ghi nhận và xử lý lỗi kỹ thuật trong quá trình kiểm thử:
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li>Phân loại 4 mức độ: <b>S1 (Blocker)</b>, <b>S2 (Critical)</b>, <b>S3 (Major)</b>, <b>S4 (Minor)</b>.</li>
                      <li><b>Quy tắc nghiêm ngặt</b>: Nếu còn Bug S1 hoặc S2 chưa đóng (chưa closed), hệ thống sẽ <b>tự động khóa việc ký Đạt tại Quality Gate tương ứng</b>.</li>
                      <li>Theo dõi lịch sử sửa lỗi và gán người chịu trách nhiệm trực tiếp.</li>
                    </ul>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={<Space><SendOutlined style={{ color: '#13c2c2' }} /><b>Thông báo Telegram Bot</b></Space>}
                    style={{ height: '100%' }}
                  >
                    <Typography.Paragraph>
                      Kết nối bot Telegram để nhận tin nhắn công việc tự động:
                    </Typography.Paragraph>
                    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
                      <li>Thông báo ngay khi có Gate mới cần bạn ký duyệt.</li>
                      <li>Cảnh báo khi Gate bị đánh "Không đạt" kèm lý do.</li>
                      <li>Báo động tức thì khi có Bug mức S1/S2 được tạo.</li>
                      <li>Nhắc việc khi bạn được phân công phụ trách một bước mới.</li>
                      <li>Liên kết dễ dàng trong trang <i>Tài khoản của tôi (/me)</i> qua lệnh <code>/start</code>.</li>
                    </ul>
                  </Card>
                </Col>
              </Row>
            ),
          },

          {
            key: 'wizard',
            label: (
              <Space size={6}>
                <BulbOutlined />
                <span>Cây quyết định Phân loại Hạng mục</span>
              </Space>
            ),
            children: (
              <Card title="Công cụ Hướng dẫn Tương tác: Tính năng của tôi thuộc loại nào?">
                <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
                  Trả lời nhanh các câu hỏi dưới đây để hệ thống tự động xác định bạn nên tạo hạng mục dưới dạng: <b>Fast-track</b>, <b>Change Request (PL2)</b>, hay <b>Tính năng Đầy đủ</b>.
                </Typography.Paragraph>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
                  <Card size="small" type="inner">
                    <Flex justify="space-between" align="center" wrap gap={8}>
                      <Typography.Text strong>1. Thời gian ước tính thực hiện có dưới 0,5 ngày công (≤ 4 giờ làm việc)?</Typography.Text>
                      <Radio.Group value={wSmall} onChange={(e) => setWSmall(e.target.value)}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                      </Radio.Group>
                    </Flex>
                  </Card>

                  <Card size="small" type="inner">
                    <Flex justify="space-between" align="center" wrap gap={8}>
                      <Typography.Text strong>2. Tính năng có chạm vào logic Phân quyền (RBAC) hoặc Quy trình Thanh toán không?</Typography.Text>
                      <Radio.Group value={wSensitive} onChange={(e) => setWSensitive(e.target.value)}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                      </Radio.Group>
                    </Flex>
                  </Card>

                  <Card size="small" type="inner">
                    <Flex justify="space-between" align="center" wrap gap={8}>
                      <Typography.Text strong>3. Tính năng có làm thay đổi cấu trúc bảng CSDL (Data Model Schema) không?</Typography.Text>
                      <Radio.Group value={wModel} onChange={(e) => setWModel(e.target.value)}>
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                      </Radio.Group>
                    </Flex>
                  </Card>

                  <Card size="small" type="inner">
                    <Flex justify="space-between" align="center" wrap gap={8}>
                      <Typography.Text strong>4. Đây là thay đổi yêu cầu phát sinh sau khi đã ký Gate 1 của dự án?</Typography.Text>
                      <Radio.Group value={wAfterG1} onChange={(e) => setWAfterG1(e.target.value)}>
                        <Radio value={true}>Đúng, sau Gate 1</Radio>
                        <Radio value={false}>Không, tính năng mới</Radio>
                      </Radio.Group>
                    </Flex>
                  </Card>

                  {/* Kết quả tư vấn */}
                  {wizardResult ? (
                    <Alert
                      type={wizardResult.kind === 'fast' ? 'success' : wizardResult.kind === 'cr' ? 'warning' : 'info'}
                      showIcon
                      message={
                        <Space size={8}>
                          <span style={{ fontSize: 16, fontWeight: 700 }}>Loại đề xuất: {wizardResult.title}</span>
                          <Tag color={wizardResult.color}>{wizardResult.badge}</Tag>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          <Typography.Paragraph>{wizardResult.desc}</Typography.Paragraph>
                          <Space>
                            <Button type="primary" size="small" onClick={() => navigate('/')}>
                              Đến Dashboard tạo hạng mục này
                            </Button>
                            <Button size="small" onClick={resetWizard}>
                              Làm lại khảo sát
                            </Button>
                          </Space>
                        </div>
                      }
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#8c8c8c' }}>
                      Vui lòng chọn câu trả lời cho cả 4 câu hỏi trên để nhận gợi ý phân loại chuẩn xác.
                    </div>
                  )}
                </div>
              </Card>
            ),
          },

          {
            key: 'glossary',
            label: (
              <Space size={6}>
                <BookOutlined />
                <span>Thuật ngữ & Phím tắt</span>
              </Space>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="Bảng Thuật ngữ Chuyên ngành AI-SDLC">
                  <Table
                    size="small"
                    rowKey="k"
                    pagination={false}
                    dataSource={Object.entries(GLOSSARY).map(([k, g]) => ({ k, ...g }))}
                    columns={[
                      {
                        title: 'Thuật ngữ',
                        dataIndex: 'label',
                        width: 220,
                        render: (v) => <b>{v}</b>,
                      },
                      {
                        title: 'Giải nghĩa chi tiết trong quy trình',
                        dataIndex: 'text',
                      },
                    ]}
                  />
                </Card>

                <Card title="Bảng Tra cứu Phím tắt Bàn phím Toàn cục">
                  <Table
                    size="small"
                    rowKey="key"
                    pagination={false}
                    dataSource={[
                      { key: 'Ctrl + K / Cmd + K', scope: 'Toàn hệ thống', action: 'Mở Command Palette' },
                      { key: '/', scope: 'Toàn hệ thống', action: 'Mở nhanh ô tìm kiếm Command Palette' },
                      { key: 'Ctrl + S', scope: 'Trình soạn thảo Markdown', action: 'Lưu phiên bản mới (Revision)' },
                      { key: 'Esc', scope: 'Drawer / Modal / Palette', action: 'Đóng hộp thoại đang mở' },
                      { key: '↑ / ↓', scope: 'Command Palette', action: 'Di chuyển lựa chọn lên / xuống' },
                      { key: 'Enter', scope: 'Command Palette', action: 'Thực thi lệnh hoặc truy cập mục đã chọn' },
                    ]}
                    columns={[
                      {
                        title: 'Phím tắt',
                        dataIndex: 'key',
                        width: 200,
                        render: (v) => <Tag color="blue" style={{ fontFamily: 'var(--font-mono)' }}>{v}</Tag>,
                      },
                      {
                        title: 'Phạm vi áp dụng',
                        dataIndex: 'scope',
                        width: 220,
                      },
                      {
                        title: 'Tác vụ thực hiện',
                        dataIndex: 'action',
                        render: (v) => <b>{v}</b>,
                      },
                    ]}
                  />
                </Card>
              </div>
            ),
          },

          {
            key: 'faqs',
            label: (
              <Space size={6}>
                <QuestionCircleOutlined />
                <span>Câu hỏi thường gặp & Khắc phục sự cố</span>
              </Space>
            ),
            children: (
              <Collapse
                defaultActiveKey={['faq1', 'faq2']}
                items={[
                  {
                    key: 'faq1',
                    label: <b>1. Tại sao nút Ký duyệt Gate bị mờ hoặc báo lỗi "Bạn không có quyền"?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Dự án đang bật chế độ <b>Bắt buộc tuân thủ (Enforced mode)</b>. Trong chế độ này, chỉ tài khoản được gán đúng vai trò (Role) tương ứng trong danh sách Thành viên của dự án mới có quyền ký:
                        </Typography.Paragraph>
                        <ul>
                          <li><b>Gate 1 (Yêu cầu)</b>: Cần vai trò <code>PO</code> hoặc <code>PM</code>.</li>
                          <li><b>Gate 2 (Kiến trúc)</b>: Cần vai trò <code>TechLead</code>.</li>
                          <li><b>Gate 3 (Sẵn sàng test)</b>: Cần vai trò <code>TechLead</code> hoặc <code>Dev</code>.</li>
                          <li><b>Gate 4a (Sẵn sàng UAT)</b>: Cần vai trò <code>Test</code>.</li>
                          <li><b>Gate 4b (An toàn thông tin)</b>: Cần vai trò <code>Security</code>.</li>
                          <li><b>Gate 4c (An ninh & Hiệu năng)</b>: Cần vai trò <code>TechLead</code>.</li>
                          <li><b>Gate 5 (Quyết định Go/No-Go)</b>: Cần vai trò <code>PO</code> hoặc <code>PM</code>.</li>
                          <li><b>Gate 6 (Đóng phát hành)</b>: Cần vai trò <code>PM</code>, <code>DevOps</code> hoặc <code>TechLead</code>.</li>
                        </ul>
                        <Typography.Text type="secondary">
                          👉 Giải pháp: Nhờ PM của dự án thêm tài khoản của bạn vào mục Thành viên (tab Nền tảng) với đúng vai trò cần thiết.
                        </Typography.Text>
                      </div>
                    ),
                  },
                  {
                    key: 'faq2',
                    label: <b>2. Tại sao khi bấm ký Gate thì hệ thống báo "Chặn ký Đạt: còn X mục AI chưa duyệt"?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Hệ thống áp dụng <b>Nguyên tắc Kiểm duyệt 4 Mắt (Four-eyes principle)</b> đối với toàn bộ nội dung do AI sinh ra. Người tạo nhật ký AI không được phép tự duyệt nội dung của chính mình.
                        </Typography.Paragraph>
                        <Typography.Text type="secondary">
                          👉 Giải pháp: Nhờ một thành viên khác trong dự án (Tech Lead hoặc đồng nghiệp cùng nhóm) truy cập vào thẻ bước đó, mở mục "Dùng AI" và bấm nút <b>"Duyệt"</b>. Khi không còn mục AI nào ở trạng thái "Chờ duyệt", bạn sẽ ký được Gate.
                        </Typography.Text>
                      </div>
                    ),
                  },
                  {
                    key: 'faq3',
                    label: <b>3. Tại sao tôi không thể tạo thêm Hạng mục mới cho dự án?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Dự án chưa hoàn thành bước khởi tạo nền tảng. Trước khi tạo hạng mục tính năng, dự án bắt buộc phải:
                        </Typography.Paragraph>
                        <ul>
                          <li>Khai báo danh mục công cụ AI được phép sử dụng ở tab Nền tảng.</li>
                          <li>Xác định mức phân loại dữ liệu bảo mật (Data Classification Level: Public, Internal, hoặc Confidential).</li>
                        </ul>
                        <Typography.Text type="secondary">
                          👉 Giải pháp: Vào tab <b>Nền tảng</b> của dự án ➔ Tìm thẻ <b>Thiết lập AI & Phân loại dữ liệu</b> ➔ Chọn công cụ và mức dữ liệu ➔ Bấm Lưu.
                        </Typography.Text>
                      </div>
                    ),
                  },
                  {
                    key: 'faq4',
                    label: <b>4. Khi nào thì Bug chặn không cho ký Gate?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Để đảm bảo chất lượng phát hành, quy trình quy định:
                        </Typography.Paragraph>
                        <ul>
                          <li>Toàn bộ Bug mức <b>S1 (Blocker)</b> và <b>S2 (Critical)</b> bắt buộc phải được Dev sửa và Tester xác nhận đóng (Closed).</li>
                          <li>Nếu còn bất kỳ bug S1/S2 nào ở trạng thái "Mới", "Đang sửa" hoặc "Chờ test lại", nút ký "Đạt" tại Gate sẽ tự động bị khóa kèm thông báo cảnh báo.</li>
                          <li>Các bug S3 (Major) và S4 (Minor) không chặn gate nhưng sẽ được thống kê vào báo cáo chất lượng.</li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    key: 'faq5',
                    label: <b>5. Làm thế nào để so sánh các lần sửa đổi của tài liệu Markdown?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Hệ thống tự động lưu lại lịch sử 25 lần chỉnh sửa gần nhất của từng tài liệu Markdown:
                        </Typography.Paragraph>
                        <ol>
                          <li>Bấm vào tên tài liệu để mở trình xem trong Drawer.</li>
                          <li>Chuyển sang tab <b>"Lịch sử & Diff"</b> trên thanh công cụ.</li>
                          <li>Chọn phiên bản cũ trong danh sách thả xuống.</li>
                          <li>Màn hình sẽ hiển thị trực quan các dòng được thêm mới (màu xanh lá) và các dòng bị xóa/sửa (màu đỏ).</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    key: 'faq6',
                    label: <b>6. Dung lượng tệp đính kèm tối đa là bao nhiêu và hỗ trợ những định dạng nào?</b>,
                    children: (
                      <div>
                        <Typography.Paragraph>
                          Hệ thống hỗ trợ tải lên và xem trực tiếp các tệp tin có dung lượng lên tới <b>30 MB</b>, bao gồm:
                        </Typography.Paragraph>
                        <ul>
                          <li><b>Tài liệu văn bản</b>: Word (<code>.docx</code>, <code>.doc</code>), Markdown (<code>.md</code>).</li>
                          <li><b>Báo cáo & Thiết kế</b>: PDF (<code>.pdf</code>).</li>
                          <li><b>Bảng tính & Dữ liệu</b>: Excel (<code>.xlsx</code>, <code>.xls</code>), CSV (<code>.csv</code>).</li>
                          <li><b>Hình ảnh & Sơ đồ kiến trúc</b>: PNG, JPG, JPEG, SVG, WebP, GIF.</li>
                        </ul>
                        <Typography.Text type="danger">
                          Lưu ý: Vì lý do an toàn thông tin, hệ thống chặn hoàn toàn các tệp thực thi hoặc mã nguồn độc hại như <code>.exe</code>, <code>.html</code>, <code>.js</code>, <code>.sh</code>, <code>.bat</code>.
                        </Typography.Text>
                      </div>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}

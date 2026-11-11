import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Drawer,
  Flex,
  FloatButton,
  Input,
  Radio,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  CopyOutlined,
  ExportOutlined,
  OpenAIOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useProcess, useProject, useProjects } from './api';
import { useTheme } from './ThemeContext';

export function AiCopilotDrawer() {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // Phát hiện project ID và track ID từ URL
  const match = /^\/p\/([a-z0-9]{8})(?:\/t\/([a-z0-9_-]+))?/.exec(loc.pathname);
  const pid = match?.[1];
  const tid = match?.[2] || 'base';

  const proc = useProcess().data;
  const p = useProject(pid || '').data;

  // Lấy bước hiện tại từ hash (ví dụ #B4) hoặc bước đang làm của dự án
  const [activeStepCode, setActiveStepCode] = useState<string>('B4');
  const [featureNote, setFeatureNote] = useState<string>('');
  const [selectedPromptType, setSelectedPromptType] = useState<
    'deliverable' | 'review' | 'testcase' | 'governance'
  >('deliverable');

  // Lắng nghe phím tắt Ctrl+J / Cmd+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Đồng bộ bước theo hash hoặc trạng thái dự án
  useEffect(() => {
    const hashStep = window.location.hash.replace(/^#/, '').toUpperCase();
    if (hashStep && proc?.steps.some((s) => s.code === hashStep)) {
      setActiveStepCode(hashStep);
    } else if (p && tid) {
      const t = tid === 'base' ? p.base : (p.items || []).find((i) => i.id === tid);
      const view = tid === 'base' ? p.view?.base : p.view?.items?.[tid];
      if (view?.current) {
        setActiveStepCode(view.current);
      }
    }
  }, [loc.pathname, loc.hash, p, tid, proc]);

  if (!proc) return null;

  const currentStep = proc.steps.find((s) => s.code === activeStepCode) || proc.steps[0];
  const stepPrompts = proc.prompts.filter((pr) => pr.step === currentStep.code);
  const trackObj = p ? (tid === 'base' ? p.base : (p.items || []).find((i) => i.id === tid)) : null;
  const trackName = tid === 'base' ? 'Nền tảng' : trackObj ? (trackObj as any).name : 'Chung';

  // Sinh nội dung Prompt theo ngữ cảnh
  const generatePrompt = () => {
    const projName = p ? p.name : 'Dự án AI-SDLC';
    const projCode = p?.code ? `[${p.code}] ` : '';
    const tools = p?.aiSetup?.tools?.join(', ') || 'Claude, Gemini, GitHub Copilot';
    const dataLevel = p?.aiSetup?.dataLevel || 'internal';
    const note = featureNote.trim() ? `\n- Yêu cầu nghiệp vụ bổ sung: ${featureNote}` : '';

    if (selectedPromptType === 'deliverable') {
      return `Bạn là Chuyên gia phát triển phần mềm tuân thủ quy trình AI-SDLC.
HÃY SOẠN THẢO TÀI LIỆU CHUẨN CHO BƯỚC: ${currentStep.code} — ${currentStep.name}.

[BỐI CẢNH DỰ ÁN]
- Dự án: ${projCode}${projName}
- Hạng mục / Tính năng: ${trackName}
- Giai đoạn: ${currentStep.phase}
- Mức nhạy cảm dữ liệu: ${dataLevel.toUpperCase()}
- Công cụ AI được phê duyệt: ${tools}${note}

[YÊU CẦU ĐẦU RA]
1. Định dạng: Markdown (.md) chuẩn GitHub Flavored Markdown (GFM).
2. Nội dung bắt buộc bám sát checklist sau:
${currentStep.rows.map((r, i) => `   ${i + 1}. [${r.who}] ${r.name}: ${r.how} (Form: ${r.form})`).join('\n')}
3. Tuân thủ phân loại dữ liệu (không chứa thông tin bí mật, khóa API, dữ liệu khách hàng thật).
4. Văn phong kỹ thuật, chuyên nghiệp, cấu trúc rõ ràng với bảng biểu và sơ đồ nếu cần.`;
    }

    if (selectedPromptType === 'review') {
      return `Bạn là Tech Lead & Chuyên gia Bảo mật kiểm tra chất lượng theo chuẩn AI-SDLC.
HÃY RÀ SOÁT TÀI LIỆU & NỘI DUNG TẠI BƯỚC: ${currentStep.code} — ${currentStep.name}.

[BỐI CẢNH]
- Dự án: ${projCode}${projName}
- Hạng mục: ${trackName}
- Chất lượng đầu ra cần đối chiếu: ${currentStep.out}
- Yêu cầu AI: ${currentStep.ai}${note}

[TIÊU CHÍ ĐÁNH GIÁ (PASS / FAIL)]
1. Kiểm tra tính đầy đủ so với các tiêu chí của bước.
2. Rà soát rủi ro an toàn thông tin & tuân thủ chính sách AI Governance (4-eyes review).
3. Chỉ ra các điểm thiếu sót, sai sót logic và đề xuất phương án cải tiến trực tiếp.`;
    }

    if (selectedPromptType === 'testcase') {
      return `Bạn là Senior QA / Software Tester trong quy trình AI-SDLC.
HÃY SINH MA TRẬN TEST CASE / RTM CHO BƯỚC: ${currentStep.code} — ${currentStep.name}.

[BỐI CẢNH]
- Dự án: ${projCode}${projName}
- Hạng mục: ${trackName}${note}

[YÊU CẦU ĐẦU RA]
Lập bảng ma trận kiểm thử dạng Markdown gồm các cột:
| ID | Nhóm kiểm thử | Kịch bản kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Mức độ nghiêm trọng (S1-S4) |
Bao gồm:
- Luồng thành công (Happy path)
- Luồng lỗi & Ngoại lệ (Edge cases, Validation)
- Bảo mật & Phân quyền`;
    }

    // AI Governance
    return `[QUY CHUẨN AI GOVERNANCE BƯỚC ${currentStep.code}]
1. Nguyên tắc 4-Eyes (Phê duyệt kép): Bất kỳ đoạn mã nguồn, tài liệu spec hoặc cấu hình kiến trúc nào do AI tạo ra đều PHẢI có ít nhất 1 thành viên khác (không phải người prompt) kiểm tra và duyệt lại trước khi ký Gate.
2. Quy định công cụ AI: Chỉ sử dụng các công cụ đã được khai báo (${tools}).
3. Mức bảo mật dữ liệu (${dataLevel.toUpperCase()}): Tuyệt đối không paste mã nguồn chứa bí mật (API Key, Private Token, PII khách hàng) vào các mô hình AI công cộng.`;
  };

  const promptContent = generatePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptContent);
    message.success('Đã sao chép Prompt vào bộ nhớ tạm (Clipboard)!');
  };

  return (
    <>
      {/* Nút nổi kích hoạt Trợ lý AI ở góc phải dưới màn hình */}
      <FloatButton
        icon={<RobotOutlined style={{ color: '#ffffff', fontSize: 20 }} />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
          boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)',
        }}
        tooltip="Trợ lý AI Copilot (Ctrl + J)"
        onClick={() => setOpen(true)}
      />

      {/* Drawer Trợ lý AI */}
      <Drawer
        title={
          <Flex align="center" gap={10}>
            <Avatar
              shape="square"
              size={28}
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
                color: '#ffffff',
              }}
            >
              <RobotOutlined />
            </Avatar>
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                AI SDLC Copilot
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Trợ lý đồng hành quy trình 14 bước & AI Governance (Ctrl + J)
              </Typography.Text>
            </div>
          </Flex>
        }
        open={open}
        onClose={() => setOpen(false)}
        width={540}
        styles={{
          header: {
            padding: '12px 20px',
            borderBottom: isDark ? '1px solid #30363d' : '1px solid #f0f0f0',
            background: isDark ? '#161b22' : '#ffffff',
          },
          body: {
            padding: '16px 20px',
            background: isDark ? '#0d1117' : '#fafafa',
          },
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* Hộp ngữ cảnh hiện tại */}
          <Card
            size="small"
            style={{
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#e8e8e8',
            }}
          >
            <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                Ngữ cảnh làm việc:
              </Typography.Text>
              {p && <Tag color="blue">{p.code || p.name}</Tag>}
            </Flex>

            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Flex align="center" gap={8}>
                <Typography.Text type="secondary" style={{ fontSize: 12, minWidth: 60 }}>
                  Bước SDLC:
                </Typography.Text>
                <Select
                  value={activeStepCode}
                  onChange={(v) => setActiveStepCode(v)}
                  style={{ flex: 1 }}
                  options={proc.steps.map((s) => ({
                    value: s.code,
                    label: `${s.code}: ${s.name} (${s.phase})`,
                  }))}
                />
              </Flex>

              <Flex align="center" gap={8}>
                <Typography.Text type="secondary" style={{ fontSize: 12, minWidth: 60 }}>
                  Hạng mục:
                </Typography.Text>
                <Tag style={{ margin: 0 }}>{trackName}</Tag>
              </Flex>
            </Space>
          </Card>

          {/* Chọn Loại Prompt */}
          <div>
            <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              Mục tiêu prompt cần sinh:
            </Typography.Text>
            <Radio.Group
              value={selectedPromptType}
              onChange={(e) => setSelectedPromptType(e.target.value)}
              style={{ width: '100%' }}
              buttonStyle="solid"
            >
              <Flex gap={8} wrap="wrap">
                <Radio.Button value="deliverable">📝 Soạn Deliverable</Radio.Button>
                <Radio.Button value="review">🔍 Rà soát & Review</Radio.Button>
                <Radio.Button value="testcase">🧪 Kịch bản Test (RTM)</Radio.Button>
                <Radio.Button value="governance">🛡️ AI Governance</Radio.Button>
              </Flex>
            </Radio.Group>
          </div>

          {/* Ghi chú tính năng bổ sung */}
          {selectedPromptType !== 'governance' && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Chi tiết tính năng cần bổ sung vào prompt (tùy chọn):
              </Typography.Text>
              <Input.TextArea
                rows={2}
                placeholder="Ví dụ: Tính năng Đăng nhập một chạm qua QR Code, lưu phiên bằng JWT..."
                value={featureNote}
                onChange={(e) => setFeatureNote(e.target.value)}
              />
            </div>
          )}

          {/* Khung xem trước Prompt */}
          <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                Nội dung Prompt đã điền biến sẵn:
              </Typography.Text>
              <Button type="primary" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                Sao chép Prompt
              </Button>
            </Flex>

            <pre
              style={{
                background: isDark ? '#161b22' : '#f6f8fa',
                color: isDark ? '#e6edf3' : '#24292f',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
                maxHeight: 280,
                overflowY: 'auto',
                border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              }}
            >
              {promptContent}
            </pre>
          </div>

          {/* Mở nhanh các nền tảng AI */}
          <Card
            size="small"
            style={{
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#e8e8e8',
            }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Mở nhanh tab AI để dán Prompt:
            </Typography.Text>
            <Flex gap={8} wrap="wrap">
              <Button
                size="small"
                href="https://claude.ai/new"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExportOutlined />}
              >
                Claude
              </Button>
              <Button
                size="small"
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExportOutlined />}
              >
                ChatGPT
              </Button>
              <Button
                size="small"
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExportOutlined />}
              >
                Gemini
              </Button>
            </Flex>
          </Card>
        </Space>
      </Drawer>
    </>
  );
}

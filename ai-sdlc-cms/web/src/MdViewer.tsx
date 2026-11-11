// Trình xem, chỉnh sửa, so sánh và xuất bản file .md
// 1. Dạng đẹp (ReactMarkdown GFM)
// 2. Dạng thô (Mã nguồn gốc có số dòng)
// 3. Chỉnh sửa (In-app Editor với Live Preview, toolbar, phím tắt Ctrl+S, import Word)
// 4. So sánh (Visual Markdown Diff giữa các phiên bản Revisions)
// 5. Xuất bản đa định dạng: Tải file .md, Xuất Word (.docx), In/Xuất PDF chuẩn A4.
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Flex,
  Input,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BoldOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ItalicOutlined,
  SaveOutlined,
  TableOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from './api';
import DiffViewer from './DiffViewer';
import type { Doc, Project } from './types';
import { fmt } from './util';
import { useTheme } from './ThemeContext';
import { UniversalDocViewer } from './UniversalDocViewer';
import './md.css';

export {
  isMd,
  isPdf,
  isSheet,
  isDocx,
  isImage,
  canViewInApp,
  getDocTypeInfo,
  DocTypeTag,
} from './docUtil';
export { useDocViewer, useUniversalDocViewer, UniversalDocViewer } from './UniversalDocViewer';

async function fetchText(url: string) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy nội dung' : `Lỗi ${res.status}`);
  return res.text();
}

export interface MdContentViewProps {
  pid: string;
  doc: Doc;
  initialMarkdown?: string;
}

export function MdContentView({ pid, doc, initialMarkdown }: MdContentViewProps) {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const qc = useQueryClient();

  const [mode, setMode] = useState<'pretty' | 'raw' | 'edit' | 'diff'>(
    initialMarkdown ? 'edit' : 'pretty'
  );
  const [editText, setEditText] = useState<string>(initialMarkdown || '');
  const [editNote, setEditNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // So sánh phiên bản (Diff)
  const [selectedRevId, setSelectedRevId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đọc nội dung file hiện tại
  const qContent = useQuery({
    queryKey: ['doc-content', pid, doc.id],
    queryFn: () => fetchText(`/api/projects/${pid}/docs/${doc.id}/content`),
    enabled: !!doc && !initialMarkdown,
  });

  // Khi tải xong nội dung, đồng bộ vào editor
  useEffect(() => {
    if (initialMarkdown) {
      setEditText(initialMarkdown);
      setMode('edit');
    } else if (qContent.data !== undefined) {
      setEditText(qContent.data);
    }
  }, [qContent.data, initialMarkdown]);

  // Đọc nội dung phiên bản cũ khi vào chế độ Diff
  const revisions = doc.revisions || [];
  const activeRevId = selectedRevId || (revisions[0]?.revId ?? '');

  const qRevContent = useQuery({
    queryKey: ['doc-rev-content', pid, doc.id, activeRevId],
    queryFn: () => fetchText(`/api/projects/${pid}/docs/${doc.id}/revisions/${activeRevId}`),
    enabled: !!doc && mode === 'diff' && !!activeRevId,
  });

  // Phím tắt Ctrl+S để lưu khi đang ở chế độ Chỉnh sửa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (mode === 'edit') {
          e.preventDefault();
          handleSaveContent();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, editText, editNote]);

  const handleSaveContent = async () => {
    if (!doc) return;
    try {
      setIsSaving(true);
      await api<Project>('PUT', `/api/projects/${pid}/docs/${doc.id}/content`, {
        content: editText,
        note: editNote || 'Cập nhật nội dung',
      });
      message.success('Đã lưu phiên bản mới của tài liệu');
      qc.invalidateQueries({ queryKey: ['doc-content', pid, doc.id] });
      qc.invalidateQueries({ queryKey: ['project', pid] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditNote('');
      setMode('pretty');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Nhập từ file Word (.docx)
  const handleWordFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doc) return;
    try {
      setIsImporting(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ markdown: string; filename: string }>(
        'POST',
        `/api/projects/${pid}/docs/convert-docx`,
        fd
      );
      setEditText(res.markdown);
      setEditNote(`Nhập từ Word: ${file.name}`);
      message.success(`Đã chuyển đổi thành công từ file Word (${file.name}) sang Markdown`);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Chèn cú pháp mẫu vào editor
  const insertSyntax = (before: string, after: string = '', defaultText: string = '') => {
    setEditText((prev) => `${prev}\n\n${before}${defaultText}${after}\n`);
  };

  const rawDisplayContent = qContent.data ?? editText;
  const lines = rawDisplayContent.split('\n');

  if (qContent.isLoading && !initialMarkdown) {
    return <Spin tip="Đang tải tài liệu..." />;
  }

  if (qContent.isError && !initialMarkdown) {
    return <Alert type="error" showIcon message={(qContent.error as Error).message} />;
  }

  return (
    <>
      {/* Input file ẩn để import file Word */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".docx,.doc"
        onChange={handleWordFileChange}
      />

      {/* THANH ĐIỀU HƯỚNG CHẾ ĐỘ XEM & XUẤT TÀI LIỆU (STICKY TOOLBAR) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 14px',
          marginBottom: 16,
          borderRadius: 8,
          background: isDark ? '#1c2128' : '#f8f9fa',
          border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}`,
          position: 'sticky',
          top: -16,
          zIndex: 20,
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Bộ chọn chế độ xem */}
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'pretty' | 'raw' | 'edit' | 'diff')}
          options={[
            { label: 'Dạng đẹp', value: 'pretty', icon: <EyeOutlined /> },
            { label: 'Dạng thô', value: 'raw', icon: <FileTextOutlined /> },
            { label: 'Chỉnh sửa', value: 'edit', icon: <EditOutlined /> },
            {
              label: `Lịch sử & Diff (${revisions.length})`,
              value: 'diff',
              icon: <HistoryOutlined />,
            },
          ]}
        />

        {/* Các nút tác vụ */}
        <Space wrap size="small">
          <Button
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(rawDisplayContent);
              message.success('Đã sao chép nội dung Markdown');
            }}
          >
            Sao chép
          </Button>

          <Button icon={<DownloadOutlined />} href={`/api/projects/${pid}/files/${doc?.id}`}>
            Tải .md
          </Button>
        </Space>
      </div>

      {/* CHẾ ĐỘ 1: DẠNG ĐẸP */}
      {mode === 'pretty' && (
        <div className="md-body print-area" style={{ maxWidth: 960, margin: '0 auto' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {rawDisplayContent || '*Tài liệu trống*'}
          </ReactMarkdown>
        </div>
      )}

      {/* CHẾ ĐỘ 2: DẠNG THÔ */}
      {mode === 'raw' && (
        <pre
          className="md-raw-source print-area"
          style={{
            background: isDark ? '#161b22' : '#f6f8fa',
            color: isDark ? '#e6edf3' : '#24292f',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
          }}
        >
          {lines.map((line, i) => (
            <div key={i} className="md-raw-line">
              <span className="md-line-num">{i + 1}</span>
              <span className="md-line-text">{line || ' '}</span>
            </div>
          ))}
        </pre>
      )}

      {/* CHẾ ĐỘ 3: CHỈNH SỬA VỚI LIVE PREVIEW */}
      {mode === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Toolbar soạn thảo */}
          <Card
            size="small"
            style={{
              marginBottom: 12,
              background: isDark ? '#161b22' : '#fafafa',
              borderColor: isDark ? '#30363d' : '#e8e8e8',
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Space wrap size="small">
                <Button size="small" icon={<BoldOutlined />} onClick={() => insertSyntax('**', '**', 'Chữ đậm')}>
                  Đậm
                </Button>
                <Button size="small" icon={<ItalicOutlined />} onClick={() => insertSyntax('*', '*', 'Chữ nghiêng')}>
                  Nghiêng
                </Button>
                <Button size="small" onClick={() => insertSyntax('### ', '', 'Tiêu đề')}>
                  Tiêu đề H3
                </Button>
                <Button size="small" onClick={() => insertSyntax('- [ ] ', '', 'Đầu việc')}>
                  Task list
                </Button>
                <Button
                  size="small"
                  icon={<TableOutlined />}
                  onClick={() => insertSyntax('| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n| Giá trị 1 | Giá trị 2 | Giá trị 3 |')}
                >
                  Bảng
                </Button>
                <Button size="small" onClick={() => insertSyntax('```javascript\n', '\n```', '// Mã nguồn ví dụ')}>
                  Code block
                </Button>
              </Space>

              <Space wrap size="small">
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={isImporting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📥 Nhập từ Word (.docx)
                </Button>
              </Space>
            </Flex>
          </Card>

          {/* Split Editor: Khung Soạn thảo (Trái) & Xem trước Live (Phải) */}
          <Row gutter={16} style={{ flex: 1, minHeight: 480 }}>
            <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Text strong style={{ marginBottom: 6 }}>
                Nội dung Markdown (Hỗ trợ phím tắt Ctrl+S để lưu):
              </Typography.Text>
              <Input.TextArea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: 420,
                  fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
                placeholder="Nhập nội dung Markdown hoặc bấm 'Nhập từ Word (.docx)'..."
              />
            </Col>

            <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Text strong style={{ marginBottom: 6 }}>
                Xem trước thời gian thực (Live Preview):
              </Typography.Text>
              <div
                className="md-body"
                style={{
                  flex: 1,
                  minHeight: 420,
                  padding: 16,
                  border: '1px solid rgba(128, 128, 128, 0.2)',
                  borderRadius: 6,
                  overflowY: 'auto',
                  maxHeight: 560,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editText || '*Chưa có nội dung xem trước*'}
                </ReactMarkdown>
              </div>
            </Col>
          </Row>

          {/* Footer lưu thay đổi */}
          <Flex
            gap={12}
            align="center"
            wrap="wrap"
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid rgba(128, 128, 128, 0.15)',
            }}
          >
            <Input
              placeholder="Ghi chú thay đổi (ví dụ: Cập nhật spec tính năng thanh toán, sửa bảng luồng đi)"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              style={{ flex: 1, minWidth: 280 }}
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              onClick={handleSaveContent}
            >
              Lưu phiên bản mới (Ctrl + S)
            </Button>
            <Button
              onClick={() => {
                setEditText(qContent.data || '');
                setMode('pretty');
              }}
            >
              Hủy bỏ
            </Button>
          </Flex>
        </div>
      )}

      {/* CHẾ ĐỘ 4: LỊCH SỬ & SO SÁNH DIFF */}
      {mode === 'diff' && (
        <div>
          {revisions.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message="Chưa có phiên bản lịch sử để so sánh"
              description="Khi bạn chỉnh sửa tài liệu qua chế độ 'Chỉnh sửa' hoặc tải lên bản mới, hệ thống sẽ tự động lưu lại các bản cũ để bạn có thể xem lại và so sánh sự khác biệt bất kỳ lúc nào."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Flex align="center" gap={12} wrap="wrap">
                <Typography.Text strong>Chọn phiên bản cũ để so sánh với Bản hiện tại:</Typography.Text>
                <Select
                  style={{ minWidth: 360 }}
                  value={activeRevId}
                  onChange={(v) => setSelectedRevId(v)}
                  options={revisions.map((r, i) => ({
                    value: r.revId,
                    label: `Bản ${revisions.length - i} · ${fmt(r.at)} — ${r.byName}${
                      r.note ? ` (${r.note})` : ''
                    }`,
                  }))}
                />
              </Flex>

              {qRevContent.isLoading ? (
                <Spin tip="Đang tải phiên bản lịch sử..." />
              ) : qRevContent.isError ? (
                <Alert type="error" showIcon message={(qRevContent.error as Error).message} />
              ) : (
                <DiffViewer
                  oldText={qRevContent.data || ''}
                  newText={qContent.data || ''}
                  oldLabel={`Phiên bản cũ (${fmt(
                    revisions.find((r) => r.revId === activeRevId)?.at || ''
                  )})`}
                  newLabel="Phiên bản hiện tại"
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export interface MdViewerProps {
  pid: string;
  doc: Doc | null;
  onClose: () => void;
}

export default function MdViewer(props: MdViewerProps) {
  return <UniversalDocViewer {...props} />;
}

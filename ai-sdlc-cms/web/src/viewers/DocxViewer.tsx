import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  FileWordOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import type { Doc } from '../types';
import { useTheme } from '../ThemeContext';

interface DocxHtmlResponse {
  filename: string;
  html: string;
  warnings: string[];
}

interface DocxViewerProps {
  pid: string;
  doc: Doc;
  onEditAsMarkdown?: (markdown: string) => void;
}

export default function DocxViewer({ pid, doc, onEditAsMarkdown }: DocxViewerProps) {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const [converting, setConverting] = useState(false);

  const downloadUrl = `/api/projects/${pid}/files/${doc.id}`;

  const qDocx = useQuery<DocxHtmlResponse>({
    queryKey: ['docx-html', pid, doc.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${pid}/docs/${doc.id}/docx-html`, {
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi đọc file Word (${res.status})`);
      }
      return res.json();
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToMarkdown = async () => {
    if (!onEditAsMarkdown) return;
    setConverting(true);
    try {
      // Tải file gốc dạng blob rồi đẩy qua convert-docx
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error('Không thể tải file Word gốc');
      const blob = await fileRes.blob();
      const fd = new FormData();
      fd.append('file', blob, doc.file?.name || 'document.docx');

      const convRes = await fetch(`/api/projects/${pid}/docs/convert-docx`, {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      });
      if (!convRes.ok) {
        const err = await convRes.json().catch(() => ({}));
        throw new Error(err.error || 'Lỗi chuyển đổi sang Markdown');
      }
      const data = await convRes.json();
      message.success('Đã chuyển đổi văn bản sang Markdown thành công!');
      onEditAsMarkdown(data.markdown);
    } catch (err: any) {
      message.error(err.message || 'Không thể chuyển đổi Word sang Markdown');
    } finally {
      setConverting(false);
    }
  };

  if (qDocx.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin tip="Đang đọc và định dạng tài liệu Word..." size="large" />
      </div>
    );
  }

  if (qDocx.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể hiển thị tài liệu Word"
        description={(qDocx.error as Error).message}
        action={
          <Button icon={<DownloadOutlined />} href={downloadUrl}>
            Tải file gốc về xem
          </Button>
        }
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        background: isDark ? '#141414' : '#f0f2f5',
        borderRadius: 8,
        border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
        overflow: 'hidden',
      }}
    >
      {/* Thanh điều khiển trên cùng */}
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={10}
        style={{
          padding: '8px 16px',
          background: isDark ? '#1f1f1f' : '#ffffff',
          borderBottom: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
        }}
      >
        <Space size={8} wrap>
          <FileWordOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          <Typography.Text strong>{qDocx.data?.filename || doc.label}</Typography.Text>
          <Tag color="blue">Word Document (.docx)</Tag>
          {doc.file?.size && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ({(doc.file.size / 1024).toFixed(1)} KB)
            </Typography.Text>
          )}
        </Space>

        <Space size={8} wrap>
          {onEditAsMarkdown && (
            <Tooltip title="Chuyển nội dung văn bản sang Markdown để chỉnh sửa trực tiếp trong CMS">
              <Button
                size="small"
                type="primary"
                icon={<EditOutlined />}
                loading={converting}
                onClick={handleConvertToMarkdown}
              >
                Chuyển sang Markdown để sửa
              </Button>
            </Tooltip>
          )}
          <Tooltip title="In hoặc lưu dạng PDF bằng trình duyệt">
            <Button size="small" icon={<PrinterOutlined />} onClick={handlePrint}>
              In / Xuất PDF
            </Button>
          </Tooltip>
          <Tooltip title="Tải file Word (.docx) gốc về máy">
            <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
              Tải file gốc
            </Button>
          </Tooltip>
        </Space>
      </Flex>

      {/* Vùng xem tài liệu dạng trang giấy A4 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'center',
          background: isDark ? '#141414' : '#f0f2f5',
        }}
      >
        <div
          className="docx-page"
          style={{
            width: '100%',
            maxWidth: 820,
            minHeight: '100%',
            background: isDark ? '#1f1f1f' : '#ffffff',
            boxShadow: isDark
              ? '0 4px 16px rgba(0, 0, 0, 0.4)'
              : '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '48px 56px',
            borderRadius: 4,
            border: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
            color: isDark ? '#e6e6e6' : '#262626',
            lineHeight: 1.7,
            fontSize: 15,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Render HTML đã được chuyển đổi từ Word */}
          <div
            dangerouslySetInnerHTML={{ __html: qDocx.data?.html || '' }}
            style={{
              wordBreak: 'break-word',
            }}
          />
        </div>
      </div>

      <style>{`
        .docx-page table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .docx-page table th, .docx-page table td {
          border: 1px solid ${isDark ? '#434343' : '#d9d9d9'};
          padding: 8px 12px;
          text-align: left;
        }
        .docx-page table th {
          background: ${isDark ? '#262626' : '#fafafa'};
          font-weight: 600;
        }
        .docx-page img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 12px 0;
        }
        .docx-page h1, .docx-page h2, .docx-page h3, .docx-page h4 {
          margin-top: 24px;
          margin-bottom: 12px;
          color: ${isDark ? '#58a6ff' : '#0958d9'};
        }
        .docx-page ul, .docx-page ol {
          padding-left: 24px;
          margin: 12px 0;
        }
        .docx-page p {
          margin-bottom: 12px;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .docx-page, .docx-page * {
            visibility: visible;
          }
          .docx-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

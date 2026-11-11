import { useState } from 'react';
import { Alert, Button, Flex, Space, Spin, Tooltip, Typography } from 'antd';
import {
  DownloadOutlined,
  ExportOutlined,
  FilePdfOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { Doc } from '../types';
import { useTheme } from '../ThemeContext';

interface PdfViewerProps {
  pid: string;
  doc: Doc;
}

export default function PdfViewer({ pid, doc }: PdfViewerProps) {
  const { isDark } = useTheme();
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const viewUrl = `/api/projects/${pid}/files/${doc.id}/view`;
  const downloadUrl = `/api/projects/${pid}/files/${doc.id}`;

  const reload = () => {
    setLoading(true);
    setKey((k) => k + 1);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
        background: isDark ? '#141414' : '#f5f5f5',
        borderRadius: isFullscreen ? 0 : 8,
        overflow: 'hidden',
        border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
      }}
    >
      {/* Thanh điều khiển */}
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={8}
        style={{
          padding: '8px 16px',
          background: isDark ? '#1f1f1f' : '#ffffff',
          borderBottom: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
        }}
      >
        <Space size={8}>
          <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
          <Typography.Text strong>{doc.file?.name || doc.label}</Typography.Text>
          {doc.file?.size && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography.Text>
          )}
        </Space>

        <Space size={8}>
          <Tooltip title="Tải lại nội dung PDF">
            <Button size="small" icon={<ReloadOutlined />} onClick={reload}>
              Làm mới
            </Button>
          </Tooltip>
          <Tooltip title="Mở file PDF trong tab trình duyệt riêng">
            <Button
              size="small"
              icon={<ExportOutlined />}
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở tab mới
            </Button>
          </Tooltip>
          <Tooltip title="Tải file PDF gốc về máy tính">
            <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
              Tải file gốc
            </Button>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Xem toàn màn hình'}>
            <Button
              size="small"
              type={isFullscreen ? 'primary' : 'default'}
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </Button>
          </Tooltip>
        </Space>
      </Flex>

      {/* Vùng hiển thị PDF */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 2,
            }}
          >
            <Spin tip="Đang tải tài liệu PDF..." size="large" />
          </div>
        )}

        <iframe
          key={key}
          src={`${viewUrl}#toolbar=1`}
          title={doc.label}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Thông báo hỗ trợ nếu trình duyệt không hỗ trợ PDF native */}
      <div
        style={{
          padding: '6px 16px',
          background: isDark ? '#1a1a1a' : '#fafafa',
          borderTop: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
          fontSize: 12,
        }}
      >
        <Typography.Text type="secondary">
          💡 Gợi ý: Nếu trình duyệt không tự mở được PDF, bạn có thể bấm{' '}
          <a href={viewUrl} target="_blank" rel="noopener noreferrer">
            Mở tab mới
          </a>{' '}
          hoặc{' '}
          <a href={downloadUrl}>
            Tải về máy tính
          </a>
          .
        </Typography.Text>
      </div>
    </div>
  );
}

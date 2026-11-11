import { useRef, useState } from 'react';
import { Alert, Button, Flex, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import {
  DownloadOutlined,
  FileImageOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  RedoOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import type { Doc } from '../types';
import { useTheme } from '../ThemeContext';

interface ImageViewerProps {
  pid: string;
  doc: Doc;
}

export default function ImageViewer({ pid, doc }: ImageViewerProps) {
  const { isDark } = useTheme();
  const [scale, setScale] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const viewUrl = `/api/projects/${pid}/files/${doc.id}/view`;
  const downloadUrl = `/api/projects/${pid}/files/${doc.id}`;

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25));
  const rotateRight = () => setRotate((r) => (r + 90) % 360);
  const reset = () => {
    setScale(1);
    setRotate(0);
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
        border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
        overflow: 'hidden',
      }}
    >
      {/* Thanh công cụ hình ảnh */}
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
          <FileImageOutlined style={{ color: '#722ed1', fontSize: 20 }} />
          <Typography.Text strong>{doc.file?.name || doc.label}</Typography.Text>
          {naturalSize && (
            <Tag color="purple">
              {naturalSize.width} × {naturalSize.height} px
            </Tag>
          )}
          {doc.file?.size && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ({(doc.file.size / 1024).toFixed(1)} KB)
            </Typography.Text>
          )}
          <Tag>{Math.round(scale * 100)}%</Tag>
        </Space>

        <Space size={8} wrap>
          <Tooltip title="Phóng to (+25%)">
            <Button size="small" icon={<ZoomInOutlined />} onClick={zoomIn} />
          </Tooltip>
          <Tooltip title="Thu nhỏ (-25%)">
            <Button size="small" icon={<ZoomOutOutlined />} onClick={zoomOut} />
          </Tooltip>
          <Tooltip title="Xoay 90°">
            <Button size="small" icon={<RedoOutlined />} onClick={rotateRight} />
          </Tooltip>
          <Tooltip title="Đặt lại tỷ lệ 100%">
            <Button size="small" icon={<ReloadOutlined />} onClick={reset}>
              100%
            </Button>
          </Tooltip>
          <Tooltip title="Tải ảnh về máy">
            <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
              Tải ảnh
            </Button>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}>
            <Button
              size="small"
              type={isFullscreen ? 'primary' : 'default'}
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Tooltip>
        </Space>
      </Flex>

      {/* Vùng canvas hiển thị ảnh */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          position: 'relative',
          backgroundImage: isDark
            ? 'radial-gradient(#262626 1px, transparent 1px)'
            : 'radial-gradient(#e5e5e5 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {loading && !loadError && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Spin tip="Đang tải hình ảnh..." size="large" />
          </div>
        )}

        {loadError ? (
          <div style={{ textAlign: 'center', padding: 32, maxWidth: 480 }}>
            <Alert
              type="error"
              showIcon
              message="Không thể hiển thị hình ảnh"
              description="File ảnh có thể bị lỗi hoặc định dạng không được trình duyệt hỗ trợ trực tiếp."
              action={
                <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
                  Tải file về máy
                </Button>
              }
            />
          </div>
        ) : (
          <img
            ref={imgRef}
            src={viewUrl}
            alt={doc.label}
            style={{
              maxWidth: scale === 1 ? '100%' : 'none',
              maxHeight: scale === 1 ? '100%' : 'none',
              transform: `scale(${scale}) rotate(${rotate}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
              borderRadius: 4,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              display: loading ? 'none' : 'block',
            }}
            onLoad={(e) => {
              setLoading(false);
              const img = e.currentTarget;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            onError={() => {
              setLoading(false);
              setLoadError(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

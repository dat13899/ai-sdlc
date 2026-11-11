import { useEffect, useState } from 'react';
import { Button, Card, Drawer, Empty, Flex, Space, Tag, Tooltip, Typography } from 'antd';
import {
  DownloadOutlined,
  ExportOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { Doc } from './types';
import { useTheme } from './ThemeContext';
import { fmt } from './util';
import { DocTypeTag, getDocTypeInfo, isDocx, isImage, isMd, isPdf, isSheet } from './docUtil';
import PdfViewer from './viewers/PdfViewer';
import SheetViewer from './viewers/SheetViewer';
import DocxViewer from './viewers/DocxViewer';
import ImageViewer from './viewers/ImageViewer';
import { MdContentView } from './MdViewer';

export interface UniversalDocViewerProps {
  pid: string;
  doc: Doc | null;
  onClose: () => void;
}

export function UniversalDocViewer({ pid, doc, onClose }: UniversalDocViewerProps) {
  const { isDark } = useTheme();
  const [convertedMd, setConvertedMd] = useState<{ active: boolean; text: string }>({
    active: false,
    text: '',
  });

  useEffect(() => {
    setConvertedMd({ active: false, text: '' });
  }, [doc?.id]);

  if (!doc) return null;

  const typeInfo = getDocTypeInfo(doc);
  const downloadUrl = `/api/projects/${pid}/files/${doc.id}`;
  const revisions = doc.revisions || [];

  return (
    <Drawer
      open={!!doc}
      onClose={() => {
        setConvertedMd({ active: false, text: '' });
        onClose();
      }}
      width="min(1380px, 98vw)"
      styles={{
        header: {
          padding: '12px 24px',
          borderBottom: isDark ? '1px solid #30363d' : '1px solid #f0f0f0',
          background: isDark ? '#161b22' : '#ffffff',
        },
        body: {
          padding: '16px 24px',
          background: isDark ? '#0d1117' : '#ffffff',
        },
      }}
      title={
        <Flex align="center" gap={12} style={{ minWidth: 0, width: '100%', overflow: 'hidden' }}>
          <span style={{ fontSize: 22, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {typeInfo.icon}
          </span>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Space size={8} align="center" wrap>
              <Typography.Text
                strong
                style={{
                  fontSize: 16,
                  maxWidth: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                }}
                title={doc.label}
              >
                {doc.label}
              </Typography.Text>
              <DocTypeTag doc={doc} />
              {revisions.length > 0 ? (
                <Tag color="blue" style={{ margin: 0 }}>
                  v{revisions.length + 1} ({revisions.length} lần sửa)
                </Tag>
              ) : (
                <Tag color="default" style={{ margin: 0 }}>
                  v1
                </Tag>
              )}
              {doc.templateId && <Tag style={{ margin: 0 }}>{doc.templateId}</Tag>}
            </Space>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                display: 'block',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={`${doc.file ? doc.file.name : doc.url} · ${doc.byName || 'Hệ thống'} · Cập nhật: ${fmt(doc.at)}${doc.lastNote ? ` (${doc.lastNote})` : ''}`}
            >
              {doc.file ? doc.file.name : doc.url} · {doc.byName || 'Hệ thống'} · Cập nhật:{' '}
              {fmt(doc.at)}
              {doc.lastNote && ` (${doc.lastNote})`}
            </Typography.Text>
          </div>
        </Flex>
      }
      extra={
        <Space size="small" className="no-print">
          {doc.file && (
            <Tooltip title="Tải file đính kèm gốc">
              <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
                Tải file gốc
              </Button>
            </Tooltip>
          )}
          {doc.url && (
            <Button
              size="small"
              type="primary"
              icon={<ExportOutlined />}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở link ↗
            </Button>
          )}
        </Space>
      }
      destroyOnClose
    >
      {/* Điều hướng render theo loại tài liệu */}
      {isPdf(doc) ? (
        <PdfViewer pid={pid} doc={doc} />
      ) : isSheet(doc) ? (
        <SheetViewer pid={pid} doc={doc} />
      ) : isDocx(doc) && !convertedMd.active ? (
        <DocxViewer
          pid={pid}
          doc={doc}
          onEditAsMarkdown={(md) => {
            setConvertedMd({ active: true, text: md });
          }}
        />
      ) : isImage(doc) ? (
        <ImageViewer pid={pid} doc={doc} />
      ) : isMd(doc) || convertedMd.active ? (
        <MdContentView
          pid={pid}
          doc={doc}
          initialMarkdown={convertedMd.active ? convertedMd.text : undefined}
        />
      ) : doc.url ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Space direction="vertical" size={16}>
            <LinkOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            <Typography.Title level={4}>Tài liệu liên kết ngoài</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 500, margin: '0 auto' }}>
              Tài liệu này được lưu trữ dưới dạng liên kết ngoài. Bấm vào nút bên dưới để mở liên kết trong tab mới.
            </Typography.Paragraph>
            <Typography.Text code copyable>{doc.url}</Typography.Text>
            <div>
              <Button
                type="primary"
                size="large"
                icon={<ExportOutlined />}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở liên kết trong tab mới
              </Button>
            </div>
          </Space>
        </Card>
      ) : (
        <Empty description="Không có công cụ xem trước cho định dạng này">
          {doc.file && (
            <Button type="primary" icon={<DownloadOutlined />} href={downloadUrl}>
              Tải file về máy để xem
            </Button>
          )}
        </Empty>
      )}
    </Drawer>
  );
}

// Hook dùng chung toàn app
export function useDocViewer(pid: string) {
  const [doc, setDoc] = useState<Doc | null>(null);
  return {
    open: (d: Doc) => setDoc(d),
    close: () => setDoc(null),
    node: <UniversalDocViewer pid={pid} doc={doc} onClose={() => setDoc(null)} />,
  };
}

export const useUniversalDocViewer = useDocViewer;

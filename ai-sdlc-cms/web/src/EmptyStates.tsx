// Các thành phần trạng thái rỗng truyền cảm hứng (Delightful Empty States phong cách Linear / Vercel)
import React from 'react';
import { Button, Card, Empty, Result, Space, Typography } from 'antd';
import {
  CheckCircleFilled,
  FolderOpenOutlined,
  RobotOutlined,
  SafetyCertificateFilled,
  SearchOutlined,
  SmileOutlined,
  TrophyFilled,
} from '@ant-design/icons';
import { useTheme } from './ThemeContext';

interface EmptyProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Trạng thái chúc mừng khi 0 bước quá hạn (Zero Overdue Tasks) */
export function CelebrationZeroOverdue({ style }: { style?: React.CSSProperties }) {
  const { isDark } = useTheme();
  return (
    <Card
      size="small"
      style={{
        textAlign: 'center',
        padding: '24px 16px',
        background: isDark ? 'rgba(82, 196, 26, 0.06)' : '#f6ffed',
        borderColor: isDark ? 'rgba(82, 196, 26, 0.25)' : '#b7eb8f',
        borderRadius: 8,
        ...style,
      }}
    >
      <TrophyFilled style={{ fontSize: 36, color: '#52c41a', marginBottom: 12 }} />
      <Typography.Title level={5} style={{ margin: '0 0 6px', color: '#52c41a' }}>
        Tuyệt vời! Toàn bộ tiến độ đang đúng hạn 100%
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
        Không có bất kỳ bước nào trong danh mục dự án bị trễ so với kế hoạch cam kết.
      </Typography.Text>
    </Card>
  );
}

/** Trạng thái an toàn chuẩn Gate 4 (Không có bug S1/S2) */
export function QualityGateSafe({ style }: { style?: React.CSSProperties }) {
  const { isDark } = useTheme();
  return (
    <Card
      size="small"
      style={{
        textAlign: 'center',
        padding: '20px 16px',
        background: isDark ? 'rgba(22, 119, 255, 0.06)' : '#e6f4ff',
        borderColor: isDark ? 'rgba(22, 119, 255, 0.25)' : '#91caff',
        borderRadius: 8,
        ...style,
      }}
    >
      <SafetyCertificateFilled style={{ fontSize: 32, color: '#1677ff', marginBottom: 10 }} />
      <Typography.Title level={5} style={{ margin: '0 0 4px', color: '#1677ff' }}>
        Chất lượng đạt chuẩn Gate 4 (0 Bug S1/S2)
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
        Không phát hiện lỗi nghiêm trọng dạng Blocker hoặc Critical. Sẵn sàng phát hành an toàn.
      </Typography.Text>
    </Card>
  );
}

/** Trạng thái không có mục AI tồn đọng */
export function AllAiApproved({ style }: { style?: React.CSSProperties }) {
  const { isDark } = useTheme();
  return (
    <Card
      size="small"
      style={{
        textAlign: 'center',
        padding: '20px 16px',
        background: isDark ? '#1c2128' : '#fafafa',
        borderColor: isDark ? '#30363d' : '#f0f0f0',
        borderRadius: 8,
        ...style,
      }}
    >
      <RobotOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 10 }} />
      <Typography.Title level={5} style={{ margin: '0 0 4px', color: isDark ? '#d2a8ff' : '#722ed1' }}>
        Không có nhật ký AI chờ duyệt
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
        Toàn bộ kết quả mã nguồn / tài liệu do AI đề xuất đã được kiểm duyệt bởi Human Gate.
      </Typography.Text>
    </Card>
  );
}

/** Trạng thái tìm kiếm không thấy kết quả */
export function SearchNoResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 16px' }}>
      <SearchOutlined style={{ fontSize: 40, color: '#8c8c8c', marginBottom: 12 }} />
      <Typography.Title level={5} style={{ margin: '0 0 6px' }}>
        Không tìm thấy kết quả phù hợp {query ? `cho "${query}"` : ''}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
        Thử kiểm tra lại từ khoá hoặc nhấn <kbd style={{ padding: '2px 6px', background: 'rgba(128,128,128,0.15)', borderRadius: 4, fontFamily: 'monospace' }}>Ctrl + K</kbd> để tìm kiếm toàn hệ thống.
      </Typography.Text>
      {onClear && (
        <Button size="small" onClick={onClear}>
          Xoá bộ lọc tìm kiếm
        </Button>
      )}
    </div>
  );
}

/** Trạng thái danh sách rỗng tổng quát với icon phong cách Linear */
export function DelightfulEmpty({
  title = 'Chưa có dữ liệu',
  description = 'Bắt đầu bằng cách tạo mục đầu tiên hoặc kiểm tra lại bộ lọc.',
  action,
  style,
}: EmptyProps) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', ...style }}>
      <FolderOpenOutlined style={{ fontSize: 38, color: '#8c8c8c', marginBottom: 12 }} />
      <Typography.Title level={5} style={{ margin: '0 0 4px' }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: action ? 16 : 0 }}>
        {description}
      </Typography.Text>
      {action && <div>{action}</div>}
    </div>
  );
}

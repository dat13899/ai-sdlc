// Bộ khung xương tải trang (Skeleton Shimmer Loaders) hạn chế giật nháy layout (Cumulative Layout Shift)
import { Card, Col, Row, Skeleton, Space } from 'antd';
import { useTheme } from './ThemeContext';

/** Skeleton cho 4 KPI cards trên Dashboard & Reports */
export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  const { isDark } = useTheme();
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Col xs={12} sm={12} lg={24 / count} key={i}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Skeleton.Input active size="small" style={{ width: 120, height: 16, marginBottom: 8 }} />
            <Skeleton.Input active size="large" style={{ width: 80, height: 28, marginBottom: 8, display: 'block' }} />
            <Skeleton.Input active size="small" style={{ width: '80%', height: 12 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

/** Skeleton cho trang Dashboard khi đang tải dữ liệu danh mục dự án */
export function DashboardSkeleton() {
  const { isDark } = useTheme();
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Skeleton.Input active size="large" style={{ width: 280, height: 32 }} />
      </div>

      <KpiCardsSkeleton count={4} />

      <Card
        style={{
          borderRadius: 8,
          background: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#f0f0f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Skeleton.Input active size="default" style={{ width: 240 }} />
          <Skeleton.Button active size="default" style={{ width: 140 }} />
        </div>

        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  background: isDark ? '#1c2128' : '#fafafa',
                  borderColor: isDark ? '#30363d' : '#f0f0f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Skeleton.Input active size="small" style={{ width: 140 }} />
                  <Skeleton.Button active size="small" style={{ width: 50 }} />
                </div>
                <Skeleton.Input active size="small" style={{ width: '100%', height: 8, marginBottom: 12 }} />
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

/** Skeleton cho trang Dự án (chế độ Focus View) */
export function ProjectFocusSkeleton() {
  const { isDark } = useTheme();
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Skeleton.Input active size="small" style={{ width: 200, marginBottom: 8, display: 'block' }} />
        <Skeleton.Input active size="large" style={{ width: 340, height: 32 }} />
      </div>

      <Row gutter={16}>
        {/* Cột trái Navigator */}
        <Col xs={24} lg={8} xl={7}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Skeleton.Input active size="small" style={{ width: '100%', height: 32, marginBottom: 16 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Skeleton.Input active size="small" style={{ width: '100%', height: 42, borderRadius: 6 }} />
              </div>
            ))}
          </Card>
        </Col>

        {/* Cột phải Focus Area */}
        <Col xs={24} lg={16} xl={17}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Skeleton.Input active size="default" style={{ width: 220 }} />
              <Skeleton.Button active size="default" style={{ width: 100 }} />
            </div>

            {/* Output callout skeleton */}
            <Skeleton.Node active style={{ width: '100%', height: 70, marginBottom: 16, borderRadius: 6 }} />

            {/* Checklist items skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton.Node active key={i} style={{ width: '100%', height: 60, borderRadius: 6 }} />
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/** Skeleton cho bảng chung */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <Skeleton active paragraph={{ rows }} title={false} />
    </div>
  );
}

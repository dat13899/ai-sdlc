// Báo cáo & Số liệu: Tiến độ, Thời gian từng bước, Quality Gates, Hiệu suất AI & Tải nhân sự
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Card,
  Col,
  Empty,
  Flex,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  theme,
  type TableColumnsType,
} from 'antd';
import {
  ApartmentOutlined,
  BarChartOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  RightOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMetrics, useProcess } from '../api';
import { PageHeader } from '../components';
import { fmt } from '../util';
import type { Metrics } from '../types';
import { useTheme } from '../ThemeContext';
import { CelebrationZeroOverdue, QualityGateSafe } from '../EmptyStates';

const d = (v: number | null) => (v === null ? '—' : `${v} ngày`);
const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

const DORA_LEVEL_CONFIG: Record<string, { color: string; label: string; text: string }> = {
  elite: { color: 'success', label: 'Elite', text: 'Đỉnh cao (Elite)' },
  high: { color: 'processing', label: 'High', text: 'Cao (High)' },
  medium: { color: 'warning', label: 'Medium', text: 'Trung bình (Medium)' },
  low: { color: 'error', label: 'Low', text: 'Cần cải thiện (Low)' },
  unknown: { color: 'default', label: 'N/A', text: 'Chưa đủ dữ liệu' },
};

export default function Reports() {
  const proc = useProcess().data;
  const m = useMetrics().data;
  const { isDark } = useTheme();
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState<string>('dora');

  if (!m || !proc) return null;
  const { totals: t, ai } = m;
  const origin = proc.labels.AI_ORIGIN as Record<string, string>;
  const kind = proc.labels.KIND as Record<string, string>;

  // AI Quality Pass Rate (Accepted without changes / Decided)
  const aiPassRate = ai.decided > 0 ? Math.round(((ai.byResult.accepted || 0) / ai.decided) * 100) : 100;
  const bugsTotal = t.bugs?.total || 0;
  const bugsOpen = t.bugs?.open || 0;
  const bugsS1S2 = (t.bugs?.bySeverity?.S1 || 0) + (t.bugs?.bySeverity?.S2 || 0);

  // Maximum days for relative duration comparison in steps table
  const maxStepAvgDays = Math.max(...m.steps.map((s) => s.avgDays || 0), 1);
  const maxToolUsage = Math.max(...ai.tools.map((x) => x.n), 1);

  return (
    <>
      <PageHeader
        title="Báo cáo & Đo lường Hiệu suất (SDLC Analytics)"
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Cập nhật lúc {fmt(m.generatedAt)}
          </Typography.Text>
        }
      />

      {/* 4 Executive KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card
            size="small"
            className="hover-lift"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Statistic
              title={<Space size={6}><ApartmentOutlined style={{ color: '#1677ff' }} /> Quy mô Danh mục</Space>}
              value={t.projects}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>dự án · {t.tracks} hạng mục</Typography.Text>}
              valueStyle={{ fontWeight: 700, color: '#1677ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Đang chạy: <b>{t.active}</b> · Hoàn tất: <b>{t.done}</b>
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            size="small"
            className="hover-lift"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Statistic
              title={<Space size={6}><ThunderboltOutlined style={{ color: '#52c41a' }} /> Tỷ lệ Duyệt AI Thành công</Space>}
              value={ai.decided > 0 ? aiPassRate : 100}
              suffix="%"
              valueStyle={{ fontWeight: 700, color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {ai.decided} lượt duyệt (loại: {pct(ai.rejectRate)} · sửa: {pct(ai.editRate)})
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            size="small"
            className="hover-lift"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Statistic
              title={<Space size={6}><BugOutlined style={{ color: bugsS1S2 > 0 ? '#ff4d4f' : '#52c41a' }} /> Kiểm soát Bug S1/S2</Space>}
              value={bugsS1S2}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>/ {bugsOpen} bug mở</Typography.Text>}
              valueStyle={{ fontWeight: 700, color: bugsS1S2 > 0 ? '#ff4d4f' : '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {bugsS1S2 > 0 ? <Tag color="error">Chặn Gate 4</Tag> : <Tag color="success">Đủ điều kiện Gate 4</Tag>}
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card
            size="small"
            className="hover-lift"
            style={{
              borderRadius: 8,
              background: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#f0f0f0',
            }}
          >
            <Statistic
              title={<Space size={6}><ClockCircleOutlined style={{ color: t.overdue > 0 ? '#faad14' : '#52c41a' }} /> Điểm nghẽn & Quá hạn</Space>}
              value={t.overdue}
              suffix="bước trễ hạn"
              valueStyle={{ fontWeight: 700, color: t.overdue > 0 ? '#faad14' : '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {ai.byResult.pending > 0 ? `${ai.byResult.pending} mục AI chờ duyệt` : 'Không có AI chờ duyệt'}
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Container */}
      <Card
        style={{
          borderRadius: 8,
          background: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#f0f0f0',
        }}
        bodyStyle={{ padding: '8px 20px 20px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'dora',
              label: (
                <Space>
                  <RocketOutlined />
                  <span>Chỉ số DORA & Tăng tốc AI</span>
                  {m.dora && (
                    <Tag color={DORA_LEVEL_CONFIG[m.dora.leadTime.level]?.color || 'default'} style={{ margin: 0 }}>
                      {DORA_LEVEL_CONFIG[m.dora.leadTime.level]?.label}
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                    message="Khung Đo lường DORA (DevOps Research and Assessment) & Hiệu quả Tăng tốc bằng AI"
                    description="4 chỉ số DORA tiêu chuẩn quốc tế giúp đánh giá tốc độ và độ tin cậy của quy trình phân phối phần mềm, kết hợp với đo lường hệ số tăng tốc thực tế khi ứng dụng AI qua từng bước."
                  />

                  {/* 4 DORA Cards */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        title={<Space><RocketOutlined style={{ color: '#1677ff' }} /> Tần suất Triển khai (DF)</Space>}
                        extra={<Tag color={DORA_LEVEL_CONFIG[m.dora?.deploymentFrequency.level || 'unknown'].color}>{DORA_LEVEL_CONFIG[m.dora?.deploymentFrequency.level || 'unknown'].text}</Tag>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <Statistic
                          value={m.dora?.deploymentFrequency.count ?? 0}
                          suffix={<span style={{ fontSize: 13, color: '#8c8c8c' }}>đợt phát hành</span>}
                          valueStyle={{ fontWeight: 700, color: '#1677ff' }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Số lượng bản phát hành hoàn tất Gate 5 (Triển khai & Nghiệm thu)
                          </Typography.Text>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        title={<Space><ClockCircleOutlined style={{ color: '#52c41a' }} /> Lead Time Thay đổi (LTC)</Space>}
                        extra={<Tag color={DORA_LEVEL_CONFIG[m.dora?.leadTime.level || 'unknown'].color}>{DORA_LEVEL_CONFIG[m.dora?.leadTime.level || 'unknown'].text}</Tag>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <Statistic
                          value={m.dora?.leadTime.days ?? (m.dora?.leadTime.avgDays ?? 0)}
                          suffix={<span style={{ fontSize: 13, color: '#8c8c8c' }}>ngày (Median)</span>}
                          valueStyle={{ fontWeight: 700, color: '#52c41a' }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Trung bình: <b>{d(m.dora?.leadTime.avgDays ?? null)}</b> · Từ Gate 1 đến Gate 5
                          </Typography.Text>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        title={<Space><BugOutlined style={{ color: '#faad14' }} /> Tỉ lệ Triển khai Lỗi (CFR)</Space>}
                        extra={<Tag color={DORA_LEVEL_CONFIG[m.dora?.changeFailureRate.level || 'unknown'].color}>{DORA_LEVEL_CONFIG[m.dora?.changeFailureRate.level || 'unknown'].text}</Tag>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <Statistic
                          value={m.dora?.changeFailureRate.rate ?? 0}
                          suffix="%"
                          valueStyle={{
                            fontWeight: 700,
                            color: (m.dora?.changeFailureRate.rate ?? 0) <= 5 ? '#52c41a' : (m.dora?.changeFailureRate.rate ?? 0) <= 15 ? '#faad14' : '#ff4d4f',
                          }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {m.dora?.changeFailureRate.failedCount ?? 0} đợt phát sinh lỗi nghiêm trọng (S1/S2)
                          </Typography.Text>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        title={<Space><ThunderboltOutlined style={{ color: '#722ed1' }} /> Thời gian Phục hồi (MTTR)</Space>}
                        extra={<Tag color={DORA_LEVEL_CONFIG[m.dora?.timeToRestore.level || 'unknown'].color}>{DORA_LEVEL_CONFIG[m.dora?.timeToRestore.level || 'unknown'].text}</Tag>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <Statistic
                          value={m.dora?.timeToRestore.days ?? (m.dora?.timeToRestore.avgDays ?? 0)}
                          suffix={<span style={{ fontSize: 13, color: '#8c8c8c' }}>ngày (Median)</span>}
                          valueStyle={{ fontWeight: 700, color: '#722ed1' }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Đã khắc phục: <b>{m.dora?.timeToRestore.count ?? 0}</b> bug · TB: {d(m.dora?.timeToRestore.avgDays ?? null)}
                          </Typography.Text>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* AI Acceleration Card */}
                  <Card
                    size="small"
                    title={<Space><FireOutlined style={{ color: '#eb2f96' }} /> Hệ số Tăng tốc Nhờ Ứng dụng AI (AI Speedup Analysis)</Space>}
                    style={{ marginBottom: 20, background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                  >
                    <Row gutter={[24, 16]} align="middle">
                      <Col xs={24} md={8}>
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Tốc độ rút ngắn trung bình</div>
                          <div style={{ fontSize: 36, fontWeight: 800, color: '#52c41a' }}>
                            {m.aiAcceleration?.speedupPct !== null ? `+${m.aiAcceleration?.speedupPct}%` : 'N/A'}
                          </div>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            so với thực hiện thuần thủ công
                          </Typography.Text>
                        </div>
                      </Col>
                      <Col xs={24} md={16}>
                        <Row gutter={[16, 16]}>
                          <Col xs={12}>
                            <Card size="small" style={{ background: isDark ? '#161b22' : '#ffffff' }}>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Bước có AI trợ lực (AI/Mixed)</Typography.Text>
                              <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff', marginTop: 4 }}>
                                {d(m.aiAcceleration?.avgAiDur ?? null)}
                              </div>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                Trên {m.aiAcceleration?.aiStepsCount ?? 0} bước đã hoàn tất
                              </Typography.Text>
                            </Card>
                          </Col>
                          <Col xs={12}>
                            <Card size="small" style={{ background: isDark ? '#161b22' : '#ffffff' }}>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Bước làm thủ công (Manual)</Typography.Text>
                              <div style={{ fontSize: 20, fontWeight: 700, color: '#8c8c8c', marginTop: 4 }}>
                                {d(m.aiAcceleration?.avgManualDur ?? null)}
                              </div>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                Trên {m.aiAcceleration?.manualStepsCount ?? 0} bước đã hoàn tất
                              </Typography.Text>
                            </Card>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>

                  {/* DORA Benchmark Guide Table */}
                  <Card
                    size="small"
                    title="Bảng Chuẩn Đo lường DORA Quốc tế (Google Cloud DORA Benchmarks)"
                    style={{ background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                  >
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={[
                        { key: '1', metric: 'Tần suất triển khai (Deployment Frequency)', elite: 'Nhiều lần trong ngày', high: '1 lần/tuần – 1 lần/tháng', medium: '1 lần/tháng – 6 tháng', low: '> 6 tháng' },
                        { key: '2', metric: 'Lead Time từ yêu cầu đến phát hành (Lead Time for Changes)', elite: '< 1 ngày', high: '1 ngày – 1 tuần', medium: '1 tuần – 1 tháng', low: '> 1 tháng' },
                        { key: '3', metric: 'Tỉ lệ triển khai lỗi nghiêm trọng (Change Failure Rate)', elite: '0% – 5%', high: '5% – 10%', medium: '10% – 15%', low: '> 15%' },
                        { key: '4', metric: 'Thời gian phục hồi dịch vụ (Time to Restore Service)', elite: '< 1 ngày', high: '< 3 ngày', medium: '< 1 tuần', low: '> 1 tuần' },
                      ]}
                      columns={[
                        { title: 'Chỉ số', dataIndex: 'metric', width: 280, render: (v) => <b>{v}</b> },
                        { title: <Tag color="success">Elite (Đỉnh cao)</Tag>, dataIndex: 'elite' },
                        { title: <Tag color="processing">High (Cao)</Tag>, dataIndex: 'high' },
                        { title: <Tag color="warning">Medium (Trung bình)</Tag>, dataIndex: 'medium' },
                        { title: <Tag color="error">Low (Cần cải thiện)</Tag>, dataIndex: 'low' },
                      ]}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'cycle-time',
              label: (
                <Space>
                  <ClockCircleOutlined />
                  <span>Thời gian Chu kỳ & Điểm nghẽn</span>
                  {Boolean(m.bottlenecks?.longestWaitGate || m.bottlenecks?.topOverdueSteps?.length) && (
                    <Badge dot style={{ backgroundColor: '#ff4d4f' }} />
                  )}
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {/* Bottlenecks Summary Banner */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={8}>
                      <Card
                        size="small"
                        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> Gate Chờ Duyệt Lâu Nhất</Space>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        {m.bottlenecks?.longestWaitGate ? (
                          <>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                              Gate {m.bottlenecks.longestWaitGate.id} ({m.bottlenecks.longestWaitGate.key})
                            </div>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              Thời gian chờ ký duyệt TB: <b>{d(m.bottlenecks.longestWaitGate.avgWait)}</b>
                            </Typography.Text>
                          </>
                        ) : (
                          <Typography.Text type="secondary">Chưa có dữ liệu Gate chờ duyệt</Typography.Text>
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card
                        size="small"
                        title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} /> Bước Trễ Hạn Nghiêm Trọng</Space>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>
                          {m.bottlenecks?.topOverdueSteps?.length || 0} bước
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {m.bottlenecks?.topOverdueSteps?.[0]
                            ? `Trễ nhất: Bước ${m.bottlenecks.topOverdueSteps[0].step} (+${m.bottlenecks.topOverdueSteps[0].late} ngày)`
                            : 'Không có bước nào trễ hạn'}
                        </Typography.Text>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card
                        size="small"
                        title={<Space><RobotOutlined style={{ color: '#1677ff' }} /> Tồn Đọng Kiểm Duyệt AI</Space>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700, color: (m.bottlenecks?.oldestPendingAiDays || 0) > 3 ? '#ff4d4f' : '#1677ff' }}>
                          {d(m.bottlenecks?.oldestPendingAiDays || 0)}
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {m.ai.byResult.pending > 0 ? `${m.ai.byResult.pending} mục đang chờ Human Gate duyệt` : 'Không có mục AI nào tồn đọng'}
                        </Typography.Text>
                      </Card>
                    </Col>
                  </Row>

                  {/* 5 Phase Cycle Times */}
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    Chu kỳ Thực hiện theo 5 Giai đoạn SDLC Chuẩn (Phased Cycle Time)
                  </Typography.Title>
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={m.cycleTime?.phases || []}
                    style={{ marginBottom: 24 }}
                    columns={[
                      {
                        title: 'Giai đoạn (Phase)',
                        dataIndex: 'name',
                        render: (v: string, r) => (
                          <Space direction="vertical" size={0}>
                            <Typography.Text strong>{v}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              Các bước: {r.steps.join(', ')}
                            </Typography.Text>
                          </Space>
                        ),
                      },
                      { title: 'Lượt xong', dataIndex: 'n', width: 90 },
                      {
                        title: 'Thời gian Trung bình',
                        dataIndex: 'avgDays',
                        width: 200,
                        sorter: (a, b) => (a.avgDays || 0) - (b.avgDays || 0),
                        render: (v: number | null) => (
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{d(v)}</div>
                            {v !== null && (
                              <Progress
                                percent={Math.min(100, Math.round((v / 14) * 100))}
                                showInfo={false}
                                size="small"
                                strokeColor={v > 7 ? '#ff4d4f' : v > 3 ? '#faad14' : '#52c41a'}
                              />
                            )}
                          </div>
                        ),
                      },
                      { title: 'Trung vị (Median)', dataIndex: 'medianDays', width: 140, render: d },
                      { title: 'Ngắn nhất', dataIndex: 'minDays', width: 110, render: d },
                      { title: 'Dài nhất', dataIndex: 'maxDays', width: 110, render: d },
                    ]}
                  />

                  {/* Top Overdue Steps Table */}
                  {Boolean(m.bottlenecks?.topOverdueSteps?.length) && (
                    <>
                      <Typography.Title level={5} style={{ marginBottom: 12 }}>
                        Top Điểm nghẽn Quá hạn Cần Xử lý Ngay
                      </Typography.Title>
                      <Table
                        size="small"
                        rowKey={(r) => `${r.project}:${r.track}:${r.step}`}
                        pagination={false}
                        dataSource={m.bottlenecks?.topOverdueSteps || []}
                        columns={[
                          {
                            title: 'Dự án › Hạng mục',
                            key: 'loc',
                            render: (_, r) => (
                              <Link to={`/p/${r.project}/t/${r.track}#${r.step}`}>
                                {r.projectName} › {r.trackName}
                              </Link>
                            ),
                          },
                          { title: 'Bước', dataIndex: 'step', width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
                          { title: 'Hạn chót', dataIndex: 'end', width: 110 },
                          { title: 'Đã trễ', dataIndex: 'late', width: 100, render: (v: number) => <Tag color="error">+{v} ngày</Tag> },
                          { title: 'Phụ trách', dataIndex: 'owners', render: (v: string[]) => v.join(', ') || '—' },
                        ]}
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'ai-velocity',
              label: (
                <Space>
                  <RobotOutlined />
                  <span>Hiệu suất AI (AI Velocity & Governance)</span>
                  <Badge count={ai.total} overflowCount={999} style={{ backgroundColor: '#1677ff' }} />
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {ai.total === 0 ? (
                    <Empty description="Chưa có nhật ký dùng AI nào được ghi nhận trong hệ thống" />
                  ) : (
                    <>
                      {/* Section 1: Visual Distribution Bars */}
                      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        {/* Origin Breakdown */}
                        <Col xs={24} md={12}>
                          <Card
                            size="small"
                            title={<Space><FireOutlined style={{ color: '#1677ff' }} /> Tỷ lệ Đóng góp AI trong Quy trình</Space>}
                            style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                          >
                            <div style={{ marginBottom: 12 }}>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Tổng cộng {ai.total} mục nhật ký được tạo
                              </Typography.Text>
                            </div>

                            {/* Stacked Visual Bar */}
                            <div
                              style={{
                                display: 'flex',
                                height: 24,
                                borderRadius: 6,
                                overflow: 'hidden',
                                background: isDark ? '#30363d' : '#e8e8e8',
                                marginBottom: 12,
                              }}
                            >
                              {ai.byOrigin.ai > 0 && (
                                <Tooltip title={`Hoàn toàn do AI: ${ai.byOrigin.ai} (${Math.round((ai.byOrigin.ai / ai.total) * 100)}%)`}>
                                  <div style={{ flex: ai.byOrigin.ai, background: '#1677ff' }} />
                                </Tooltip>
                              )}
                              {ai.byOrigin.mixed > 0 && (
                                <Tooltip title={`Người + AI kết hợp: ${ai.byOrigin.mixed} (${Math.round((ai.byOrigin.mixed / ai.total) * 100)}%)`}>
                                  <div style={{ flex: ai.byOrigin.mixed, background: '#722ed1' }} />
                                </Tooltip>
                              )}
                              {ai.byOrigin.manual > 0 && (
                                <Tooltip title={`Làm thủ công: ${ai.byOrigin.manual} (${Math.round((ai.byOrigin.manual / ai.total) * 100)}%)`}>
                                  <div style={{ flex: ai.byOrigin.manual, background: '#8c8c8c' }} />
                                </Tooltip>
                              )}
                            </div>

                            {/* Legend */}
                            <Flex justify="space-between" wrap gap={8}>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1677ff', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Hoàn toàn AI: <b>{ai.byOrigin.ai || 0}</b> ({Math.round(((ai.byOrigin.ai || 0) / ai.total) * 100)}%)</span>
                              </Space>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#722ed1', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Kết hợp Người+AI: <b>{ai.byOrigin.mixed || 0}</b> ({Math.round(((ai.byOrigin.mixed || 0) / ai.total) * 100)}%)</span>
                              </Space>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8c8c8c', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Thủ công: <b>{ai.byOrigin.manual || 0}</b> ({Math.round(((ai.byOrigin.manual || 0) / ai.total) * 100)}%)</span>
                              </Space>
                            </Flex>
                          </Card>
                        </Col>

                        {/* Human Gate Decision Breakdown */}
                        <Col xs={24} md={12}>
                          <Card
                            size="small"
                            title={<Space><SafetyCertificateOutlined style={{ color: '#52c41a' }} /> Kết quả Kiểm duyệt Human Gate</Space>}
                            style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                          >
                            <div style={{ marginBottom: 12 }}>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Đã kiểm duyệt: {ai.decided} mục {ai.oldestPendingDays > 0 ? `· Chờ lâu nhất: ${d(ai.oldestPendingDays)}` : ''}
                              </Typography.Text>
                            </div>

                            {/* Stacked Decision Bar */}
                            <div
                              style={{
                                display: 'flex',
                                height: 24,
                                borderRadius: 6,
                                overflow: 'hidden',
                                background: isDark ? '#30363d' : '#e8e8e8',
                                marginBottom: 12,
                              }}
                            >
                              {(ai.byResult.accepted || 0) > 0 && (
                                <Tooltip title={`Đạt / Chấp nhận ngay: ${ai.byResult.accepted} (${Math.round(((ai.byResult.accepted || 0) / (ai.decided || 1)) * 100)}%)`}>
                                  <div style={{ flex: ai.byResult.accepted, background: '#52c41a' }} />
                                </Tooltip>
                              )}
                              {(ai.byResult.edited || 0) > 0 && (
                                <Tooltip title={`Phải chỉnh sửa lại: ${ai.byResult.edited} (${Math.round(((ai.byResult.edited || 0) / (ai.decided || 1)) * 100)}%)`}>
                                  <div style={{ flex: ai.byResult.edited, background: '#faad14' }} />
                                </Tooltip>
                              )}
                              {(ai.byResult.rejected || 0) > 0 && (
                                <Tooltip title={`Bị loại bỏ: ${ai.byResult.rejected} (${Math.round(((ai.byResult.rejected || 0) / (ai.decided || 1)) * 100)}%)`}>
                                  <div style={{ flex: ai.byResult.rejected, background: '#ff4d4f' }} />
                                </Tooltip>
                              )}
                              {(ai.byResult.pending || 0) > 0 && (
                                <Tooltip title={`Đang chờ duyệt: ${ai.byResult.pending}`}>
                                  <div style={{ flex: ai.byResult.pending, background: '#1890ff', opacity: 0.6 }} />
                                </Tooltip>
                              )}
                            </div>

                            {/* Legend */}
                            <Flex justify="space-between" wrap gap={8}>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Đạt ngay: <b>{ai.byResult.accepted || 0}</b></span>
                              </Space>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#faad14', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Phải sửa: <b>{ai.byResult.edited || 0}</b></span>
                              </Space>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Bị loại: <b>{ai.byResult.rejected || 0}</b></span>
                              </Space>
                              <Space size={6}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1890ff', display: 'inline-block' }} />
                                <span style={{ fontSize: 12 }}>Chờ duyệt: <b>{ai.byResult.pending || 0}</b></span>
                              </Space>
                            </Flex>
                          </Card>
                        </Col>
                      </Row>

                      {/* Section 2: AI Tools Performance Table */}
                      <Typography.Title level={5} style={{ marginBottom: 12 }}>
                        Bảng Xếp hạng & Đo lường Hiệu quả từng Công cụ AI
                      </Typography.Title>
                      <Table
                        size="small"
                        rowKey="tool"
                        pagination={false}
                        dataSource={ai.tools}
                        columns={[
                          {
                            title: 'Công cụ AI',
                            dataIndex: 'tool',
                            render: (val: string) => (
                              <Space>
                                <Tag color="blue" style={{ fontFamily: 'var(--font-mono)' }}>{val}</Tag>
                              </Space>
                            ),
                          },
                          {
                            title: 'Khối lượng sử dụng',
                            dataIndex: 'n',
                            sorter: (a, b) => a.n - b.n,
                            render: (v: number) => (
                              <div style={{ minWidth: 160 }}>
                                <Flex justify="space-between" style={{ fontSize: 12, marginBottom: 2 }}>
                                  <span><b>{v}</b> lượt</span>
                                  <Typography.Text type="secondary">{Math.round((v / ai.total) * 100)}%</Typography.Text>
                                </Flex>
                                <Progress percent={Math.round((v / maxToolUsage) * 100)} showInfo={false} size="small" strokeColor="#1677ff" />
                              </div>
                            ),
                          },
                          {
                            title: 'Phải sửa',
                            dataIndex: 'edited',
                            width: 110,
                            render: (v: number, r) => (
                              <Tag color={v > 0 ? 'warning' : 'default'}>
                                {v} {r.n > 0 ? `(${Math.round((v / r.n) * 100)}%)` : ''}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Bị loại bỏ',
                            dataIndex: 'rejected',
                            width: 110,
                            render: (v: number, r) => (
                              <Tag color={v > 0 ? 'error' : 'default'}>
                                {v} {r.n > 0 ? `(${Math.round((v / r.n) * 100)}%)` : ''}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Chất lượng chấp nhận ngay',
                            key: 'passRate',
                            render: (_, r) => {
                              const pass = r.n - (r.edited + r.rejected);
                              const rate = r.n > 0 ? Math.round((pass / r.n) * 100) : 100;
                              return (
                                <Tag color={rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'error'}>
                                  {rate}%
                                </Tag>
                              );
                            },
                          },
                        ] as TableColumnsType<Metrics['ai']['tools'][number]>}
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'quality-gates',
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  <span>Quality Gates & Bugs</span>
                  {bugsS1S2 > 0 && <Badge count={bugsS1S2} style={{ backgroundColor: '#ff4d4f' }} />}
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {/* Bugs Summary Row */}
                  <Card
                    size="small"
                    title={<Space><BugOutlined style={{ color: '#ff4d4f' }} /> Tình trạng Kiểm soát Lỗi (Bug Defect Density)</Space>}
                    style={{ marginBottom: 16, background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="S1 — Blocker"
                          value={t.bugs?.bySeverity?.S1 || 0}
                          valueStyle={{ color: (t.bugs?.bySeverity?.S1 || 0) > 0 ? '#ff4d4f' : '#8c8c8c', fontWeight: 600 }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="S2 — Critical"
                          value={t.bugs?.bySeverity?.S2 || 0}
                          valueStyle={{ color: (t.bugs?.bySeverity?.S2 || 0) > 0 ? '#fa8c16' : '#8c8c8c', fontWeight: 600 }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="S3 — Major"
                          value={t.bugs?.bySeverity?.S3 || 0}
                          valueStyle={{ color: (t.bugs?.bySeverity?.S3 || 0) > 0 ? '#faad14' : '#8c8c8c', fontWeight: 600 }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="S4 — Minor"
                          value={t.bugs?.bySeverity?.S4 || 0}
                          valueStyle={{ color: '#8c8c8c', fontWeight: 600 }}
                        />
                      </Col>
                    </Row>
                  </Card>

                  {/* Gates Table */}
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    Chỉ số 8 Quality Gates (Tỷ lệ Đạt / Không đạt & Thời gian chờ ký)
                  </Typography.Title>
                  {m.gates.length === 0 ? (
                    <Empty description="Chưa có Quality Gate nào được ký trong hệ thống" />
                  ) : (
                    <Table
                      size="small"
                      rowKey="key"
                      pagination={false}
                      dataSource={m.gates}
                      columns={[
                        {
                          title: 'Quality Gate',
                          dataIndex: 'id',
                          render: (val: string, r) => {
                            const pg = proc.gates.find((g) => g.key === r.key);
                            return (
                              <div>
                                <Typography.Text strong>{val}</Typography.Text>
                                {pg?.roles && (
                                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                    Vai trò RACI: {pg.roles.join(', ')} (tại bước {pg.at})
                                  </Typography.Text>
                                )}
                              </div>
                            );
                          },
                        },
                        { title: 'Lượt ký', dataIndex: 'signed', width: 90 },
                        {
                          title: 'Đạt',
                          dataIndex: 'pass',
                          width: 80,
                          render: (v: number) => <Tag color="success">{v}</Tag>,
                        },
                        {
                          title: 'Không đạt',
                          dataIndex: 'fail',
                          width: 90,
                          render: (v: number) => (v > 0 ? <Tag color="error">{v}</Tag> : <Tag>0</Tag>),
                        },
                        {
                          title: 'Tỉ lệ trượt',
                          dataIndex: 'failRate',
                          width: 120,
                          sorter: (a, b) => a.failRate - b.failRate,
                          render: (v: number) => (
                            <Tag color={v >= 30 ? 'error' : v > 0 ? 'warning' : 'success'}>
                              {v}%
                            </Tag>
                          ),
                        },
                        {
                          title: 'Chờ ký trung bình',
                          dataIndex: 'avgWaitDays',
                          width: 150,
                          render: d,
                        },
                      ] as TableColumnsType<Metrics['gates'][number]>}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'overview',
              label: (
                <Space>
                  <BarChartOutlined />
                  <span>Dự án & Chu kỳ Bước (Cycle Time)</span>
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    Tiến độ Tổng thể theo Từng Dự án
                  </Typography.Title>
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={m.projects}
                    scroll={{ x: 'max-content' }}
                    style={{ marginBottom: 24 }}
                    columns={[
                      {
                        title: 'Dự án',
                        dataIndex: 'name',
                        render: (v: string, r) => (
                          <Link to={`/p/${r.id}`} style={{ fontWeight: 600 }}>
                            {v}
                          </Link>
                        ),
                      },
                      {
                        title: 'Tiến độ TB',
                        dataIndex: 'pct',
                        width: 200,
                        render: (v: number) => (
                          <Progress
                            percent={v}
                            size="small"
                            strokeColor={v === 100 ? '#52c41a' : '#1677ff'}
                            style={{ margin: 0 }}
                          />
                        ),
                      },
                      { title: 'Đang chạy', dataIndex: 'active', width: 90 },
                      { title: 'Đã xong', dataIndex: 'done', width: 90 },
                      {
                        title: 'Quá hạn',
                        dataIndex: 'overdue',
                        width: 90,
                        render: (v: number) => (v ? <Tag color="error">{v}</Tag> : 0),
                      },
                      {
                        title: 'AI chờ duyệt',
                        dataIndex: 'aiPending',
                        width: 110,
                        render: (v: number) => (v ? <Tag color="warning">{v}</Tag> : 0),
                      },
                    ] as TableColumnsType<Metrics['projects'][number]>}
                  />

                  <Typography.Title level={5} style={{ marginBottom: 12 }}>
                    Thời gian Chu kỳ thực hiện từng Bước (Lead Time từ Bắt đầu ➔ Xong)
                  </Typography.Title>
                  {m.steps.length === 0 ? (
                    <Empty description="Chưa có bước nào ghi đủ mốc bắt đầu & hoàn thành để đo lường" />
                  ) : (
                    <Table
                      size="small"
                      rowKey="code"
                      pagination={false}
                      dataSource={m.steps}
                      columns={[
                        {
                          title: 'Bước',
                          key: 'step',
                          render: (_, r) => (
                            <Space>
                              <Tag color="blue" style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</Tag>
                              <span>{r.name}</span>
                            </Space>
                          ),
                        },
                        { title: 'Số lần hoàn thành', dataIndex: 'n', width: 140 },
                        {
                          title: 'Thời gian Trung bình',
                          dataIndex: 'avgDays',
                          sorter: (a, b) => (a.avgDays || 0) - (b.avgDays || 0),
                          render: (v: number | null) => (
                            <div style={{ minWidth: 160 }}>
                              <Flex justify="space-between" style={{ fontSize: 12, marginBottom: 2 }}>
                                <span><b>{d(v)}</b></span>
                              </Flex>
                              {v !== null && (
                                <Progress
                                  percent={Math.round((v / maxStepAvgDays) * 100)}
                                  showInfo={false}
                                  size="small"
                                  strokeColor="#fa8c16"
                                />
                              )}
                            </div>
                          ),
                        },
                        { title: 'Dài nhất', dataIndex: 'maxDays', width: 120, render: d },
                      ] as TableColumnsType<Metrics['steps'][number]>}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'workload',
              label: (
                <Space>
                  <TeamOutlined />
                  <span>Tải Nhân sự & Quá hạn</span>
                  {t.overdue > 0 && <Badge count={t.overdue} style={{ backgroundColor: '#ff4d4f' }} />}
                </Space>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                      <Card
                        size="small"
                        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> Danh sách Bước Đang Quá Hạn ({t.overdue})</Space>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        {m.overdue.length === 0 ? (
                          <CelebrationZeroOverdue />
                        ) : (
                          <Table
                            size="small"
                            rowKey={(r) => `${r.project}:${r.track}:${r.step}`}
                            pagination={false}
                            dataSource={m.overdue}
                            scroll={{ x: 'max-content' }}
                            columns={[
                              {
                                title: 'Dự án › Hạng mục',
                                key: 'w',
                                render: (_, r) => (
                                  <Link to={`/p/${r.project}/t/${r.track}#${r.step}`}>
                                    {r.projectName} › {r.trackName}
                                  </Link>
                                ),
                              },
                              {
                                title: 'Bước',
                                dataIndex: 'step',
                                width: 80,
                                render: (v: string) => <Tag color="blue">{v}</Tag>,
                              },
                              { title: 'Hạn', dataIndex: 'end', width: 110 },
                              {
                                title: 'Trễ',
                                dataIndex: 'late',
                                width: 90,
                                render: (v: number) => <Tag color="error">+{v} ngày</Tag>,
                              },
                              {
                                title: 'Phụ trách',
                                dataIndex: 'owners',
                                render: (v: string[]) => v.join(', ') || '—',
                              },
                            ] as TableColumnsType<Metrics['overdue'][number]>}
                          />
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                      <Card
                        size="small"
                        title={<Space><TeamOutlined style={{ color: '#1677ff' }} /> Phân bổ Việc Mở theo Nhân sự</Space>}
                        style={{ height: '100%', background: isDark ? '#1c2128' : '#fafafa', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
                      >
                        {m.load.length === 0 ? (
                          <Empty description="Chưa có ai được giao việc trong hệ thống" />
                        ) : (
                          <Table
                            size="small"
                            rowKey="userId"
                            pagination={false}
                            dataSource={m.load}
                            columns={[
                              {
                                title: 'Thành viên',
                                dataIndex: 'name',
                                render: (name: string) => (
                                  <Space>
                                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                                      {name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography.Text strong>{name}</Typography.Text>
                                  </Space>
                                ),
                              },
                              { title: 'Đang mở', dataIndex: 'open', width: 90 },
                              {
                                title: 'Quá hạn',
                                dataIndex: 'overdue',
                                width: 90,
                                render: (v: number) => (v ? <Tag color="error">{v}</Tag> : <Tag color="success">0</Tag>),
                              },
                            ] as TableColumnsType<Metrics['load'][number]>}
                          />
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

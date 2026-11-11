// Trang Việc của tôi (Linear "My Issues" style):
// Tab lọc nhanh: Tất cả / Bước phụ trách / Gate chờ ký / AI chờ duyệt
// Hàng tác vụ gọn gàng, hỗ trợ thao tác duyệt AI 1-click trực tiếp
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Progress,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  RightOutlined,
  RobotOutlined,
  SafetyCertificateFilled,
  SyncOutlined,
} from '@ant-design/icons';
import { api, useMyTasks, useProcess, useProjectMutation } from '../api';
import { PageHeader } from '../components';
import type { MyTasks, Project } from '../types';
import { fmt, STEP_COLOR } from '../util';
import { useTheme } from '../ThemeContext';
import { CelebrationZeroOverdue } from '../EmptyStates';

export default function Tasks() {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const { token } = theme.useToken();
  const proc = useProcess().data;
  const q = useMyTasks();
  const [filter, setFilter] = useState<string>('all');

  const review = useProjectMutation((v: { project: string; id: string; result: 'accepted' | 'edited' | 'rejected' }) =>
    api<Project>('PUT', `/api/projects/${v.project}/ai-logs/${v.id}/review`, { result: v.result }));

  if (!proc || q.isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (q.isError) return <Card><Empty description={`Không tải được dữ liệu: ${q.error.message}`}><a onClick={() => q.refetch()}>Thử lại</a></Empty></Card>;

  const t = q.data!;
  const total = t.steps.length + t.gates.length + t.reviews.length;

  return (
    <>
      <PageHeader
        title="Việc của tôi"
        extra={
          <Segmented
            value={filter}
            onChange={(val) => setFilter(val as string)}
            options={[
              { value: 'all', label: `Tất cả (${total})` },
              { value: 'steps', label: `Bước phụ trách (${t.steps.length})` },
              { value: 'gates', label: `Gate chờ ký (${t.gates.length})` },
              { value: 'reviews', label: `AI chờ duyệt (${t.reviews.length})` },
            ]}
          />
        }
      />

      {total === 0 ? (
        <CelebrationZeroOverdue style={{ padding: '36px 16px' }} />
      ) : (
        <Flex vertical gap={12}>
          {/* PHẦN 1: BƯỚC ĐƯỢC GIAO */}
          {(filter === 'all' || filter === 'steps') && t.steps.length > 0 && (
            <Card
              size="small"
              title={
                <Space size={8}>
                  <CheckCircleFilled style={{ color: '#1677ff' }} />
                  <span>Bước được giao phụ trách ({t.steps.length})</span>
                </Space>
              }
              style={{ borderRadius: 10, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
            >
              <Flex vertical gap={8}>
                {t.steps.map((r) => (
                  <div
                    key={`${r.project}:${r.track}:${r.step}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isDark ? '#1c2128' : '#f8fafc',
                      border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <Flex align="center" gap={12} style={{ minWidth: 260, flex: 1 }}>
                      <Tag color="blue" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginInlineEnd: 0 }}>
                        {r.step}
                      </Tag>
                      <div>
                        <Link to={`/p/${r.project}/t/${r.track}#${r.step}`} style={{ fontWeight: 600, fontSize: 14 }}>
                          {r.stepName}
                        </Link>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          {r.projectName} › {r.trackName}
                        </Typography.Text>
                      </div>
                    </Flex>

                    <Flex align="center" gap={16} wrap>
                      <Tag color={STEP_COLOR[r.status]}>{proc.labels.STATUS[r.status]}</Tag>
                      <div style={{ width: 100 }}>
                        <Progress percent={r.pct} size="small" />
                      </div>
                      {r.end ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Hạn: {r.end}
                        </Typography.Text>
                      ) : null}
                      <Link to={`/p/${r.project}/t/${r.track}#${r.step}`}>
                        <Button size="small" type="link">
                          Mở bước <RightOutlined style={{ fontSize: 11 }} />
                        </Button>
                      </Link>
                    </Flex>
                  </div>
                ))}
              </Flex>
            </Card>
          )}

          {/* PHẦN 2: GATE CHỜ KÝ */}
          {(filter === 'all' || filter === 'gates') && t.gates.length > 0 && (
            <Card
              size="small"
              title={
                <Space size={8}>
                  <SafetyCertificateFilled style={{ color: '#d97706' }} />
                  <span>Gate đang chờ vai trò của bạn nghiệm thu ({t.gates.length})</span>
                </Space>
              }
              style={{ borderRadius: 10, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
            >
              <Flex vertical gap={8}>
                {t.gates.map((r) => (
                  <div
                    key={`${r.project}:${r.track}:${r.gate}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: isDark ? 'rgba(217, 119, 6, 0.08)' : '#fffbe6',
                      border: `1.5px solid ${isDark ? 'rgba(217, 119, 6, 0.25)' : '#ffe58f'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <Tag color="warning" style={{ fontWeight: 700, marginInlineEnd: 0 }}>
                          ⛔ {r.gateId}
                        </Tag>
                        <Link to={`/p/${r.project}/t/${r.track}#${r.at}`} style={{ fontWeight: 600 }}>
                          {r.projectName} › {r.trackName}
                        </Link>
                      </Flex>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Điều kiện duyệt: <b>{r.check}</b>
                      </Typography.Text>
                    </div>

                    <Link to={`/p/${r.project}/t/${r.track}#${r.at}`}>
                      <Button type="primary" size="small">
                        Ký duyệt Gate →
                      </Button>
                    </Link>
                  </div>
                ))}
              </Flex>
            </Card>
          )}

          {/* PHẦN 3: NỘI DUNG AI CẦN DUYỆT */}
          {(filter === 'all' || filter === 'reviews') && t.reviews.length > 0 && (
            <Card
              size="small"
              title={
                <Space size={8}>
                  <RobotOutlined style={{ color: '#722ed1' }} />
                  <span>Nội dung AI chờ bạn duyệt ({t.reviews.length})</span>
                </Space>
              }
              extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Người duyệt phải khác tác giả</Typography.Text>}
              style={{ borderRadius: 10, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}
            >
              <Flex vertical gap={8}>
                {t.reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: isDark ? '#1c2128' : '#fafafa',
                      border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <Tag color="purple" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.step}</Tag>
                        <Typography.Text strong style={{ fontSize: 14 }}>{r.purpose}</Typography.Text>
                      </Flex>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {r.projectName} › {r.trackName} · Công cụ: <b>{r.tool}</b> · Bởi: {r.byName} ({fmt(r.at)})
                      </Typography.Text>
                    </div>

                    <Space size={8}>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() =>
                          review.mutate(
                            { project: r.project, id: r.id, result: 'accepted' },
                            { onSuccess: () => message.success('Đã chấp thuận nhật ký AI'), onError: (e) => message.error(e.message) }
                          )
                        }
                      >
                        ✓ Đạt (Chấp thuận)
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          review.mutate(
                            { project: r.project, id: r.id, result: 'edited' },
                            { onSuccess: () => message.success('Đã ghi nhận Đã chỉnh sửa'), onError: (e) => message.error(e.message) }
                          )
                        }
                      >
                        Đã sửa
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() =>
                          review.mutate(
                            { project: r.project, id: r.id, result: 'rejected' },
                            { onSuccess: () => message.success('Đã từ chối kết quả AI'), onError: (e) => message.error(e.message) }
                          )
                        }
                      >
                        Từ chối
                      </Button>
                    </Space>
                  </div>
                ))}
              </Flex>
            </Card>
          )}
        </Flex>
      )}
    </>
  );
}

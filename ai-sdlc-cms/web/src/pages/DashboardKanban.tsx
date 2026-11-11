import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Card,
  Empty,
  Flex,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import {
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Kind, Process, Project, Track, TrackView, User } from '../types';
import { fold, isMine, KIND_COLOR } from '../util';
import { useTheme } from '../ThemeContext';

export type State = 'failed' | 'blocked' | 'active' | 'done';

export interface KanbanFilters {
  q: string;
  kind?: Kind;
  state?: State;
  mine: boolean;
  archived: boolean;
}

export interface KanbanItem {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  visibility?: 'public' | 'private';
  trackId: string;
  name: string;
  kind: Kind | 'base';
  view: TrackView;
  track: Track;
  phaseId: string;
  isBase: boolean;
  owners: string[];
  openBugs: number;
}

interface DashboardKanbanProps {
  projects: Project[];
  proc: Process;
  users: User[];
  me: User;
  filters: KanbanFilters;
}

const PHASE_COLORS: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  G1: { bg: 'rgba(22, 119, 255, 0.06)', border: '#1677ff', accent: '#1677ff', label: '1. Khởi động' },
  G2: { bg: 'rgba(19, 194, 194, 0.06)', border: '#13c2c2', accent: '#13c2c2', label: '2. Khám phá (Gate 1)' },
  G3: { bg: 'rgba(114, 46, 209, 0.06)', border: '#722ed1', accent: '#722ed1', label: '3. Thiết kế (Gate 2)' },
  G4: { bg: 'rgba(250, 140, 22, 0.06)', border: '#fa8c16', accent: '#fa8c16', label: '4. Phát triển (Gate 3, 4)' },
  G5: { bg: 'rgba(82, 196, 26, 0.06)', border: '#52c41a', accent: '#52c41a', label: '5. Phát hành (Gate 5)' },
  done: { bg: 'rgba(5, 150, 105, 0.06)', border: '#059669', accent: '#059669', label: 'Hoàn tất 100%' },
};

export default function DashboardKanban({ projects, proc, users, me, filters }: DashboardKanbanProps) {
  const { isDark } = useTheme();
  const { token } = theme.useToken();

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name || '?';
  const gateId = (k: string | null) => proc.gates.find((g) => g.key === k)?.id || k;
  const stepName = (c: string) => proc.steps.find((s) => s.code === c)?.name || c;

  const items = useMemo(() => {
    const list: KanbanItem[] = [];
    const term = fold(filters.q.trim());

    for (const p of projects) {
      if (!filters.archived && p.archived) continue;

      // Base track
      const basePassMine = !filters.mine || isMine(p.base, me.id);
      const basePassKind = !filters.kind;
      const baseView = p.view.base;
      const baseState: State = baseView.failed.length ? 'failed' : baseView.blocking ? 'blocked' : !baseView.current ? 'done' : 'active';
      const basePassState = !filters.state || baseState === filters.state;
      const baseText = fold(`${p.name} ${p.code || ''} Nền tảng B1 B2`);
      const basePassSearch = !term || baseText.includes(term);

      if (basePassMine && basePassKind && basePassState && basePassSearch) {
        const ph = !baseView.current || baseView.pct === 100 ? 'done' : 'G1';
        const curStep = baseView.current ? p.base.steps[baseView.current] : null;
        list.push({
          id: `${p.id}:base`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          visibility: p.visibility,
          trackId: 'base',
          name: 'Nền tảng (B1–B2)',
          kind: 'base',
          view: baseView,
          track: p.base,
          phaseId: ph,
          isBase: true,
          owners: curStep?.owners.map(nameOf) || [],
          openBugs: 0,
        });
      }

      // Items
      for (const item of p.items) {
        if (!filters.archived && item.archived) continue;
        const iview = p.view.items[item.id];
        if (!iview) continue;

        const istate: State = iview.failed.length ? 'failed' : iview.blocking ? 'blocked' : !iview.current ? 'done' : 'active';
        if (filters.mine && !isMine(item, me.id)) continue;
        if (filters.kind && item.kind !== filters.kind) continue;
        if (filters.state && istate !== filters.state) continue;
        const itemText = fold(`${p.name} ${p.code || ''} ${item.name} ${item.crCode || ''}`);
        if (term && !itemText.includes(term)) continue;

        let ph = 'G2';
        if (!iview.current || iview.pct === 100) {
          ph = 'done';
        } else {
          const found = proc.phases.find((x) => x.steps.includes(iview.current!));
          if (found) ph = found.id;
        }

        const curStep = iview.current ? item.steps[iview.current] : null;
        const openBugs = (p.bugs || []).filter((b) => b.track === item.id && b.status !== 'closed').length;

        list.push({
          id: `${p.id}:${item.id}`,
          projectId: p.id,
          projectName: p.name,
          projectCode: p.code,
          visibility: p.visibility,
          trackId: item.id,
          name: item.name,
          kind: item.kind,
          view: iview,
          track: item,
          phaseId: ph,
          isBase: false,
          owners: curStep?.owners.map(nameOf) || [],
          openBugs,
        });
      }
    }
    return list;
  }, [projects, proc, users, me, filters]);

  const columns = [
    { id: 'G1', title: '1. Khởi động', sub: 'B1–B2' },
    { id: 'G2', title: '2. Khám phá', sub: 'B3–B5 · Gate 1' },
    { id: 'G3', title: '3. Thiết kế', sub: 'B6–B8 · Gate 2' },
    { id: 'G4', title: '4. Phát triển', sub: 'B9–B12 · Gate 3, 4' },
    { id: 'G5', title: '5. Phát hành', sub: 'B13–B14 · Gate 5' },
    { id: 'done', title: 'Đã hoàn tất', sub: '100% các bước' },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <Flex gap={16} align="flex-start" style={{ minWidth: 1200 }}>
        {columns.map((col) => {
          const colItems = items.filter((x) => x.phaseId === col.id);
          const meta = PHASE_COLORS[col.id] || PHASE_COLORS.G1;

          return (
            <div
              key={col.id}
              style={{
                flex: '1 1 0',
                minWidth: 260,
                maxWidth: 340,
                background: isDark ? '#161b22' : '#fcfcfd',
                borderRadius: 8,
                border: isDark ? '1px solid #30363d' : '1px solid #e1e4e8',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 250px)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: isDark ? '1px solid #21262d' : '1px solid #f0f0f0',
                  borderTop: `3px solid ${meta.accent}`,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  background: isDark ? '#1c2128' : '#fafbfc',
                }}
              >
                <Flex justify="space-between" align="center">
                  <div>
                    <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
                      {col.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {col.sub}
                    </Typography.Text>
                  </div>
                  <Badge
                    count={colItems.length}
                    style={{
                      backgroundColor: colItems.length ? meta.accent : token.colorTextQuaternary,
                    }}
                  />
                </Flex>
              </div>

              {/* Cards Container */}
              <div
                style={{
                  padding: 10,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flex: 1,
                }}
              >
                {colItems.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span style={{ fontSize: 12 }}>Không có hạng mục</span>}
                    style={{ margin: '30px 0' }}
                  />
                ) : (
                  colItems.map((item) => {
                    const isDoing = item.view.current && item.track.steps[item.view.current]?.status === 'doing';
                    const targetUrl = `/p/${item.projectId}/t/${item.trackId}${item.view.current ? `#${item.view.current}` : ''}`;

                    return (
                      <div
                        key={item.id}
                        className="hover-lift"
                        style={{
                          background: isDark ? '#21262d' : '#ffffff',
                          borderRadius: 6,
                          border: isDark ? '1px solid #30363d' : '1px solid #e8e8e8',
                          padding: '12px 12px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          boxShadow: isDark
                            ? '0 1px 2px rgba(0,0,0,0.4)'
                            : '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Tags Top */}
                        <Flex justify="space-between" align="center" wrap gap={4}>
                          <Space size={4}>
                            <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }} color="blue">
                              {item.visibility === 'private' ? '🔒 ' : ''}{item.projectCode || item.projectName}
                            </Tag>
                            {item.kind === 'base' ? (
                              <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>
                                Nền tảng
                              </Tag>
                            ) : (
                              <Tag
                                color={KIND_COLOR[item.kind]}
                                style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}
                              >
                                {proc.labels.KIND[item.kind] || item.kind}
                              </Tag>
                            )}
                          </Space>
                          <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                            {item.view.pct}%
                          </Typography.Text>
                        </Flex>

                        {/* Title Link */}
                        <Link
                          to={targetUrl}
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: token.colorText,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.name}
                        </Link>

                        {/* Current Step / Gate Status */}
                        {item.view.current ? (
                          <Flex align="center" gap={6} wrap>
                            <Tag
                              className={isDoing ? 'pulse-dot-doing' : undefined}
                              color={isDoing ? 'gold' : 'default'}
                              style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                            >
                              {item.view.current} · {stepName(item.view.current)}
                            </Tag>
                          </Flex>
                        ) : (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, fontSize: 11 }}>
                            Đã hoàn tất
                          </Tag>
                        )}

                        {/* Blocking Gate alert */}
                        {item.view.failed.length > 0 && (
                          <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                            Gate {item.view.failed.map(gateId).join(', ')} không đạt
                          </Tag>
                        )}
                        {!item.view.failed.length && item.view.blocking && (
                          <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>
                            Chờ {gateId(item.view.blocking)}
                          </Tag>
                        )}

                        {/* Slim Progress */}
                        <Progress
                          percent={item.view.pct}
                          showInfo={false}
                          size="small"
                          strokeColor={item.view.pct === 100 ? '#52c41a' : meta.accent}
                          style={{ margin: '2px 0 0' }}
                        />

                        {/* Footer info: Owners & Bugs */}
                        <Flex justify="space-between" align="center" style={{ paddingTop: 4 }}>
                          {/* Owners */}
                          {item.owners.length > 0 ? (
                            <Tooltip title={`Phụ trách: ${item.owners.join(', ')}`}>
                              <Avatar.Group maxCount={3} size={20}>
                                {item.owners.map((name, i) => (
                                  <Avatar
                                    key={i}
                                    style={{
                                      backgroundColor: isDark ? '#30363d' : '#e6f4ff',
                                      color: isDark ? '#58a6ff' : '#1677ff',
                                      fontSize: 10,
                                    }}
                                  >
                                    {name.charAt(0).toUpperCase()}
                                  </Avatar>
                                ))}
                              </Avatar.Group>
                            </Tooltip>
                          ) : (
                            <Typography.Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                              Chưa giao
                            </Typography.Text>
                          )}

                          {/* Extra badges */}
                          <Space size={4}>
                            {item.openBugs > 0 && (
                              <Tooltip title={`${item.openBugs} bug chưa đóng`}>
                                <Tag
                                  icon={<BugOutlined />}
                                  color="error"
                                  style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}
                                >
                                  {item.openBugs}
                                </Tag>
                              </Tooltip>
                            )}
                            <Link to={targetUrl} style={{ fontSize: 11, display: 'flex', alignItems: 'center' }}>
                              <RightOutlined style={{ fontSize: 10 }} />
                            </Link>
                          </Space>
                        </Flex>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </Flex>
    </div>
  );
}

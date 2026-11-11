// Dashboard: Table dạng cây & Card Grid View + Portfolio Health Bar.
// Tìm kiếm (không dấu, phím tắt /), lọc (loại, tình trạng, việc của tôi), sắp xếp cột.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Alert,
  Card,
  Checkbox,
  Col,
  Empty,
  Flex,
  Input,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
  type InputRef,
  type TableColumnsType,
} from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  ProjectOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useProcess, useProjects, useUsers } from '../api';
import { Field, FilterBar, options, PageHeader, showTotal, Term } from '../components';
import type { Kind, Process, Project, Track, TrackView, User } from '../types';
import { fmt, fold, isMine, KIND_COLOR } from '../util';
import { useTheme } from '../ThemeContext';
import DashboardKanban from './DashboardKanban';
import { DashboardSkeleton } from '../SkeletonLoaders';
import { SearchNoResults } from '../EmptyStates';

const INTRO_KEY = 'intro-hidden';
const VIEW_MODE_KEY = 'dash-view-mode';
type State = 'failed' | 'blocked' | 'active' | 'done';
interface DashRow {
  key: string; isProject: boolean; project: Project; trackId: string; track: Track; view: TrackView;
  name: string; kind?: Kind; state: State; mine: boolean; pct: number; children?: DashRow[];
}
const STATE: Record<State, string> = { blocked: 'Đang chờ gate', failed: 'Gate không đạt', active: 'Đang chạy', done: 'Hoàn tất' };
const stateOf = (v: TrackView): State => (v.failed.length ? 'failed' : v.blocking ? 'blocked' : !v.current ? 'done' : 'active');
const CELL_BG = { todo: '#f0f0f0', doing: '#faad14', done: '#52c41a', skipped: 'repeating-linear-gradient(45deg,#f0f0f0 0 4px,#fff 4px 8px)' };
interface Filters { q: string; kind?: Kind; state?: State; mine: boolean; archived: boolean }
const EMPTY: Filters = { q: '', mine: false, archived: false };

function buildRows(projects: Project[], me: User, f: Filters): DashRow[] {
  const term = fold(f.q.trim());
  const narrowing = !!(f.kind || f.state || f.mine);
  const pass = (r: DashRow) => (!f.kind || r.kind === f.kind) && (!f.state || r.state === f.state) && (!f.mine || r.mine);
  return projects.filter((p) => f.archived || !p.archived).flatMap((p) => {
    const kids: DashRow[] = p.items.filter((i) => f.archived || !i.archived).map((i) => ({
      key: `${p.id}:${i.id}`, isProject: false, project: p, trackId: i.id, track: i, view: p.view.items[i.id], name: i.name,
      kind: i.kind, state: stateOf(p.view.items[i.id]), mine: isMine(i, me.id), pct: p.view.items[i.id].pct,
    }));
    const row: DashRow = {
      key: p.id, isProject: true, project: p, trackId: 'base', track: p.base, view: p.view.base, name: p.name,
      state: stateOf(p.view.base), mine: isMine(p.base, me.id),
      pct: kids.length ? Math.round(kids.reduce((n, c) => n + c.pct, 0) / kids.length) : p.view.base.pct,
    };
    if (term && !fold([p.name, p.code, ...kids.map((c) => c.name)].join(' ')).includes(term)) return [];
    if (!narrowing) return [{ ...row, children: kids.length ? kids : undefined }];
    // lọc: giữ dự án nếu nền tảng hoặc ít nhất 1 hạng mục khớp; chỉ hiện hạng mục khớp
    const keep = kids.filter(pass);
    return (!f.kind && pass(row)) || keep.length ? [{ ...row, children: keep.length ? keep : undefined }] : [];
  });
}

function gateText(proc: Process, v: TrackView) {
  const id = (k: string) => proc.gates.find((g) => g.key === k)?.id || k;
  if (v.failed.length) return <Typography.Text type="danger" strong>{v.failed.map(id).join(', ')} không đạt</Typography.Text>;
  if (v.blocking) return <Typography.Text type="warning" strong>{id(v.blocking)}</Typography.Text>;
  return '—';
}

export default function Dashboard() {
  const { user } = useOutletContext<{ user: User }>();
  const proc = useProcess().data;
  const projects = useProjects();
  const users = useUsers().data || [];
  const { isDark } = useTheme();
  const { token } = theme.useToken();
  const searchInputRef = useRef<InputRef>(null);

  const [f, setF] = useState<Filters>(EMPTY);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const rows = useMemo(() => buildRows(projects.data || [], user, f), [projects.data, user, f]);
  const [introHidden, setIntroHidden] = useState(() => { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } });
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'kanban' || saved === 'table' || saved === 'grid') return saved;
    } catch {}
    return 'kanban';
  });

  // Phím tắt / để focus vào ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewModeChange = (mode: string | number) => {
    const m = mode as 'kanban' | 'table' | 'grid';
    setViewMode(m);
    try { localStorage.setItem(VIEW_MODE_KEY, m); } catch {}
  };

  // Tính 4 chỉ số Portfolio Health Bar
  const healthStats = useMemo(() => {
    const list = projects.data || [];
    const today = dayjs().format('YYYY-MM-DD');
    let totalTracks = 0;
    let activeTracks = 0;
    let blockedOrFailedGates = 0;
    let overdueSteps = 0;
    let openS1S2Bugs = 0;
    let totalOpenBugs = 0;

    for (const p of list) {
      if (p.archived) continue;
      // Nền tảng
      totalTracks++;
      if (p.view.base.current) activeTracks++;
      if (p.view.base.failed.length > 0 || p.view.base.blocking) {
        blockedOrFailedGates += p.view.base.failed.length + (p.view.base.blocking ? 1 : 0);
      }
      for (const st of Object.values(p.base.steps)) {
        if (st.end && st.end < today && !['done', 'skipped'].includes(st.status)) {
          overdueSteps++;
        }
      }

      // Hạng mục
      for (const item of p.items) {
        if (item.archived) continue;
        totalTracks++;
        const v = p.view.items[item.id];
        if (v) {
          if (v.current) activeTracks++;
          if (v.failed.length > 0 || v.blocking) {
            blockedOrFailedGates += v.failed.length + (v.blocking ? 1 : 0);
          }
        }
        for (const st of Object.values(item.steps)) {
          if (st.end && st.end < today && !['done', 'skipped'].includes(st.status)) {
            overdueSteps++;
          }
        }
      }

      // Bugs
      if (p.bugs) {
        for (const b of p.bugs) {
          if (b.status !== 'closed') {
            totalOpenBugs++;
            if (b.severity === 'S1' || b.severity === 'S2') {
              openS1S2Bugs++;
            }
          }
        }
      }
    }

    return { totalTracks, activeTracks, blockedOrFailedGates, overdueSteps, openS1S2Bugs, totalOpenBugs };
  }, [projects.data]);

  if (projects.isLoading || !proc) return <DashboardSkeleton />;

  const L = proc.labels;
  const names = (ids: string[]) => ids.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(', ');

  const columns: TableColumnsType<DashRow> = [
    {
      title: 'Dự án / hạng mục', dataIndex: 'name', fixed: 'left', width: 300,
      sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
      render: (_, r) => r.isProject
        ? <Space><Link to={`/p/${r.project.id}`}><b>{r.name}</b></Link>{r.project.code && <Typography.Text type="secondary">{r.project.code}</Typography.Text>}{r.project.visibility === 'private' && <Tag color="purple">🔒</Tag>}{r.project.archived && <Tag>Lưu trữ</Tag>}</Space>
        : <Space><Link to={`/p/${r.project.id}/t/${r.trackId}`}>{r.name}</Link><Tag color={KIND_COLOR[r.kind!]}>{L.KIND[r.kind!]}</Tag></Space>,
    },
    ...proc.steps.map((st): TableColumnsType<DashRow>[number] => ({
      title: <Tooltip title={st.name}>{st.code}</Tooltip>, key: st.code, width: 44, align: 'center',
      render: (_, r) => {
        const v = r.track.steps[st.code];
        if (!v) return null;
        const pct = r.view.stepPct[st.code];
        const who = names(v.owners);
        return (
          <Tooltip title={`${st.code} · ${st.name} · ${L.STATUS[v.status]} · ${pct}%${who ? ' · ' + who : ''}`}>
            <Link to={`/p/${r.project.id}/t/${r.trackId}#${st.code}`} aria-label={`${st.code}: ${L.STATUS[v.status]}`}
              style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 4, background: CELL_BG[v.status], color: '#000', fontSize: 12, fontWeight: 600, border: v.status === 'skipped' ? '1px dashed #bfbfbf' : 0 }}>
              {v.status === 'doing' ? pct : ''}
            </Link>
          </Tooltip>
        );
      },
    })),
    { title: 'Hoàn thành', key: 'pct', width: 160, sorter: (a, b) => a.pct - b.pct, render: (_, r) => <Progress percent={r.view.pct} size="small" style={{ width: 120, margin: 0 }} /> },
    { title: 'Bước hiện tại', key: 'current', render: (_, r) => r.view.current || (r.isProject ? 'Nền tảng xong' : 'Hoàn tất') },
    { title: <Term k="gate">Gate chặn</Term>, key: 'gate', render: (_, r) => gateText(proc, r.view) },
    {
      title: 'Cập nhật', key: 'updated', defaultSortOrder: 'descend', sorter: (a, b) => a.project.updatedAt.localeCompare(b.project.updatedAt),
      render: (_, r) => (r.isProject ? fmt(r.project.updatedAt) : null),
    },
  ];

  return (
    <>
      {!introHidden && (
        <Alert
          showIcon closable type="info" style={{ marginBottom: 16 }}
          onClose={() => { try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* bỏ qua */ } setIntroHidden(true); }}
          message="Lần đầu dùng? Bắt đầu từ trang Việc của tôi để biết bạn cần làm gì"
          description={<>Bảng dưới là tiến độ của mọi dự án: mỗi ô là một bước (B1–B14). Ô B1–B2 là phần nền tảng làm một lần cho cả dự án. <Link to="/tasks">Việc của tôi</Link> · <Link to="/help">Hướng dẫn nhanh và thuật ngữ</Link></>}
        />
      )}

      {/* 4 KPI Widgets: Portfolio Health Bar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}>
            <Statistic
              title={<Space size={6}><CheckCircleOutlined style={{ color: '#1677ff' }} /> Hạng mục đang chạy</Space>}
              value={healthStats.activeTracks}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>/ {healthStats.totalTracks}</Typography.Text>}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}>
            <Statistic
              title={<Space size={6}><WarningOutlined style={{ color: healthStats.blockedOrFailedGates > 0 ? '#faad14' : '#52c41a' }} /> Gate chờ / không đạt</Space>}
              value={healthStats.blockedOrFailedGates}
              valueStyle={{ color: healthStats.blockedOrFailedGates > 0 ? '#faad14' : '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}>
            <Statistic
              title={<Space size={6}><ClockCircleOutlined style={{ color: healthStats.overdueSteps > 0 ? '#ff4d4f' : '#8c8c8c' }} /> Bước quá hạn</Space>}
              value={healthStats.overdueSteps}
              valueStyle={{ color: healthStats.overdueSteps > 0 ? '#ff4d4f' : undefined, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, background: isDark ? '#161b22' : '#ffffff', borderColor: isDark ? '#30363d' : '#f0f0f0' }}>
            <Statistic
              title={<Space size={6}><BugOutlined style={{ color: healthStats.openS1S2Bugs > 0 ? '#ff4d4f' : '#52c41a' }} /> Bug S1/S2 chưa đóng</Space>}
              value={healthStats.openS1S2Bugs}
              suffix={healthStats.totalOpenBugs > 0 ? <Typography.Text type="secondary" style={{ fontSize: 13 }}>({healthStats.totalOpenBugs} bug mở)</Typography.Text> : undefined}
              valueStyle={{ color: healthStats.openS1S2Bugs > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <PageHeader
        title="Tiến độ dự án"
        extra={
          <Segmented
            value={viewMode}
            onChange={handleViewModeChange}
            options={[
              { value: 'kanban', icon: <ProjectOutlined />, label: '⚡ Kanban 5 Giai đoạn' },
              { value: 'table', icon: <BarsOutlined />, label: 'Bảng tiến độ' },
              { value: 'grid', icon: <AppstoreOutlined />, label: 'Thẻ dự án' },
            ]}
          />
        }
      >
        <Space size="large" wrap style={{ marginTop: 8 }}>
          {(['todo', 'doing', 'done', 'skipped'] as const).map((k) => (
            <Space key={k} size={8}><span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: CELL_BG[k], border: k === 'skipped' ? '1px dashed #bfbfbf' : 0 }} />{L.STATUS[k]}</Space>
          ))}
        </Space>
      </PageHeader>

      <FilterBar onReset={() => setF(EMPTY)}>
        <Field label="Tìm kiếm" width={280}>
          <Input
            ref={searchInputRef}
            allowClear
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            placeholder="Tìm dự án, mã, hạng mục… (phím /)"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
          />
        </Field>
        <Field label="Loại hạng mục"><Select allowClear placeholder="Tất cả" value={f.kind} onChange={(kind) => setF({ ...f, kind })} options={options(L.KIND)} /></Field>
        <Field label="Tình trạng"><Select allowClear placeholder="Tất cả" value={f.state} onChange={(state) => setF({ ...f, state })} options={options(STATE)} /></Field>
        <Flex vertical gap={8}>
          <Checkbox checked={f.mine} onChange={(e) => setF({ ...f, mine: e.target.checked })}>Việc của tôi</Checkbox>
          <Checkbox checked={f.archived} onChange={(e) => setF({ ...f, archived: e.target.checked })}>Hiện cả mục lưu trữ</Checkbox>
        </Flex>
      </FilterBar>

      {viewMode === 'kanban' ? (
        <DashboardKanban
          projects={projects.data || []}
          proc={proc}
          users={users}
          me={user}
          filters={f}
        />
      ) : viewMode === 'table' ? (
        <Table<DashRow>
          rowKey="key" size="small" columns={columns} dataSource={rows} loading={projects.isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: showTotal('dự án') }}
          expandable={{
            expandedRowKeys: rows.filter((r) => !collapsed.has(r.key)).map((r) => r.key),
            onExpand: (open, r) => setCollapsed((s) => { const n = new Set(s); if (open) n.delete(r.key); else n.add(r.key); return n; }),
          }}
          locale={{ emptyText: (projects.data || []).length ? 'Không có dự án khớp điều kiện' : (
            <Empty description={user.admin ? 'Chưa có dự án nào' : 'Chưa có dự án nào — nhờ quản trị viên tạo dự án và thêm bạn vào'}>
              {user.admin && <Link to="/admin">Tạo dự án đầu tiên</Link>}
            </Empty>
          ) }}
        />
      ) : (
        /* Card Grid View */
        <Row gutter={[16, 16]}>
          {rows.length === 0 ? (
            <Col span={24}>
              <Card>
                <Empty description="Không có dự án khớp điều kiện tìm kiếm/lọc" />
              </Card>
            </Col>
          ) : (
            rows.map((row) => {
              const p = row.project;
              const items = row.children || [];
              const openBugs = (p.bugs || []).filter((b) => b.status !== 'closed');
              const s1s2Bugs = openBugs.filter((b) => b.severity === 'S1' || b.severity === 'S2');

              return (
                <Col key={p.id} xs={24} md={12} xl={8}>
                  <Card
                    className="hover-lift"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 10,
                      background: isDark ? '#161b22' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#f0f0f0',
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}
                    title={
                      <Flex justify="space-between" align="center" wrap gap={8}>
                        <Space>
                          <FolderOutlined style={{ color: isDark ? '#58a6ff' : '#0958d9' }} />
                          <Link to={`/p/${p.id}`} style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</Link>
                          {p.code && <Tag>{p.code}</Tag>}
                          {p.visibility === 'private' && <Tag color="purple">🔒 Nội bộ</Tag>}
                          {p.archived && <Tag>Lưu trữ</Tag>}
                        </Space>
                      </Flex>
                    }
                    extra={<Tag color="blue">{row.pct}% hoàn tất</Tag>}
                  >
                    <div>
                      <Progress
                        percent={row.pct}
                        size="small"
                        strokeColor={row.pct === 100 ? '#52c41a' : '#1677ff'}
                        trailColor={isDark ? '#30363d' : '#f0f0f0'}
                      />
                    </div>

                    {/* Nền tảng B1–B2 */}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: isDark ? '#1c2128' : '#fafafa',
                      border: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}`,
                    }}>
                      <Flex justify="space-between" align="center">
                        <Space size={6}>
                          <Typography.Text strong style={{ fontSize: 13 }}>Nền tảng (B1–B2)</Typography.Text>
                          <Tag color="cyan" style={{ marginInlineEnd: 0 }}>{p.view.base.pct}%</Tag>
                        </Space>
                        <Link to={`/p/${p.id}/t/base`} style={{ fontSize: 12 }}>
                          {p.view.base.current ? `Bước ${p.view.base.current}` : 'Đã xong'} <RightOutlined style={{ fontSize: 10 }} />
                        </Link>
                      </Flex>
                    </div>

                    {/* Danh sách Hạng mục */}
                    <div style={{ flex: 1 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        Hạng mục phát triển ({items.length})
                      </Typography.Text>
                      {items.length === 0 ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                          Chưa có hạng mục tính năng nào
                        </Typography.Text>
                      ) : (
                        <Flex vertical gap={6}>
                          {items.map((kid) => (
                            <div
                              key={kid.trackId}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                background: isDark ? '#21262d' : '#f8f9fa',
                                border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                              }}
                            >
                              <Flex justify="space-between" align="center">
                                <Space size={6} wrap>
                                  <Link to={`/p/${p.id}/t/${kid.trackId}`} style={{ fontWeight: 500, fontSize: 13 }}>
                                    {kid.name}
                                  </Link>
                                  {kid.kind && <Tag color={KIND_COLOR[kid.kind]} style={{ marginInlineEnd: 0 }}>{L.KIND[kid.kind]}</Tag>}
                                </Space>
                                <Space size={8}>
                                  {kid.view.failed.length > 0 ? (
                                    <Tag color="error">Gate lỗi</Tag>
                                  ) : kid.view.blocking ? (
                                    <Tag color="warning">Chờ gate</Tag>
                                  ) : kid.view.current ? (
                                    <Tag color="processing">{kid.view.current}</Tag>
                                  ) : (
                                    <Tag color="success">Xong</Tag>
                                  )}
                                  <Typography.Text strong style={{ fontSize: 12, minWidth: 32, textAlign: 'right' }}>
                                    {kid.pct}%
                                  </Typography.Text>
                                </Space>
                              </Flex>
                            </div>
                          ))}
                        </Flex>
                      )}
                    </div>

                    {/* Bottom Status / Badges */}
                    <Flex justify="space-between" align="center" style={{ paddingTop: 8, borderTop: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}` }}>
                      <Space size={6}>
                        {openBugs.length > 0 && (
                          <Tooltip title={`${openBugs.length} bug đang mở (${s1s2Bugs.length} nghiêm trọng)`}>
                            <Tag color={s1s2Bugs.length > 0 ? 'error' : 'warning'} icon={<BugOutlined />}>
                              {openBugs.length} bug
                            </Tag>
                          </Tooltip>
                        )}
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          Cập nhật: {fmt(p.updatedAt)}
                        </Typography.Text>
                      </Space>
                      <Link to={`/p/${p.id}`} style={{ fontSize: 12, fontWeight: 500 }}>
                        Vào dự án →
                      </Link>
                    </Flex>
                  </Card>
                </Col>
              );
            })
          )}
        </Row>
      )}
    </>
  );
}

// Trang dự án: tab Nền tảng + từng hạng mục; mỗi tab là các bước theo giai đoạn
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Alert, App, Badge, Button, Card, Col, Collapse, Descriptions, Flex, Form, Input, List, Popconfirm, Progress, Radio, Result, Row, Segmented, Select, Space, Spin, Statistic, Tabs, Tag, Tooltip, Typography } from 'antd';
import { FormModal, options, PageHeader, Term } from '../components';
import { AppstoreOutlined, CalendarOutlined, DownloadOutlined, EditOutlined, FileMarkdownOutlined, FileProtectOutlined, HistoryOutlined, LinkOutlined, PlusOutlined, SafetyCertificateOutlined, ThunderboltOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { canViewInApp, DocTypeTag, isMd, useDocViewer } from '../MdViewer';
import { ApiError, api, useProcess, useProject, useProjects, useProjectMutation, useUsers } from '../api';
import type { Item, Process, Project, User } from '../types';
import { blob, KIND_COLOR } from '../util';
import { AiSetupCard, MembersCard } from './ProjectSetup';
import StagePipeline from '../StagePipeline';
import ProjectSplitView from './ProjectSplitView';
import StepCard from './StepCard';
import { TimelineGantt } from '../TimelineGantt';
import { KanbanBoard } from '../KanbanBoard';
import { ProjectFocusSkeleton } from '../SkeletonLoaders';

// lỗi mạng / máy chủ khác với "không tìm thấy": có nút Thử lại thay vì báo nhầm là dự án không tồn tại
function LoadFailed({ q }: { q: { isError: boolean; error: unknown; refetch: () => unknown } }) {
  const notFound = !q.isError || (q.error instanceof ApiError && q.error.status === 404);
  return notFound
    ? <Result status="404" title="Không tìm thấy dự án" extra={<Link to="/">Về Dashboard</Link>} />
    : <Result status="error" title="Không tải được dữ liệu" subTitle={(q.error as Error).message} extra={<Button type="primary" onClick={() => q.refetch()}>Thử lại</Button>} />;
}

export function ProjectIndex() {
  const { id = '' } = useParams();
  const q = useProject(id);
  if (q.isLoading) return <ProjectFocusSkeleton />;
  if (!q.data) return <LoadFailed q={q} />;
  const first = (q.data.items || []).find((i) => !i.archived);
  return <Navigate to={`/p/${id}/t/${first ? first.id : 'base'}`} replace />;
}

export default function ProjectPage() {
  const { id = '', t: tid = 'base' } = useParams();
  const { user } = useOutletContext<{ user: User }>();
  const nav = useNavigate();
  const proc = useProcess().data;
  const users = useUsers().data || [];
  const allProjects = useProjects();
  const q = useProject(id);
  const [activeStep, setActiveStep] = useState<string>('B1');
  const [viewMode, setViewMode] = useState<'focus' | 'kanban' | 'timeline' | 'scroll'>('focus');

  // Khai báo hook cập nhật trạng thái bước tại đầu component (trước mọi early return) tuân thủ Rules of Hooks
  const updateStepStatus = useProjectMutation(
    ({ stepCode, status, current }: { stepCode: string; status: any; current?: any }) => {
      const cur = current || {};
      return api<Project>('PUT', `/api/projects/${id}/t/${tid}/steps/${stepCode}`, {
        status,
        owners: cur.owners || [],
        note: cur.note || '',
        start: cur.start || '',
        end: cur.end || '',
        checks: cur.checks || [],
      });
    }
  );

  useEffect(() => {
    const c = window.location.hash.slice(1); // vào thẳng link #B5 (vd từ "Việc của tôi") thì mở bước đó
    if (!c) return;
    setActiveStep(c);
  }, [tid]);
  if (q.isLoading || !proc) return <ProjectFocusSkeleton />;
  if (!q.data) return <LoadFailed q={q} />;
  const p = q.data;
  const t = tid === 'base' ? p.base : (p.items || []).find((i) => i.id === tid);
  if (!t) return <Result status="404" title="Không tìm thấy hạng mục" extra={<Link to={`/p/${p.id}`}>Về dự án</Link>} />;
  const v = tid === 'base' ? p.view.base : p.view.items[tid];
  const item = tid === 'base' ? null : (t as Item);
  const phases = proc.phases.map((ph) => ({ ...ph, steps: ph.steps.filter((c) => t.steps[c]) })).filter((ph) => ph.steps.length);
  const gateId = (k: string | null) => proc.gates.find((g) => g.key === k)?.id || '—';
  const stepName = (c: string) => proc.steps.find((s) => s.code === c)?.name || c;
  const allCodes = phases.flatMap((ph) => ph.steps);
  const effectiveStep = allCodes.includes(activeStep)
    ? activeStep
    : (v.current && allCodes.includes(v.current) ? v.current : allCodes[0] || '');

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? '?';
  const owners = v.current ? t.steps[v.current].owners.map(nameOf) : [];
  // nền tảng: 4 việc để dự án sẵn sàng dùng AI (cùng điều kiện với cảnh báo "Thiết lập AI chưa đủ")
  const finished = (c: string) => ['done', 'skipped'].includes(t.steps[c]?.status);
  const quickStart = tid === 'base' ? [
    { done: p.members.length > 0, label: 'Khai báo thành viên & vai trò (mục "Thành viên" bên dưới)' },
    { done: p.aiSetup.tools.length > 0 && !!p.aiSetup.dataLevel, label: 'Thiết lập AI: công cụ được duyệt và mức nhạy cảm dữ liệu (mục "Thiết lập AI")' },
    { done: finished('B1'), label: `Làm B1 — ${stepName('B1')}` },
    { done: finished('B2'), label: `Làm B2 — ${stepName('B2')}` },
  ] : [];

  // một dòng trả lời "giờ phải làm gì / đang kẹt ở đâu"
  const nextHint = (() => {
    if (v.failed.length) return `${v.failed.map(gateId).join(', ')} không đạt — sửa theo ghi chú rồi ký lại`;
    if (!v.current) return 'Mọi bước đã xong';
    if (!v.blocking) return `Làm bước ${v.current} (${stepName(v.current)}), tick checklist rồi đặt trạng thái Xong`;
    const gi = v.gates[v.blocking], pg = proc.gates.find((g) => g.key === v.blocking);
    const roles = pg?.roles.map((r) => proc.roles.find((x) => x.key === r)?.label || r).join(' / ');
    return gi.blocker || (gi.pendingAi ? `Còn ${gi.pendingAi} mục AI chờ người khác duyệt` : `Chờ ${gateId(v.blocking)} được ký "Đạt"${roles ? ` (vai trò: ${roles})` : ''}`);
  })();

  return (
    <>
      <PageHeader
        crumbs={[
          { title: 'Dự án', to: '/' },
          {
            title: p.name,
            to: `/p/${p.id}`,
            menu: (allProjects.data || []).length > 1 ? {
              items: (allProjects.data || [])
                .filter((pj) => pj.id !== p.id)
                .slice(0, 10)
                .map((pj) => ({
                  key: pj.id,
                  label: pj.name,
                  onClick: () => nav(`/p/${pj.id}`),
                })),
            } : undefined,
          },
          {
            title: item ? item.name : 'Nền tảng (B1–B2)',
            menu: (p.items || []).length > 0 ? {
              items: [
                { key: 'base', label: 'Nền tảng (B1–B2)', onClick: () => nav(`/p/${p.id}/t/base`) },
                ...(p.items || []).map((i) => ({
                  key: i.id,
                  label: `${i.name} (${proc.labels.KIND[i.kind]})`,
                  onClick: () => nav(`/p/${p.id}/t/${i.id}`),
                })),
              ],
            } : undefined,
          },
        ]}
        title={
          <Space>
            {p.name}
            {p.code && <Typography.Text type="secondary">{p.code}</Typography.Text>}
            {p.visibility === 'private' ? <Tag color="purple">🔒 Nội bộ</Tag> : <Tag>🌐 Công khai</Tag>}
            {p.archived && <Tag>Lưu trữ</Tag>}
          </Space>
        }
        extra={<>
          <Button icon={<FileMarkdownOutlined />} onClick={() => nav(`/p/${p.id}/docs`)}>Tài liệu ({p.docs.length})</Button>
          <Button icon={<HistoryOutlined />} onClick={() => nav(`/p/${p.id}/log`)}>Nhật ký</Button>
          <Button icon={<SafetyCertificateOutlined />} onClick={() => nav(`/p/${p.id}/t/${tid}/compliance`)}>Hồ sơ nghiệm thu</Button>
          <Button icon={<FileProtectOutlined />} onClick={() => nav(`/p/${p.id}/dossier`)}>Hồ sơ Dossier</Button>
          {user.admin && <ProjectInfoModal p={p} />}
        </>}
      >
        {p.description && <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>{p.description}</Typography.Paragraph>}
        <Tabs
          style={{ marginTop: 8 }}
          activeKey={tid}
          onChange={(k) => nav(`/p/${p.id}/t/${k}`)}
          tabBarExtraContent={<ItemModal p={p} proc={proc} />}
          items={[
            { key: 'base', label: <Space size={4}>Nền tảng (B1–B2) <Typography.Text type="secondary">{p.view.base.pct}%</Typography.Text></Space> },
            ...(p.items || []).map((i) => ({
              key: i.id,
              label: <Space size={4} style={{ opacity: i.archived ? 0.55 : 1 }}>{i.name}<Tag color={KIND_COLOR[i.kind]} style={{ marginInlineEnd: 0 }}>{proc.labels.KIND[i.kind]}</Tag><Typography.Text type="secondary">{p.view.items[i.id].pct}%</Typography.Text></Space>,
            })),
          ]}
        />
      </PageHeader>
      {p.processVersion !== proc.version && <Alert type="info" showIcon style={{ marginBottom: 16 }} message={`Dự án tạo theo quy trình v${p.processVersion}, quy trình hiện tại là v${proc.version}.`} />}

      {item && !p.view.me.enforced && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Chưa khai báo thành viên & vai trò — mọi tài khoản đều ký được gate."
        description={<>Khai báo ở tab <Link to={`/p/${p.id}/t/base`}>Nền tảng</Link> để chỉ đúng vai trò (theo RACI của quy trình) mới ký được từng gate.</>} />}
      {p.view.me.enforced && <Space wrap style={{ marginBottom: 16 }}><Typography.Text type="secondary">Vai trò của bạn trong dự án:</Typography.Text>
        {p.view.me.roles.length ? p.view.me.roles.map((r) => <Tag key={r} color="blue">{proc.roles.find((x) => x.key === r)?.label || r}</Tag>) : <Tag>Chưa có vai trò (chỉ xem)</Tag>}</Space>}
      {item && !p.view.setup.ready && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Thiết lập AI của dự án chưa đủ"
        description={<>{p.view.setup.missing.join(' · ')} — xem tab <Link to={`/p/${p.id}/t/base`}>Nền tảng</Link>.</>} />}

      {quickStart.some((x) => !x.done) && (
        <Card style={{ marginBottom: 16 }} title="Bắt đầu nhanh — 4 việc để dự án sẵn sàng dùng AI">
          <Space direction="vertical" size={4}>
            {quickStart.map((x, i) => <span key={i}>{x.done ? '✅' : '⬜'} <span style={{ textDecoration: x.done ? 'line-through' : undefined, color: x.done ? '#8c8c8c' : undefined }}>{x.label}</span></span>)}
          </Space>
        </Card>
      )}
      {item ? <ItemHeader p={p} item={item} proc={proc} /> : (<>
        <Card style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Nền tảng làm 1 lần cho cả dự án (Charter, constitution/skill.md, rules…) — mọi hạng mục dùng chung.{' '}
            {p.repoUrl ? <>Repo: <a href={p.repoUrl} target="_blank" rel="noopener noreferrer">{p.repoUrl}</a> (nhánh <code>{p.branch}</code>)</> : 'Chưa khai báo repo — đường dẫn tài liệu sẽ không tự tạo link.'}
          </Typography.Paragraph>
        </Card>
        <AiSetupCard p={p} proc={proc} />
        <MembersCard key={JSON.stringify(p.members)} p={p} proc={proc} users={users} />
      </>)}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}><Card style={{ height: '100%' }}><Statistic title="Hoàn thành" value={v.pct} suffix="%" /><Progress percent={v.pct} showInfo={false} size="small" /></Card></Col>
        <Col xs={24} md={8}>
          <Card style={{ height: '100%' }}>
            <Statistic title="Bước hiện tại" value={v.current || 'Hoàn tất'} formatter={(val) => (v.current ? <a href={`#${v.current}`} onClick={() => setActiveStep(v.current!)}>{val} — {stepName(v.current)}</a> : val)} valueStyle={{ fontSize: 20 }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{nextHint}</Typography.Text>
            {v.current && <div><Typography.Text style={{ fontSize: 12 }}>Phụ trách: {owners.length ? owners.join(', ') : <i>chưa giao — mở bước và bấm "Nhận việc này"</i>}</Typography.Text></div>}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title={<Term k="gate">{v.failed.length ? 'Gate không đạt' : 'Gate đang chặn'}</Term>}
              value={v.failed.length ? v.failed.map(gateId).join(', ') : gateId(v.blocking)}
              valueStyle={{ color: v.failed.length ? '#a8071a' : v.blocking ? '#874d00' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <StagePipeline
        proc={proc}
        t={t}
        v={v}
        phases={phases}
        onSelectStep={(c) => { setActiveStep(c); setViewMode('focus'); }}
      />

      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Góc nhìn quy trình:
        </Typography.Text>
        <Segmented
          value={viewMode}
          onChange={(val) => setViewMode(val as any)}
          options={[
            { value: 'focus', label: <Space size={4}><ThunderboltOutlined /><span>Focus View</span></Space> },
            { value: 'kanban', label: <Space size={4}><AppstoreOutlined /><span>Bảng Kanban</span></Space> },
            { value: 'timeline', label: <Space size={4}><CalendarOutlined /><span>Timeline / Gantt</span></Space> },
            { value: 'scroll', label: <Space size={4}><UnorderedListOutlined /><span>Cuộn truyền thống</span></Space> },
          ]}
        />
      </Flex>

      {viewMode === 'kanban' ? (
        <KanbanBoard
          proc={proc}
          p={p}
          tid={tid}
          t={t}
          v={v}
          users={users}
          onSelectStep={(c) => { setActiveStep(c); setViewMode('focus'); }}
          onUpdateStepStatus={(stepCode, status) => updateStepStatus.mutateAsync({ stepCode, status, current: t.steps[stepCode] }).then(() => {})}
        />
      ) : viewMode === 'timeline' ? (
        <TimelineGantt
          proc={proc}
          p={p}
          tid={tid}
          t={t}
          users={users}
          onSelectStep={(c) => { setActiveStep(c); setViewMode('focus'); }}
        />
      ) : viewMode === 'scroll' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {phases.flatMap((ph) => ph.steps).map((code) => {
            const st = proc.steps.find((s) => s.code === code);
            if (!st) return null;
            return (
              <div key={code} id={code}>
                <StepCard
                  proc={proc}
                  p={p}
                  tid={tid}
                  t={t}
                  v={v}
                  st={st}
                  users={users}
                  open={true}
                  onToggle={() => {}}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <ProjectSplitView
          p={p}
          proc={proc}
          t={t}
          v={v}
          tid={tid}
          phases={phases}
          users={users}
          activeStep={effectiveStep}
          onSelectStep={(c) => setActiveStep(c)}
        />
      )}
    </>
  );
}

/* ---------- thông tin hạng mục + tài liệu chung ---------- */
function ItemHeader({ p, item, proc }: { p: Project; item: Item; proc: Process }) {
  const { message } = App.useApp();
  const archive = useProjectMutation((archived: boolean) => api<Project>('POST', `/api/projects/${p.id}/items/${item.id}/archive`, { archived }));
  const scopeOf = Object.fromEntries(proc.steps.flatMap((s) => s.templates).map((x) => [x.id, x]));
  const shared = p.docs.filter((d) => d.track === 'base' || scopeOf[d.templateId]?.scope === 'cumulative');
  const repoLinks = ['docs-index.md', 'constitution.md', 'SKILL.md', 'AGENTS.md'].map((f) => [f, blob(p, f)]).filter(([, u]) => u);
  const trackName = (tid: string) => (tid === 'base' ? 'Nền tảng' : p.items.find((i) => i.id === tid)?.name);
  const viewer = useDocViewer(p.id);

  return (
    <Card style={{ marginBottom: 16 }} title={<Space>{item.name}<Tag color={KIND_COLOR[item.kind]}>{proc.labels.KIND[item.kind]}</Tag>{item.archived && <Tag>Lưu trữ</Tag>}</Space>}
      extra={<Space>
        <ItemModal p={p} proc={proc} item={item} />
        <Popconfirm
          title={item.archived ? 'Bỏ lưu trữ hạng mục?' : 'Lưu trữ hạng mục này?'}
          okText="Đồng ý"
          cancelText="Huỷ"
          disabled={!p.view.me.canManageItems}
          onConfirm={() => archive.mutate(!item.archived, { onError: (e) => message.error(e.message) })}
        >
          <Tooltip title={!p.view.me.canManageItems ? 'Chỉ PM hoặc PO mới có quyền lưu trữ hạng mục' : undefined}>
            <Button disabled={!p.view.me.canManageItems}>{item.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}</Button>
          </Tooltip>
        </Popconfirm>
      </Space>}>
      <Descriptions size="small" column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="Tham chiếu">{item.ref ? (/^https?:\/\//i.test(item.ref) ? <a href={item.ref} target="_blank" rel="noopener noreferrer">{item.ref}</a> : item.ref) : '—'}</Descriptions.Item>
        {item.kind === 'cr' && <Descriptions.Item label={<>Mã Change Request (<Term k="pl2">PL2</Term>)</>}><b>{item.crCode}</b>{item.crReason && <Typography.Text type="secondary"> — {item.crReason}</Typography.Text>}</Descriptions.Item>}
        {item.kind === 'fast' && <Descriptions.Item label={<>Điều kiện <Term k="fastTrack">Fast-track</Term></>}><Typography.Text type="secondary">Đã xác nhận: dưới 0,5 ngày công · không chạm phân quyền/thanh toán · không đổi data model</Typography.Text></Descriptions.Item>}
        <Descriptions.Item label="Thư mục spec">{item.specDir ? (blob(p, item.specDir) ? <a href={blob(p, item.specDir, 'tree')} target="_blank" rel="noopener noreferrer"><code>{item.specDir}/</code></a> : <code>{item.specDir}/</code>) : '—'}</Descriptions.Item>
      </Descriptions>
      <Collapse ghost items={[{
        key: 'shared',
        label: <Space>Tài liệu chung đang áp dụng <Tag>{shared.length}</Tag></Space>,
        children: (
          <>
            {repoLinks.length > 0 && <Typography.Paragraph>Trong repo: {repoLinks.map(([f, u], i) => <span key={f}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer">{f}</a></span>)}</Typography.Paragraph>}
            {shared.length ? (
              <List size="small" dataSource={shared} renderItem={(d) => (
                <List.Item>
                  <Space wrap>
                    {canViewInApp(d) ? (
                      <a onClick={() => viewer.open(d)} style={{ fontWeight: 500 }}>
                        {d.label}
                      </a>
                    ) : d.file ? (
                      <a href={`/api/projects/${p.id}/files/${d.id}`} style={{ fontWeight: 500 }}>
                        {d.label}
                      </a>
                    ) : (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
                        {d.label}
                      </a>
                    )}
                    <DocTypeTag doc={d} />
                    {d.templateId && scopeOf[d.templateId] && <Tag>{scopeOf[d.templateId].title}</Tag>}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{trackName(d.track)} · {d.step}</Typography.Text>
                  </Space>
                </List.Item>
              )} />
            ) : <Typography.Text type="secondary">Chưa gắn tài liệu chung — thêm ở <Link to={`/p/${p.id}/t/base`}>tab Nền tảng</Link>.</Typography.Text>}
          </>
        ),
      }]} />
      {viewer.node}
    </Card>
  );
}

/* ---------- tạo / sửa hạng mục ---------- */
interface ItemForm {
  name: string; kind?: string; ref?: string; specDir?: string; crCode?: string; crReason?: string;
  fast?: { small?: boolean; sensitive?: boolean; model?: boolean };
}

function ItemModal({ p, proc, item }: { p: Project; proc: Process; item?: Item }) {
  const { message, modal } = App.useApp();
  const nav = useNavigate();
  const create = useProjectMutation((body: object) => api<{ project: Project; itemId: string }>('POST', `/api/projects/${p.id}/items`, body), (r) => r.project);
  const update = useProjectMutation((body: object) => api<Project>('PUT', `/api/projects/${p.id}/items/${item?.id}`, body));

  const canAct = item ? (p.view.me.canManageItems ?? true) : (p.view.me.canCreateItem ?? true);

  // dự án chưa thiết lập AI đủ: admin được bỏ qua có chủ đích (sau khi xác nhận), người khác chỉ thấy lý do
  const confirmForce = (missing: string[]) => new Promise<boolean>((resolve) => modal.confirm({
    title: 'Thiết lập AI của dự án chưa đủ',
    content: <><ul style={{ paddingLeft: 20 }}>{missing.map((m) => <li key={m}>{m}</li>)}</ul>Admin có thể bỏ qua có chủ đích; việc này được ghi vào nhật ký.</>,
    okText: 'Vẫn tạo (admin)', cancelText: 'Huỷ', onOk: () => resolve(true), onCancel: () => resolve(false),
  }));

  return (
    <FormModal<ItemForm>
      title={item ? 'Sửa hạng mục' : 'Thêm hạng mục'}
      okText={item ? 'Lưu' : 'Tạo hạng mục'}
      trigger={
        item ? (
          <Tooltip title={!canAct ? 'Chỉ PM hoặc PO mới có quyền sửa hạng mục' : undefined}>
            <Button icon={<EditOutlined />} disabled={!canAct}>Sửa</Button>
          </Tooltip>
        ) : (
          <Tooltip title={!canAct ? 'Chỉ thành viên của dự án mới có quyền tạo hạng mục' : undefined}>
            <Button type="primary" icon={<PlusOutlined />} disabled={!canAct}>Thêm hạng mục</Button>
          </Tooltip>
        )
      }
      initialValues={item ? { name: item.name, ref: item.ref, specDir: item.specDir } : { kind: 'full' }}
      onSubmit={async (f) => {
        try {
          if (item) { await update.mutateAsync(f); message.success('Đã lưu hạng mục'); return true; }
          let r;
          try { r = await create.mutateAsync(f); } catch (e) {
            const data = e instanceof ApiError && e.status === 409 ? e.data : undefined;
            if (!data?.setup) throw e;
            if (!data.canForce) { message.error((e as Error).message); return false; }
            if (!(await confirmForce(data.setup as string[]))) return false;
            r = await create.mutateAsync({ ...f, force: true });
          }
          message.success('Đã tạo hạng mục');
          nav(`/p/${p.id}/t/${r.itemId}`);
          return true;
        } catch (e) { message.error((e as Error).message); return false; }
      }}
    >
      <Form.Item name="name" label="Tên hạng mục" rules={[{ required: true, message: 'Nhập tên hạng mục' }]}><Input placeholder="vd: Thanh toán QR" maxLength={120} /></Form.Item>
      {!item && (
        <Form.Item name="kind" label="Loại" rules={[{ required: true, message: 'Chọn loại hạng mục' }]}
          extra={<>Tính năng: đi đủ {proc.steps.length - proc.baseSteps.length} bước · <Term k="pl2">Change Request</Term>: thay đổi sau khi spec đã khoá ở Gate 1 · <Term k="fastTrack">Fast-track</Term>: tự bỏ qua {proc.fastTrackSkip.map((c) => `${c} ${proc.steps.find((s) => s.code === c)?.name ?? ''}`.trim()).join(', ')}</>}>
          <Select options={options(proc.labels.KIND)} />
        </Form.Item>
      )}
      {!item && (
        <Form.Item noStyle shouldUpdate={(a, b) => a.kind !== b.kind || a.fast !== b.fast}>
          {({ getFieldValue }) => {
            const kind = getFieldValue('kind');
            if (kind === 'cr') {
              return <>
                <Form.Item name="crCode" label="Mã Change Request (PL2)" rules={[{ required: true, message: 'Change Request cần mã CR' }]}><Input maxLength={60} placeholder="vd: CR-012" /></Form.Item>
                <Form.Item name="crReason" label="Lý do / phạm vi thay đổi"><Input.TextArea maxLength={1000} rows={2} /></Form.Item>
              </>;
            }
            if (kind !== 'fast') return null;
            const wrong = proc.fastQuestions.filter((q) => getFieldValue(['fast', q.key]) !== undefined && getFieldValue(['fast', q.key]) !== q.must);
            return <>
              <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Luồng rút gọn chỉ dành cho việc nhỏ" description={proc.fastTrack} />
              {proc.fastQuestions.map((q) => (
                <Form.Item key={q.key} name={['fast', q.key]} label={q.label} rules={[{ required: true, message: 'Trả lời câu hỏi này' }]}>
                  <Radio.Group options={[{ label: 'Có', value: true }, { label: 'Không', value: false }]} />
                </Form.Item>
              ))}
              {wrong.length > 0 && <Alert type="error" showIcon message="Không đủ điều kiện Fast-track" description="Hãy tạo hạng mục dạng Tính năng hoặc Change Request." />}
            </>;
          }}
        </Form.Item>
      )}
      <Form.Item name="ref" label="Tham chiếu (link ticket, issue GitLab…)"><Input maxLength={300} /></Form.Item>
      <Form.Item name="specDir" label="Thư mục spec trong repo" rules={[{ pattern: /^[\w./-]*$/, message: 'Chỉ gồm chữ không dấu, số và . _ - /' }]}>
        <Input placeholder={item ? 'specs/002-ten' : `để trống → tự đặt specs/${String(p.items.length + 1).padStart(3, '0')}-ten-hang-muc`} />
      </Form.Item>
    </FormModal>
  );
}

/* ---------- sửa thông tin dự án (admin) ---------- */
function ProjectInfoModal({ p }: { p: Project }) {
  const { message } = App.useApp();
  const update = useProjectMutation((body: object) => api<Project>('PUT', `/api/projects/${p.id}`, body));
  return (
    <FormModal
      title="Thông tin dự án"
      trigger={<Button icon={<EditOutlined />}>Sửa thông tin</Button>}
      initialValues={{ name: p.name, code: p.code, description: p.description, repoUrl: p.repoUrl, branch: p.branch, repoType: p.repoType, visibility: p.visibility || 'public' }}
      onSubmit={async (f) => {
        try { await update.mutateAsync(f); message.success('Đã lưu thông tin dự án'); return true; } catch (e) { message.error((e as Error).message); return false; }
      }}
    >
      <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Nhập tên dự án' }]}><Input maxLength={120} /></Form.Item>
      <Form.Item name="code" label="Mã"><Input maxLength={30} /></Form.Item>
      <Form.Item name="visibility" label="Quyền riêng tư" extra="Dự án nội bộ chỉ thành viên trong danh sách mới xem và truy cập được.">
        <Radio.Group options={[
          { value: 'public', label: '🌐 Công khai (Toàn công ty)' },
          { value: 'private', label: '🔒 Nội bộ (Chỉ thành viên)' },
        ]} />
      </Form.Item>
      <Form.Item name="repoUrl" label="Repo URL" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}><Input placeholder="https://git.cong-ty.vn/nhom/du-an" /></Form.Item>
      <Form.Item name="repoType" label="Loại repo" extra="Quyết định cách tạo link tới file trong repo (GitLab nội bộ thường không có chữ gitlab trong tên miền)."><Select options={REPO_TYPES} /></Form.Item>
      <Form.Item name="branch" label="Nhánh chính"><Input maxLength={100} /></Form.Item>
      <Form.Item name="description" label="Mô tả"><Input.TextArea maxLength={1000} /></Form.Item>
    </FormModal>
  );
}

const REPO_TYPES = [{ value: 'gitlab', label: 'GitLab (kể cả GitLab nội bộ)' }, { value: 'github', label: 'GitHub' }];

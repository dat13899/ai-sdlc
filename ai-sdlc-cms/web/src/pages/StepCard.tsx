// Thẻ một bước: form trạng thái/người phụ trách/ngày/ghi chú, checklist tự lưu, tài liệu, gate của bước
import { Alert, App, Avatar, Button, Card, Checkbox, Col, Collapse, DatePicker, Descriptions, Flex, Form, Input, List, Popconfirm, Progress, Row, Select, Space, Tag, Tooltip, Typography, Upload, theme } from 'antd';
import { DownloadOutlined, DownOutlined, ExclamationCircleOutlined, EyeOutlined, FileMarkdownOutlined, FileWordOutlined, LinkOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Link, useBlocker } from 'react-router-dom';
import { api, useMe, useProjectMutation } from '../api';
import { Term } from '../components';
import { canViewInApp, DocTypeTag, isMd, useDocViewer } from '../MdViewer';
import type { AiLog, AiOrigin, AiResult, Bug, Process, ProcStep, Project, Track, TrackView, User } from '../types';
import { blob, fmt, GATE_COLOR, SCOPE_LABEL, STEP_COLOR, tplPath, BUG_SEVERITY_COLOR, BUG_STATUS_COLOR } from '../util';
import { useTheme } from '../ThemeContext';
import { fireGateConfetti, triggerHapticShake } from '../util/confetti';

const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#faad14', '#2f54eb'];

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function UserAvatarGroup({ uids, users, max = 3 }: { uids: string[]; users: User[]; max?: number }) {
  if (!uids || uids.length === 0) return null;
  return (
    <Avatar.Group maxCount={max} size="small" maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', fontSize: 11 }}>
      {uids.map((uid) => {
        const u = users.find((x) => x.id === uid);
        const name = u?.name || uid;
        const initial = name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';
        return (
          <Tooltip key={uid} title={`${name} (@${u?.username || uid})`}>
            <Avatar size="small" style={{ backgroundColor: stringToColor(name), fontSize: 11 }}>
              {initial}
            </Avatar>
          </Tooltip>
        );
      })}
    </Avatar.Group>
  );
}

const ORIGIN_COLOR: Record<AiOrigin, string> = { ai: 'purple', mixed: 'cyan', manual: 'default' };
const RESULT_COLOR: Record<AiResult, string> = { pending: 'warning', accepted: 'success', edited: 'blue', rejected: 'error', na: 'default' };

interface Props { proc: Process; p: Project; tid: string; t: Track; v: TrackView; st: ProcStep; users: User[]; open: boolean; onToggle: () => void }

// có thay đổi chưa lưu: hỏi trước khi chuyển trang trong ứng dụng, và trước khi đóng / tải lại tab
function useUnsavedGuard(dirty: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Có thay đổi chưa lưu ở bước này. Rời trang và bỏ thay đổi?')) blocker.proceed(); else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

export default function StepCard({ proc, p, tid, t, v, st, users, open, onToggle }: Props) {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const { token } = theme.useToken();
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  useUnsavedGuard(dirty);
  const me = useMe().data!;
  const [form] = Form.useForm();
  const watchedOwners = Form.useWatch('owners', form) as string[] | undefined;
  const s = t.steps[st.code];
  const base = `/api/projects/${p.id}/t/${tid}`;
  const onErr = (e: Error) => message.error(e.message);

  // Phím tắt Ctrl + S để lưu nhanh bước đang mở
  useEffect(() => {
    if (!dirty || !open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        form.submit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dirty, open, form]);

  const saveStep = useProjectMutation((body: object) => api<Project>('PUT', `${base}/steps/${st.code}`, body));
  const saveChecks = useProjectMutation((checks: number[]) => api<Project>('PUT', `${base}/checks/${st.code}`, { checks }));

  if (!s || !me) return null;

  const canEdit = v.canEditStep?.[st.code] ?? (
    me.admin ||
    !p.view.me.enforced ||
    p.view.me.canManage ||
    p.view.me.canSetup ||
    s.owners.includes(me.id)
  );

  // chọn người phụ trách: tài khoản bị khoá chỉ hiện nếu đã được giao
  const ownerOptions = users.filter((u) => !u.disabled || s.owners.includes(u.id))
    .map((u) => ({ value: u.id, label: `${u.name} (@${u.username})${u.disabled ? ' · đã khoá' : ''}` }));
  const toDate = (d: string) => (d ? dayjs(d) : null);
  const fromDate = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : '');
  const ticked = st.rows.filter((_, i) => s.checks[i]).length;
  const gates = proc.gates.filter((g) => g.at === st.code && t.gates[g.key]);
  const missing = v.stepMissing[st.code] || [];
  const stepLogs = (p.aiLogs || []).filter((l) => l.track === tid && l.step === st.code);
  const pendingAi = stepLogs.filter((l) => l.result === 'pending').length;
  const stepBugs = (p.bugs || []).filter((b) => b.track === tid && b.step === st.code);
  const openBugs = stepBugs.filter((b) => b.status !== 'closed');

  return (
    <Card
      id={st.code}
      style={{ scrollMarginTop: 72, borderLeft: `4px solid ${s.status === 'done' ? '#52c41a' : s.status === 'doing' ? '#faad14' : '#d9d9d9'}` }}
      title={<Space wrap onClick={onToggle} style={{ cursor: 'pointer' }}><Typography.Text strong style={{ color: '#0958d9' }}>{st.code}</Typography.Text>{st.name}<Tag color={STEP_COLOR[s.status]}>{proc.labels.STATUS[s.status]}</Tag>
        {!open && s.owners.length > 0 && <UserAvatarGroup uids={s.owners} users={users} />}
        {dirty && <Tag color="warning">Chưa lưu</Tag>}
        {missing.length > 0 && <Tag color="warning">Thiếu {missing.length} tài liệu bắt buộc</Tag>}
        {pendingAi > 0 && <Tag color="purple">{pendingAi} mục AI chờ duyệt</Tag>}
        {openBugs.length > 0 && <Tag color="error">{openBugs.length} bug chưa đóng</Tag>}</Space>}
      extra={<Space><Progress percent={v.stepPct[st.code]} size="small" style={{ width: 120, margin: 0 }} /><a href={`${proc.site}/#${st.code.toLowerCase()}`} target="_blank" rel="noopener noreferrer">Hướng dẫn ↗</a><Button type="text" size="small" aria-label={open ? 'Thu gọn bước' : 'Mở bước'} icon={open ? <UpOutlined /> : <DownOutlined />} onClick={onToggle} /></Space>}
    >
      <div style={{ display: open ? undefined : 'none' }}>
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: isDark ? 'rgba(47, 129, 247, 0.08)' : '#f0f7ff',
        border: `1px solid ${isDark ? 'rgba(47, 129, 247, 0.2)' : '#bae0ff'}`,
        marginBottom: 16,
      }}>
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Space size={6} wrap>
            <Typography.Text strong style={{ color: isDark ? '#58a6ff' : '#0958d9' }}>Đầu ra kỳ vọng:</Typography.Text>
            <Typography.Text>{st.out}</Typography.Text>
          </Space>
          {st.gate && (
            <Tag color="warning" style={{ marginInlineEnd: 0, fontWeight: 600 }}>Duyệt: {st.gate}</Tag>
          )}
        </Flex>
      </div>

      <Form
        form={form}
        layout="vertical"
        disabled={!canEdit}
        initialValues={{ status: s.status, owners: s.owners, start: toDate(s.start), end: toDate(s.end), note: s.note }}
        onValuesChange={() => setDirty(true)}
        onFinish={(f) => saveStep.mutate(
          { status: f.status, owners: f.owners || [], start: fromDate(f.start), end: fromDate(f.end), note: f.note || '' },
          { onSuccess: () => { setDirty(false); setSavedAt(new Date()); message.success(`Đã lưu ${st.code}`); }, onError: onErr },
        )}
      >
        {!canEdit && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Chế độ chỉ xem"
            description={
              s.owners.length === 0 ? (
                <Flex justify="space-between" align="center" wrap gap={8}>
                  <span>Bước này chưa có người phụ trách. Bạn có thể nhận việc để bắt đầu thực hiện.</span>
                  <Button
                    type="primary"
                    size="small"
                    loading={saveStep.isPending}
                    onClick={() => {
                      saveStep.mutate(
                        { status: s.status, owners: [me.id], start: s.start, end: s.end, note: s.note },
                        {
                          onSuccess: () => message.success('Bạn đã nhận phụ trách bước này!'),
                          onError: onErr,
                        },
                      );
                    }}
                  >
                    + Nhận việc này (Giao cho tôi)
                  </Button>
                </Flex>
              ) : (
                `Bước này do ${s.owners.map((id) => users.find((u) => u.id === id)?.name || id).join(', ')} phụ trách. Chỉ người phụ trách hoặc PM/TechLead mới có quyền thay đổi tiến độ.`
              )
            }
          />
        )}
        <Row gutter={16}>
          <Col xs={24} md={6}><Form.Item name="status" label="Trạng thái"><Select options={Object.entries(proc.labels.STATUS).map(([value, label]) => ({ value, label }))} /></Form.Item></Col>
          <Col xs={24} md={10}>
            <Form.Item name="owners" label={<Space size={8}><span>Người phụ trách</span><UserAvatarGroup uids={watchedOwners || s.owners} users={users} /></Space>} extra={<>
              {s.owner ? `Ghi cũ: ${s.owner} ` : ''}
              {!(watchedOwners ?? s.owners).includes(me.id) && <a onClick={() => { form.setFieldValue('owners', [...(form.getFieldValue('owners') || []), me.id]); setDirty(true); }}>+ Nhận việc này (giao cho tôi)</a>}
            </>}>
              <Select mode="multiple" allowClear placeholder="Chọn người" options={ownerOptions} optionFilterProp="label" maxTagCount="responsive" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}><Form.Item name="start" label="Bắt đầu"><DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={4}><Form.Item name="end" label="Hoàn thành"><DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={24}><Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} maxLength={2000} /></Form.Item></Col>
        </Row>
        {st.rows.length > 0 && ticked === st.rows.length && s.status !== 'done' && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message="Checklist đã hoàn tất 100%"
            description={
              <Flex justify="space-between" align="center" wrap gap={8}>
                <span>Tất cả các tiêu chí trong bước đã được kiểm tra. Bạn có thể đánh dấu bước này là Hoàn thành.</span>
                <Button
                  type="primary"
                  size="small"
                  loading={saveStep.isPending}
                  onClick={() => { form.setFieldValue('status', 'done'); form.submit(); }}
                >
                  ✓ Đánh dấu Xong ngay
                </Button>
              </Flex>
            }
          />
        )}
        <Space wrap>
          <Tooltip title={!canEdit ? 'Chỉ người phụ trách bước này hoặc PM/TechLead mới có quyền lưu' : undefined}>
            <Button type="primary" htmlType="submit" disabled={!canEdit} loading={saveStep.isPending}>
              Lưu bước
            </Button>
          </Tooltip>
          {dirty ? <Typography.Text type="warning">Có thay đổi chưa lưu (Ctrl+S để lưu)</Typography.Text>
            : savedAt && <Typography.Text type="secondary">Đã lưu lúc {savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Typography.Text>}
        </Space>
      </Form>

      <Collapse
        ghost
        style={{ marginTop: 16 }}
        defaultActiveKey={[...(s.status === 'doing' ? ['checks'] : []), ...((p.docs || []).some((d) => d.track === tid && d.step === st.code) ? ['docs'] : []), ...(pendingAi > 0 ? ['ai'] : []), ...(openBugs.length > 0 ? ['bugs'] : [])]}
        items={[
          {
            key: 'checks',
            label: <Space>Checklist <Tag>{ticked}/{st.rows.length}</Tag></Space>,
            children: (
              <div style={{ display: 'grid', gap: 8 }}>
                {st.rows.map((r, i) => {
                  const isChecked = !!s.checks[i];
                  const toggleCheck = () => {
                    if (!canEdit) {
                      message.warning('Chỉ người phụ trách bước này hoặc PM/TechLead mới được cập nhật checklist');
                      return;
                    }
                    const current = st.rows.map((_, idx) => idx).filter((idx) => s.checks[idx]);
                    const next = current.includes(i) ? current.filter((idx) => idx !== i) : [...current, i];
                    saveChecks.mutate(next, { onError: onErr });
                  };

                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={canEdit ? 0 : -1}
                      onClick={toggleCheck}
                      onKeyDown={(e) => canEdit && e.key === 'Enter' && toggleCheck()}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        background: isChecked ? (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb') : (isDark ? '#1c2128' : '#ffffff'),
                        border: `1px solid ${isChecked ? (isDark ? '#21262d' : '#f0f0f0') : (isDark ? '#30363d' : '#e5e7eb')}`,
                        cursor: canEdit ? 'pointer' : 'not-allowed',
                        opacity: canEdit ? 1 : 0.8,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        disabled={!canEdit}
                        onChange={toggleCheck}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <Flex justify="space-between" align="center" wrap gap={6}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: isChecked ? 'line-through' : undefined,
                            color: isChecked ? (isDark ? '#6e7681' : '#9ca3af') : token.colorText,
                          }}>
                            {r.name}
                          </span>
                          {r.who && <Tag color="blue" style={{ marginInlineEnd: 0, fontSize: 11 }}>{r.who}</Tag>}
                        </Flex>
                        {r.how && (
                          <div style={{
                            fontSize: 12,
                            color: isDark ? '#8b949e' : '#6b7280',
                            marginTop: 2,
                            textDecoration: isChecked ? 'line-through' : undefined,
                          }}>
                            {r.how}
                          </div>
                        )}
                        {r.note && (
                          <div style={{ fontSize: 11, color: isDark ? '#e3b341' : '#d97706', marginTop: 2 }}>
                            ⚠️ Lưu ý: {r.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
          },
          { key: 'docs', label: <Space>Tài liệu đầu ra <Tag>{(p.docs || []).filter((d) => d.track === tid && d.step === st.code).length}</Tag>{missing.length > 0 && <Tag color="warning">thiếu {missing.length}</Tag>}</Space>, children: <Docs proc={proc} p={p} tid={tid} t={t} st={st} /> },
          { key: 'ai', label: <Space>Dùng AI <Tag>{stepLogs.length}</Tag>{pendingAi > 0 && <Tag color="purple">{pendingAi} chờ duyệt</Tag>}</Space>, children: <AiLogs proc={proc} p={p} tid={tid} st={st} logs={stepLogs} /> },
          ...(['B11', 'B12'].includes(st.code) || stepBugs.length > 0 ? [{
            key: 'bugs',
            label: <Space>Bug / Lỗi <Tag>{stepBugs.length}</Tag>{openBugs.length > 0 && <Tag color="error">{openBugs.length} chưa đóng</Tag>}</Space>,
            children: <Bugs proc={proc} p={p} tid={tid} st={st} bugs={stepBugs} users={users} />,
          }] : []),
        ]}
      />

      {gates.map((g) => <GateBox key={g.key} proc={proc} p={p} tid={tid} t={t} v={v} gateKey={g.key} />)}
      </div>

      {/* Floating Save Bar khi có thay đổi chưa lưu */}
      {dirty && open && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: isDark ? '#161b22' : '#ffffff',
            border: `1.5px solid ${isDark ? '#30363d' : '#d9d9d9'}`,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.15)',
            borderRadius: 10,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            maxWidth: '92vw',
          }}
        >
          <Space size={8}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <div>
              <Typography.Text strong>Bước {st.code} có thay đổi chưa lưu</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Nhấn <b>Ctrl + S</b> hoặc bấm nút để lưu
              </Typography.Text>
            </div>
          </Space>
          <Space size={8}>
            <Button
              size="small"
              onClick={() => {
                form.resetFields();
                setDirty(false);
                message.info(`Đã huỷ thay đổi tại ${st.code}`);
              }}
            >
              Huỷ thay đổi
            </Button>
            <Button
              type="primary"
              size="small"
              loading={saveStep.isPending}
              onClick={() => form.submit()}
            >
              Lưu bước ({st.code})
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
}

/* ---------- tài liệu của bước ---------- */
function Docs({ proc, p, tid, t, st }: { proc: Process; p: Project; tid: string; t: Track; st: ProcStep }) {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [dragOver, setDragOver] = useState(false);
  const docs = (p.docs || []).filter((d) => d.track === tid && d.step === st.code);
  // tab hạng mục: biểu mẫu dùng chung không gắn ở đây (gắn ở Nền tảng), chỉ hiện làm "luật áp dụng"
  const attachable = tid === 'base' ? st.templates : st.templates.filter((x) => x.scope !== 'shared');
  const sharedRefs = tid === 'base' ? [] : st.templates.filter((x) => x.scope === 'shared');
  const title = Object.fromEntries(st.templates.map((x) => [x.id, x.title]));

  const add = useProjectMutation((fd: FormData) => api<Project>('POST', `/api/projects/${p.id}/docs`, fd));
  const del = useProjectMutation((id: string) => api<Project>('DELETE', `/api/projects/${p.id}/docs/${id}`));
  const viewer = useDocViewer(p.id);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(md|docx|doc|pdf|xlsx|xls|csv|png|jpe?g|svg|webp|gif)$/i.test(file.name)) {
      message.error('Chỉ hỗ trợ file Word, PDF, Excel, Ảnh hoặc Markdown');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      message.error('File dung lượng tối đa 30 MB');
      return;
    }
    const fd = new FormData();
    fd.append('track', tid);
    fd.append('step', st.code);
    fd.append('label', file.name.replace(/\.[^.]+$/i, ''));
    fd.append('file', file);
    add.mutate(fd, {
      onSuccess: () => {
        message.success(`Đã tải lên "${file.name}" thành công!`);
      },
      onError: (err) => message.error(err.message),
    });
  };

  return (
    <>
      {viewer.node}

      {/* Vùng kéo thả file trực tiếp (Drag & Drop Zone) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#1677ff' : isDark ? '#30363d' : '#d9d9d9'}`,
          borderRadius: 8,
          padding: '14px 16px',
          textAlign: 'center',
          background: dragOver ? (isDark ? 'rgba(22, 119, 255, 0.12)' : '#e6f4ff') : 'transparent',
          marginBottom: 16,
          transition: 'all 0.2s ease',
        }}
      >
        <Space size={8}>
          <UploadOutlined style={{ fontSize: 20, color: dragOver ? '#1677ff' : '#8c8c8c' }} />
          <Typography.Text strong style={{ color: dragOver ? '#1677ff' : undefined, fontSize: 13 }}>
            {dragOver ? 'Thả file vào đây để tải lên ngay!' : 'Kéo thả file vào đây (Word, PDF, Excel, Ảnh, Markdown)'}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            (Hỗ trợ .docx, .pdf, .xlsx, .csv, ảnh, .md ≤ 30 MB)
          </Typography.Text>
        </Space>
      </div>
      {docs.length > 0 && (
        <List size="small" dataSource={docs} renderItem={(d) => (
          <List.Item actions={[
            canViewInApp(d) && <a key="view" onClick={() => viewer.open(d)}><EyeOutlined /> Xem</a>,
            d.file && <a key="dl" href={`/api/projects/${p.id}/files/${d.id}`}><DownloadOutlined /> Tải</a>,
            <Popconfirm key="del" title="Xoá tài liệu này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => del.mutate(d.id, { onError: (e) => message.error(e.message) })}><a style={{ color: '#a8071a' }}>Xoá</a></Popconfirm>,
          ].filter(Boolean)}>
            <Space wrap>
              {canViewInApp(d)
                ? <a onClick={() => viewer.open(d)} style={{ fontWeight: 500 }}>{d.label}</a>
                : d.file
                  ? <a href={`/api/projects/${p.id}/files/${d.id}`} style={{ fontWeight: 500 }}>{d.label}</a>
                  : <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>{d.label}</a>}
              <DocTypeTag doc={d} />
              {Boolean(d.revisions?.length) && <Tag color="blue">v{(d.revisions?.length || 0) + 1}</Tag>}
              {d.templateId && <Tag>{title[d.templateId] || d.templateId}</Tag>}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{d.byName} · {fmt(d.at)}</Typography.Text>
            </Space>
          </List.Item>
        )} />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(f) => {
          const fd = new FormData();
          fd.append('track', tid);
          fd.append('step', st.code);
          fd.append('templateId', f.templateId || '');
          fd.append('label', f.label || '');
          fd.append('url', f.url || '');
          const file = f.file?.[0]?.originFileObj;
          if (!file && !f.url) { message.error('Dán link tài liệu hoặc chọn file (Word, PDF, Excel, Ảnh, Markdown)'); return; }
          if (file) fd.append('file', file);
          add.mutate(fd, { onSuccess: () => { message.success('Đã thêm tài liệu'); form.resetFields(); }, onError: (e) => message.error(e.message) });
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="templateId" label="Biểu mẫu">
              <Select allowClear placeholder="— Khác —" options={attachable.map((x) => ({ value: x.id, label: x.required ? `${x.title} (bắt buộc)` : x.title }))}
                onChange={(id) => {
                  // tự điền link file trong repo khi ô Link đang trống
                  const x = attachable.find((y) => y.id === id);
                  const u = x ? blob(p, tplPath(x, t)) : '';
                  if (u && !form.getFieldValue('url')) form.setFieldValue('url', u);
                  if (x && !form.getFieldValue('label')) form.setFieldValue('label', x.title); // tên mặc định theo biểu mẫu
                }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}><Form.Item name="label" label="Tên tài liệu"><Input maxLength={160} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="url" label="Link" rules={[{ type: 'url', message: 'Link không hợp lệ' }]}><Input placeholder="https://…" /></Form.Item></Col>
          <Col xs={24} md={12}>
            <Form.Item name="file" label="hoặc chọn File đính kèm" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList?.slice(-1)}>
              <Upload
                accept=".md,.docx,.doc,.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.svg,.webp,.gif"
                maxCount={1}
                beforeUpload={(f) => {
                  if (!/\.(md|docx|doc|pdf|xlsx|xls|csv|png|jpe?g|svg|webp|gif)$/i.test(f.name)) {
                    message.error('Chỉ nhận file Word, PDF, Excel, Ảnh hoặc Markdown');
                    return Upload.LIST_IGNORE;
                  }
                  if (f.size > 30 * 1024 * 1024) {
                    message.error('File tối đa 30 MB');
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Chọn file (Word, PDF, Excel, Ảnh, MD ≤ 30 MB)</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        <Button htmlType="submit" loading={add.isPending}>Thêm tài liệu</Button>
      </Form>
      {attachable.length > 0 && (
        <List size="small" style={{ marginTop: 16 }} header={<Typography.Text type="secondary">Biểu mẫu và vị trí gợi ý trong repo</Typography.Text>} dataSource={attachable} renderItem={(x) => {
          const fp = tplPath(x, t);
          const u = blob(p, fp);
          return (
            <List.Item>
              <Space wrap>
                <a href={`${proc.site}/mau/${x.id}.html`} target="_blank" rel="noopener noreferrer">{x.title}</a>
                <Tag>{SCOPE_LABEL[x.scope]}</Tag>
                {x.required && (docs.some((d) => d.templateId === x.id) ? <Tag color="success">Bắt buộc · đã có</Tag> : <Tag color="warning">Bắt buộc · thiếu</Tag>)}
                {fp ? (u ? <a href={u} target="_blank" rel="noopener noreferrer"><code>{fp}</code></a> : <code>{fp}</code>)
                  : x.path?.includes('{spec}') ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>(đặt thư mục spec cho hạng mục để có đường dẫn)</Typography.Text> : null}
              </Space>
            </List.Item>
          );
        }} />
      )}
      {sharedRefs.length > 0 && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          Luật dùng chung áp dụng (gắn ở tab Nền tảng):{' '}
          {sharedRefs.map((x, i) => {
            const u = blob(p, x.path);
            return <span key={x.id}>{i ? ' · ' : ''}<a href={u || `${proc.site}/mau/${x.id}.html`} target="_blank" rel="noopener noreferrer">{u ? x.path : x.title}</a></span>;
          })}
        </Typography.Paragraph>
      )}
    </>
  );
}

/* ---------- ký gate ---------- */
function GateBox({ proc, p, tid, t, v, gateKey }: { proc: Process; p: Project; tid: string; t: Track; v: TrackView; gateKey: string }) {
  const { message, modal } = App.useApp();
  const g = proc.gates.find((x) => x.key === gateKey)!;
  const gv = t.gates[gateKey];
  const info = v.gates[gateKey];
  const passBlocked = !!info.blocker || info.pendingAi > 0;
  const sign = useProjectMutation(
    (body: { result: string; note: string }) => api<{ project: Project; reset: string[] }>('PUT', `/api/projects/${p.id}/t/${tid}/gates/${gateKey}`, body),
    (r) => r.project,
  );

  if (!info.applies) {
    return <Alert style={{ marginTop: 16 }} type="info" showIcon message={<Space>⛔ <b>{g.id}</b> <Tag>Không áp dụng</Tag></Space>} description={`Bước ${g.at} đã bỏ qua nên gate này không áp dụng.`} />;
  }
  return (
    <Card
      size="small"
      style={{ marginTop: 16, borderColor: gv.result === 'pass' ? '#b7eb8f' : gv.result === 'fail' ? '#ffccc7' : undefined, background: gv.result === 'pass' ? '#f6ffed' : gv.result === 'fail' ? '#fff2f0' : undefined }}
      title={<Space wrap>⛔ <b><Term k="gate">{g.id}</Term></b><Tag color={GATE_COLOR[gv.result]}>{proc.labels.GATE_RESULT[gv.result]}</Tag>{gv.by && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{gv.by} · {fmt(gv.at)}</Typography.Text>}</Space>}
    >
      <Descriptions size="small" column={1}>
        <Descriptions.Item label="Người duyệt">{g.owner}</Descriptions.Item>
        <Descriptions.Item label="Vai trò được ký">{g.roles.length ? <Space wrap>{g.roles.map((r) => <Tag key={r} color={p.view.me.roles.includes(r) ? 'blue' : 'default'}>{proc.roles.find((x) => x.key === r)?.label || r}</Tag>)}</Space> : 'Bất kỳ ai'}</Descriptions.Item>
        <Descriptions.Item label="Điều kiện">{g.check}</Descriptions.Item>
        <Descriptions.Item label="Sau gate">{g.after}</Descriptions.Item>
        {gv.note && <Descriptions.Item label="Ghi chú">{gv.note}</Descriptions.Item>}
      </Descriptions>
      {info.roleBlocker && <Alert type="error" showIcon message={info.roleBlocker} style={{ margin: '8px 0' }} />}
      {info.blocker && <Alert type="warning" showIcon message={info.blocker} style={{ margin: '8px 0' }} />}
      {info.pendingAi > 0 && <Alert type="warning" showIcon message={<>Còn {info.pendingAi} mục AI chưa được người duyệt — chưa ký "Đạt" được (<Term k="humanGate">Human Gate</Term>). Mở mục "Dùng AI" ở bước chứa mục đó để nhờ người khác duyệt.</>} style={{ margin: '8px 0' }} />}
      {info.missingDocs.length > 0 && (
        <Alert type="warning" showIcon style={{ margin: '8px 0' }} message="Thiếu tài liệu bắt buộc (chỉ cảnh báo)"
          description={info.missingDocs.map((d) => `${d.step}: ${d.title}`).join(' · ')} />
      )}
      <Form
        // gate có thể bị đổi từ nơi khác (vd 4b rớt → Gate 4 tự về "Chưa ký") → key theo dữ liệu để form nạp lại
        key={`${gv.result}|${gv.at}`}
        layout="vertical"
        initialValues={{ result: gv.result, note: gv.note }}
        onFinish={(f) => {
          const doSign = () => sign.mutate({ result: f.result, note: f.note || '' }, {
            onSuccess: (r) => {
              if (f.result === 'pass') {
                fireGateConfetti();
              }
              message.success(`${g.id}: ${proc.labels.GATE_RESULT[f.result as keyof typeof proc.labels.GATE_RESULT]}${r.reset.length ? ` — đã huỷ ${r.reset.join(', ')}` : ''}`);
            },
            onError: (e) => {
              triggerHapticShake();
              message.error(e.message);
            },
          });
          // không có hoàn tác: hỏi lại trước khi đánh "Không đạt" hoặc làm mất "Đạt" của gate phụ thuộc
          const deps = proc.gates.filter((d) => (d.requires || []).includes(gateKey) && t.gates[d.key]?.result === 'pass');
          if (f.result !== 'pass' && f.result !== gv.result && (f.result === 'fail' || deps.length)) {
            modal.confirm({
              title: `Ký ${g.id}: ${proc.labels.GATE_RESULT[f.result as keyof typeof proc.labels.GATE_RESULT]}?`,
              content: deps.length ? `Việc này sẽ huỷ kết quả "Đạt" của ${deps.map((d) => d.id).join(', ')} (phải ký lại).` : 'Gate không đạt nghĩa là phải quay lại sửa; PM của dự án sẽ được báo.',
              okText: 'Vẫn ký', cancelText: 'Huỷ', onOk: doSign,
            });
          } else doSign();
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="result" label="Kết quả" extra={passBlocked ? 'Chưa chọn "Đạt" được — xem cảnh báo phía trên' : undefined}>
              <Select options={Object.entries(proc.labels.GATE_RESULT).map(([value, label]) => ({ value, label, disabled: value === 'pass' && passBlocked }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={18}><Form.Item name="note" label="Ghi chú / biên bản"><Input maxLength={2000} /></Form.Item></Col>
        </Row>
        <Tooltip title={info.roleBlocker}>
          <span><Button type="primary" htmlType="submit" loading={sign.isPending} disabled={!!info.roleBlocker}>Ký gate</Button></span>
        </Tooltip>
      </Form>
    </Card>
  );
}

/* ---------- nhật ký dùng AI của bước ---------- */
function AiLogs({ proc, p, tid, st, logs }: { proc: Process; p: Project; tid: string; st: ProcStep; logs: AiLog[] }) {
  const { message } = App.useApp();
  const me = useMe().data!;
  const [form] = Form.useForm();
  const origin = Form.useWatch('origin', form) as AiOrigin | undefined;
  const tools = p.aiSetup.tools;
  const stepPrompts = (proc.prompts || []).filter((x) => x.step === st.code);
  // đã khai báo thành viên thì chỉ thành viên mới ghi / duyệt
  const canWrite = !p.view.me.enforced || p.members.some((m) => m.userId === me.id);

  const add = useProjectMutation((body: object) => api<Project>('POST', `/api/projects/${p.id}/t/${tid}/ai-logs`, body));
  const review = useProjectMutation((v: { id: string; result: 'accepted' | 'edited' | 'rejected' }) => api<Project>('PUT', `/api/projects/${p.id}/ai-logs/${v.id}/review`, { result: v.result }));
  const del = useProjectMutation((id: string) => api<Project>('DELETE', `/api/projects/${p.id}/ai-logs/${id}`));
  const onErr = (e: Error) => message.error(e.message);

  return (
    <>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        Ghi lại mỗi lần dùng AI ở bước này: công cụ, mục đích, mã prompt và nhãn nguồn gốc. <b>Không dán nội dung prompt</b> (có thể chứa dữ liệu nhạy cảm).
        Nội dung do AI sinh phải được <b>người khác người ghi</b> duyệt trước khi ký gate.
      </Typography.Paragraph>
      {logs.length > 0 && (
        <List size="small" dataSource={logs} renderItem={(l) => (
          <List.Item actions={[
            canWrite && l.result === 'pending' && l.by !== me.id && (
              <Space key="rv" size="middle">
                {(['accepted', 'edited', 'rejected'] as const).map((result) => (
                  <a key={result} style={result === 'rejected' ? { color: '#a8071a' } : undefined}
                    onClick={() => review.mutate({ id: l.id, result }, { onSuccess: () => message.success('Đã ghi nhận kết quả duyệt'), onError: onErr })}>
                    {proc.labels.AI_RESULT[result]}
                  </a>
                ))}
              </Space>
            ),
            (me.admin || (l.by === me.id && (l.result === 'pending' || l.result === 'na'))) && (
              <Popconfirm key="del" title="Xoá mục nhật ký này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => del.mutate(l.id, { onError: onErr })}><a style={{ color: '#a8071a' }}>Xoá</a></Popconfirm>
            ),
          ].filter(Boolean)}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space wrap>
                <Tag color={ORIGIN_COLOR[l.origin]}>{proc.labels.AI_ORIGIN[l.origin]}</Tag>
                {l.tool && <Tag>{l.tool}{l.model ? ` · ${l.model}` : ''}</Tag>}
                {l.promptId && <code>{l.promptId}</code>}
                <Tag color={RESULT_COLOR[l.result]}>{proc.labels.AI_RESULT[l.result]}</Tag>
                <span>{l.purpose}</span>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {l.byName} · {fmt(l.at)}{l.reviewerName && ` — duyệt: ${l.reviewerName} · ${fmt(l.reviewedAt)}`}{l.reviewNote && ` · ${l.reviewNote}`}{l.note && ` · ghi chú: ${l.note}`}
              </Typography.Text>
            </Space>
          </List.Item>
        )} />
      )}

      {!canWrite ? <Alert type="info" showIcon message="Chỉ thành viên của dự án mới ghi / duyệt nhật ký AI." style={{ marginTop: 8 }} /> : (
        <Form form={form} layout="vertical" initialValues={{ origin: 'ai' }} style={{ marginTop: 8 }}
          onFinish={(f) => add.mutate({ step: st.code, origin: f.origin, tool: f.tool || '', model: f.model || '', promptId: f.promptId || '', purpose: f.purpose || '', note: f.note || '' },
            { onSuccess: () => { message.success('Đã ghi nhật ký AI'); form.resetFields(); }, onError: onErr })}>
          {origin !== 'manual' && tools.length === 0 && (
            <Alert type="warning" showIcon style={{ marginBottom: 8 }} message="Dự án chưa khai báo công cụ AI được duyệt"
              description={<>Vào tab <Link to={`/p/${p.id}/t/base`}>Nền tảng</Link>, mục Thiết lập AI, để thêm công cụ.</>} />
          )}
          <Row gutter={16}>
            <Col xs={24} md={6}><Form.Item name="origin" label="Nguồn gốc" rules={[{ required: true }]}><Select options={Object.entries(proc.labels.AI_ORIGIN).map(([value, label]) => ({ value, label }))} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="tool" label="Công cụ AI" rules={[{ required: origin !== 'manual', message: 'Chọn công cụ' }]}><Select disabled={origin === 'manual'} placeholder="Chọn công cụ được duyệt" options={tools.map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="model" label="Model (tuỳ chọn)"><Input maxLength={80} placeholder="vd: sonnet" /></Form.Item></Col>
            <Col xs={24} md={6}>
              <Form.Item name="promptId" label="Mã prompt (tuỳ chọn)" rules={[{ pattern: /^[A-Za-z0-9_.-]*$/, message: 'Chỉ gồm chữ, số và . _ -' }]}>
                {stepPrompts.length > 0 ? (
                  <Select
                    showSearch
                    allowClear
                    placeholder="Chọn prompt chuẩn"
                    options={stepPrompts.map((pr) => ({ value: pr.id, label: `${pr.id} · ${pr.title}` }))}
                    onChange={(val) => {
                      const sel = stepPrompts.find((pr) => pr.id === val);
                      if (sel && !form.getFieldValue('purpose')) {
                        form.setFieldValue('purpose', sel.title);
                      }
                    }}
                  />
                ) : (
                  <Input maxLength={40} placeholder="vd: P-B11-01" />
                )}
              </Form.Item>
            </Col>
            <Col xs={24} md={18}><Form.Item name="purpose" label="Mục đích dùng" rules={[{ required: true, message: 'Ghi mục đích dùng' }]}><Input maxLength={300} placeholder="vd: Sinh test case từ AC của US-12" /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="note" label="Ghi chú"><Input maxLength={500} /></Form.Item></Col>
          </Row>
          <Button htmlType="submit" loading={add.isPending}>Ghi nhận</Button>
        </Form>
      )}
    </>
  );
}

/* ---------- quản lý bug của bước ---------- */
function Bugs({ proc, p, tid, st, bugs, users }: { proc: Process; p: Project; tid: string; st: ProcStep; bugs: Bug[]; users: User[] }) {
  const { message } = App.useApp();
  const me = useMe().data!;
  const [form] = Form.useForm();
  const [showAdd, setShowAdd] = useState(false);

  const add = useProjectMutation((body: object) => api<Project>('POST', `/api/projects/${p.id}/t/${tid}/bugs`, body));
  const update = useProjectMutation((v: { id: string; patch: object }) => api<Project>('PUT', `/api/projects/${p.id}/bugs/${v.id}`, v.patch));
  const del = useProjectMutation((id: string) => api<Project>('DELETE', `/api/projects/${p.id}/bugs/${id}`));
  const onErr = (e: Error) => message.error(e.message);

  return (
    <>
      <Space style={{ marginBottom: 12, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
          Theo dõi lỗi phát sinh. <b>Gate 4 yêu cầu bug S1–S2 = 0</b> để được nghiệm thu UAT.
        </Typography.Paragraph>
        <Button size="small" type="primary" onClick={() => setShowAdd(true)}>+ Báo Bug mới</Button>
      </Space>

      {showAdd && (
        <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }} title="Báo Bug mới">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ severity: 'S2' }}
            onFinish={(f) => add.mutate(
              { step: st.code, title: f.title, severity: f.severity, fixBy: f.fixBy, note: f.note },
              {
                onSuccess: () => {
                  message.success('Đã tạo bug mới');
                  form.resetFields();
                  setShowAdd(false);
                },
                onError: onErr,
              }
            )}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="title" label="Tiêu đề bug" rules={[{ required: true, message: 'Nhập tiêu đề bug' }]}>
                  <Input maxLength={200} placeholder="vd: Lỗi tính sai phí khi quét mã QR" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="severity" label="Mức độ" rules={[{ required: true }]}>
                  <Select options={Object.entries(proc.labels.BUG_SEVERITY).map(([value, label]) => ({ value, label }))} />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="fixBy" label="Giao sửa (tuỳ chọn)">
                  <Select allowClear placeholder="Chọn người" options={users.filter((u) => !u.disabled).map((u) => ({ value: u.id, label: u.name }))} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="note" label="Mô tả / Các bước tái hiện">
                  <Input.TextArea rows={2} maxLength={1000} placeholder="Các bước tái hiện, kết quả thực tế vs kết quả mong muốn..." />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" htmlType="submit" loading={add.isPending}>Lưu bug</Button>
              <Button onClick={() => setShowAdd(false)}>Huỷ</Button>
            </Space>
          </Form>
        </Card>
      )}

      {bugs.length === 0 ? (
        <Typography.Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>Chưa có bug nào được ghi nhận ở bước này.</Typography.Text>
      ) : (
        <List
          size="small"
          dataSource={bugs}
          renderItem={(b) => (
            <List.Item
              actions={[
                b.status !== 'closed' ? (
                  <Button
                    key="close"
                    size="small"
                    type="link"
                    style={{ color: '#52c41a' }}
                    onClick={() => update.mutate({ id: b.id, patch: { status: 'closed' } }, { onSuccess: () => message.success(`Đã đóng ${b.code}`), onError: onErr })}
                  >
                    ✓ Đóng bug
                  </Button>
                ) : (
                  <Button
                    key="reopen"
                    size="small"
                    type="link"
                    onClick={() => update.mutate({ id: b.id, patch: { status: 'open' } }, { onSuccess: () => message.success(`Đã mở lại ${b.code}`), onError: onErr })}
                  >
                    Mở lại
                  </Button>
                ),
                (me.admin || b.foundBy === me.id) && (
                  <Popconfirm key="del" title="Xoá bug này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => del.mutate(b.id, { onError: onErr })}>
                    <a style={{ color: '#a8071a' }}>Xoá</a>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space wrap>
                  <code>{b.code}</code>
                  <Tag color={BUG_SEVERITY_COLOR[b.severity]}>{proc.labels.BUG_SEVERITY[b.severity]}</Tag>
                  <Tag color={BUG_STATUS_COLOR[b.status]}>{proc.labels.BUG_STATUS[b.status]}</Tag>
                  <span style={{ fontWeight: b.status !== 'closed' ? 500 : 'normal', textDecoration: b.status === 'closed' ? 'line-through' : undefined }}>{b.title}</span>
                </Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Báo bởi: {b.foundByName} ({fmt(b.createdAt)})
                  {b.fixByName && ` · Giao cho: ${b.fixByName}`}
                  {b.closedBy && ` · Đã đóng bởi: ${b.closedBy} (${fmt(b.closedAt || undefined)})`}
                  {b.note && ` · ${b.note}`}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </>
  );
}

// Tab Nền tảng: Thiết lập AI của dự án (B2) + Thành viên & vai trò
import { useState } from 'react';
import { Alert, App, Button, Card, Descriptions, Flex, Form, Select, Space, Table, Tag, Typography } from 'antd';
import { api, useProjectMutation } from '../api';
import { options } from '../components';
import type { Member, Process, Project, Role, User } from '../types';

const TOOL_HINTS = ['Claude', 'ChatGPT', 'GitHub Copilot', 'Gemini', 'Cursor'];

/* ---------- thiết lập AI: công cụ được duyệt, mức nhạy cảm dữ liệu, file luật bắt buộc ---------- */
export function AiSetupCard({ p, proc }: { p: Project; proc: Process }) {
  const { message } = App.useApp();
  const save = useProjectMutation((body: object) => api<Project>('PUT', `/api/projects/${p.id}/ai-setup`, body));
  const can = p.view.me.canSetup;
  const required = proc.steps.find((s) => s.code === 'B2')!.templates.filter((t) => t.required);
  const has = (id: string) => (p.docs || []).some((d) => d.track === 'base' && d.step === 'B2' && d.templateId === id);
  const { ready, missing } = p.view.setup;

  return (
    <Card style={{ marginBottom: 16 }} title="Thiết lập AI của dự án (B2)" extra={<Tag color={ready ? 'success' : 'warning'}>{ready ? 'Sẵn sàng dùng AI' : 'Chưa đủ'}</Tag>}>
      {ready
        ? <Alert type="success" showIcon message="Dự án đã sẵn sàng: B2 xong, có công cụ AI được duyệt, mức dữ liệu và đủ file luật." style={{ marginBottom: 16 }} />
        : <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Chưa tạo được hạng mục mới (admin có thể bỏ qua có chủ đích) cho tới khi đủ:"
            description={<ul style={{ margin: 0, paddingLeft: 20 }}>{missing.map((m) => <li key={m}>{m}</li>)}</ul>} />}
      <Form
        key={JSON.stringify(p.aiSetup)}
        layout="vertical"
        initialValues={p.aiSetup}
        disabled={!can}
        onFinish={(f) => save.mutate({ tools: f.tools || [], dataLevel: f.dataLevel || '' }, { onSuccess: () => message.success('Đã lưu thiết lập AI'), onError: (e) => message.error(e.message) })}
      >
        <Flex gap={16} wrap>
          <Form.Item name="tools" label="Công cụ AI được duyệt" style={{ flex: '2 1 320px' }} extra="Nhật ký dùng AI của dự án chỉ chọn trong danh sách này. Gõ tên rồi Enter để thêm.">
            <Select mode="tags" tokenSeparators={[',']} placeholder="vd: Claude, GitHub Copilot" options={TOOL_HINTS.map((x) => ({ value: x, label: x }))} />
          </Form.Item>
          <Form.Item name="dataLevel" label="Mức nhạy cảm dữ liệu tối đa được đưa vào AI" style={{ flex: '1 1 240px' }}>
            <Select allowClear placeholder="Chọn mức" options={options(proc.labels.DATA_LEVEL)} />
          </Form.Item>
        </Flex>
        {can ? <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu thiết lập AI</Button>
          : <Typography.Text type="secondary">Chỉ admin, PM hoặc Tech Lead của dự án mới sửa được.</Typography.Text>}
      </Form>
      <Typography.Paragraph style={{ margin: '16px 0 8px' }}><b>File luật bắt buộc ở B2</b> (gắn đúng biểu mẫu ở bước B2 bên dưới):</Typography.Paragraph>
      <Space wrap>{required.map((t) => <Tag key={t.id} color={has(t.id) ? 'success' : 'warning'}>{has(t.id) ? '✓' : '✗'} {t.title}</Tag>)}</Space>
    </Card>
  );
}

/* ---------- thành viên & vai trò (RACI) ---------- */
export function MembersCard({ p, proc, users }: { p: Project; proc: Process; users: User[] }) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Member[]>(p.members);
  const save = useProjectMutation((members: Member[]) => api<Project>('PUT', `/api/projects/${p.id}/members`, { members }));
  const can = p.view.me.canManage;
  const nameOf = (id: string) => users.find((u) => u.id === id);
  const addable = users.filter((u) => !u.disabled && !rows.some((r) => r.userId === u.id));
  const empty = rows.filter((r) => r.roles.length === 0).length;
  const setRoles = (userId: string, roles: Role[]) => setRows(rows.map((r) => (r.userId === userId ? { ...r, roles } : r)));

  return (
    <Card style={{ marginBottom: 16 }} title="Thành viên & vai trò" extra={<Tag color={p.view.me.enforced ? 'blue' : 'default'}>{p.view.me.enforced ? 'Đang kiểm soát vai trò' : 'Chưa kiểm soát'}</Tag>}>
      {!p.view.me.enforced && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Chưa khai báo thành viên — mọi tài khoản đều ký được mọi gate."
          description="Thêm thành viên và vai trò để chỉ đúng vai trò (theo RACI của quy trình) mới ký được từng gate." />
      )}
      <Table<Member>
        size="small" rowKey="userId" dataSource={rows} pagination={false} locale={{ emptyText: 'Chưa có thành viên' }}
        columns={[
          { title: 'Thành viên', key: 'name', render: (_, r) => <Space direction="vertical" size={0}>{nameOf(r.userId)?.name || '(đã xoá)'}<Typography.Text type="secondary" style={{ fontSize: 12 }}>@{nameOf(r.userId)?.username}</Typography.Text></Space> },
          {
            title: 'Vai trò (kiêm nhiệm được)', key: 'roles',
            render: (_, r) => <Select mode="multiple" style={{ minWidth: 280 }} disabled={!can} value={r.roles} placeholder="Chọn vai trò" onChange={(v) => setRoles(r.userId, v)} options={proc.roles.map((x) => ({ value: x.key, label: x.label }))} />,
          },
          { title: '', key: 'op', width: 80, render: (_, r) => can && <a style={{ color: '#a8071a' }} onClick={() => setRows(rows.filter((x) => x.userId !== r.userId))}>Xoá</a> },
        ]}
      />
      {can ? (
        <Flex gap={16} wrap align="center" style={{ marginTop: 16 }}>
          <Select showSearch style={{ width: 280 }} placeholder="Thêm thành viên…" value={null} optionFilterProp="label"
            options={addable.map((u) => ({ value: u.id, label: `${u.name} (@${u.username})` }))} onChange={(id: string) => setRows([...rows, { userId: id, roles: [] }])} />
          <Button type="primary" loading={save.isPending} onClick={() => save.mutate(rows, { onSuccess: () => message.success('Đã lưu thành viên & vai trò'), onError: (e) => message.error(e.message) })}>Lưu thành viên</Button>
          {empty > 0 && <Typography.Text type="warning">{empty} người chưa có vai trò sẽ bị bỏ khi lưu</Typography.Text>}
        </Flex>
      ) : <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>Chỉ admin hoặc PM của dự án mới sửa được thành viên.</Typography.Paragraph>}

      <Typography.Paragraph style={{ margin: '24px 0 8px' }}><b>Vai trò được ký từng gate</b> (theo cột "Người duyệt" của quy trình):</Typography.Paragraph>
      <Descriptions size="small" bordered column={{ xs: 1, md: 2 }}>
        {proc.gates.map((g) => (
          <Descriptions.Item key={g.key} label={`${g.id} · ${g.at}`}>
            <Space wrap>{g.roles.map((r) => <Tag key={r}>{proc.roles.find((x) => x.key === r)?.label || r}</Tag>)}</Space>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
}

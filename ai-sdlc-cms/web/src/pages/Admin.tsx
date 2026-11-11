// Quản trị: bảng dự án + bảng tài khoản (Table: tìm kiếm, lọc, sắp xếp, phân trang) + hộp thoại tạo mới
import { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Alert, App, Button, Card, Checkbox, Flex, Form, Input, Popconfirm, Radio, Select, Space, Table, Tag, Typography, type TableColumnsType } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { api, useProjects, useUsers } from '../api';
import { Field, FilterBar, FormModal, options, PageHeader, showTotal } from '../components';
import type { Project, User } from '../types';
import { fmt, fold } from '../util';

type Role = 'admin' | 'member' | 'locked';
const role = (u: User): Role => (u.disabled ? 'locked' : u.admin ? 'admin' : 'member');

export default function Admin() {
  const { user: me } = useOutletContext<{ user: User }>();
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const projects = useProjects();
  const users = useUsers();
  const [pf, setPf] = useState<{ q: string; state?: 'active' | 'archived' }>({ q: '' });
  const [uf, setUf] = useState<{ q: string; role?: Role }>({ q: '' });

  const projectRows = useMemo(() => {
    const t = fold(pf.q.trim());
    return (projects.data || []).filter((p) => (!t || fold(`${p.name} ${p.code}`).includes(t)) && (!pf.state || (pf.state === 'archived') === p.archived));
  }, [projects.data, pf]);
  const userRows = useMemo(() => {
    const t = fold(uf.q.trim());
    return (users.data || []).filter((u) => (!t || fold(`${u.username} ${u.name}`).includes(t)) && (!uf.role || role(u) === uf.role));
  }, [users.data, uf]);

  if (!me.admin) return <><PageHeader title="Quản trị" /><Typography.Text type="danger">Chỉ dành cho admin.</Typography.Text></>;

  const run = async (fn: () => Promise<unknown>, ok: string, keys: string[]) => {
    try { await fn(); message.success(ok); keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); return true; }
    catch (e) { message.error((e as Error).message); return false; }
  };

  const projectCols: TableColumnsType<Project> = [
    { title: 'Tên', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name, 'vi'), render: (_, p) => <Link to={`/p/${p.id}`}>{p.name}</Link> },
    { title: 'Mã', dataIndex: 'code' },
    {
      title: 'Quyền riêng tư',
      key: 'visibility',
      render: (_, p) => (p.visibility === 'private' ? <Tag color="purple">🔒 Nội bộ</Tag> : <Tag color="default">🌐 Công khai</Tag>),
    },
    { title: 'Trạng thái', key: 'state', render: (_, p) => (p.archived ? <Tag>Lưu trữ</Tag> : <Tag color="success">Đang hoạt động</Tag>) },
    { title: 'Hạng mục', key: 'items', render: (_, p) => (p.items || []).filter((i) => !i.archived).length },
    { title: 'Repo', dataIndex: 'repoUrl', ellipsis: true, render: (v) => (v ? <a href={v} target="_blank" rel="noopener noreferrer">{v}</a> : '—') },
    { title: 'Tạo lúc', dataIndex: 'createdAt', defaultSortOrder: 'descend', sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), render: (v) => fmt(v) },
    {
      title: 'Thao tác', key: 'op', render: (_, p) => (
        <Popconfirm title={p.archived ? 'Bỏ lưu trữ dự án?' : 'Lưu trữ dự án này?'} okText="Đồng ý" cancelText="Huỷ"
          onConfirm={() => run(() => api('POST', `/api/projects/${p.id}/archive`, { archived: !p.archived }), p.archived ? 'Đã bỏ lưu trữ' : 'Đã lưu trữ', ['projects', 'project'])}>
          <a>{p.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}</a>
        </Popconfirm>
      ),
    },
  ];

  const userCols: TableColumnsType<User> = [
    { title: 'Tên đăng nhập', dataIndex: 'username', defaultSortOrder: 'ascend', sorter: (a, b) => a.username.localeCompare(b.username) },
    { title: 'Họ tên', dataIndex: 'name' },
    { title: 'Quyền', key: 'role', render: (_, u) => <Space>{u.admin ? <Tag color="blue">Admin</Tag> : <Tag>Thành viên</Tag>}{u.disabled && <Tag color="error">Đã khoá</Tag>}</Space> },
    {
      title: 'Thao tác', key: 'op', render: (_, u) => (u.id === me.id ? null : (
        <Space size="middle">
          <Popconfirm title={u.disabled ? `Mở khoá ${u.username}?` : `Khoá ${u.username}? Phiên đăng nhập của họ sẽ bị huỷ.`} okText="Đồng ý" cancelText="Huỷ"
            onConfirm={() => run(() => api('POST', `/api/admin/users/${u.id}/disabled`, { disabled: !u.disabled }), u.disabled ? 'Đã mở khoá' : 'Đã khoá', ['users'])}>
            <a style={u.disabled ? undefined : { color: '#a8071a' }}>{u.disabled ? 'Mở khoá' : 'Khoá'}</a>
          </Popconfirm>
          <Popconfirm title={`Đặt lại mật khẩu cho ${u.username}?`} okText="Đặt lại" cancelText="Huỷ"
            onConfirm={async () => {
              try {
                const r = await api<{ password: string }>('POST', `/api/admin/users/${u.id}/reset`);
                // mật khẩu chỉ hiện 1 lần, không lưu ở đâu
                modal.info({ title: `Mật khẩu mới của ${u.username}`, content: <><Typography.Paragraph copyable={{ text: r.password }}><code>{r.password}</code></Typography.Paragraph><Typography.Text type="secondary">Chỉ hiện 1 lần — gửi cho người dùng và yêu cầu đổi ngay.</Typography.Text></> });
              } catch (e) { message.error((e as Error).message); }
            }}>
            <a>Đặt lại mật khẩu</a>
          </Popconfirm>
          <Popconfirm title={`Xoá hẳn ${u.username}?`} description="Gỡ khỏi mọi dự án và bước đang phụ trách, không hoàn tác được. Nếu chỉ tạm ngưng thì hãy Khoá." okText="Xoá" okButtonProps={{ danger: true }} cancelText="Huỷ"
            onConfirm={() => run(() => api('DELETE', `/api/admin/users/${u.id}`), 'Đã xoá tài khoản', ['users', 'projects'])}>
            <a style={{ color: '#a8071a' }}>Xoá</a>
          </Popconfirm>
        </Space>
      )),
    },
  ];

  return (
    <>
      <PageHeader title="Quản trị" />
      <Alert
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
        message={<b>Quản lý Phân quyền & Vai trò (RBAC / RACI)</b>}
        description={
          <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 4 }}>
            <span>Thiết lập ma trận thành viên dự án, phân công vai trò (PM, PO, TechLead, Dev, Test...) và kiểm soát thẩm quyền phê duyệt Quality Gates.</span>
            <Button type="primary" size="small" icon={<SafetyCertificateOutlined />} onClick={() => nav('/admin/permissions')}>
              Mở trang Phân quyền & Vai trò
            </Button>
          </Flex>
        }
        style={{ marginBottom: 20 }}
      />
      <Card title="Dự án" style={{ marginBottom: 24 }} extra={
        <FormModal title="Tạo dự án" okText="Tạo dự án" initialValues={{ branch: 'main', repoType: 'gitlab', visibility: 'public' }}
          trigger={<Button type="primary" icon={<PlusOutlined />}>Tạo dự án</Button>}
          onSubmit={(v) => run(() => api('POST', '/api/projects', v), 'Đã tạo dự án', ['projects'])}>
          <Form.Item name="name" label="Tên dự án" rules={[{ required: true }]}><Input maxLength={120} /></Form.Item>
          <Form.Item name="code" label="Mã"><Input maxLength={30} /></Form.Item>
          <Form.Item name="visibility" label="Quyền riêng tư">
            <Radio.Group options={[
              { value: 'public', label: '🌐 Công khai (Toàn bộ thành viên xem được)' },
              { value: 'private', label: '🔒 Nội bộ (Chỉ thành viên được gán mới thấy)' },
            ]} />
          </Form.Item>
          <Form.Item name="repoUrl" label="Repo URL" rules={[{ type: 'url', message: 'URL không hợp lệ' }]}><Input placeholder="https://git.cong-ty.vn/nhom/du-an" /></Form.Item>
          <Form.Item name="repoType" label="Loại repo"><Select options={[{ value: 'gitlab', label: 'GitLab (kể cả GitLab nội bộ)' }, { value: 'github', label: 'GitHub' }]} /></Form.Item>
          <Form.Item name="branch" label="Nhánh chính"><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea maxLength={1000} /></Form.Item>
        </FormModal>
      }>
        <FilterBar onReset={() => setPf({ q: '' })}>
          <Field label="Tìm kiếm" width={260}><Input.Search allowClear placeholder="Tên hoặc mã dự án" value={pf.q} onChange={(e) => setPf({ ...pf, q: e.target.value })} /></Field>
          <Field label="Trạng thái"><Select allowClear placeholder="Tất cả" value={pf.state} onChange={(state) => setPf({ ...pf, state })} options={options({ active: 'Đang hoạt động', archived: 'Lưu trữ' })} /></Field>
        </FilterBar>
        <Table<Project> rowKey="id" columns={projectCols} dataSource={projectRows} loading={projects.isLoading} scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: showTotal('dự án') }} />
      </Card>

      <Card title="Tài khoản" extra={
        <FormModal title="Tạo tài khoản" okText="Tạo tài khoản"
          trigger={<Button type="primary" icon={<PlusOutlined />}>Tạo tài khoản</Button>}
          onSubmit={(v: { admin?: boolean }) => run(() => api('POST', '/api/admin/users', { ...v, admin: !!v.admin }), 'Đã tạo tài khoản', ['users'])}>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }, { pattern: /^[a-z0-9._-]{3,32}$/, message: '3–32 ký tự: a-z, 0-9, . _ -' }]}><Input /></Form.Item>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}><Input maxLength={80} /></Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item name="admin" valuePropName="checked"><Checkbox>Admin</Checkbox></Form.Item>
        </FormModal>
      }>
        <FilterBar onReset={() => setUf({ q: '' })}>
          <Field label="Tìm kiếm" width={260}><Input.Search allowClear placeholder="Tên đăng nhập hoặc họ tên" value={uf.q} onChange={(e) => setUf({ ...uf, q: e.target.value })} /></Field>
          <Field label="Quyền"><Select allowClear placeholder="Tất cả" value={uf.role} onChange={(r) => setUf({ ...uf, role: r })} options={options({ admin: 'Admin', member: 'Thành viên', locked: 'Đã khoá' })} /></Field>
        </FilterBar>
        <Table<User> rowKey="id" columns={userCols} dataSource={userRows} loading={users.isLoading}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: showTotal('tài khoản') }} />
      </Card>
    </>
  );
}

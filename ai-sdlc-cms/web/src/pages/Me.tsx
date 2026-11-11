import { useState } from 'react';
import { App, Alert, Button, Card, Descriptions, Form, Input, Popconfirm, Space, Tag, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useMe } from '../api';
import { PageHeader } from '../components';
import type { TgMine } from '../types';

export default function Me() {
  const { message } = App.useApp();
  const me = useMe().data!;
  const [form] = Form.useForm();
  return (
    <>
      <PageHeader title="Tài khoản" />
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Họ tên">{me.name}</Descriptions.Item>
          <Descriptions.Item label="Tên đăng nhập">@{me.username}</Descriptions.Item>
          <Descriptions.Item label="Quyền">{me.admin ? <Tag color="blue">Admin</Tag> : <Tag>Thành viên</Tag>}</Descriptions.Item>
        </Descriptions>
        <Typography.Title level={5}>Đổi mật khẩu</Typography.Title>
        <Form
          form={form} layout="vertical" style={{ maxWidth: 400 }}
          onFinish={async (v) => {
            try { await api('POST', '/api/me/password', v); message.success('Đã đổi mật khẩu'); form.resetFields(); }
            catch (e) { message.error((e as Error).message); }
          }}
        >
          <Form.Item name="current" label="Mật khẩu hiện tại" rules={[{ required: true }]}><Input.Password autoComplete="current-password" /></Form.Item>
          <Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Button type="primary" htmlType="submit">Đổi mật khẩu</Button>
        </Form>
      </Card>
      <TelegramCard />
    </>
  );
}

/* ---------- liên kết Telegram: lấy mã → mở link bot (hoặc gửi /start MÃ) → trang tự nhận ra khi đã liên kết ---------- */
function TelegramCard() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [code, setCode] = useState<{ code: string; link: string } | null>(null);
  const q = useQuery({
    queryKey: ['tg-me'],
    queryFn: () => api<TgMine>('GET', '/api/me/telegram'),
    // đang chờ người dùng bấm /start trong Telegram → hỏi lại mỗi 3 giây tới khi liên kết xong
    refetchInterval: (query) => (code && !query.state.data?.linked ? 3000 : false),
  });
  const t = q.data;
  if (!t) return null;
  if (t.linked && code) setCode(null);

  const getCode = async () => {
    try { setCode(await api('POST', '/api/me/telegram/code')); } catch (e) { message.error((e as Error).message); }
  };
  const unlink = async () => {
    try { qc.setQueryData(['tg-me'], await api<TgMine>('DELETE', '/api/me/telegram')); message.success('Đã huỷ liên kết'); }
    catch (e) { message.error((e as Error).message); }
  };

  return (
    <Card title={<Space><SendOutlined /> Liên kết Telegram</Space>} extra={<Tag color={t.linked ? 'success' : 'default'}>{t.linked ? `Đã liên kết${t.tgUsername ? ` · @${t.tgUsername}` : ''}` : 'Chưa liên kết'}</Tag>}>
      {!t.available && !t.linked && <Alert type="info" showIcon message="Quản trị viên chưa bật thông báo Telegram" description="Khi được bật, anh/chị sẽ liên kết được ở đây để nhận thông báo giao việc, gate chờ ký, nội dung AI chờ duyệt." />}
      {t.linked && (
        <Space direction="vertical">
          <Typography.Text>Thông báo riêng (được giao việc, gate chờ ký, AI chờ duyệt…) sẽ gửi vào Telegram của bạn.</Typography.Text>
          <Popconfirm title="Huỷ liên kết Telegram?" okText="Huỷ liên kết" cancelText="Không" onConfirm={unlink}><Button danger>Huỷ liên kết</Button></Popconfirm>
        </Space>
      )}
      {t.available && !t.linked && !code && (
        <Space direction="vertical">
          <Typography.Text>Nhận thông báo riêng qua bot <b>@{t.botUsername}</b>.</Typography.Text>
          <Button type="primary" onClick={getCode}>Lấy mã liên kết</Button>
        </Space>
      )}
      {t.available && !t.linked && code && (
        <Space direction="vertical" size={12}>
          <Typography.Text>Bấm nút bên dưới để mở bot rồi bấm <b>Start</b> — hoặc gửi cho <b>@{t.botUsername}</b> câu lệnh:</Typography.Text>
          <Typography.Text code copyable>{`/start ${code.code}`}</Typography.Text>
          <Space>
            <Button type="primary" href={code.link} target="_blank" rel="noopener noreferrer" icon={<SendOutlined />}>Mở Telegram</Button>
            <Button onClick={getCode}>Lấy mã mới</Button>
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Mã dùng một lần, hết hạn sau 10 phút. Trang này tự cập nhật khi liên kết xong.</Typography.Text>
        </Space>
      )}
    </Card>
  );
}

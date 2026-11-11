// Cấu hình Telegram (admin): token bot, nhóm nhận tóm tắt, sự kiện thông báo, gửi thử, tình trạng liên kết tài khoản
import { App, Alert, AutoComplete, Button, Card, Collapse, Flex, Form, Input, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { PageHeader } from '../components';
import type { TgAdminView, TgEvents } from '../types';

const EVENTS: { key: keyof TgEvents; label: string; hint: string }[] = [
  { key: 'assign', label: 'Được giao bước', hint: 'Báo riêng cho người vừa được giao việc' },
  { key: 'gateWaiting', label: 'Gate chờ ký', hint: 'Báo riêng cho người có vai trò ký gate khi gate tới lượt' },
  { key: 'gateFail', label: 'Gate không đạt', hint: 'Báo riêng cho PM của dự án' },
  { key: 'aiReview', label: 'Nội dung AI chờ duyệt', hint: 'Báo riêng cho PM / Tech Lead của dự án (trừ người ghi)' },
  { key: 'digest', label: 'Tóm tắt buổi sáng', hint: 'Gửi vào nhóm: việc đang chạy, gate chờ, bước quá hạn, AI chờ duyệt' },
];

export default function AdminTelegram() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['tg-admin'], queryFn: () => api<TgAdminView>('GET', '/api/admin/telegram') });
  const v = q.data;
  const [tokenForm] = Form.useForm();
  const [form] = Form.useForm();

  // mọi thao tác trả về trạng thái mới → đặt thẳng vào cache; lỗi hiện thông báo
  const act = useMutation({
    mutationFn: (fn: () => Promise<TgAdminView | { ok: boolean }>) => fn(),
    onError: (e: Error) => message.error(e.message),
    onSuccess: (r) => { if ('configured' in r) qc.setQueryData(['tg-admin'], r); },
  });
  const run = (fn: () => Promise<TgAdminView | { ok: boolean }>, ok: string, after?: () => void) =>
    act.mutate(fn, { onSuccess: () => { message.success(ok); after?.(); } });
  if (!v) return null;
  const s = v.settings;

  return (
    <>
      <PageHeader title="Cấu hình Telegram" crumbs={[{ title: 'Quản trị' }, { title: 'Telegram' }]} />
      <Alert
        style={{ marginBottom: 16 }} showIcon
        type={v.error ? 'error' : v.bot && s.enabled ? 'success' : 'info'}
        message={v.error ? `Lỗi kết nối Telegram: ${v.error}` : !v.configured ? 'Chưa kết nối bot — làm bước 1 bên dưới' : !s.enabled ? `Đã lưu token (bot @${v.bot?.username ?? '…'}) nhưng thông báo đang tắt — bật ở bước 2` : `Đang hoạt động — bot @${v.bot?.username}${v.running ? ', đang nhận lệnh' : ''}`}
      />

      <Card title="1. Kết nối bot" style={{ marginBottom: 16 }}>
        <Collapse ghost style={{ marginBottom: 8 }} items={[{
          key: 'how', label: 'Cách tạo bot và lấy token',
          children: (
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Mở Telegram, tìm <b>@BotFather</b> (có dấu tích xanh) rồi gửi <code>/newbot</code>.</li>
              <li>Đặt tên hiển thị và tên bot (kết thúc bằng <code>bot</code>).</li>
              <li>BotFather trả về <b>token</b> dạng <code>123456789:AAH…</code> — dán vào ô bên dưới.</li>
              <li>Nên gửi <code>/setprivacy</code> cho BotFather và chọn <b>Disable</b> nếu muốn bot đọc được mọi tin trong nhóm (không bắt buộc).</li>
            </ol>
          ),
        }]} />
        <Form form={tokenForm} layout="inline" onFinish={(f) => run(() => api<TgAdminView>('PUT', '/api/admin/telegram/token', { token: f.token }), 'Đã lưu token và kết nối bot', () => tokenForm.resetFields())}>
          <Form.Item name="token" rules={[{ required: true, message: 'Dán token từ @BotFather' }]} style={{ flex: '1 1 420px' }}>
            <Input.Password autoComplete="off" placeholder={v.configured ? `Đã lưu (${v.tokenHint}) — dán token mới để thay` : 'Dán token từ @BotFather'} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={act.isPending}>Lưu & kiểm tra</Button>
        </Form>
        {v.configured && (
          <Space style={{ marginTop: 16 }} wrap>
            <Button onClick={() => run(() => api<TgAdminView>('POST', '/api/admin/telegram/check'), 'Kết nối tốt')}>Kiểm tra kết nối</Button>
            <Popconfirm title="Xoá token bot?" description="Thông báo sẽ dừng; liên kết tài khoản vẫn giữ." okText="Xoá" okButtonProps={{ danger: true }} cancelText="Huỷ"
              onConfirm={() => run(() => api<TgAdminView>('DELETE', '/api/admin/telegram/token'), 'Đã xoá token')}>
              <Button danger>Xoá token</Button>
            </Popconfirm>
            {v.bot && <Tag color="blue">@{v.bot.username}</Tag>}
          </Space>
        )}
        <Typography.Paragraph type="secondary" style={{ margin: '16px 0 0', fontSize: 12 }}>
          Token chỉ lưu trên máy chủ (file secrets.json), không hiển thị lại, không nằm trong bản sao lưu — khôi phục từ bản sao lưu thì nhập lại token.
          Nếu máy chủ không ra được Internet, kiểm tra tường lửa/proxy cho <code>api.telegram.org</code>.
        </Typography.Paragraph>
      </Card>

      <Card title="2. Thông báo" style={{ marginBottom: 16 }}>
        <Form
          form={form} key={JSON.stringify(s)} layout="vertical" disabled={!v.configured}
          initialValues={{ ...s, publicUrl: s.publicUrl || window.location.origin }}
          onFinish={(f) => run(() => api<TgAdminView>('PUT', '/api/admin/telegram/settings', {
            enabled: !!f.enabled, chatId: f.chatId || '', publicUrl: f.publicUrl || '', digestTime: f.digestTime || '08:30', events: f.events,
          }), 'Đã lưu cấu hình')}
        >
          <Form.Item name="enabled" label="Bật thông báo Telegram" valuePropName="checked"><Switch /></Form.Item>
          <Flex gap={16} wrap>
            <Form.Item name="chatId" label="Nhóm nhận tóm tắt" style={{ flex: '2 1 320px' }}
              extra={<>Thêm bot vào nhóm rồi gửi <code>/chatid</code> trong nhóm (cần bật thông báo + lưu trước); nhóm sẽ hiện trong danh sách chọn. Nhóm thường có chat id bắt đầu bằng dấu <code>-</code>.</>}
              rules={[{ pattern: /^(-?\d{1,20})?$/, message: 'Chat ID chỉ gồm chữ số' }]}>
              <AutoComplete allowClear placeholder="Chọn nhóm hoặc dán chat id" options={s.seenChats.map((c) => ({ value: c.id, label: `${c.title || '(không tên)'} (${c.id})` }))} />
            </Form.Item>
            <Form.Item name="digestTime" label="Giờ gửi tóm tắt" style={{ flex: '0 1 160px' }}><Input type="time" /></Form.Item>
            <Form.Item name="publicUrl" label="Địa chỉ site (gắn link vào tin nhắn)" style={{ flex: '2 1 280px' }} rules={[{ pattern: /^(https?:\/\/[^\s/]+)?\/?$/, message: 'Dạng https://ten-mien' }]}><Input placeholder="https://cms-ai.btdat.io.vn" /></Form.Item>
          </Flex>
          <Typography.Paragraph strong style={{ marginBottom: 8 }}>Sự kiện được thông báo</Typography.Paragraph>
          {EVENTS.map((e) => (
            <Form.Item key={e.key} style={{ marginBottom: 8 }}>
              <Flex gap={12} align="center">
                <Form.Item name={['events', e.key]} valuePropName="checked" noStyle><Switch /></Form.Item>
                <span><b>{e.label}</b> <Typography.Text type="secondary">— {e.hint}</Typography.Text></span>
              </Flex>
            </Form.Item>
          ))}
          <Button type="primary" htmlType="submit" loading={act.isPending} style={{ marginTop: 8 }}>Lưu cấu hình</Button>
        </Form>
        <Space style={{ marginTop: 16 }} wrap>
          <Typography.Text type="secondary">Gửi thử (lưu cấu hình trước):</Typography.Text>
          <Button disabled={!v.configured} onClick={() => run(() => api('POST', '/api/admin/telegram/test', { target: 'group' }), 'Đã gửi tin thử vào nhóm')}>Vào nhóm</Button>
          <Button disabled={!v.configured} onClick={() => run(() => api('POST', '/api/admin/telegram/test', { target: 'me' }), 'Đã gửi tin thử cho bạn')}>Cho tôi</Button>
          <Button disabled={!v.configured} onClick={() => run(() => api('POST', '/api/admin/telegram/test', { target: 'digest' }), 'Đã gửi tóm tắt thử vào nhóm')}>Tóm tắt buổi sáng</Button>
        </Space>
      </Card>

      <Card title="3. Liên kết tài khoản">
        <Typography.Paragraph type="secondary">Mỗi người tự liên kết ở <b>Tài khoản → Liên kết Telegram</b> (lấy mã rồi mở link bot). Thông báo riêng chỉ gửi cho người đã liên kết.</Typography.Paragraph>
        <Table size="small" rowKey="id" dataSource={v.users} pagination={false} columns={[
          { title: 'Họ tên', dataIndex: 'name' },
          { title: 'Tài khoản', dataIndex: 'username', render: (x: string) => `@${x}` },
          { title: 'Telegram', key: 'tg', render: (_, u) => (u.linked ? <Tag color="success">Đã liên kết{u.tgUsername ? ` · @${u.tgUsername}` : ''}</Tag> : <Tag>Chưa liên kết</Tag>) },
          {
            title: '', key: 'op', width: 120, render: (_, u) => u.linked && (
              <Popconfirm title={`Huỷ liên kết của ${u.name}?`} okText="Huỷ liên kết" cancelText="Không" onConfirm={() => run(() => api<TgAdminView>('POST', `/api/admin/telegram/users/${u.id}/unlink`), 'Đã huỷ liên kết')}>
                <a style={{ color: '#a8071a' }}>Huỷ liên kết</a>
              </Popconfirm>
            ),
          },
        ]} />
      </Card>
    </>
  );
}

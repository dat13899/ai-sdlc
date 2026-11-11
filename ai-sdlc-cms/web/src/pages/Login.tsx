import { useState } from 'react';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { User } from '../types';

export default function Login() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8f9fa', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>AI-SDLC <span style={{ color: '#0958d9' }}>CMS</span></Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>Theo dõi tiến độ dự án theo quy trình AI-SDLC</Typography.Paragraph>
        <Form
          layout="vertical"
          onFinish={async (v: { username: string; password: string }) => {
            setBusy(true);
            try {
              const u = await api<User>('POST', '/api/login', v);
              qc.setQueryData(['me'], u);
              nav('/', { replace: true });
            } catch (e) {
              message.error((e as Error).message);
            } finally { setBusy(false); }
          }}
        >
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Tên đăng nhập" autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Mật khẩu" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={busy}>Đăng nhập</Button>
        </Form>
      </Card>
    </div>
  );
}

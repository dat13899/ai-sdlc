// Khung trang: Layout.Sider cố định bên trái (248px, thu gọn còn 64px) + Menu dự án/hạng mục + thanh trên có tài khoản
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Flex, Grid, Layout, Menu, Space, Spin, Tag, Tooltip, Typography, type MenuProps } from 'antd';
import { BarChartOutlined, CheckSquareOutlined, DashboardOutlined, FolderOutlined, LogoutOutlined, QuestionCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MoonOutlined, SafetyCertificateOutlined, SearchOutlined, SendOutlined, SettingOutlined, SunOutlined, UserOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { api, useMe, useMyTasks, useProjects } from './api';
import { useTheme } from './ThemeContext';
import { CommandPalette } from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';
import { AiCopilotDrawer } from './AiCopilotDrawer';

const COLLAPSE_KEY = 'sb-collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

export default function Shell() {
  const me = useMe();
  const { isDark, toggleDark } = useTheme();
  // chỉ gọi API sau khi biết đã đăng nhập — gọi sớm sẽ nhận 401 và làm trang tải lại
  const projects = useProjects(!!me.data);
  const tasks = useMyTasks(!!me.data);
  const taskCount = tasks.data ? tasks.data.steps.length + tasks.data.gates.length + tasks.data.reviews.length : 0;
  const loc = useLocation();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  // màn hình hẹp (< 992px): menu thành ngăn kéo đè lên nội dung, mặc định đóng
  const mobile = Grid.useBreakpoint().lg === false;
  const [drawer, setDrawer] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Lắng nghe phím tắt toàn cục: Ctrl+K / Cmd+K hoặc phím '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !isEditable) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (me.isLoading) return <Spin fullscreen />;
  if (me.isError || !me.data) return <Navigate to="/login" replace />;
  const user = me.data;

  const toggle = () => {
    if (mobile) { setDrawer((d) => !d); return; }
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* bị chặn localStorage thì bỏ qua */ }
      return !c;
    });
  };

  // menu: Dashboard · Dự án (mỗi dự án bung Nền tảng + hạng mục) · Quản trị
  const pid = /^\/p\/([a-z0-9]{8})/.exec(loc.pathname)?.[1];
  const list = (projects.data || []).filter((p) => !p.archived || p.id === pid).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const items: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: <Flex justify="space-between" align="center">Việc của tôi {taskCount > 0 && <Badge count={taskCount} size="small" />}</Flex> },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Báo cáo' },
    {
      type: 'group', key: 'g-projects', label: !mobile && collapsed ? null : 'Dự án',
      children: list.map((p) => ({
        key: `/p/${p.id}`, icon: <FolderOutlined />, label: p.name,
        children: [
          { key: `/p/${p.id}/t/base`, label: 'Nền tảng (B1–B2)' },
          ...(p.items || []).filter((i) => !i.archived).map((i) => ({ key: `/p/${p.id}/t/${i.id}`, label: i.name })),
          { key: `/p/${p.id}/docs`, label: 'Tài liệu' },
        ],
      })),
    },
    { key: '/help', icon: <QuestionCircleOutlined />, label: 'Hướng dẫn' },
    ...(user.admin ? [{ key: 'g-admin', icon: <SettingOutlined />, label: 'Quản trị', children: [
      { key: '/admin', label: 'Dự án & tài khoản' },
      { key: '/admin/permissions', label: 'Phân quyền & Vai trò', icon: <SafetyCertificateOutlined /> },
      { key: '/admin/telegram', label: 'Cấu hình Telegram', icon: <SendOutlined /> },
    ] }] : []),
  ];
  // mục đang chọn = khoá dài nhất khớp đầu đường dẫn
  const selected = loc.pathname === '/' ? '/' : loc.pathname.replace(/\/$/, '');

  const logout = async () => {
    await api('POST', '/api/logout');
    qc.clear();
    nav('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#0d1117' : '#f8f9fa' }}>
      <Layout.Sider
        theme={isDark ? 'dark' : 'light'} width={248} collapsedWidth={mobile ? 0 : 64} collapsed={mobile ? !drawer : collapsed} trigger={null}
        style={{ position: mobile ? 'fixed' : 'sticky', zIndex: 100, top: 0, bottom: 0, height: '100vh', overflow: 'auto', borderRight: isDark ? '1px solid #30363d' : '1px solid #f0f0f0', background: isDark ? '#161b22' : '#ffffff' }}
      >
        <Flex align="center" gap={8} style={{ height: 56, padding: '0 20px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <Avatar shape="square" size={24} style={{ background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)', fontSize: 10, fontWeight: 800, flex: 'none', color: '#ffffff' }}>CMS</Avatar>
          {(mobile || !collapsed) && <span>AI-SDLC <span style={{ color: isDark ? '#a855f7' : '#7c3aed' }}>CMS</span></span>}
        </Flex>
        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline" items={items} selectedKeys={[selected]}
          defaultOpenKeys={[...(pid ? [`/p/${pid}`] : []), ...(loc.pathname.startsWith('/admin') ? ['g-admin'] : [])]}
          onClick={({ key }) => { nav(key); setDrawer(false); }}
          style={{ borderInlineEnd: 0, background: isDark ? '#161b22' : '#ffffff' }}
        />
      </Layout.Sider>
      <Layout style={{ background: isDark ? '#0d1117' : '#f8f9fa' }}>
        <Layout.Header style={{ background: isDark ? '#161b22' : '#ffffff', height: 56, lineHeight: '56px', padding: '0 24px', borderBottom: isDark ? '1px solid #30363d' : '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 20 }}>
          <Flex justify="space-between" align="center" style={{ height: '100%' }}>
            <span role="button" tabIndex={0} aria-label="Thu gọn / mở rộng menu" onClick={toggle} onKeyDown={(e) => e.key === 'Enter' && toggle()} style={{ cursor: 'pointer', fontSize: 16 }}>
              {(mobile ? !drawer : collapsed) ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Space size="middle">
              <Button
                size="small"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 6,
                  color: isDark ? '#8b949e' : '#595959',
                  background: isDark ? '#21262d' : '#f0f0f0',
                  borderColor: isDark ? '#30363d' : '#d9d9d9',
                }}
                onClick={() => setPaletteOpen(true)}
              >
                <SearchOutlined style={{ fontSize: 13 }} />
                <span style={{ fontSize: 12 }}>Tìm nhanh...</span>
                <Tag style={{ margin: 0, padding: '0 4px', fontSize: 10, fontFamily: 'var(--font-mono)' }}>⌘K</Tag>
              </Button>

              <NotificationCenter />

              <Tooltip title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}>
                <Button
                  type="text"
                  shape="circle"
                  icon={isDark ? <SunOutlined style={{ color: '#e3b341', fontSize: 17 }} /> : <MoonOutlined style={{ fontSize: 16 }} />}
                  onClick={toggleDark}
                  aria-label="Đổi giao diện Sáng / Tối"
                />
              </Tooltip>
              <Dropdown menu={{ items: [
                { key: 'me', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => nav('/me') },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout },
              ] }}>
                <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Typography.Text>{user.name}</Typography.Text>
                </Flex>
              </Dropdown>
            </Space>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: mobile ? 12 : 24, maxWidth: 1600, width: '100%', margin: '0 auto' }}>
          <Outlet context={{ user }} />
        </Layout.Content>
      </Layout>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} currentProjectId={pid} />
      <AiCopilotDrawer />
    </Layout>
  );
}

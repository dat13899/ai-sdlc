import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import viVN from 'antd/es/locale/vi_VN'; // bản ES — bản CommonJS (antd/locale) bị Vite gói sai, rơi về tiếng Anh
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Shell from './Shell';
import { ThemeProvider, useTheme } from './ThemeContext';
import './global.css';

dayjs.locale('vi');
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

// Tự động tải lại trang khi phát hiện chunk lỗi do server vừa deploy/build bản mới
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

// mỗi trang là một file JS riêng; nếu gặp lỗi tải chunk cũ sau deploy thì tự động reload tải bản mới nhất
const page = (load: () => Promise<any>, pick?: (m: any) => React.ComponentType) => async (): Promise<{ Component: React.ComponentType }> => {
  try {
    const m = await load();
    return { Component: pick ? pick(m) : m.default };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch') || msg.includes('Importing a module script failed')) {
      const key = 'chunk_reload_ts';
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 5_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
        return new Promise(() => {}); // Chờ reload trang
      }
    }
    throw err;
  }
};

const router = createBrowserRouter([
  { path: '/login', lazy: page(() => import('./pages/Login')) },
  {
    element: <Shell />,
    children: [
      { path: '/', lazy: page(() => import('./pages/Dashboard')) },
      { path: '/tasks', lazy: page(() => import('./pages/Tasks')) },
      { path: '/help', lazy: page(() => import('./pages/Help')) },
      { path: '/reports', lazy: page(() => import('./pages/Reports')) },
      { path: '/p/:id', lazy: page(() => import('./pages/Project'), (m) => m.ProjectIndex) },
      { path: '/p/:id/t/:t', lazy: page(() => import('./pages/Project')) },
      { path: '/p/:id/t/:t/compliance', lazy: page(() => import('./pages/ComplianceReport')) },
      { path: '/p/:id/dossier', lazy: page(() => import('./pages/ExecutiveDossier')) },
      { path: '/p/:id/log', lazy: page(() => import('./pages/Log')) },
      { path: '/p/:id/docs', lazy: page(() => import('./pages/Docs')) },
      { path: '/admin', lazy: page(() => import('./pages/Admin')) },
      { path: '/admin/permissions', lazy: page(() => import('./pages/AdminPermissions')) },
      { path: '/admin/telegram', lazy: page(() => import('./pages/AdminTelegram')) },
      { path: '/me', lazy: page(() => import('./pages/Me')) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

function ThemedApp() {
  const { isDark } = useTheme();

  const themeConfig = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#2f81f7' : '#0958d9',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorBgLayout: isDark ? '#0d1117' : '#f8f9fa',
      colorBgContainer: isDark ? '#161b22' : '#ffffff',
      colorBgElevated: isDark ? '#21262d' : '#ffffff',
      colorBorder: isDark ? '#30363d' : '#d9d9d9',
      colorBorderSecondary: isDark ? '#21262d' : '#f0f0f0',
      colorText: isDark ? '#f0f6fc' : '#1f1f1f',
      colorTextSecondary: isDark ? '#8b949e' : '#595959',
      colorTextDescription: isDark ? '#8b949e' : '#595959',
      borderRadius: 8,
      fontSize: 14,
      sizeUnit: 4,
      sizeStep: 4,
      fontFamily: "Inter, Roboto, system-ui, 'Segoe UI', sans-serif",
    },
    components: {
      Layout: {
        headerBg: isDark ? '#161b22' : '#ffffff',
        siderBg: isDark ? '#161b22' : '#ffffff',
      },
      Menu: {
        darkItemBg: '#161b22',
        itemBg: isDark ? '#161b22' : '#ffffff',
      },
      Card: {
        colorBgContainer: isDark ? '#161b22' : '#ffffff',
        colorBorderSecondary: isDark ? '#30363d' : '#f0f0f0',
      },
    },
  };

  return (
    <ConfigProvider locale={viVN} theme={themeConfig}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </React.StrictMode>,
);

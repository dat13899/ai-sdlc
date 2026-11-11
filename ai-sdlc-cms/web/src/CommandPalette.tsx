// Command Palette toàn cục (Ctrl + K / Cmd + K / '/') — Tìm kiếm tức thời và Thực thi tác vụ nhanh
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Input, Modal, Space, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  CopyOutlined,
  FileMarkdownOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMe, useProcess, useProjects } from './api';
import { useTheme } from './ThemeContext';
import type { ProcPrompt, ProcStep, Project } from './types';
import { fold } from './util';

interface PaletteItem {
  id: string;
  category: 'action' | 'project' | 'step' | 'prompt';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tag?: string;
  tagColor?: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  currentProjectId,
}: {
  open: boolean;
  onClose: () => void;
  currentProjectId?: string;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { isDark, mode, setMode } = useTheme();
  const me = useMe().data;
  const proc = useProcess().data;
  const projects = useProjects(open).data || [];

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus ô input khi mở
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Xây dựng danh sách tác vụ & đối tượng tìm kiếm
  const allItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];

    // 1. Tác vụ nhanh (Quick Actions)
    list.push(
      {
        id: 'act-dashboard',
        category: 'action',
        title: 'Bảng Điều khiển Tổng thể (Dashboard)',
        subtitle: 'Xem tiến độ các dự án và luồng công việc',
        icon: <AppstoreOutlined style={{ color: '#1677ff' }} />,
        tag: 'Điều hướng',
        action: () => { navigate('/'); onClose(); },
      },
      {
        id: 'act-tasks',
        category: 'action',
        title: 'Việc của tôi (My Tasks)',
        subtitle: 'Các bước phụ trách, gate chờ ký, nhật ký AI cần duyệt',
        icon: <CheckSquareOutlined style={{ color: '#52c41a' }} />,
        tag: 'Cá nhân',
        action: () => { navigate('/tasks'); onClose(); },
      },
      {
        id: 'act-reports',
        category: 'action',
        title: 'Báo cáo DORA & Số liệu SDLC',
        subtitle: '4 chỉ số DORA, Chu kỳ 5 giai đoạn, Tăng tốc AI & Điểm nghẽn',
        icon: <BarChartOutlined style={{ color: '#722ed1' }} />,
        tag: 'Số liệu',
        action: () => { navigate('/reports'); onClose(); },
      },
      {
        id: 'act-theme',
        category: 'action',
        title: `Đổi Giao diện (Hiện tại: ${mode === 'dark' ? 'Tối' : mode === 'light' ? 'Sáng' : 'Tự động'})`,
        subtitle: 'Chuyển đổi Sáng / Tối / Theo hệ điều hành',
        icon: <BgColorsOutlined style={{ color: '#fa8c16' }} />,
        tag: 'Giao diện',
        action: () => {
          const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
          setMode(next);
          message.info(`Đã đổi giao diện sang: ${next === 'dark' ? 'Tối (Dark)' : next === 'light' ? 'Sáng (Light)' : 'Tự động (Auto)'}`);
          onClose();
        },
      },
    );

    if (me?.admin) {
      list.push({
        id: 'act-permissions',
        category: 'action',
        title: 'Quản trị Phân quyền & Vai trò (RBAC)',
        subtitle: 'Thiết lập thành viên, vai trò RACI và ma trận quyền hạn',
        icon: <SafetyCertificateOutlined style={{ color: '#eb2f96' }} />,
        tag: 'Quản trị',
        action: () => { navigate('/admin/permissions'); onClose(); },
      });
    }

    list.push({
      id: 'act-me',
      category: 'action',
      title: 'Tài khoản & Hồ sơ Cá nhân',
      subtitle: `${me?.name || ''} (@${me?.username || ''}) · Đổi mật khẩu, liên kết Telegram`,
      icon: <UserOutlined style={{ color: '#13c2c2' }} />,
      tag: 'Tài khoản',
      action: () => { navigate('/me'); onClose(); },
    });

    // 2. Dự án (Projects)
    for (const p of projects) {
      list.push({
        id: `proj-${p.id}`,
        category: 'project',
        title: p.name,
        subtitle: `${p.code ? `[${p.code}] · ` : ''}${p.items.length} hạng mục · Cập nhật ${p.updatedAt.slice(0, 10)}`,
        icon: <ProjectOutlined style={{ color: '#1677ff' }} />,
        tag: p.visibility === 'private' ? 'Private' : 'Public',
        tagColor: p.visibility === 'private' ? 'gold' : 'blue',
        action: () => { navigate(`/p/${p.id}`); onClose(); },
      });
    }

    // 3. Các bước quy trình (Steps & Gates)
    if (proc?.steps) {
      for (const st of proc.steps) {
        list.push({
          id: `step-${st.code}`,
          category: 'step',
          title: `Bước ${st.code}: ${st.name}`,
          subtitle: `Giai đoạn: ${st.phase} · Sản phẩm: ${st.out || 'Xem hướng dẫn'}`,
          icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
          tag: st.gate ? `Có Gate ${st.gate}` : st.code,
          tagColor: st.gate ? 'purple' : 'default',
          action: () => {
            if (currentProjectId) {
              navigate(`/p/${currentProjectId}/t/base#${st.code}`);
            } else if (projects[0]) {
              navigate(`/p/${projects[0].id}/t/base#${st.code}`);
            } else {
              window.open(`${proc.site}/buoc/${st.code.toLowerCase()}.html`, '_blank');
            }
            onClose();
          },
        });
      }
    }

    // 4. Prompts mẫu chuẩn
    if (proc?.prompts) {
      for (const pr of proc.prompts) {
        list.push({
          id: `prompt-${pr.id}`,
          category: 'prompt',
          title: `Prompt ${pr.id}: ${pr.title}`,
          subtitle: `Gắn với Bước ${pr.step} · Bấm để sao chép vào clipboard`,
          icon: <BulbOutlined style={{ color: '#52c41a' }} />,
          tag: 'Prompt mẫu',
          tagColor: 'green',
          action: () => {
            if (pr.template) {
              navigator.clipboard?.writeText(pr.template);
              message.success(`Đã sao chép nội dung prompt ${pr.id} vào clipboard!`);
            } else {
              message.info(`Prompt ${pr.id}: ${pr.title}`);
            }
            onClose();
          },
        });
      }
    }

    return list;
  }, [projects, proc, me, mode, setMode, currentProjectId, navigate, onClose, message]);

  // Lọc kết quả theo query tìm kiếm mờ
  const filteredItems = useMemo(() => {
    const q = fold(query.trim());
    if (!q) {
      // Khi ô tìm kiếm rỗng: hiện các tác vụ nhanh và 5 dự án đầu
      return allItems.filter((x) => x.category === 'action' || x.category === 'project').slice(0, 15);
    }
    return allItems
      .filter((x) => fold(`${x.title} ${x.subtitle || ''} ${x.id}`).includes(q))
      .slice(0, 25);
  }, [allItems, query]);

  // Điều hướng bằng phím mũi tên & Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Cuộn theo mục được chọn
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      style={{ top: 70 }}
      styles={{
        content: {
          padding: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: isDark ? '#161b22' : '#ffffff',
          boxShadow: isDark
            ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px #30363d'
            : '0 20px 40px rgba(0,0,0,0.18), 0 0 0 1px #f0f0f0',
        },
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: isDark ? '1px solid #30363d' : '1px solid #f0f0f0',
        }}
      >
        <SearchOutlined style={{ fontSize: 18, color: '#8c8c8c', marginRight: 12 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tìm dự án, bước B1-B14, Quality Gate, Prompt mẫu hoặc gõ lệnh..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 15,
            background: 'transparent',
            color: isDark ? '#f0f6fc' : '#1f1f1f',
          }}
        />
        <Tag style={{ margin: 0, borderRadius: 4, fontFamily: 'var(--font-mono)' }}>ESC</Tag>
      </div>

      {/* Results List */}
      <div
        ref={listRef}
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {filteredItems.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#8c8c8c' }}>
            <FolderOpenOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div>Không tìm thấy kết quả phù hợp với "{query}"</div>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                data-index={index}
                onClick={() => item.action()}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: isSelected
                    ? isDark
                      ? '#21262d'
                      : '#f0f5ff'
                    : 'transparent',
                  transition: 'background 0.12s ease',
                  borderLeft: isSelected
                    ? '3px solid #1677ff'
                    : '3px solid transparent',
                }}
              >
                <div style={{ fontSize: 16, marginRight: 12, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Typography.Text>
                    {item.tag && (
                      <Tag color={item.tagColor} style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                        {item.tag}
                      </Tag>
                    )}
                  </div>
                  {item.subtitle && (
                    <Typography.Text
                      type="secondary"
                      ellipsis
                      style={{ fontSize: 12, display: 'block', marginTop: 1 }}
                    >
                      {item.subtitle}
                    </Typography.Text>
                  )}
                </div>
                {isSelected && (
                  <Tag style={{ marginLeft: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    ↵ Enter
                  </Tag>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Palette Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: isDark ? '#0d1117' : '#fafafa',
          borderTop: isDark ? '1px solid #30363d' : '1px solid #f0f0f0',
          fontSize: 12,
          color: '#8c8c8c',
        }}
      >
        <Space size={16}>
          <span>
            <kbd style={{ padding: '1px 5px', background: isDark ? '#21262d' : '#e8e8e8', borderRadius: 3 }}>↑</kbd>{' '}
            <kbd style={{ padding: '1px 5px', background: isDark ? '#21262d' : '#e8e8e8', borderRadius: 3 }}>↓</kbd>{' '}
            điều hướng
          </span>
          <span>
            <kbd style={{ padding: '1px 5px', background: isDark ? '#21262d' : '#e8e8e8', borderRadius: 3 }}>↵</kbd> chọn
          </span>
          <span>
            <kbd style={{ padding: '1px 5px', background: isDark ? '#21262d' : '#e8e8e8', borderRadius: 3 }}>esc</kbd> đóng
          </span>
        </Space>
        <span>AI-SDLC Command Center</span>
      </div>
    </Modal>
  );
}

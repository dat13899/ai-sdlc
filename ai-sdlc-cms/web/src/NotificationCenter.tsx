import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  List,
  Popover,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useMyTasks, useProjects } from './api';
import { useTheme } from './ThemeContext';
import { fmt } from './util';

export function NotificationCenter() {
  const { isDark } = useTheme();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cms-read-notifs') || '[]');
    } catch {
      return [];
    }
  });

  const myTasks = useMyTasks();
  const tasks = myTasks.data;

  const steps = tasks?.steps || [];
  const gates = tasks?.gates || [];
  const reviews = tasks?.reviews || [];

  // Tạo danh sách việc cần xử lý
  const actionItems = [
    ...gates.map((g) => ({
      id: `gate-${g.project}-${g.track}-${g.gate}`,
      type: 'gate' as const,
      title: `Chờ ký ${g.gateId}: ${g.check}`,
      sub: `${g.projectName} · Hạng mục: ${g.trackName}`,
      link: `/p/${g.project}/t/${g.track}#${g.gate}`,
      urgent: true,
      tag: g.gateId,
    })),
    ...reviews.map((r) => ({
      id: `review-${r.project}-${r.id}`,
      type: 'review' as const,
      title: `Duyệt AI (4-Eyes): ${r.purpose}`,
      sub: `${r.projectName} · Bước ${r.step} (${r.tool}) · Người làm: ${r.byName}`,
      link: `/p/${r.project}/t/${r.track}#${r.step}`,
      urgent: true,
      tag: '4-Eyes',
    })),
    ...steps.map((s) => ({
      id: `step-${s.project}-${s.track}-${s.step}`,
      type: 'step' as const,
      title: `Bước ${s.step}: ${s.stepName}`,
      sub: `${s.projectName} · Hạng mục: ${s.trackName} · Hoàn thành: ${s.pct}%`,
      link: `/p/${s.project}/t/${s.track}#${s.step}`,
      urgent: false,
      tag: s.step,
    })),
  ];

  const unreadCount = actionItems.filter((i) => !readIds.includes(i.id)).length;

  const markAllRead = () => {
    const allIds = actionItems.map((i) => i.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('cms-read-notifs', JSON.stringify(allIds));
    } catch {}
  };

  const handleItemClick = (item: (typeof actionItems)[0]) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem('cms-read-notifs', JSON.stringify(updated));
      } catch {}
    }
    setOpen(false);
    nav(item.link);
  };

  const popoverContent = (
    <div style={{ width: 380, maxHeight: 480, overflowY: 'auto' }}>
      <Flex
        justify="space-between"
        align="center"
        style={{
          paddingBottom: 8,
          marginBottom: 8,
          borderBottom: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}`,
        }}
      >
        <Space size={6}>
          <Typography.Text strong style={{ fontSize: 14 }}>
            Thông báo & Việc cần làm
          </Typography.Text>
          {unreadCount > 0 && (
            <Tag color="red" style={{ margin: 0 }}>
              {unreadCount} mới
            </Tag>
          )}
        </Space>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>
            Đã đọc tất cả
          </Button>
        )}
      </Flex>

      {actionItems.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bạn không có việc nào đang tồn đọng!"
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={actionItems}
          renderItem={(item) => {
            const isRead = readIds.includes(item.id);
            return (
              <List.Item
                onClick={() => handleItemClick(item)}
                className="hover-lift"
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: isRead
                    ? 'transparent'
                    : isDark
                    ? 'rgba(56, 189, 248, 0.08)'
                    : 'rgba(22, 119, 255, 0.04)',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={28}
                      style={{
                        backgroundColor:
                          item.type === 'gate'
                            ? '#faad14'
                            : item.type === 'review'
                            ? '#8b5cf6'
                            : '#1677ff',
                      }}
                    >
                      {item.type === 'gate' ? (
                        <SafetyCertificateOutlined />
                      ) : item.type === 'review' ? (
                        <RobotOutlined />
                      ) : (
                        <CheckSquareOutlined />
                      )}
                    </Avatar>
                  }
                  title={
                    <Flex justify="space-between" align="center">
                      <Typography.Text
                        strong={!isRead}
                        style={{
                          fontSize: 13,
                          maxWidth: 230,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </Typography.Text>
                      <Tag
                        color={item.urgent ? 'warning' : 'default'}
                        style={{ margin: 0, fontSize: 10 }}
                      >
                        {item.tag}
                      </Tag>
                    </Flex>
                  }
                  description={
                    <Typography.Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.sub}
                    </Typography.Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Tooltip title="Trung tâm Thông báo">
        <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 4]}>
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined style={{ fontSize: 16 }} />}
            aria-label="Thông báo"
          />
        </Badge>
      </Tooltip>
    </Popover>
  );
}

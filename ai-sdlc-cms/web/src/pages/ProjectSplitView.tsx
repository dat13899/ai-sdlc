// Chế độ xem Focus View (phong cách Linear / Vercel):
// Cột trái: Lộ trình các bước chia theo giai đoạn, phím tắt ↑/↓ (hoặc J/K), trạng thái trực quan
// Cột phải: Không gian làm việc tập trung của bước đang chọn (StepCard chi tiết)
import React, { useEffect } from 'react';
import { Card, Flex, Space, Tag, Tooltip, Typography, Button, theme } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  LeftOutlined,
  RightOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { Process, ProcStep, Project, Track, TrackView, User } from '../types';
import { useTheme } from '../ThemeContext';
import StepCard from './StepCard';

interface ProjectSplitViewProps {
  p: Project;
  proc: Process;
  t: Track;
  v: TrackView;
  tid: string;
  phases: { id: string; name: string; steps: string[] }[];
  users: User[];
  activeStep: string;
  onSelectStep: (code: string) => void;
}

const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#faad14', '#2f54eb'];
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProjectSplitView({
  p,
  proc,
  t,
  v,
  tid,
  phases,
  users,
  activeStep,
  onSelectStep,
}: ProjectSplitViewProps) {
  const { isDark } = useTheme();
  const { token } = theme.useToken();

  const allCodes = phases.flatMap((ph) => ph.steps);
  const validStep = allCodes.includes(activeStep)
    ? activeStep
    : (v.current && allCodes.includes(v.current) ? v.current : allCodes[0] || '');
  const currentIndex = allCodes.indexOf(validStep);
  const activeProcStep = proc.steps.find((s) => s.code === validStep && t.steps[s.code]);

  // Phím tắt bàn phím: ↑ / ↓ hoặc J / K hoặc [ / ] để chuyển bước nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if ((e.key === 'ArrowDown' || e.key === 'j' || e.key === ']') && currentIndex < allCodes.length - 1) {
        e.preventDefault();
        onSelectStep(allCodes[currentIndex + 1]);
      } else if ((e.key === 'ArrowUp' || e.key === 'k' || e.key === '[') && currentIndex > 0) {
        e.preventDefault();
        onSelectStep(allCodes[currentIndex - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allCodes, onSelectStep]);

  const activePhase = phases.find((ph) => ph.steps.includes(validStep));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {/* CỘT TRÁI: Master Navigator */}
      <div
        style={{
          position: 'sticky',
          top: 72,
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Card
          size="small"
          style={{
            background: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#f0f0f0',
            borderRadius: 10,
          }}
          bodyStyle={{ padding: '12px 14px' }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: token.colorTextSecondary }}>
              Lộ trình thực hiện
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Dùng phím ↑ ↓
            </Typography.Text>
          </Flex>

          <Flex vertical gap={12}>
            {phases.map((ph) => {
              const doneCount = ph.steps.filter((c) => t.steps[c] && ['done', 'skipped'].includes(t.steps[c].status)).length;
              const isPhaseDone = ph.steps.length > 0 && doneCount === ph.steps.length;

              return (
                <div key={ph.id}>
                  <Flex justify="space-between" align="center" style={{ padding: '4px 6px', marginBottom: 4 }}>
                    <Typography.Text strong style={{ fontSize: 11, color: isDark ? '#8b949e' : '#6b7280' }}>
                      {ph.id} · {ph.name}
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 11, color: isPhaseDone ? '#1a7f37' : token.colorTextQuaternary }}>
                      {doneCount}/{ph.steps.length}
                    </Typography.Text>
                  </Flex>

                  <Flex vertical gap={4}>
                    {ph.steps.map((c) => {
                      const st = proc.steps.find((x) => x.code === c);
                      const stState = t.steps[c];
                      if (!stState) return null;
                      const status = stState.status || 'todo';
                      const isSelected = validStep === c;
                      const isCurrent = v.current === c;
                      const pct = v.stepPct[c] || 0;
                      const stepGates = proc.gates.filter((g) => g.at === c && v.gates[g.key]?.applies);

                      let dot = <span style={{ width: 8, height: 8, borderRadius: '50%', background: token.colorBorder }} />;
                      if (status === 'done') {
                        dot = <CheckCircleFilled style={{ color: '#1a7f37', fontSize: 13 }} />;
                      } else if (status === 'doing') {
                        dot = <span className="pulse-dot-doing" style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />;
                      } else if (status === 'skipped') {
                        dot = <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1px dashed #8b949e' }} />;
                      }

                      return (
                        <div
                          key={c}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectStep(c)}
                          onKeyDown={(e) => e.key === 'Enter' && onSelectStep(c)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isSelected
                              ? (isDark ? 'rgba(47, 129, 247, 0.16)' : '#e6f4ff')
                              : 'transparent',
                            border: isSelected
                              ? `1.5px solid ${isDark ? '#2f81f7' : '#1677ff'}`
                              : `1px solid transparent`,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Space size={8} style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ flex: 'none', display: 'flex', alignItems: 'center' }}>
                              {dot}
                            </div>
                            <span
                              className="mono-code"
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isSelected ? (isDark ? '#58a6ff' : '#0958d9') : token.colorText,
                                flex: 'none',
                              }}
                            >
                              {c}
                            </span>
                            <Typography.Text
                              ellipsis
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? token.colorText : token.colorTextSecondary,
                              }}
                            >
                              {st?.name || c}
                            </Typography.Text>
                          </Space>

                          <Space size={6} style={{ flex: 'none' }}>
                            {stepGates.length > 0 && (
                              <Tag
                                color={stepGates.some((g) => v.failed.includes(g.key)) ? 'error' : stepGates.some((g) => v.blocking === g.key) ? 'warning' : 'default'}
                                style={{ marginInlineEnd: 0, fontSize: 10, padding: '0 4px', lineHeight: '16px' }}
                              >
                                {stepGates[0].id}
                              </Tag>
                            )}
                            <Typography.Text
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: isSelected ? (isDark ? '#58a6ff' : '#0958d9') : token.colorTextQuaternary,
                              }}
                            >
                              {pct}%
                            </Typography.Text>
                          </Space>
                        </div>
                      );
                    })}
                  </Flex>
                </div>
              );
            })}
          </Flex>
        </Card>
      </div>

      {/* CỘT PHẢI: Detail Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {/* Navigation Bar giữa các bước */}
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: isDark ? '#161b22' : '#ffffff',
            border: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}`,
          }}
        >
          <Space size={8}>
            <Tag color="blue" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{validStep}</Tag>
            <Typography.Text strong style={{ fontSize: 14 }}>
              {activeProcStep?.name}
            </Typography.Text>
            {activePhase && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                ({activePhase.id} · {activePhase.name})
              </Typography.Text>
            )}
          </Space>

          <Space size={6}>
            <Button
              size="small"
              icon={<LeftOutlined />}
              disabled={currentIndex <= 0}
              onClick={() => currentIndex > 0 && onSelectStep(allCodes[currentIndex - 1])}
            >
              Trước (K)
            </Button>
            <Button
              size="small"
              icon={<RightOutlined />}
              disabled={currentIndex >= allCodes.length - 1}
              onClick={() => currentIndex < allCodes.length - 1 && onSelectStep(allCodes[currentIndex + 1])}
            >
              Sau (J)
            </Button>
          </Space>
        </Flex>

        {/* Nội dung chi tiết của bước được chọn */}
        {activeProcStep && (
          <StepCard
            key={`${tid}-${validStep}`}
            proc={proc}
            p={p}
            tid={tid}
            t={t}
            v={v}
            st={activeProcStep}
            users={users}
            open={true}
            onToggle={() => {}}
          />
        )}
      </div>
    </div>
  );
}

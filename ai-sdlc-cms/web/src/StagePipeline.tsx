import React from 'react';
import { Card, Flex, Progress, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ClockCircleFilled, SyncOutlined } from '@ant-design/icons';
import type { Process, Track, TrackView } from './types';
import { useTheme } from './ThemeContext';

export interface StagePipelineProps {
  proc: Process;
  t: Track;
  v: TrackView;
  phases: { id: string; name: string; steps: string[] }[];
  onSelectStep?: (code: string) => void;
}

export default function StagePipeline({ proc, t, v, phases, onSelectStep }: StagePipelineProps) {
  const { isDark } = useTheme();
  const { token } = theme.useToken();

  const handleStepClick = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    onSelectStep?.(code);
    const el = document.getElementById(code);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePhaseClick = (phaseSteps: string[]) => {
    const targetStep = phaseSteps.find((c) => !['done', 'skipped'].includes(t.steps[c]?.status)) || phaseSteps[0];
    if (targetStep) {
      onSelectStep?.(targetStep);
      const el = document.getElementById(targetStep);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: isDark ? '#161b22' : '#ffffff',
        borderColor: isDark ? '#30363d' : '#f0f0f0',
        borderRadius: 8,
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Space size={6}>
            <Typography.Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: token.colorTextSecondary }}>
              Pipeline tiến độ quy trình
            </Typography.Text>
            <Tag color="blue">{v.pct}% hoàn tất</Tag>
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Bấm vào giai đoạn hoặc bước để nhảy nhanh
          </Typography.Text>
        </Flex>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, phases.length)}, minmax(180px, 1fr))`,
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {phases.map((ph) => {
            const totalSteps = ph.steps.length;
            const doneSteps = ph.steps.filter((c) => ['done', 'skipped'].includes(t.steps[c]?.status)).length;
            const phasePct = totalSteps > 0
              ? Math.round(ph.steps.reduce((acc, c) => acc + (v.stepPct[c] || 0), 0) / totalSteps)
              : 0;
            const isPhaseDone = totalSteps > 0 && doneSteps === totalSteps;
            const isCurrentPhase = ph.steps.includes(v.current || '');

            const phaseGates = proc.gates.filter((g) => ph.steps.includes(g.at) && v.gates[g.key]?.applies);
            const hasFailedGate = phaseGates.some((g) => v.failed.includes(g.key));
            const hasBlockingGate = phaseGates.some((g) => v.blocking === g.key);

            let statusColor = token.colorBorder;
            let statusBg = isDark ? '#1c2128' : '#fafafa';
            let statusIcon = <ClockCircleFilled style={{ color: token.colorTextQuaternary }} />;

            if (hasFailedGate) {
              statusColor = '#cf222e';
              statusBg = isDark ? 'rgba(207, 34, 46, 0.15)' : '#fff1f0';
              statusIcon = <CloseCircleFilled style={{ color: '#cf222e' }} />;
            } else if (hasBlockingGate) {
              statusColor = '#d97706';
              statusBg = isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbe6';
              statusIcon = <SyncOutlined spin style={{ color: '#d97706' }} />;
            } else if (isPhaseDone) {
              statusColor = '#1a7f37';
              statusBg = isDark ? 'rgba(26, 127, 55, 0.15)' : '#f6ffed';
              statusIcon = <CheckCircleFilled style={{ color: '#1a7f37' }} />;
            } else if (isCurrentPhase) {
              statusColor = '#0969da';
              statusBg = isDark ? 'rgba(9, 105, 218, 0.12)' : '#e6f4ff';
              statusIcon = <SyncOutlined spin style={{ color: '#0969da' }} />;
            }

            return (
              <div
                key={ph.id}
                role="button"
                tabIndex={0}
                onClick={() => handlePhaseClick(ph.steps)}
                onKeyDown={(e) => e.key === 'Enter' && handlePhaseClick(ph.steps)}
                style={{
                  background: statusBg,
                  border: `1.5px solid ${statusColor}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isCurrentPhase ? `0 0 0 2px ${statusColor}33` : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Space size={6}>
                    {statusIcon}
                    <Typography.Text strong style={{ fontSize: 13, color: isCurrentPhase ? (isDark ? '#58a6ff' : '#0958d9') : undefined }}>
                      {ph.id}
                    </Typography.Text>
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                    {phasePct}%
                  </Typography.Text>
                </Flex>

                <Typography.Text
                  ellipsis={{ tooltip: ph.name }}
                  style={{ fontSize: 12, fontWeight: 500, color: token.colorText }}
                >
                  {ph.name}
                </Typography.Text>

                <Progress
                  percent={phasePct}
                  size="small"
                  showInfo={false}
                  strokeColor={hasFailedGate ? '#cf222e' : hasBlockingGate ? '#d97706' : isPhaseDone ? '#1a7f37' : '#0969da'}
                  trailColor={isDark ? '#30363d' : '#e5e7eb'}
                  style={{ margin: 0 }}
                />

                <Flex wrap gap={4} style={{ marginTop: 2 }}>
                  {ph.steps.map((c) => {
                    const stStatus = t.steps[c]?.status || 'todo';
                    const isStepCurrent = v.current === c;
                    const stPct = v.stepPct[c] || 0;
                    const stepName = proc.steps.find((s) => s.code === c)?.name || c;

                    let bg = isDark ? '#21262d' : '#e5e7eb';
                    let fg = isDark ? '#c9d1d9' : '#374151';
                    let border = 'transparent';

                    if (stStatus === 'done') {
                      bg = isDark ? 'rgba(35, 134, 54, 0.3)' : '#dcfce7';
                      fg = isDark ? '#3fb950' : '#15803d';
                    } else if (stStatus === 'doing') {
                      bg = isDark ? 'rgba(187, 128, 9, 0.3)' : '#fef3c7';
                      fg = isDark ? '#d29922' : '#b45309';
                      border = '#d97706';
                    } else if (stStatus === 'skipped') {
                      bg = isDark ? '#161b22' : '#f3f4f6';
                      fg = isDark ? '#8b949e' : '#9ca3af';
                      border = isDark ? '#30363d' : '#d1d5db';
                    }

                    return (
                      <Tooltip key={c} title={`${c}: ${stepName} (${proc.labels.STATUS[stStatus]} - ${stPct}%)`}>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleStepClick(e, c)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStepClick(e as any, c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: isStepCurrent ? 700 : 500,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: bg,
                            color: fg,
                            border: isStepCurrent ? `1.5px solid ${isDark ? '#58a6ff' : '#0958d9'}` : `1px solid ${border}`,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {c}
                        </span>
                      </Tooltip>
                    );
                  })}
                </Flex>

                {phaseGates.length > 0 && (
                  <Flex wrap gap={4} style={{ marginTop: 2 }}>
                    {phaseGates.map((g) => {
                      const state = t.gates[g.key];
                      const res = state?.result || 'pending';
                      const isGateFailed = v.failed.includes(g.key);
                      const isGateBlocking = v.blocking === g.key;

                      let color = 'default';
                      let text = g.id;

                      if (isGateFailed || res === 'fail') {
                        color = 'error';
                        text = `${g.id}: Cần sửa`;
                      } else if (res === 'pass') {
                        color = 'success';
                        text = `${g.id}: Đạt`;
                      } else if (isGateBlocking) {
                        color = 'warning';
                        text = `${g.id}: Chờ ký`;
                      }

                      return (
                        <Tag
                          key={g.key}
                          color={color}
                          style={{ marginInlineEnd: 0, fontSize: 11, padding: '0 4px', lineHeight: '18px' }}
                        >
                          {text}
                        </Tag>
                      );
                    })}
                  </Flex>
                )}
              </div>
            );
          })}
        </div>
      </Flex>
    </Card>
  );
}

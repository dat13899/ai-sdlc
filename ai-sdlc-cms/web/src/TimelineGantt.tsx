// Biểu đồ Gantt & Lộ trình Tiến độ Tương tác (Interactive Project Timeline & Milestones)
import React, { useMemo } from 'react';
import { Avatar, Badge, Button, Card, Empty, Flex, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  RightOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Process, ProcStep, Project, Track, User } from './types';
import { fmt, GATE_COLOR, STEP_COLOR } from './util';
import { useTheme } from './ThemeContext';

interface Props {
  proc: Process;
  p: Project;
  tid: string;
  t: Track;
  users: User[];
  onSelectStep?: (code: string) => void;
}

const AVATAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#faad14', '#2f54eb'];
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function TimelineGantt({ proc, p, tid, t, users, onSelectStep }: Props) {
  const { isDark } = useTheme();
  const today = dayjs().startOf('day');

  // Lấy các bước hiển thị theo hạng mục: baseSteps nếu tid === 'base', ngược lại là itemSteps
  const applicableSteps = useMemo(() => {
    const baseSet = new Set(proc.baseSteps);
    return tid === 'base'
      ? proc.steps.filter((s) => baseSet.has(s.code))
      : proc.steps.filter((s) => !baseSet.has(s.code));
  }, [proc, tid]);

  // Tính toán khoảng ngày minDate và maxDate trên toàn bộ lộ trình
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = today.subtract(3, 'day');
    let max = today.add(14, 'day');
    let hasDates = false;

    for (const st of applicableSteps) {
      const state = t.steps[st.code];
      if (state?.start) {
        const s = dayjs(state.start);
        if (s.isValid()) {
          if (!hasDates || s.isBefore(min)) min = s;
          hasDates = true;
        }
      }
      if (state?.end) {
        const e = dayjs(state.end);
        if (e.isValid()) {
          if (!hasDates || e.isAfter(max)) max = e;
          hasDates = true;
        }
      }
    }

    // Luôn cộng thêm 2 ngày padding trước và sau
    min = min.subtract(2, 'day').startOf('day');
    max = max.add(3, 'day').endOf('day');
    const daysCount = Math.max(14, max.diff(min, 'day') + 1);

    return { minDate: min, maxDate: max, totalDays: daysCount };
  }, [applicableSteps, t, today]);

  // Tạo danh sách các ngày để render trục thời gian
  const dayColumns = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalDays; i++) {
      const d = minDate.add(i, 'day');
      list.push(d);
    }
    return list;
  }, [minDate, totalDays]);

  // Vị trí của đường chỉ báo "Hôm nay"
  const todayOffsetDays = today.diff(minDate, 'day');
  const todayPct = (todayOffsetDays / totalDays) * 100;
  const isTodayVisible = todayPct >= 0 && todayPct <= 100;

  return (
    <Card
      size="small"
      style={{
        borderRadius: 8,
        background: isDark ? '#161b22' : '#ffffff',
        borderColor: isDark ? '#30363d' : '#f0f0f0',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: isDark ? '1px solid #30363d' : '1px solid #f0f0f0',
          background: isDark ? '#1c2128' : '#fafafa',
        }}
      >
        <Space size={8}>
          <CalendarOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          <Typography.Text strong style={{ fontSize: 14 }}>
            Lộ trình Thực hiện theo Dòng thời gian (SDLC Timeline & Milestones)
          </Typography.Text>
        </Space>
        <Space size={12} wrap>
          <Space size={4}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#52c41a', display: 'inline-block' }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Đã xong</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1677ff', display: 'inline-block' }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Đang làm</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ff4d4f', display: 'inline-block' }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Quá hạn</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#8c8c8c', display: 'inline-block' }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Chờ làm</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ color: '#722ed1', fontSize: 12 }}>🔷</span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Quality Gate</Typography.Text>
          </Space>
        </Space>
      </div>

      {/* Gantt Container with horizontal scroll */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <div style={{ minWidth: 900, display: 'flex', flexDirection: 'column' }}>
          {/* Timeline Days Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: isDark ? '1px solid #30363d' : '1px solid #e8e8e8',
              background: isDark ? '#161b22' : '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Cột trái: Tên bước (260px cố định) */}
            <div
              style={{
                width: 260,
                minWidth: 260,
                padding: '8px 12px',
                borderRight: isDark ? '1px solid #30363d' : '1px solid #e8e8e8',
                fontWeight: 600,
                fontSize: 12,
                color: isDark ? '#8b949e' : '#595959',
              }}
            >
              Bước quy trình
            </div>

            {/* Cột phải: Các vạch ngày */}
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {dayColumns.map((day, idx) => {
                const isToday = day.isSame(today, 'day');
                const isWeekend = day.day() === 0 || day.day() === 6;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '4px 0',
                      fontSize: 11,
                      borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
                      background: isToday
                        ? isDark ? 'rgba(22, 119, 255, 0.15)' : '#e6f4ff'
                        : isWeekend
                          ? isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                          : 'transparent',
                      color: isToday
                        ? '#1677ff'
                        : isWeekend
                          ? '#8c8c8c'
                          : isDark ? '#c9d1d9' : '#262626',
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    <div>{day.format('DD')}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>T{day.day() === 0 ? 'CN' : day.day() + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Step Rows */}
          <div style={{ position: 'relative' }}>
            {/* Đường dọc "Hôm nay" kéo dài từ trên xuống dưới */}
            {isTodayVisible && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(260px + (100% - 260px) * ${todayPct / 100})`,
                  width: 2,
                  background: '#ff4d4f',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: -20,
                    fontSize: 9,
                    color: '#ffffff',
                    background: '#ff4d4f',
                    padding: '1px 4px',
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  Hôm nay
                </div>
              </div>
            )}

            {applicableSteps.map((st) => {
              const state = t.steps[st.code] || { status: 'todo', checks: [], start: '', end: '', owners: [] };
              const status = state.status;
              const hasStart = Boolean(state.start && dayjs(state.start).isValid());
              const hasEnd = Boolean(state.end && dayjs(state.end).isValid());
              const startDate = hasStart ? dayjs(state.start).startOf('day') : null;
              const endDate = hasEnd ? dayjs(state.end).endOf('day') : (startDate ? startDate.add(3, 'day') : null);

              // Kiểm tra quá hạn
              const isOverdue = status !== 'done' && hasEnd && dayjs(state.end).isBefore(today, 'day');
              const lateDays = isOverdue ? today.diff(dayjs(state.end), 'day') : 0;

              // Tính toán phần trăm thanh ngang
              let barLeftPct = 0;
              let barWidthPct = 0;

              if (startDate && endDate) {
                const startOffset = Math.max(0, startDate.diff(minDate, 'day'));
                const duration = Math.max(1, endDate.diff(startDate, 'day') + 1);
                barLeftPct = (startOffset / totalDays) * 100;
                barWidthPct = Math.min(100 - barLeftPct, (duration / totalDays) * 100);
              }

              // Màu sắc thanh
              const barColor = isOverdue
                ? '#ff4d4f'
                : status === 'done'
                  ? '#52c41a'
                  : status === 'doing'
                    ? '#1677ff'
                    : '#8c8c8c';

              // Gate liên kết
              const gate = proc.gates.find((g) => g.at === st.code);
              const gateState = gate ? t.gates[gate.key] : null;

              return (
                <div
                  key={st.code}
                  onClick={() => onSelectStep?.(st.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 44,
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f0f0f0',
                    cursor: onSelectStep ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                  className="timeline-row-hover"
                >
                  {/* Cột trái thông tin bước */}
                  <div
                    style={{
                      width: 260,
                      minWidth: 260,
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRight: isDark ? '1px solid #30363d' : '1px solid #e8e8e8',
                      height: '100%',
                    }}
                  >
                    <Space size={8} style={{ minWidth: 0, overflow: 'hidden' }}>
                      <Tag
                        color={isOverdue ? 'error' : STEP_COLOR[status]}
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, margin: 0 }}
                      >
                        {st.code}
                      </Tag>
                      <Typography.Text
                        ellipsis
                        style={{ fontSize: 13, fontWeight: 500 }}
                        title={st.name}
                      >
                        {st.name}
                      </Typography.Text>
                    </Space>

                    <Space size={4}>
                      {isOverdue && (
                        <Tag color="error" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>
                          +{lateDays}d
                        </Tag>
                      )}
                      {Boolean(state.owners?.length) && (
                        <Avatar.Group maxCount={2} size={20} maxStyle={{ fontSize: 9 }}>
                          {state.owners.map((uid) => {
                            const u = users.find((x) => x.id === uid);
                            const name = u?.name || uid;
                            return (
                              <Tooltip key={uid} title={name}>
                                <Avatar size={20} style={{ backgroundColor: stringToColor(name), fontSize: 9 }}>
                                  {name.charAt(0).toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            );
                          })}
                        </Avatar.Group>
                      )}
                    </Space>
                  </div>

                  {/* Cột phải thanh Gantt */}
                  <div
                    style={{
                      flex: 1,
                      height: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {startDate && endDate ? (
                      <Tooltip
                        title={
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{st.code}: {st.name}</div>
                            <div>Thời gian: {state.start} ➔ {state.end}</div>
                            <div>Trạng thái: <b>{proc.labels.STATUS[status] || status}</b></div>
                            {isOverdue && <div style={{ color: '#ff7875' }}>Trễ hạn: +{lateDays} ngày</div>}
                            {Boolean(state.checks?.length) && (
                              <div>Checklist: {state.checks.filter(Boolean).length} / {st.rows.length} mục</div>
                            )}
                          </div>
                        }
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: `${barLeftPct}%`,
                            width: `${Math.max(barWidthPct, 2)}%`,
                            height: 24,
                            borderRadius: 4,
                            background: barColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 8px',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 600,
                            overflow: 'hidden',
                            boxShadow: isDark
                              ? '0 2px 4px rgba(0,0,0,0.4)'
                              : '0 2px 4px rgba(0,0,0,0.12)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {st.code} · {endDate.diff(startDate, 'day') + 1}d
                          </span>

                          {/* Icon trạng thái */}
                          {status === 'done' && <CheckCircleFilled style={{ fontSize: 12, marginLeft: 4 }} />}
                        </div>
                      </Tooltip>
                    ) : (
                      <div
                        style={{
                          marginLeft: 16,
                          fontSize: 12,
                          color: '#8c8c8c',
                          border: isDark ? '1px dashed #30363d' : '1px dashed #d9d9d9',
                          borderRadius: 4,
                          padding: '2px 8px',
                        }}
                      >
                        Chưa đặt ngày (bấm để vào đặt hạn)
                      </div>
                    )}

                    {/* Mốc Quality Gate (Kim cương 🔷) */}
                    {gate && (
                      <div
                        style={{
                          position: 'absolute',
                          left: startDate && endDate ? `calc(${barLeftPct + barWidthPct}% + 6px)` : '240px',
                          zIndex: 6,
                        }}
                      >
                        <Tooltip
                          title={
                            <div>
                              <div style={{ fontWeight: 700, color: '#d2a8ff' }}>{gate.id}: {gate.check}</div>
                              <div>Người ký duyệt: {gate.owner}</div>
                              <div>
                                Kết quả:{' '}
                                <b>
                                  {gateState?.result === 'pass'
                                    ? 'Đạt'
                                    : gateState?.result === 'fail'
                                      ? 'Không đạt'
                                      : 'Đang chờ ký'}
                                </b>
                              </div>
                              {gateState?.by && <div>Ký bởi: {gateState.by} ({fmt(gateState.at)})</div>}
                            </div>
                          }
                        >
                          <span
                            style={{
                              cursor: 'pointer',
                              fontSize: 16,
                              display: 'inline-block',
                              filter: gateState?.result === 'pass' ? 'drop-shadow(0 0 4px #52c41a)' : undefined,
                            }}
                          >
                            {gateState?.result === 'pass' ? '💎' : gateState?.result === 'fail' ? '❌' : '🔷'}
                          </span>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

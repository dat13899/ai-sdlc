import { useState } from 'react';
import {
  Avatar,
  Card,
  Col,
  Dropdown,
  Flex,
  Progress,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MoreOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Process, ProcStep, Project, StepStatus, Track, TrackView, User } from './types';
import { useTheme } from './ThemeContext';
import { STEP_COLOR, GATE_COLOR } from './util';
import { fireGateConfetti, triggerHapticShake } from './util/confetti';

export interface KanbanBoardProps {
  proc: Process;
  p: Project;
  tid: string;
  t: Track;
  v: TrackView;
  users?: User[];
  onSelectStep?: (stepCode: string) => void;
  onUpdateStepStatus: (stepCode: string, newStatus: StepStatus) => Promise<void>;
}

type KanbanColKey = 'todo' | 'doing' | 'review' | 'done';

interface KanbanColumn {
  key: KanbanColKey;
  title: string;
  color: string;
  bgLight: string;
  bgDark: string;
  icon: React.ReactNode;
}

const COLUMNS: KanbanColumn[] = [
  {
    key: 'todo',
    title: 'Chưa bắt đầu',
    color: '#8c8c8c',
    bgLight: '#f5f5f5',
    bgDark: '#161b22',
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'doing',
    title: 'Đang thực hiện',
    color: '#1677ff',
    bgLight: '#e6f4ff',
    bgDark: '#172554',
    icon: <SyncOutlined spin />,
  },
  {
    key: 'review',
    title: 'Chờ duyệt Gate',
    color: '#faad14',
    bgLight: '#fffbe6',
    bgDark: '#422006',
    icon: <SafetyCertificateOutlined />,
  },
  {
    key: 'done',
    title: 'Hoàn thành',
    color: '#52c41a',
    bgLight: '#f6ffed',
    bgDark: '#052e16',
    icon: <CheckCircleOutlined />,
  },
];

export function KanbanBoard({
  proc,
  p,
  tid,
  t,
  v,
  users = [],
  onSelectStep,
  onUpdateStepStatus,
}: KanbanBoardProps) {
  const { isDark } = useTheme();
  const [draggedStepCode, setDraggedStepCode] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColKey | null>(null);

  // Phân loại các bước vào 4 cột
  const stepList = proc.steps.filter((st) => t?.steps?.[st.code]);

  function getStepColumn(st: ProcStep): KanbanColKey {
    const s = t?.steps?.[st.code];
    if (!s) return 'todo';
    if (s.status === 'done' || s.status === 'skipped') return 'done';

    // Nếu bước có gate đi kèm và gate đang chờ duyệt
    const stepGate = proc.gates.find((g) => g.at === st.code && t?.gates?.[g.key]);
    if (stepGate) {
      const gv = t?.gates?.[stepGate.key];
      if (gv && gv.result === 'pending' && s.status === 'doing') {
        return 'review';
      }
    }

    if (s.status === 'doing') return 'doing';
    return 'todo';
  }

  const columnsData: Record<KanbanColKey, ProcStep[]> = {
    todo: [],
    doing: [],
    review: [],
    done: [],
  };

  stepList.forEach((st) => {
    const col = getStepColumn(st);
    columnsData[col].push(st);
  });

  // Xử lý kéo thả HTML5
  const handleDragStart = (e: React.DragEvent, stepCode: string) => {
    setDraggedStepCode(stepCode);
    e.dataTransfer.setData('text/plain', stepCode);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: KanbanColKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCol: KanbanColKey) => {
    e.preventDefault();
    setDragOverCol(null);
    const stepCode = e.dataTransfer.getData('text/plain') || draggedStepCode;
    setDraggedStepCode(null);
    if (!stepCode) return;

    await moveStepToColumn(stepCode, targetCol);
  };

  const moveStepToColumn = async (stepCode: string, targetCol: KanbanColKey) => {
    const st = proc.steps.find((s) => s.code === stepCode);
    if (!st) return;

    // Kiểm tra quyền chỉnh sửa
    const canEdit = v.canEditStep ? v.canEditStep[stepCode] : true;
    if (!canEdit) {
      triggerHapticShake();
      message.error(`Bạn không có quyền chuyển trạng thái bước ${stepCode}`);
      return;
    }

    // Nếu chuyển sang 'done', kiểm tra chặn bởi Bug S1/S2
    if (targetCol === 'done') {
      const openBugs = (p.bugs || []).filter(
        (b) =>
          b.track === tid &&
          b.step === stepCode &&
          ['open', 'in_progress'].includes(b.status) &&
          ['S1', 'S2'].includes(b.severity)
      );
      if (openBugs.length > 0) {
        triggerHapticShake();
        message.error(
          `Không thể hoàn thành bước ${stepCode}: Còn ${openBugs.length} bug S1/S2 chưa xử lý!`
        );
        return;
      }
    }

    // Ánh xạ cột sang StepStatus
    let newDbStatus: StepStatus = 'todo';
    if (targetCol === 'doing' || targetCol === 'review') newDbStatus = 'doing';
    if (targetCol === 'done') newDbStatus = 'done';

    try {
      await onUpdateStepStatus(stepCode, newDbStatus);
      if (targetCol === 'done') {
        fireGateConfetti();
      }
      message.success(`Đã chuyển bước ${stepCode} sang "${COLUMNS.find((c) => c.key === targetCol)?.title}"`);
    } catch (err) {
      triggerHapticShake();
      message.error((err as Error).message);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Row gutter={[16, 16]}>
        {COLUMNS.map((col) => {
          const list = columnsData[col.key];
          const isOver = dragOverCol === col.key;

          return (
            <Col xs={24} sm={12} lg={6} key={col.key}>
              <div
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.key)}
                style={{
                  background: isDark ? (isOver ? '#1f293d' : '#161b22') : (isOver ? '#e6f4ff' : '#f8f9fa'),
                  borderRadius: 10,
                  padding: '12px 10px',
                  minHeight: 520,
                  border: isOver
                    ? '2px dashed #1677ff'
                    : `1px solid ${isDark ? '#30363d' : '#e8e8e8'}`,
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header Cột */}
                <Flex
                  justify="space-between"
                  align="center"
                  style={{
                    padding: '6px 8px',
                    marginBottom: 12,
                    borderBottom: `2px solid ${col.color}`,
                  }}
                >
                  <Space size={6} align="center">
                    <span style={{ color: col.color, fontSize: 16 }}>{col.icon}</span>
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      {col.title}
                    </Typography.Text>
                  </Space>
                  <Tag
                    color={col.key === 'done' ? 'success' : col.key === 'doing' ? 'processing' : 'default'}
                    style={{ margin: 0, borderRadius: 12, fontWeight: 700 }}
                  >
                    {list.length}
                  </Tag>
                </Flex>

                {/* Danh sách thẻ bước trong cột */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {list.length === 0 ? (
                    <div
                      style={{
                        padding: '32px 12px',
                        textAlign: 'center',
                        color: isDark ? '#8b949e' : '#8c8c8c',
                        fontSize: 13,
                        fontStyle: 'italic',
                      }}
                    >
                      Kéo bước vào đây
                    </div>
                  ) : (
                    list.map((st) => {
                      const s = t?.steps?.[st.code];
                      const pct = v.stepPct ? v.stepPct[st.code] ?? 0 : 0;
                      const isDragging = draggedStepCode === st.code;
                      const stepDocs = (p.docs || []).filter((d) => d.track === tid && d.step === st.code);
                      const stepBugs = (p.bugs || []).filter(
                        (b) => b.track === tid && b.step === st.code
                      );
                      const openBugs = stepBugs.filter((b) => ['open', 'in_progress'].includes(b.status));
                      const stepGate = proc.gates.find((g) => g.at === st.code && t?.gates?.[g.key]);

                      const doneChecks = (s?.checks || []).filter(Boolean).length;
                      const totalChecks = st.rows?.length || 0;
                      const primaryRole = st.rows?.[0]?.who || 'Team';

                      return (
                        <div
                          key={st.code}
                          draggable
                          onDragStart={(e) => handleDragStart(e, st.code)}
                          onClick={() => onSelectStep?.(st.code)}
                          className="hover-lift"
                          style={{
                            background: isDark ? '#0d1117' : '#ffffff',
                            borderRadius: 8,
                            padding: '12px 14px',
                            border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}`,
                            boxShadow: isDark
                              ? '0 2px 6px rgba(0,0,0,0.3)'
                              : '0 2px 6px rgba(0,0,0,0.03)',
                            opacity: isDragging ? 0.4 : 1,
                            cursor: 'grab',
                            position: 'relative',
                          }}
                        >
                          {/* Mã bước & Vai trò */}
                          <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                            <Space size={6}>
                              <Tag
                                color={STEP_COLOR[s?.status || 'todo']}
                                style={{ margin: 0, fontWeight: 700 }}
                              >
                                {st.code}
                              </Tag>
                              <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                                {primaryRole}
                              </Tag>
                            </Space>

                            {/* Dropdown chuyển cột nhanh (Quick Move) */}
                            <Dropdown
                              trigger={['click']}
                              menu={{
                                items: COLUMNS.filter((c) => c.key !== col.key).map((c) => ({
                                  key: c.key,
                                  label: `Chuyển sang: ${c.title}`,
                                  icon: c.icon,
                                  onClick: (info) => {
                                    info.domEvent.stopPropagation();
                                    moveStepToColumn(st.code, c.key as KanbanColKey);
                                  },
                                })),
                              }}
                            >
                              <span
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', color: '#8c8c8c', padding: 2 }}
                              >
                                <MoreOutlined />
                              </span>
                            </Dropdown>
                          </Flex>

                          {/* Tiêu đề bước */}
                          <Typography.Text
                            strong
                            style={{
                              fontSize: 13,
                              display: 'block',
                              marginBottom: 8,
                              color: isDark ? '#f0f6fc' : '#1f1f1f',
                            }}
                          >
                            {st.name}
                          </Typography.Text>

                          {/* Tiến độ checklist */}
                          <div style={{ marginBottom: 8 }}>
                            <Flex justify="space-between" align="center" style={{ marginBottom: 2 }}>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                Checklist: {doneChecks}/{totalChecks}
                              </Typography.Text>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {pct}%
                              </Typography.Text>
                            </Flex>
                            <Progress
                              percent={pct}
                              size="small"
                              showInfo={false}
                              strokeColor={pct === 100 ? '#52c41a' : '#1677ff'}
                            />
                          </div>

                          {/* Badges footer: Tài liệu, Bug, Quality Gate, Người phụ trách */}
                          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                            <Space size={6} wrap>
                              {stepDocs.length > 0 && (
                                <Tooltip title={`${stepDocs.length} tài liệu đính kèm`}>
                                  <Tag style={{ margin: 0, fontSize: 11 }}>
                                    <FileTextOutlined /> {stepDocs.length}
                                  </Tag>
                                </Tooltip>
                              )}

                              {openBugs.length > 0 && (
                                <Tooltip title={`${openBugs.length} bug chưa đóng`}>
                                  <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                                    🐛 {openBugs.length}
                                  </Tag>
                                </Tooltip>
                              )}

                              {stepGate && (
                                <Tooltip
                                  title={`Gate ${stepGate.id}: ${proc.labels.GATE_RESULT[t.gates[stepGate.key]?.result || 'pending']}`}
                                >
                                  <Tag
                                    color={GATE_COLOR[t.gates[stepGate.key]?.result || 'pending']}
                                    style={{ margin: 0, fontSize: 11 }}
                                  >
                                    ⛔ {stepGate.id}
                                  </Tag>
                                </Tooltip>
                              )}
                            </Space>

                            {/* Avatar người phụ trách */}
                            {s?.owners && s.owners.length > 0 ? (
                              <Tooltip
                                title={`Phụ trách: ${s.owners
                                  .map((uid) => users.find((u) => u.id === uid)?.name || uid)
                                  .join(', ')}`}
                              >
                                <Avatar
                                  size={20}
                                  style={{
                                    backgroundColor: '#1677ff',
                                    fontSize: 10,
                                  }}
                                >
                                  {(users.find((u) => u.id === s.owners[0])?.name || s.owners[0] || 'U')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Chưa phân công">
                                <Avatar
                                  size={20}
                                  icon={<UserOutlined />}
                                  style={{ backgroundColor: isDark ? '#30363d' : '#d9d9d9' }}
                                />
                              </Tooltip>
                            )}
                          </Flex>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}


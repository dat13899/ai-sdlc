// Component hiển thị so sánh hai phiên bản Markdown (Visual Markdown Diff)
// Hỗ trợ chế độ Gộp (Unified) và Hai cột song song (Side-by-side)
import { useMemo, useState } from 'react';
import { Card, Flex, Segmented, Space, Tag, Typography } from 'antd';
import { AppstoreOutlined, BarsOutlined, CheckCircleOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { buildSideBySideRows, computeLineDiff } from './diff';
import { useTheme } from './ThemeContext';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
}

export default function DiffViewer({
  oldText,
  newText,
  oldLabel = 'Phiên bản cũ',
  newLabel = 'Phiên bản mới',
}: DiffViewerProps) {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const { lines, stats } = useMemo(() => computeLineDiff(oldText, newText), [oldText, newText]);
  const splitRows = useMemo(() => buildSideBySideRows(lines), [lines]);

  const bgAdd = isDark ? 'rgba(46, 160, 67, 0.18)' : '#e6ffec';
  const bgDel = isDark ? 'rgba(248, 81, 73, 0.18)' : '#ffebe9';
  const textAdd = isDark ? '#7ee787' : '#1a7f37';
  const textDel = isDark ? '#ff7b72' : '#cf222e';
  const lineNumColor = isDark ? '#8b949e' : '#6e7781';
  const borderColor = isDark ? '#30363d' : '#d0d7de';

  if (oldText === newText) {
    return (
      <Card size="small" style={{ textAlign: 'center', padding: '24px 0' }}>
        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Hai phiên bản có nội dung hoàn toàn giống nhau (0 thay đổi).
        </Typography.Paragraph>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Thanh công cụ & Thống kê */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Space size="middle">
          <Tag color="success" icon={<PlusCircleOutlined />}>+{stats.additions} dòng thêm</Tag>
          <Tag color="error" icon={<MinusCircleOutlined />}>-{stats.deletions} dòng xóa</Tag>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            ({stats.unchanged} dòng giữ nguyên)
          </Typography.Text>
        </Space>

        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as 'unified' | 'split')}
          options={[
            { label: 'Dạng gộp (Unified)', value: 'unified', icon: <BarsOutlined /> },
            { label: 'Hai cột (Side-by-side)', value: 'split', icon: <AppstoreOutlined /> },
          ]}
        />
      </Flex>

      {/* Vùng hiển thị Diff */}
      <div
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          overflowX: 'auto',
          fontSize: 12.5,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
          background: isDark ? '#0d1117' : '#ffffff',
          lineHeight: '20px',
        }}
      >
        {viewMode === 'unified' ? (
          /* Chế độ Gộp (Unified) */
          <div style={{ minWidth: 640 }}>
            {lines.map((l, idx) => {
              const isAdd = l.type === 'add';
              const isDel = l.type === 'del';
              const bg = isAdd ? bgAdd : isDel ? bgDel : 'transparent';
              const color = isAdd ? textAdd : isDel ? textDel : undefined;
              const sign = isAdd ? '+' : isDel ? '-' : ' ';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    background: bg,
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.02)',
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      padding: '0 6px',
                      textAlign: 'right',
                      color: lineNumColor,
                      userSelect: 'none',
                      flex: 'none',
                    }}
                  >
                    {l.oldNum || ''}
                  </span>
                  <span
                    style={{
                      width: 44,
                      padding: '0 6px',
                      textAlign: 'right',
                      color: lineNumColor,
                      userSelect: 'none',
                      flex: 'none',
                      borderRight: `1px solid ${borderColor}`,
                    }}
                  >
                    {l.newNum || ''}
                  </span>
                  <span
                    style={{
                      width: 20,
                      textAlign: 'center',
                      color,
                      fontWeight: 700,
                      userSelect: 'none',
                      flex: 'none',
                    }}
                  >
                    {sign}
                  </span>
                  <span style={{ padding: '0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', flex: 1, color }}>
                    {l.text || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Chế độ Hai cột (Side-by-side) */
          <div style={{ minWidth: 780 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderBottom: `1px solid ${borderColor}`,
                background: isDark ? '#161b22' : '#f6f8fa',
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              <div>{oldLabel}</div>
              <div>{newLabel}</div>
            </div>

            {splitRows.map((r, idx) => {
              const left = r.left;
              const right = r.right;
              const leftBg = left?.type === 'del' ? bgDel : 'transparent';
              const rightBg = right?.type === 'add' ? bgAdd : 'transparent';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Cột trái: Bản cũ */}
                  <div style={{ display: 'flex', background: leftBg, borderRight: `1px solid ${borderColor}` }}>
                    <span
                      style={{
                        width: 40,
                        padding: '0 4px',
                        textAlign: 'right',
                        color: lineNumColor,
                        userSelect: 'none',
                        flex: 'none',
                      }}
                    >
                      {left?.num || ''}
                    </span>
                    <span
                      style={{
                        width: 16,
                        textAlign: 'center',
                        color: left?.type === 'del' ? textDel : undefined,
                        fontWeight: 700,
                        userSelect: 'none',
                        flex: 'none',
                      }}
                    >
                      {left?.type === 'del' ? '-' : ' '}
                    </span>
                    <span
                      style={{
                        padding: '0 6px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        flex: 1,
                        color: left?.type === 'del' ? textDel : undefined,
                      }}
                    >
                      {left?.text || ' '}
                    </span>
                  </div>

                  {/* Cột phải: Bản mới */}
                  <div style={{ display: 'flex', background: rightBg }}>
                    <span
                      style={{
                        width: 40,
                        padding: '0 4px',
                        textAlign: 'right',
                        color: lineNumColor,
                        userSelect: 'none',
                        flex: 'none',
                      }}
                    >
                      {right?.num || ''}
                    </span>
                    <span
                      style={{
                        width: 16,
                        textAlign: 'center',
                        color: right?.type === 'add' ? textAdd : undefined,
                        fontWeight: 700,
                        userSelect: 'none',
                        flex: 'none',
                      }}
                    >
                      {right?.type === 'add' ? '+' : ' '}
                    </span>
                    <span
                      style={{
                        padding: '0 6px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        flex: 1,
                        color: right?.type === 'add' ? textAdd : undefined,
                      }}
                    >
                      {right?.text || ' '}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Pagination,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { Doc } from '../types';
import { useTheme } from '../ThemeContext';

interface SheetDataResponse {
  filename: string;
  sheetNames: string[];
  sheets: {
    [name: string]: {
      name: string;
      rows: (string | number | boolean | null)[][];
      totalRows: number;
      totalCols: number;
      truncated: boolean;
    };
  };
}

interface SheetViewerProps {
  pid: string;
  doc: Doc;
}

// Chuyển chỉ số cột 0, 1, 2... thành chữ cái A, B, C... AA, AB...
function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export default function SheetViewer({ pid, doc }: SheetViewerProps) {
  const { isDark } = useTheme();
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 100;

  const downloadUrl = `/api/projects/${pid}/files/${doc.id}`;

  const qSheet = useQuery<SheetDataResponse>({
    queryKey: ['sheet-data', pid, doc.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${pid}/docs/${doc.id}/sheet-data`, {
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lỗi tải file bảng tính (${res.status})`);
      }
      return res.json();
    },
  });

  const currentSheetName = activeSheet || qSheet.data?.sheetNames?.[0] || '';
  const currentSheet = qSheet.data?.sheets?.[currentSheetName];

  // Lọc dữ liệu theo từ khoá tìm kiếm
  const filteredRows = useMemo(() => {
    if (!currentSheet || !currentSheet.rows) return [];
    const term = search.trim().toLowerCase();
    if (!term) return currentSheet.rows;

    return currentSheet.rows.filter((row, idx) => {
      if (idx === 0) return true; // Giữ lại dòng tiêu đề
      return row.some((cell) => String(cell ?? '').toLowerCase().includes(term));
    });
  }, [currentSheet, search]);

  // Phân trang dữ liệu
  const hasHeader = filteredRows.length > 0;
  const headerRow = hasHeader ? filteredRows[0] : [];
  const bodyRows = hasHeader ? filteredRows.slice(1) : [];

  const paginatedBodyRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return bodyRows.slice(start, start + pageSize);
  }, [bodyRows, page, pageSize]);

  const maxCols = useMemo(() => {
    if (!currentSheet?.rows) return 0;
    return Math.max(
      headerRow.length,
      ...paginatedBodyRows.map((r) => r.length),
      currentSheet.totalCols || 0
    );
  }, [currentSheet, headerRow, paginatedBodyRows]);

  if (qSheet.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin tip="Đang phân tích dữ liệu bảng tính..." size="large" />
      </div>
    );
  }

  if (qSheet.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể hiển thị bảng tính"
        description={(qSheet.error as Error).message}
        action={
          <Button icon={<DownloadOutlined />} href={downloadUrl}>
            Tải file gốc về xem
          </Button>
        }
      />
    );
  }

  if (!qSheet.data || qSheet.data.sheetNames.length === 0) {
    return <Empty description="File bảng tính không chứa trang tính (sheet) nào" />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        background: isDark ? '#141414' : '#ffffff',
        borderRadius: 8,
        border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
        overflow: 'hidden',
      }}
    >
      {/* Thanh công cụ bảng tính */}
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={12}
        style={{
          padding: '10px 16px',
          background: isDark ? '#1f1f1f' : '#fafafa',
          borderBottom: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
        }}
      >
        <Space size={10} wrap>
          <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Typography.Text strong>{qSheet.data.filename}</Typography.Text>
          <Tag color="green">
            {currentSheet?.totalRows ?? 0} dòng × {currentSheet?.totalCols ?? 0} cột
          </Tag>
          {currentSheet?.truncated && (
            <Tooltip title="Chỉ hiển thị tối đa 5,000 dòng để tối ưu hiệu năng hiển thị">
              <Tag color="warning">Đã rút gọn 5,000 dòng</Tag>
            </Tooltip>
          )}
        </Space>

        <Space size={10} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm trong bảng tính..."
            value={search}
            allowClear
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 240 }}
            size="small"
          />
          <Button size="small" icon={<DownloadOutlined />} href={downloadUrl}>
            Tải file gốc
          </Button>
        </Space>
      </Flex>

      {/* Tabs chọn Sheet (nếu có nhiều sheets) */}
      {qSheet.data.sheetNames.length > 1 && (
        <div
          style={{
            padding: '0 16px',
            background: isDark ? '#181818' : '#f5f5f5',
            borderBottom: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
          }}
        >
          <Tabs
            size="small"
            activeKey={currentSheetName}
            onChange={(k) => {
              setActiveSheet(k);
              setSearch('');
              setPage(1);
            }}
            items={qSheet.data.sheetNames.map((name) => ({
              key: name,
              label: (
                <Space size={6}>
                  <TableOutlined />
                  <span>{name}</span>
                </Space>
              ),
            }))}
          />
        </div>
      )}

      {/* Vùng hiển thị ô lưới (Grid Table) */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {filteredRows.length === 0 ? (
          <Empty
            style={{ padding: '40px 0' }}
            description={search ? 'Không có ô nào khớp từ khoá tìm kiếm' : 'Bảng tính này trống'}
          />
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              fontFamily: 'Consolas, Menlo, Monaco, "Courier New", monospace',
              color: isDark ? '#d4d4d4' : '#24292e',
            }}
          >
            {/* Dòng chữ cái định danh cột A, B, C... */}
            <thead>
              <tr
                style={{
                  background: isDark ? '#262626' : '#e6f4ff',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                }}
              >
                <th
                  style={{
                    padding: '6px 10px',
                    border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
                    width: 50,
                    textAlign: 'center',
                    color: isDark ? '#8c8c8c' : '#595959',
                    fontWeight: 600,
                  }}
                >
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    style={{
                      padding: '6px 12px',
                      border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
                      textAlign: 'left',
                      minWidth: 100,
                      fontWeight: 600,
                      color: isDark ? '#a6c8e0' : '#0958d9',
                    }}
                  >
                    {getColumnLetter(cIdx)}
                  </th>
                ))}
              </tr>

              {/* Dòng tiêu đề thực tế (Row 1 trong file) */}
              {headerRow && (
                <tr
                  style={{
                    background: isDark ? '#1f1f1f' : '#fafafa',
                    fontWeight: 700,
                    position: 'sticky',
                    top: 31,
                    zIndex: 2,
                    borderBottom: '2px solid #1677ff',
                  }}
                >
                  <td
                    style={{
                      padding: '8px 10px',
                      border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
                      textAlign: 'center',
                      color: isDark ? '#8c8c8c' : '#595959',
                      background: isDark ? '#262626' : '#f0f0f0',
                    }}
                  >
                    1
                  </td>
                  {Array.from({ length: maxCols }).map((_, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: '8px 12px',
                        border: isDark ? '1px solid #303030' : '1px solid #d9d9d9',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(headerRow[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              )}
            </thead>

            {/* Thân bảng */}
            <tbody>
              {paginatedBodyRows.map((row, rIdx) => {
                const actualRowNumber = (page - 1) * pageSize + rIdx + 2;
                const isEven = rIdx % 2 === 0;
                return (
                  <tr
                    key={rIdx}
                    style={{
                      background: isEven
                        ? isDark
                          ? '#141414'
                          : '#ffffff'
                        : isDark
                        ? '#1a1a1a'
                        : '#fafafa',
                    }}
                  >
                    {/* Số thứ tự dòng */}
                    <td
                      style={{
                        padding: '6px 10px',
                        border: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
                        textAlign: 'center',
                        color: isDark ? '#666' : '#8c8c8c',
                        background: isDark ? '#1f1f1f' : '#f5f5f5',
                        userSelect: 'none',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                      }}
                    >
                      {actualRowNumber}
                    </td>

                    {/* Dữ liệu từng ô */}
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      const val = row[cIdx];
                      const strVal =
                        typeof val === 'object' && val !== null
                          ? (val as any) instanceof Date
                            ? (val as any).toLocaleDateString('vi-VN')
                            : JSON.stringify(val)
                          : String(val ?? '');
                      const isNumeric = typeof val === 'number' || (!isNaN(Number(strVal)) && strVal !== '' && !strVal.startsWith('0') && strVal.length < 15);

                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: '6px 12px',
                            border: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
                            textAlign: isNumeric ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={strVal}
                        >
                          {strVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Chân trang: Phân trang */}
      {bodyRows.length > pageSize && (
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: '8px 16px',
            background: isDark ? '#1f1f1f' : '#fafafa',
            borderTop: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Hiển thị {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, bodyRows.length)} trong tổng số {bodyRows.length} dòng
          </Typography.Text>
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={bodyRows.length}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </Flex>
      )}
    </div>
  );
}

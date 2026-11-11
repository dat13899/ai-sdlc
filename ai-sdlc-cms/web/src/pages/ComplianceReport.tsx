// Trang Biên bản Nghiệm thu & Báo cáo Kiểm toán Tuân thủ AI-SDLC v5.9
import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Alert, Button, Card, Col, Descriptions, Divider, Result, Row, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, PrinterOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useProcess, useProject, useUsers } from '../api';
import type { Bug, Item, Process, Project, Track, User } from '../types';
import { fmt, GATE_COLOR, KIND_COLOR, BUG_SEVERITY_COLOR, BUG_STATUS_COLOR, blob, tplPath } from '../util';

export default function ComplianceReport() {
  const { id = '', t: tid = 'base' } = useParams();
  const nav = useNavigate();
  const proc = useProcess().data;
  const users = useUsers().data || [];
  const q = useProject(id);

  if (q.isLoading || !proc) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!q.data) return <Result status="404" title="Không tìm thấy dự án" extra={<Link to="/">Về Dashboard</Link>} />;

  const p = q.data;
  const t = tid === 'base' ? p.base : (p.items || []).find((i) => i.id === tid);
  if (!t) return <Result status="404" title="Không tìm thấy hạng mục" extra={<Link to={`/p/${p.id}`}>Về dự án</Link>} />;

  const item = tid === 'base' ? null : (t as Item);
  const v = tid === 'base' ? p.view?.base : p.view?.items?.[tid];
  const trackLogs = (p.aiLogs || []).filter((l) => l.track === tid);
  const trackBugs = (p.bugs || []).filter((b) => b.track === tid);
  const trackDocs = (p.docs || []).filter((d) => d.track === tid);
  const openS1S2 = trackBugs.filter((b) => ['S1', 'S2'].includes(b.severity) && b.status !== 'closed');
  const pendingAi = trackLogs.filter((l) => l.result === 'pending');

  const gatesList = proc.gates.filter((g) => t.gates && t.gates[g.key]).map((g) => {
    const state = t.gates[g.key];
    const applies = (t.steps?.[g.at] || {}).status !== 'skipped';
    return {
      key: g.key,
      id: g.id,
      at: g.at,
      owner: g.owner,
      roles: g.roles,
      check: g.check,
      applies,
      result: applies ? state.result : 'na',
      by: state.by,
      atTime: state.at,
      note: state.note,
    };
  });

  const passedGates = gatesList.filter((g) => g.result === 'pass').length;
  const totalGates = gatesList.filter((g) => g.applies).length;

  const downloadMd = () => {
    const now = new Date().toISOString().slice(0, 10);
    const title = item ? item.name : 'Nền tảng (B1–B2)';
    const lines = [
      `# BIÊN BẢN NGHIỆM THU & BÁO CÁO TUÂN THỦ AI-SDLC v5.9`,
      ``,
      `> **Dự án**: ${p.name} (${p.code || 'Chưa có mã'})`,
      `> **Hạng mục**: ${title} (${item ? proc.labels.KIND[item.kind] : 'Nền tảng'})`,
      `> **Ngày lập**: ${now}`,
      `> **Kho Git**: ${p.repoUrl || '(trống)'} @ \`${p.branch}\``,
      item?.specDir ? `> **Thư mục Spec**: \`${item.specDir}\`` : '',
      ``,
      `---`,
      ``,
      `## 1. Tóm tắt Tuân thủ (Compliance Scorecard)`,
      ``,
      `- **Tiến độ tổng thể**: ${v?.pct ?? 0}%`,
      `- **Cổng chất lượng (Gates)**: Đạt ${passedGates}/${totalGates} gate áp dụng`,
      `- **Kiểm soát AI (Human Gate)**: ${trackLogs.length} lần ghi nhận (${pendingAi.length} chờ duyệt)`,
      `- **Kiểm soát Lỗi (Bug S1/S2)**: ${openS1S2.length} bug S1/S2 chưa đóng ${openS1S2.length === 0 ? '✓ (Đạt chuẩn Gate 4)' : '⚠️ (Chưa đạt)'}`,
      ``,
      `---`,
      ``,
      `## 2. Biên bản Ký duyệt Quality Gates`,
      ``,
      `| Gate | Bước | Người ký & Vai trò | Thời điểm | Kết quả | Ghi chú nghiệm thu |`,
      `|---|---|---|---|---|---|`,
      ...gatesList.map((g) =>
        `| ${g.id} | ${g.at} | ${g.by || '—'} (${g.roles.join('/')}) | ${g.atTime ? fmt(g.atTime) : '—'} | ${g.applies ? proc.labels.GATE_RESULT[g.result as keyof typeof proc.labels.GATE_RESULT] : 'Không áp dụng'} | ${g.note || '—'} |`
      ),
      ``,
      `---`,
      ``,
      `## 3. Bằng chứng Quản trị AI & Human Gate`,
      ``,
      `| Bước | Nguồn gốc | Công cụ & Model | Mã Prompt | Mục đích | Người thực hiện | Người duyệt | Kết quả |`,
      `|---|---|---|---|---|---|---|---|`,
      ...(trackLogs.length ? trackLogs.map((l) =>
        `| ${l.step} | ${proc.labels.AI_ORIGIN[l.origin]} | ${l.tool} ${l.model || ''} | ${l.promptId || '—'} | ${l.purpose} | ${l.byName} (${fmt(l.at)}) | ${l.reviewerName || '—'} | ${proc.labels.AI_RESULT[l.result]} |`
      ) : ['| — | — | — | — | Không ghi nhận dùng AI | — | — | — |']),
      ``,
      `---`,
      ``,
      `## 4. Bảng Theo dõi Bug & Tiêu chí Gate 4`,
      ``,
      `| Mã | Mức độ | Tiêu đề | Bước | Người báo | Giao cho | Trạng thái | Đóng lúc |`,
      `|---|---|---|---|---|---|---|---|`,
      ...(trackBugs.length ? trackBugs.map((b) =>
        `| ${b.code} | ${b.severity} | ${b.title} | ${b.step} | ${b.foundByName} | ${b.fixByName || '—'} | ${proc.labels.BUG_STATUS[b.status]} | ${b.closedAt ? fmt(b.closedAt) : '—'} |`
      ) : ['| — | — | Không có bug nào phát sinh | — | — | — | — | — |']),
      ``,
      `---`,
      ``,
      `## 5. Danh mục Tài liệu Đầu ra`,
      ``,
      `| Bước | Tài liệu | Loại | Đường dẫn / File | Người đính kèm |`,
      `|---|---|---|---|---|`,
      ...(trackDocs.length ? trackDocs.map((d) =>
        `| ${d.step} | ${d.label} | ${d.file ? 'File .md' : 'Link Git'} | ${d.url || (d.file ? d.file.name : '—')} | ${d.byName} |`
      ) : ['| — | Chưa gắn tài liệu đầu ra | — | — | — |']),
      ``,
      `---`,
      `*Báo cáo được trích xuất tự động từ AI-SDLC CMS (https://${proc.site.replace(/^https?:\/\//, '')})*`,
    ].filter(Boolean).join('\n');

    const blobData = new Blob([lines], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-SDLC-Compliance-Report-${p.code || p.id}-${item ? item.name : 'base'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px' }}>
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print, .ant-layout-sider, .ant-layout-header { display: none !important; }
          .ant-layout, .ant-layout-content { padding: 0 !important; margin: 0 !important; background: #fff !important; }
          .report-paper { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      {/* Thanh điều hướng và nút thao tác */}
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav(`/p/${p.id}/t/${tid}`)}>Quay lại Dự án</Button>
          <Typography.Title level={4} style={{ margin: 0 }}>Hồ sơ Tuân thủ & Nghiệm thu</Typography.Title>
        </Space>
        <Space>
          <Button href={`/p/${p.id}/dossier`} icon={<SafetyCertificateOutlined />}>
            Hồ sơ Điều hành Dự án (Dossier)
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadMd}>Tải báo cáo .md</Button>
          <Button icon={<PrinterOutlined />} type="primary" onClick={() => window.print()}>In / Xuất PDF</Button>
        </Space>
      </div>

      {/* Thẻ báo cáo mô phỏng văn bản nghiệm thu chuẩn */}
      <Card className="report-paper" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', marginBottom: 8 }}>QUY TRÌNH PHÁT TRIỂN PHẦN MỀM TÍCH HỢP AI — AI-SDLC v5.9</Tag>
          <Typography.Title level={2} style={{ margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            BIÊN BẢN NGHIỆM THU & BÁO CÁO TUÂN THỦ
          </Typography.Title>
          <Typography.Text type="secondary">
            Hạng mục: <b>{item ? item.name : 'Nền tảng (B1–B2)'}</b> · Dự án: <b>{p.name}</b> {p.code && `(${p.code})`}
          </Typography.Text>
        </div>

        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 4 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Hạng mục">{item ? item.name : 'Nền tảng'}</Descriptions.Item>
          <Descriptions.Item label="Loại hạng mục">{item ? <Tag color={KIND_COLOR[item.kind]}>{proc.labels.KIND[item.kind]}</Tag> : 'Nền tảng'}</Descriptions.Item>
          <Descriptions.Item label="Kho Git">{p.repoUrl ? <code>{p.repoUrl}</code> : '(chưa khai báo)'}</Descriptions.Item>
          <Descriptions.Item label="Nhánh chính"><code>{p.branch}</code></Descriptions.Item>
          <Descriptions.Item label="Thư mục Spec"><code>{item?.specDir || '(không có)'}</code></Descriptions.Item>
          <Descriptions.Item label="Ngày xuất báo cáo">{dayjs().format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Quy trình chuẩn">{p.processVersion ? `AI-SDLC v${p.processVersion}` : 'AI-SDLC v5.9'}</Descriptions.Item>
          <Descriptions.Item label="Mức nhạy cảm">{p.aiSetup.dataLevel ? <Tag>{proc.labels.DATA_LEVEL[p.aiSetup.dataLevel]}</Tag> : '(chưa chọn)'}</Descriptions.Item>
        </Descriptions>

        {/* Thước đo tổng thể */}
        <Card size="small" style={{ background: '#f8f9fa', marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Statistic title="Tiến độ hoàn thành" value={v.pct} suffix="%" valueStyle={{ color: v.pct === 100 ? '#52c41a' : '#0958d9' }} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Cổng chất lượng (Gates)"
                value={`${passedGates}/${totalGates}`}
                prefix={passedGates === totalGates ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : undefined}
                valueStyle={{ color: passedGates === totalGates ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Quản trị AI (Human Gate)"
                value={trackLogs.length}
                suffix={pendingAi.length ? `(${pendingAi.length} chờ duyệt)` : 'đã duyệt hết'}
                valueStyle={{ color: pendingAi.length ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Bug S1/S2 (Gate 4)"
                value={openS1S2.length}
                suffix={openS1S2.length === 0 ? '✓ Đạt' : '⚠️ Chặn Gate 4'}
                valueStyle={{ color: openS1S2.length === 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 1. Biên bản Quality Gates */}
        <Typography.Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: '#0958d9' }} /> 1. Biên bản Ký duyệt Cổng Chất lượng (8 Quality Gates)
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Ghi nhận chữ ký số, vai trò RACI và điều kiện nghiệm thu tại các cổng kiểm soát chất lượng từ Gate 1 đến Gate 5.
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          dataSource={gatesList}
          columns={[
            { title: 'Gate', dataIndex: 'id', width: 90, render: (id: string) => <b>{id}</b> },
            { title: 'Tại bước', dataIndex: 'at', width: 85, render: (at: string) => <Tag color="blue">{at}</Tag> },
            { title: 'Vai trò duyệt', dataIndex: 'roles', render: (roles: string[]) => roles.map((r) => <Tag key={r}>{r}</Tag>) },
            { title: 'Điều kiện kiểm tra', dataIndex: 'check' },
            {
              title: 'Kết quả',
              dataIndex: 'result',
              width: 120,
              render: (res: string, row: any) =>
                !row.applies ? (
                  <Tag>Bỏ qua</Tag>
                ) : (
                  <Tag color={GATE_COLOR[res as keyof typeof GATE_COLOR]}>{proc.labels.GATE_RESULT[res as keyof typeof proc.labels.GATE_RESULT]}</Tag>
                ),
            },
            {
              title: 'Người ký & Thời điểm',
              width: 180,
              render: (_: any, row: any) => (row.by ? <div>{row.by}<div><Typography.Text type="secondary" style={{ fontSize: 11 }}>{fmt(row.atTime)}</Typography.Text></div></div> : '—'),
            },
            { title: 'Ghi chú phê duyệt', dataIndex: 'note', render: (note: string) => note || <Typography.Text type="secondary">—</Typography.Text> },
          ]}
          style={{ marginBottom: 28 }}
        />

        {/* 2. Bằng chứng Quản trị AI & Human Gate */}
        <Typography.Title level={4}>2. Bằng chứng Quản trị AI & Human Gate (AI Governance Dossier)</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Tất cả các nội dung do AI sinh trong hạng mục đều có mã định danh, người thực hiện và đã được phê duyệt chéo bởi con người.
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          dataSource={trackLogs}
          rowKey="id"
          columns={[
            { title: 'Bước', dataIndex: 'step', width: 75, render: (s: string) => <Tag>{s}</Tag> },
            { title: 'Nguồn gốc', dataIndex: 'origin', width: 110, render: (o: any) => <Tag>{proc.labels.AI_ORIGIN[o as keyof typeof proc.labels.AI_ORIGIN]}</Tag> },
            { title: 'Công cụ', dataIndex: 'tool', width: 120, render: (t: string, r: any) => <span>{t} {r.model && <Typography.Text type="secondary">({r.model})</Typography.Text>}</span> },
            { title: 'Mã prompt', dataIndex: 'promptId', width: 110, render: (p: string) => p ? <code>{p}</code> : '—' },
            { title: 'Mục đích dùng', dataIndex: 'purpose' },
            { title: 'Người ghi', dataIndex: 'byName', width: 140, render: (u: string, r: any) => <div>{u}<div><Typography.Text type="secondary" style={{ fontSize: 11 }}>{fmt(r.at)}</Typography.Text></div></div> },
            {
              title: 'Người duyệt',
              dataIndex: 'reviewerName',
              width: 140,
              render: (rv: string, r: any) => (rv ? <div>{rv}<div><Typography.Text type="secondary" style={{ fontSize: 11 }}>{fmt(r.reviewedAt)}</Typography.Text></div></div> : <Typography.Text type="warning">Chờ duyệt</Typography.Text>),
            },
            { title: 'Kết quả duyệt', dataIndex: 'result', width: 110, render: (res: any) => <Tag color={res === 'accepted' ? 'success' : res === 'rejected' ? 'error' : 'default'}>{proc.labels.AI_RESULT[res as keyof typeof proc.labels.AI_RESULT]}</Tag> },
          ]}
          locale={{ emptyText: 'Không ghi nhận lần sử dụng AI nào trong hạng mục này.' }}
          style={{ marginBottom: 28 }}
        />

        {/* 3. Bảng Kiểm soát Lỗi */}
        <Typography.Title level={4}>3. Bảng Theo dõi Bug & Tiêu chí Nghiệm thu Gate 4</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Tiêu chuẩn Gate 4: Không còn bất kỳ Bug nào ở mức độ S1 (Blocker) hoặc S2 (Critical) ở trạng thái mở.
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          dataSource={trackBugs}
          rowKey="id"
          columns={[
            { title: 'Mã bug', dataIndex: 'code', width: 95, render: (c: string) => <code>{c}</code> },
            { title: 'Mức độ', dataIndex: 'severity', width: 110, render: (s: any) => <Tag color={BUG_SEVERITY_COLOR[s as keyof typeof BUG_SEVERITY_COLOR]}>{proc.labels.BUG_SEVERITY[s as keyof typeof proc.labels.BUG_SEVERITY]}</Tag> },
            { title: 'Tiêu đề bug', dataIndex: 'title' },
            { title: 'Bước', dataIndex: 'step', width: 75, render: (s: string) => <Tag>{s}</Tag> },
            { title: 'Người báo', dataIndex: 'foundByName', width: 130 },
            { title: 'Người xử lý', dataIndex: 'fixByName', width: 130, render: (u: string) => u || '—' },
            { title: 'Trạng thái', dataIndex: 'status', width: 110, render: (st: any) => <Tag color={BUG_STATUS_COLOR[st as keyof typeof BUG_STATUS_COLOR]}>{proc.labels.BUG_STATUS[st as keyof typeof proc.labels.BUG_STATUS]}</Tag> },
            { title: 'Thời gian đóng', dataIndex: 'closedAt', width: 150, render: (ca: string) => ca ? fmt(ca) : '—' },
          ]}
          locale={{ emptyText: 'Không có bug nào được ghi nhận.' }}
          style={{ marginBottom: 28 }}
        />

        {/* 4. Danh mục tài liệu đầu ra */}
        <Typography.Title level={4}>4. Danh mục Tài liệu Đầu ra (Deliverables Registry)</Typography.Title>
        <Table
          size="small"
          pagination={false}
          dataSource={trackDocs}
          rowKey="id"
          columns={[
            { title: 'Bước', dataIndex: 'step', width: 75, render: (s: string) => <Tag>{s}</Tag> },
            { title: 'Tài liệu', dataIndex: 'label', render: (l: string) => <b>{l}</b> },
            { title: 'Loại', dataIndex: 'file', width: 110, render: (f: any) => (f ? <Tag color="blue">File .md</Tag> : <Tag>Link Git</Tag>) },
            {
              title: 'Đường dẫn / File',
              render: (_: any, d: any) =>
                d.url ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer"><code>{d.url}</code></a>
                ) : d.file ? (
                  <code>{d.file.name}</code>
                ) : '—',
            },
            { title: 'Đính kèm bởi', dataIndex: 'byName', width: 150 },
            { title: 'Thời gian', dataIndex: 'at', width: 150, render: (at: string) => fmt(at) },
          ]}
          locale={{ emptyText: 'Chưa có tài liệu nào được đính kèm.' }}
          style={{ marginBottom: 28 }}
        />

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, padding: '0 32px', textAlign: 'center' }}>
          <div>
            <Typography.Text strong>ĐẠI DIỆN QUẢN LÝ DỰ ÁN (PM)</Typography.Text>
            <div style={{ height: 60 }} />
            <Typography.Text type="secondary">(Ký và ghi rõ họ tên)</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>ĐẠI DIỆN KỸ THUẬT (TECH LEAD)</Typography.Text>
            <div style={{ height: 60 }} />
            <Typography.Text type="secondary">(Ký và ghi rõ họ tên)</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>CHỦ SẢN PHẨM / KHÁCH HÀNG (PO)</Typography.Text>
            <div style={{ height: 60 }} />
            <Typography.Text type="secondary">(Ký và ghi rõ họ tên)</Typography.Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

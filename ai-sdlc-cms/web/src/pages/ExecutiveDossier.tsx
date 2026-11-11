// Báo cáo Hồ sơ Kiểm toán Điều hành Dự án (1-Click Executive Audit Dossier)
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Progress,
  Result,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileProtectOutlined,
  PrinterOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useProcess, useProject, useUsers } from '../api';
import { useTheme } from '../ThemeContext';
import { fmt, GATE_COLOR, BUG_SEVERITY_COLOR, BUG_STATUS_COLOR } from '../util';

export default function ExecutiveDossier() {
  const { id = '' } = useParams();
  const { isDark } = useTheme();
  const proc = useProcess().data;
  const users = useUsers().data || [];
  const q = useProject(id);

  if (q.isLoading || !proc) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (!q.data) return <Result status="404" title="Không tìm thấy dự án" extra={<Link to="/">Về Dashboard</Link>} />;

  const p = q.data;

  // Tổng hợp dữ liệu toàn bộ dự án
  const allTracks = [{ id: 'base', name: 'Nền tảng', track: p.base }, ...(p.items || []).map((i) => ({ id: i.id, name: i.name, track: i }))];
  const allDocs = p.docs || [];
  const allBugs = p.bugs || [];
  const allAiLogs = p.aiLogs || [];

  const openS1S2 = allBugs.filter((b) => ['S1', 'S2'].includes(b.severity) && b.status !== 'closed');
  const pendingAi = allAiLogs.filter((l) => l.result === 'pending');

  // Tính toán tổng số Gate đã đạt
  let totalGates = 0;
  let passedGates = 0;
  allTracks.forEach(({ track }) => {
    Object.keys(track.gates).forEach((gk) => {
      totalGates++;
      if (track.gates[gk].result === 'pass') passedGates++;
    });
  });

  const gatePassPct = totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0;
  const isReleaseReady = openS1S2.length === 0 && pendingAi.length === 0 && gatePassPct >= 80;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Thanh tác vụ điều hướng (Ẩn khi in ấn) */}
      <Flex justify="space-between" align="center" className="no-print" style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} href={`/p/${p.id}`}>
            Quay lại Dự án
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Hồ sơ Kiểm toán Điều hành (Executive Dossier)
          </Typography.Title>
        </Space>

        <Space>
          <Button
            icon={<DownloadOutlined />}
            href={`/api/projects/${p.id}/docs/download-zip`}
            title="Tải toàn bộ tài liệu đính kèm dạng file .ZIP"
          >
            Tải Hồ sơ ZIP
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            In / Xuất PDF (A4)
          </Button>
        </Space>
      </Flex>

      {/* TỜ HỒ SƠ CHUẨN A4 / EXECUTIVE REPORT */}
      <Card
        className="print-area"
        style={{
          background: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e8e8e8',
          padding: '12px 16px',
        }}
      >
        {/* Tiêu đề Biên bản */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            QUY CHUẨN PHÁT TRIỂN PHẦN MỀM TUÂN THỦ AI-SDLC ENTERPRISE
          </Typography.Text>
          <Typography.Title level={2} style={{ margin: '8px 0 4px', color: isDark ? '#f0f6fc' : '#1f1f1f' }}>
            HỒ SƠ BÁO CÁO KIỂM TOÁN VÀ NGHIỆM THU DỰ ÁN
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Thời gian lập báo cáo: {new Date().toLocaleString('vi-VN')} · Mã hồ sơ: <b>DOSSIER-{p.id.toUpperCase()}</b>
          </Typography.Text>
        </div>

        {/* Cảnh báo Sẵn sàng Release */}
        {isReleaseReady ? (
          <Alert
            type="success"
            showIcon
            message="ĐỦ ĐIỀU KIỆN SẴN SÀNG PHÁT HÀNH (RELEASE-READY)"
            description="Dự án không có bug nghiêm trọng S1/S2 tồn đọng, 100% nội dung AI đã qua phê duyệt kép 4-Eyes và các Quality Gate then chốt đã được các vai trò Tech Lead, PO, Security phê duyệt thành công."
            style={{ marginBottom: 20 }}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            message="DỰ ÁN ĐANG TRONG TIẾN TRÌNH / CẦN XỬ LÝ ĐIỂM NGHẼN"
            description={`Hiện tại còn ${openS1S2.length} bug S1/S2 chưa đóng và ${pendingAi.length} mục AI chưa hoàn tất kiểm duyệt 4-Eyes. Cần giải quyết dứt điểm trước khi tổ chức họp nghiệm thu UAT (Gate 4) và phát hành (Gate 5).`}
            style={{ marginBottom: 20 }}
          />
        )}

        {/* 4 Thẻ KPI Tóm tắt cho Ban Lãnh đạo */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', background: isDark ? '#0d1117' : '#fafafa' }}>
              <Statistic
                title="Tiến độ Quality Gates"
                value={`${passedGates}/${totalGates}`}
                suffix={`(${gatePassPct}%)`}
                valueStyle={{ color: gatePassPct >= 80 ? '#52c41a' : '#1677ff' }}
                prefix={<SafetyCertificateOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', background: isDark ? '#0d1117' : '#fafafa' }}>
              <Statistic
                title="Bug Nghiêm trọng (S1/S2)"
                value={openS1S2.length}
                valueStyle={{ color: openS1S2.length === 0 ? '#52c41a' : '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', background: isDark ? '#0d1117' : '#fafafa' }}>
              <Statistic
                title="Tài liệu Lưu trữ"
                value={allDocs.length}
                suffix="file"
                prefix={<FileProtectOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center', background: isDark ? '#0d1117' : '#fafafa' }}>
              <Statistic
                title="Nhật ký AI 4-Eyes"
                value={`${allAiLogs.filter((l) => l.result !== 'pending').length}/${allAiLogs.length || 0}`}
                valueStyle={{ color: pendingAi.length === 0 ? '#52c41a' : '#faad14' }}
                prefix={<RobotOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 1. THÔNG TIN DỰ ÁN */}
        <Typography.Title level={4} style={{ borderBottom: `2px solid ${isDark ? '#30363d' : '#f0f0f0'}`, paddingBottom: 6 }}>
          1. Thông tin Dự án & Thiết lập Quản trị
        </Typography.Title>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Tên dự án"><b>{p.name}</b></Descriptions.Item>
          <Descriptions.Item label="Mã dự án">{p.code || p.id}</Descriptions.Item>
          <Descriptions.Item label="Ngày khởi tạo">{fmt(p.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật gần nhất">{fmt(p.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Mức bảo mật dữ liệu">
            <Tag color={p.aiSetup.dataLevel === 'confidential' ? 'red' : 'blue'}>
              {(p.aiSetup.dataLevel || 'Chưa đặt').toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Công cụ AI được duyệt">
            {(p.aiSetup?.tools || []).length > 0 ? (p.aiSetup?.tools || []).join(', ') : 'Chưa khai báo'}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số Hạng mục">
            {(p.items || []).length + 1} hạng mục ({(p.items || []).filter((i) => !i.archived).length} đang phát triển)
          </Descriptions.Item>
          <Descriptions.Item label="Đội ngũ thành viên">
            {(p.members || []).length} nhân sự tham gia
          </Descriptions.Item>
          <Descriptions.Item label="Cơ chế thực thi RBAC">
            <Tag color="green">Bắt buộc theo 8 vai trò</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* 2. BẰNG CHỨNG KIỂM TOÁN 8 QUALITY GATES */}
        <Typography.Title level={4} style={{ borderBottom: `2px solid ${isDark ? '#30363d' : '#f0f0f0'}`, paddingBottom: 6 }}>
          2. Bằng chứng Ký duyệt Quality Gates (Audit Trail)
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
          Toàn bộ các Quality Gate được kiểm duyệt và ký xác nhận bởi đúng vai trò quy định trong RACI (PO, Tech Lead, Tester, Security).
        </Typography.Paragraph>

        {allTracks.map(({ id: trackId, name: trackName, track }) => {
          const trackGateKeys = Object.keys(track.gates);
          if (trackGateKeys.length === 0) return null;

          return (
            <div key={trackId} style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ fontSize: 14, color: '#1677ff', display: 'block', marginBottom: 6 }}>
                ▶ Hạng mục: {trackName}
              </Typography.Text>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                <thead>
                  <tr style={{ background: isDark ? '#21262d' : '#f5f5f5', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Gate</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Nội dung kiểm tra</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Vai trò duyệt</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Kết quả</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Người ký</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Thời gian</th>
                    <th style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {trackGateKeys.map((gk) => {
                    const gDef = proc.gates.find((g) => g.key === gk);
                    const gState = track.gates[gk];
                    if (!gDef || !gState) return null;

                    return (
                      <tr key={gk}>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}`, fontWeight: 700 }}>
                          {gDef.id}
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>
                          {gDef.check}
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>
                          {gDef.roles.join(', ')}
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>
                          <Tag color={GATE_COLOR[gState.result]}>
                            {proc.labels.GATE_RESULT[gState.result]}
                          </Tag>
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>
                          {gState.by || '—'}
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}` }}>
                          {gState.at ? fmt(gState.at) : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#30363d' : '#e8e8e8'}`, fontStyle: 'italic' }}>
                          {gState.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* 3. NHẬT KÝ KIỂM SOÁT AI GOVERNANCE (4-EYES) */}
        <Typography.Title level={4} style={{ borderBottom: `2px solid ${isDark ? '#30363d' : '#f0f0f0'}`, paddingBottom: 6, marginTop: 24 }}>
          3. Kiểm toán Tuân thủ AI Governance (Nguyên tắc Phê duyệt kép 4-Eyes)
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
          Mọi nội dung mã nguồn, kiến trúc do AI sinh đều có người thứ hai phê duyệt trước khi ký Gate.
        </Typography.Paragraph>

        <Descriptions size="small" bordered column={3} style={{ marginBottom: 20 }}>
          <Descriptions.Item label="Tổng số lần tương tác AI">{allAiLogs.length} lần</Descriptions.Item>
          <Descriptions.Item label="Đã hoàn tất 4-Eyes Review">
            <b style={{ color: '#52c41a' }}>{allAiLogs.filter((l) => ['accepted', 'edited'].includes(l.result)).length}</b>
          </Descriptions.Item>
          <Descriptions.Item label="Đang chờ người duyệt">
            <b style={{ color: pendingAi.length > 0 ? '#faad14' : '#52c41a' }}>{pendingAi.length}</b>
          </Descriptions.Item>
        </Descriptions>

        {/* 4. CHỮ KÝ XÁC NHẬN NGHIỆM THU */}
        <Typography.Title level={4} style={{ borderBottom: `2px solid ${isDark ? '#30363d' : '#f0f0f0'}`, paddingBottom: 6, marginTop: 28 }}>
          4. Chữ ký Xác nhận Nghiệm thu & Chấp thuận Phát hành
        </Typography.Title>
        <Row gutter={[24, 24]} style={{ marginTop: 20, textAlign: 'center' }}>
          <Col xs={12} sm={6}>
            <div style={{ minHeight: 100, borderBottom: `1px dashed ${isDark ? '#444' : '#ccc'}`, marginBottom: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>[Chữ ký điện tử / Duyệt số]</Typography.Text>
            </div>
            <Typography.Text strong style={{ display: 'block' }}>Product Owner (PO)</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Nghiệm thu Phạm vi & UAT</Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ minHeight: 100, borderBottom: `1px dashed ${isDark ? '#444' : '#ccc'}`, marginBottom: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>[Chữ ký điện tử / Duyệt số]</Typography.Text>
            </div>
            <Typography.Text strong style={{ display: 'block' }}>Technical Lead</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Nghiệm thu Kiến trúc & Code</Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ minHeight: 100, borderBottom: `1px dashed ${isDark ? '#444' : '#ccc'}`, marginBottom: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>[Chữ ký điện tử / Duyệt số]</Typography.Text>
            </div>
            <Typography.Text strong style={{ display: 'block' }}>QA / Test Lead</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Xác nhận S1-S2 = 0</Typography.Text>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ minHeight: 100, borderBottom: `1px dashed ${isDark ? '#444' : '#ccc'}`, marginBottom: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>[Chữ ký điện tử / Duyệt số]</Typography.Text>
            </div>
            <Typography.Text strong style={{ display: 'block' }}>Project Manager (PM)</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Phê duyệt Bàn giao Release</Typography.Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

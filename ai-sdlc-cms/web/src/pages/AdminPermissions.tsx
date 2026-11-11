// Trang Quản lý Phân quyền & Vai trò (RBAC / RACI)
// 1. Phân quyền theo dự án: chọn dự án, thêm/gỡ thành viên, gán vai trò RACI, lưu cấu hình.
// 2. Thư mục tài khoản & vai trò: xem tất cả tài khoản, dự án tham gia, vai trò đảm nhiệm.
// 3. Ma trận Phân quyền RACI: hướng dẫn chi tiết quyền hạn hệ thống, hành động và Quality Gates.
import { useMemo, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import {
  CheckCircleOutlined,
  CrownOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { api, useProcess, useProjects, useUsers } from '../api';
import { PageHeader, showTotal } from '../components';
import type { Member, Process, Project, Role, User } from '../types';
import { fold } from '../util';

export default function AdminPermissions() {
  const { user: me } = useOutletContext<{ user: User }>();
  const { message } = App.useApp();
  const qc = useQueryClient();

  const projects = useProjects();
  const users = useUsers();
  const procQuery = useProcess();
  const proc = procQuery.data;

  // Tab 1: Quản lý theo Dự án
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [editingMembers, setEditingMembers] = useState<Record<string, Member[]>>({});
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);

  // Tab 2: Lọc thư mục người dùng
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  const projectList = useMemo(() => {
    return [...(projects.data || [])].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [projects.data]);

  // Dự án đang chọn (mặc định lấy dự án đầu tiên nếu chưa chọn)
  const currentProject = useMemo(() => {
    if (!projectList.length) return null;
    if (selectedProjectId) {
      return projectList.find((p) => p.id === selectedProjectId) || projectList[0];
    }
    return projectList[0];
  }, [projectList, selectedProjectId]);

  // Khởi tạo/lấy danh sách thành viên đang chỉnh sửa của dự án
  const currentMembers: Member[] = useMemo(() => {
    if (!currentProject) return [];
    if (editingMembers[currentProject.id]) {
      return editingMembers[currentProject.id];
    }
    return currentProject.members || [];
  }, [currentProject, editingMembers]);

  const updateMembersForCurrentProject = (newMembers: Member[]) => {
    if (!currentProject) return;
    setEditingMembers((prev) => ({
      ...prev,
      [currentProject.id]: newMembers,
    }));
  };

  const handleSaveMembers = async () => {
    if (!currentProject) return;
    try {
      setSavingProjectId(currentProject.id);
      // Lọc bỏ thành viên không có vai trò nào
      const validMembers = currentMembers.filter((m) => m.roles.length > 0);
      await api<Project>('PUT', `/api/projects/${currentProject.id}/members`, { members: validMembers });
      message.success(`Đã lưu thành viên & vai trò cho dự án ${currentProject.name}`);
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', currentProject.id] });
      setEditingMembers((prev) => {
        const next = { ...prev };
        delete next[currentProject.id];
        return next;
      });
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSavingProjectId(null);
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalUsers = users.data?.length || 0;
    const adminCount = users.data?.filter((u) => u.admin).length || 0;
    const activeProjects = projectList.filter((p) => !p.archived);
    const privateProjects = activeProjects.filter((p) => p.visibility === 'private');
    const enforcedProjects = activeProjects.filter((p) => (p.members || []).length > 0);
    return { totalUsers, adminCount, activeProjects: activeProjects.length, privateProjects: privateProjects.length, enforcedProjects: enforcedProjects.length };
  }, [users.data, projectList]);

  // Tab 2: Tổng hợp dữ liệu thành viên & vai trò
  const userRoleRows = useMemo(() => {
    const list = users.data || [];
    const q = fold(userQuery.trim());
    return list
      .filter((u) => {
        if (userRoleFilter === 'admin' && !u.admin) return false;
        if (userRoleFilter === 'member' && u.admin) return false;
        if (q && !fold(`${u.username} ${u.name}`).includes(q)) return false;
        return true;
      })
      .map((u) => {
        const userProjects = (projects.data || []).filter((p) =>
          (p.members || []).some((m) => m.userId === u.id)
        ).map((p) => {
          const member = (p.members || []).find((m) => m.userId === u.id);
          return {
            projectId: p.id,
            projectName: p.name,
            projectCode: p.code,
            visibility: p.visibility,
            roles: member?.roles || [],
          };
        });

        return {
          ...u,
          projects: userProjects,
        };
      });
  }, [users.data, projects.data, userQuery, userRoleFilter]);

  if (!me.admin) {
    return (
      <>
        <PageHeader title="Phân quyền & Vai trò" />
        <Alert type="error" showIcon message="Chỉ Quản trị viên (Admin) mới có quyền truy cập khu vực này." />
      </>
    );
  }

  // Danh sách tài khoản có thể thêm vào dự án hiện tại
  const availableUsers = (users.data || []).filter(
    (u) => !u.disabled && !currentMembers.some((m) => m.userId === u.id)
  );

  return (
    <>
      <PageHeader
        title="Quản lý Phân quyền & Vai trò (RBAC / RACI)"
        crumbs={[{ title: 'Quản trị', to: '/admin' }, { title: 'Phân quyền & Vai trò' }]}
      />

      {/* Thẻ thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tài khoản Hệ thống"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>({stats.adminCount} Admin)</Typography.Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Dự án Hoạt động"
              value={stats.activeProjects}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Kiểm soát Vai trò (RACI)"
              value={stats.enforcedProjects}
              prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>/ {stats.activeProjects} dự án</Typography.Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Dự án Riêng tư (Private)"
              value={stats.privateProjects}
              prefix={<LockOutlined style={{ color: '#722ed1' }} />}
              suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>/ {stats.activeProjects} dự án</Typography.Text>}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        type="card"
        defaultActiveKey="by-project"
        items={[
          {
            key: 'by-project',
            label: <span><TeamOutlined /> Phân quyền theo Dự án</span>,
            children: (
              <Card>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
                  <Flex align="center" gap={12} wrap="wrap">
                    <Typography.Text strong>Chọn dự án cấu hình:</Typography.Text>
                    <Select
                      style={{ minWidth: 320 }}
                      value={currentProject?.id}
                      onChange={(id) => setSelectedProjectId(id)}
                      options={projectList.map((p) => ({
                        value: p.id,
                        label: (
                          <Flex justify="space-between" align="center">
                            <span>{p.name}</span>
                            <Space size={4}>
                              {p.visibility === 'private' ? <Tag color="purple" style={{ margin: 0 }}>🔒 Nội bộ</Tag> : <Tag style={{ margin: 0 }}>🌐 Public</Tag>}
                              {(p.members || []).length > 0 ? <Tag color="blue" style={{ margin: 0 }}>{(p.members || []).length} người</Tag> : <Tag color="default" style={{ margin: 0 }}>Tự do</Tag>}
                            </Space>
                          </Flex>
                        ),
                      }))}
                    />
                  </Flex>

                  {currentProject && (
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingProjectId === currentProject.id}
                      onClick={handleSaveMembers}
                    >
                      Lưu phân quyền dự án
                    </Button>
                  )}
                </Flex>

                {currentProject ? (
                  <>
                    <Card
                      type="inner"
                      title={
                        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                          <Space size="middle">
                            <span>{currentProject.name}</span>
                            {currentProject.code && <Tag>{currentProject.code}</Tag>}
                            {currentProject.visibility === 'private' ? (
                              <Tag icon={<LockOutlined />} color="purple">Dự án Nội bộ (Chỉ thành viên được gán mới thấy)</Tag>
                            ) : (
                              <Tag icon={<GlobalOutlined />} color="default">Dự án Công khai (Toàn bộ thành viên xem được)</Tag>
                            )}
                          </Space>
                          <Tag color={currentMembers.length > 0 ? 'success' : 'warning'}>
                            {currentMembers.length > 0 ? `Đang kiểm soát vai trò (${currentMembers.length} thành viên)` : 'Chưa kiểm soát (Mọi tài khoản ký được mọi gate)'}
                          </Tag>
                        </Flex>
                      }
                      style={{ marginBottom: 20 }}
                    >
                      <Table<Member>
                        rowKey="userId"
                        dataSource={currentMembers}
                        pagination={false}
                        locale={{ emptyText: 'Chưa có thành viên nào. Khi chưa có thành viên, mọi tài khoản đều ký được mọi Gate.' }}
                        columns={[
                          {
                            title: 'Thành viên',
                            key: 'user',
                            width: 260,
                            render: (_, m) => {
                              const u = (users.data || []).find((x) => x.id === m.userId);
                              return (
                                <Space direction="vertical" size={2}>
                                  <Space>
                                    <Typography.Text strong>{u?.name || '(Đã xoá)'}</Typography.Text>
                                    {u?.admin && <Tag color="blue" icon={<CrownOutlined />}>Admin</Tag>}
                                  </Space>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>@{u?.username}</Typography.Text>
                                </Space>
                              );
                            },
                          },
                          {
                            title: 'Vai trò RACI (Có thể kiêm nhiệm nhiều vai trò)',
                            key: 'roles',
                            render: (_, m) => (
                              <Select
                                mode="multiple"
                                style={{ width: '100%', minWidth: 320 }}
                                placeholder="Chọn vai trò (PM, PO, TechLead, Dev, Test...)"
                                value={m.roles}
                                options={(proc?.roles || []).map((r) => ({
                                  value: r.key,
                                  label: `${r.label} (${r.key})`,
                                }))}
                                onChange={(roles: Role[]) => {
                                  const updated = currentMembers.map((item) =>
                                    item.userId === m.userId ? { ...item, roles } : item
                                  );
                                  updateMembersForCurrentProject(updated);
                                }}
                              />
                            ),
                          },
                          {
                            title: 'Thao tác',
                            key: 'actions',
                            width: 100,
                            render: (_, m) => (
                              <Button
                                type="link"
                                danger
                                onClick={() => {
                                  const updated = currentMembers.filter((item) => item.userId !== m.userId);
                                  updateMembersForCurrentProject(updated);
                                }}
                              >
                                Gỡ bỏ
                              </Button>
                            ),
                          },
                        ]}
                      />

                      <Flex gap={12} align="center" wrap="wrap" style={{ marginTop: 16 }}>
                        <Select
                          showSearch
                          style={{ width: 320 }}
                          placeholder="+ Thêm thành viên vào dự án..."
                          value={null}
                          optionFilterProp="label"
                          options={availableUsers.map((u) => ({
                            value: u.id,
                            label: `${u.name} (@${u.username})`,
                          }))}
                          onChange={(userId: string) => {
                            if (!userId) return;
                            updateMembersForCurrentProject([...currentMembers, { userId, roles: [] }]);
                          }}
                        />
                        <Typography.Text type="secondary">
                          * Lưu ý: Thành viên không được gán bất kỳ vai trò nào sẽ tự động bị bỏ khi lưu.
                        </Typography.Text>
                      </Flex>
                    </Card>

                    {/* Bảng phân công ký Quality Gate của dự án */}
                    {proc?.gates && (
                      <Card type="inner" title="📋 Ma trận Thẩm quyền Ký Quality Gate (Theo Quy trình SDLC)">
                        <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                          {proc.gates.map((g) => {
                            const qualifiedUsers = (users.data || []).filter((u) =>
                              currentMembers.some((m) => m.userId === u.id && m.roles.some((r) => g.roles.includes(r)))
                            );

                            return (
                              <Descriptions.Item key={g.key} label={<b>{g.id} · {g.at}</b>}>
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                  <Space wrap size={4}>
                                    {g.roles.map((r) => (
                                      <Tag key={r} color="geekblue">{proc.roles.find((x) => x.key === r)?.label || r}</Tag>
                                    ))}
                                  </Space>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    Người đủ thẩm quyền:{' '}
                                    {qualifiedUsers.length > 0 ? (
                                      qualifiedUsers.map((u) => u.name).join(', ')
                                    ) : (
                                      <Typography.Text type="warning">Chưa có ai (chỉ Admin ký được)</Typography.Text>
                                    )}
                                  </Typography.Text>
                                </Space>
                              </Descriptions.Item>
                            );
                          })}
                        </Descriptions>
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert message="Chưa có dự án nào trong hệ thống." type="info" />
                )}
              </Card>
            ),
          },
          {
            key: 'directory',
            label: <span><UserOutlined /> Thư mục Người dùng & Vai trò</span>,
            children: (
              <Card>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
                  <Space wrap size="middle">
                    <Input.Search
                      placeholder="Tìm theo tên đăng nhập hoặc họ tên..."
                      allowClear
                      style={{ width: 280 }}
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                    />
                    <Select
                      value={userRoleFilter}
                      onChange={(v) => setUserRoleFilter(v)}
                      style={{ width: 160 }}
                      options={[
                        { value: 'all', label: 'Tất cả tài khoản' },
                        { value: 'admin', label: 'Chỉ Admin' },
                        { value: 'member', label: 'Chỉ Thành viên' },
                      ]}
                    />
                  </Space>
                  <Typography.Text type="secondary">
                    Tổng cộng: <b>{userRoleRows.length}</b> tài khoản
                  </Typography.Text>
                </Flex>

                <Table
                  rowKey="id"
                  dataSource={userRoleRows}
                  pagination={{ defaultPageSize: 15, showSizeChanger: true, showTotal: showTotal('tài khoản') }}
                  columns={[
                    {
                      title: 'Tài khoản',
                      key: 'account',
                      width: 220,
                      render: (_, u) => (
                        <Space direction="vertical" size={2}>
                          <Space>
                            <Typography.Text strong>{u.name}</Typography.Text>
                            {u.disabled && <Tag color="error">Đã khoá</Tag>}
                          </Space>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>@{u.username}</Typography.Text>
                        </Space>
                      ),
                    },
                    {
                      title: 'Quyền hệ thống',
                      key: 'sysRole',
                      width: 140,
                      render: (_, u) => (
                        u.admin ? <Tag color="blue" icon={<CrownOutlined />}>Admin</Tag> : <Tag>Thành viên</Tag>
                      ),
                    },
                    {
                      title: 'Dự án đang tham gia & Vai trò cụ thể',
                      key: 'projects',
                      render: (_, u) => {
                        if (!u.projects.length) {
                          return <Typography.Text type="secondary">Chưa tham gia dự án nào</Typography.Text>;
                        }
                        return (
                          <Space wrap size={[8, 8]}>
                            {u.projects.map((p) => (
                              <Tag
                                key={p.projectId}
                                color={p.visibility === 'private' ? 'purple' : 'default'}
                                style={{ padding: '3px 8px', fontSize: 13 }}
                              >
                                <b>{p.projectName}</b>:{' '}
                                {p.roles.length > 0 ? (
                                  p.roles.map((r) => proc?.roles.find((x) => x.key === r)?.label || r).join(', ')
                                ) : (
                                  <i style={{ color: '#faad14' }}>Chưa gán vai trò</i>
                                )}
                              </Tag>
                            ))}
                          </Space>
                        );
                      },
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      width: 120,
                      render: (_, u) => (
                        <Link to={`/admin`}>Quản trị TK</Link>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'matrix-guide',
            label: <span><SafetyCertificateOutlined /> Quy chuẩn Ma trận Phân quyền</span>,
            children: (
              <Card>
                <Typography.Title level={4}>Nguyên tắc Phân quyền Thực tế (Pragmatic RBAC)</Typography.Title>
                <Typography.Paragraph type="secondary">
                  Hệ thống phân quyền được thiết kế 3 cấp nhằm đảm bảo an toàn nghiệp vụ, tránh làm phiền người dùng và kiểm soát chặt chẽ các Quality Gate theo quy trình AI-SDLC.
                </Typography.Paragraph>

                <Divider orientation="left">1. Ma trận Hành động & Thao tác (Action Authorization)</Divider>
                <Table
                  size="small"
                  pagination={false}
                  bordered
                  dataSource={[
                    {
                      action: 'Xem dự án & tài liệu',
                      scope: 'Dự án Public hoặc Private',
                      permission: 'Admin, hoặc Thành viên thuộc p.members',
                      denied: 'Trả về 404 Không tìm thấy (để không lộ dự án Private)',
                    },
                    {
                      action: 'Cấu hình Dự án & Thiết lập AI (B2)',
                      scope: 'Toàn dự án',
                      permission: 'Admin, hoặc vai trò PM / TechLead trong dự án',
                      denied: 'Trả về 403 (Nút Lưu bị disabled kèm giải thích)',
                    },
                    {
                      action: 'Quản lý Thành viên & Vai trò',
                      scope: 'Toàn dự án',
                      permission: 'Admin, hoặc vai trò PM trong dự án',
                      denied: 'Trả về 403 (Chỉ xem danh sách, không chỉnh sửa)',
                    },
                    {
                      action: 'Tạo / Sửa / Lưu trữ Hạng mục',
                      scope: 'Hạng mục (Feature, CR, Fast)',
                      permission: 'Admin, hoặc vai trò PM / PO trong dự án (Dự án chưa khai báo thì mở)',
                      denied: 'Nút Tạo/Sửa bị disabled kèm tooltip giải thích',
                    },
                    {
                      action: 'Cập nhật Tiến độ bước & Checklist',
                      scope: 'Bước thực hiện (B1-B5)',
                      permission: 'Admin, PM, TechLead, hoặc Người được giao (Step Owners)',
                      denied: 'Form và Checklist chuyển sang chế độ Xem (Read-only)',
                    },
                    {
                      action: 'Nhận việc ("Giao cho tôi")',
                      scope: 'Bước chưa có người nhận',
                      permission: 'Bất kỳ thành viên nào trong dự án',
                      denied: 'Chỉ nhận được khi bước chưa có ai phụ trách',
                    },
                    {
                      action: 'Ký duyệt Quality Gate',
                      scope: 'Gate 1 đến Gate 5',
                      permission: 'Admin, hoặc Đúng vai trò RACI quy định tại Cổng đó',
                      denied: 'Nút ký bị khóa kèm thông báo vai trò còn thiếu',
                    },
                    {
                      action: 'Duyệt Human Gate (Mục AI)',
                      scope: 'Nhật ký dùng AI',
                      permission: 'Thành viên dự án KHÁC người tạo mục AI đó (Nguyên tắc 4 mắt)',
                      denied: 'Không được tự duyệt cho chính nội dung mình tạo',
                    },
                  ]}
                  columns={[
                    { title: 'Thao tác nghiệp vụ', dataIndex: 'action', key: 'action', width: 220, render: (v) => <b>{v}</b> },
                    { title: 'Phạm vi', dataIndex: 'scope', key: 'scope', width: 180 },
                    { title: 'Đối tượng được phép', dataIndex: 'permission', key: 'permission', render: (v) => <Tag color="green">{v}</Tag> },
                    { title: 'Cách thức chặn khi không đủ quyền', dataIndex: 'denied', key: 'denied', render: (v) => <Typography.Text type="secondary">{v}</Typography.Text> },
                  ]}
                />

                <Divider orientation="left" style={{ marginTop: 28 }}>2. Ma trận Phê duyệt Quality Gates (RACI Standard)</Divider>
                <Table
                  size="small"
                  pagination={false}
                  bordered
                  dataSource={proc?.gates || []}
                  columns={[
                    { title: 'Mã Gate', dataIndex: 'id', key: 'id', width: 90, render: (v) => <Tag color="blue">{v}</Tag> },
                    { title: 'Tại bước', dataIndex: 'at', key: 'at', width: 100 },
                    { title: 'Nội dung kiểm tra', dataIndex: 'check', key: 'check' },
                    {
                      title: 'Vai trò RACI chịu trách nhiệm ký duyệt',
                      key: 'roles',
                      render: (_, g) => (
                        <Space wrap>
                          {g.roles.map((r) => (
                            <Tag key={r} color="geekblue">{proc?.roles.find((x) => x.key === r)?.label || r}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}

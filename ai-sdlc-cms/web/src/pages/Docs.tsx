// Trang Tài liệu: mọi tài liệu của dự án ở một chỗ — lọc theo hạng mục / bước / phạm vi / loại, xem mọi định dạng in-app, sửa .md, xuất Word/PDF, tạo mới hoặc tải lên
import { useMemo, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  type TableColumnsType,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  FileWordOutlined,
  InboxOutlined,
  LinkOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { api, useProcess, useProject, useProjectMutation } from '../api';
import { Field, FilterBar, options, PageHeader, showTotal } from '../components';
import { canViewInApp, DocTypeTag, getDocKind, isMd, type DocKind } from '../docUtil';
import { useDocViewer } from '../UniversalDocViewer';
import { useTheme } from '../ThemeContext';
import type { Doc, Project, Scope } from '../types';
import { fmt, fold, SCOPE_LABEL } from '../util';

interface DocRow extends Doc {
  trackName: string;
  tplTitle: string;
  scope: Scope | '';
  docKind: DocKind;
}

interface Filters {
  q: string;
  scope?: Scope;
  track?: string;
  step?: string;
  kind?: DocKind;
}

export default function DocsPage() {
  const { id = '' } = useParams();
  const { message } = App.useApp();
  const proc = useProcess().data;
  const q = useProject(id);
  const viewer = useDocViewer(id);
  const del = useProjectMutation((docId: string) => api<Project>('DELETE', `/api/projects/${id}/docs/${docId}`));
  const createDoc = useProjectMutation((data: { track: string; step: string; templateId?: string; label: string; content: string }) =>
    api<Project>('POST', `/api/projects/${id}/docs/create`, data),
  );
  const uploadDoc = useProjectMutation((fd: FormData) => api<Project>('POST', `/api/projects/${id}/docs`, fd));
  const batchDelete = useProjectMutation((ids: string[]) =>
    api<Project>('POST', `/api/projects/${id}/docs/batch-delete`, { ids })
  );

  const { isDark } = useTheme();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [f, setF] = useState<Filters>({ q: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'write' | 'upload'>('write');
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const wordFileRef = useRef<HTMLInputElement>(null);

  const p = q.data;

  const rows = useMemo<DocRow[]>(() => {
    if (!p || !proc) return [];
    const tpl = Object.fromEntries(proc.steps.flatMap((s) => s.templates).map((x) => [x.id, x]));
    const trackName = (t: string) => (t === 'base' ? 'Nền tảng' : p.items.find((i) => i.id === t)?.name || '(đã xoá)');
    const term = fold(f.q.trim());
    return p.docs
      .map((d): DocRow => ({
        ...d,
        trackName: trackName(d.track),
        tplTitle: tpl[d.templateId]?.title || '',
        scope: tpl[d.templateId]?.scope || '',
        docKind: getDocKind(d),
      }))
      .filter((d) => (!term || fold(`${d.label} ${d.file?.name || ''} ${d.url}`).includes(term))
        && (!f.scope || d.scope === f.scope)
        && (!f.track || d.track === f.track)
        && (!f.step || d.step === f.step)
        && (!f.kind || d.docKind === f.kind));
  }, [p, proc, f]);

  const handleConvertWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      message.error('Chỉ hỗ trợ file Word định dạng .docx');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setConverting(true);
    try {
      const res = await api<{ markdown: string; filename: string; warnings: string[] }>('POST', `/api/projects/${id}/docs/convert-docx`, fd);
      createForm.setFieldsValue({
        content: res.markdown,
        label: createForm.getFieldValue('label') || file.name.replace(/\.docx$/i, ''),
      });
      message.success(`Đã chuyển đổi "${file.name}" sang Markdown thành công!`);
    } catch (err: any) {
      message.error(err.message || 'Không thể đọc file Word');
    } finally {
      setConverting(false);
      if (wordFileRef.current) wordFileRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (values: any) => {
    if (!selectedFile && !values.url) {
      message.error('Vui lòng chọn file tải lên hoặc nhập link tài liệu');
      return;
    }
    const fd = new FormData();
    fd.append('track', values.track);
    fd.append('step', values.step);
    if (values.templateId) fd.append('templateId', values.templateId);
    if (values.label) fd.append('label', values.label);
    if (values.url) fd.append('url', values.url);
    if (selectedFile) fd.append('file', selectedFile);

    uploadDoc.mutate(fd, {
      onSuccess: () => {
        message.success('Đã tải lên tài liệu thành công!');
        setCreateOpen(false);
        uploadForm.resetFields();
        setSelectedFile(null);
      },
      onError: (err) => message.error(err.message),
    });
  };

  if (!p || !proc) return null;

  const columns: TableColumnsType<DocRow> = [
    {
      title: 'Tài liệu',
      dataIndex: 'label',
      sorter: (a, b) => a.label.localeCompare(b.label, 'vi'),
      render: (_, d) => (
        <Space direction="vertical" size={2}>
          <Space wrap size={6}>
            {canViewInApp(d) ? (
              <a onClick={() => viewer.open(d)} style={{ fontWeight: 500 }}>
                {d.label}
              </a>
            ) : d.file ? (
              <a href={`/api/projects/${id}/files/${d.id}`} style={{ fontWeight: 500 }}>
                {d.label}
              </a>
            ) : (
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
                {d.label}
              </a>
            )}
            {Boolean(d.revisions?.length) && <Tag color="blue">v{(d.revisions?.length || 0) + 1}</Tag>}
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {d.file ? d.file.name : d.url}
          </Typography.Text>
        </Space>
      ),
    },
    { title: 'Biểu mẫu', dataIndex: 'tplTitle', render: (v) => v || '—' },
    { title: 'Phạm vi', dataIndex: 'scope', render: (_, d) => (d.scope ? <Tag>{SCOPE_LABEL[d.scope]}</Tag> : '—') },
    { title: 'Hạng mục', dataIndex: 'track', render: (_, d) => <Link to={`/p/${id}/t/${d.track}#${d.step}`}>{d.trackName}</Link> },
    { title: 'Bước', dataIndex: 'step' },
    {
      title: 'Định dạng',
      dataIndex: 'docKind',
      render: (_, d) => <DocTypeTag doc={d} />,
    },
    {
      title: 'Dung lượng',
      key: 'size',
      render: (_, d) => {
        if (!d.file?.size) return '—';
        if (d.file.size > 1024 * 1024) return `${(d.file.size / 1024 / 1024).toFixed(2)} MB`;
        return `${(d.file.size / 1024).toFixed(1)} KB`;
      },
    },
    { title: 'Người thêm', dataIndex: 'byName' },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'at',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.at.localeCompare(b.at),
      render: (v) => fmt(v),
    },
    {
      title: 'Thao tác',
      key: 'op',
      fixed: 'right',
      render: (_, d) => (
        <Space size={8}>
          {canViewInApp(d) && (
            <a onClick={() => viewer.open(d)} title="Xem trực tiếp trong CMS">
              <EyeOutlined /> Xem
            </a>
          )}
          {d.file ? (
            <a href={`/api/projects/${id}/files/${d.id}`} title="Tải file gốc">
              <DownloadOutlined /> Tải
            </a>
          ) : (
            <a href={d.url} target="_blank" rel="noopener noreferrer">
              <LinkOutlined /> Mở
            </a>
          )}
          <Popconfirm
            title="Xoá tài liệu này?"
            description="Không khôi phục được."
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={() => del.mutate(d.id, { onSuccess: () => message.success('Đã xoá tài liệu'), onError: (e) => message.error(e.message) })}
          >
            <a style={{ color: '#a8071a' }}>Xoá</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Tài liệu — ${p.name}`}
        crumbs={[{ title: 'Dự án' }, { title: p.name, to: `/p/${id}` }, { title: 'Tài liệu' }]}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              href={`/api/projects/${id}/docs/download-zip`}
              title="Tải nén toàn bộ tài liệu dự án phân theo 5 giai đoạn"
            >
              Tải toàn bộ (.ZIP)
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Thêm / Soạn tài liệu
            </Button>
          </Space>
        }
      />
      <FilterBar onReset={() => setF({ q: '' })}>
        <Field label="Tìm kiếm" width={240}>
          <Input.Search
            allowClear
            placeholder="Tên tài liệu hoặc tên file"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
          />
        </Field>
        <Field label="Phạm vi">
          <Select
            allowClear
            placeholder="Tất cả"
            value={f.scope}
            onChange={(scope) => setF({ ...f, scope })}
            options={options(SCOPE_LABEL)}
          />
        </Field>
        <Field label="Hạng mục">
          <Select
            allowClear
            placeholder="Tất cả"
            value={f.track}
            onChange={(track) => setF({ ...f, track })}
            options={[{ value: 'base', label: 'Nền tảng' }, ...(p.items || []).map((i) => ({ value: i.id, label: i.name }))]}
          />
        </Field>
        <Field label="Bước">
          <Select
            allowClear
            placeholder="Tất cả"
            value={f.step}
            onChange={(step) => setF({ ...f, step })}
            options={proc.steps.map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
          />
        </Field>
        <Field label="Định dạng" width={160}>
          <Select
            allowClear
            placeholder="Tất cả định dạng"
            value={f.kind}
            onChange={(kind) => setF({ ...f, kind })}
            options={[
              { value: 'md', label: 'Markdown (.md)' },
              { value: 'docx', label: 'Word (.docx)' },
              { value: 'pdf', label: 'PDF (.pdf)' },
              { value: 'sheet', label: 'Excel / CSV' },
              { value: 'image', label: 'Hình ảnh' },
              { value: 'link', label: 'Liên kết' },
            ]}
          />
        </Field>
      </FilterBar>

      {/* Thanh tác vụ hàng loạt khi chọn checkbox */}
      {selectedRowKeys.length > 0 && (
        <Card
          size="small"
          style={{
            marginBottom: 12,
            background: isDark ? '#1f293d' : '#e6f4ff',
            border: '1px solid #1677ff',
            borderRadius: 8,
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space>
              <Typography.Text strong>
                Đã chọn {selectedRowKeys.length} tài liệu
              </Typography.Text>
              <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
                Bỏ chọn
              </Button>
            </Space>

            <Space wrap size="small">
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                href={`/api/projects/${id}/docs/download-zip?ids=${selectedRowKeys.join(',')}`}
              >
                Tải ZIP ({selectedRowKeys.length} file)
              </Button>
              <Popconfirm
                title={`Xóa ${selectedRowKeys.length} tài liệu đã chọn?`}
                description="Hành động này sẽ xóa file vĩnh viễn trên hệ thống và không thể khôi phục."
                okText="Xóa tất cả"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={() => {
                  batchDelete.mutate(selectedRowKeys as string[], {
                    onSuccess: () => {
                      message.success(`Đã xóa ${selectedRowKeys.length} tài liệu thành công`);
                      setSelectedRowKeys([]);
                    },
                    onError: (e) => message.error((e as Error).message),
                  });
                }}
              >
                <Button danger size="small">
                  Xóa hàng loạt
                </Button>
              </Popconfirm>
            </Space>
          </Flex>
        </Card>
      )}

      <Table<DocRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={q.isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        scroll={{ x: 'max-content' }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: showTotal('tài liệu') }}
        locale={{
          emptyText: p.docs.length
            ? 'Không có tài liệu khớp điều kiện lọc'
            : 'Chưa có tài liệu — bấm "+ Thêm / Soạn tài liệu" hoặc tải lên ở từng bước',
        }}
      />

      {/* Modal Thêm tài liệu: 2 tab (Soạn Markdown hoặc Tải file lên) */}
      <Modal
        open={createOpen}
        title="Thêm tài liệu dự án"
        width={800}
        okText={createTab === 'write' ? 'Tạo tài liệu' : 'Tải lên tài liệu'}
        cancelText="Đóng"
        confirmLoading={createDoc.isPending || uploadDoc.isPending}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
          uploadForm.resetFields();
          setSelectedFile(null);
        }}
        onOk={() => {
          if (createTab === 'write') createForm.submit();
          else uploadForm.submit();
        }}
      >
        <Tabs
          activeKey={createTab}
          onChange={(k) => setCreateTab(k as 'write' | 'upload')}
          items={[
            {
              key: 'write',
              label: 'Soạn thảo Markdown',
              children: (
                <Form
                  form={createForm}
                  layout="vertical"
                  initialValues={{ track: 'base', step: 'B1' }}
                  onFinish={(values) => {
                    if (!values.content?.trim()) {
                      message.error('Vui lòng nhập nội dung Markdown cho tài liệu');
                      return;
                    }
                    createDoc.mutate(values, {
                      onSuccess: () => {
                        message.success('Đã tạo tài liệu thành công!');
                        setCreateOpen(false);
                        createForm.resetFields();
                      },
                      onError: (err) => message.error(err.message),
                    });
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="track" label="Hạng mục áp dụng" rules={[{ required: true, message: 'Chọn hạng mục' }]}>
                        <Select
                          options={[
                            { value: 'base', label: 'Nền tảng (dùng chung toàn dự án)' },
                            ...(p.items || []).map((i) => ({ value: i.id, label: `Hạng mục: ${i.name}` })),
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="step" label="Bước quy trình" rules={[{ required: true, message: 'Chọn bước' }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={proc.steps.map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={16}>
                      <Form.Item name="label" label="Tên tài liệu" rules={[{ required: true, message: 'Nhập tên tài liệu' }]}>
                        <Input placeholder="Ví dụ: Kế hoạch kiểm thử chất lượng, Kiến trúc hệ thống..." maxLength={160} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="templateId" label="Gắn biểu mẫu (tuỳ chọn)">
                        <Select
                          allowClear
                          placeholder="— Không chọn —"
                          options={proc.steps.flatMap((s) => s.templates).map((t) => ({ value: t.id, label: t.title }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text strong>Nội dung Markdown:</Typography.Text>
                    <Space>
                      <input
                        ref={wordFileRef}
                        type="file"
                        accept=".docx"
                        style={{ display: 'none' }}
                        onChange={handleConvertWord}
                      />
                      <Button
                        icon={<UploadOutlined />}
                        size="small"
                        loading={converting}
                        onClick={() => wordFileRef.current?.click()}
                      >
                        📥 Nhập nhanh từ file Word (.docx)
                      </Button>
                    </Space>
                  </div>

                  <Form.Item name="content" noStyle rules={[{ required: true, message: 'Nội dung không được để trống' }]}>
                    <Input.TextArea
                      rows={12}
                      placeholder="# Tiêu đề tài liệu&#10;&#10;Nội dung tài liệu định dạng Markdown..."
                      style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: 13 }}
                    />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'upload',
              label: 'Tải file lên (Word, PDF, Excel, Ảnh...)',
              children: (
                <Form
                  form={uploadForm}
                  layout="vertical"
                  initialValues={{ track: 'base', step: 'B1' }}
                  onFinish={handleUploadSubmit}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="track" label="Hạng mục áp dụng" rules={[{ required: true, message: 'Chọn hạng mục' }]}>
                        <Select
                          options={[
                            { value: 'base', label: 'Nền tảng (dùng chung toàn dự án)' },
                            ...(p.items || []).map((i) => ({ value: i.id, label: `Hạng mục: ${i.name}` })),
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="step" label="Bước quy trình" rules={[{ required: true, message: 'Chọn bước' }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={proc.steps.map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={16}>
                      <Form.Item name="label" label="Tên tài liệu (để trống sẽ lấy tên file)">
                        <Input placeholder="Ví dụ: Báo cáo tài chính Q4, Sơ đồ cơ sở dữ liệu..." maxLength={160} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name="templateId" label="Gắn biểu mẫu (tuỳ chọn)">
                        <Select
                          allowClear
                          placeholder="— Không chọn —"
                          options={proc.steps.flatMap((s) => s.templates).map((t) => ({ value: t.id, label: t.title }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Chọn file tài liệu (Hỗ trợ: Word, PDF, Excel, Ảnh, Markdown ≤ 30 MB)">
                    <Upload.Dragger
                      name="file"
                      multiple={false}
                      beforeUpload={(file) => {
                        if (file.size > 30 * 1024 * 1024) {
                          message.error('File không được vượt quá 30 MB');
                          return Upload.LIST_IGNORE;
                        }
                        setSelectedFile(file);
                        return false;
                      }}
                      onRemove={() => setSelectedFile(null)}
                      fileList={selectedFile ? [selectedFile as any] : []}
                      accept=".md,.docx,.doc,.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.svg,.webp,.gif"
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#1677ff', fontSize: 40 }} />
                      </p>
                      <p className="ant-upload-text">Kéo thả file vào đây hoặc bấm để chọn file</p>
                      <p className="ant-upload-hint">
                        Chấp nhận Word (.docx), PDF (.pdf), Excel (.xlsx, .csv), Hình ảnh (.png, .jpg...), Markdown (.md) dung lượng tối đa 30 MB
                      </p>
                    </Upload.Dragger>
                  </Form.Item>

                  <Form.Item name="url" label="Hoặc nhập link tài liệu ngoài (nếu không tải file)">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      {viewer.node}
    </>
  );
}

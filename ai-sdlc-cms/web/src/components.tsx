// Thành phần dùng chung, chỉ dùng Ant Design thuần (thay cho PageContainer / ModalForm / form lọc của Pro Components)
import { cloneElement, useState, type ReactElement, type ReactNode } from 'react';
import { Breadcrumb, Button, Card, Flex, Form, Modal, Tooltip, Typography, type FormInstance } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

/* ---------- đầu trang: breadcrumb + tiêu đề + nút bên phải ---------- */
export function PageHeader({ title, crumbs = [], extra, children }: {
  title: ReactNode; crumbs?: { title: ReactNode; to?: string; menu?: any }[]; extra?: ReactNode; children?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {crumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={crumbs.map((c) => ({
            title: c.to ? <Link to={c.to}>{c.title}</Link> : c.title,
            menu: c.menu,
          }))}
        />
      )}
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>
        {extra && <Flex gap={8} wrap>{extra}</Flex>}
      </Flex>
      {children}
    </div>
  );
}

/* ---------- hộp thoại có form: bấm trigger → mở, OK → submit; onSubmit trả false thì giữ hộp thoại ---------- */
export function FormModal<T extends object>({ trigger, title, okText = 'Lưu', initialValues, onSubmit, children, width }: {
  trigger: ReactElement<{ onClick?: () => void }>; title: ReactNode; okText?: string; initialValues?: Partial<T>;
  onSubmit: (values: T, form: FormInstance<T>) => Promise<boolean | void>; children: ReactNode; width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm<T>();
  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}
      <Modal
        open={open} title={title} okText={okText} cancelText="Huỷ" width={width} confirmLoading={busy} destroyOnClose
        onCancel={() => setOpen(false)} onOk={() => form.submit()}
      >
        <Form<T>
          form={form} layout="vertical" preserve={false} initialValues={initialValues}
          onFinish={async (v) => {
            setBusy(true);
            try { if ((await onSubmit(v, form)) !== false) setOpen(false); } finally { setBusy(false); }
          }}
        >
          {children}
        </Form>
      </Modal>
    </>
  );
}

/* ---------- thanh lọc phía trên bảng ---------- */
export function FilterBar({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Flex wrap gap={16} align="flex-end">
        {children}
        {onReset && <Button onClick={onReset}>Xoá lọc</Button>}
      </Flex>
    </Card>
  );
}
export function Field({ label, children, width = 200 }: { label: string; children: ReactNode; width?: number }) {
  return (
    <Flex vertical gap={4} style={{ width }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
      {children}
    </Flex>
  );
}

// Select dạng { value, label } từ một map nhãn
export const options = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
export const showTotal = (unit: string) => (t: number, [a, b]: [number, number]) => `${a}–${b} / ${t} ${unit}`;

/* ---------- thuật ngữ: giải thích tại chỗ (cũng là nguồn cho trang Hướng dẫn) ---------- */
export const GLOSSARY: Record<string, { label: string; text: string }> = {
  gate: { label: 'Gate', text: 'Cổng duyệt: một mốc phải có người đúng vai trò ký "Đạt" thì mới được đi tiếp. Không đạt thì quay lại sửa.' },
  humanGate: { label: 'Human Gate', text: 'Nội dung do AI sinh ra phải có một người khác người ghi xem và duyệt trước khi gate được ký "Đạt".' },
  pl2: { label: 'PL2 (Change Request)', text: 'Phụ lục 2 của quy trình: mẫu và mã cho thay đổi yêu cầu sau khi spec đã được khoá ở Gate 1.' },
  raci: { label: 'RACI', text: 'Bảng ai chịu trách nhiệm, ai duyệt, ai được tham vấn, ai được báo cho từng việc. CMS dùng nó để biết vai trò nào được ký gate nào.' },
  fastTrack: { label: 'Fast-track', text: 'Luồng rút gọn cho việc rất nhỏ (dưới 0,5 ngày công, không chạm phân quyền/thanh toán, không đổi data model): bỏ qua một số bước và gate.' },
  constitution: { label: 'constitution / skill.md', text: 'Tệp luật chung của dự án cho AI: quy ước code, thứ được và không được làm. Làm 1 lần ở nền tảng (B2), mọi hạng mục dùng chung.' },
  base: { label: 'Nền tảng (B1–B2)', text: 'Phần làm một lần cho cả dự án (Charter, luật AI, thiết lập công cụ). Sau đó mỗi tính năng/Change Request là một hạng mục riêng.' },
  item: { label: 'Hạng mục', text: 'Một tính năng, một Change Request hoặc một việc Fast-track. Mỗi hạng mục đi qua các bước B3–B14 riêng.' },
};

export function Term({ k, children }: { k: keyof typeof GLOSSARY; children?: ReactNode }) {
  const g = GLOSSARY[k];
  return (
    <Tooltip title={g.text}>
      <span style={{ borderBottom: '1px dotted #8c8c8c', cursor: 'help' }}>{children ?? g.label} <QuestionCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} /></span>
    </Tooltip>
  );
}

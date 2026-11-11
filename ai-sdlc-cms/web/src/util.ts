import dayjs from 'dayjs';
import type { GateResult, Item, Project, StepStatus, Template, Track } from './types';

export const fmt = (iso?: string) => (iso ? dayjs(iso).format('DD/MM/YYYY HH:mm') : '');

// Màu theo đặc tả: xanh = xong/đạt, vàng = đang làm, đỏ = không đạt (bảng màu Ant Design)
export const STEP_COLOR: Record<StepStatus, string> = { todo: 'default', doing: 'warning', done: 'success', skipped: 'default' };
export const GATE_COLOR: Record<GateResult, string> = { pending: 'default', pass: 'success', fail: 'error' };
export const KIND_COLOR = { full: 'blue', cr: 'gold', fast: 'green' } as const;
export const SCOPE_LABEL = { shared: 'dùng chung', cumulative: 'cộng dồn', feature: 'riêng hạng mục', event: 'theo sự kiện' } as const;
export const BUG_SEVERITY_COLOR = { S1: 'error', S2: 'volcano', S3: 'warning', S4: 'default' } as const;
export const BUG_STATUS_COLOR = { open: 'error', fixing: 'processing', closed: 'success' } as const;

// link xem file trong repo: GitHub /blob/<nhánh>/<path>, GitLab /-/blob/… (loại repo khai báo theo từng dự án,
// vì GitLab nội bộ thường không có chữ "gitlab" trong tên miền)
// ponytail: chỉ hiểu GitHub/GitLab; Azure DevOps/Bitbucket cần mẫu URL riêng
export function blob(p: Project, filePath: string | null | undefined, kind: 'blob' | 'tree' = 'blob') {
  if (!p.repoUrl || !filePath) return '';
  return `${p.repoUrl}${p.repoType === 'gitlab' ? '/-' : ''}/${kind}/${p.branch}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
}
// đường dẫn gợi ý của biểu mẫu trong track ({spec} → thư mục spec của hạng mục)
export function tplPath(t: Template, track: Track | Item) {
  if (!t.path) return '';
  if (!t.path.includes('{spec}')) return t.path;
  const dir = (track as Item).specDir;
  return dir ? t.path.replace('{spec}', dir) : '';
}
export const isMine = (t: Track, uid: string) => Object.values(t.steps).some((s) => s.owners.includes(uid));

// tìm kiếm không dấu: "vi dien" khớp "Ví điện"
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

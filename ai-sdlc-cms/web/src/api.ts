// Lớp gọi API + hook TanStack Query dùng chung cho mọi trang
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LogEntry, Metrics, MyTasks, Process, Project, User } from './types';

// data = phần thông tin thêm server gửi kèm lỗi (vd canForce / setup khi tạo hạng mục)
export class ApiError extends Error { constructor(public status: number, msg: string, public data?: Record<string, unknown>) { super(msg); } }

export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body && !isForm ? { 'content-type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) {
    // hết phiên khi đang thao tác → về trang đăng nhập (đang ở trang đăng nhập rồi thì không tải lại)
    if (res.status === 401 && !['/api/login', '/api/me'].includes(url) && window.location.pathname !== '/login') window.location.assign('/login');
    throw new ApiError(res.status, data?.error || `Lỗi ${res.status}`, data ?? undefined);
  }
  return data as T;
}

// enabled=false cho tới khi biết đã đăng nhập: không gọi API khi chưa có phiên (tránh 401 làm tải lại trang)
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<User>('GET', '/api/me'), retry: false, staleTime: 60_000 });
export const useProcess = () => useQuery({ queryKey: ['process'], queryFn: () => api<Process>('GET', '/api/process'), staleTime: Infinity });
export const useUsers = (enabled = true) => useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('GET', '/api/users'), enabled });
export const useProjects = (enabled = true) => useQuery({ queryKey: ['projects'], queryFn: () => api<Project[]>('GET', '/api/projects'), enabled });
export const useProject = (id: string) => useQuery({ queryKey: ['project', id], queryFn: () => api<Project>('GET', `/api/projects/${id}`) });
export const useLog = (id: string) => useQuery({ queryKey: ['log', id], queryFn: () => api<LogEntry[]>('GET', `/api/projects/${id}/log`) });
export const useMyTasks = (enabled = true) => useQuery({ queryKey: ['my-tasks'], queryFn: () => api<MyTasks>('GET', '/api/my-tasks'), enabled });
export const useMetrics = () => useQuery({ queryKey: ['metrics'], queryFn: () => api<Metrics>('GET', '/api/metrics') });

// Mọi thao tác ghi trên dự án trả về dự án mới → đặt thẳng vào cache, làm mới danh sách, nhật ký và "việc của tôi"
export function useProjectMutation<V, R = Project>(fn: (v: V) => Promise<R>, pick: (r: R) => Project = (r) => r as unknown as Project) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      const p = pick(r);
      qc.setQueryData(['project', p.id], p);
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['log', p.id] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
}

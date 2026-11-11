import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Input, Table, type TableColumnsType } from 'antd';
import { useLog, useProject } from '../api';
import { Field, FilterBar, PageHeader, showTotal } from '../components';
import type { LogEntry } from '../types';
import { fmt, fold } from '../util';

export default function LogPage() {
  const { id = '' } = useParams();
  const p = useProject(id).data;
  const log = useLog(id);
  const [f, setF] = useState({ user: '', action: '' });
  const rows = useMemo(() => {
    const u = fold(f.user), a = fold(f.action);
    return (log.data || []).filter((e) => (!u || fold(e.user || '').includes(u)) && (!a || fold(e.action).includes(a)));
  }, [log.data, f]);
  const columns: TableColumnsType<LogEntry> = [
    { title: 'Thời gian', dataIndex: 'at', width: 160, defaultSortOrder: 'descend', sorter: (a, b) => a.at.localeCompare(b.at), render: (v) => fmt(v) },
    { title: 'Người', dataIndex: 'user', width: 180 },
    { title: 'Thao tác', dataIndex: 'action' },
    { title: 'Chi tiết', dataIndex: 'detail', ellipsis: true },
  ];
  return (
    <>
      <PageHeader title={`Nhật ký — ${p?.name || ''}`} crumbs={[{ title: 'Dự án' }, { title: p?.name || '…', to: `/p/${id}` }, { title: 'Nhật ký' }]} />
      <FilterBar onReset={() => setF({ user: '', action: '' })}>
        <Field label="Người"><Input allowClear value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} /></Field>
        <Field label="Thao tác" width={260}><Input allowClear placeholder="vd: Ký Gate, Checklist B3…" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} /></Field>
      </FilterBar>
      <Table<LogEntry>
        rowKey={(e) => `${e.at}|${e.action}|${e.detail}`} size="small" columns={columns} dataSource={rows} loading={log.isLoading}
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: showTotal('mục') }}
      />
    </>
  );
}

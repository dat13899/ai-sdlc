import React from 'react';
import { Tag } from 'antd';
import {
  FileExcelOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { Doc } from './types';

export const isMd = (d: Doc) => !!d.file && /\.md$/i.test(d.file.name || '');
export const isPdf = (d: Doc) => !!d.file && /\.pdf$/i.test(d.file.name || '');
export const isSheet = (d: Doc) => !!d.file && /\.(xlsx|xls|csv)$/i.test(d.file.name || '');
export const isDocx = (d: Doc) => !!d.file && /\.(docx|doc)$/i.test(d.file.name || '');
export const isImage = (d: Doc) => !!d.file && /\.(png|jpe?g|svg|gif|webp)$/i.test(d.file.name || '');
export const canViewInApp = (d: Doc) => isMd(d) || isPdf(d) || isSheet(d) || isDocx(d) || isImage(d);

export type DocKind = 'md' | 'pdf' | 'sheet' | 'docx' | 'image' | 'link' | 'other';

export function getDocKind(d: Doc): DocKind {
  if (!d.file && d.url) return 'link';
  if (isMd(d)) return 'md';
  if (isPdf(d)) return 'pdf';
  if (isSheet(d)) return 'sheet';
  if (isDocx(d)) return 'docx';
  if (isImage(d)) return 'image';
  return 'other';
}

export function getDocTypeInfo(d: Doc) {
  const kind = getDocKind(d);
  switch (kind) {
    case 'pdf':
      return {
        kind,
        label: 'PDF',
        color: '#ff4d4f',
        tagColor: 'red',
        icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      };
    case 'sheet':
      return {
        kind,
        label: /\.csv$/i.test(d.file?.name || '') ? 'CSV' : 'Excel',
        color: '#52c41a',
        tagColor: 'green',
        icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      };
    case 'docx':
      return {
        kind,
        label: 'Word',
        color: '#1677ff',
        tagColor: 'blue',
        icon: <FileWordOutlined style={{ color: '#1677ff' }} />,
      };
    case 'image':
      return {
        kind,
        label: 'Hình ảnh',
        color: '#722ed1',
        tagColor: 'purple',
        icon: <FileImageOutlined style={{ color: '#722ed1' }} />,
      };
    case 'md':
      return {
        kind,
        label: 'Markdown',
        color: '#fa8c16',
        tagColor: 'orange',
        icon: <FileMarkdownOutlined style={{ color: '#fa8c16' }} />,
      };
    case 'link':
      return {
        kind,
        label: 'Link',
        color: '#13c2c2',
        tagColor: 'cyan',
        icon: <LinkOutlined style={{ color: '#13c2c2' }} />,
      };
    default:
      return {
        kind,
        label: 'Tập tin',
        color: '#8c8c8c',
        tagColor: 'default',
        icon: <FileOutlined style={{ color: '#8c8c8c' }} />,
      };
  }
}

export function DocTypeTag({ doc }: { doc: Doc }) {
  const info = getDocTypeInfo(doc);
  return (
    <Tag color={info.tagColor} icon={info.icon} style={{ marginInlineEnd: 0 }}>
      {info.label}
    </Tag>
  );
}

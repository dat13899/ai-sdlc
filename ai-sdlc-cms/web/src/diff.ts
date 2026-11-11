// Thuật toán so sánh văn bản từng dòng (LCS Line-by-Line Diff)
// Zero-dependency, thực thi tức thì (< 5ms cho tài liệu 1000 dòng).
export interface DiffLine {
  type: 'add' | 'del' | 'same';
  text: string;
  oldNum?: number;
  newNum?: number;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export interface SideBySideRow {
  left?: { num: number; text: string; type: 'del' | 'same' };
  right?: { num: number; text: string; type: 'add' | 'same' };
}

export function computeLineDiff(oldText: string, newText: string): { lines: DiffLine[]; stats: DiffStats } {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const n = a.length;
  const m = b.length;

  // Giới hạn an toàn DP nếu tài liệu quá lớn (> 2000 dòng mỗi bên)
  if (n * m > 4_000_000) {
    // Fallback đơn giản: so sánh dòng theo chỉ số
    const lines: DiffLine[] = [];
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;
    const maxLen = Math.max(n, m);
    for (let i = 0; i < maxLen; i++) {
      if (i < n && i < m && a[i] === b[i]) {
        lines.push({ type: 'same', text: a[i], oldNum: i + 1, newNum: i + 1 });
        unchanged++;
      } else {
        if (i < n) { lines.push({ type: 'del', text: a[i], oldNum: i + 1 }); deletions++; }
        if (i < m) { lines.push({ type: 'add', text: b[i], newNum: i + 1 }); additions++; }
      }
    }
    return { lines, stats: { additions, deletions, unchanged } };
  }

  // Thuật toán LCS chuẩn
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (a[i] === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Truy vết ngược để xây dựng danh sách dòng Diff
  const rawDiff: DiffLine[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      rawDiff.push({ type: 'same', text: a[i - 1], oldNum: i, newNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: 'add', text: b[j - 1], newNum: j });
      j--;
    } else if (i > 0) {
      rawDiff.push({ type: 'del', text: a[i - 1], oldNum: i });
      i--;
    }
  }

  const lines = rawDiff.reverse();
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;
  for (const l of lines) {
    if (l.type === 'add') additions++;
    else if (l.type === 'del') deletions++;
    else unchanged++;
  }

  return { lines, stats: { additions, deletions, unchanged } };
}

// Chuyển danh sách diff thành các hàng Side-by-side song song
export function buildSideBySideRows(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const cur = lines[idx];
    if (cur.type === 'same') {
      rows.push({
        left: { num: cur.oldNum!, text: cur.text, type: 'same' },
        right: { num: cur.newNum!, text: cur.text, type: 'same' },
      });
      idx++;
    } else {
      // Gom nhóm các dòng del liên tiếp và add liên tiếp đi liền nhau
      const dels: DiffLine[] = [];
      const adds: DiffLine[] = [];
      while (idx < lines.length && lines[idx].type === 'del') {
        dels.push(lines[idx++]);
      }
      while (idx < lines.length && lines[idx].type === 'add') {
        adds.push(lines[idx++]);
      }
      const count = Math.max(dels.length, adds.length);
      for (let k = 0; k < count; k++) {
        const d = dels[k];
        const a = adds[k];
        rows.push({
          left: d ? { num: d.oldNum!, text: d.text, type: 'del' } : undefined,
          right: a ? { num: a.newNum!, text: a.text, type: 'add' } : undefined,
        });
      }
    }
  }

  return rows;
}

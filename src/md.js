'use strict';
/**
 * Markdown -> HTML tối giản, zero dependency.
 * Hỗ trợ: frontmatter YAML, heading (#..######, có dịch cấp), hr, bảng, code fence,
 * danh sách ul/ol lồng nhau + checkbox, blockquote, đoạn văn.
 * Inline: `code`, **bold**, *italic*, ~~strike~~, [text](url), ảnh ![alt](src).
 */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Đổi link .md trong nội dung mẫu thành URL chạy được trên web.
 *   ../rules/bpm-rules.md   -> /mau/bpm-rules.html   (link nội bộ trong bộ mẫu)
 *   ../phu-luc/PL5-...md    -> /mau/pl5-....html
 *   b2/constitution.md      -> /mau/constitution.html
 *   raw/.../x.md            -> giữ nguyên
 * Link không phải .md và không phải http thì trả về nguyên trạng.
 */
const MD_LINK_MAP = {
  'b2/constitution.md': 'constitution',
  'b2/coding_convention.md': 'coding-convention',
  'b2/adr-template.md': 'adr-template',
  'b2/skill.md': 'skill',
  'b2/agents.md': 'agents',
  'b2/tool-permissions.md': 'tool-permissions',
  'b2/data-classification.md': 'data-classification',
  'b2/ai-tool-scope.md': 'ai-tool-scope',
  'b2/prompts.md': 'prompts',
  'b2/docs-index.md': 'docs-index',
  'b2/glossary.md': 'glossary',
  'b2/dor-dod.md': 'dor-dod',
  'rules/brd-rules.md': 'brd-rules',
  'rules/bpm-rules.md': 'bpm-rules',
  'rules/adr-rules.md': 'adr-rules',
  'rules/api-rules.md': 'api-rules',
  'rules/test-rules.md': 'test-rules',
  'rules/code-review-rules.md': 'code-review-rules',
  'b3/4.3-brd.md': 'brd',
  'b3/4.4-process-flow-user-journey.md': 'process-flow',
  'b3/4.5-qa-log.md': 'qa-log',
  'b3/4.1-interview-guide.md': 'interview-guide',
  'b3/4.2-bien-ban-hop.md': 'meeting-minutes',
  'bo-sung/runbook.md': 'runbook',
  'bo-sung/postmortem.md': 'postmortem',
  'bo-sung/changelog.md': 'changelog',
  'bo-sung/conventional-commits.md': 'conventional-commits',
  'bo-sung/threat-model-stride.md': 'threat-model',
  'bo-sung/spec.md': 'spec',
  'bo-sung/plan.md': 'plan',
  'bo-sung/tasks.md': 'tasks',
  'bo-sung/test-plan.md': 'test-plan',
  'bo-sung/test-case-rtm.md': 'test-case-rtm',
  'bo-sung/code-review-checklist-nguoi.md': 'code-review-human',
  'quy-chuan/standards-index.md': 'standards-index',
  'quy-chuan/ai-governance.md': 'ai-governance',
  'quy-chuan/dora-metrics.md': 'dora-metrics',
  'phu-luc/glossary.md': 'glossary',
  'phu-luc/pl1-project-charter.md': 'pl1-project-charter',
  'phu-luc/pl2-change-request.md': 'pl2-change-request',
  'phu-luc/pl3-bo-tai-lieu-b2.md': 'pl3-bo-tai-lieu-b2',
  'phu-luc/pl4-bo-bieu-mau-b3.md': 'pl4-bo-bieu-mau-b3',
  'phu-luc/pl5-bug-report.md': 'pl5-bug-report',
  'phu-luc/pl6-uat-signoff-go-no-go.md': 'pl6-uat-go-no-go',
};

function mdLinkHref(href) {
  if (/^(https?:|mailto:|tel:|#|data:|\/)/i.test(href)) return href;
  // tài liệu B2/B3/… trong tài liệu gốc chưa có mẫu -> trỏ về trang chỉ mục
  if (/^docs?\/|^\.\.\/docs?\//i.test(href)) return '/mau/index.html';
  const key = href.replace(/^(\.\.?\/)+/, '').toLowerCase();
  // đường dẫn trong bộ mẫu, đã có 'mau/' -> thêm '/' đầu để không phụ thuộc URL hiện tại
  if (/^mau\//.test(key)) return '/' + key;
  if (MD_LINK_MAP[key]) return '/mau/' + MD_LINK_MAP[key] + '.html';
  return href;
}

function inline(src) {
  let s = esc(src);
  // code span trước để không bị bold/italic ăn vào
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000C${codes.length - 1}\u0000`;
  });
  // ảnh + link (chỉ cho http/https/mailto/# và đường dẫn tương đối)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, href) =>
    `<img src="${href}" alt="${alt}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const ext = /^https?:/i.test(href);
    const target = ext ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${mdLinkHref(href)}"${target}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // bỏ escape dấu | trong bảng đã xử lý ở ngoài
  s = s.replace(/\u0000C(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

function parseFrontmatter(md) {
  const meta = {};
  let body = md;
  if (md.startsWith('---')) {
    const end = md.indexOf('\n---', 3);
    if (end !== -1) {
      const raw = md.slice(3, end).trim();
      for (const line of raw.split('\n')) {
        const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
        if (m) {
          let v = m[2].trim().replace(/^["']|["']$/g, '');
          meta[m[1]] = v;
        } else if (line.trim().startsWith('-') && Object.keys(meta).length) {
          const k = Object.keys(meta).pop();
          meta[k] = `${meta[k]}; ${line.trim().replace(/^-\s*/, '')}`;
        }
      }
      body = md.slice(end + 4);
    }
  }
  return { meta, body };
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function renderTable(rows) {
  const head = rows[0];
  const body = rows.slice(1);
  return `<div class="tw"><table>
<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>
<tbody>${body.map((r) => {
    const cells = r.slice(0, head.length);
    while (cells.length < head.length) cells.push('');
    return `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`;
  }).join('')}</tbody>
</table></div>`;
}

/**
 * @param {string} md
 * @param {{headingOffset?:number}} opts  headingOffset: dịch cấp heading (index dùng 0)
 */
function mdToHtml(md, opts = {}) {
  const offset = opts.headingOffset || 0;
  const { meta, body } = parseFrontmatter(md);
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const h = (level) => `h${Math.min(6, Math.max(1, level + offset))}`;

  while (i < lines.length) {
    const line = lines[i];

    // code fence
    const fence = /^```(\w*)\s*$/.exec(line.trim());
    if (fence) {
      const lang = fence[1] || '';
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        buf.push(lines[i]); i++;
      }
      i++; // đóng fence
      out.push(`<pre class="code${lang ? ` lang-${esc(lang)}` : ''}"><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // hr
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>'); i++; continue;
    }

    // heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const lv = heading[1].length;
      out.push(`<${h(lv)}>${inline(heading[2].trim())}</${h(lv)}>`);
      i++; continue;
    }

    // table
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      // bỏ dòng phân cách
      const head = rows[0];
      const data = rows.slice(1).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ''));
      out.push(renderTable([head, ...data]));
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, '')); i++;
      }
      out.push(`<blockquote>${mdToHtml(buf.join('\n'), { headingOffset: offset }).html}</blockquote>`);
      continue;
    }

    // danh sách (ul/ol, có thể lồng nhau, có checkbox)
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const listOut = [];
      const stack = []; // {type, indent, items:[]}
      const attach = (html) => {
        if (stack.length) {
          const parent = stack[stack.length - 1];
          // gắn list con vào <li> cuối của list cha để HTML hợp lệ
          const last = parent.items.length - 1;
          if (last >= 0) parent.items[last] = parent.items[last].replace(/<\/li>$/, `${html}</li>`);
          else parent.items.push(html);
        } else {
          listOut.push(html);
        }
      };
      const flush = () => {
        while (stack.length) {
          const node = stack.pop();
          attach(`<${node.type}>${node.items.join('')}</${node.type}>`);
        }
      };
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        const item = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[i]);
        const indent = item[1].replace(/\t/g, '    ').length;
        const type = /^\d/.test(item[2]) ? 'ol' : 'ul';
        let text = item[3];
        let inner = '';
        // dòng tiếp nối (thụt lề, không phải item mới)
        let j = i + 1;
        while (j < lines.length && /^\s+/.test(lines[j]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[j]) && lines[j].trim()) {
          text += ' ' + lines[j].trim(); j++;
        }
        i = j;
        let cls = '';
        const cb = /^\[( |x|X)\]\s*(.*)$/.exec(text);
        if (cb) {
          const checked = cb[1].toLowerCase() === 'x';
          inner = `<li class="task${checked ? ' done' : ''}"><span class="cb">${checked ? '☑' : '☐'}</span> ${inline(cb[2])}</li>`;
        } else {
          inner = `<li>${inline(text)}</li>`;
        }
        if (!stack.length || indent > stack[stack.length - 1].indent) {
          stack.push({ type, indent, items: [] });
        } else {
          while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
            const node = stack.pop();
            stack[stack.length - 1].items.push(`<${node.type}>${node.items.join('')}</${node.type}>`);
          }
        }
        stack[stack.length - 1].items.push(inner);
      }
      flush();
      out.push(listOut.join(''));
      continue;
    }

    // đoạn văn
    if (line.trim()) {
      const buf = [line.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*\||\s*>|\s*([-*+]|\d+\.)\s|\s*-{3,}\s*$)/.test(lines[i])) {
        buf.push(lines[i].trim()); i++;
      }
      out.push(`<p>${inline(buf.join(' '))}</p>`);
      continue;
    }

    i++;
  }

  return { meta, html: out.join('\n') };
}

module.exports = { mdToHtml, inline, esc, mdLinkHref };

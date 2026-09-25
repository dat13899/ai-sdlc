'use strict';
/**
 * Build site tĩnh cho AI-SDLC:
 *   public/index.html          — trang chính (layout 3 cột: tree nav | nội dung | danh sách mẫu)
 *   public/mau/index.html      — chỉ mục toàn bộ file mẫu
 *   public/mau/<id>.html       — từng file mẫu render từ templates/<file>
 *   public/mau/raw/<file>      — bản .md gốc để tải về
 * Chạy: node build.js
 */
const fs = require('fs');
const path = require('path');
const d = require('./src/data.js');
const { mdToHtml, esc } = require('./src/md.js');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const TPL = path.join(ROOT, 'templates');

const steps = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/steps-detail.json'), 'utf8'));
const flows = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/flow-mapping.json'), 'utf8'));
const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/templates.json'), 'utf8'));

/* ---------- đọc file mẫu ---------- */
const allFiles = [];
for (const g of registry.groups) {
  for (const f of g.files) {
    const abs = path.join(TPL, f.file);
    let md = null;
    let missing = false;
    try { md = fs.readFileSync(abs, 'utf8'); } catch { missing = true; }
    allFiles.push({ ...f, group: g.id, groupTitle: g.title, md, missing, lines: md ? md.split('\n').length : 0 });
  }
}
const fileById = Object.fromEntries(allFiles.map((f) => [f.id, f]));
const present = allFiles.filter((f) => !f.missing);
const missingCount = allFiles.length - present.length;

/* ---------- NAV ---------- */
const NAV = [
  ['#quy-trinh', '14 bước'],
  ['#gate', '8 Gate'],
  ['#luat-ai', 'Luật cho AI'],
  ['#bo-tai-lieu-b2', 'Bộ tài liệu B2'],
  ['#bug', 'Quản lý bug'],
  ['#release', 'Release'],
  ['#bieu-mau', 'Biểu mẫu'],
  ['#kpi', 'KPI & chuẩn'],
  ['#thieu', 'Còn thiếu'],
  ['#tai-lieu', 'Tài liệu gốc'],
];

/* ---------- cây điều hướng 14 bước ---------- */
function treeNav(activeStep) {
  return `
<aside class="side side-l">
  <details class="side-box" open>
    <summary><span class="side-t">Quy trình 14 bước</span></summary>
    <nav class="tree">
      ${d.phases.map((p) => `
      <div class="tree-g">
        <div class="tree-gt">${esc(p.id)} · ${esc(p.name)}</div>
        <ul>
          ${p.steps.map((s) => `
          <li data-step="${s.code.toLowerCase()}"${activeStep === s.code ? ' class="on"' : ''}>
            <a href="/index.html#${s.code.toLowerCase()}">
              <span class="tb">${esc(s.code)}</span>
              <span class="tn">${esc(shortName(s.name))}</span>
              ${s.gate && /Gate/.test(s.gate) ? '<span class="tg" title="Human Gate">⛔</span>' : ''}
            </a>
          </li>`).join('')}
        </ul>
      </div>`).join('')}
    </nav>
    <div class="tree-sep"></div>
    <nav class="tree tree-flat">
      <div class="tree-gt">Mục khác</div>
      <ul>${NAV.slice(1).map(([h, t]) => `<li data-sec="${h.slice(1)}"><a href="/index.html${h}"><span class="tn">${esc(t)}</span></a></li>`).join('')}</ul>
    </nav>
  </details>
</aside>`;
}

function shortName(n) {
  return n
    .replace(/ — ⛔.*$/, '')
    .replace(/ \(AI-assisted \/ agentic\)/, '')
    .replace(/Làm rõ & chốt Spec \(Clarify\)/, 'Làm rõ & chốt Spec')
    .replace(/Thu thập & phân tích yêu cầu/, 'Thu thập yêu cầu')
    .replace(/SIT \/ Regression \/ UAT.*/, 'SIT/Regression/UAT')
    .replace(/Release & Quá trình đưa lên môi trường/, 'Release & môi trường')
    .replace(/Vận hành, giám sát & cải tiến/, 'Vận hành & cải tiến')
    .replace(/Constitution & skill\.md.*/, 'Constitution & skill.md')
    .replace(/Technical Plan & Kiến trúc/, 'Technical Plan & Kiến trúc')
    .replace(/Test Plan & Test Case/, 'Test Plan & Test Case');
}

/* ---------- sidebar phải: danh sách file mẫu ---------- */
function sideFiles(activeId) {
  return `
<aside class="side side-r">
  <details class="side-box" open>
    <summary><span class="side-t">File mẫu & quy chuẩn</span><span class="side-n">${present.length}/${allFiles.length}</span></summary>
    <div class="side-actions">
      <a class="btn" href="/mau/index.html">Xem tất cả mẫu</a>
      <a class="btn ghost" href="/assets/mau/AI-SDLC-mau-tat-ca.zip" download>⬇ Tải .zip</a>
    </div>
    ${registry.groups.map((g) => {
      const items = g.files.map((f) => fileById[f.id]).filter((f) => f);
      return `
    <div class="side-g">
      <div class="side-gt">${esc(g.title)}</div>
      <ul class="side-list">
        ${items.map((f) => `
        <li${activeId === f.id ? ' class="on"' : ''}>
          <a href="/mau/${f.id}.html" title="${esc(f.desc)}">
            <span class="fl">${esc(f.title)}</span>
            <span class="fm">${esc(f.for)}${f.missing ? ' · <span class="pending">đang cập nhật</span>' : ` · ${f.lines} dòng`}</span>
          </a>
        </li>`).join('')}
      </ul>
    </div>`;
    }).join('')}
  </details>
</aside>`;
}

function shell({ title, body, activeStep, activeFile, nav = true }) {
  return `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="theme-color" content="#0a0a0f">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%237c6cf0'/%3E%3Ctext x='16' y='22' font-size='15' font-family='system-ui' font-weight='700' fill='white' text-anchor='middle'%3EAI%3C/text%3E%3C/svg%3E">
<style>${css}</style>
</head>
<body>
<header class="nav">
  <div class="nav-in">
    <a class="brand" href="/index.html"><span class="logo">AI</span> AI-SDLC <small>v${esc(d.meta.version)} · ${esc(d.meta.domain)}</small></a>
    <nav class="nav-links">
      ${NAV.map(([h, t]) => `<a href="/index.html${h}" data-sec="${h.slice(1)}">${esc(t)}</a>`).join('\n      ')}
      <a class="ext" href="/mau/index.html">File mẫu ↗</a>
      <a class="ext" href="https://btdat.io.vn" target="_blank" rel="noopener">btdat.io.vn ↗</a>
    </nav>
  </div>
</header>
<div class="layout">
  ${treeNav(activeStep)}
  <main class="main">${body}</main>
  ${sideFiles(activeFile)}
</div>
<footer>
  <div class="wrap">
    AI-SDLC v${esc(d.meta.version)} · ${esc(d.meta.basis)}<br>
    ${esc(d.meta.domain)} — nội dung trích từ ${esc(d.meta.sourceName)} (${d.meta.pages} trang). Bản gốc không bị chỉnh sửa.
  </div>
</footer>
<script>
/* Scroll-spy: highlight mục đang xem ở menu trái + menu ngang.
   Dùng toạ độ TUYỆT ĐỐI (rect.top + scrollY) — offsetTop phụ thuộc offsetParent
   nên sai khi phần tử nằm trong khối có position khác static. */
(function () {
  var THRESHOLD = 90; // px dưới header coi như "đang ở" mục đó

  function absTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  var stepNodes = [];
  document.querySelectorAll('.tree li[data-step]').forEach(function (li) {
    var el = document.getElementById(li.dataset.step);
    if (el) stepNodes.push({ el: el, node: li });
  });

  var SECTION_IDS = ['quy-trinh', 'chi-tiet', 'gate', 'luat-ai', 'bo-tai-lieu-b2', 'bug', 'release', 'bieu-mau', 'kpi', 'thieu', 'tai-lieu'];
  var secNodes = [];
  SECTION_IDS.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var links = document.querySelectorAll('[data-sec="' + id + '"]');
    if (links.length) secNodes.push({ el: el, nodes: Array.prototype.slice.call(links) });
  });

  if (!stepNodes.length && !secNodes.length) return;

  function clearAll() {
    document.querySelectorAll('.tree li.on, .nav-links a.on').forEach(function (n) { n.classList.remove('on'); });
  }
  function mark(nodes) {
    clearAll();
    (nodes || []).forEach(function (n) { if (n && n.classList) n.classList.add('on'); });
  }

  function update() {
    var y = window.scrollY + THRESHOLD;
    var all = [];
    stepNodes.forEach(function (t) { all.push({ el: t.el, nodes: [t.node], key: t.el.id }); });
    secNodes.forEach(function (t) { all.push({ el: t.el, nodes: t.nodes, key: t.el.id }); });
    all.forEach(function (t) { t.top = absTop(t.el); });
    all.sort(function (a, b) { return a.top - b.top; });

    var found = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].top <= y) found = all[i]; else break;
    }
    mark(found ? found.nodes : null);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  window.addEventListener('hashchange', function () { setTimeout(update, 120); });
  update();
  setTimeout(update, 400);   // sau khi ảnh lưu đồ tải xong (layout đổi)
  setTimeout(update, 1500);
})();

/* Mở sẵn <details> chứa mục đang xem */
(function () {
  var on = document.querySelector('.side-list li.on, .tree li.on');
  if (!on) return;
  var d = on.closest('details');
  if (d) d.open = true;
})();

/* ---------- popup xem biểu mẫu (chỉ cho link ở bảng chi tiết 14 bước) ----------
   - Nội dung lấy từ <template id="tpl-<id>"> đã render sẵn trong trang.
   - Chỉ bật khi bấm chuột trái không kèm phím tu chỉnh; Ctrl/Cmd/Shift-click và
     chuột giữa vẫn mở trang riêng như bình thường.
   - Esc và bấm nền cũng đóng. Khoá cuộn nền khi đang mở. */
(function () {
  var layer = document.getElementById('mm');
  if (!layer) return;
  var body = document.getElementById('mm-body');
  var title = document.getElementById('mm-title');
  var btnOpen = document.getElementById('mm-open');
  var btnDl = document.getElementById('mm-dl');
  var btnX = document.getElementById('mm-close');
  var last = null;

  function open(id) {
    var tpl = document.getElementById('tpl-' + id);
    if (!tpl) return false;
    last = document.activeElement;
    title.textContent = tpl.dataset.title || id;
    body.replaceChildren(tpl.content.cloneNode(true));
    btnOpen.href = tpl.dataset.url || ('/mau/' + id + '.html');
    btnDl.href = tpl.dataset.raw || '#';
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mm-lock');
    layer.querySelector('.mm-b').scrollTop = 0;
    btnX.focus();
    return true;
  }
  function close() {
    if (layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mm-lock');
    body.replaceChildren();
    if (last && last.focus) last.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-form]') : null;
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (open(a.dataset.form)) e.preventDefault();
  });
  layer.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });
  btnX.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !layer.hidden) { close(); return; }
    /* Tab giữ trong popup khi đang mở */
    if (e.key === 'Tab' && !layer.hidden) {
      var f = layer.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });
})();
</script>
</body>
</html>`;
}

/* ---------- trang chính ---------- */
/* Tầng popup xem biểu mẫu — chỉ dùng ở bảng chi tiết 14 bước (sidebar phải vẫn là link thường).
   Nội dung nạp từ sẵn trong trang: <template id="tpl-<id>"> chứa tiêu đề + bài .md đã render.
   Không dùng iframe / fetch -> chạy được cả khi mở file:// và không phụ thuộc JS của trang mẫu. */
function modalLayer() {
  const tpls = present.map((f) => `
<template id="tpl-${f.id}" data-title="${esc(f.title)}" data-for="${esc(f.for)}" data-raw="/mau/raw/${esc(f.file)}" data-lines="${f.lines}" data-url="/mau/${f.id}.html">
  <div class="mm-meta">
    <span class="chip">Dùng ở: <b>${esc(f.for)}</b></span>
    <span class="chip">Nhóm: <b>${esc(f.groupTitle)}</b></span>
    <span class="chip">${f.lines} dòng</span>
  </div>
  <article class="md mm-md">${mdToHtml(f.md, { headingOffset: 2 }).html}</article>
</template>`).join('');

  return `
<div class="mm" id="mm" hidden aria-hidden="true">
  <div class="mm-bd" data-close></div>
  <div class="mm-win" role="dialog" aria-modal="true" aria-labelledby="mm-title">
    <div class="mm-h">
      <div class="mm-ht">
        <span class="mm-k">Biểu mẫu</span>
        <h3 id="mm-title">—</h3>
      </div>
      <div class="mm-acts">
        <a class="mm-btn" id="mm-open" href="#" target="_blank" rel="noopener">Mở trang riêng ↗</a>
        <a class="mm-btn primary" id="mm-dl" href="#" download>⬇ Tải .md</a>
        <button class="mm-x" id="mm-close" type="button" aria-label="Đóng (Esc)">✕</button>
      </div>
    </div>
    <div class="mm-b" id="mm-body"></div>
  </div>
</div>
${tpls}`;
}

function hero() {
  const { meta } = d;
  return `
<section class="hero" id="top">
  <div class="hero-in">
    <span class="badge"><i></i> Phiên bản ${esc(meta.version)} · cập nhật ${esc(meta.updated)}</span>
    <h1>Quy trình phát triển phần mềm <span class="g">tích hợp AI</span></h1>
    <p class="lede">${esc(meta.basis)}. 14 bước, 5 giai đoạn, 8 điểm kiểm soát — AI làm được nhiều việc, nhưng mọi quyết định cuối cùng vẫn thuộc về con người.</p>
    <div class="hero-meta">
      <span class="chip">📄 Nguồn: <b>${esc(meta.sourceName)}</b> · ${meta.pages} trang</span>
      <span class="chip">🗺 <b>${meta.diagrams}</b> lưu đồ</span>
      <span class="chip">📁 <b>${allFiles.length}</b> file mẫu ${missingCount ? `(đã có ${present.length})` : ''}</span>
    </div>
    <div class="stats">
      <div class="stat"><b>14</b><span>Bước B1–B14</span></div>
      <div class="stat"><b>5</b><span>Giai đoạn</span></div>
      <div class="stat"><b>8</b><span>Gate kiểm soát</span></div>
      <div class="stat"><b>17</b><span>File luật ở B2</span></div>
    </div>
  </div>
</section>`;
}

/* Ô "Biểu mẫu" trong bảng chi tiết: tên mẫu (mã PL) -> link mở trang xem mẫu.
   Ánh xạ nằm ở src/steps-detail.json (phần tử thứ 6 của mỗi hàng: {links:[{id,label}]}),
   id phải khớp một mục trong src/templates.json, nếu không thì render chữ thường. */
function formCell(r) {
  const raw = r[4] == null ? '' : String(r[4]);
  const links = (r[5] && Array.isArray(r[5].links)) ? r[5].links : null;
  if (!links || !links.length) return esc(raw);
  return links.map((l) => {
    const f = fileById[l.id];
    const label = l.label || raw;
    if (!f) return esc(label);                                     // id lạ -> không link, không vỡ trang
    const tip = `${f.title}${f.missing ? ' — đang cập nhật' : ''} · ${f.lines} dòng`;
    return `<a class="mlink" href="/mau/${esc(f.id)}.html" data-form="${esc(f.id)}" title="${esc(tip)}">${esc(label)}</a>`;
  }).join('<span class="mlink-sep">·</span>');
}

function stepBlock(step, phaseName) {
  const rows = steps[step.code] || [];
  const img = flows[step.code];
  const gate = step.gate && /Gate|⛔/.test(step.gate);
  return `
  <article class="step-big${gate ? ' gated' : ''}" id="${step.code.toLowerCase()}">
    <div class="step-big-h">
      <span class="bcode">${esc(step.code)}</span>
      <h3>${esc(step.name)}</h3>
      ${step.gate ? `<span class="gatechip">${esc(step.gate)}</span>` : ''}
    </div>
    <div class="kv"><b>Giai đoạn</b><span>${esc(phaseName)}</span></div>
    <div class="kv"><b>Đầu ra</b><span>${esc(step.out)}</span></div>
    <div class="kv"><b>Vai trò AI</b><span>${esc(step.ai)}</span></div>
    ${img ? `<figure class="shot"><img src="${esc(img)}" alt="Lưu đồ ${esc(step.code)}: ${esc(step.name)}" loading="lazy"><figcaption>Lưu đồ ${esc(step.code)} — bước Human Gate tô vàng.</figcaption></figure>` : ''}
    ${rows.length ? `
    <div class="tw" style="margin-top:14px">
      <table>
        <thead><tr><th>Bước</th><th>Người thực hiện</th><th>Cách thức thực hiện</th><th>Lưu ý</th><th>Biểu mẫu</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="fc">${formCell(r)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}
  </article>`;
}

function pipeline() {
  return `
<section id="quy-trinh">
  <h2>14 bước trong 5 giai đoạn</h2>
  <p class="sub">Mỗi bước có: tài liệu đầu ra — chuẩn áp dụng — công cụ AI — lưu đồ — bảng chi tiết ai làm gì. Bước có Human Gate tô vàng.</p>
  ${d.phases.map((p) => `
  <div class="phase" data-tint="${p.tint}">
    <div class="phase-h"><span class="pid">${esc(p.id)}</span><span class="pname">${esc(p.name)}</span></div>
    <div class="steps">
      ${p.steps.map((s) => `
      <a class="step${s.key ? ' key' : ''}" href="#${s.code.toLowerCase()}" style="text-decoration:none;color:inherit">
        <div class="step-top"><span class="bcode">${esc(s.code)}</span>${s.gate ? `<span class="gatechip">${esc(s.gate)}</span>` : ''}</div>
        <h4>${esc(s.name)}</h4>
        <p>${esc(s.out)}</p>
        <div class="more note">Xem chi tiết + lưu đồ ↓</div>
      </a>`).join('')}
    </div>
  </div>`).join('')}
</section>

<section id="chi-tiet">
  <h2>Chi tiết từng bước</h2>
  <p class="sub">Nội dung dưới đây trích trực tiếp từ tài liệu gốc — bảng 5 cột và lưu đồ của từng bước.</p>
  <div class="toc">${d.phases.flatMap((p) => p.steps.map((s) => `<a href="#${s.code.toLowerCase()}">${esc(s.code)} · ${esc(s.name)}</a>`)).join('')}</div>
  ${d.phases.map((p) => p.steps.map((s) => stepBlock(s, p.name)).join('')).join('')}
</section>`;
}

function gates() {
  return `
<section id="gate">
  <h2>8 điểm kiểm soát (Human Gate)</h2>
  <p class="sub">Nguyên tắc xuyên suốt: <b>AI không bao giờ giữ vai trò A (Accountable)</b> trong RACI — trách nhiệm cuối cùng luôn thuộc con người.</p>
  <div class="tw">
    <table>
      <thead><tr><th>Gate</th><th>Bước</th><th>Người ký</th><th>Điều kiện đạt</th><th>Hệ quả</th></tr></thead>
      <tbody>
        ${d.gates.map((g) => `<tr><td><b>${esc(g.id)}</b></td><td>${esc(g.at)}</td><td>${esc(g.owner)}</td><td>${esc(g.check)}</td><td>${esc(g.after)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <p class="note" style="margin-top:12px">${esc(d.raci)}</p>
  <div class="card amber" style="margin-top:18px">
    <h3>Luồng rút gọn cho task nhỏ</h3>
    <p>${esc(d.fastTrack)}</p>
  </div>
</section>`;
}

function aiLaw() {
  return `
<section id="luat-ai">
  <h2>Luật cho AI: 2 tầng skill.md</h2>
  <p class="sub">B2 là bước quyết định chất lượng toàn bộ 12 bước sau — mọi lỗi hiểu domain/quyền hạn AI ở đây sẽ nhân bản ra tất cả các bước tiếp theo.</p>
  <div class="grid2">
    ${d.skillPolicy.map((t) => `
    <div class="card">
      <h3>${esc(t.tier)}</h3>
      <p class="note" style="margin-bottom:6px">${esc(t.who)}</p>
      <p>${esc(t.d)}</p>
    </div>`).join('')}
  </div>
  <div class="warn" style="margin-top:14px"><b>Xung đột 2 tầng:</b> ${esc(d.skillConflict)}</div>
  <div class="warn" style="margin-top:10px"><b>Chống prompt injection:</b> ${esc(d.skillInjection)}</div>
  <div class="grid3" style="margin-top:18px">
    <div class="card">
      <h3>Quyền hạn (least-privilege)</h3>
      <ul>
        <li>✅ Được tự chạy test / lint / build cục bộ</li>
        <li>❌ Không tự chạy migration DB</li>
        <li>❌ Không push thẳng lên main</li>
        <li>❌ Không tự quyết định số liệu ngân sách/phạm vi</li>
      </ul>
      <div class="links"><a href="/mau/tool-permissions.html">Xem tool-permissions.md →</a></div>
    </div>
    <div class="card">
      <h3>Phân loại dữ liệu</h3>
      <ul>
        <li><b>Public</b> — đưa vào prompt thoải mái</li>
        <li><b>Internal</b> — chỉ tool nội bộ/đã duyệt</li>
        <li><b>Confidential</b> — cần Zero Data Retention</li>
        <li><b>Restricted</b> — không đưa vào prompt AI</li>
      </ul>
      <div class="links"><a href="/mau/data-classification.html">Xem data-classification.md →</a></div>
    </div>
    <div class="card">
      <h3>Quản trị công cụ AI</h3>
      <ul>${d.governance.slice(0, 3).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
      <div class="links"><a href="/mau/ai-governance.html">Xem ai-governance.md →</a></div>
    </div>
  </div>
</section>`;
}

function b2() {
  return `
<section id="bo-tai-lieu-b2">
  <h2>Bộ tài liệu B2 — 17 file điều khiển AI</h2>
  <p class="sub">Đây là "bộ não" của dự án: nạp vào repo ngay từ B2, sau đó mọi prompt đều đối chiếu ngược lại các file này. Bấm vào từng file để xem mẫu .md đầy đủ.</p>
  ${d.b2Groups.map((g) => `
  <div class="card" style="margin-bottom:12px">
    <h3>${esc(g.title)}</h3>
    <p class="note">${esc(g.note)}</p>
    <div class="filelist">
      ${g.files.map((f) => {
        const t = allFiles.find((x) => /^\d+\.\d+/.test(x.for) && x.title.startsWith(f.f.split('/').pop().replace('.md', ''))) ||
                  allFiles.find((x) => x.file.endsWith(f.f));
        const href = t ? `/mau/${t.id}.html` : null;
        const inner = `<span class="n">${esc(f.n)}</span>
          <span><b>${esc(f.f)}${f.tag ? `<span class="pill">${esc(f.tag)}</span>` : ''}</b><span>${esc(f.d)}</span></span>`;
        return href ? `<a class="file" href="${href}">${inner}</a>` : `<div class="file">${inner}</div>`;
      }).join('')}
    </div>
  </div>`).join('')}
</section>`;
}

function bugs() {
  return `
<section id="bug">
  <h2>Quản lý bug phát sinh</h2>
  <p class="sub">Mọi bug report theo template chuẩn (PL5): steps to reproduce, expected vs actual, evidence, liên kết AC/Test Case. AI hỗ trợ gom cụm bug trùng lặp và phân tích log tìm root cause.</p>
  <div class="grid2">
    <div class="tw">
      <table>
        <thead><tr><th>Severity</th><th>Định nghĩa</th><th>SLA sửa</th></tr></thead>
        <tbody>${d.severity.map((s) => `<tr><td><b>${esc(s.lv)}</b></td><td>${esc(s.def)}</td><td>${esc(s.sla)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="tw">
      <table>
        <thead><tr><th>Priority</th><th>Ý nghĩa</th></tr></thead>
        <tbody>${d.priority.map((p) => `<tr><td><b>${esc(p.p)}</b></td><td>${esc(p.d)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
  <h3 style="margin-top:22px">Vòng đời bug</h3>
  <div class="lifecycle">${d.lifecycle.map((s) => `<span>${esc(s)}</span>`).join('<span style="border:0;background:none;color:var(--dim-2);padding:7px 0">→</span>')}</div>
  <p class="note">${esc(d.lifecycleNote)}</p>
  <div class="links"><a href="/mau/pl5-bug-report.html">Mẫu Bug Report (PL5) →</a></div>
  <h3 style="margin-top:22px">Quy trình Hotfix Production (sự cố Severity 1)</h3>
  <div class="card amber">
    <ul>${d.hotfix.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
  </div>
  <div class="warn" style="margin-top:12px">Tuân thủ Zero-Bug với lỗi nghiêm trọng: <b>tuyệt đối không đưa lên UAT hoặc Go-live nếu còn bug S1–S2</b>.</div>
</section>`;
}

function release() {
  return `
<section id="release">
  <h2>Release & thăng cấp môi trường</h2>
  <p class="sub">${esc(d.promotionNote)}</p>
  <div class="flow">
    ${d.promotion.map((p, i) => `${i ? '<span class="arw">→</span>' : ''}<span class="env${i ? ' gate' : ''}">${esc(p.env)}</span>`).join('')}
  </div>
  <div class="tw">
    <table>
      <thead><tr><th>Môi trường</th><th>Điều kiện / đặc điểm</th></tr></thead>
      <tbody>${d.promotion.map((p) => `<tr><td><b>${esc(p.env)}</b></td><td>${esc(p.d)}</td></tr>`).join('')}</tbody>
    </table>
  </div>
  <div class="grid2" style="margin-top:16px">
    <div class="card">
      <h3>Gate 5 — Họp Go/No-Go</h3>
      <p>Bắt buộc có PM, Tech Lead, Test Lead, Security Lead, PO. Checklist tối thiểu ở PL6. Chỉ go-live khi mọi mục là "Đạt" — có mục "Không đạt" thì quyết định No-Go và dời lịch.</p>
      <div class="links"><a href="/mau/pl6-uat-go-no-go.html">Mẫu PL6 →</a><a href="/mau/postmortem.html">Post-mortem →</a><a href="/mau/runbook.html">Runbook →</a></div>
    </div>
    <div class="card">
      <h3>Hypercare</h3>
      <p>1–2 tuần ngay sau go-live: đội Dev/DevOps trực tăng cường, theo dõi sát, phản ứng nhanh trước khi chuyển về vận hành thường.</p>
      <div class="links"><a href="/mau/changelog.html">CHANGELOG →</a><a href="/mau/conventional-commits.html">Conventional Commits →</a></div>
    </div>
  </div>
</section>`;
}

function forms() {
  return `
<section id="bieu-mau">
  <h2>Biểu mẫu chuẩn hoá</h2>
  <p class="sub">Sáu phụ lục của tài liệu gốc, đã viết lại thành file .md dùng ngay. Bấm để xem và tải.</p>
  <div class="grid3">
    ${d.appendices.map((a) => {
      const f = allFiles.find((x) => x.id === `pl${a.n}-` + ['project-charter', 'change-request', 'bo-tai-lieu-b2', 'bo-bieu-mau-b3', 'bug-report', 'uat-go-no-go'][a.n - 1]);
      return `
    <div class="card">
      <h3>Phụ lục ${a.n} — ${esc(a.t)}</h3>
      <p class="note" style="margin-bottom:6px">Dùng ở: <b>${esc(a.for)}</b></p>
      <p>${esc(a.d)}</p>
      ${f ? `<div class="links"><a href="/mau/${f.id}.html">${f.missing ? 'Đang cập nhật' : 'Xem mẫu .md'} →</a></div>` : ''}
    </div>`;
    }).join('')}
  </div>
</section>`;
}

function kpi() {
  return `
<section id="kpi">
  <h2>KPI & chuẩn áp dụng</h2>
  <div class="grid2">
    <div class="card">
      <h3>KPI theo dõi hiệu quả</h3>
      <ul>${d.kpi.map((k) => `<li><b>${esc(k.k)}</b> — ${esc(k.d)}</li>`).join('')}</ul>
      <div class="links"><a href="/mau/dora-metrics.html">Chỉ số DORA chi tiết →</a></div>
    </div>
    <div class="card">
      <h3>Chuẩn tham chiếu</h3>
      <ul>${d.standards.map((s) => `<li><b>${esc(s.g)}:</b> ${esc(s.v)}</li>`).join('')}</ul>
      <div class="links"><a href="/mau/standards-index.html">Chỉ mục đầy đủ 20+ chuẩn →</a></div>
    </div>
  </div>
</section>`;
}

function gaps() {
  return `
<section id="thieu">
  <h2>Mẫu từng thiếu — nay đã bổ sung</h2>
  <p class="sub">Tài liệu gốc ghi rõ 5 biểu mẫu này "chưa có". Nhóm <b>Mẫu còn thiếu</b> ở cột phải đã lấp khoảng trống theo chuẩn quốc tế (Spec Kit, ISO 29119, Google SRE, Keep a Changelog…).</p>
  <div class="tw">
    <table>
      <thead><tr><th>Bước</th><th>Tài liệu gốc ghi thiếu</th><th>Đã bổ sung bằng</th></tr></thead>
      <tbody>
        ${d.gaps.map((g) => {
          const map = {
            B4: ['spec', 'GitHub Spec Kit spec-template (User Scenarios, Requirements, Success Criteria)'],
            B6: ['plan', 'plan-template của Spec Kit + C4 Model / Structurizr'],
            B10: ['code-review-human', 'Google eng-practices Code Review Standard'],
            B11: ['test-plan', 'ISO/IEC/IEEE 29119-3 Test Plan + RTM'],
            B14: ['runbook', 'Google SRE — Runbook & blameless Post-mortem'],
          };
          const [id, by] = map[g.at] || [null, '—'];
          const f = id ? fileById[id] : null;
          return `<tr><td><b>${esc(g.at)}</b></td><td>${esc(g.what)}</td><td>${esc(by)}${f ? ` — <a href="/mau/${f.id}.html">xem file</a>` : ''}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
</section>`;
}

function assets() {
  return `
<section id="tai-lieu">
  <h2>Tài liệu gốc & bộ file mẫu</h2>
  <p class="sub">Bản gốc được giữ nguyên, không sửa — mọi nội dung trên site đều trích từ đây.</p>
  <div class="grid2">
    <div class="card">
      <h3>Tài liệu gốc</h3>
      <ul>${d.assets.map((a) => `<li><b>${esc(a.f)}</b> — ${esc(a.d)} (${esc(a.size)})</li>`).join('')}</ul>
      <div class="links">
        <a href="/assets/quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.pdf" download>⬇ Tải PDF gốc (${d.meta.pages} trang)</a>
        <a href="/assets/quy-trinh-phat-trien-phan-mem-tich-hop-ai-v5.9.txt" target="_blank" rel="noopener">Xem bản text</a>
      </div>
    </div>
    <div class="card">
      <h3>Bộ file mẫu (${allFiles.length} file .md)</h3>
      <ul>
        <li>Viết lại từ tài liệu gốc + chuẩn quốc tế (Spec Kit, MADR, BABOK, BPMN, ISO 29119, OWASP ASVS/LLM Top 10, Google SRE, Keep a Changelog…).</li>
        <li>Copy vào repo dự án là dùng được — chỉ cần điền placeholder.</li>
        <li>Mỗi file có phần "Nguồn tham chiếu" ở cuối.</li>
      </ul>
      <div class="links">
        <a href="/mau/index.html">Xem tất cả ${allFiles.length} mẫu →</a>
        <a href="/assets/mau/AI-SDLC-mau-tat-ca.zip" download>⬇ Tải .zip toàn bộ</a>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- trang mẫu ---------- */
function templatePage(f) {
  const group = registry.groups.find((g) => g.id === f.group);
  const siblings = group.files.map((x) => fileById[x.id]).filter((x) => x && !x.missing);
  const idx = siblings.findIndex((x) => x.id === f.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const body = f.missing
    ? `<div class="tpl-head">
    <div class="crumb"><a href="/index.html">Trang chủ</a> / <a href="/mau/index.html">File mẫu</a> / ${esc(f.title)}</div>
    <h1>${esc(f.title)}</h1>
    <div class="tpl-meta">
      <span class="chip">Dùng ở: <b>${esc(f.for)}</b></span>
      <span class="chip">Nhóm: <b>${esc(f.groupTitle)}</b></span>
    </div>
    <div class="warn" style="margin-top:16px">File này đang được tổng hợp. Quay lại sau ít phút hoặc tải khi hoàn tất.</div>
  </div>`
    : (() => {
        const { meta, html } = mdToHtml(f.md, { headingOffset: 1 });
        const chips = [
          meta.for ? `<span class="chip">Dùng ở: <b>${esc(meta.for)}</b></span>` : '',
          meta.owner ? `<span class="chip">Chủ sở hữu: <b>${esc(meta.owner)}</b></span>` : '',
          meta.nguồn ? `<span class="chip">Nguồn: <b>${esc(meta.nguồn)}</b></span>` : '',
          `<span class="chip">${f.lines} dòng</span>`,
        ].filter(Boolean).join('');
        return `<div class="tpl-head">
    <div class="crumb"><a href="/index.html">Trang chủ</a> / <a href="/mau/index.html">File mẫu</a> / ${esc(f.title)}</div>
    <h1>${esc(f.title)}</h1>
    <div class="tpl-meta">${chips}</div>
    <div class="links" style="margin-top:14px">
      <a href="/mau/raw/${esc(f.file)}" download>⬇ Tải file .md</a>
      <a href="/mau/raw/${esc(f.file)}" target="_blank" rel="noopener">Xem raw</a>
      <a href="/assets/mau/AI-SDLC-mau-tat-ca.zip" download>⬇ Cả bộ .zip</a>
    </div>
  </div>
  <article class="md">${html}</article>
  <nav class="pager">
    ${prev ? `<a class="pg prev" href="/mau/${prev.id}.html"><span>← Trước</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
    ${next ? `<a class="pg next" href="/mau/${next.id}.html"><span>Sau →</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
  </nav>`;
      })();

  return shell({ title: `${f.title} — AI-SDLC v${d.meta.version}`, body, activeFile: f.id });
}

function templateIndex() {
  const body = `
<section id="top">
  <div class="hero-in" style="padding:8px 0 32px">
    <span class="badge"><i></i> ${present.length}/${allFiles.length} file đã sẵn sàng</span>
    <h1 style="margin-bottom:10px">Bộ file mẫu AI-SDLC</h1>
    <p class="lede">Toàn bộ biểu mẫu, quy định và quy chuẩn của quy trình — viết lại thành <code>.md</code> để copy thẳng vào repo dự án. Tổng hợp từ tài liệu gốc v5.9 và các chuẩn quốc tế (GitHub Spec Kit, MADR, BABOK v3, BPMN 2.0, ISO/IEC/IEEE 29119, OWASP ASVS &amp; LLM Top 10, Google SRE, Keep a Changelog, Conventional Commits…).</p>
    <div class="links" style="margin-top:14px">
      <a href="/assets/mau/AI-SDLC-mau-tat-ca.zip" download>⬇ Tải toàn bộ (.zip)</a>
      <a href="/index.html">← Về trang quy trình</a>
    </div>
  </div>
  ${registry.groups.map((g) => `
  <div class="card" style="margin-bottom:14px">
    <h3>${esc(g.title)}</h3>
    <p class="note">${esc(g.note)}</p>
    <div class="tw" style="margin-top:10px">
      <table>
        <thead><tr><th>File</th><th>Dùng ở</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${g.files.map((x) => {
            const f = fileById[x.id];
            return `<tr>
              <td><b><a href="/mau/${f.id}.html">${esc(f.title)}</a></b><br><span class="note">${esc(f.file)}</span></td>
              <td>${esc(f.for)}</td>
              <td>${esc(f.desc)}</td>
              <td>${f.missing ? '<span class="pending">đang cập nhật</span>' : `${f.lines} dòng`}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`).join('')}
</section>`;
  return shell({ title: `Bộ file mẫu — AI-SDLC v${d.meta.version}`, body, activeFile: null });
}

/* ---------- ghi ra đĩa ---------- */
fs.mkdirSync(path.join(PUB, 'mau'), { recursive: true });
fs.mkdirSync(path.join(PUB, 'mau/raw'), { recursive: true });

const mainHtml = shell({
  title: `AI-SDLC v${d.meta.version} — ${d.meta.tagline} | btdat.io.vn`,
  body: hero() + pipeline() + gates() + aiLaw() + b2() + bugs() + release() + forms() + kpi() + gaps() + assets() + modalLayer(),
});
fs.writeFileSync(path.join(PUB, 'index.html'), mainHtml, 'utf8');
fs.writeFileSync(path.join(PUB, 'mau/index.html'), templateIndex(), 'utf8');

let wrote = 0;
for (const f of allFiles) {
  fs.writeFileSync(path.join(PUB, 'mau', `${f.id}.html`), templatePage(f), 'utf8');
  if (!f.missing) {
    const rawDir = path.join(PUB, 'mau/raw', path.dirname(f.file));
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(path.join(PUB, 'mau/raw', f.file), f.md, 'utf8');
    wrote++;
  }
}
if (missingCount) console.log(`  chưa có: ${allFiles.filter((f) => f.missing).map((f) => f.file).join(', ')}`);

/* ---------- đóng gói .zip toàn bộ file mẫu ---------- */
const { zipFolder } = require('./zip');
const zipEntries = zipFolder(path.join(__dirname, 'templates'), path.join(PUB, 'assets/mau/AI-SDLC-mau-tat-ca.zip'), { rootName: 'AI-SDLC-mau' });
const zipSize = fs.statSync(path.join(PUB, 'assets/mau/AI-SDLC-mau-tat-ca.zip')).size;
console.log(`  AI-SDLC-mau-tat-ca.zip: ${zipEntries} file · ${(zipSize / 1024).toFixed(1)} KB`);


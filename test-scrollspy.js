'use strict';
/**
 * Test scroll-spy trên site AI-SDLC bằng Chrome headless + CDP.
 * Kiểm: khi cuộn tới từng bước (B1..B14) / từng mục, menu trái + menu ngang
 * có highlight đúng mục đó không.
 * Chạy: node test-scrollspy.js
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9000 + Math.floor(Math.random() * 900);
const URL = process.argv[2] || 'http://localhost:3200/';
const PROFILE = path.join(os.tmpdir(), 'cdp-scrollspy-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--window-size=1440,900',
    '--disable-gpu', '--remote-allow-origins=*', 'about:blank',
  ], { stdio: 'ignore' });

  let ver = null;
  for (let i = 0; i < 40; i++) {
    try { ver = await getJSON('/json/version'); break; } catch { await sleep(500); }
  }
  if (!ver) { console.error('❌ Không kết nối được Chrome CDP'); chrome.kill(); process.exit(1); }
  console.log('✅ Chrome CDP sẵn sàng:', ver['Browser']);

  const WebSocket = globalThis.WebSocket; // Node >= 22 có sẵn, không cần thư viện
  const tabs = await getJSON('/json/list');
  let target = tabs.find((t) => t.type === 'page');
  // Chrome đôi khi trả URL devtools không kèm port -> thêm vào cho chắc
  let wsUrl = target.webSocketDebuggerUrl;
  if (!/:\d+/.test(wsUrl.replace('ws://', ''))) {
    wsUrl = wsUrl.replace(/^ws:\/\/([^/]+)/, `ws://$1:${PORT}`);
  }
  console.log('  CDP target:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = (e) => j(new Error('ws lỗi: ' + (e.message || e.type))); });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    return r.result && r.result.result && r.result.result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: URL });
  await sleep(2500);

  const errs = await evalJs(`(() => { window.__errs = window.__errs || []; return 0; })()`);
  const hasScript = await evalJs(`document.querySelectorAll('script').length`);
  console.log('  số thẻ <script> trên trang:', hasScript);

  const active = () => evalJs(`(() => {
    const step = document.querySelector('.tree li.on');
    const nav = document.querySelector('.nav-links a.on');
    return JSON.stringify({
      step: step ? (step.dataset.step || step.textContent.trim().slice(0,30)) : null,
      nav: nav ? (nav.dataset.sec || nav.textContent.trim().slice(0,30)) : null,
    });
  })()`);

  console.log('\n=== 1. Trạng thái ban đầu (chưa cuộn) ===');
  console.log('  ', await active());

  console.log('\n=== 2. Cuộn tới từng bước B1..B14 ===');
  const results = [];
  for (let i = 1; i <= 14; i++) {
    const code = 'b' + i;
    await evalJs(`(() => {
      const el = document.getElementById('${code}');
      if (el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant'});
      return !!el;
    })()`);
    await sleep(320);
    const a = JSON.parse(await active());
    const hit = a.step === code;
    results.push({ code, got: a.step, ok: hit });
    console.log(`   ${hit ? '✅' : '❌'} cuộn tới ${code}  ->  menu highlight: ${a.step}`);
  }

  console.log('\n=== 3. Cuộn tới từng mục (menu ngang) ===');
  for (const sec of ['quy-trinh','gate','luat-ai','bo-tai-lieu-b2','bug','release','bieu-mau','kpi','thieu','tai-lieu']) {
    await evalJs(`(() => {
      const el = document.getElementById('${sec}');
      if (el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant'});
      return !!el;
    })()`);
    await sleep(320);
    const a = JSON.parse(await active());
    const ok = a.nav === sec;
    console.log(`   ${ok ? '✅' : '❌'} cuộn tới #${sec}  ->  menu ngang: ${a.nav}`);
  }

  console.log('\n=== 4. Cuộn xuống cuối trang ===');
  await evalJs(`window.scrollTo({top: document.body.scrollHeight, behavior: 'instant'})`);
  await sleep(400);
  console.log('  ', await active());

  const failStep = results.filter((r) => !r.ok).length;
  console.log(`\n=== KẾT QUẢ: ${14 - failStep}/14 bước highlight đúng ===`);

  ws.close(); chrome.kill();
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  // Không dùng process.exit() — trên Windows nó cắt mất stdout chưa flush.
  process.exitCode = failStep ? 1 : 0;
})();

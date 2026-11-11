'use strict';
// Số liệu tổng hợp cho trang Báo cáo — hàm thuần, không đọc file.
// Mốc thời gian thật của bước (startedAt / doneAt) chỉ có từ bản này trở đi; dữ liệu cũ không có thì không tính vào thời gian.
// Tích hợp: 4 chỉ số DORA, Cycle Time 5 giai đoạn, phát hiện Điểm nghẽn (Bottlenecks) & Hệ số tăng tốc AI.
const { summarize } = require('./progress');

const DAY = 86400000;
const days = (a, b) => Math.max(0, Math.round(((Date.parse(b) - Date.parse(a)) / DAY) * 10) / 10);
const avg = (xs) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
};
const ymd = (d) => d.toISOString().slice(0, 10);

const tracksOf = (p) => [['base', 'Nền tảng', p.base], ...p.items.filter((i) => !i.archived).map((i) => [i.id, i.name, i])];

// audit: các dòng nhật ký (mới → cũ), dùng để đếm lịch sử ký gate (trạng thái hiện tại chỉ giữ lần ký cuối)
function buildMetrics(PROC, projects, users, audit = [], now = new Date()) {
  const today = ymd(now);
  const live = projects.filter((p) => !p.archived);
  const ids = new Set(live.map((p) => p.id));
  const nameOf = (id) => users.find((u) => u.id === id)?.name || '?';

  const stepAgg = Object.fromEntries(PROC.steps.map((s) => [s.code, { code: s.code, name: s.name, durs: [] }]));
  const gateAgg = Object.fromEntries(PROC.gates.map((g) => [g.key, { key: g.key, id: g.id, signed: 0, pass: 0, fail: 0, waits: [] }]));
  const load = new Map();
  const overdue = [];
  const projectRows = [];
  const kinds = { full: 0, cr: 0, fast: 0 };
  const bugs = { total: 0, open: 0, closed: 0, bySeverity: { S1: 0, S2: 0, S3: 0, S4: 0 }, byStatus: { open: 0, in_progress: 0, closed: 0 } };
  const ai = { total: 0, byOrigin: { ai: 0, mixed: 0, manual: 0 }, byResult: { pending: 0, accepted: 0, edited: 0, rejected: 0, na: 0 }, tools: {}, oldestPendingDays: 0 };
  let tracks = 0, done = 0;

  // Dữ liệu cho DORA & Cycle Time
  const leadTimes = []; // Thời gian từ Spec (Gate 1 / B3) đến Hoàn thành (B13 / Gate 5)
  const bugResolveTimes = []; // MTTR: Thời gian đóng bug S1/S2
  const releasesCount = { total: 0, withBugs: 0 };
  const aiStepDurs = [];
  const manualStepDurs = [];

  for (const p of live) {
    const row = { id: p.id, name: p.name, tracks: 0, active: 0, done: 0, overdue: 0, aiPending: 0, pct: 0 };
    let pctSum = 0;

    // Lọc bug của dự án này để kiểm tra đợt release có bug không
    const pBugs = p.bugs || [];

    for (const [tid, tname, t] of tracksOf(p)) {
      const s = summarize(PROC, t);
      row.tracks++; pctSum += s.pct;
      if (tid !== 'base') kinds[t.kind] = (kinds[t.kind] || 0) + 1;
      if (s.current) row.active++; else row.done++;

      // Kiểm tra đợt hoàn thành hạng mục (Release)
      const isReleased = t.steps.B13?.status === 'done' || t.gates.g5?.result === 'pass' || !s.current;
      if (isReleased && tid !== 'base') {
        releasesCount.total++;
        const hasCriticalBug = pBugs.some((b) => b.track === tid && ['S1', 'S2'].includes(b.severity));
        if (hasCriticalBug) releasesCount.withBugs++;
      }

      // Tính Lead Time: từ B3/Gate 1 đến B13/Gate 5
      const startTime = t.gates.g1?.at || t.steps.B3?.startedAt || t.createdAt;
      const endTime = t.gates.g5?.at || t.steps.B13?.doneAt || (!s.current ? t.updatedAt : null);
      if (startTime && endTime) {
        leadTimes.push(days(startTime, endTime));
      }

      // Kiểm tra xem bước có dùng AI không
      const hasAiInTrack = (code) => (p.aiLogs || []).some((l) => l.track === tid && l.step === code && l.origin !== 'manual');

      for (const [code, st] of Object.entries(t.steps)) {
        if (st.startedAt && st.doneAt && stepAgg[code]) {
          const dVal = days(st.startedAt, st.doneAt);
          stepAgg[code].durs.push(dVal);
          if (hasAiInTrack(code)) aiStepDurs.push(dVal); else manualStepDurs.push(dVal);
        }
        const open = !['done', 'skipped'].includes(st.status);
        for (const o of st.owners) {
          const l = load.get(o) || { userId: o, name: nameOf(o), open: 0, overdue: 0 };
          if (open) l.open++;
          if (open && st.end && st.end < today) l.overdue++;
          load.set(o, l);
        }
        if (open && st.end && st.end < today) {
          row.overdue++;
          overdue.push({ project: p.id, projectName: p.name, track: tid, trackName: tname, step: code, end: st.end, late: days(st.end, today), owners: st.owners.map(nameOf) });
        }
      }
      // thời gian chờ ký: từ lúc bước chứa gate xong tới lúc gate được ký Đạt
      for (const g of PROC.gates) {
        const gs = t.gates[g.key], at = t.steps[g.at];
        if (gs && gs.result === 'pass' && gs.at && at?.doneAt) gateAgg[g.key].waits.push(days(at.doneAt, gs.at));
      }
    }
    row.pct = row.tracks ? Math.round(pctSum / row.tracks) : 0;
    for (const l of p.aiLogs || []) {
      ai.total++;
      ai.byOrigin[l.origin] = (ai.byOrigin[l.origin] || 0) + 1;
      ai.byResult[l.result] = (ai.byResult[l.result] || 0) + 1;
      if (l.tool) {
        const x = ai.tools[l.tool] || (ai.tools[l.tool] = { tool: l.tool, n: 0, rejected: 0, edited: 0 });
        x.n++;
        if (l.result === 'rejected') x.rejected++;
        if (l.result === 'edited') x.edited++;
      }
      if (l.result === 'pending') { row.aiPending++; ai.oldestPendingDays = Math.max(ai.oldestPendingDays, days(l.at, now.toISOString())); }
    }
    for (const b of pBugs) {
      bugs.total++;
      if (b.status === 'closed') {
        bugs.closed++;
        if (b.createdAt && b.closedAt && ['S1', 'S2'].includes(b.severity)) {
          bugResolveTimes.push(days(b.createdAt, b.closedAt));
        }
      } else {
        bugs.open++;
      }
      if (b.severity && bugs.bySeverity[b.severity] !== undefined) bugs.bySeverity[b.severity]++;
      if (b.status && bugs.byStatus[b.status] !== undefined) bugs.byStatus[b.status]++;
    }
    tracks += row.tracks; done += row.done;
    projectRows.push(row);
  }

  // lịch sử ký gate từ nhật ký: "Ký Gate 1 [tên hạng mục]" + chi tiết bắt đầu bằng "Đạt" / "Không đạt"
  for (const e of audit) {
    if (!ids.has(e.project) || !e.action?.startsWith('Ký ')) continue;
    const id = /^Ký (.+?) \[/.exec(e.action)?.[1];
    const g = Object.values(gateAgg).find((x) => x.id === id);
    if (!g) continue;
    if (e.detail?.startsWith('Không đạt')) { g.fail++; g.signed++; } else if (e.detail?.startsWith('Đạt')) { g.pass++; g.signed++; }
  }

  const decided = ai.byResult.accepted + ai.byResult.edited + ai.byResult.rejected;

  // Tính 4 chỉ số DORA chuẩn
  const medLeadTime = median(leadTimes);
  const leadLevel = medLeadTime === null ? 'unknown' : medLeadTime <= 1 ? 'elite' : medLeadTime <= 7 ? 'high' : medLeadTime <= 30 ? 'medium' : 'low';

  const depFreqLevel = releasesCount.total >= 10 ? 'elite' : releasesCount.total >= 4 ? 'high' : releasesCount.total >= 1 ? 'medium' : 'low';

  const cfrRate = releasesCount.total > 0 ? Math.round((releasesCount.withBugs / releasesCount.total) * 100) : 0;
  const cfrLevel = cfrRate <= 5 ? 'elite' : cfrRate <= 10 ? 'high' : cfrRate <= 15 ? 'medium' : 'low';

  const medMttr = median(bugResolveTimes);
  const mttrLevel = medMttr === null ? 'unknown' : medMttr <= 1 ? 'elite' : medMttr <= 3 ? 'high' : medMttr <= 7 ? 'medium' : 'low';

  const dora = {
    deploymentFrequency: { count: releasesCount.total, level: depFreqLevel },
    leadTime: { days: medLeadTime, avgDays: avg(leadTimes), level: leadLevel },
    changeFailureRate: { rate: cfrRate, failedCount: releasesCount.withBugs, level: cfrLevel },
    timeToRestore: { days: medMttr, avgDays: avg(bugResolveTimes), count: bugResolveTimes.length, level: mttrLevel },
  };

  // Tính Cycle Time theo 5 giai đoạn
  const phaseCycle = PROC.phases.map((ph) => {
    const durs = ph.steps.flatMap((code) => stepAgg[code]?.durs || []);
    return {
      id: ph.id,
      name: ph.name,
      steps: ph.steps,
      n: durs.length,
      avgDays: avg(durs),
      medianDays: median(durs),
      minDays: durs.length ? Math.min(...durs) : null,
      maxDays: durs.length ? Math.max(...durs) : null,
    };
  });

  // Tăng tốc nhờ AI
  const avgAiDur = avg(aiStepDurs);
  const avgManualDur = avg(manualStepDurs);
  const speedupPct = avgManualDur && avgAiDur && avgManualDur > avgAiDur
    ? Math.round(((avgManualDur - avgAiDur) / avgManualDur) * 100)
    : null;

  // Điểm nghẽn chính (Bottlenecks)
  const gatesSortedWait = Object.values(gateAgg)
    .filter((g) => g.waits.length)
    .map((g) => ({ ...g, avgWait: avg(g.waits) }))
    .sort((a, b) => b.avgWait - a.avgWait);

  const topOverdueSteps = overdue.sort((a, b) => b.late - a.late).slice(0, 10);

  return {
    generatedAt: now.toISOString(),
    totals: { projects: live.length, tracks, done, active: tracks - done, overdue: overdue.length, kinds, bugs },
    steps: Object.values(stepAgg).filter((s) => s.durs.length).map((s) => ({
      code: s.code,
      name: s.name,
      n: s.durs.length,
      avgDays: avg(s.durs),
      medianDays: median(s.durs),
      maxDays: Math.max(...s.durs),
    })),
    gates: Object.values(gateAgg).filter((g) => g.signed).map((g) => ({
      key: g.key,
      id: g.id,
      signed: g.signed,
      pass: g.pass,
      fail: g.fail,
      failRate: g.signed ? Math.round((g.fail / g.signed) * 100) : 0,
      avgWaitDays: avg(g.waits),
    })),
    ai: {
      total: ai.total, byOrigin: ai.byOrigin, byResult: ai.byResult, decided,
      rejectRate: decided ? Math.round((ai.byResult.rejected / decided) * 100) : null,
      editRate: decided ? Math.round((ai.byResult.edited / decided) * 100) : null,
      oldestPendingDays: ai.oldestPendingDays, tools: Object.values(ai.tools).sort((a, b) => b.n - a.n),
    },
    dora,
    cycleTime: {
      phases: phaseCycle,
      totalLeadTimeMedian: medLeadTime,
    },
    aiAcceleration: {
      avgAiDur,
      avgManualDur,
      speedupPct,
      aiStepsCount: aiStepDurs.length,
      manualStepsCount: manualStepDurs.length,
    },
    bottlenecks: {
      longestWaitGate: gatesSortedWait[0] || null,
      topOverdueSteps,
      oldestPendingAiDays: ai.oldestPendingDays,
    },
    overdue: overdue.sort((a, b) => b.late - a.late).slice(0, 50),
    load: [...load.values()].filter((l) => l.open).sort((a, b) => b.overdue - a.overdue || b.open - a.open),
    projects: projectRows,
  };
}

module.exports = { buildMetrics };

// Kiểu dữ liệu trả về từ API (lib/api.js)
export type StepStatus = 'todo' | 'doing' | 'done' | 'skipped';
export type GateResult = 'pending' | 'pass' | 'fail';
export type Kind = 'full' | 'cr' | 'fast';
export type Scope = 'shared' | 'cumulative' | 'feature' | 'event';
export type Role = 'PM' | 'BA' | 'PO' | 'TechLead' | 'Dev' | 'Test' | 'Security' | 'DevOps';
export type AiOrigin = 'ai' | 'mixed' | 'manual';
export type AiResult = 'pending' | 'accepted' | 'edited' | 'rejected' | 'na';
export type DataLevel = '' | 'public' | 'internal' | 'confidential' | 'restricted';
export type RepoType = 'gitlab' | 'github';
export type BugSeverity = 'S1' | 'S2' | 'S3' | 'S4';
export type BugStatus = 'open' | 'fixing' | 'closed';

export interface User { id: string; username: string; name: string; admin: boolean; disabled: boolean }

export interface Template { id: string; title: string; scope: Scope; path: string | null; required: boolean }
export interface Row { name: string; who: string; how: string; note: string; form: string }
export interface ProcStep { code: string; name: string; phase: string; gate: string; out: string; ai: string; rows: Row[]; templates: Template[] }
export interface ProcGate { key: string; id: string; at: string; owner: string; check: string; after: string; requires?: string[]; roles: Role[] }
export interface ProcPrompt { id: string; step: string; title: string; template?: string }
export interface FastQuestion { key: 'small' | 'sensitive' | 'model'; label: string; must: boolean }
export interface Process {
  version: string; site: string; baseSteps: string[]; fastTrack: string; fastTrackSkip: string[];
  phases: { id: string; name: string; steps: string[] }[];
  roles: { key: Role; label: string }[];
  prompts: ProcPrompt[];
  steps: ProcStep[]; gates: ProcGate[]; fastQuestions: FastQuestion[];
  labels: {
    STATUS: Record<StepStatus, string>; GATE_RESULT: Record<GateResult, string>; KIND: Record<Kind, string>;
    AI_ORIGIN: Record<AiOrigin, string>; AI_RESULT: Record<AiResult, string>; DATA_LEVEL: Record<Exclude<DataLevel, ''>, string>;
    BUG_SEVERITY: Record<BugSeverity, string>; BUG_STATUS: Record<BugStatus, string>;
  };
}

export interface StepState { status: StepStatus; owners: string[]; owner?: string; start: string; end: string; note: string; checks: boolean[] }
export interface GateState { result: GateResult; by: string; at: string; note: string }
export interface Track { steps: Record<string, StepState>; gates: Record<string, GateState> }
export interface Item extends Track {
  id: string; name: string; kind: Kind; ref: string; specDir: string; crCode: string; crReason: string;
  fastCheck?: Record<FastQuestion['key'], boolean>; archived: boolean; createdAt: string;
}
export interface DocRevision {
  revId: string;
  at: string;
  by: string;
  byName: string;
  size: number;
  note?: string;
}

export interface Doc {
  id: string; track: string; step: string; templateId: string; label: string; url: string;
  file: { name: string; size: number; type: string } | null; byName: string; at: string;
  revisions?: DocRevision[];
  lastNote?: string;
}
export interface Member { userId: string; roles: Role[] }
export interface Bug {
  id: string; code: string; track: string; step: string; title: string;
  severity: BugSeverity; status: BugStatus; note?: string;
  foundBy: string; foundByName: string; fixBy?: string; fixByName?: string;
  createdAt: string; closedAt?: string | null; closedBy?: string;
}
export interface AiLog {
  id: string; track: string; step: string; tool: string; model: string; purpose: string; promptId: string; origin: AiOrigin;
  result: AiResult; note: string; by: string; byName: string; at: string;
  reviewer?: string; reviewerName?: string; reviewedAt?: string; reviewNote?: string;
}
export interface MissingDoc { step: string; id: string; title: string }
export interface GateView { applies: boolean; blocker: string | null; roleBlocker: string | null; pendingAi: number; missingDocs: MissingDoc[] }
export interface TrackView {
  pct: number; current: string | null; blocking: string | null; failed: string[];
  stepPct: Record<string, number>; stepMissing: Record<string, MissingDoc[]>; gates: Record<string, GateView>;
  canEditStep?: Record<string, boolean>;
  bugs?: { total: number; open: number; openS1S2: number };
}
export interface Project {
  id: string; name: string; code: string; description: string; repoUrl: string; branch: string; repoType: RepoType;
  visibility?: 'public' | 'private';
  processVersion: string; archived: boolean; createdAt: string; updatedAt: string;
  base: Track; items: Item[]; docs: Doc[]; bugs: Bug[]; members: Member[]; aiSetup: { tools: string[]; dataLevel: DataLevel }; aiLogs: AiLog[];
  view: {
    base: TrackView; items: Record<string, TrackView>;
    setup: { ready: boolean; missing: string[] };
    me: {
      roles: Role[];
      enforced: boolean;
      canManage: boolean;
      canSetup: boolean;
      canCreateItem?: boolean;
      canManageItems?: boolean;
      isMember?: boolean;
    };
  };
}
export interface LogEntry { at: string; user: string; action: string; detail: string }

export interface TaskWhere { project: string; projectName: string; track: string; trackName: string }
export interface MyTasks {
  steps: (TaskWhere & { step: string; stepName: string; status: StepStatus; pct: number; end: string })[];
  gates: (TaskWhere & { gate: string; gateId: string; at: string; check: string; result: GateResult })[];
  reviews: (TaskWhere & { id: string; step: string; tool: string; purpose: string; byName: string; at: string })[];
}

// Telegram
export interface TgEvents { assign: boolean; gateWaiting: boolean; gateFail: boolean; aiReview: boolean; digest: boolean }
export interface TgAdminView {
  configured: boolean; tokenHint: string; bot: { id: number; username: string; name: string } | null; running: boolean; error: string;
  settings: { enabled: boolean; chatId: string; publicUrl: string; digestTime: string; events: TgEvents; seenChats: { id: string; title: string }[] };
  users: { id: string; name: string; username: string; disabled: boolean; linked: boolean; tgUsername: string }[];
}
export interface TgMine { available: boolean; botUsername: string; linked: boolean; tgUsername: string }

export type DoraLevel = 'elite' | 'high' | 'medium' | 'low' | 'unknown';

export interface DoraMetrics {
  deploymentFrequency: { count: number; level: DoraLevel };
  leadTime: { days: number | null; avgDays: number | null; level: DoraLevel };
  changeFailureRate: { rate: number; failedCount: number; level: DoraLevel };
  timeToRestore: { days: number | null; avgDays: number | null; count: number; level: DoraLevel };
}

export interface PhaseCycle {
  id: string;
  name: string;
  steps: string[];
  n: number;
  avgDays: number | null;
  medianDays: number | null;
  minDays: number | null;
  maxDays: number | null;
}

// Báo cáo & số liệu
export interface Metrics {
  generatedAt: string;
  totals: {
    projects: number;
    tracks: number;
    done: number;
    active: number;
    overdue: number;
    kinds: Record<string, number>;
    bugs?: {
      total: number;
      open: number;
      closed: number;
      bySeverity: { S1: number; S2: number; S3: number; S4: number };
      byStatus: { open: number; in_progress: number; closed: number };
    };
  };
  steps: { code: string; name: string; n: number; avgDays: number | null; medianDays?: number | null; maxDays: number }[];
  gates: { key: string; id: string; signed: number; pass: number; fail: number; failRate: number; avgWaitDays: number | null }[];
  ai: {
    total: number; byOrigin: Record<string, number>; byResult: Record<string, number>; decided: number;
    rejectRate: number | null; editRate: number | null; oldestPendingDays: number; tools: { tool: string; n: number; rejected: number; edited: number }[];
  };
  dora?: DoraMetrics;
  cycleTime?: {
    phases: PhaseCycle[];
    totalLeadTimeMedian: number | null;
  };
  aiAcceleration?: {
    avgAiDur: number | null;
    avgManualDur: number | null;
    speedupPct: number | null;
    aiStepsCount: number;
    manualStepsCount: number;
  };
  bottlenecks?: {
    longestWaitGate: { key: string; id: string; avgWait: number | null } | null;
    topOverdueSteps: { project: string; projectName: string; track: string; trackName: string; step: string; end: string; late: number; owners: string[] }[];
    oldestPendingAiDays: number;
  };
  overdue: { project: string; projectName: string; track: string; trackName: string; step: string; end: string; late: number; owners: string[] }[];
  load: { userId: string; name: string; open: number; overdue: number }[];
  projects: { id: string; name: string; tracks: number; active: number; done: number; overdue: number; aiPending: number; pct: number }[];
}

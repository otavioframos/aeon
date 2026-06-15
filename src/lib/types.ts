export type EntryType = 'in' | 'out';
export type Scope = 'month' | 'year';
export type RankMode = 'cat' | 'group';
export type SafetyLevel = 'green' | 'yellow' | 'red';

export interface Category {
  id: string;
  name: string;
  icon: string;
  group: string;
}

export interface Entry {
  id: string;
  amount: number;
  type: EntryType;
  cat: string;
  desc: string;
}

export interface DatedEntry extends Entry {
  _y: number;
  _m: number;
  _d: number;
}

export type LedgerData = Record<string, Entry[]>;

export interface Settings {
  salary: number;
  essenciais: number;
  desejos: number;
  investimentos: number;
  dotSpacing: number;
  dotSize: number;
  dotOpacity: number;
  waveIntensity: number;
  waveRadius: number;
  noise: number;
}

export interface Aggregate {
  inc: number;
  exp: number;
  net: number;
  byCat: Record<string, number>;
  byGroup: Record<string, number>;
}

export interface RankItem {
  k: string;
  v: number;
  name: string;
  icon: string;
  pct: number;
  width: number;
  delta: string;
  deltaClass: 'up' | 'down';
}

export interface ReserveModel {
  areaPath: string;
  beLabel: string;
  beX: number | null;
  height: number;
  horizon: number;
  linePath: string;
  monthlyAport: number;
  padL: number;
  padR: number;
  pctOfTarget: number;
  reserveTotal: number;
  runway: number;
  runwayColor: string;
  runwayLabel: string;
  target: number;
  targetY: number;
  width: number;
}

export interface TrendRow {
  month: string;
  incPct: number;
  expPct: number;
  current: boolean;
}

export interface HeatCell {
  day: number;
  value: number;
  background: string;
  blank: boolean;
}

export interface AllocationSegment {
  length: number;
  offset: number;
  color: string;
  group: string;
  pct: number;
}

export interface AllocationModel {
  investmentPct: number;
  segments: AllocationSegment[];
}

export interface HeroModel {
  burn: number;
  budget: number;
  dayLabel: string;
  markerPos: number;
  pacePct: number;
  projected: number;
  savings: number;
  levelColor: string;
}

export interface BackupPayload {
  year?: number;
  data?: LedgerData;
  settings?: Partial<Settings>;
  exportedAt?: string;
}

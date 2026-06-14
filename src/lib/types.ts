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

export interface BackupPayload {
  year?: number;
  data?: LedgerData;
  settings?: Partial<Settings>;
  exportedAt?: string;
}

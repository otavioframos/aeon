import { catById } from './categories';
import type { Aggregate, DatedEntry, LedgerData, SafetyLevel, Settings } from './types';

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];
export const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const DEFAULT_SETTINGS: Settings = {
  currentBalance: 0,
  balanceAnchorAt: undefined,
  cycleStartDay: 20,
  cycleWeekendRule: 'previousBusinessDay',
  cycleStartOverrides: [],
  salary: 7000,
  essenciais: 50,
  desejos: 20,
  investimentos: 30,
  accentColor: '#247E5C',
  dotSpacing: 22,
  dotSize: 1.6,
  dotOpacity: 0.34,
  waveIntensity: 9,
  waveRadius: 230,
  noise: 0.05
};

export function fmt(n: number) {
  const s = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '−' : ''}R$ ${s}`;
}

export function fmtShort(n: number) {
  const a = Math.abs(n);
  let s;
  if (a >= 1000) {
    s = `R$ ${(a / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  } else {
    s = `R$ ${a.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  }
  return `${n < 0 ? '−' : ''}${s}`;
}

export function fmtNum(n: number) {
  return `${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function key(y: number, m: number, d: number) {
  return `${y}-${m}-${d}`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function daysInYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function entriesIn(data: LedgerData, fn: (year: number, month: number, day: number) => boolean) {
  const out: DatedEntry[] = [];
  for (const k in data) {
    const p = k.split('-').map(Number);
    if (fn(p[0], p[1], p[2])) {
      data[k].forEach((entry) => out.push({ _y: p[0], _m: p[1], _d: p[2], ...entry }));
    }
  }
  return out;
}

export function aggregate(list: DatedEntry[] | LedgerData[keyof LedgerData]): Aggregate {
  let inc = 0;
  let exp = 0;
  const byCat: Record<string, number> = {};
  const byGroup: Record<string, number> = {};

  list.forEach((entry) => {
    if (entry.type === 'in') {
      inc += entry.amount;
      return;
    }

    exp += entry.amount;
    const category = catById(entry.cat);
    const cid = entry.cat || 'outros';
    byCat[cid] = (byCat[cid] || 0) + entry.amount;
    const group = category?.group || 'Outros';
    byGroup[group] = (byGroup[group] || 0) + entry.amount;
  });

  return { inc, exp, net: inc - exp, byCat, byGroup };
}

export function monthAgg(data: LedgerData, year: number, month: number) {
  return aggregate(entriesIn(data, (y, m) => y === year && m === month));
}

export function monthSafetyLevel(exp: number, settings: Settings): SafetyLevel {
  if (settings.salary <= 0) return 'green';
  const spend = (exp / settings.salary) * 100;
  const green = settings.essenciais + settings.desejos;
  if (spend <= green) return 'green';
  return spend <= 100 ? 'yellow' : 'red';
}

export function parseAmount(value: string) {
  const raw = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(raw);
}

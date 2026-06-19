import { daysInMonth } from './finance';
import { dateIndex } from './transactions';
import type { CashCycle, Settings } from './types';

const DAY_MS = 86400000;

function clampDay(value: number | undefined) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(31, Math.round(Number(value))));
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

export function isoDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
  return parsed;
}

function adjustedNominalStart(year: number, month: number, settings: Settings) {
  const day = Math.min(clampDay(settings.cycleStartDay), daysInMonth(year, month));
  const rule = settings.cycleWeekendRule || 'fixedDay';
  const candidate = new Date(year, month, day);
  const weekday = candidate.getDay();

  if (rule === 'previousBusinessDay') {
    if (weekday === 6) return addDays(candidate, -1);
    if (weekday === 0) return addDays(candidate, -2);
  }

  if (rule === 'nextBusinessDay') {
    if (weekday === 6) return addDays(candidate, 2);
    if (weekday === 0) return addDays(candidate, 1);
  }

  return candidate;
}

function cycleStartCandidates(settings: Settings, now: Date) {
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  const overrides = (settings.cycleStartOverrides || []).map(parseISODate).filter(Boolean) as Date[];
  const nominal = Array.from({ length: 8 }, (_, index) => adjustedNominalStart(addMonths(base, index - 3).getFullYear(), addMonths(base, index - 3).getMonth(), settings));
  const effectiveNominal = nominal.filter((candidate) => {
    return !overrides.some((override) => Math.abs(dateOnly(candidate).getTime() - dateOnly(override).getTime()) / DAY_MS <= 3);
  });
  const unique = new Map<string, Date>();
  effectiveNominal.concat(overrides).forEach((candidate) => unique.set(isoDate(candidate), dateOnly(candidate)));
  return [...unique.values()].sort((a, b) => a.getTime() - b.getTime());
}

export function currentCashCycle(settings: Settings, now = new Date()): CashCycle {
  const today = dateOnly(now);
  const candidates = cycleStartCandidates(settings, today);
  const start = [...candidates].reverse().find((candidate) => candidate.getTime() <= today.getTime()) || candidates[0] || today;
  const next = candidates.find((candidate) => candidate.getTime() > start.getTime()) || adjustedNominalStart(start.getFullYear(), start.getMonth() + 1, settings);
  const end = addDays(next, -1);
  const startIndex = dateIndex(start.getFullYear(), start.getMonth(), start.getDate());
  const endIndex = dateIndex(end.getFullYear(), end.getMonth(), end.getDate());
  const todayIndex = dateIndex(today.getFullYear(), today.getMonth(), today.getDate());
  return {
    start: isoDate(start),
    end: isoDate(end),
    startIndex,
    endIndex,
    elapsedDays: Math.max(1, Math.round((today.getTime() - start.getTime()) / DAY_MS) + 1),
    totalDays: Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1)
  };
}

export function isDateInCycle(year: number, month: number, day: number, cycle: CashCycle) {
  const index = dateIndex(year, month, day);
  return index >= cycle.startIndex && index <= cycle.endIndex;
}

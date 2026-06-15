import { daysInMonth, key, uid } from './finance';
import type { Entry, EntryType, TransactionStatus } from './types';

export interface TransactionDraft {
  totalAmount: number;
  type: EntryType;
  cat: string;
  desc: string;
  purchaseDate: string;
  installmentCount: number;
}

export interface GeneratedTransactionEntry {
  year: number;
  month: number;
  day: number;
  entryKey: string;
  entry: Entry;
}

export function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function datePartsFromISO(value: string) {
  const [rawYear, rawMonth, rawDay] = value.split('-').map(Number);
  const fallback = new Date();
  const year = Number.isFinite(rawYear) ? rawYear : fallback.getFullYear();
  const month = Number.isFinite(rawMonth) ? Math.max(0, Math.min(11, rawMonth - 1)) : fallback.getMonth();
  const maxDay = daysInMonth(year, month);
  const day = Number.isFinite(rawDay) ? Math.max(1, Math.min(maxDay, rawDay)) : fallback.getDate();
  return { year, month, day };
}

export function dateLabel(value: string) {
  const { year, month, day } = datePartsFromISO(value);
  const today = todayISO();
  if (value === today) return 'Today';
  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
}

export function dateIndex(year: number, month: number, day: number) {
  return year * 10000 + (month + 1) * 100 + day;
}

export function statusForDateParts(year: number, month: number, day: number, now = new Date()): TransactionStatus {
  const todayIndex = dateIndex(now.getFullYear(), now.getMonth(), now.getDate());
  return dateIndex(year, month, day) > todayIndex ? 'forecast' : 'realized';
}

export function addMonthsClamped(base: string, offset: number) {
  const { year, month, day } = datePartsFromISO(base);
  const target = new Date(year, month + offset, 1);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return { year: targetYear, month: targetMonth, day: targetDay };
}

export function splitAmount(totalAmount: number, count: number) {
  const safeCount = Math.max(1, Math.floor(count));
  const cents = Math.round(Math.abs(totalAmount) * 100);
  const base = Math.floor(cents / safeCount);
  const remainder = cents % safeCount;
  return Array.from({ length: safeCount }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100);
}

export function buildTransactionEntries(draft: TransactionDraft): GeneratedTransactionEntry[] {
  const installmentCount = Math.max(1, Math.floor(draft.installmentCount || 1));
  const purchaseDate = draft.purchaseDate || todayISO();
  const groupId = installmentCount > 1 ? uid() : undefined;
  const amounts = splitAmount(draft.totalAmount, installmentCount);

  return amounts.map((amount, index) => {
    const target = addMonthsClamped(purchaseDate, index);
    return {
      ...target,
      entryKey: key(target.year, target.month, target.day),
      entry: {
        id: uid(),
        amount,
        type: draft.type,
        cat: draft.cat,
        desc: draft.desc,
        status: statusForDateParts(target.year, target.month, target.day),
        purchaseDate,
        sourceAmount: Math.abs(draft.totalAmount),
        installmentGroupId: groupId,
        installmentIndex: installmentCount > 1 ? index + 1 : undefined,
        installmentCount: installmentCount > 1 ? installmentCount : undefined
      }
    };
  });
}

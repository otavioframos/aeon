import { entriesIn } from './finance';
import { dateIndex } from './transactions';
import type { CashSnapshot, DatedEntry, LedgerData, ProjectionMonth, Settings, TransactionStatus } from './types';

function todayParts(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    index: dateIndex(now.getFullYear(), now.getMonth(), now.getDate())
  };
}

export function resolvedStatus(entry: DatedEntry, now = new Date()): TransactionStatus {
  if (entry.status) return entry.status;
  return dateIndex(entry._y, entry._m, entry._d) > todayParts(now).index ? 'forecast' : 'realized';
}

function isStillDue(entry: DatedEntry, now = new Date()) {
  return resolvedStatus(entry, now) === 'forecast' && dateIndex(entry._y, entry._m, entry._d) >= todayParts(now).index;
}

function addSigned(total: { income: number; expenses: number }, entry: DatedEntry) {
  if (entry.type === 'in') total.income += entry.amount;
  else total.expenses += entry.amount;
}

export function currentMonthCash(data: LedgerData, settings: Settings, now = new Date()): CashSnapshot {
  const today = todayParts(now);
  const totals = { income: 0, expenses: 0 };
  entriesIn(data, (year, month) => year === today.year && month === today.month).forEach((entry) => {
    if (isStillDue(entry, now)) addSigned(totals, entry);
  });

  const realBalance = settings.currentBalance || 0;
  return {
    realBalance,
    expectedIncome: totals.income,
    dueExpenses: totals.expenses,
    freeToSpend: realBalance + totals.income - totals.expenses
  };
}

export function projectionMonths(data: LedgerData, year: number, settings: Settings, now = new Date()): ProjectionMonth[] {
  const today = todayParts(now);
  let rolling = settings.currentBalance || 0;

  return Array.from({ length: 12 }, (_, month) => {
    const active = year > today.year || (year === today.year && month >= today.month);
    const totals = { income: 0, expenses: 0 };

    if (active) {
      entriesIn(data, (entryYear, entryMonth) => entryYear === year && entryMonth === month).forEach((entry) => {
        if (isStillDue(entry, now)) addSigned(totals, entry);
      });
      const opening = rolling;
      rolling = rolling + totals.income - totals.expenses;
      return {
        month,
        opening,
        income: totals.income,
        expenses: totals.expenses,
        closing: rolling,
        active
      };
    }

    return {
      month,
      opening: null,
      income: 0,
      expenses: 0,
      closing: null,
      active
    };
  });
}

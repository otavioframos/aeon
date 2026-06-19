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

function balanceAnchor(settings: Settings) {
  if (!settings.balanceAnchorAt) return null;
  const parsed = new Date(settings.balanceAnchorAt);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return null;
  return {
    time,
    index: dateIndex(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  };
}

function createdTime(entry: DatedEntry) {
  if (entry.createdAt) {
    const parsed = new Date(entry.createdAt).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }

  return createdTimeFromLegacyId(entry.id);
}

function createdTimeFromLegacyId(id: string) {
  const match = id.match(/^[0-9a-z]{8,9}/i);
  if (!match) return null;

  for (const size of [9, 8]) {
    const prefix = match[0].slice(0, size);
    if (prefix.length !== size) continue;
    const parsed = Number.parseInt(prefix, 36);
    if (parsed >= Date.UTC(2020, 0, 1) && parsed <= Date.UTC(2100, 0, 1)) return parsed;
  }

  return null;
}

export function resolvedStatus(entry: DatedEntry, now = new Date()): TransactionStatus {
  if (entry.status) return entry.status;
  return dateIndex(entry._y, entry._m, entry._d) > todayParts(now).index ? 'forecast' : 'realized';
}

function isStillDue(entry: DatedEntry, now = new Date()) {
  return resolvedStatus(entry, now) === 'forecast' && dateIndex(entry._y, entry._m, entry._d) >= todayParts(now).index;
}

function isRealizedExpenseThroughToday(entry: DatedEntry, now = new Date()) {
  const today = todayParts(now);
  return entry.type === 'out' && resolvedStatus(entry, now) === 'realized' && dateIndex(entry._y, entry._m, entry._d) <= today.index;
}

function isRealizedIncomeThroughToday(entry: DatedEntry, now = new Date()) {
  const today = todayParts(now);
  return entry.type === 'in' && resolvedStatus(entry, now) === 'realized' && dateIndex(entry._y, entry._m, entry._d) <= today.index;
}

function isAfterBalanceAnchor(entry: DatedEntry, settings: Settings) {
  const anchor = balanceAnchor(settings);
  if (!anchor) return true;

  const entryCreatedTime = createdTime(entry);
  if (entryCreatedTime) return entryCreatedTime >= anchor.time;

  return dateIndex(entry._y, entry._m, entry._d) > anchor.index;
}

function isPostAnchorRealizedExpense(entry: DatedEntry, settings: Settings, now = new Date()) {
  return isRealizedExpenseThroughToday(entry, now) && isAfterBalanceAnchor(entry, settings);
}

function isPostAnchorRealizedIncome(entry: DatedEntry, settings: Settings, now = new Date()) {
  return isRealizedIncomeThroughToday(entry, now) && isAfterBalanceAnchor(entry, settings);
}

function addSigned(total: { income: number; expenses: number }, entry: DatedEntry) {
  if (entry.type === 'in') total.income += entry.amount;
  else total.expenses += entry.amount;
}

export function currentMonthCash(data: LedgerData, settings: Settings, now = new Date()): CashSnapshot {
  const today = todayParts(now);
  const totals = { income: 0, expenses: 0 };
  let receivedIncome = 0;
  let spentExpenses = 0;
  entriesIn(data, (year, month) => year === today.year && month === today.month).forEach((entry) => {
    if (isStillDue(entry, now)) {
      addSigned(totals, entry);
      return;
    }
    if (isPostAnchorRealizedIncome(entry, settings, now)) receivedIncome += entry.amount;
    if (isPostAnchorRealizedExpense(entry, settings, now)) spentExpenses += entry.amount;
  });

  const realBalance = settings.currentBalance || 0;
  return {
    realBalance,
    receivedIncome,
    spentExpenses,
    expectedIncome: totals.income,
    dueExpenses: totals.expenses,
    freeToSpend: realBalance + receivedIncome - spentExpenses + totals.income - totals.expenses
  };
}

export function projectionMonths(data: LedgerData, year: number, settings: Settings, now = new Date()): ProjectionMonth[] {
  const today = todayParts(now);
  let rolling = settings.currentBalance || 0;

  return Array.from({ length: 12 }, (_, month) => {
    const active = year > today.year || (year === today.year && month >= today.month);
    const totals = { income: 0, expenses: 0 };

    if (active) {
      let receivedIncome = 0;
      let spentExpenses = 0;
      entriesIn(data, (entryYear, entryMonth) => entryYear === year && entryMonth === month).forEach((entry) => {
        if (isStillDue(entry, now)) {
          addSigned(totals, entry);
          return;
        }
        if (year === today.year && month === today.month && isPostAnchorRealizedIncome(entry, settings, now)) {
          receivedIncome += entry.amount;
        }
        if (year === today.year && month === today.month && isPostAnchorRealizedExpense(entry, settings, now)) {
          spentExpenses += entry.amount;
        }
      });
      const opening = rolling;
      rolling = rolling + receivedIncome - spentExpenses + totals.income - totals.expenses;
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

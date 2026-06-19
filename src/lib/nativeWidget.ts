import { Capacitor, registerPlugin } from '@capacitor/core';
import { currentMonthCash, resolvedStatus } from './cashModel';
import { currentCashCycle, isDateInCycle } from './cashCycle';
import { catById } from './categories';
import { daysInMonth, entriesIn } from './finance';
import type { LedgerData, Settings } from './types';

type VelaWidgetPlugin = {
  update(payload: VelaWidgetPayload): Promise<void>;
};

type VelaWidgetPayload = {
  realBalance: number;
  freeThisMonth: number;
  desireSpent: number;
  desireBudget: number;
  year: number;
  month: number;
  daysInMonth: number;
  todayDay: number;
  firstWeekday: number;
  desireDaily: number[];
};

const VelaWidget = registerPlugin<VelaWidgetPlugin>('VelaWidget');

export function syncVelaWidget(data: LedgerData, settings: Settings, now = new Date()) {
  if (!Capacitor.isNativePlatform()) return;

  const year = now.getFullYear();
  const month = now.getMonth();
  const monthDays = daysInMonth(year, month);
  const desireDaily = Array.from({ length: monthDays }, () => 0);
  const cash = currentMonthCash(data, settings, now);
  const cycle = currentCashCycle(settings, now);
  const desireBudget = Math.max(0, (settings.salary || 0) * ((settings.desejos || 0) / 100));

  let desireSpent = 0;
  entriesIn(data, (entryYear, entryMonth, entryDay) => isDateInCycle(entryYear, entryMonth, entryDay, cycle)).forEach((entry) => {
    if (entry.type !== 'out') return;
    if (resolvedStatus(entry, now) !== 'realized') return;
    if (catById(entry.cat)?.group !== 'Desejos') return;

    desireSpent += entry.amount;
    if (entry._y === year && entry._m === month && entry._d >= 1 && entry._d <= monthDays) {
      desireDaily[entry._d - 1] += entry.amount;
    }
  });

  void VelaWidget.update({
    realBalance: cash.realBalance,
    freeThisMonth: cash.freeToSpend,
    desireSpent,
    desireBudget,
    year,
    month,
    daysInMonth: monthDays,
    todayDay: now.getDate(),
    firstWeekday: new Date(year, month, 1).getDay(),
    desireDaily
  }).catch(() => {
    // The widget plugin only exists in the Android shell.
  });
}

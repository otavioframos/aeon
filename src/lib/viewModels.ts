import { currentCashCycle, isDateInCycle } from './cashCycle';
import { catById } from './categories';
import { MONTHS, aggregate, daysInMonth, daysInYear, entriesIn, monthAgg } from './finance';
import { dateIndex } from './transactions';
import type { TransactionStatus } from './types';
import type {
  Aggregate,
  AllocationModel,
  HeatCell,
  HeroModel,
  LedgerData,
  RankItem,
  RankMode,
  ReserveModel,
  Scope,
  Settings,
  TrendRow
} from './types';

function isCurrentMonthScope(currentYear: number, currentScope: Scope, currentScopeMonth: number, now = new Date()) {
  return currentScope === 'month' && currentYear === now.getFullYear() && currentScopeMonth === now.getMonth();
}

function isRealizedThrough(entryYear: number, entryMonth: number, entryDay: number, status: TransactionStatus | undefined, now: Date) {
  if (status === 'forecast') return false;
  const todayIndex = dateIndex(now.getFullYear(), now.getMonth(), now.getDate());
  return dateIndex(entryYear, entryMonth, entryDay) <= todayIndex;
}

function isLivingEntry(categoryId: string) {
  const group = catById(categoryId)?.group;
  return group === 'Essenciais' || group === 'Desejos';
}

export function getScopeData(
  currentData: LedgerData,
  currentYear: number,
  currentScope: Scope,
  currentScopeMonth: number,
  currentSettings?: Settings,
  now = new Date()
) {
  if (currentSettings && isCurrentMonthScope(currentYear, currentScope, currentScopeMonth, now)) {
    const cycle = currentCashCycle(currentSettings, now);
    const todayIndex = dateIndex(now.getFullYear(), now.getMonth(), now.getDate());
    return aggregate(
      entriesIn(currentData, (y, m, d) => isDateInCycle(y, m, d, cycle) && dateIndex(y, m, d) <= todayIndex).filter(
        (entry) => entry.status !== 'forecast'
      )
    );
  }

  return currentScope === 'year'
    ? aggregate(entriesIn(currentData, (y) => y === currentYear))
    : aggregate(entriesIn(currentData, (y, m) => y === currentYear && m === currentScopeMonth));
}

export function getDailySpendData(
  currentData: LedgerData,
  currentYear: number,
  currentScope: Scope,
  currentScopeMonth: number,
  currentSettings: Settings,
  now = new Date()
) {
  if (currentScope === 'year') {
    return aggregate(
      entriesIn(currentData, (y, m, d) => y === currentYear && isRealizedThrough(y, m, d, undefined, now)).filter(
        (entry) => entry.type === 'out' && isLivingEntry(entry.cat) && isRealizedThrough(entry._y, entry._m, entry._d, entry.status, now)
      )
    );
  }

  if (isCurrentMonthScope(currentYear, currentScope, currentScopeMonth, now)) {
    const cycle = currentCashCycle(currentSettings, now);
    return aggregate(
      entriesIn(currentData, (y, m, d) => isDateInCycle(y, m, d, cycle) && isRealizedThrough(y, m, d, undefined, now)).filter(
        (entry) => entry.type === 'out' && isLivingEntry(entry.cat) && isRealizedThrough(entry._y, entry._m, entry._d, entry.status, now)
      )
    );
  }

  return aggregate(
    entriesIn(currentData, (y, m, d) => y === currentYear && m === currentScopeMonth && isRealizedThrough(y, m, d, undefined, now)).filter(
      (entry) => entry.type === 'out' && isLivingEntry(entry.cat) && isRealizedThrough(entry._y, entry._m, entry._d, entry.status, now)
    )
  );
}

export function getPrevScopeData(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number) {
  if (currentScope === 'year') return aggregate(entriesIn(currentData, (y) => y === currentYear - 1));
  const previousMonth = currentScopeMonth - 1;
  if (previousMonth < 0) return aggregate(entriesIn(currentData, (y, m) => y === currentYear - 1 && m === 11));
  return aggregate(entriesIn(currentData, (y, m) => y === currentYear && m === previousMonth));
}

export function buildRankItems(current: Aggregate, previous: Aggregate, mode: RankMode): RankItem[] {
  const src = mode === 'cat' ? current.byCat : current.byGroup;
  const prevSrc = mode === 'cat' ? previous.byCat : previous.byGroup;
  const items = Object.keys(src)
    .map((k) => ({ k, v: src[k] }))
    .sort((a, b) => b.v - a.v);
  const max = items.length ? items[0].v : 1;
  const total = current.exp || 1;

  return items.map((item) => {
    const category = mode === 'cat' ? catById(item.k) : undefined;
    const prevV = prevSrc[item.k] || 0;
    let delta = '';
    let deltaClass: 'up' | 'down' = 'up';
    if (prevV > 0) {
      const change = ((item.v - prevV) / prevV) * 100;
      if (Math.abs(change) >= 5) {
        delta = `${change > 0 ? '▲' : '▼'}${Math.abs(change).toFixed(0)}%`;
        deltaClass = change > 0 ? 'up' : 'down';
      }
    } else if (item.v > 0) {
      delta = 'novo';
    }

    return {
      ...item,
      name: mode === 'cat' ? category?.name || 'Other' : item.k === 'Outros' ? 'Other' : item.k,
      icon: mode === 'cat' ? category?.icon || '' : '',
      pct: (item.v / total) * 100,
      width: (item.v / max) * 100,
      delta,
      deltaClass
    };
  });
}

export function allocationModel(current: Aggregate): AllocationModel {
  const groups = ['Essenciais', 'Desejos', 'Investimentos'];
  const values = groups.map((group) => current.byGroup[group] || 0);
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const colors = ['var(--color-text)', 'var(--color-red-soft)', 'var(--color-text-strong)'];
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = values.map((value, index) => {
    const length = (value / total) * circumference;
    const segment = { length, offset, color: colors[index], group: groups[index], pct: (value / total) * 100 };
    offset += length;
    return segment;
  });
  return {
    investmentPct: (values[2] / total) * 100,
    segments
  };
}

export function heroModel(
  current: Aggregate,
  currentScope: Scope,
  currentYear: number,
  currentScopeMonth: number,
  currentSettings: Settings,
  now = new Date()
): HeroModel {
  const isYear = currentScope === 'year';
  const today = now;
  let elapsed: number;
  let total: number;
  let dayLabel: string;
  if (isYear) {
    const soy = new Date(currentYear, 0, 1);
    const ref = currentYear === today.getFullYear() ? today : new Date(currentYear, 11, 31);
    elapsed = Math.max(1, Math.round((ref.getTime() - soy.getTime()) / 86400000) + 1);
    total = daysInYear(currentYear);
    dayLabel = 'por dia (ano)';
  } else {
    if (isCurrentMonthScope(currentYear, currentScope, currentScopeMonth, today)) {
      const cycle = currentCashCycle(currentSettings, today);
      total = cycle.totalDays;
      elapsed = cycle.elapsedDays;
      dayLabel = 'por dia (ciclo)';
    } else {
      total = daysInMonth(currentYear, currentScopeMonth);
      elapsed = currentYear === today.getFullYear() && currentScopeMonth === today.getMonth() ? today.getDate() : total;
      dayLabel = 'por dia';
    }
  }

  const burn = current.exp / elapsed;
  const livingPct = currentSettings.essenciais + currentSettings.desejos;
  const budget = (isYear ? currentSettings.salary * 12 : currentSettings.salary) * (livingPct / 100);
  const projected = burn * total;
  const pacePct = budget > 0 ? Math.min(140, (projected / budget) * 100) : 0;
  const level = projected <= budget ? 'green' : projected <= budget * 1.15 ? 'yellow' : 'red';
  const markerPos = projected > budget ? Math.min(100, 100 / (projected / budget)) : 100;
  return {
    burn,
    budget,
    dayLabel,
    elapsedDays: elapsed,
    markerPos,
    pacePct: Math.min(100, pacePct),
    periodDays: total,
    projected,
    savings: current.inc > 0 ? ((current.inc - current.exp) / current.inc) * 100 : 0,
    levelColor: level === 'green' ? 'var(--green)' : level === 'yellow' ? 'var(--yellow)' : 'var(--red)'
  };
}

export function reserveModel(currentData: LedgerData, currentYear: number): ReserveModel | null {
  const reserveEntries = entriesIn(currentData, (y) => y === currentYear).filter((entry) => entry.type === 'out' && entry.cat === 'reserva');
  const reserveTotal = reserveEntries.reduce((sum, entry) => sum + entry.amount, 0);
  let totalExp = 0;
  const expMonths: Record<number, number> = {};
  entriesIn(currentData, (y) => y === currentYear).forEach((entry) => {
    if (entry.type === 'out') {
      totalExp += entry.amount;
      expMonths[entry._m] = (expMonths[entry._m] || 0) + entry.amount;
    }
  });

  const nMonths = Math.max(1, Object.keys(expMonths).length);
  const avgMonthlyExp = totalExp / nMonths;
  const target = avgMonthlyExp * 6;
  const reserveMonthsActive = new Set(reserveEntries.map((entry) => entry._m)).size || 1;
  const monthlyAport = reserveTotal / reserveMonthsActive;
  const runway = avgMonthlyExp > 0 ? reserveTotal / avgMonthlyExp : 0;
  const remaining = Math.max(0, target - reserveTotal);
  const monthsToTarget = monthlyAport > 0 ? remaining / monthlyAport : Infinity;
  const pctOfTarget = target > 0 ? Math.min(100, (reserveTotal / target) * 100) : 0;
  if (reserveTotal === 0 && avgMonthlyExp === 0) return null;

  const width = 300;
  const height = 120;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 18;
  const horizon = Math.min(24, Math.max(6, Math.ceil(Number.isFinite(monthsToTarget) ? monthsToTarget + 2 : 12)));
  const maxY = Math.max(target, reserveTotal + monthlyAport * horizon, 1);
  const x = (month: number) => padL + (width - padL - padR) * (month / horizon);
  const y = (value: number) => padT + (height - padT - padB) * (1 - value / maxY);
  const points = Array.from({ length: horizon + 1 }, (_, month) => {
    const value = Math.min(maxY, reserveTotal + monthlyAport * month);
    return [x(month), y(value)] as const;
  });
  const linePath = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(horizon).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
  const targetY = y(target);
  const beX = Number.isFinite(monthsToTarget) ? x(Math.min(horizon, monthsToTarget)) : null;
  const runwayLevel = runway >= 6 ? 'green' : runway >= 3 ? 'yellow' : 'red';
  const runwayColor = runwayLevel === 'green' ? 'var(--green)' : runwayLevel === 'yellow' ? 'var(--yellow)' : 'var(--red)';

  return {
    areaPath,
    beLabel: Number.isFinite(monthsToTarget)
      ? monthsToTarget < 1
        ? 'menos de 1 mês'
        : monthsToTarget < 12
          ? `${Math.ceil(monthsToTarget)} meses`
          : `${(monthsToTarget / 12).toFixed(1)} anos`
      : 'sem aporte ainda',
    beX,
    height,
    horizon,
    linePath,
    monthlyAport,
    padL,
    padR,
    pctOfTarget,
    reserveTotal,
    runway,
    runwayColor,
    runwayLabel: runway < 1 ? 'menos de 1 mês' : `${runway.toFixed(1)} ${runway >= 2 ? 'meses' : 'mês'}`,
    target,
    targetY,
    width
  };
}

export function trendModel(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number): TrendRow[] {
  let max = 1;
  for (let month = 0; month < 12; month++) {
    const current = monthAgg(currentData, currentYear, month);
    max = Math.max(max, current.inc, current.exp);
  }
  return MONTHS.map((month, index) => {
    const current = monthAgg(currentData, currentYear, index);
    return {
      month,
      incPct: (current.inc / max) * 100,
      expPct: (current.exp / max) * 100,
      current: currentScope === 'month' && index === currentScopeMonth
    };
  });
}

export function heatModel(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number): HeatCell[] {
  if (currentScope === 'year') return [];
  const dim = daysInMonth(currentYear, currentScopeMonth);
  const firstDow = new Date(currentYear, currentScopeMonth, 1).getDay();
  const dayExp: Record<number, number> = {};
  entriesIn(currentData, (y, m) => y === currentYear && m === currentScopeMonth).forEach((entry) => {
    if (entry.type === 'out') dayExp[entry._d] = (dayExp[entry._d] || 0) + entry.amount;
  });
  const max = Math.max(1, ...Object.values(dayExp));
  const blanks = Array.from({ length: firstDow }, () => ({ day: 0, value: 0, background: 'transparent', blank: true }));
  const days = Array.from({ length: dim }, (_, index) => {
    const day = index + 1;
    const value = dayExp[day] || 0;
    const intensity = value / max;
    return {
      day,
      value,
      blank: false,
      background: value === 0 ? 'var(--color-stroke)' : `rgba(163,6,6,${(0.08 + intensity * 0.22).toFixed(2)})`
    };
  });
  return blanks.concat(days);
}

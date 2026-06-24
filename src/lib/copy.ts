import type { TransactionStatus } from './types';

export interface DailyRoomCopyInput {
  recoveryLabel: string;
  todayScopeLabel: string;
  spentTodayLabel: string;
  leftTodayLabel: string;
  normalDayLabel: string;
  cycleDeltaLabel: string;
  isCycleCompromised: boolean;
  isOnPace: boolean;
}

export function transactionStatusLabel(status: TransactionStatus) {
  return status === 'forecast' ? 'Upcoming' : 'Already happened';
}

export function dailyRoomCopy(input: DailyRoomCopyInput) {
  return {
    todayTitle: "Today's Allowance",
    todayValue: input.todayScopeLabel,
    todaySpendLine: `R$ ${input.spentTodayLabel} spent · R$ ${input.leftTodayLabel} ${input.isOnPace ? 'left' : 'over'}`,
    todayNormalLine: `R$ ${input.normalDayLabel} on a normal day`,
    cycleTitle: 'Adjusted Daily',
    cycleValue: `${input.recoveryLabel}/day`,
    cycleSupport: 'avg for the rest of the cycle',
    cycleDeltaLine: `${input.isCycleCompromised ? '-' : '+'}R$ ${input.cycleDeltaLabel}/day`
  };
}

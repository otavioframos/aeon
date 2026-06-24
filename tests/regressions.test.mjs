import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true }
});

const { currentMonthCash, projectionMonths } = await server.ssrLoadModule('/src/lib/cashModel.ts');
const { catById, isPortfolioCategory } = await server.ssrLoadModule('/src/lib/categories.ts');
const { dailyRoomCopy, transactionStatusLabel } = await server.ssrLoadModule('/src/lib/copy.ts');
const { safeExportFilename } = await server.ssrLoadModule('/src/lib/fileExport.ts');
const { entriesIn } = await server.ssrLoadModule('/src/lib/finance.ts');
const { normalizeBackup, normalizeSettings } = await server.ssrLoadModule('/src/lib/storage.ts');
const { buildTransactionEntries } = await server.ssrLoadModule('/src/lib/transactions.ts');
const {
  categoryFilterItems,
  appliedMoneyTotal,
  dailyRoomModel,
  getCategoryEntries,
  getDailySpendData,
  getScopeData,
  heroModel,
  isSmoothedPaceActive,
  reserveCardModel,
  reserveModel,
  todaySpendModel
} = await server.ssrLoadModule('/src/lib/viewModels.ts');

const baseSettings = {
  currentBalance: 1000,
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

function expense(amount, overrides = {}) {
  return {
    id: `entry-${amount}`,
    amount,
    type: 'out',
    cat: 'lazer',
    desc: '',
    status: 'realized',
    ...overrides
  };
}

function income(amount, overrides = {}) {
  return {
    id: `income-${amount}`,
    amount,
    type: 'in',
    cat: 'renda',
    desc: '',
    status: 'forecast',
    ...overrides
  };
}

function legacyIdFor(value) {
  return `${new Date(value).getTime().toString(36)}zzzz`;
}

{
  const appCss = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
  const appPage = readFileSync(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');

  assert.match(
    appCss,
    /\.balance-cards\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*2fr\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(appPage, /let appNow = new Date\(\);/);
  assert.match(appPage, /function refreshAppNow\(\)/);
  assert.match(appPage, /setInterval\(refreshAppNow,/);
  assert.match(appPage, /document\.addEventListener\('visibilitychange', refreshAppNow\)/);
  assert.match(appPage, /currentMonthCash\(data, settings, appNow\)/);
  assert.match(appPage, /todaySpendModel\(data, settings, appNow\)/);
}

{
  assert.equal(transactionStatusLabel('forecast'), 'Upcoming');
  assert.equal(transactionStatusLabel('realized'), 'Already happened');
  assert.deepEqual(
    dailyRoomCopy({
      recoveryLabel: '119',
      todayScopeLabel: '112',
      spentTodayLabel: '89',
      leftTodayLabel: '23',
      normalDayLabel: '158',
      cycleDeltaLabel: '39',
      isCycleCompromised: true,
      isOnPace: true
    }),
    {
      todayTitle: "Today's Allowance",
      todayValue: '112',
      todaySpendLine: 'R$ 89 spent · R$ 23 left',
      todayNormalLine: 'R$ 158 on a normal day',
      cycleTitle: 'Adjusted Daily',
      cycleValue: '119/day',
      cycleSupport: 'avg for the rest of the cycle',
      cycleDeltaLine: '-R$ 39/day'
    }
  );
}

{
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const smoothedEntry = {
    id: 'smoothed-varal',
    amount: 287.58,
    type: 'out',
    cat: 'contas',
    desc: 'Varal lavanderia',
    status: 'realized',
    paceImpact: 'diluted',
    _y: 2026,
    _m: 5,
    _d: 21
  };
  const normalEntry = { ...smoothedEntry, id: 'normal-market', paceImpact: 'normal' };

  assert.equal(isSmoothedPaceActive(smoothedEntry, settings, new Date('2026-06-23T12:00:00')), true);
  assert.equal(isSmoothedPaceActive(normalEntry, settings, new Date('2026-06-23T12:00:00')), false);
  assert.equal(isSmoothedPaceActive(smoothedEntry, settings, new Date('2026-07-20T12:00:00')), false);
}

{
  assert.equal(safeExportFilename('fluxo:backup/2026?.json'), 'fluxo_backup_2026_.json');
  assert.equal(safeExportFilename(''), 'vela-export.txt');
}

{
  const now = new Date('2026-06-18T15:00:00');
  const settings = { ...baseSettings, balanceAnchorAt: '2026-06-18T12:00:00.000Z' };
  const data = {
    '2026-5-18': [income(300, { status: 'realized', createdAt: '2026-06-18T14:00:00.000Z' })],
    '2026-5-25': [income(500)]
  };
  const snapshot = currentMonthCash(data, settings, now);
  const juneProjection = projectionMonths(data, 2026, settings, now)[5];

  assert.equal(snapshot.receivedIncome, 300);
  assert.equal(snapshot.expectedIncome, 500);
  assert.equal(snapshot.freeToSpend, 1800);
  assert.equal(juneProjection.closing, 1800);
}

{
  const now = new Date('2026-06-19T17:00:00');
  const settings = { ...baseSettings, balanceAnchorAt: '2026-06-19T12:00:00.000Z' };
  const data = {
    '2026-5-19': [income(7300, { id: legacyIdFor('2026-06-19T16:00:00.000Z'), status: 'realized', createdAt: undefined })]
  };
  const snapshot = currentMonthCash(data, settings, now);

  assert.equal(snapshot.receivedIncome, 7300);
  assert.equal(snapshot.anchorBalance, 1000);
  assert.equal(snapshot.realBalance, 8300);
  assert.equal(snapshot.freeToSpend, 8300);
}

{
  const now = new Date('2026-06-20T12:00:00');
  const settings = { ...baseSettings, currentBalance: 4137.41, balanceAnchorAt: undefined };
  const data = {
    '2026-5-19': [
      income(7300, { status: 'realized', createdAt: '2026-06-19T16:00:00.000Z' }),
      expense(2100, { cat: 'reserva', status: 'realized', createdAt: '2026-06-19T18:54:48.280Z' })
    ],
    '2026-5-20': [expense(89.5, { cat: 'mercado', status: 'realized', createdAt: '2026-06-20T17:31:10.823Z' })]
  };
  const snapshot = currentMonthCash(data, settings, now);

  assert.equal(snapshot.realBalance, 4137.41);
  assert.equal(snapshot.freeToSpend, 4137.41);
}

{
  const migrated = normalizeSettings({ ...baseSettings, currentBalance: 4137.41, balanceAnchorAt: undefined }, new Date('2026-06-20T12:00:00Z'));

  assert.equal(migrated.currentBalance, 4137.41);
  assert.equal(migrated.balanceAnchorAt, '2026-06-20T12:00:00.000Z');
}

{
  const cash = {
    anchorBalance: 4137.41,
    realBalance: 4137.41,
    cycleStart: '2026-06-19',
    cycleEnd: '2026-07-19',
    cycleElapsedDays: 2,
    cycleTotalDays: 31,
    receivedIncome: 0,
    spentExpenses: 0,
    expectedIncome: 0,
    dueExpenses: 0,
    freeToSpend: 4137.41
  };
  const hero = {
    burn: 146.47,
    budget: 4900,
    dayLabel: 'por dia (ciclo)',
    elapsedDays: 2,
    markerPos: 100,
    pacePct: 93,
    periodDays: 31,
    projected: 4540.57,
    savings: 0,
    levelColor: 'var(--green)'
  };
  const room = dailyRoomModel(cash, hero, 89.5);

  assert.equal(room.remainingDays, 30);
  assert.equal(room.perDay.toFixed(2), '137.91');
  assert.equal(room.paceRoomToday.toFixed(2), '23.19');
  assert.equal(room.dailyThreshold.toFixed(2), '158.06');
  assert.equal(room.todayScope.toFixed(2), '112.69');
  assert.equal(room.todayLeft.toFixed(2), '23.19');
  assert.equal(room.status, 'on pace');
}

{
  const cash = {
    anchorBalance: 5000,
    realBalance: 5000,
    cycleStart: '2026-06-19',
    cycleEnd: '2026-07-19',
    cycleElapsedDays: 2,
    cycleTotalDays: 31,
    receivedIncome: 0,
    spentExpenses: 0,
    expectedIncome: 0,
    dueExpenses: 0,
    freeToSpend: 5000
  };
  const hero = {
    burn: 0,
    budget: 4900,
    dayLabel: 'por dia (ciclo)',
    elapsedDays: 2,
    markerPos: 100,
    pacePct: 0,
    periodDays: 31,
    projected: 0,
    savings: 0,
    levelColor: 'var(--green)'
  };
  const room = dailyRoomModel(cash, hero, 0);

  assert.equal(room.realMaxToday.toFixed(2), '316.13');
  assert.equal(room.todayScope.toFixed(2), '158.06');
  assert.equal(room.todayLeft.toFixed(2), '158.06');
}

{
  const cash = {
    anchorBalance: 3304.2,
    realBalance: 3304.2,
    cycleStart: '2026-06-19',
    cycleEnd: '2026-07-19',
    cycleElapsedDays: 5,
    cycleTotalDays: 31,
    receivedIncome: 0,
    spentExpenses: 0,
    expectedIncome: 0,
    dueExpenses: 0,
    freeToSpend: 3304.2
  };
  const hero = {
    burn: 0,
    budget: 4900,
    dayLabel: 'por dia (ciclo)',
    elapsedDays: 5,
    markerPos: 100,
    pacePct: 0,
    periodDays: 31,
    projected: 0,
    savings: 0,
    levelColor: 'var(--green)'
  };
  const room = dailyRoomModel(cash, hero, 0);

  assert.equal(room.perDay.toFixed(2), '122.38');
  assert.equal(room.dailyThreshold.toFixed(2), '158.06');
  assert.equal(room.realMaxToday.toFixed(2), '790.32');
  assert.equal(room.todayScope.toFixed(2), '122.38');
  assert.equal(room.todayLeft.toFixed(2), '122.38');
}

{
  const generated = buildTransactionEntries({
    totalAmount: 780,
    type: 'out',
    cat: 'mercado',
    desc: 'Bulk market',
    purchaseDate: '2026-06-20',
    installmentCount: 1,
    paceImpact: 'diluted'
  });

  assert.equal(generated.length, 1);
  assert.equal(generated[0].entry.amount, 780);
  assert.equal(generated[0].entry.paceImpact, 'diluted');
}

{
  const now = new Date('2026-06-20T12:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-5-20': [expense(780, { cat: 'mercado', paceImpact: 'diluted' })]
  };
  const dailySpend = getDailySpendData(data, 2026, 'month', 5, settings, now);
  const todaySpend = todaySpendModel(data, settings, now);

  assert.equal(dailySpend.exp.toFixed(2), '780.00');
  assert.equal(dailySpend.byCat.mercado.toFixed(2), '780.00');
  assert.equal(todaySpend.total.toFixed(2), '780.00');
  assert.equal(todaySpend.actualLiving.toFixed(2), '780.00');
  assert.equal(todaySpend.living.toFixed(2), '780.00');
}

{
  const now = new Date('2026-07-18T12:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-6-18': [expense(780, { cat: 'mercado', paceImpact: 'diluted' })]
  };
  const dailySpend = getDailySpendData(data, 2026, 'month', 6, settings, now);
  const todaySpend = todaySpendModel(data, settings, now);

  assert.equal(dailySpend.exp.toFixed(2), '780.00');
  assert.equal(todaySpend.actualLiving.toFixed(2), '780.00');
  assert.equal(todaySpend.living.toFixed(2), '780.00');
}

{
  const now = new Date('2026-06-23T12:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-5-21': [expense(287.58, { cat: 'mercado', paceImpact: 'diluted' })]
  };
  const dailySpend = getDailySpendData(data, 2026, 'month', 5, settings, now);
  const hero = heroModel(dailySpend, 'month', 2026, 5, settings, now);
  const todaySpend = todaySpendModel(data, settings, now);
  const room = dailyRoomModel(
    {
      anchorBalance: 10000,
      realBalance: 10000,
      cycleStart: '2026-06-19',
      cycleEnd: '2026-07-19',
      cycleElapsedDays: 5,
      cycleTotalDays: 31,
      receivedIncome: 0,
      spentExpenses: 0,
      expectedIncome: 0,
      dueExpenses: 0,
      freeToSpend: 10000
    },
    hero,
    todaySpend.actualLiving
  );

  assert.equal(dailySpend.exp.toFixed(2), '287.58');
  assert.equal(todaySpend.total.toFixed(2), '0.00');
  assert.equal(todaySpend.actualLiving.toFixed(2), '0.00');
  assert.equal(todaySpend.living.toFixed(2), '0.00');
  assert.equal(room.dailyThreshold.toFixed(2), '158.06');
  assert.equal(room.paceRoomToday.toFixed(2), '502.74');
  assert.equal(room.todayScope.toFixed(2), '158.06');
  assert.equal(room.todayLeft.toFixed(2), '158.06');
  assert.equal(room.perDay.toFixed(2), '170.83');
}

{
  const now = new Date('2026-06-20T12:00:00');
  const settings = {
    ...baseSettings,
    currentBalance: 3591.78,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-5-19': [
      expense(67.67, { cat: 'pets' }),
      expense(22.59, { cat: 'mercado' }),
      expense(113.18, { cat: 'mercado' })
    ],
    '2026-5-20': [
      expense(89.5, { cat: 'mercado' }),
      expense(84, { cat: 'imposto' }),
      income(500, { status: 'realized' }),
      expense(50, { cat: 'lazer', status: 'forecast' })
    ]
  };
  const dailySpend = getDailySpendData(data, 2026, 'month', 5, settings, now);
  const hero = heroModel(dailySpend, 'month', 2026, 5, settings, now);
  const todaySpend = todaySpendModel(data, now);
  const room = dailyRoomModel(
    {
      anchorBalance: 3591.78,
      realBalance: 3591.78,
      cycleStart: '2026-06-19',
      cycleEnd: '2026-07-19',
      cycleElapsedDays: 2,
      cycleTotalDays: 31,
      receivedIncome: 0,
      spentExpenses: 0,
      expectedIncome: 0,
      dueExpenses: 0,
      freeToSpend: 3591.78
    },
    hero,
    todaySpend.living
  );

  assert.equal(todaySpend.total.toFixed(2), '173.50');
  assert.equal(todaySpend.living.toFixed(2), '89.50');
  assert.equal(room.dailyThreshold.toFixed(2), '158.06');
  assert.equal(room.realMaxToday.toFixed(2), '112.69');
  assert.equal(room.todayScope.toFixed(2), '112.69');
  assert.equal(room.todayLeft.toFixed(2), '23.19');
  assert.equal(room.paceRoomToday.toFixed(2), '23.19');
}

{
  const now = new Date('2026-06-19T17:00:00');
  const settings = {
    ...baseSettings,
    balanceAnchorAt: '2026-06-19T12:00:00.000Z',
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay'
  };
  const data = {
    '2026-5-19': [income(7300, { status: 'realized', createdAt: '2026-06-19T16:00:00.000Z' })],
    '2026-5-25': [expense(100, { status: 'forecast' })],
    '2026-6-19': [expense(200, { status: 'forecast' })],
    '2026-6-20': [expense(300, { status: 'forecast' })]
  };
  const snapshot = currentMonthCash(data, settings, now);

  assert.equal(snapshot.cycleStart, '2026-06-19');
  assert.equal(snapshot.cycleEnd, '2026-07-19');
  assert.equal(snapshot.cycleElapsedDays, 1);
  assert.equal(snapshot.cycleTotalDays, 31);
  assert.equal(snapshot.dueExpenses, 200);
  assert.equal(snapshot.freeToSpend, 8100);
}

{
  const now = new Date('2026-06-19T17:00:00');
  const settings = {
    ...baseSettings,
    balanceAnchorAt: '2026-06-19T12:00:00.000Z',
    cycleStartDay: 20,
    cycleWeekendRule: 'fixedDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-5-19': [income(7300, { status: 'realized', createdAt: '2026-06-19T16:00:00.000Z' })],
    '2026-6-10': [expense(500, { status: 'forecast' })]
  };
  const snapshot = currentMonthCash(data, settings, now);

  assert.equal(snapshot.cycleStart, '2026-06-19');
  assert.equal(snapshot.dueExpenses, 500);
  assert.equal(snapshot.freeToSpend, 7800);
}

{
  const now = new Date('2026-06-20T12:00:00');
  const settings = {
    ...baseSettings,
    currentBalance: 4137.41,
    balanceAnchorAt: '2026-06-19T12:00:00.000Z',
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay',
    cycleStartOverrides: ['2026-06-19']
  };
  const data = {
    '2026-5-25': [
      expense(3562.44, { id: 'qu7qsvgsw2dk', cat: 'contas', desc: 'Fatura cartão (resto, fora parcelas)', status: 'forecast' }),
      expense(474, { cat: 'graduacao', desc: 'Curso UXDI/FIAP', status: 'forecast', installmentIndex: 4, installmentCount: 10 }),
      expense(419.99, { cat: 'lazer', desc: 'Presente Bebel - Tênis', status: 'forecast', installmentIndex: 1, installmentCount: 2 }),
      expense(181.52, { cat: 'lazer', desc: 'Cool Kids Club - roupa', status: 'forecast', installmentIndex: 1, installmentCount: 3 }),
      expense(167, { id: 'ombec0jfd45y', cat: 'lazer', desc: 'Perfume cheiroso na marra', status: 'forecast', installmentIndex: 1, installmentCount: 2 }),
      expense(84.5, { cat: 'lazer', desc: 'Phebo Santalum', status: 'forecast', installmentIndex: 1, installmentCount: 2 })
    ],
    '2026-6-25': [
      expense(474, { cat: 'graduacao', desc: 'Curso UXDI/FIAP', status: 'forecast', installmentIndex: 5, installmentCount: 10 }),
      expense(419.99, { cat: 'lazer', desc: 'Presente Bebel - Tênis', status: 'forecast', installmentIndex: 2, installmentCount: 2 }),
      expense(181.52, { cat: 'lazer', desc: 'Cool Kids Club - roupa', status: 'forecast', installmentIndex: 2, installmentCount: 3 }),
      expense(167, { cat: 'lazer', desc: 'Perfume cheiroso na marra', status: 'forecast', installmentIndex: 2, installmentCount: 2 }),
      expense(84.5, { cat: 'lazer', desc: 'Phebo Santalum', status: 'forecast', installmentIndex: 2, installmentCount: 2 })
    ]
  };
  const snapshot = currentMonthCash(data, settings, now);
  const julyProjection = projectionMonths(data, 2026, settings, now)[6];

  assert.equal(snapshot.dueExpenses, 0);
  assert.equal(snapshot.freeToSpend, 4137.41);
  assert.equal(julyProjection.expenses, 1327.01);
}

{
  const now = new Date('2026-06-19T17:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay'
  };
  const data = {
    '2026-5-19': [
      expense(100, { cat: 'lazer' }),
      expense(200, { cat: 'mercado' }),
      expense(2100, { cat: 'invest' }),
      expense(1245, { cat: 'graduacao' }),
      expense(86.05, { cat: 'imposto' })
    ],
    '2026-5-20': [expense(8000, { status: 'forecast' })],
    '2026-6-19': [expense(423.94, { status: 'forecast' })]
  };
  const scoped = getScopeData(data, 2026, 'month', 5, settings, now);
  const dailySpend = getDailySpendData(data, 2026, 'month', 5, settings, now);
  const hero = heroModel(dailySpend, 'month', 2026, 5, settings, now);

  assert.equal(scoped.exp, 3731.05);
  assert.equal(dailySpend.exp, 300);
  assert.equal(hero.burn, 300);
  assert.equal(hero.budget, 4900);
  assert.equal(hero.periodDays, 31);
}

{
  const now = new Date('2026-06-19T17:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay'
  };
  const data = {
    '2026-5-19': [
      expense(2100, { cat: 'reserva' }),
      expense(500, { cat: 'invest' }),
      expense(1000, { cat: 'mercado' })
    ],
    '2026-5-25': [expense(900, { cat: 'reserva', status: 'forecast' })]
  };
  const scoped = getScopeData(data, 2026, 'month', 5, settings, now);
  const filters = categoryFilterItems(scoped);
  const reserveEntries = getCategoryEntries(data, 2026, 'month', 5, settings, 'reserva', now);
  const reserve = reserveModel(data, 2026, now);
  const reserveCard = reserveCardModel(data, 2026, now);
  const appliedTotal = appliedMoneyTotal(entriesIn(data, () => true), now);

  assert.equal(catById('reserva').group, 'Reserva');
  assert.equal(isPortfolioCategory('reserva'), false);
  assert.equal(scoped.byGroup.Reserva, 2100);
  assert.equal(scoped.byGroup.Investimentos, 500);
  assert.equal(appliedTotal, 2600);
  assert.deepEqual(
    filters.map((item) => item.id),
    ['reserva', 'mercado', 'invest']
  );
  assert.equal(reserveEntries.length, 1);
  assert.equal(reserveEntries[0].amount, 2100);
  assert.equal(reserve.reserveTotal, 2100);
  assert.equal(reserve.target, 6000);
  assert.equal(reserve.runway, 2.1);
  assert.equal(reserveCard.balance, 2100);
  assert.equal(reserveCard.target, 6000);
  assert.deepEqual(reserveCard.series.slice(0, 6), [0, 0, 0, 0, 0, 2100]);
}

{
  const now = new Date('2026-06-18T15:00:00');
  const data = {
    '2026-5-18': [expense(100)],
    '2026-5-25': [expense(200, { status: 'forecast' })],
    '2026-5-30': [income(500)]
  };
  const snapshot = currentMonthCash(data, { ...baseSettings, balanceAnchorAt: '2026-06-18T12:00:00.000Z' }, now);

  assert.equal(snapshot.realBalance, 1000);
  assert.equal(snapshot.spentExpenses, 0);
  assert.equal(snapshot.expectedIncome, 500);
  assert.equal(snapshot.dueExpenses, 200);
  assert.equal(snapshot.freeToSpend, 1300);
}

{
  const normalized = normalizeBackup({
    year: 2026,
    data: { '2026-5-1': [expense(10)] },
    years: {
      2026: { '2026-5-1': [expense(10)] },
      2027: { '2027-0-1': [expense(20, { status: 'forecast' })] }
    },
    settings: { currentBalance: 4137.41 }
  });

  assert.deepEqual(Object.keys(normalized.years).sort(), ['2026', '2027']);
  assert.equal(normalized.year, 2026);
  assert.equal(normalized.years['2027']['2027-0-1'][0].amount, 20);
}

await server.close();
console.log('regression tests passed');

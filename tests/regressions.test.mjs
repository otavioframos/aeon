import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true }
});

const { currentMonthCash, projectionMonths } = await server.ssrLoadModule('/src/lib/cashModel.ts');
const { catById, isPortfolioCategory } = await server.ssrLoadModule('/src/lib/categories.ts');
const { entriesIn } = await server.ssrLoadModule('/src/lib/finance.ts');
const { normalizeBackup, normalizeSettings } = await server.ssrLoadModule('/src/lib/storage.ts');
const {
  categoryFilterItems,
  appliedMoneyTotal,
  dailyRoomModel,
  getCategoryEntries,
  getDailySpendData,
  getScopeData,
  heroModel,
  reserveCardModel,
  reserveModel
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
  const room = dailyRoomModel(cash, hero);

  assert.equal(room.remainingDays, 30);
  assert.equal(room.perDay.toFixed(2), '137.91');
  assert.equal(room.paceRoomToday.toFixed(2), '23.19');
  assert.equal(room.status, 'on pace');
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

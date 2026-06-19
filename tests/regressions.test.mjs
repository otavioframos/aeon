import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true }
});

const { currentMonthCash, projectionMonths } = await server.ssrLoadModule('/src/lib/cashModel.ts');
const { normalizeBackup } = await server.ssrLoadModule('/src/lib/storage.ts');
const { getDailySpendData, getScopeData, heroModel } = await server.ssrLoadModule('/src/lib/viewModels.ts');

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
  assert.equal(snapshot.dueExpenses, 300);
  assert.equal(snapshot.freeToSpend, 8000);
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
  const now = new Date('2026-06-19T17:00:00');
  const settings = {
    ...baseSettings,
    cycleStartDay: 20,
    cycleWeekendRule: 'previousBusinessDay'
  };
  const data = {
    '2026-5-19': [expense(100, { cat: 'lazer' }), expense(200, { cat: 'mercado' }), expense(2100, { cat: 'invest' })],
    '2026-5-20': [expense(8000, { status: 'forecast' })],
    '2026-6-19': [expense(423.94, { status: 'forecast' })]
  };
  const scoped = getScopeData(data, 2026, 'month', 5, settings, now);
  const dailySpend = getDailySpendData(data, 2026, 'month', 5, settings, now);
  const hero = heroModel(dailySpend, 'month', 2026, 5, settings, now);

  assert.equal(scoped.exp, 2400);
  assert.equal(dailySpend.exp, 100);
  assert.equal(hero.burn, 100);
  assert.equal(hero.budget, 1400);
  assert.equal(hero.periodDays, 31);
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

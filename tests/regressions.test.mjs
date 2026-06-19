import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true }
});

const { currentMonthCash, projectionMonths } = await server.ssrLoadModule('/src/lib/cashModel.ts');
const { normalizeBackup } = await server.ssrLoadModule('/src/lib/storage.ts');

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

<script lang="ts">
  import { fmtNum } from '$lib/finance';

  export let accountBalance = 0;
  export let reserveBalance = 0;
  export let reserveSeries: number[] = [];
  export let reserveTarget = 0;
  export let reserveRunway = 0;

  const chartWidth = 197;
  const chartHeight = 38;
  const padTop = 4;
  const padBottom = 5;

  $: accountLabel = formatMoneyLabel(accountBalance);
  $: reserveLabel = formatMoneyLabel(reserveBalance);
  $: accountSize = valueSize(accountLabel, 32, 19);
  $: reserveSize = valueSize(reserveLabel, 24, 18);
  $: cleanSeries = reserveSeries.length ? reserveSeries : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  $: maxChartValue = Math.max(1, reserveTarget, ...cleanSeries);
  $: goalY = yFor(reserveTarget);
  $: sparkPoints = cleanSeries
    .map((value, index) => `${xFor(index, cleanSeries.length)},${yFor(value)}`)
    .join(' ');
  $: runwayLabel = reserveRunway > 0 && reserveRunway < 0.1 ? '<0.1 mo protected' : `${reserveRunway.toFixed(1)} mo protected`;

  function formatMoneyLabel(value: number) {
    return fmtNum(value).replace(',00', '');
  }

  function valueSize(label: string, base: number, min: number) {
    const length = label.length;
    const shrink = Math.max(0, length - 5) * 3.2;
    return Math.max(min, Math.round(base - shrink));
  }

  function xFor(index: number, length: number) {
    if (length <= 1) return 0;
    return (index / (length - 1)) * chartWidth;
  }

  function yFor(value: number) {
    const usable = chartHeight - padTop - padBottom;
    return padTop + usable * (1 - Math.min(1, Math.max(0, value / maxChartValue)));
  }
</script>

<section class="balance-cards" aria-label="Balances">
  <article class="balance-card account-card">
    <svg class="balance-arrow" viewBox="0 0 24 24"><path d="M7 17L17 7" /><path d="M9 7h8v8" /></svg>
    <h2>Real Balance</h2>
    <div class="balance-value account-value" style:--balance-value-size={`${accountSize}px`}>
      <span>R$</span>
      <strong>{accountLabel}</strong>
    </div>
  </article>

  <article class="balance-card reserve-balance-card">
    <svg class="sparkline" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1={goalY} x2={chartWidth} y2={goalY} stroke="var(--color-text)" stroke-dasharray="3 3" stroke-opacity="0.55" />
      <polyline
        points={sparkPoints}
        fill="none"
        stroke="var(--color-green)"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <h2>Reserve Balance</h2>
    <div class="balance-value reserve-value" style:--balance-value-size={`${reserveSize}px`}>
      <span>R$</span>
      <strong>{reserveLabel}</strong>
    </div>
    <p class="reserve-card-sub">{runwayLabel}</p>
  </article>
</section>

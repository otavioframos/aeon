<script lang="ts">
  import { MONTHS, daysInMonth, daysInYear, fmtNum, fmtShort } from '$lib/finance';
  import type { Aggregate, HeatCell, HeroModel, RankItem, ReserveModel, Scope, Settings, TrendRow } from '$lib/types';

  export let scope: Scope;
  export let year: number;
  export let scopeMonth: number;
  export let settings: Settings;
  export let scopedData: Aggregate;
  export let hero: HeroModel;
  export let reserve: ReserveModel | null;
  export let rankItems: RankItem[];
  export let heatCells: HeatCell[];
  export let trendRows: TrendRow[];
  export let investmentTotal = 0;

  $: periodDays = hero.periodDays || (scope === 'year' ? daysInYear(year) : daysInMonth(year, scopeMonth));
  $: dailyThreshold = hero.budget / Math.max(1, periodDays);
  $: paceOk = hero.projected <= hero.budget;
  $: referenceIncome = scope === 'year' ? settings.salary * 12 : settings.salary;
  $: investmentBasis = Math.max(referenceIncome, 0);
  $: investmentTarget = investmentBasis * (settings.investimentos / 100);
  $: investedPct = investmentBasis > 0 ? (investmentTotal / investmentBasis) * 100 : 0;
  $: investedPctLabel = investmentTotal > 0 && investedPct > 0 && investedPct < 1 ? '<1' : investedPct.toFixed(0);
  $: topPressure = rankItems[0];
  $: pressurePct = topPressure ? (topPressure.v / (scopedData.exp || 1)) * 100 : 0;
  $: runwayValue = reserve ? reserve.runway.toFixed(1) : '0';
  $: pressureName = topPressure?.name || 'Other';
</script>

<div class="metric-rail" aria-label="Métricas principais">
  <article class="metric-card metric-card-pace">
    <div class="metric-chip" class:on={paceOk}>{paceOk ? 'on pace' : 'attention'}</div>
    <div class="metric-name">Living Pace</div>
    <div class="metric-sub">reference R$ {fmtNum(dailyThreshold)}</div>
    <div class="metric-value">R$ {fmtNum(hero.burn)}</div>
  </article>

  <article class="metric-card metric-card-map">
    <div class="metric-line">
      <span>{scope === 'year' ? 'Yearly Spend' : 'Monthly Spend'}</span>
      <span>{fmtShort(scopedData.exp)}</span>
    </div>
    {#if scope === 'month'}
      <div class="metric-heat">
        {#each heatCells as cell}
          <span class:blank={cell.blank} style:background={cell.blank ? 'transparent' : cell.background}></span>
        {/each}
      </div>
    {:else}
      <div class="metric-mini-bars">
        {#each trendRows as row, index}
          <span class:current={row.current} title={MONTHS[index]}>
            <i class="income" style:height={`${row.incPct.toFixed(0)}%`}></i>
            <i class="expense" style:height={`${row.expPct.toFixed(0)}%`}></i>
          </span>
        {/each}
      </div>
    {/if}
  </article>

  <article class="metric-card metric-card-reserve">
    <svg class="metric-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    <div class="metric-name">Protected reserve</div>
    <div class="metric-value metric-value-runway"><span>{runwayValue}</span><small>mo</small></div>
    <div class="metric-sub">{reserve ? `target 6 mo · ${Math.max(0, 6 - reserve.runway).toFixed(1)} to go` : 'target 6 mo'}</div>
  </article>

  <article class="metric-card metric-card-invested">
    <div class="metric-arrow">↗</div>
    <div class="metric-value">{investedPctLabel}%</div>
    <div class="metric-name">Saved from income</div>
    <div class="metric-sub">reserve + investments · {fmtShort(investmentTotal)} / {fmtShort(investmentTarget)}</div>
  </article>

  <article class="metric-card metric-card-pressure">
    <div class="metric-name">Top Pressure</div>
    <div class="metric-value">{topPressure ? pressurePct.toFixed(0) : '0'}%</div>
    <div class="metric-sub">{pressureName} above normal</div>
  </article>
</div>

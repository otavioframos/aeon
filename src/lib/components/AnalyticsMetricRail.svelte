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

  $: periodDays = scope === 'year' ? daysInYear(year) : daysInMonth(year, scopeMonth);
  $: dailyThreshold = (scope === 'year' ? settings.salary * 12 : settings.salary) / Math.max(1, periodDays);
  $: paceOk = hero.projected <= hero.budget;
  $: investedPct = scopedData.inc > 0 ? ((scopedData.byGroup['Investimentos'] || 0) / scopedData.inc) * 100 : 0;
  $: topPressure = rankItems[0];
  $: pressurePct = topPressure ? (topPressure.v / (scopedData.exp || 1)) * 100 : 0;
</script>

<div class="metric-rail" aria-label="Métricas principais">
  <article class="metric-card metric-card-pace">
    <div class="metric-chip" class:on={paceOk}>{paceOk ? 'no ritmo' : 'atenção'}</div>
    <div class="metric-name">Gasto diário</div>
    <div class="metric-sub">limite: R$ {fmtNum(dailyThreshold)}</div>
    <div class="metric-value">R$ {fmtNum(hero.burn)}</div>
  </article>

  <article class="metric-card metric-card-map">
    <div class="metric-line">
      <span>Mapa {scope === 'year' ? 'anual' : 'mensal'}</span>
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

  <article class="metric-card">
    <svg class="metric-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    <div class="metric-name">Reserva</div>
    <div class="metric-value">{reserve ? reserve.runwayLabel : '0 mês'}</div>
    <div class="metric-sub">{reserve ? `${reserve.pctOfTarget.toFixed(0)}% da meta` : 'sem lançamentos'}</div>
  </article>

  <article class="metric-card">
    <div class="metric-arrow">↗</div>
    <div class="metric-value">{investedPct.toFixed(0)}%</div>
    <div class="metric-name">Renda investida</div>
    <div class="metric-sub">meta: {settings.investimentos}%</div>
  </article>

  <article class="metric-card">
    <div class="metric-name">Maior pressão</div>
    <div class="metric-value">{topPressure ? pressurePct.toFixed(0) : '0'}%</div>
    <div class="metric-sub">{topPressure?.name || 'sem saídas'}</div>
  </article>
</div>

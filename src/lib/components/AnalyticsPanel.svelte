<script lang="ts">
  import { catById } from '$lib/categories';
  import AnalyticsMetricRail from '$lib/components/AnalyticsMetricRail.svelte';
  import { DOW, MONTHS_FULL, entriesIn, fmtNum, fmtShort, monthAgg, monthSafetyLevel } from '$lib/finance';
  import type {
    Aggregate,
    AllocationModel,
    DatedEntry,
    HeatCell,
    HeroModel,
    LedgerData,
    RankItem,
    RankMode,
    ReserveModel,
    Scope,
    Settings,
    TrendRow
  } from '$lib/types';

  export let open = false;
  export let scope: Scope;
  export let scopeMonth: number;
  export let rankMode: RankMode;
  export let selectedDay: number | null;
  export let year: number;
  export let data: LedgerData;
  export let settings: Settings;
  export let scopedData: Aggregate;
  export let rankItems: RankItem[];
  export let reserve: ReserveModel | null;
  export let trendRows: TrendRow[];
  export let heatCells: HeatCell[];
  export let dayEntries: DatedEntry[];
  export let yearlyData: Aggregate;
  export let allocation: AllocationModel;
  export let hero: HeroModel;

  function setScope(next: Scope) {
    scope = next;
    if (next === 'year') selectedDay = null;
  }
</script>

<button class:open={open} class="ov-backdrop" aria-hidden={!open} aria-label="Fechar painel" tabindex={open ? 0 : -1} on:click={() => (open = false)}></button>
<section class:open={open} class="panel" aria-hidden={!open} inert={!open}>
  <div class="panel-inner">
    <div class="panel-top">
      <div class="panel-title">Resumo <span class="yr">{scope === 'year' ? year : MONTHS_FULL[scopeMonth].toLowerCase()}</span></div>
      <div class="seg">
        <button class:active={scope === 'month'} on:click={() => setScope('month')}>Mês</button>
        <button class:active={scope === 'year'} on:click={() => setScope('year')}>Ano</button>
      </div>
    </div>
    <div class="scope-row">
      <button class="icon-btn small-icon" aria-label="Fechar" on:click={() => (open = false)}>
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
      <div class="scope-nav" style:visibility={scope === 'year' ? 'hidden' : 'visible'}>
        <button aria-label="Mês anterior" on:click={() => { scopeMonth = (scopeMonth + 11) % 12; selectedDay = null; }}><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg></button>
        <span class="scope-label">{MONTHS_FULL[scopeMonth]} {year}</span>
        <button aria-label="Próximo mês" on:click={() => { scopeMonth = (scopeMonth + 1) % 12; selectedDay = null; }}><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>
    </div>

    <div class="panel-scroll">
      {#if scopedData.inc === 0 && scopedData.exp === 0}
        <div class="empty">Nada lançado neste período.<br />Comece pela tela inicial.</div>
      {:else}
        <div class="hero">
          <div class="hero-grid">
            <div class="hero-cell hero-main">
              <div class="hl">Gasto {hero.dayLabel}</div>
              <div class="hv">{fmtShort(hero.burn)}</div>
              <div class="hs">Projeção do período: <span class="mono">{fmtShort(hero.projected)}</span> de <span class="mono">{fmtShort(hero.budget)}</span></div>
              <div class="pace-track">
                <div class="pace-fill" style:width={`${hero.pacePct}%`} style:background={hero.levelColor}></div>
                {#if hero.projected > hero.budget}
                  <div class="pace-marker" style:left={`${hero.markerPos}%`}></div>
                {/if}
              </div>
            </div>
            <div class="hero-cell">
              <div class="hl">Saldo</div>
              <div class="hv" style:color={scopedData.net >= 0 ? 'var(--green)' : 'var(--red)'}>{fmtShort(scopedData.net)}</div>
              <div class="hs">{fmtShort(scopedData.inc)} entrou · {fmtShort(scopedData.exp)} saiu</div>
            </div>
            <div class="hero-cell">
              <div class="hl">Taxa de poupança</div>
              <div class="hv" style:color={hero.savings >= 20 ? 'var(--green)' : hero.savings >= 0 ? 'var(--yellow)' : 'var(--red)'}>{hero.savings.toFixed(0)}<span class="u">%</span></div>
              <div class="hs">do que entrou, sobrou</div>
            </div>
          </div>
        </div>

        <AnalyticsMetricRail {scope} {year} {scopeMonth} {settings} {scopedData} {hero} {reserve} {rankItems} {heatCells} {trendRows} />

        <div class="sec-h">
          <span class="st">Para onde foi</span>
          <span class="seg-mini">
            <button class:active={rankMode === 'cat'} on:click={() => (rankMode = 'cat')}>Categoria</button>
            <button class:active={rankMode === 'group'} on:click={() => (rankMode = 'group')}>Grupo</button>
          </span>
        </div>
        {#if rankItems.length}
          <div class="ms rank-note">
            Maior peso: <b>{rankItems[0].name}</b>{rankItems.length > 1 ? ` — concentra ${((rankItems[0].v / (scopedData.exp || 1)) * 100).toFixed(0)}% das saídas.` : '.'}
          </div>
          {#each rankItems as item, index}
            <div class:top={index === 0} class="rank-row">
              <div class="rank-line">
                <span class="rank-name">
                  {#if item.icon}
                    <span class="ri"><svg viewBox="0 0 24 24">{@html item.icon}</svg></span>
                  {/if}
                  {item.name}
                  {#if item.delta}
                    <span class={`rank-delta ${item.deltaClass}`}>{item.delta}</span>
                  {/if}
                </span>
                <span class="rank-val">{fmtShort(item.v)}<span class="pct">{item.pct.toFixed(0)}%</span></span>
              </div>
              <div class="rank-track"><div class="rank-bar" style:width={`${item.width.toFixed(1)}%`}></div></div>
            </div>
          {/each}
        {:else}
          <div class="ms">Sem saídas categorizadas.</div>
        {/if}

        <div class="sec-h"><span class="st">Equilíbrio</span><span class="sx">{scope === 'year' ? 'no ano' : 'no mês'}</span></div>
        <div class="summary">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {#each allocation.segments as segment}
              <circle cx="40" cy="40" r="34" fill="none" stroke={segment.color} stroke-width="8" stroke-dasharray={`${segment.length} ${2 * Math.PI * 34 - segment.length}`} stroke-dashoffset={-segment.offset} transform="rotate(-90 40 40)" />
            {/each}
          </svg>
          <div class="summary-txt">
            <div class="stt">Investimentos</div>
            <div class="sv" style:color={allocation.investmentPct >= 20 ? 'var(--green)' : 'var(--yellow)'}>{allocation.investmentPct.toFixed(0)}%</div>
            <div class="ss">
              {#each allocation.segments as segment, index}
                <span style:color={segment.color}>●</span> {segment.group} {segment.pct.toFixed(0)}%{index < allocation.segments.length - 1 ? '  ' : ''}
              {/each}
            </div>
          </div>
        </div>

        {#if reserve}
          <div class="sec-h"><span class="st">Reserva de emergência</span><span class="sx">âncora p/ investir</span></div>
          <div class="reserve">
            <div class="reserve-top">
              <div>
                <div class="rt-l">Acumulado</div>
                <div class="rt-v">{fmtShort(reserve.reserveTotal)}</div>
                <div class="rt-s">de {fmtShort(reserve.target)} (meta 6×)</div>
              </div>
              <div class="text-right">
                <div class="rt-l">Cobre se a renda parar</div>
                <div class="rt-v" style:color={reserve.runwayColor}>{reserve.runwayLabel}</div>
                <div class="rt-s">no seu ritmo de gasto</div>
              </div>
            </div>
            <svg class="reserve-chart" viewBox={`0 0 ${reserve.width} ${reserve.height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="resg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="var(--sage)" stop-opacity="0.28" />
                  <stop offset="1" stop-color="var(--sage)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line x1={reserve.padL} y1={reserve.targetY.toFixed(1)} x2={reserve.width - reserve.padR} y2={reserve.targetY.toFixed(1)} stroke="var(--line-2)" stroke-width="1" stroke-dasharray="3 3" />
              <text x={reserve.width - reserve.padR} y={(reserve.targetY - 5).toFixed(1)} text-anchor="end" font-size="8" fill="var(--muted)" font-family="var(--mono)">meta</text>
              <path d={reserve.areaPath} fill="url(#resg)" />
              <path d={reserve.linePath} fill="none" stroke="var(--sage-bright)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              {#if reserve.beX !== null}
                <circle cx={reserve.beX.toFixed(1)} cy={reserve.targetY.toFixed(1)} r="3.5" fill="var(--sage-bright)" stroke="var(--bg-2)" stroke-width="1.5" />
              {/if}
              <text x={reserve.padL} y={reserve.height - 5} font-size="8" fill="var(--muted)" font-family="var(--mono)">hoje</text>
              <text x={reserve.width - reserve.padR} y={reserve.height - 5} text-anchor="end" font-size="8" fill="var(--muted)" font-family="var(--mono)">+{reserve.horizon}m</text>
            </svg>
            <div class="reserve-foot">
              <div class="rf-cell"><span class="rf-n">{reserve.pctOfTarget.toFixed(0)}%</span><span class="rf-l">da meta</span></div>
              <div class="rf-cell"><span class="rf-n">{reserve.beLabel}</span><span class="rf-l">até completar</span></div>
              <div class="rf-cell"><span class="rf-n">{fmtShort(reserve.monthlyAport)}</span><span class="rf-l">aporte/mês</span></div>
            </div>
            {#if reserve.reserveTotal === 0}
              <div class="ms reserve-message">Lance aportes na categoria <b>Reserva</b> para acompanhar o break-even.</div>
            {:else if reserve.runway < 6}
              <div class="ms reserve-message">Sua reserva cobre <b style:color={reserve.runwayColor}>{reserve.runwayLabel}</b>. O ideal são 6 meses antes de priorizar investimento de risco.</div>
            {:else}
              <div class="ms reserve-message">Reserva sólida ({reserve.runwayLabel} de cobertura). Você já pode direcionar o excedente para investimentos de prazo maior.</div>
            {/if}
          </div>
        {/if}

        <div class="sec-h">
          <span class="st">Ritmo do ano</span>
          <span class="sx"><span class="sage-text">entrou</span> · <span class="neg-text">saiu</span></span>
        </div>
        <div class="trend">
          {#each trendRows as row}
            <div class:cur={row.current} class="tcol">
              <div class="tb-wrap">
                <div class="tb income-bar" style:height={`${row.incPct.toFixed(0)}%`}></div>
                <div class="tb expense-bar" style:height={`${row.expPct.toFixed(0)}%`}></div>
              </div>
              <span class="tl">{row.month}</span>
            </div>
          {/each}
        </div>

        {#if scope === 'month'}
          <div class="sec-h"><span class="st">Dias de gasto</span><span class="sx">{MONTHS_FULL[scopeMonth]} · toque um dia</span></div>
          <div class="heat-dow">
            {#each DOW as day}
              <span>{day}</span>
            {/each}
          </div>
          <div class="heat">
            {#each heatCells as cell}
              {#if cell.blank}
                <div class="heat-cell blank-cell"></div>
              {:else}
                <button class:has={cell.value > 0} class:sel={selectedDay === cell.day} class="heat-cell" style:background={cell.background} on:click={() => (selectedDay = cell.day)}>
                  <span class="hc-d">{cell.day}</span>
                </button>
              {/if}
            {/each}
          </div>
          <div class="heat-legend">menos<span class="sc"><i></i><i></i><i></i><i></i></span>mais</div>
          {#if selectedDay}
            <div class="day-detail">
              <div class="dd-head">
                {selectedDay} de {MONTHS_FULL[scopeMonth]}
                <span class="dd-tot">{fmtShort(dayEntries.filter((entry) => entry.type === 'out').reduce((sum, entry) => sum + entry.amount, 0))} em saídas</span>
              </div>
              {#if dayEntries.length}
                {#each dayEntries.filter((entry) => entry.type === 'out').sort((a, b) => b.amount - a.amount) as entry}
                  {@const category = catById(entry.cat)}
                  <div class="dd-row">
                    <span class="dd-cat">
                      {#if category}<svg viewBox="0 0 24 24">{@html category.icon}</svg>{/if}
                      <span>{entry.desc || category?.name || 'Saída'}</span>
                    </span>
                    <span class="dd-amt neg">−{fmtNum(entry.amount)}</span>
                  </div>
                {/each}
                {#each dayEntries.filter((entry) => entry.type === 'in') as entry}
                  {@const category = catById(entry.cat)}
                  <div class="dd-row">
                    <span class="dd-cat">
                      {#if category}<svg viewBox="0 0 24 24">{@html category.icon}</svg>{/if}
                      <span>{entry.desc || category?.name || 'Entrada'}</span>
                    </span>
                    <span class="dd-amt pos">+{fmtNum(entry.amount)}</span>
                  </div>
                {/each}
              {:else}
                <div class="ms">Sem lançamentos neste dia.</div>
              {/if}
            </div>
          {/if}
        {/if}

        {#if entriesIn(data, (y) => y === year).length}
          <div class="sec-h"><span class="st">Planilha do ano</span><span class="sx">{year}</span></div>
          <table class="sheet-table">
            <thead>
              <tr><th>Mês</th><th>Entrou</th><th>Saiu</th><th>Saldo</th></tr>
            </thead>
            <tbody>
              {#each MONTHS_FULL as monthName, index}
                {@const month = monthAgg(data, year, index)}
                {@const safety = monthSafetyLevel(month.exp, settings)}
                <tr class:tint-green={(month.inc || month.exp) && safety === 'green'} class:tint-yellow={(month.inc || month.exp) && safety === 'yellow'} class:tint-red={(month.inc || month.exp) && safety === 'red'}>
                  <td>{monthName}<span class="dot" style:background={(month.inc || month.exp) ? (safety === 'green' ? 'var(--green)' : safety === 'yellow' ? 'var(--yellow)' : 'var(--red)') : 'transparent'}></span></td>
                  <td class="income-cell">{month.inc ? fmtShort(month.inc) : '–'}</td>
                  <td class="expense-cell">{month.exp ? fmtShort(month.exp) : '–'}</td>
                  <td class="net-cell" style:color={month.net >= 0 ? 'var(--green)' : 'var(--red)'}>{month.inc || month.exp ? fmtShort(month.net) : '–'}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="year-total">
                <td>Ano</td>
                <td class="mono income-cell">{fmtShort(yearlyData.inc)}</td>
                <td class="mono expense-cell">{fmtShort(yearlyData.exp)}</td>
                <td class="mono net-cell" style:color={yearlyData.net >= 0 ? 'var(--green)' : 'var(--red)'}>{fmtShort(yearlyData.net)}</td>
              </tr>
            </tfoot>
          </table>
        {/if}
      {/if}
    </div>
  </div>
</section>

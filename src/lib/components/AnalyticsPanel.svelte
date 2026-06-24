<script lang="ts">
  import { browser } from '$app/environment';
  import { tick } from 'svelte';
  import { catById } from '$lib/categories';
  import AnalyticsMetricRail from '$lib/components/AnalyticsMetricRail.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { entriesIn, fmtNum, MONTHS, MONTHS_FULL, monthAgg } from '$lib/finance';
  import { categoryFilterItems, getCategoryEntries } from '$lib/viewModels';
  import type {
    Aggregate,
    CategoryFilterItem,
    DatedEntry,
    HeatCell,
    HeroModel,
    LedgerData,
    ProjectionMonth,
    RankItem,
    ReserveModel,
    Scope,
    Settings,
    TrendRow
  } from '$lib/types';

  export let open = false;
  export let scope: Scope;
  export let scopeMonth: number;
  export let selectedDay: number | null;
  export let year: number;
  export let data: LedgerData;
  export let settings: Settings;
  export let scopedData: Aggregate;
  export let rankItems: RankItem[];
  export let reserve: ReserveModel | null;
  export let trendRows: TrendRow[];
  export let heatCells: HeatCell[];
  export let hero: HeroModel;
  export let portfolioContribution = 0;
  export let projections: ProjectionMonth[];
  export let onOpenSettings: () => void;
  export let onOpenFlux: () => void;

  let yearSheetOpen = false;
  let expandedMonth: number | null = null;
  let selectedCategoryId = '';
  let wasOpen = false;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  $: periodBase = scope === 'year' ? settings.salary * 12 : settings.salary;
  $: activeProjection =
    scope === 'year'
      ? [...projections].reverse().find((item) => item.closing !== null) || projections[new Date().getMonth()]
      : projections[scopeMonth];
  $: projectionClosing = activeProjection?.closing ?? settings.currentBalance;
  $: projectionOpening = activeProjection?.opening ?? settings.currentBalance;
  $: projectionIncome = activeProjection?.income ?? 0;
  $: projectionExpenses = activeProjection?.expenses ?? 0;
  $: budgetCards = [
    {
      name: 'Essentials',
      group: 'Essenciais',
      targetPct: settings.essenciais,
      dot: '#85b694'
    },
    {
      name: 'Desires',
      group: 'Desejos',
      targetPct: settings.desejos,
      dot: '#5f638b'
    },
    {
      name: 'Saved',
      group: 'Investimentos',
      targetPct: settings.investimentos,
      dot: '#58610e',
      portfolioOnly: true
    }
  ].map((item) => {
    const used = item.portfolioOnly ? portfolioContribution : scopedData.byGroup[item.group] || 0;
    const target = periodBase * (item.targetPct / 100);
    const line = `R$ ${fmtNum(used).replace(',00', '')} / R$ ${fmtNum(target).replace(',00', '')}`;
    return {
      ...item,
      used,
      target,
      pct: target > 0 ? (used / target) * 100 : 0,
      line,
      lineSize: line.length > 22 ? 8 : line.length > 18 ? 9 : 10
    };
  });
  $: categoryFilters = categoryFilterItems(scopedData);
  $: selectedFilter = categoryFilters.find((item) => item.id === selectedCategoryId) || null;
  $: filteredCategoryEntries = selectedCategoryId
    ? getCategoryEntries(data, year, scope, scopeMonth, settings, selectedCategoryId)
    : [];
  $: if (selectedCategoryId && !categoryFilters.some((item) => item.id === selectedCategoryId)) {
    selectedCategoryId = '';
  }

  $: if (browser && open && !wasOpen) {
    wasOpen = true;
    tick().then(() => document.querySelector('.aeon-screen.open .metric-rail')?.scrollTo({ left: 0 }));
  } else if (!open && wasOpen) {
    wasOpen = false;
  }

  function setScope(next: Scope) {
    scope = next;
    if (next === 'year') selectedDay = null;
  }

  function monthEntries(month: number) {
    return entriesIn(data, (entryYear, entryMonth) => entryYear === year && entryMonth === month).sort(
      (a, b) => b._d - a._d || b.id.localeCompare(a.id)
    );
  }

  function titleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    return entry.desc || category?.name || (entry.type === 'in' ? 'Income' : 'Expense');
  }

  function subtitleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    const installment =
      entry.installmentIndex && entry.installmentCount ? ` · ${entry.installmentIndex}/${entry.installmentCount}` : '';
    return `${category?.name || 'Other'} · ${entry._d} ${monthNames[entry._m].toLowerCase()}${installment}`;
  }

  function toggleCategoryFilter(item: CategoryFilterItem) {
    selectedCategoryId = selectedCategoryId === item.id ? '' : item.id;
  }
</script>

<section class:open class="aeon-screen" aria-hidden={!open} inert={!open}>
  <div class="aeon-content">
    <header class="aeon-topbar">
      <h1><span>Æ</span>on</h1>
      <button class="icon-btn header-plus" type="button" aria-label="New entry" on:click={onOpenFlux}>
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </header>

    <div class="aeon-tabs" role="tablist" aria-label="Analytics range">
      <button class:active={scope === 'month'} type="button" on:click={() => setScope('month')}>This month</button>
      <button class:active={scope === 'year'} type="button" on:click={() => setScope('year')}>This Year</button>
      <button type="button" on:click={() => setScope('year')}>All Time</button>
    </div>

    <section class="aeon-hero">
      <h2>Projected cycle end</h2>
      <div class="aeon-balance">R$ {fmtNum(projectionClosing)}</div>
      <div class="aeon-subline">
        <span>opening: R$ {fmtNum(projectionOpening).replace(',00', '')}</span>
        <i></i>
        <span>expected: +R$ {fmtNum(projectionIncome).replace(',00', '')} / due −R$ {fmtNum(projectionExpenses).replace(',00', '')}</span>
      </div>
    </section>

    <AnalyticsMetricRail
      {scope}
      {year}
      {scopeMonth}
      {settings}
      {scopedData}
      {hero}
      {reserve}
      {rankItems}
      {heatCells}
      {trendRows}
      investmentTotal={portfolioContribution}
    />

    <section class="allocation-cards" aria-label="Allocation targets">
      {#each budgetCards as item}
        <article class="allocation-card">
          <span class="allocation-dot" style:background={item.dot}></span>
          <h3>{item.name}</h3>
          <strong>{item.pct.toFixed(0)}%</strong>
          <p style={`--allocation-line-size: ${item.lineSize}px`}>{item.line}</p>
        </article>
      {/each}
    </section>

    {#if categoryFilters.length}
      <section class:open={!!selectedFilter} class="aeon-category-drilldown" aria-label="Category drilldown">
        <div class="aeon-section-head aeon-tags-head">
          <h2>Tags</h2>
          {#if selectedFilter}
            <span>{selectedFilter.name} · R$ {fmtNum(selectedFilter.amount).replace(',00', '')}</span>
          {:else}
            <span>tap to inspect</span>
          {/if}
        </div>

        <div class="aeon-tag-row" aria-label="Spending tags">
          {#each categoryFilters as item}
            <button
              class:active={selectedCategoryId === item.id}
              class="aeon-tag-chip"
              type="button"
              aria-pressed={selectedCategoryId === item.id}
              on:click={() => toggleCategoryFilter(item)}
            >
              <span class="tag-icon">
                {#if item.icon}<svg viewBox="0 0 24 24">{@html item.icon}</svg>{/if}
              </span>
              <span>{item.name}</span>
              <strong>R$ {fmtNum(item.amount).replace(',00', '')}</strong>
            </button>
          {/each}
        </div>

        {#if selectedFilter}
          <div class="aeon-filter-list">
            {#if filteredCategoryEntries.length}
              {#each filteredCategoryEntries as entry}
                {@const category = catById(entry.cat)}
                <div class="sheet-movement-row">
                  <span class="movement-icon">
                    {#if category}<svg viewBox="0 0 24 24">{@html category.icon}</svg>{/if}
                  </span>
                  <span class="movement-main">
                    <span class="movement-title">{titleFor(entry)}</span>
                    <span class="movement-sub">{subtitleFor(entry)}</span>
                  </span>
                  <span class:pos={entry.type === 'in'} class:neg={entry.type === 'out'} class="movement-amount">
                    {entry.type === 'in' ? '+' : '−'}R$ {fmtNum(entry.amount)}
                  </span>
                </div>
              {/each}
            {:else}
              <div class="year-empty">No {selectedFilter.name} movements in this range.</div>
            {/if}
          </div>
        {/if}
      </section>
    {/if}

    <section class="yearly-rhythm">
      <div class="aeon-section-head">
        <h2>Yearly Rhythm</h2>
        <span>income / expenses</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
      </div>
      <div class="aeon-trend" aria-label="Income and expenses by month">
        {#each trendRows as row, index}
          <button class:current={row.current} class="aeon-month-bar" type="button" on:click={() => { setScope('month'); scopeMonth = index; }}>
            <span class="bar-pair">
              <i class="income-bar" style:height={`${row.incPct.toFixed(0)}%`}></i>
              <i class="expense-bar" style:height={`${row.expPct.toFixed(0)}%`}></i>
            </span>
            <span>{monthNames[index].toLowerCase()}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class:expanded={yearSheetOpen} class="year-sheet">
      <button class="year-sheet-head" type="button" on:click={() => (yearSheetOpen = !yearSheetOpen)}>
        <span>Year Sheet</span>
        <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
      </button>

      {#if yearSheetOpen}
        <div class="year-sheet-list">
          {#each MONTHS as month, index}
            {@const summary = monthAgg(data, year, index)}
            {@const movements = monthEntries(index)}
            <article class:open={expandedMonth === index} class="year-month">
              <button type="button" on:click={() => (expandedMonth = expandedMonth === index ? null : index)}>
                <span class="month-name">{monthNamesFull[index]}</span>
                <span class="month-money">R$ {fmtNum(summary.net)}</span>
                <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {#if expandedMonth === index}
                <div class="year-month-movements">
                  {#if movements.length}
                    {#each movements as entry}
                      {@const category = catById(entry.cat)}
                      <div class="sheet-movement-row">
                        <span class="movement-icon">
                          {#if category}<svg viewBox="0 0 24 24">{@html category.icon}</svg>{/if}
                        </span>
                        <span class="movement-main">
                          <span class="movement-title">{titleFor(entry)}</span>
                          <span class="movement-sub">{subtitleFor(entry)}</span>
                        </span>
                        <span class:pos={entry.type === 'in'} class:neg={entry.type === 'out'} class="movement-amount">
                          {entry.type === 'in' ? '+' : '−'}R$ {fmtNum(entry.amount)}
                        </span>
                      </div>
                    {/each}
                  {:else}
                    <div class="year-empty">No movements in {monthNamesFull[index]}.</div>
                  {/if}
                </div>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <BottomNav active="aeon" onOpenAeon={() => undefined} onOpenFlux={onOpenFlux} onOpenSettings={onOpenSettings} />
</section>

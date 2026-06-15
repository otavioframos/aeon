<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '../app.css';
  import MeshBackground from '$lib/MeshBackground.svelte';
  import { CATS, catById } from '$lib/categories';
  import {
    DEFAULT_SETTINGS,
    DOW,
    MONTHS,
    MONTHS_FULL,
    aggregate,
    daysInMonth,
    daysInYear,
    entriesIn,
    fmtNum,
    fmtShort,
    key,
    monthAgg,
    monthSafetyLevel,
    parseAmount,
    uid
  } from '$lib/finance';
  import { loadData, loadSettings, normalizeBackup, saveData, saveSettings as persistSettings } from '$lib/storage';
  import type { Aggregate, BackupPayload, DatedEntry, EntryType, LedgerData, RankMode, Scope, Settings } from '$lib/types';

  type MeshHandle = { triggerWave: (type: EntryType) => void };
  type RankItem = {
    k: string;
    v: number;
    name: string;
    icon: string;
    pct: number;
    width: number;
    delta: string;
    deltaClass: 'up' | 'down';
  };
  type ReserveModel = ReturnType<typeof reserveModel>;
  type HeatCell = { day: number; value: number; background: string; blank: boolean };

  const goalSliders = [
    ['essenciais', 'Essenciais', '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>'],
    ['desejos', 'Desejos', '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z"/>'],
    ['investimentos', 'Investimentos', '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>']
  ] as const;

  const meshSliders = [
    ['dotSpacing', 'Espaçamento', 10, 40, 1, 0],
    ['dotSize', 'Tamanho do ponto', 0.5, 4, 0.1, 1],
    ['dotOpacity', 'Opacidade', 0.05, 0.8, 0.01, 2],
    ['waveIntensity', 'Força da onda', 0, 30, 1, 0],
    ['waveRadius', 'Alcance da onda', 80, 400, 10, 0],
    ['noise', 'Dithering', 0, 0.2, 0.005, 3]
  ] as const;

  let year = new Date().getFullYear();
  let data: LedgerData = {};
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let amount = '';
  let desc = '';
  let selCat = '';
  let scope: Scope = 'month';
  let scopeMonth = new Date().getMonth();
  let rankMode: RankMode = 'cat';
  let selectedDay: number | null = null;
  let controlOpen = false;
  let sheetOpen = false;
  let dashOpen = false;
  let setOpen = false;
  let flashText = 'salvo';
  let flashVisible = false;
  let flashTimer: ReturnType<typeof setTimeout>;
  let amountInput: HTMLInputElement;
  let fileInput: HTMLInputElement;
  let mesh: MeshHandle;

  let currentMonth: Aggregate = aggregate([]);
  let scopedData: Aggregate = aggregate([]);
  let previousScopedData: Aggregate = aggregate([]);
  let rankItems: RankItem[] = [];
  let reserve: ReserveModel = null;
  let trendRows: { month: string; incPct: number; expPct: number; current: boolean }[] = [];
  let heatCells: HeatCell[] = [];
  let dayEntries: DatedEntry[] = [];
  let yearlyData: Aggregate = aggregate([]);

  $: currentMonth = monthAgg(data, year, new Date().getMonth());
  $: scopedData = getScopeData(data, year, scope, scopeMonth);
  $: previousScopedData = getPrevScopeData(data, year, scope, scopeMonth);
  $: rankItems = buildRankItems(scopedData, previousScopedData, rankMode);
  $: reserve = reserveModel(data, year);
  $: trendRows = trendModel(data, year, scope, scopeMonth);
  $: heatCells = heatModel(data, year, scope, scopeMonth);
  $: dayEntries = selectedDay
    ? entriesIn(data, (y, m, d) => y === year && m === scopeMonth && d === selectedDay)
    : [];
  $: yearlyData = aggregate(entriesIn(data, (y) => y === year));
  $: selectedCategory = catById(selCat);
  $: controlLabel = selectedCategory?.name || 'Categoria e descrição';
  $: allocation = allocationModel(scopedData);
  $: hero = heroModel(scopedData, scope, year, scopeMonth, settings);

  onMount(() => {
    data = loadData(year);
    settings = loadSettings();
    tick().then(() => amountInput?.focus());
  });

  function flash(message = 'salvo') {
    flashText = message;
    flashVisible = true;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flashVisible = false;
    }, 900);
  }

  function save() {
    try {
      saveData(year, data);
      flash();
    } catch {
      alert('Salvamento bloqueado aqui. Baixe o arquivo e abra no seu navegador para salvar de verdade.');
    }
  }

  function saveSettings() {
    try {
      persistSettings(settings);
    } catch {
      // localStorage can be unavailable in strict browser modes; the app remains usable for the session.
    }
  }

  function addEntry() {
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value === 0) {
      amountInput?.focus();
      return;
    }

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    if (y !== year) {
      year = y;
      data = loadData(year);
    }

    const type: EntryType = value < 0 ? 'out' : 'in';
    const k = key(y, m, d);
    const next = { ...data };
    next[k] = [
      ...(next[k] || []),
      {
        id: uid(),
        amount: Math.abs(value),
        type,
        cat: selCat,
        desc: desc.trim()
      }
    ];
    data = next;
    save();
    mesh?.triggerWave(type);

    amount = '';
    desc = '';
    selCat = '';
    controlOpen = false;
    amountInput?.focus();
  }

  function deleteEntry(entryKey: string, id: string) {
    if (!data[entryKey]) return;
    const next = { ...data };
    next[entryKey] = next[entryKey].filter((entry) => entry.id !== id);
    if (!next[entryKey].length) delete next[entryKey];
    data = next;
    save();
  }

  function getScopeData(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number) {
    return currentScope === 'year'
      ? aggregate(entriesIn(currentData, (y) => y === currentYear))
      : aggregate(entriesIn(currentData, (y, m) => y === currentYear && m === currentScopeMonth));
  }

  function getPrevScopeData(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number) {
    if (currentScope === 'year') return aggregate(entriesIn(currentData, (y) => y === currentYear - 1));
    const previousMonth = currentScopeMonth - 1;
    if (previousMonth < 0) return aggregate(entriesIn(currentData, (y, m) => y === currentYear - 1 && m === 11));
    return aggregate(entriesIn(currentData, (y, m) => y === currentYear && m === previousMonth));
  }

  function buildRankItems(current: Aggregate, previous: Aggregate, mode: RankMode): RankItem[] {
    const src = mode === 'cat' ? current.byCat : current.byGroup;
    const prevSrc = mode === 'cat' ? previous.byCat : previous.byGroup;
    const items = Object.keys(src)
      .map((k) => ({ k, v: src[k] }))
      .sort((a, b) => b.v - a.v);
    const max = items.length ? items[0].v : 1;
    const total = current.exp || 1;

    return items.map((item) => {
      const category = mode === 'cat' ? catById(item.k) : undefined;
      const prevV = prevSrc[item.k] || 0;
      let delta = '';
      let deltaClass: 'up' | 'down' = 'up';
      if (prevV > 0) {
        const change = ((item.v - prevV) / prevV) * 100;
        if (Math.abs(change) >= 5) {
          delta = `${change > 0 ? '▲' : '▼'}${Math.abs(change).toFixed(0)}%`;
          deltaClass = change > 0 ? 'up' : 'down';
        }
      } else if (item.v > 0) {
        delta = 'novo';
      }

      return {
        ...item,
        name: mode === 'cat' ? category?.name || 'Outros' : item.k,
        icon: mode === 'cat' ? category?.icon || '' : '',
        pct: (item.v / total) * 100,
        width: (item.v / max) * 100,
        delta,
        deltaClass
      };
    });
  }

  function allocationModel(current: Aggregate) {
    const groups = ['Essenciais', 'Desejos', 'Investimentos'];
    const values = groups.map((group) => current.byGroup[group] || 0);
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    const colors = ['var(--color-text)', 'var(--color-red-soft)', 'var(--color-text-strong)'];
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const segments = values.map((value, index) => {
      const length = (value / total) * circumference;
      const segment = { length, offset, color: colors[index], group: groups[index], pct: (value / total) * 100 };
      offset += length;
      return segment;
    });
    return {
      investmentPct: (values[2] / total) * 100,
      segments
    };
  }

  function heroModel(current: Aggregate, currentScope: Scope, currentYear: number, currentScopeMonth: number, currentSettings: Settings) {
    const isYear = currentScope === 'year';
    const today = new Date();
    let elapsed: number;
    let total: number;
    let dayLabel: string;
    if (isYear) {
      const soy = new Date(currentYear, 0, 1);
      const ref = currentYear === today.getFullYear() ? today : new Date(currentYear, 11, 31);
      elapsed = Math.max(1, Math.round((ref.getTime() - soy.getTime()) / 86400000) + 1);
      total = daysInYear(currentYear);
      dayLabel = 'por dia (ano)';
    } else {
      total = daysInMonth(currentYear, currentScopeMonth);
      elapsed = currentYear === today.getFullYear() && currentScopeMonth === today.getMonth() ? today.getDate() : total;
      dayLabel = 'por dia';
    }

    const burn = current.exp / elapsed;
    const budget = isYear ? currentSettings.salary * 12 : currentSettings.salary;
    const projected = burn * total;
    const pacePct = budget > 0 ? Math.min(140, (projected / budget) * 100) : 0;
    const level =
      projected <= (budget * (currentSettings.essenciais + currentSettings.desejos)) / 100
        ? 'green'
        : projected <= budget
          ? 'yellow'
          : 'red';
    const markerPos = projected > budget ? Math.min(100, 100 / (projected / budget)) : 100;
    return {
      burn,
      budget,
      dayLabel,
      markerPos,
      pacePct: Math.min(100, pacePct),
      projected,
      savings: current.inc > 0 ? ((current.inc - current.exp) / current.inc) * 100 : 0,
      levelColor: level === 'green' ? 'var(--green)' : level === 'yellow' ? 'var(--yellow)' : 'var(--red)'
    };
  }

  function reserveModel(currentData: LedgerData, currentYear: number) {
    const reserveEntries = entriesIn(currentData, (y) => y === currentYear).filter((entry) => entry.type === 'out' && entry.cat === 'reserva');
    const reserveTotal = reserveEntries.reduce((sum, entry) => sum + entry.amount, 0);
    let totalExp = 0;
    const expMonths: Record<number, number> = {};
    entriesIn(currentData, (y) => y === currentYear).forEach((entry) => {
      if (entry.type === 'out') {
        totalExp += entry.amount;
        expMonths[entry._m] = (expMonths[entry._m] || 0) + entry.amount;
      }
    });

    const nMonths = Math.max(1, Object.keys(expMonths).length);
    const avgMonthlyExp = totalExp / nMonths;
    const target = avgMonthlyExp * 6;
    const reserveMonthsActive = new Set(reserveEntries.map((entry) => entry._m)).size || 1;
    const monthlyAport = reserveTotal / reserveMonthsActive;
    const runway = avgMonthlyExp > 0 ? reserveTotal / avgMonthlyExp : 0;
    const remaining = Math.max(0, target - reserveTotal);
    const monthsToTarget = monthlyAport > 0 ? remaining / monthlyAport : Infinity;
    const pctOfTarget = target > 0 ? Math.min(100, (reserveTotal / target) * 100) : 0;
    if (reserveTotal === 0 && avgMonthlyExp === 0) return null;

    const width = 300;
    const height = 120;
    const padL = 8;
    const padR = 8;
    const padT = 10;
    const padB = 18;
    const horizon = Math.min(24, Math.max(6, Math.ceil(Number.isFinite(monthsToTarget) ? monthsToTarget + 2 : 12)));
    const maxY = Math.max(target, reserveTotal + monthlyAport * horizon, 1);
    const x = (month: number) => padL + (width - padL - padR) * (month / horizon);
    const y = (value: number) => padT + (height - padT - padB) * (1 - value / maxY);
    const points = Array.from({ length: horizon + 1 }, (_, month) => {
      const value = Math.min(maxY, reserveTotal + monthlyAport * month);
      return [x(month), y(value)] as const;
    });
    const linePath = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${x(horizon).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;
    const targetY = y(target);
    const beX = Number.isFinite(monthsToTarget) ? x(Math.min(horizon, monthsToTarget)) : null;
    const runwayLevel = runway >= 6 ? 'green' : runway >= 3 ? 'yellow' : 'red';
    const runwayColor = runwayLevel === 'green' ? 'var(--green)' : runwayLevel === 'yellow' ? 'var(--yellow)' : 'var(--red)';

    return {
      areaPath,
      beLabel: Number.isFinite(monthsToTarget)
        ? monthsToTarget < 1
          ? 'menos de 1 mês'
          : monthsToTarget < 12
            ? `${Math.ceil(monthsToTarget)} meses`
            : `${(monthsToTarget / 12).toFixed(1)} anos`
        : 'sem aporte ainda',
      beX,
      height,
      horizon,
      linePath,
      monthlyAport,
      padL,
      padR,
      pctOfTarget,
      reserveTotal,
      runway,
      runwayColor,
      runwayLabel: runway < 1 ? 'menos de 1 mês' : `${runway.toFixed(1)} ${runway >= 2 ? 'meses' : 'mês'}`,
      target,
      targetY,
      width
    };
  }

  function trendModel(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number) {
    let max = 1;
    for (let month = 0; month < 12; month++) {
      const current = monthAgg(currentData, currentYear, month);
      max = Math.max(max, current.inc, current.exp);
    }
    return MONTHS.map((month, index) => {
      const current = monthAgg(currentData, currentYear, index);
      return {
        month,
        incPct: (current.inc / max) * 100,
        expPct: (current.exp / max) * 100,
        current: currentScope === 'month' && index === currentScopeMonth
      };
    });
  }

  function heatModel(currentData: LedgerData, currentYear: number, currentScope: Scope, currentScopeMonth: number): HeatCell[] {
    if (currentScope === 'year') return [];
    const dim = daysInMonth(currentYear, currentScopeMonth);
    const firstDow = new Date(currentYear, currentScopeMonth, 1).getDay();
    const dayExp: Record<number, number> = {};
    entriesIn(currentData, (y, m) => y === currentYear && m === currentScopeMonth).forEach((entry) => {
      if (entry.type === 'out') dayExp[entry._d] = (dayExp[entry._d] || 0) + entry.amount;
    });
    const max = Math.max(1, ...Object.values(dayExp));
    const blanks = Array.from({ length: firstDow }, () => ({ day: 0, value: 0, background: 'transparent', blank: true }));
    const days = Array.from({ length: dim }, (_, index) => {
      const day = index + 1;
      const value = dayExp[day] || 0;
      const intensity = value / max;
      return {
        day,
        value,
        blank: false,
        background: value === 0 ? 'var(--color-stroke)' : `rgba(163,6,6,${(0.08 + intensity * 0.22).toFixed(2)})`
      };
    });
    return blanks.concat(days);
  }

  function setScope(next: Scope) {
    scope = next;
    if (next === 'year') selectedDay = null;
  }

  function updateSetting<K extends keyof Settings>(keyName: K, value: Settings[K]) {
    settings = { ...settings, [keyName]: value };
    saveSettings();
  }

  function openDashboard() {
    scope = 'month';
    scopeMonth = new Date().getMonth();
    selectedDay = null;
    dashOpen = true;
  }

  function exportData() {
    const payload = { year, data, settings, exportedAt: new Date().toISOString() };
    downloadFile(`fluxo_${year}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  function exportCSV() {
    const rows: { y: number; m: number; d: number; entry: DatedEntry }[] = [];
    entriesIn(data, () => true).forEach((entry) => rows.push({ y: entry._y, m: entry._m, d: entry._d, entry }));
    rows.sort((a, b) => a.m - b.m || a.d - b.d);
    const esc = (value: unknown) => {
      const text = String(value ?? '');
      return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const sep = ';';
    const header = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'].join(sep);
    const lines = rows.map((row) => {
      const category = catById(row.entry.cat);
      const dateStr = `${String(row.d).padStart(2, '0')}/${String(row.m + 1).padStart(2, '0')}/${row.y}`;
      const tipo = row.entry.type === 'in' ? 'Entrada' : 'Saída';
      const value = `${row.entry.type === 'in' ? '' : '-'}${row.entry.amount.toFixed(2).replace('.', ',')}`;
      return [dateStr, tipo, category ? category.name : row.entry.cat || '', row.entry.desc || '', value].map(esc).join(sep);
    });
    downloadFile(`fluxo_${year}.csv`, `\uFEFF${[header].concat(lines).join('\r\n')}`, 'text/csv;charset=utf-8');
  }

  function downloadFile(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importDataFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = normalizeBackup(JSON.parse(String(reader.result)) as BackupPayload);
        if (!payload.data) {
          alert('Arquivo inválido.');
          return;
        }
        if (confirm(`Importar backup${payload.year ? ` de ${payload.year}` : ''}? Substitui os dados atuais.`)) {
          if (payload.year) year = payload.year;
          data = payload.data;
          if (payload.settings) settings = { ...settings, ...payload.settings };
          save();
          saveSettings();
          flash('importado');
        }
      } catch {
        alert('Não consegui ler o arquivo.');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
    sheetOpen = false;
  }

  function resetYear() {
    if (confirm(`Apagar todos os lançamentos de ${year}? Exporte um backup antes.`)) {
      data = {};
      save();
      sheetOpen = false;
    }
  }

  function metaWarnings() {
    const sum = settings.essenciais + settings.desejos + settings.investimentos;
    const warnings: { kind: 'ok' | 'warn' | 'bad'; text: string }[] = [];
    if (sum !== 100) warnings.push({ kind: 'warn', text: `As fatias somam ${sum}%. Ajuste para fechar 100%.` });
    if (settings.investimentos < 10) {
      warnings.push({ kind: 'bad', text: 'Investir abaixo de 10% é conservador demais — como autônomo, isso pesa na aposentadoria.' });
    } else if (settings.investimentos >= 30) {
      warnings.push({ kind: 'ok', text: `Meta de ${settings.investimentos}% em investimentos é excelente.` });
    }
    if (settings.essenciais > 60) warnings.push({ kind: 'bad', text: 'Essenciais acima de 60% deixa pouca folga.' });
    if (settings.desejos > 40) warnings.push({ kind: 'warn', text: 'Desejos acima de 40% pode comprometer a poupança.' });
    return warnings.length ? warnings : [{ kind: 'ok' as const, text: 'Divisão equilibrada.' }];
  }

  function fmtAes(value: number, decimals: number) {
    return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  }
</script>

<svelte:head>
  <title>Vela</title>
</svelte:head>

<MeshBackground bind:this={mesh} dimmed={sheetOpen || dashOpen || setOpen} {settings} />

<div class:dimmed={sheetOpen || dashOpen || setOpen} class="app">
  <div class="topbar">
    <button class="icon-btn" aria-label="Painel" on:click={openDashboard}>
      <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
    </button>
    <div class="brand">Flux</div>
    <button class="icon-btn" aria-label="Ajustes" on:click={() => (setOpen = true)}>
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    </button>
  </div>

  <div class="pills">
    <div class="pill"><span class="pl">Entrou</span><span class="pv pos mono">{fmtNum(currentMonth.inc)}</span></div>
    <div class="pill-sep"></div>
    <div class="pill"><span class="pl">Saiu</span><span class="pv neg mono">{fmtNum(currentMonth.exp)}</span></div>
    <div class="pill-sep"></div>
    <div class="pill"><span class="pl">Saldo do mês</span><span class:pos={currentMonth.net >= 0} class:neg={currentMonth.net < 0} class="pv mono">{fmtNum(currentMonth.net)}</span></div>
  </div>

  <div class="center">
    <div class="card">
      <div class="clab">Novo lançamento</div>
      <div class="amount-wrap">
        <span class="cur">R$</span>
        <input bind:this={amountInput} bind:value={amount} id="bigInput" type="text" inputmode="decimal" placeholder="0" autocomplete="off" size="1" on:keydown={(event) => event.key === 'Enter' && addEntry()} />
      </div>

      <div class="control">
        <button class:open={controlOpen} class="control-head" aria-expanded={controlOpen} aria-controls="categoryControl" on:click={() => (controlOpen = !controlOpen)}>
          <span class="ch-left">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            <span>{controlLabel}</span>
          </span>
          <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <div class:open={controlOpen} class="control-body" id="categoryControl" inert={!controlOpen}>
          <div class="cb-inner">
            <div class="cat-grid">
              {#each CATS as category}
                <button class:sel={selCat === category.id} class="cat" on:click={() => (selCat = selCat === category.id ? '' : category.id)}>
                  <svg viewBox="0 0 24 24">{@html category.icon}</svg>
                  <span class="cn">{category.name}</span>
                </button>
              {/each}
            </div>
            <input class="desc-input" bind:value={desc} type="text" placeholder="Descrição (opcional)" />
          </div>
        </div>
      </div>

      <button class="submit" on:click={addEntry}>
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        <span>Lançar</span>
      </button>
    </div>
  </div>
</div>

<button class="fab" aria-label="Mais" on:click={() => (sheetOpen = !sheetOpen)}>
  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
</button>
<button class:open={sheetOpen} class="sheet-backdrop" aria-label="Fechar dados" on:click={() => (sheetOpen = false)}></button>
<div class:open={sheetOpen} class="sheet">
  <div class="grab"></div>
  <h3>Dados</h3>
  <button class="sheet-row" on:click={() => { exportData(); sheetOpen = false; }}>
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
    Exportar backup (.json)
  </button>
  <button class="sheet-row" on:click={() => { exportCSV(); sheetOpen = false; }}>
    <svg viewBox="0 0 24 24"><path d="M4 3h10l6 6v12a0 0 0 010 0H4a0 0 0 010 0V3z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h8" /></svg>
    Exportar para planilha (.csv)
  </button>
  <button class="sheet-row" on:click={() => fileInput?.click()}>
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
    Importar backup (.json)
  </button>
  <button class="sheet-row danger" on:click={resetYear}>
    <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
    Limpar ano
  </button>
  <input bind:this={fileInput} type="file" accept=".json" on:change={importDataFile} />
</div>

<button class:open={dashOpen} class="ov-backdrop" aria-label="Fechar painel" on:click={() => (dashOpen = false)}></button>
<section class:open={dashOpen} class="panel" aria-hidden={!dashOpen}>
  <div class="panel-inner">
    <div class="panel-top">
      <div class="panel-title">Resumo <span class="yr">{scope === 'year' ? year : MONTHS_FULL[scopeMonth].toLowerCase()}</span></div>
      <div class="seg">
        <button class:active={scope === 'month'} on:click={() => setScope('month')}>Mês</button>
        <button class:active={scope === 'year'} on:click={() => setScope('year')}>Ano</button>
      </div>
    </div>
    <div class="scope-row">
      <button class="icon-btn small-icon" aria-label="Fechar" on:click={() => (dashOpen = false)}>
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

        <div class="sec-h">
          <span class="st">Para onde foi</span>
          <span class="seg-mini">
            <button class:active={rankMode === 'cat'} on:click={() => (rankMode = 'cat')}>Categoria</button>
            <button class:active={rankMode === 'group'} on:click={() => (rankMode = 'group')}>Grupo</button>
          </span>
        </div>
        {#if rankItems.length}
          <div class="ms rank-note">
            Maior peso: <b>{rankItems[0].name}</b>{rankItems.length > 1 ? ` — concentra ${(rankItems[0].v / (scopedData.exp || 1) * 100).toFixed(0)}% das saídas.` : '.'}
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

<button class:open={setOpen} class="ov-backdrop" aria-label="Fechar ajustes" on:click={() => (setOpen = false)}></button>
<section class:open={setOpen} class="panel" aria-hidden={!setOpen}>
  <div class="panel-inner">
    <div class="panel-top">
      <div class="panel-title">Ajustes</div>
      <button class="icon-btn small-icon" aria-label="Fechar" on:click={() => (setOpen = false)}>
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="panel-scroll">
      <div class="set-field">
        <div class="lh">Salário de referência</div>
        <input type="number" value={settings.salary} step="100" on:input={(event) => updateSetting('salary', parseFloat((event.currentTarget as HTMLInputElement).value) || 0)} />
        <div class="ms set-note">Base do gasto diário e do pace. Use um valor conservador se sua renda varia.</div>
      </div>

      <div class="set-field">
        <div class="lh">Metas de alocação</div>
        {#each goalSliders as goal}
          <div class="slider-row">
            <span class="sn"><svg viewBox="0 0 24 24">{@html goal[2]}</svg>{goal[1]}</span>
            <input type="range" min="0" max="100" value={settings[goal[0]]} on:input={(event) => updateSetting(goal[0], parseInt((event.currentTarget as HTMLInputElement).value))} />
            <span class="sval">{settings[goal[0]]}%</span>
          </div>
        {/each}
        <div class="sum-pill">Soma: {settings.essenciais + settings.desejos + settings.investimentos}%{settings.essenciais + settings.desejos + settings.investimentos !== 100 ? ' (ideal: 100%)' : ' ✓'}</div>
        {#each metaWarnings() as warning}
          <div class={`meta-warn ${warning.kind}`}>{warning.text}</div>
        {/each}
      </div>

      <div class="set-field">
        <div class="lh">Estética do fundo</div>
        {#each meshSliders as slider}
          <div class="slider-row">
            <span class="sn">{slider[1]}</span>
            <input type="range" min={slider[2]} max={slider[3]} step={slider[4]} value={settings[slider[0]]} on:input={(event) => updateSetting(slider[0], parseFloat((event.currentTarget as HTMLInputElement).value))} />
            <span class="sval">{fmtAes(settings[slider[0]], slider[5])}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<div class:show={flashVisible} class="flash">{flashText}</div>

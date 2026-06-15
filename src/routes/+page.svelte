<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '../app.css';
  import AnalyticsPanel from '$lib/components/AnalyticsPanel.svelte';
  import DataSheet from '$lib/components/DataSheet.svelte';
  import EntryComposer from '$lib/components/EntryComposer.svelte';
  import FluxHeader from '$lib/components/FluxHeader.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import MeshBackground from '$lib/MeshBackground.svelte';
  import { catById } from '$lib/categories';
  import { DEFAULT_SETTINGS, aggregate, entriesIn, key, monthAgg, parseAmount, uid } from '$lib/finance';
  import { loadData, loadSettings, normalizeBackup, saveData, saveSettings as persistSettings } from '$lib/storage';
  import {
    allocationModel,
    buildRankItems,
    getPrevScopeData,
    getScopeData,
    heatModel,
    heroModel,
    reserveModel,
    trendModel
  } from '$lib/viewModels';
  import type {
    Aggregate,
    AllocationModel,
    BackupPayload,
    DatedEntry,
    EntryType,
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

  type MeshHandle = { triggerWave: (type: EntryType) => void };

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
  let amountInput: HTMLInputElement | undefined;
  let mesh: MeshHandle;

  let currentMonth: Aggregate = aggregate([]);
  let scopedData: Aggregate = aggregate([]);
  let previousScopedData: Aggregate = aggregate([]);
  let rankItems: RankItem[] = [];
  let reserve: ReserveModel | null = null;
  let trendRows: TrendRow[] = [];
  let heatCells: HeatCell[] = [];
  let dayEntries: DatedEntry[] = [];
  let yearlyData: Aggregate = aggregate([]);
  let allocation: AllocationModel = allocationModel(scopedData);
  let hero: HeroModel = heroModel(scopedData, scope, year, scopeMonth, settings);

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
    const entryKey = key(y, m, d);
    const next = { ...data };
    next[entryKey] = [
      ...(next[entryKey] || []),
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

  function updateSetting(keyName: keyof Settings, value: number) {
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
</script>

<svelte:head>
  <title>Vela</title>
</svelte:head>

<MeshBackground bind:this={mesh} dimmed={sheetOpen || dashOpen || setOpen} {settings} />

<div class:dimmed={sheetOpen || dashOpen || setOpen} class="app">
  <FluxHeader {currentMonth} onOpenDashboard={openDashboard} onOpenSettings={() => (setOpen = true)} />
  <EntryComposer bind:amount bind:desc bind:selCat bind:controlOpen bind:amountInput onSubmit={addEntry} />
</div>

<DataSheet bind:open={sheetOpen} onExportData={exportData} onExportCSV={exportCSV} onImportDataFile={importDataFile} onResetYear={resetYear} />

<AnalyticsPanel
  bind:open={dashOpen}
  bind:scope
  bind:scopeMonth
  bind:rankMode
  bind:selectedDay
  {year}
  {data}
  {settings}
  {scopedData}
  {rankItems}
  {reserve}
  {trendRows}
  {heatCells}
  {dayEntries}
  {yearlyData}
  {allocation}
  {hero}
/>

<SettingsPanel bind:open={setOpen} {settings} onUpdateSetting={updateSetting} />

<div class:show={flashVisible} class="flash">{flashText}</div>

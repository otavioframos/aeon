<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '../app.css';
  import AnalyticsPanel from '$lib/components/AnalyticsPanel.svelte';
  import DataSheet from '$lib/components/DataSheet.svelte';
  import DatePickerSheet from '$lib/components/DatePickerSheet.svelte';
  import EntryComposer from '$lib/components/EntryComposer.svelte';
  import FluxHeader from '$lib/components/FluxHeader.svelte';
  import MovementsPanel from '$lib/components/MovementsPanel.svelte';
  import MovementsPreview from '$lib/components/MovementsPreview.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import MeshBackground from '$lib/MeshBackground.svelte';
  import { catById } from '$lib/categories';
  import { DEFAULT_SETTINGS, aggregate, entriesIn, key, monthAgg, parseAmount } from '$lib/finance';
  import { listDataYears, loadData, loadSettings, normalizeBackup, saveData, saveSettings as persistSettings } from '$lib/storage';
  import { addMonthsClamped, buildTransactionEntries, datePartsFromISO, splitAmount, todayISO } from '$lib/transactions';
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
    MovementEditPayload,
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
  let purchaseDate = todayISO();
  let installmentCount = 1;
  let scope: Scope = 'month';
  let scopeMonth = new Date().getMonth();
  let rankMode: RankMode = 'cat';
  let selectedDay: number | null = null;
  let controlOpen = false;
  let sheetOpen = false;
  let dashOpen = false;
  let setOpen = false;
  let movementOpen = false;
  let editingMovement: DatedEntry | null = null;
  let datePickerOpen = false;
  let datePickerLabel = 'Data';
  let datePickerValue = todayISO();
  let commitPickedDate: ((value: string) => void) | null = null;
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
  let currentYearMovements: DatedEntry[] = [];
  let recentMovements: DatedEntry[] = [];
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
  $: currentYearMovements = sortMovements(entriesIn(data, (y) => y === year));
  $: recentMovements = currentYearMovements.slice(0, 4);
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

  function openDatePicker(label: string, value: string, onSelect: (nextValue: string) => void) {
    datePickerLabel = label;
    datePickerValue = value || todayISO();
    commitPickedDate = onSelect;
    datePickerOpen = true;
  }

  function pickDate(value: string) {
    datePickerValue = value;
    commitPickedDate?.(value);
    datePickerOpen = false;
  }

  function addEntry() {
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value === 0) {
      amountInput?.focus();
      return;
    }

    const type: EntryType = selCat === 'renda' ? 'in' : 'out';
    const generated = buildTransactionEntries({
      totalAmount: Math.abs(value),
      type,
      cat: selCat,
      desc: desc.trim(),
      purchaseDate: purchaseDate || todayISO(),
      installmentCount
    });
    commitEntries(generated);
    mesh?.triggerWave(type);

    amount = '';
    desc = '';
    selCat = '';
    installmentCount = 1;
    purchaseDate = todayISO();
    controlOpen = false;
    amountInput?.focus();
  }

  function commitEntries(generated: ReturnType<typeof buildTransactionEntries>) {
    const byYear = new Map<number, LedgerData>();
    generated.forEach((item) => {
      if (!byYear.has(item.year)) {
        byYear.set(item.year, item.year === year ? { ...data } : loadData(item.year));
      }
      const yearData = byYear.get(item.year);
      if (!yearData) return;
      yearData[item.entryKey] = [...(yearData[item.entryKey] || []), item.entry];
    });

    try {
      byYear.forEach((yearData, itemYear) => saveData(itemYear, yearData));
      if (byYear.has(year)) {
        data = byYear.get(year) || data;
      } else if (generated[0]) {
        year = generated[0].year;
        data = byYear.get(year) || loadData(year);
      }
      flash(generated.length > 1 ? `${generated.length} parcelas` : 'salvo');
    } catch {
      alert('Salvamento bloqueado aqui. Baixe o arquivo e abra no seu navegador para salvar de verdade.');
    }
  }

  function sortMovements(list: DatedEntry[]) {
    return [...list].sort((a, b) => b._m - a._m || b._d - a._d || b.id.localeCompare(a.id));
  }

  function knownYears(extraYears: number[] = []) {
    return [...new Set([year, ...listDataYears(), ...extraYears])].sort((a, b) => a - b);
  }

  function mutableYearData(targetYear: number, byYear: Map<number, LedgerData>) {
    if (!byYear.has(targetYear)) {
      byYear.set(targetYear, targetYear === year ? { ...data } : loadData(targetYear));
    }
    return byYear.get(targetYear);
  }

  function writeMutationYears(byYear: Map<number, LedgerData>) {
    try {
      byYear.forEach((yearData, itemYear) => saveData(itemYear, yearData));
      if (byYear.has(year)) data = byYear.get(year) || data;
      else if (byYear.size) data = loadData(year);
    } catch {
      alert('Salvamento bloqueado aqui. Baixe o arquivo e abra no seu navegador para salvar de verdade.');
    }
  }

  function removeMovementFromData(yearData: LedgerData, entry: DatedEntry) {
    const entryKey = key(entry._y, entry._m, entry._d);
    yearData[entryKey] = (yearData[entryKey] || []).filter((item) => item.id !== entry.id);
    if (!yearData[entryKey].length) delete yearData[entryKey];
  }

  function upsertMovementInData(yearData: LedgerData, targetYear: number, targetMonth: number, targetDay: number, entry: DatedEntry) {
    const entryKey = key(targetYear, targetMonth, targetDay);
    const { _y, _m, _d, ...cleanEntry } = entry;
    yearData[entryKey] = [...(yearData[entryKey] || []), cleanEntry];
  }

  function findInstallmentGroup(groupId: string) {
    const groupEntries: DatedEntry[] = [];
    knownYears().forEach((itemYear) => {
      const yearData = itemYear === year ? data : loadData(itemYear);
      entriesIn(yearData, (entryYear) => entryYear === itemYear).forEach((entry) => {
        if (entry.installmentGroupId === groupId) groupEntries.push(entry);
      });
    });
    return groupEntries.sort((a, b) => (a.installmentIndex || 0) - (b.installmentIndex || 0));
  }

  function entryTypeFromCategory(cat: string): EntryType {
    return cat === 'renda' ? 'in' : 'out';
  }

  function openMovementEditor(entry: DatedEntry) {
    editingMovement = entry;
    movementOpen = true;
  }

  function saveMovementEdit(entry: DatedEntry, payload: MovementEditPayload) {
    if (payload.applyGroup && entry.installmentGroupId) {
      updateMovementGroup(entry.installmentGroupId, payload);
    } else {
      updateSingleMovement(entry, payload);
    }
    editingMovement = null;
    flash('atualizado');
  }

  function updateSingleMovement(entry: DatedEntry, payload: MovementEditPayload) {
    const target = datePartsFromISO(payload.date || todayISO());
    const byYear = new Map<number, LedgerData>();
    const sourceData = mutableYearData(entry._y, byYear);
    const targetData = mutableYearData(target.year, byYear);
    if (!sourceData || !targetData) return;

    removeMovementFromData(sourceData, entry);
    upsertMovementInData(targetData, target.year, target.month, target.day, {
      ...entry,
      amount: payload.amount,
      cat: payload.cat,
      desc: payload.desc,
      type: entryTypeFromCategory(payload.cat),
      purchaseDate: payload.date,
      sourceAmount: payload.amount
    });
    writeMutationYears(byYear);
  }

  function updateMovementGroup(groupId: string, payload: MovementEditPayload) {
    const groupEntries = findInstallmentGroup(groupId);
    if (!groupEntries.length) return;

    const amounts = splitAmount(payload.amount, groupEntries.length);
    const byYear = new Map<number, LedgerData>();

    groupEntries.forEach((entry) => {
      const sourceData = mutableYearData(entry._y, byYear);
      if (sourceData) removeMovementFromData(sourceData, entry);
    });

    groupEntries.forEach((entry, index) => {
      const target = addMonthsClamped(payload.date || todayISO(), index);
      const targetData = mutableYearData(target.year, byYear);
      if (!targetData) return;
      upsertMovementInData(targetData, target.year, target.month, target.day, {
        ...entry,
        amount: amounts[index],
        cat: payload.cat,
        desc: payload.desc,
        type: entryTypeFromCategory(payload.cat),
        purchaseDate: payload.date,
        sourceAmount: payload.amount,
        installmentIndex: index + 1,
        installmentCount: groupEntries.length
      });
    });

    writeMutationYears(byYear);
  }

  function deleteMovement(entry: DatedEntry, scope: 'single' | 'group') {
    if (scope === 'group' && entry.installmentGroupId) {
      const groupEntries = findInstallmentGroup(entry.installmentGroupId);
      if (!groupEntries.length) return false;
      if (!confirm(`Tem certeza que deseja apagar todas as ${groupEntries.length} parcelas?`)) return false;
      deleteMovements(groupEntries);
      editingMovement = null;
      flash('apagado');
      return true;
    }

    if (!confirm('Tem certeza que deseja apagar este movimento?')) return false;
    deleteMovements([entry]);
    editingMovement = null;
    flash('apagado');
    return true;
  }

  function deleteSelectedMovements(entries: DatedEntry[]) {
    if (!entries.length) return false;
    if (!confirm(`Tem certeza que deseja apagar os ${entries.length} movimentos selecionados?`)) return false;
    deleteMovements(entries);
    flash('apagados');
    return true;
  }

  function deleteMovements(entries: DatedEntry[]) {
    const byYear = new Map<number, LedgerData>();
    entries.forEach((entry) => {
      const yearData = mutableYearData(entry._y, byYear);
      if (yearData) removeMovementFromData(yearData, entry);
    });
    writeMutationYears(byYear);
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
    const header = ['Data', 'Compra', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Parcela', 'Grupo'].join(sep);
    const lines = rows.map((row) => {
      const category = catById(row.entry.cat);
      const dateStr = `${String(row.d).padStart(2, '0')}/${String(row.m + 1).padStart(2, '0')}/${row.y}`;
      const purchaseDate = row.entry.purchaseDate || '';
      const tipo = row.entry.type === 'in' ? 'Entrada' : 'Saída';
      const value = `${row.entry.type === 'in' ? '' : '-'}${row.entry.amount.toFixed(2).replace('.', ',')}`;
      const installment =
        row.entry.installmentIndex && row.entry.installmentCount ? `${row.entry.installmentIndex}/${row.entry.installmentCount}` : '';
      return [dateStr, purchaseDate, tipo, category ? category.name : row.entry.cat || '', row.entry.desc || '', value, installment, row.entry.installmentGroupId || '']
        .map(esc)
        .join(sep);
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

<MeshBackground bind:this={mesh} dimmed={sheetOpen || dashOpen || setOpen || movementOpen || datePickerOpen} {settings} />

<div class:dimmed={sheetOpen || dashOpen || setOpen || movementOpen || datePickerOpen} class="app">
  <FluxHeader {currentMonth} onOpenDashboard={openDashboard} onOpenSettings={() => (setOpen = true)} />
  <EntryComposer
    bind:amount
    bind:desc
    bind:selCat
    bind:purchaseDate
    bind:installmentCount
    bind:controlOpen
    bind:amountInput
    onSubmit={addEntry}
    onOpenDatePicker={openDatePicker}
  />
  <MovementsPreview entries={recentMovements} onOpen={() => (movementOpen = true)} onEdit={openMovementEditor} />
</div>

<DataSheet bind:open={sheetOpen} onExportData={exportData} onExportCSV={exportCSV} onImportDataFile={importDataFile} onResetYear={resetYear} />

<MovementsPanel
  bind:open={movementOpen}
  bind:editingEntry={editingMovement}
  entries={currentYearMovements}
  onClose={() => {
    movementOpen = false;
    editingMovement = null;
  }}
  onSave={saveMovementEdit}
  onDelete={deleteMovement}
  onDeleteSelected={deleteSelectedMovements}
  onOpenDatePicker={openDatePicker}
/>

<DatePickerSheet bind:open={datePickerOpen} label={datePickerLabel} value={datePickerValue} onPick={pickDate} />

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

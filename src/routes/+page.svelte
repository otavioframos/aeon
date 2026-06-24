<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import '../app.css';
  import AnalyticsPanel from '$lib/components/AnalyticsPanel.svelte';
  import AppDialog from '$lib/components/AppDialog.svelte';
  import BalanceCards from '$lib/components/BalanceCards.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import DatePickerSheet from '$lib/components/DatePickerSheet.svelte';
  import EntryComposer from '$lib/components/EntryComposer.svelte';
  import FluxHeader from '$lib/components/FluxHeader.svelte';
  import MovementsPanel from '$lib/components/MovementsPanel.svelte';
  import MovementsPreview from '$lib/components/MovementsPreview.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import VelaSplash from '$lib/components/VelaSplash.svelte';
  import MeshBackground from '$lib/MeshBackground.svelte';
  import { currentMonthCash, projectionMonths, resolvedStatus } from '$lib/cashModel';
  import { catById } from '$lib/categories';
  import { transactionStatusLabel } from '$lib/copy';
  import { exportFile } from '$lib/fileExport';
  import { DEFAULT_SETTINGS, aggregate, entriesIn, key, monthAgg, parseAmount } from '$lib/finance';
  import {
    collectDataYears,
    createBackupPayload,
    listDataYears,
    loadData,
    loadSettings,
    normalizeBackup,
    replaceDataYears,
    saveData,
    saveSettings as persistSettings
  } from '$lib/storage';
  import { themeVars } from '$lib/theme';
  import { addMonthsClamped, buildTransactionEntries, datePartsFromISO, splitAmount, statusForDateParts, todayISO } from '$lib/transactions';
  import { syncVelaWidget } from '$lib/nativeWidget';
  import {
    allocationModel,
    appliedMoneyTotal,
    buildRankItems,
    dailyRoomModel,
    getDailySpendData,
    getPrevScopeData,
    getScopeData,
    heatModel,
    heroModel,
    reserveCardModel,
    reserveModel,
    todaySpendModel,
    trendModel
  } from '$lib/viewModels';
  import type {
    Aggregate,
    AllocationModel,
    BackupPayload,
    CashSnapshot,
    DailyRoomModel,
    DatedEntry,
    EntryType,
    HeatCell,
    HeroModel,
    LedgerData,
    MovementEditPayload,
    RankItem,
    RankMode,
    ReserveCardModel,
    ReserveModel,
    Scope,
    Settings,
    TodaySpendModel,
    TrendRow,
    ProjectionMonth
  } from '$lib/types';

  type MeshHandle = { triggerWave: (type: EntryType) => void };

  let appNow = new Date();
  let year = appNow.getFullYear();
  let data: LedgerData = {};
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let amount = '';
  let desc = '';
  let selCat = '';
  let purchaseDate = todayISO();
  let installmentCount = 1;
  let paceImpact: 'normal' | 'diluted' = 'normal';
  let scope: Scope = 'month';
  let scopeMonth = appNow.getMonth();
  let rankMode: RankMode = 'cat';
  let selectedDay: number | null = null;
  let controlOpen = false;
  let dashOpen = false;
  let setOpen = false;
  let movementOpen = false;
  let editingMovement: DatedEntry | null = null;
  let datePickerOpen = false;
  let datePickerLabel = 'Data';
  let datePickerValue = todayISO();
  let commitPickedDate: ((value: string) => void) | null = null;
  let dialogOpen = false;
  let dialogTitle = '';
  let dialogMessage = '';
  let dialogConfirmLabel = 'OK';
  let dialogCancelLabel = 'Cancel';
  let dialogShowCancel = false;
  let dialogDestructive = false;
  let dialogResolve: ((value: boolean) => void) | null = null;
  let flashText = 'salvo';
  let flashVisible = false;
  let flashTimer: ReturnType<typeof setTimeout>;
  let amountInput: HTMLInputElement | undefined;
  let mesh: MeshHandle;
  let nativeBackListener: { remove: () => Promise<void> } | null = null;
  let nativeStateListener: { remove: () => Promise<void> } | null = null;
  let isNativeShell = false;
  let showApkBanner = false;
  const apkHref = `${base}/vela.apk`;
  const apkBannerKey = 'vela-apk-banner-dismissed';

  let cashSnapshot: CashSnapshot = currentMonthCash(data, settings, appNow);
  let scopedData: Aggregate = aggregate([]);
  let dailySpendData: Aggregate = aggregate([]);
  let previousScopedData: Aggregate = aggregate([]);
  let rankItems: RankItem[] = [];
  let reserve: ReserveModel | null = null;
  let trendRows: TrendRow[] = [];
  let heatCells: HeatCell[] = [];
  let dayEntries: DatedEntry[] = [];
  let currentYearMovements: DatedEntry[] = [];
  let recentMovements: DatedEntry[] = [];
  let yearlyData: Aggregate = aggregate([]);
  let reserveCard: ReserveCardModel = reserveCardModel(data, year, appNow);
  let appliedMoneyContribution = 0;
  let projections: ProjectionMonth[] = [];
  let allocation: AllocationModel = allocationModel(scopedData);
  let hero: HeroModel = heroModel(dailySpendData, scope, year, scopeMonth, settings, appNow);
  let todaySpend: TodaySpendModel = todaySpendModel(data, settings, appNow);
  let dailyRoom: DailyRoomModel = dailyRoomModel(cashSnapshot, hero, todaySpend.actualLiving);

  $: cashSnapshot = currentMonthCash(data, settings, appNow);
  $: scopedData = getScopeData(data, year, scope, scopeMonth, settings, appNow);
  $: dailySpendData = getDailySpendData(data, year, scope, scopeMonth, settings, appNow);
  $: previousScopedData = getPrevScopeData(data, year, scope, scopeMonth);
  $: rankItems = buildRankItems(scopedData, previousScopedData, rankMode);
  $: reserve = reserveModel(data, year, appNow);
  $: trendRows = trendModel(data, year, scope, scopeMonth);
  $: heatCells = heatModel(data, year, scope, scopeMonth);
  $: dayEntries = selectedDay
    ? entriesIn(data, (y, m, d) => y === year && m === scopeMonth && d === selectedDay)
    : [];
  $: currentYearMovements = sortMovements(entriesIn(data, () => true));
  $: recentMovements = recentRealMovements(entriesIn(data, () => true), appNow).slice(0, 4);
  $: yearlyData = aggregate(entriesIn(data, (y) => y === year));
  $: reserveCard = reserveCardModel(data, year, appNow);
  $: appliedMoneyContribution = appliedMoneyTotal(
    entriesIn(data, (y, m) => (scope === 'year' ? y === year : y === year && m === scopeMonth)),
    appNow
  );
  $: projections = projectionMonths(data, year, settings, appNow);
  $: allocation = allocationModel(scopedData);
  $: hero = heroModel(dailySpendData, scope, year, scopeMonth, settings, appNow);
  $: todaySpend = todaySpendModel(data, settings, appNow);
  $: dailyRoom = dailyRoomModel(cashSnapshot, hero, todaySpend.actualLiving);
  $: if (browser) applyTheme(settings.accentColor);

  function refreshAppNow() {
    const previousYear = appNow.getFullYear();
    const previousMonth = appNow.getMonth();
    const nextNow = new Date();
    appNow = nextNow;

    if (scope === 'month' && year === previousYear && scopeMonth === previousMonth && nextNow.getMonth() !== previousMonth) {
      year = nextNow.getFullYear();
      scopeMonth = nextNow.getMonth();
      data = loadData(year);
    }
  }

  onMount(() => {
    refreshAppNow();
    const appNowTimer = setInterval(refreshAppNow, 60000);
    document.addEventListener('visibilitychange', refreshAppNow);
    data = loadData(year);
    settings = loadSettings();
    void initializeShell();

    return () => {
      clearInterval(appNowTimer);
      document.removeEventListener('visibilitychange', refreshAppNow);
      void nativeBackListener?.remove();
      void nativeStateListener?.remove();
    };
  });

  async function initializeShell() {
    isNativeShell = await setupNativeShell();
    if (!isNativeShell && browser && localStorage.getItem(apkBannerKey) !== '1') {
      showApkBanner = true;
    }
    syncWidget();
  }

  function dismissApkBanner() {
    showApkBanner = false;
    if (browser) localStorage.setItem(apkBannerKey, '1');
  }

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
      syncWidget();
      flash();
    } catch {
      showNotice('Storage blocked', 'Open the app in your browser or export a backup to keep this data safely.');
    }
  }

  function saveSettings() {
    try {
      persistSettings(settings);
      syncWidget();
    } catch {
      // localStorage can be unavailable in strict browser modes; the app remains usable for the session.
    }
  }

  function syncWidget() {
    syncVelaWidget(data, settings, appNow);
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

  function askDialog(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    destructive?: boolean;
  }) {
    dialogTitle = options.title;
    dialogMessage = options.message;
    dialogConfirmLabel = options.confirmLabel || 'OK';
    dialogCancelLabel = options.cancelLabel || 'Cancel';
    dialogShowCancel = Boolean(options.showCancel);
    dialogDestructive = Boolean(options.destructive);
    dialogOpen = true;
    return new Promise<boolean>((resolve) => {
      dialogResolve = resolve;
    });
  }

  function resolveDialog(value: boolean) {
    dialogOpen = false;
    dialogResolve?.(value);
    dialogResolve = null;
  }

  function showNotice(title: string, message: string) {
    void askDialog({ title, message, confirmLabel: 'OK' });
  }

  async function setupNativeShell() {
    try {
      const [{ Capacitor }, { App }, { StatusBar, Style }] = await Promise.all([
        import('@capacitor/core'),
        import('@capacitor/app'),
        import('@capacitor/status-bar')
      ]);

      if (!Capacitor.isNativePlatform()) return false;

      document.documentElement.classList.add('native-shell');
      document.body.classList.add('native-shell');

      await Promise.allSettled([
        StatusBar.setStyle({ style: Style.Dark }),
        StatusBar.setBackgroundColor({ color: '#00000000' }),
        StatusBar.setOverlaysWebView({ overlay: true }),
        StatusBar.show()
      ]);

      nativeStateListener = await App.addListener('appStateChange', refreshAppNow);

      nativeBackListener = await App.addListener('backButton', () => {
        if (dialogOpen) {
          resolveDialog(false);
          return;
        }
        if (datePickerOpen) {
          datePickerOpen = false;
          return;
        }
        if (setOpen) {
          setOpen = false;
          return;
        }
        if (movementOpen) {
          movementOpen = false;
          editingMovement = null;
          return;
        }
        if (controlOpen) {
          controlOpen = false;
          return;
        }
        if (dashOpen) {
          dashOpen = false;
          return;
        }

        void App.minimizeApp();
      });
      return true;
    } catch {
      // Native plugins are unavailable in the browser build.
      return false;
    }
  }

  function addEntry() {
    const value = parseAmount(amount);
    if (Number.isNaN(value) || value === 0) {
      amountInput?.focus();
      return;
    }

    const type: EntryType = selCat === 'renda' ? 'in' : 'out';
    const categoryId = selCat || (type === 'in' ? 'renda' : 'outros');
    const generated = buildTransactionEntries({
      totalAmount: Math.abs(value),
      type,
      cat: categoryId,
      desc: desc.trim(),
      purchaseDate: purchaseDate || todayISO(),
      installmentCount,
      paceImpact
    });
    commitEntries(generated);
    mesh?.triggerWave(type);

    amount = '';
    desc = '';
    selCat = '';
    installmentCount = 1;
    paceImpact = 'normal';
    purchaseDate = todayISO();
    controlOpen = false;
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
      syncWidget();
      flash(generated.length > 1 ? `${generated.length} parcelas` : 'salvo');
    } catch {
      showNotice('Storage blocked', 'Open the app in your browser or export a backup to keep this data safely.');
    }
  }

  function sortMovements(list: DatedEntry[]) {
    return [...list].sort((a, b) => b._y - a._y || b._m - a._m || b._d - a._d || b.id.localeCompare(a.id));
  }

  function recentRealMovements(list: DatedEntry[], now: Date) {
    return sortMovements(
      list.filter((entry) => {
        if (resolvedStatus(entry, now) !== 'realized') return false;
        if (entry.installmentIndex && entry.installmentIndex > 1) return false;
        return true;
      })
    );
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
      syncWidget();
    } catch {
      showNotice('Storage blocked', 'Open the app in your browser or export a backup to keep this data safely.');
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
      status: statusForDateParts(target.year, target.month, target.day),
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
        status: statusForDateParts(target.year, target.month, target.day),
        purchaseDate: payload.date,
        sourceAmount: payload.amount,
        installmentIndex: index + 1,
        installmentCount: groupEntries.length
      });
    });

    writeMutationYears(byYear);
  }

  async function deleteMovement(entry: DatedEntry, scope: 'single' | 'group') {
    if (scope === 'group' && entry.installmentGroupId) {
      const groupEntries = findInstallmentGroup(entry.installmentGroupId);
      if (!groupEntries.length) return false;
      const confirmed = await askDialog({
        title: 'Delete installments?',
        message: `Are you sure you want to delete all ${groupEntries.length} installments?`,
        confirmLabel: 'Delete',
        showCancel: true,
        destructive: true
      });
      if (!confirmed) return false;
      deleteMovements(groupEntries);
      editingMovement = null;
      flash('apagado');
      return true;
    }

    const confirmed = await askDialog({
      title: 'Delete movement?',
      message: 'Are you sure you want to delete this movement?',
      confirmLabel: 'Delete',
      showCancel: true,
      destructive: true
    });
    if (!confirmed) return false;
    deleteMovements([entry]);
    editingMovement = null;
    flash('apagado');
    return true;
  }

  async function deleteSelectedMovements(entries: DatedEntry[]) {
    if (!entries.length) return false;
    const confirmed = await askDialog({
      title: 'Delete selected?',
      message: `Are you sure you want to delete all ${entries.length} selected movements?`,
      confirmLabel: 'Delete',
      showCancel: true,
      destructive: true
    });
    if (!confirmed) return false;
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

  function updateSetting(keyName: keyof Settings, value: Settings[keyof Settings]) {
    settings =
      keyName === 'currentBalance'
        ? ({ ...settings, currentBalance: Number(value) || 0, balanceAnchorAt: new Date().toISOString() } as Settings)
        : ({ ...settings, [keyName]: value } as Settings);
    saveSettings();
  }

  function registerPayday() {
    const today = todayISO();
    const cycleStartOverrides = Array.from(new Set([...(settings.cycleStartOverrides || []), today])).sort();
    settings = { ...settings, cycleStartOverrides };
    saveSettings();
    flash('payday registered');
  }

  function applyTheme(accentColor: string) {
    Object.entries(themeVars(accentColor)).forEach(([keyName, value]) => {
      document.documentElement.style.setProperty(keyName, value);
    });
  }

  function openDashboard() {
    scope = 'month';
    scopeMonth = new Date().getMonth();
    selectedDay = null;
    dashOpen = true;
  }

  async function exportData() {
    const payload = createBackupPayload(year, data, settings);
    await downloadFile(`fluxo_backup_${year}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  async function exportCSV() {
    const rows: { y: number; m: number; d: number; entry: DatedEntry }[] = [];
    Object.entries(collectDataYears(year, data)).forEach(([rawYear, yearData]) => {
      const itemYear = Number(rawYear);
      entriesIn(yearData, (entryYear) => entryYear === itemYear).forEach((entry) => rows.push({ y: entry._y, m: entry._m, d: entry._d, entry }));
    });
    rows.sort((a, b) => a.y - b.y || a.m - b.m || a.d - b.d);
    const esc = (value: unknown) => {
      const text = String(value ?? '');
      return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const sep = ';';
    const header = ['Data', 'Compra', 'Status', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Parcela', 'Grupo'].join(sep);
    const lines = rows.map((row) => {
      const category = catById(row.entry.cat);
      const dateStr = `${String(row.d).padStart(2, '0')}/${String(row.m + 1).padStart(2, '0')}/${row.y}`;
      const purchaseDate = row.entry.purchaseDate || '';
      const status = transactionStatusLabel(resolvedStatus(row.entry, appNow));
      const tipo = row.entry.type === 'in' ? 'Entrada' : 'Saída';
      const value = `${row.entry.type === 'in' ? '' : '-'}${row.entry.amount.toFixed(2).replace('.', ',')}`;
      const installment =
        row.entry.installmentIndex && row.entry.installmentCount ? `${row.entry.installmentIndex}/${row.entry.installmentCount}` : '';
      return [dateStr, purchaseDate, status, tipo, category ? category.name : row.entry.cat || '', row.entry.desc || '', value, installment, row.entry.installmentGroupId || '']
        .map(esc)
        .join(sep);
    });
    await downloadFile(`fluxo_${year}.csv`, `\uFEFF${[header].concat(lines).join('\r\n')}`, 'text/csv;charset=utf-8');
  }

  async function downloadFile(filename: string, contents: string, type: string) {
    try {
      await exportFile(filename, contents, type);
      flash('export ready');
    } catch {
      showNotice('Export failed', 'Vela could not create the file. Try again or export from the web version.');
    }
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
          showNotice('Invalid file', 'This backup file does not contain Vela ledger data.');
          return;
        }
        askDialog({
          title: 'Import backup?',
          message: `Import backup${payload.year ? ` from ${payload.year}` : ''}? This replaces the current data.`,
          confirmLabel: 'Import',
          showCancel: true
        }).then((confirmed) => {
          if (!confirmed) return;
          if (payload.year) year = payload.year;
          replaceDataYears(payload.years);
          data = payload.year ? payload.years[String(payload.year)] || {} : payload.data;
          if (payload.settings) settings = { ...settings, ...payload.settings };
          saveSettings();
          syncWidget();
          flash('importado');
        });
      } catch {
        showNotice('Could not read file', 'Check if the file is a valid Vela backup and try again.');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function resetYear() {
    const confirmed = await askDialog({
      title: `Reset ${year}?`,
      message: 'Delete all entries for this year? Export a backup first if you need one.',
      confirmLabel: 'Reset',
      showCancel: true,
      destructive: true
    });
    if (confirmed) {
      data = {};
      save();
    }
  }
</script>

<svelte:head>
  <title>Vela</title>
</svelte:head>

<VelaSplash />
<MeshBackground bind:this={mesh} dimmed={dashOpen || setOpen || movementOpen || datePickerOpen} {settings} />

<div class:dimmed={dashOpen || setOpen || movementOpen || datePickerOpen} class="app flux-shell">
  <FluxHeader cash={cashSnapshot} />
  {#if showApkBanner}
    <section class="apk-banner" aria-label="Download Vela APK">
      <div>
        <strong>Install Vela APK</strong>
        <span>Smoother phone experience and homescreen widget.</span>
      </div>
      <a href={apkHref} download="vela.apk">Download</a>
      <button type="button" aria-label="Dismiss APK banner" on:click={dismissApkBanner}>
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </section>
  {/if}
  <EntryComposer
    bind:amount
    bind:desc
    bind:selCat
    bind:purchaseDate
    bind:installmentCount
    bind:paceImpact
    bind:controlOpen
    bind:amountInput
    onSubmit={addEntry}
    onOpenDatePicker={openDatePicker}
  />
  <BalanceCards
    {dailyRoom}
    {todaySpend}
    reserveBalance={reserveCard.balance}
    reserveSeries={reserveCard.series}
    reserveTarget={reserveCard.target}
    reserveRunway={reserveCard.runway}
  />
  <MovementsPreview entries={recentMovements} {settings} now={appNow} onOpen={() => (movementOpen = true)} onEdit={openMovementEditor} />
  <BottomNav active="flux" onOpenAeon={openDashboard} onOpenFlux={() => (dashOpen = false)} onOpenSettings={() => (setOpen = true)} />
</div>

<MovementsPanel
  bind:open={movementOpen}
  bind:editingEntry={editingMovement}
  entries={currentYearMovements}
  {settings}
  now={appNow}
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
  bind:selectedDay
  {year}
  {data}
  {settings}
  {scopedData}
  {rankItems}
  {reserve}
  {trendRows}
  {heatCells}
  {hero}
  portfolioContribution={appliedMoneyContribution}
  {projections}
  onOpenSettings={() => (setOpen = true)}
  onOpenFlux={() => (dashOpen = false)}
/>

<SettingsPanel
  bind:open={setOpen}
  {settings}
  onUpdateSetting={updateSetting}
  onExportData={exportData}
  onExportCSV={exportCSV}
  onImportDataFile={importDataFile}
  onResetYear={resetYear}
  onRegisterPayday={registerPayday}
  {apkHref}
  showApkDownload={!isNativeShell}
/>

<AppDialog
  bind:open={dialogOpen}
  title={dialogTitle}
  message={dialogMessage}
  confirmLabel={dialogConfirmLabel}
  cancelLabel={dialogCancelLabel}
  showCancel={dialogShowCancel}
  destructive={dialogDestructive}
  onConfirm={() => resolveDialog(true)}
  onCancel={() => resolveDialog(false)}
/>

<div class:show={flashVisible} class="flash">{flashText}</div>

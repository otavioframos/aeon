<script lang="ts">
  import { CATS, catById } from '$lib/categories';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import { fmtNum, MONTHS_FULL, parseAmount } from '$lib/finance';
  import { dateLabel } from '$lib/transactions';
  import type { DatedEntry, MovementEditPayload } from '$lib/types';

  export let open = false;
  export let entries: DatedEntry[] = [];
  export let editingEntry: DatedEntry | null = null;
  export let onClose: () => void;
  export let onSave: (entry: DatedEntry, payload: MovementEditPayload) => void;
  export let onDelete: (entry: DatedEntry, scope: 'single' | 'group') => boolean | Promise<boolean>;
  export let onDeleteSelected: (entries: DatedEntry[]) => boolean | Promise<boolean>;
  export let onOpenDatePicker: (label: string, value: string, onSelect: (nextValue: string) => void) => void;

  let selectedKeys: string[] = [];
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;
  let editAmount = '';
  let editDesc = '';
  let editCat = '';
  let editDate = '';
  let editApplyGroup = false;

  $: if (editingEntry) {
    editAmount = editingEntry.sourceAmount && editingEntry.installmentGroupId ? fmtNum(editingEntry.sourceAmount) : fmtNum(editingEntry.amount);
    editDesc = editingEntry.desc;
    editCat = editingEntry.cat;
    editDate = `${editingEntry._y}-${String(editingEntry._m + 1).padStart(2, '0')}-${String(editingEntry._d).padStart(2, '0')}`;
    editApplyGroup = Boolean(editingEntry.installmentGroupId);
  }

  $: selectedEntries = entries.filter((entry) => selectedKeys.includes(movementKey(entry)));

  function movementKey(entry: DatedEntry) {
    return `${entry._y}-${entry._m}-${entry._d}:${entry.id}`;
  }

  function titleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    return entry.desc || category?.name || (entry.type === 'in' ? 'Entrada' : 'Saída');
  }

  function subtitleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    const installment =
      entry.installmentIndex && entry.installmentCount ? ` · parcela ${entry.installmentIndex}/${entry.installmentCount}` : '';
    return `${category?.name || 'Other'} · ${entry._d} ${MONTHS_FULL[entry._m].slice(0, 3).toLowerCase()}${installment}`;
  }

  function headingFor(entry: DatedEntry) {
    const now = new Date();
    return entry._m === now.getMonth() && entry._y === now.getFullYear() ? 'This Month' : MONTHS_FULL[entry._m];
  }

  function toggleSelection(entry: DatedEntry) {
    const key = movementKey(entry);
    selectedKeys = selectedKeys.includes(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key];
  }

  function startPress(entry: DatedEntry) {
    longPressed = false;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      longPressed = true;
      toggleSelection(entry);
    }, 450);
  }

  function endPress() {
    clearTimeout(pressTimer);
  }

  function rowClick(entry: DatedEntry) {
    if (longPressed) {
      longPressed = false;
      return;
    }
    if (selectedKeys.length) {
      toggleSelection(entry);
      return;
    }
    editingEntry = entry;
  }

  function closePanel() {
    selectedKeys = [];
    editingEntry = null;
    onClose();
  }

  function saveEdit() {
    if (!editingEntry) return;
    const amount = parseAmount(editAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    onSave(editingEntry, {
      amount: Math.abs(amount),
      cat: editCat,
      desc: editDesc.trim(),
      date: editDate,
      applyGroup: editApplyGroup && Boolean(editingEntry.installmentGroupId)
    });
    editingEntry = null;
  }

  async function deleteEdit() {
    if (!editingEntry) return;
    if (await onDelete(editingEntry, editApplyGroup && editingEntry.installmentGroupId ? 'group' : 'single')) {
      editingEntry = null;
    }
  }

  async function deleteSelected() {
    if (await onDeleteSelected(selectedEntries)) {
      selectedKeys = [];
    }
  }
</script>

<button class:open={open} class="ov-backdrop" aria-hidden={!open} aria-label="Fechar painel de movimentos" tabindex={open ? 0 : -1} on:click={closePanel}></button>
<section class:open={open} class="panel movements-panel" aria-hidden={!open} inert={!open}>
  <div class="panel-inner">
    {#if editingEntry}
      <div class="panel-top">
        <div class="panel-title">Edit <span class="yr">movement</span></div>
        <button class="icon-btn small-icon" aria-label="Close edit" on:click={() => (editingEntry = null)}>
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div class="panel-scroll">
        <div class="movement-edit-card">
          <label>
            <span>Amount</span>
            <input bind:value={editAmount} inputmode="decimal" />
          </label>
          <label>
            <span>Description</span>
            <input bind:value={editDesc} />
          </label>
          <div class="movement-field">
            <span>Category</span>
            <div class="edit-category-grid" role="listbox" aria-label="Movement category">
              {#each CATS as category}
                <button class:selected={editCat === category.id} type="button" role="option" aria-selected={editCat === category.id} on:click={() => (editCat = category.id)}>
                  <svg viewBox="0 0 24 24">{@html category.icon}</svg>
                  <span>{category.name}</span>
                </button>
              {/each}
            </div>
          </div>
          <div class="movement-field">
            <span>Date</span>
            <DatePicker bind:value={editDate} label="Date" onOpen={onOpenDatePicker} />
          </div>
          {#if editingEntry.installmentGroupId}
            <label class="movement-check">
              <input bind:checked={editApplyGroup} type="checkbox" />
              <span>Apply to all {editingEntry.installmentCount} installments</span>
            </label>
            <div class="ms">Original purchase: {dateLabel(editingEntry.purchaseDate || editDate)}</div>
          {/if}
        </div>
        <div class="movement-actions">
          <button class="movement-save" type="button" on:click={saveEdit}>Save</button>
          <button class="movement-delete" type="button" on:click={deleteEdit}>Delete</button>
        </div>
      </div>
    {:else}
      <div class="panel-top">
        <div class="panel-title">
          {selectedKeys.length ? `${selectedKeys.length} selected` : 'Movements'}
        </div>
        <button class="icon-btn small-icon" aria-label="Close movement list" on:click={closePanel}>
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      {#if selectedKeys.length}
        <div class="movement-select-bar">
          <button type="button" on:click={() => (selectedKeys = [])}>Cancelar</button>
          <button class="danger-text" type="button" on:click={deleteSelected}>Delete</button>
        </div>
      {/if}
      <div class="panel-scroll">
        {#if entries.length}
          <div class="movement-full-list">
            {#each entries as entry, index}
              {#if index === 0 || entry._m !== entries[index - 1]._m}
                <div class="movement-month">{headingFor(entry)}</div>
              {/if}
              {@const category = catById(entry.cat)}
              {@const selected = selectedKeys.includes(movementKey(entry))}
              <button
                class:selected
                class="movement-full-row"
                type="button"
                on:click={() => rowClick(entry)}
                on:pointerdown={() => startPress(entry)}
                on:pointerup={endPress}
                on:pointerleave={endPress}
              >
                <span class="movement-icon">
                  {#if selected}
                    <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                  {:else if category}
                    <svg viewBox="0 0 24 24">{@html category.icon}</svg>
                  {/if}
                </span>
                <span class="movement-main">
                  <span class="movement-title">{titleFor(entry)}</span>
                  <span class="movement-sub">{subtitleFor(entry)}</span>
                </span>
                <span class:pos={entry.type === 'in'} class:neg={entry.type === 'out'} class="movement-amount">
                  {entry.type === 'in' ? '+' : '−'}R$ {fmtNum(entry.amount)}
                </span>
              </button>
            {/each}
          </div>
        {:else}
          <div class="empty">No movements yet.</div>
        {/if}
      </div>
    {/if}
  </div>
</section>

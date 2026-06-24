<script lang="ts">
  import { CATS, catById } from '$lib/categories';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import { fmtNum, parseAmount } from '$lib/finance';
  import { addMonthsClamped, splitAmount, todayISO } from '$lib/transactions';
  import type { PaceImpact } from '$lib/types';

  export let amount = '';
  export let desc = '';
  export let selCat = '';
  export let purchaseDate = '';
  export let installmentCount = 1;
  export let paceImpact: PaceImpact = 'normal';
  export let controlOpen = false;
  export let amountInput: HTMLInputElement | undefined = undefined;
  export let onSubmit: () => void;
  export let onOpenDatePicker: (label: string, value: string, onSelect: (nextValue: string) => void) => void;

  const installmentOptions = [1, 2, 3, 6, 12];
  let customInstallmentsOpen = false;
  let customInstallmentValue = '10';
  let paceOptionsOpen = false;

  $: selectedCategory = catById(selCat);
  $: controlLabel = selectedCategory?.name || 'Categories & Description';
  $: isIncome = selCat === 'renda';
  $: isSaving = selCat === 'invest' || selCat === 'reserva';
  $: canDilute = !isIncome && !isSaving && installmentCount === 1;
  $: if (!canDilute && paceImpact !== 'normal') paceImpact = 'normal';
  $: if (!canDilute && paceOptionsOpen) paceOptionsOpen = false;
  $: parsedAmount = parseAmount(amount);
  $: hasAmount = !Number.isNaN(parsedAmount) && parsedAmount !== 0;
  $: installmentAmount =
    !hasAmount || installmentCount <= 1 ? 0 : splitAmount(Math.abs(parsedAmount), installmentCount)[0];
  $: safePurchaseDate = purchaseDate || todayISO();
  $: installmentEnd = addMonthsClamped(safePurchaseDate, Math.max(0, installmentCount - 1));
  $: installmentRange = `${monthShort(safePurchaseDate)} → ${monthShort(`${installmentEnd.year}-${String(installmentEnd.month + 1).padStart(2, '0')}-${String(installmentEnd.day).padStart(2, '0')}`)}`;
  $: submitLabel = isIncome
    ? 'Launch Income'
    : installmentCount > 1
      ? `Launch ${installmentCount} installments`
      : isSaving
        ? 'Save Money'
        : 'Launch Expense';
  $: entryValueSize = amountFontSize(amount);

  function monthShort(value: string) {
    const date = new Date(`${value}T12:00:00`);
    return date.toLocaleString('en-US', { month: 'short' });
  }

  function toggleCategory(categoryId: string) {
    selCat = selCat === categoryId ? '' : categoryId;
  }

  function amountFontSize(value: string) {
    const chars = String(value || '0').replace(/\s/g, '').length;
    if (chars <= 5) return '48px';
    if (chars <= 7) return '42px';
    if (chars <= 9) return '36px';
    return '30px';
  }

  function openCustomInstallments() {
    customInstallmentValue = String(installmentCount > 12 ? installmentCount : 10);
    customInstallmentsOpen = true;
  }

  function saveCustomInstallments() {
    const next = Math.max(1, Math.min(120, Math.floor(Number(customInstallmentValue) || 1)));
    installmentCount = next;
    customInstallmentValue = String(next);
    customInstallmentsOpen = false;
  }
</script>

<section class="entry-shell" aria-label="New entry">
  <div class="entry-card">
    <div class="entry-label">New entry</div>
    <div class="entry-amount" style:--entry-value-size={entryValueSize}>
      <span class="entry-currency">R$</span>
      <input
        bind:this={amountInput}
        bind:value={amount}
        id="bigInput"
        type="text"
        inputmode="decimal"
        placeholder="0"
        autocomplete="off"
        size="1"
        aria-label="Entry amount"
        on:keydown={(event) => event.key === 'Enter' && onSubmit()}
      />
    </div>
    <button class="entry-control" type="button" aria-expanded={controlOpen} on:click={() => (controlOpen = true)}>
      <span>{controlLabel}</span>
      <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
    </button>
    <button class="entry-submit" type="button" on:click={onSubmit}>
      <span>{submitLabel}</span>
      <svg viewBox="0 0 24 24"><path d="M7 7h10v10" /><path d="M7 17L17 7" /></svg>
    </button>
  </div>
</section>

<button class:open={controlOpen} class="composer-backdrop" aria-hidden={!controlOpen} aria-label="Close category composer" tabindex={controlOpen ? 0 : -1} on:click={() => (controlOpen = false)}></button>
<section class:open={controlOpen} class="composer-modal" aria-hidden={!controlOpen} inert={!controlOpen} aria-label="Categories and description">
  <div class="composer-modal-inner">
    <div class="entry-label">New entry</div>

    <div class="composer-amount-block">
      <div class="entry-amount modal-amount" style:--entry-value-size={entryValueSize}>
        <span class="entry-currency">R$</span>
        <input
          bind:value={amount}
          type="text"
          inputmode="decimal"
          placeholder="0"
          autocomplete="off"
          size="1"
          aria-label="Entry amount"
          on:keydown={(event) => event.key === 'Enter' && onSubmit()}
        />
      </div>
      {#if installmentCount > 1 && installmentAmount}
        <div class="entry-installment-summary">
          <span>{installmentCount}x of R$ {fmtNum(installmentAmount)}</span>
          <span>{installmentRange}</span>
        </div>
      {/if}
    </div>

    <div class="composer-fields">
      <div class="entry-control modal-control">
        <span>Categories & Description</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
      </div>
      <div class="entry-line"></div>

      <div class="category-grid" role="listbox" aria-label="Categories">
        {#each CATS as category}
          <button class:selected={selCat === category.id} class="category-tile" type="button" role="option" aria-selected={selCat === category.id} on:click={() => toggleCategory(category.id)}>
            <svg viewBox="0 0 24 24">{@html category.icon}</svg>
            <span>{category.name}</span>
          </button>
        {/each}
      </div>

      <input class="description-field" bind:value={desc} type="text" placeholder="Description" aria-label="Description" />

      <div class="entry-line"></div>

      <section class="installment-block" aria-label="Installments">
        <h2>Installments</h2>
        <div class="installment-row" role="group" aria-label="Installment count">
          {#each installmentOptions as option}
            <button class:active={installmentCount === option} type="button" on:click={() => (installmentCount = option)}>
              {option}
            </button>
          {/each}
          <button class:active={!installmentOptions.includes(installmentCount)} type="button" aria-label="Custom installment count" on:click={openCustomInstallments}>
            {installmentOptions.includes(installmentCount) ? '…' : installmentCount}
          </button>
        </div>
      </section>

      {#if canDilute}
        <section class:open={paceOptionsOpen} class="pace-impact-block" aria-label="Pace impact">
          <button class="pace-impact-trigger" type="button" aria-expanded={paceOptionsOpen} on:click={() => (paceOptionsOpen = !paceOptionsOpen)}>
            <span>Pace impact</span>
            <strong>{paceImpact === 'diluted' ? 'Diluted' : 'Normal'}</strong>
          </button>
          {#if paceOptionsOpen}
            <div class="pace-impact-options" role="group" aria-label="Pace impact mode">
              <button class:active={paceImpact === 'normal'} type="button" on:click={() => (paceImpact = 'normal')}>
                Normal
              </button>
              <button class:active={paceImpact === 'diluted'} type="button" on:click={() => (paceImpact = 'diluted')}>
                Diluted
              </button>
            </div>
          {/if}
        </section>
      {/if}
    </div>

    <div class="composer-actions">
      <DatePicker bind:value={purchaseDate} label="Purchase Date" onOpen={onOpenDatePicker} />
      <button class="entry-submit" type="button" on:click={onSubmit}>
        <span>{submitLabel}</span>
        <svg viewBox="0 0 24 24"><path d="M7 7h10v10" /><path d="M7 17L17 7" /></svg>
      </button>
    </div>
  </div>
</section>

<button class:open={customInstallmentsOpen} class="mini-dialog-backdrop" aria-hidden={!customInstallmentsOpen} aria-label="Close custom installments" tabindex={customInstallmentsOpen ? 0 : -1} on:click={() => (customInstallmentsOpen = false)}></button>
<div class:open={customInstallmentsOpen} class="mini-input-dialog" aria-hidden={!customInstallmentsOpen} inert={!customInstallmentsOpen} role="dialog" aria-modal="true" aria-label="Custom installments">
  <h2>Installments</h2>
  <p>Choose how many monthly launches Vela should create.</p>
  <input bind:value={customInstallmentValue} type="number" min="1" max="120" inputmode="numeric" aria-label="Installment count" on:keydown={(event) => event.key === 'Enter' && saveCustomInstallments()} />
  <div class="mini-dialog-actions">
    <button type="button" on:click={() => (customInstallmentsOpen = false)}>Cancel</button>
    <button class="primary" type="button" on:click={saveCustomInstallments}>Apply</button>
  </div>
</div>

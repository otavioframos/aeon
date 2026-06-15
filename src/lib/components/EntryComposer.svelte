<script lang="ts">
  import { CATS, catById } from '$lib/categories';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import { fmtNum, parseAmount } from '$lib/finance';
  import { splitAmount } from '$lib/transactions';

  export let amount = '';
  export let desc = '';
  export let selCat = '';
  export let purchaseDate = '';
  export let installmentCount = 1;
  export let controlOpen = false;
  export let amountInput: HTMLInputElement | undefined = undefined;
  export let onSubmit: () => void;

  const installmentOptions = [1, 2, 3, 6, 12];

  $: selectedCategory = catById(selCat);
  $: controlLabel = selectedCategory?.name || 'Categoria e descrição';
  $: isIncome = selCat === 'renda';
  $: isContribution = !isIncome && selectedCategory?.group === 'Investimentos';
  $: parsedAmount = parseAmount(amount);
  $: installmentAmount =
    Number.isNaN(parsedAmount) || installmentCount <= 1 ? 0 : splitAmount(Math.abs(parsedAmount), installmentCount)[0];
  $: submitLabel = isIncome
    ? 'Lançar renda'
    : installmentCount > 1
      ? `Lançar ${installmentCount} parcelas`
      : isContribution
        ? 'Lançar contribuição'
        : 'Lançar despesa';
</script>

<div class="center">
  <div class="card">
    <div class="clab">Novo lançamento</div>
    <div class="amount-wrap">
      <span class="cur">R$</span>
      <input bind:this={amountInput} bind:value={amount} id="bigInput" type="text" inputmode="decimal" placeholder="0" autocomplete="off" size="1" on:keydown={(event) => event.key === 'Enter' && onSubmit()} />
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

          <div class="composer-row">
            <div class="composer-title">Parcelas</div>
            <div class="installment-options" role="group" aria-label="Parcelas">
              {#each installmentOptions as option}
                <button class:active={installmentCount === option} type="button" on:click={() => (installmentCount = option)}>
                  {option}
                </button>
              {/each}
            </div>
          </div>

          <DatePicker bind:value={purchaseDate} label="Compra" />

          {#if installmentCount > 1 && installmentAmount}
            <div class="installment-note">{installmentCount}x de R$ {fmtNum(installmentAmount)}</div>
          {/if}
        </div>
      </div>
    </div>

    <button class="submit" on:click={onSubmit}>
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
      <span>{submitLabel}</span>
    </button>
  </div>
</div>

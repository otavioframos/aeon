<script lang="ts">
  import { CATS, catById } from '$lib/categories';

  export let amount = '';
  export let desc = '';
  export let selCat = '';
  export let controlOpen = false;
  export let amountInput: HTMLInputElement | undefined = undefined;
  export let onSubmit: () => void;

  $: selectedCategory = catById(selCat);
  $: controlLabel = selectedCategory?.name || 'Categoria e descrição';
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
        </div>
      </div>
    </div>

    <button class="submit" on:click={onSubmit}>
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
      <span>Lançar</span>
    </button>
  </div>
</div>

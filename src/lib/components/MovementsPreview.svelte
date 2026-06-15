<script lang="ts">
  import { catById } from '$lib/categories';
  import { fmtNum, MONTHS_FULL } from '$lib/finance';
  import type { DatedEntry } from '$lib/types';

  export let entries: DatedEntry[] = [];
  export let onOpen: () => void;
  export let onEdit: (entry: DatedEntry) => void;

  function titleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    return entry.desc || category?.name || (entry.type === 'in' ? 'Entrada' : 'Saída');
  }

  function subtitleFor(entry: DatedEntry) {
    const category = catById(entry.cat);
    const installment =
      entry.installmentIndex && entry.installmentCount ? ` · ${entry.installmentIndex}/${entry.installmentCount}` : '';
    return `${category?.name || 'Outros'} · ${entry._d} ${MONTHS_FULL[entry._m].slice(0, 3).toLowerCase()}${installment}`;
  }
</script>

<section class="movements-preview">
  <button class="movements-head" type="button" on:click={onOpen}>
    <span>Movimentos</span>
    <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </button>

  {#if entries.length}
    <div class="movement-mini-list">
      {#each entries as entry}
        {@const category = catById(entry.cat)}
        <button class="movement-mini-row" type="button" on:click={() => onEdit(entry)}>
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
        </button>
      {/each}
    </div>
  {:else}
    <button class="movement-empty" type="button" on:click={onOpen}>Nenhum movimento ainda</button>
  {/if}
</section>

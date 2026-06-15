<script lang="ts">
  import { DOW, MONTHS_FULL, daysInMonth } from '$lib/finance';
  import { dateLabel, datePartsFromISO, todayISO } from '$lib/transactions';

  export let value = '';
  export let label = 'Data';

  let open = false;
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  $: selected = datePartsFromISO(value || todayISO());
  $: displayLabel = dateLabel(value || todayISO());
  $: firstDow = new Date(viewYear, viewMonth, 1).getDay();
  $: days = Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, index) => index + 1);

  function openPicker() {
    const parts = datePartsFromISO(value || todayISO());
    viewYear = parts.year;
    viewMonth = parts.month;
    open = true;
  }

  function setMonth(offset: number) {
    const target = new Date(viewYear, viewMonth + offset, 1);
    viewYear = target.getFullYear();
    viewMonth = target.getMonth();
  }

  function pickDay(day: number) {
    value = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    open = false;
  }

  function pickToday() {
    value = todayISO();
    open = false;
  }
</script>

<button class="date-field" type="button" on:click={openPicker}>
  <span>{label}: {displayLabel}</span>
  <svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18" /><path d="M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>
</button>

<button class:open class="date-picker-backdrop" aria-hidden={!open} aria-label="Fechar calendário" tabindex={open ? 0 : -1} type="button" on:click={() => (open = false)}></button>
<section class:open class="date-picker-sheet" aria-hidden={!open} inert={!open}>
  <div class="date-picker-top">
    <div>
      <div class="date-picker-kicker">{label}</div>
      <div class="date-picker-title">{MONTHS_FULL[viewMonth]} {viewYear}</div>
    </div>
    <button class="icon-btn small-icon" aria-label="Fechar calendário" type="button" on:click={() => (open = false)}>
      <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
    </button>
  </div>

  <div class="date-picker-nav">
    <button aria-label="Mês anterior" type="button" on:click={() => setMonth(-1)}>
      <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
    </button>
    <button class="date-today" type="button" on:click={pickToday}>Hoje</button>
    <button aria-label="Próximo mês" type="button" on:click={() => setMonth(1)}>
      <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
    </button>
  </div>

  <div class="date-weekdays">
    {#each DOW as day}
      <span>{day}</span>
    {/each}
  </div>

  <div class="date-grid">
    {#each Array(firstDow) as _}
      <span class="date-blank"></span>
    {/each}
    {#each days as day}
      <button
        class:selected={selected.year === viewYear && selected.month === viewMonth && selected.day === day}
        type="button"
        on:click={() => pickDay(day)}
      >
        {day}
      </button>
    {/each}
  </div>
</section>

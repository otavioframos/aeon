<script lang="ts">
  import { dateLabel, todayISO } from '$lib/transactions';

  export let value = '';
  export let label = 'Data';
  export let onOpen: (label: string, value: string, onSelect: (nextValue: string) => void) => void;

  $: displayLabel = dateLabel(value || todayISO());

  function openPicker() {
    onOpen(label, value || todayISO(), (nextValue) => {
      value = nextValue;
    });
  }
</script>

<button class="date-field" type="button" on:click={openPicker}>
  <span>{label}: {displayLabel}</span>
  <svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18" /><path d="M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>
</button>

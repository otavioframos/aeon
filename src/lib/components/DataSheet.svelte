<script lang="ts">
  export let open = false;
  export let onExportData: () => void;
  export let onExportCSV: () => void;
  export let onImportDataFile: (event: Event) => void;
  export let onResetYear: () => void;

  let fileInput: HTMLInputElement | undefined;
</script>

<button class="fab" aria-label="Mais" on:click={() => (open = !open)}>
  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
</button>
<button class:open={open} class="sheet-backdrop" aria-label="Fechar dados" on:click={() => (open = false)}></button>
<div class:open={open} class="sheet">
  <div class="grab"></div>
  <h3>Dados</h3>
  <button class="sheet-row" on:click={() => { onExportData(); open = false; }}>
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
    Exportar backup (.json)
  </button>
  <button class="sheet-row" on:click={() => { onExportCSV(); open = false; }}>
    <svg viewBox="0 0 24 24"><path d="M4 3h10l6 6v12a0 0 0 010 0H4a0 0 0 010 0V3z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h8" /></svg>
    Exportar para planilha (.csv)
  </button>
  <button class="sheet-row" on:click={() => fileInput?.click()}>
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
    Importar backup (.json)
  </button>
  <button class="sheet-row danger" on:click={onResetYear}>
    <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
    Limpar ano
  </button>
  <input bind:this={fileInput} type="file" accept=".json" on:change={onImportDataFile} />
</div>

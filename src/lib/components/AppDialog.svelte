<script lang="ts">
  export let open = false;
  export let title = '';
  export let message = '';
  export let confirmLabel = 'OK';
  export let cancelLabel = 'Cancel';
  export let showCancel = false;
  export let destructive = false;
  export let onConfirm: () => void;
  export let onCancel: () => void;
</script>

<button class:open class="dialog-backdrop" aria-hidden={!open} aria-label="Close dialog" tabindex={open ? 0 : -1} on:click={onCancel}></button>
<div class:open class="app-dialog" aria-hidden={!open} inert={!open} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">{title}</h2>
  <p>{message}</p>
  <div class:single={!showCancel} class="dialog-actions">
    {#if showCancel}
      <button class="dialog-secondary" type="button" on:click={onCancel}>{cancelLabel}</button>
    {/if}
    <button class:destructive class="dialog-primary" type="button" on:click={onConfirm}>{confirmLabel}</button>
  </div>
</div>

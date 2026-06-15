<script lang="ts">
  export let active: 'aeon' | 'flux' | 'settings' = 'flux';
  export let onOpenAeon: () => void;
  export let onOpenFlux: () => void;
  export let onOpenSettings: () => void;
</script>

<nav class="bottom-nav" aria-label="Primary navigation">
  <button class:active={active === 'aeon'} type="button" aria-label="Aeon analytics" on:click={onOpenAeon}>
    <svg viewBox="0 0 24 24"><path d="M4 19V7" /><path d="M4 19h16" /><path d="M7 16v-3" /><path d="M11 16v-6" /><path d="M15 16v-4" /><path d="M7 11l4-4 4 3 4-6" /></svg>
  </button>
  <button class:active={active === 'flux'} type="button" aria-label="Flux home" on:click={onOpenFlux}>
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="6.5" rx="3.4" ry="4.2" />
      <ellipse cx="17.5" cy="12" rx="4.2" ry="3.4" />
      <ellipse cx="12" cy="17.5" rx="3.4" ry="4.2" />
      <ellipse cx="6.5" cy="12" rx="4.2" ry="3.4" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  </button>
  <button class:active={active === 'settings'} type="button" aria-label="Settings" on:click={onOpenSettings}>
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  </button>
</nav>

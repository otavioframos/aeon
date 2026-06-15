<script lang="ts">
  import { fmtNum } from '$lib/finance';
  import type { Aggregate } from '$lib/types';

  export let currentMonth: Aggregate;
  export let onOpenDashboard: () => void;
  export let onOpenSettings: () => void;
</script>

<div class="topbar">
  <button class="icon-btn" aria-label="Painel" on:click={onOpenDashboard}>
    <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
  </button>
  <div class="brand">Flux</div>
  <button class="icon-btn" aria-label="Ajustes" on:click={onOpenSettings}>
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
  </button>
</div>

<div class="pills">
  <div class="pill"><span class="pl">Entrou</span><span class="pv pos mono">{fmtNum(currentMonth.inc)}</span></div>
  <div class="pill-sep"></div>
  <div class="pill"><span class="pl">Saiu</span><span class="pv neg mono">{fmtNum(currentMonth.exp)}</span></div>
  <div class="pill-sep"></div>
  <div class="pill"><span class="pl">Saldo do mês</span><span class:pos={currentMonth.net >= 0} class:neg={currentMonth.net < 0} class="pv mono">{fmtNum(currentMonth.net)}</span></div>
</div>

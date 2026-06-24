<script lang="ts">
  import { fmtNum } from '$lib/finance';
  import type { CashSnapshot } from '$lib/types';

  export let cash: CashSnapshot;
</script>

<div class="topbar">
  <div class="brand">Flux</div>
</div>

<div class="pills cash-pills">
  <div class="pill cash-pill">
    <span class="pl">real balance</span>
    <span class="pv mono">R$ {fmtNum(cash.realBalance)}</span>
  </div>
  <div class="pill-sep"></div>
  <div class="pill cash-pill primary">
    <span class="pl">left this cycle</span>
    <span class:neg={cash.freeToSpend < 0} class="pv mono">R$ {fmtNum(cash.freeToSpend)}</span>
  </div>
</div>

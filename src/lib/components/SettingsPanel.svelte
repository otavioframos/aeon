<script lang="ts">
  import type { Settings } from '$lib/types';

  type GoalKey = 'essenciais' | 'desejos' | 'investimentos';
  type MeshKey = 'dotSpacing' | 'dotSize' | 'dotOpacity' | 'waveIntensity' | 'waveRadius' | 'noise';

  export let open = false;
  export let settings: Settings;
  export let onUpdateSetting: (keyName: keyof Settings, value: number) => void;

  const goalSliders: { key: GoalKey; label: string; icon: string }[] = [
    { key: 'essenciais', label: 'Essenciais', icon: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>' },
    { key: 'desejos', label: 'Desejos', icon: '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z"/>' },
    { key: 'investimentos', label: 'Investimentos', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>' }
  ];

  const meshSliders: { key: MeshKey; label: string; min: number; max: number; step: number; decimals: number }[] = [
    { key: 'dotSpacing', label: 'Espaçamento', min: 10, max: 40, step: 1, decimals: 0 },
    { key: 'dotSize', label: 'Tamanho do ponto', min: 0.5, max: 4, step: 0.1, decimals: 1 },
    { key: 'dotOpacity', label: 'Opacidade', min: 0.05, max: 0.8, step: 0.01, decimals: 2 },
    { key: 'waveIntensity', label: 'Força da onda', min: 0, max: 30, step: 1, decimals: 0 },
    { key: 'waveRadius', label: 'Alcance da onda', min: 80, max: 400, step: 10, decimals: 0 },
    { key: 'noise', label: 'Dithering', min: 0, max: 0.2, step: 0.005, decimals: 3 }
  ];

  function metaWarnings() {
    const sum = settings.essenciais + settings.desejos + settings.investimentos;
    const warnings: { kind: 'ok' | 'warn' | 'bad'; text: string }[] = [];
    if (sum !== 100) warnings.push({ kind: 'warn', text: `As fatias somam ${sum}%. Ajuste para fechar 100%.` });
    if (settings.investimentos < 10) {
      warnings.push({ kind: 'bad', text: 'Investir abaixo de 10% é conservador demais — como autônomo, isso pesa na aposentadoria.' });
    } else if (settings.investimentos >= 30) {
      warnings.push({ kind: 'ok', text: `Meta de ${settings.investimentos}% em investimentos é excelente.` });
    }
    if (settings.essenciais > 60) warnings.push({ kind: 'bad', text: 'Essenciais acima de 60% deixa pouca folga.' });
    if (settings.desejos > 40) warnings.push({ kind: 'warn', text: 'Desejos acima de 40% pode comprometer a poupança.' });
    return warnings.length ? warnings : [{ kind: 'ok' as const, text: 'Divisão equilibrada.' }];
  }

  function fmtAes(value: number, decimals: number) {
    return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  }
</script>

<button class:open={open} class="ov-backdrop" aria-label="Fechar ajustes" on:click={() => (open = false)}></button>
<section class:open={open} class="panel" aria-hidden={!open}>
  <div class="panel-inner">
    <div class="panel-top">
      <div class="panel-title">Ajustes</div>
      <button class="icon-btn small-icon" aria-label="Fechar" on:click={() => (open = false)}>
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="panel-scroll">
      <div class="set-field">
        <div class="lh">Salário de referência</div>
        <input type="number" value={settings.salary} step="100" on:input={(event) => onUpdateSetting('salary', parseFloat((event.currentTarget as HTMLInputElement).value) || 0)} />
        <div class="ms set-note">Base do gasto diário e do pace. Use um valor conservador se sua renda varia.</div>
      </div>

      <div class="set-field">
        <div class="lh">Metas de alocação</div>
        {#each goalSliders as goal}
          <div class="slider-row">
            <span class="sn"><svg viewBox="0 0 24 24">{@html goal.icon}</svg>{goal.label}</span>
            <input type="range" min="0" max="100" value={settings[goal.key]} on:input={(event) => onUpdateSetting(goal.key, parseInt((event.currentTarget as HTMLInputElement).value))} />
            <span class="sval">{settings[goal.key]}%</span>
          </div>
        {/each}
        <div class="sum-pill">Soma: {settings.essenciais + settings.desejos + settings.investimentos}%{settings.essenciais + settings.desejos + settings.investimentos !== 100 ? ' (ideal: 100%)' : ' ✓'}</div>
        {#each metaWarnings() as warning}
          <div class={`meta-warn ${warning.kind}`}>{warning.text}</div>
        {/each}
      </div>

      <div class="set-field">
        <div class="lh">Estética do fundo</div>
        {#each meshSliders as slider}
          <div class="slider-row">
            <span class="sn">{slider.label}</span>
            <input type="range" min={slider.min} max={slider.max} step={slider.step} value={settings[slider.key]} on:input={(event) => onUpdateSetting(slider.key, parseFloat((event.currentTarget as HTMLInputElement).value))} />
            <span class="sval">{fmtAes(settings[slider.key], slider.decimals)}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

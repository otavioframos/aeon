<script lang="ts">
  import { ACCENT_SWATCHES, DEFAULT_ACCENT, normalizeHex } from '$lib/theme';
  import type { Settings } from '$lib/types';

  type GoalKey = 'essenciais' | 'desejos' | 'investimentos';
  type MeshKey = 'dotSpacing' | 'dotSize' | 'dotOpacity' | 'waveIntensity' | 'waveRadius' | 'noise';

  export let open = false;
  export let settings: Settings;
  export let onUpdateSetting: (keyName: keyof Settings, value: Settings[keyof Settings]) => void;
  export let onExportData: () => void;
  export let onExportCSV: () => void;
  export let onImportDataFile: (event: Event) => void;
  export let onResetYear: () => void;
  export let apkHref = '/vela.apk';
  export let showApkDownload = true;

  let fileInput: HTMLInputElement | undefined;

  const goalSliders: { key: GoalKey; label: string; caption: string; color: string; icon: string }[] = [
    { key: 'essenciais', label: 'Essentials', caption: 'rent, food, recurring needs', color: '#85b694', icon: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>' },
    { key: 'desejos', label: 'Desires', caption: 'comfort, fun, flexible spend', color: '#6b6fa0', icon: '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z"/>' },
    { key: 'investimentos', label: 'Investment', caption: 'portfolio contribution', color: '#66710e', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>' }
  ];

  const meshSliders: { key: MeshKey; label: string; min: number; max: number; step: number; decimals: number }[] = [
    { key: 'dotSpacing', label: 'Dot spacing', min: 10, max: 40, step: 1, decimals: 0 },
    { key: 'dotSize', label: 'Dot size', min: 0.5, max: 4, step: 0.1, decimals: 1 },
    { key: 'dotOpacity', label: 'Field opacity', min: 0.05, max: 0.8, step: 0.01, decimals: 2 },
    { key: 'waveIntensity', label: 'Wave force', min: 0, max: 30, step: 1, decimals: 0 },
    { key: 'waveRadius', label: 'Wave reach', min: 80, max: 400, step: 10, decimals: 0 },
    { key: 'noise', label: 'Dither noise', min: 0, max: 0.2, step: 0.005, decimals: 3 }
  ];

  $: allocationTotal = settings.essenciais + settings.desejos + settings.investimentos;
  $: monthlyInvestmentTarget = settings.salary * (settings.investimentos / 100);
  $: accentColor = normalizeHex(settings.accentColor || DEFAULT_ACCENT);

  function fmt(value: number) {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  function fmtAes(value: number, decimals: number) {
    return decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  }

  function setAccent(value: string) {
    onUpdateSetting('accentColor', normalizeHex(value));
  }
</script>

<button class:open={open} class="ov-backdrop" aria-hidden={!open} aria-label="Close settings" tabindex={open ? 0 : -1} on:click={() => (open = false)}></button>
<section class:open={open} class="panel settings-panel" aria-hidden={!open} inert={!open}>
  <div class="panel-inner">
    <header class="settings-top">
      <div>
        <span>Vela</span>
        <h1>Settings</h1>
      </div>
      <button class="icon-btn small-icon" aria-label="Close settings" on:click={() => (open = false)}>
        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </header>

    <div class="panel-scroll settings-scroll">
      <details class="settings-section" open>
        <summary class="settings-section-toggle">
          <span>Balance and Allocation</span>
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </summary>

        <div class="settings-section-body">
          <section class="settings-hero-card">
            <div class="settings-balance-grid">
              <div>
                <span>Balance anchor</span>
                <label>
                  <small>R$</small>
                  <input
                    type="number"
                    value={settings.currentBalance}
                    step="0.01"
                    on:input={(event) => onUpdateSetting('currentBalance', parseFloat((event.currentTarget as HTMLInputElement).value) || 0)}
                  />
                </label>
              </div>
              <div>
                <span>Reference income</span>
                <label>
                  <small>R$</small>
                  <input type="number" value={settings.salary} step="100" on:input={(event) => onUpdateSetting('salary', parseFloat((event.currentTarget as HTMLInputElement).value) || 0)} />
                </label>
              </div>
            </div>
            <p>Anchor balance drives Flux. Reference income drives pace and targets.</p>
          </section>

          <section class="settings-card">
            <div class="settings-card-head">
              <div>
                <h2>Allocation plan</h2>
                <p>Monthly target: R$ {fmt(monthlyInvestmentTarget)} into investment lanes.</p>
              </div>
              <span class:off={allocationTotal !== 100} class="settings-total">{allocationTotal}%</span>
            </div>

            <div class="allocation-controls">
              {#each goalSliders as goal}
                <label class="allocation-control">
                  <span class="allocation-icon" style:color={goal.color}><svg viewBox="0 0 24 24">{@html goal.icon}</svg></span>
                  <span class="allocation-copy">
                    <strong>{goal.label}</strong>
                    <small>{goal.caption}</small>
                  </span>
                  <span class="allocation-value">{settings[goal.key]}%</span>
                  <input class="settings-slider" type="range" min="0" max="100" value={settings[goal.key]} on:input={(event) => onUpdateSetting(goal.key, parseInt((event.currentTarget as HTMLInputElement).value))} />
                </label>
              {/each}
            </div>

            {#if allocationTotal !== 100}
              <p class="settings-warning">Allocation should close at 100%. You are {allocationTotal > 100 ? `${allocationTotal - 100}% over` : `${100 - allocationTotal}% under`}.</p>
            {:else}
              <p class="settings-note">Balanced. Flux and Aeon will read these targets cleanly.</p>
            {/if}
          </section>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-toggle">
          <span>Theme and Customization</span>
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </summary>

        <div class="settings-section-body">
          {#if showApkDownload}
            <section class="settings-card settings-apk-card">
              <div class="settings-card-head">
                <div>
                  <h2>Android APK</h2>
                  <p>Install Vela locally for the smoothest mobile shell and homescreen widget.</p>
                </div>
              </div>
              <a class="settings-apk-download" href={apkHref} download="vela.apk">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                <span>
                  <strong>Download APK</strong>
                  <small>Includes native widget</small>
                </span>
              </a>
            </section>
          {/if}

          <section class="settings-card">
            <div class="settings-card-head">
              <div>
                <h2>Dither field</h2>
                <p>Background texture and launch wave.</p>
              </div>
            </div>
            <div class="mesh-controls">
              {#each meshSliders as slider}
                <label class="mesh-control">
                  <span>{slider.label}</span>
                  <input
                    class="settings-slider"
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={settings[slider.key]}
                    on:input={(event) => onUpdateSetting(slider.key, parseFloat((event.currentTarget as HTMLInputElement).value))}
                  />
                  <strong>{fmtAes(settings[slider.key], slider.decimals)}</strong>
                </label>
              {/each}
            </div>
          </section>

          <section class="settings-card color-card">
            <div class="settings-card-head">
              <div>
                <h2>Colors</h2>
                <p>Accent color for Vela controls, charts and light.</p>
              </div>
              <span class="color-preview" style:background={accentColor}></span>
            </div>

            <div class="color-controls">
              <label class="color-custom">
                <span>Custom</span>
                <input class="native-color" type="color" value={accentColor} on:input={(event) => setAccent((event.currentTarget as HTMLInputElement).value)} aria-label="Accent color" />
                <input class="hex-input" type="text" value={accentColor} inputmode="text" aria-label="Accent hex" on:change={(event) => setAccent((event.currentTarget as HTMLInputElement).value)} />
              </label>

              <div class="swatch-row" aria-label="Accent palette">
                {#each ACCENT_SWATCHES as color}
                  <button class:active={accentColor === color} type="button" style:background={color} aria-label={`Use ${color}`} on:click={() => setAccent(color)}></button>
                {/each}
              </div>

              <button class="reset-color" type="button" on:click={() => setAccent(DEFAULT_ACCENT)}>Reset to default</button>
            </div>
          </section>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-toggle">
          <span>Data</span>
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </summary>

        <div class="settings-section-body">
          <section class="settings-card">
            <div class="settings-card-head">
              <div>
                <h2>Data</h2>
                <p>Backup, spreadsheet export and local restore.</p>
              </div>
            </div>
            <div class="settings-data-actions">
              <button type="button" on:click={onExportData}>
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                <span>
                  <strong>Backup</strong>
                  <small>Export JSON</small>
                </span>
              </button>
              <button type="button" on:click={onExportCSV}>
                <svg viewBox="0 0 24 24"><path d="M4 3h10l6 6v12H4z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h8" /></svg>
                <span>
                  <strong>Spreadsheet</strong>
                  <small>Export CSV</small>
                </span>
              </button>
              <button type="button" on:click={() => fileInput?.click()}>
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
                <span>
                  <strong>Restore</strong>
                  <small>Import JSON</small>
                </span>
              </button>
              <button class="danger" type="button" on:click={onResetYear}>
                <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
                <span>
                  <strong>Reset year</strong>
                  <small>Delete local entries</small>
                </span>
              </button>
            </div>
            <input bind:this={fileInput} class="settings-file-input" type="file" accept=".json" on:change={onImportDataFile} />
          </section>
        </div>
      </details>
    </div>
  </div>
</section>

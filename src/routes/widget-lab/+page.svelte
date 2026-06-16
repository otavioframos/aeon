<script lang="ts">
  import { createDialKit } from 'dialkit/svelte';

  type Cell = {
    id: string;
    state: 'empty' | 'sand' | 'stream' | 'overflow';
    opacity: number;
  };

  let pulse = 0;

  const controls = createDialKit(
    'Vela Sand Pit',
    {
      spendModel: {
        todaySpent: [62, 0, 280, 1],
        dailyThreshold: [100, 20, 320, 5],
        lastLaunch: [18, 0, 120, 1],
        revealNumbers: false
      },
      matrix: {
        columns: [21, 15, 27, 2],
        rows: [21, 15, 27, 2],
        dotSize: [8, 4, 12, 0.5],
        gap: [4, 1, 7, 0.5],
        radius: [38, 16, 62, 1]
      },
      sandShape: {
        surfaceJitter: [3, 0, 7, 1],
        centerMound: [4, 0, 8, 1],
        stream: true,
        streamWidth: [1, 1, 3, 1],
        overflowMarks: true
      },
      colors: {
        background: '#111716',
        emptyDot: '#2f3734',
        sandDot: '#d9d9d9',
        streamDot: '#ffffff',
        overflowDot: '#a30606'
      },
      actions: {
        simulateLaunch: { type: 'action', label: 'Pulse Launch' }
      }
    },
    {
      onAction: (action) => {
        if (action === 'actions.simulateLaunch') {
          pulse += 1;
        }
      }
    }
  );

  $: cols = clampInt(controls.matrix.columns, 9, 31);
  $: rows = clampInt(controls.matrix.rows, 9, 31);
  $: spendRatio = controls.spendModel.dailyThreshold > 0 ? controls.spendModel.todaySpent / controls.spendModel.dailyThreshold : 0;
  $: launchRatio = controls.spendModel.dailyThreshold > 0 ? controls.spendModel.lastLaunch / controls.spendModel.dailyThreshold : 0;
  $: cells = buildSandPit(cols, rows, spendRatio);
  $: fillPct = Math.round(Math.min(spendRatio, 1) * 100);
  $: overflowPct = Math.round(Math.max(spendRatio - 1, 0) * 100);
  $: launchPct = Math.round(Math.min(launchRatio, 1) * 100);
  $: widgetStyle = [
    `--widget-bg:${controls.colors.background}`,
    `--dot-size:${controls.matrix.dotSize}px`,
    `--dot-gap:${controls.matrix.gap}px`,
    `--widget-radius:${controls.matrix.radius}px`,
    `--empty-dot:${controls.colors.emptyDot}`,
    `--sand-dot:${controls.colors.sandDot}`,
    `--stream-dot:${controls.colors.streamDot}`,
    `--overflow-dot:${controls.colors.overflowDot}`,
    `--cols:${cols}`
  ].join(';');

  function clampInt(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function buildSandPit(columns: number, rowCount: number, ratio: number): Cell[] {
    const cells: Cell[] = [];
    const clamped = Math.max(0, Math.min(ratio, 1));
    const fillRows = Math.round(rowCount * clamped);
    const center = (columns - 1) / 2;
    const streamWidth = Math.max(1, Math.round(controls.sandShape.streamWidth));
    const overflowStrength = Math.max(0, Math.min(ratio - 1, 1.5));

    for (let y = 0; y < rowCount; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const centered = 1 - Math.min(1, Math.abs(x - center) / Math.max(center, 1));
        const mound = Math.round(Math.pow(centered, 2.2) * controls.sandShape.centerMound);
        const jitter = Math.round((noise(x, 3) - 0.5) * controls.sandShape.surfaceJitter);
        const surface = rowCount - fillRows - mound + jitter;
        const streamDrop =
          controls.sandShape.stream &&
          Math.abs(x - center) < streamWidth &&
          y < Math.max(surface - 1, 0) &&
          y < rowCount * 0.55;
        const overflow =
          controls.sandShape.overflowMarks &&
          overflowStrength > 0 &&
          y < rowCount * 0.45 &&
          noise(x, y + 31) < overflowStrength * 0.13;

        let state: Cell['state'] = 'empty';
        let opacity = 0.78;

        if (y >= surface) {
          state = 'sand';
          opacity = 0.9 + noise(x + 5, y + 9) * 0.1;
        }

        if (streamDrop) {
          state = 'stream';
          opacity = 0.88 + noise(x + 2, y + pulse) * 0.12;
        }

        if (overflow) {
          state = 'overflow';
          opacity = 0.45 + noise(x + pulse, y + 4) * 0.4;
        }

        cells.push({ id: `${x}-${y}`, state, opacity });
      }
    }

    return cells;
  }

  function noise(x: number, y: number) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }
</script>

<svelte:head>
  <title>Vela Widget Lab</title>
</svelte:head>

<main class="lab-shell">
  <section class="lab-copy">
    <p class="eyebrow">Widget lab</p>
    <h1>Sand pit privacy view</h1>
    <p>
      The widget fills as today's expenses approach the daily threshold. It keeps money private by default and lets the
      matrix carry the pressure signal.
    </p>
  </section>

  <section class="preview-stage" aria-label="2 by 2 widget preview">
    <div class:pulse class="widget-preview" style={widgetStyle}>
      <div class="matrix" aria-hidden="true">
        {#each cells as cell (cell.id)}
          <span class={cell.state} style:opacity={cell.opacity}></span>
        {/each}
      </div>

      {#if controls.spendModel.revealNumbers}
        <div class="private-readout">
          <strong>{fillPct}%</strong>
          <span>daily pit</span>
        </div>
      {/if}
    </div>
  </section>

  <section class="lab-stats" aria-label="Current widget model">
    <article>
      <span>Fill</span>
      <strong>{fillPct}%</strong>
    </article>
    <article>
      <span>Last launch</span>
      <strong>{launchPct}%</strong>
    </article>
    <article>
      <span>Overflow</span>
      <strong>{overflowPct}%</strong>
    </article>
  </section>
</main>

<style>
  :global(html),
  :global(body) {
    min-height: 100%;
    background: #0c0f0e;
  }

  .lab-shell {
    min-height: 100dvh;
    display: grid;
    align-content: center;
    gap: 28px;
    padding: max(24px, env(safe-area-inset-top)) 18px max(32px, env(safe-area-inset-bottom));
    color: #d9d9d9;
    background:
      radial-gradient(circle at 70% 14%, rgba(36, 126, 92, 0.22), transparent 34%),
      radial-gradient(circle at 18% 78%, rgba(36, 126, 92, 0.16), transparent 36%),
      #0c0f0e;
    font-family: 'Albert Sans', Inter, system-ui, sans-serif;
  }

  .lab-copy,
  .preview-stage,
  .lab-stats {
    width: min(100%, 520px);
    margin: 0 auto;
  }

  .lab-copy {
    display: grid;
    gap: 8px;
  }

  .eyebrow,
  .lab-copy p,
  .lab-stats span {
    margin: 0;
    color: rgba(217, 217, 217, 0.58);
    font-size: 13px;
    line-height: 1.35;
  }

  .eyebrow {
    color: #869d94;
  }

  h1 {
    margin: 0;
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(40px, 13vw, 68px);
    font-weight: 400;
    line-height: 0.95;
    letter-spacing: 0;
  }

  .preview-stage {
    min-height: 360px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(217, 217, 217, 0.08), rgba(115, 115, 115, 0.08)),
      rgba(18, 24, 22, 0.68);
    border: 1px solid #2f3734;
  }

  .widget-preview {
    position: relative;
    width: min(74vw, 256px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: var(--widget-radius);
    background: var(--widget-bg);
    box-shadow:
      inset 0 0 0 1px rgba(217, 217, 217, 0.05),
      0 28px 80px rgba(0, 0, 0, 0.42);
    overflow: hidden;
  }

  .widget-preview::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 86%, rgba(217, 217, 217, 0.12), transparent 46%),
      linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.28));
    pointer-events: none;
  }

  .widget-preview.pulse .stream {
    animation: grain-fall 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .matrix {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--dot-size));
    gap: var(--dot-gap);
  }

  .matrix span {
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 999px;
    background: var(--empty-dot);
  }

  .matrix .sand {
    background: var(--sand-dot);
  }

  .matrix .stream {
    background: var(--stream-dot);
  }

  .matrix .overflow {
    background: var(--overflow-dot);
  }

  .private-readout {
    position: absolute;
    z-index: 2;
    left: 18px;
    bottom: 16px;
    display: grid;
    gap: 2px;
    color: rgba(217, 217, 217, 0.82);
  }

  .private-readout strong {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 32px;
    font-weight: 400;
    line-height: 1;
  }

  .private-readout span {
    color: rgba(217, 217, 217, 0.52);
    font-size: 10px;
  }

  .lab-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .lab-stats article {
    min-height: 78px;
    display: grid;
    align-content: space-between;
    padding: 12px;
    border: 1px solid #2f3734;
    border-radius: 8px;
    background: rgba(18, 24, 22, 0.64);
  }

  .lab-stats strong {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 34px;
    font-weight: 400;
    line-height: 1;
  }

  @keyframes grain-fall {
    from {
      transform: translateY(-8px);
      filter: brightness(1.35);
    }

    to {
      transform: translateY(0);
      filter: brightness(1);
    }
  }
</style>

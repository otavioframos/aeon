<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { EntryType, Settings } from './types';

  export let settings: Settings;

  const SAGE = { r: 150, g: 172, b: 160 };
  const NEG = { r: 207, g: 148, b: 136 };
  const GRID = {
    dotSize: 1.6,
    dotSpacing: 22,
    dotOpacity: 0.34,
    waveIntensity: 9,
    waveRadius: 230,
    gradientDur: 10000,
    noise: 0.05
  };

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let reduceMotion = false;
  let gw = 0;
  let gh = 0;
  let cols = 0;
  let rows = 0;
  let dpr = 1;
  let raf = 0;
  let waves: { x: number; y: number; t: number; type: EntryType }[] = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let noiseTile: HTMLCanvasElement | null = null;

  $: if (ctx) {
    syncGrid();
    if (reduceMotion) drawStatic();
  }

  export function triggerWave(type: EntryType) {
    waves.push({ x: gw / 2, y: gh * 0.42, t: performance.now(), type });
    if (waves.length > 6) waves.shift();
  }

  function syncGrid() {
    GRID.dotSize = settings.dotSize;
    GRID.dotSpacing = settings.dotSpacing;
    GRID.dotOpacity = settings.dotOpacity;
    GRID.waveIntensity = settings.waveIntensity;
    GRID.waveRadius = settings.waveRadius;
    GRID.noise = settings.noise;
  }

  function initMesh() {
    if (!ctx) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    gw = innerWidth;
    gh = innerHeight;
    canvas.width = gw * dpr;
    canvas.height = gh * dpr;
    canvas.style.width = `${gw}px`;
    canvas.style.height = `${gh}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(gw / GRID.dotSpacing) + 1;
    rows = Math.ceil(gh / GRID.dotSpacing) + 1;
    buildNoise();
  }

  function buildNoise() {
    const s = 90;
    const off = document.createElement('canvas');
    off.width = s;
    off.height = s;
    const o = off.getContext('2d');
    if (!o) return;
    const img = o.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 255 * GRID.noise;
    }
    o.putImageData(img, 0, 0);
    noiseTile = off;
  }

  function setPointer(e: MouseEvent | TouchEvent) {
    const p = 'touches' in e ? e.touches[0] : e;
    if (!p) return;
    pointer.x = p.clientX;
    pointer.y = p.clientY;
    pointer.active = true;
  }

  function clearPointer() {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function drawMesh(now = performance.now()) {
    if (!ctx) return;

    const t = (now % GRID.gradientDur) / GRID.gradientDur;
    const ang = t * Math.PI * 2;
    const gx = gw * (0.5 + 0.32 * Math.cos(ang));
    const gy = gh * (0.5 + 0.32 * Math.sin(ang * 0.8));
    ctx.fillStyle = '#0c0f0e';
    ctx.fillRect(0, 0, gw, gh);

    const bg = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(gw, gh) * 0.9);
    bg.addColorStop(0, `rgba(${SAGE.r},${SAGE.g},${SAGE.b},0.09)`);
    bg.addColorStop(0.5, `rgba(${SAGE.r},${SAGE.g},${SAGE.b},0.03)`);
    bg.addColorStop(1, 'rgba(12,15,14,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, gw, gh);

    const waveLife = 1500;
    waves = waves.filter((wave) => now - wave.t < waveLife);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = c * GRID.dotSpacing;
        const by = r * GRID.dotSpacing;
        let dx = 0;
        let dy = 0;
        let glow = 0;
        let tint = 0;

        for (const wave of waves) {
          const age = (now - wave.t) / waveLife;
          const front = age * GRID.waveRadius * 2.6;
          const ddx = bx - wave.x;
          const ddy = by - wave.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const band = Math.abs(dist - front);
          if (band < GRID.waveRadius) {
            const influence = (1 - band / GRID.waveRadius) * (1 - age);
            const push = influence * GRID.waveIntensity;
            if (dist > 0) {
              dx += (ddx / dist) * push;
              dy += (ddy / dist) * push;
            }
            glow += influence;
            if (wave.type === 'out') tint += influence;
          }
        }

        if (pointer.active) {
          const pdx = bx - pointer.x;
          const pdy = by - pointer.y;
          const pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < 150) glow += (1 - pd / 150) * 0.6;
        }

        const op = Math.min(0.95, GRID.dotOpacity + glow * 0.6);
        const size = GRID.dotSize + glow * 1.6;
        const mix = Math.min(1, tint);
        const cr = Math.round(SAGE.r + (NEG.r - SAGE.r) * mix);
        const cg = Math.round(SAGE.g + (NEG.g - SAGE.g) * mix);
        const cb = Math.round(SAGE.b + (NEG.b - SAGE.b) * mix);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${op})`;
        ctx.fillRect(bx + dx - size / 2, by + dy - size / 2, size, size);
      }
    }

    if (noiseTile) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = ctx.createPattern(noiseTile, 'repeat') || 'transparent';
      ctx.fillRect(0, 0, gw, gh);
      ctx.globalCompositeOperation = 'source-over';
    }

    raf = requestAnimationFrame(drawMesh);
  }

  function drawStatic() {
    if (!ctx) return;
    ctx.fillStyle = '#0c0f0e';
    ctx.fillRect(0, 0, gw, gh);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = `rgba(${SAGE.r},${SAGE.g},${SAGE.b},${GRID.dotOpacity})`;
        ctx.fillRect(
          c * GRID.dotSpacing - GRID.dotSize / 2,
          r * GRID.dotSpacing - GRID.dotSize / 2,
          GRID.dotSize,
          GRID.dotSize
        );
      }
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d', { alpha: false });
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    syncGrid();
    initMesh();

    addEventListener('resize', initMesh);
    addEventListener('mousemove', setPointer, { passive: true });
    addEventListener('mouseleave', clearPointer);
    addEventListener('touchstart', setPointer, { passive: true });
    addEventListener('touchmove', setPointer, { passive: true });
    addEventListener('touchend', clearPointer);

    if (reduceMotion) drawStatic();
    else raf = requestAnimationFrame(drawMesh);
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    cancelAnimationFrame(raf);
    removeEventListener('resize', initMesh);
    removeEventListener('mousemove', setPointer);
    removeEventListener('mouseleave', clearPointer);
    removeEventListener('touchstart', setPointer);
    removeEventListener('touchmove', setPointer);
    removeEventListener('touchend', clearPointer);
  });
</script>

<canvas bind:this={canvas} id="mesh" aria-hidden="true"></canvas>

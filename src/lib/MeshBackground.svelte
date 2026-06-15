<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { hexToRgb, normalizeHex } from './theme';
  import type { EntryType, Settings } from './types';

  export let settings: Settings;
  export let dimmed = false;

  type ShaderMountLike = {
    dispose: () => void;
    setSpeed: (speed: number) => void;
  };

  const SAGE = { r: 134, g: 157, b: 148 };
  const DEFAULT_ACCENT = { r: 36, g: 126, b: 92 };
  const RED = { r: 163, g: 6, b: 6 };
  const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const GRID = {
    dotSize: 1.6,
    dotSpacing: 22,
    dotOpacity: 0.34,
    waveIntensity: 9,
    waveRadius: 230,
    gradientDur: 18000,
    noise: 0.05
  };

  let shaderHost: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let shaderMount: ShaderMountLike | null = null;
  let shaderFallback = false;
  let reduceMotion = false;
  let gw = 0;
  let gh = 0;
  let cols = 0;
  let rows = 0;
  let dpr = 1;
  let raf = 0;
  let waves: { x: number; y: number; t: number; type: EntryType }[] = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let fieldStep = 10;
  let accent = DEFAULT_ACCENT;
  let activeAccent = '';

  $: if (ctx) {
    const nextAccent = normalizeHex(settings.accentColor || '#247E5C');
    const accentChanged = activeAccent && activeAccent !== nextAccent;
    syncGrid();
    if (accentChanged && shaderMount && !reduceMotion) {
      shaderMount.dispose();
      shaderMount = null;
      mountShader();
    }
    if (reduceMotion) drawFrame();
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
    activeAccent = normalizeHex(settings.accentColor || '#247E5C');
    accent = hexToRgb(activeAccent);
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
    fieldStep = Math.max(4, GRID.dotSpacing * 0.46);
    cols = Math.ceil(gw / fieldStep) + 1;
    rows = Math.ceil(gh / fieldStep) + 1;
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

  function threshold(c: number, r: number) {
    return (BAYER_4[(r % 4) * 4 + (c % 4)] + 0.5) / 16;
  }

  function mixColor(a: typeof SAGE, b: typeof SAGE, amount: number) {
    const t = Math.min(1, Math.max(0, amount));
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  function drawFrame(now = performance.now()) {
    if (!ctx) return;

    const t = reduceMotion ? 0.34 : (now % GRID.gradientDur) / GRID.gradientDur;
    ctx.clearRect(0, 0, gw, gh);

    if (shaderFallback || reduceMotion) {
      ctx.fillStyle = '#0c0f0e';
      ctx.fillRect(0, 0, gw, gh);
      const bg = ctx.createRadialGradient(gw * 1.24, -gh * 0.08, 0, gw * 1.24, -gh * 0.08, Math.max(gw, gh) * 1.35);
      bg.addColorStop(0, `rgba(${accent.r},${accent.g},${accent.b},0.12)`);
      bg.addColorStop(0.42, `rgba(${accent.r},${accent.g},${accent.b},0.08)`);
      bg.addColorStop(0.74, `rgba(${accent.r},${accent.g},${accent.b},0.05)`);
      bg.addColorStop(1, 'rgba(12,15,14,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, gw, gh);
    }

    const waveLife = 2200;
    waves = waves.filter((wave) => now - wave.t < waveLife);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = c * fieldStep;
        const by = r * fieldStep;
        let dx = 0;
        let dy = 0;
        let waveGlow = 0;
        let redTint = 0;
        let greenTint = 0;

        for (const wave of waves) {
          const age = (now - wave.t) / waveLife;
          const front = age * GRID.waveRadius * 2.4;
          const ddx = bx - wave.x;
          const ddy = by - wave.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          const band = Math.abs(dist - front);
          const bandWidth = GRID.waveRadius * 0.34;
          if (band < bandWidth) {
            const influence = (1 - band / bandWidth) * (1 - age);
            const push = influence * GRID.waveIntensity * 0.45;
            if (dist > 0) {
              dx += (ddx / dist) * push;
              dy += (ddy / dist) * push;
            }
            waveGlow += influence;
            if (wave.type === 'out') redTint += influence;
            else greenTint += influence;
          }
        }

        let touchGlow = 0;
        if (pointer.active) {
          const pdx = bx - pointer.x;
          const pdy = by - pointer.y;
          const pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < 150) touchGlow = (1 - pd / 150) * 0.5;
        }

        const lightDist = Math.hypot(bx - gw * 1.22, by + gh * 0.08);
        const light = Math.max(0, 1 - lightDist / (Math.max(gw, gh) * 1.15));
        const sail = (Math.sin(by * 0.017 + t * Math.PI * 2 + Math.sin(bx * 0.012) * 1.5) + 1) / 2;
        const diagonal = (Math.sin((bx + by * 0.72) * 0.015 - t * Math.PI * 1.6) + 1) / 2;
        const jitter = ((Math.sin((c * 12.9898 + r * 78.233) * 43758.5453) + 1) / 2) * GRID.noise;
        const value = light * 0.56 + sail * 0.12 + diagonal * 0.08 + waveGlow * 0.86 + touchGlow * 0.52 + jitter;
        const gate = shaderFallback || reduceMotion ? threshold(c, r) * 0.92 : threshold(c, r) * 1.18;

        if (value < gate) continue;

        const tintTarget = redTint > greenTint ? RED : accent;
        const tintAmount = Math.max(redTint, greenTint) * 0.72;
        const color = mixColor(SAGE, tintTarget, tintAmount);
        const op = Math.min(0.58, GRID.dotOpacity * 0.36 + value * 0.16 + waveGlow * 0.18);
        const size = Math.max(1, GRID.dotSize + waveGlow * 1.2 + touchGlow * 0.6);
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${op})`;
        ctx.fillRect(Math.round(bx + dx - size / 2), Math.round(by + dy - size / 2), size, size);
      }
    }

    if (!reduceMotion && !document.hidden) {
      raf = requestAnimationFrame(drawFrame);
    } else {
      raf = 0;
    }
  }

  async function mountShader() {
    if (!shaderHost || reduceMotion) {
      shaderFallback = true;
      return;
    }
    try {
      const {
        ShaderMount,
        ditheringFragmentShader,
        getShaderColorFromString,
        DitheringShapes,
        DitheringTypes
      } = await import('@paper-design/shaders');

      shaderMount = new ShaderMount(
        shaderHost,
        ditheringFragmentShader,
        {
          u_colorBack: getShaderColorFromString('rgba(0, 0, 0, 0)'),
          u_colorFront: getShaderColorFromString(`rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.24)`),
          u_shape: DitheringShapes.simplex,
          u_type: DitheringTypes['4x4'],
          u_pxSize: 2,
          u_fit: 0,
          u_scale: 0.82,
          u_rotation: -0.08,
          u_originX: 0.72,
          u_originY: 0.2,
          u_offsetX: 0,
          u_offsetY: 0,
          u_worldWidth: 0,
          u_worldHeight: 0
        },
        undefined,
        0.16,
        5200,
        1,
        1_200_000
      );
      shaderHost.querySelector('canvas')?.addEventListener(
        'webglcontextlost',
        () => {
          shaderMount?.dispose();
          shaderMount = null;
          shaderFallback = true;
          drawFrame();
        },
        { once: true }
      );
    } catch {
      shaderHost.querySelector('canvas')?.remove();
      shaderFallback = true;
      drawFrame();
    }
  }

  function handleVisibility() {
    if (shaderMount && !reduceMotion) shaderMount.setSpeed(document.hidden ? 0 : 0.16);
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (!reduceMotion && !raf) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  function handleReducedMotionChange(event: MediaQueryListEvent) {
    reduceMotion = event.matches;
    shaderMount?.setSpeed(reduceMotion ? 0 : 0.16);
    cancelAnimationFrame(raf);
    raf = 0;
    drawFrame();
    if (!reduceMotion) {
      raf = requestAnimationFrame(drawFrame);
    }
  }

  let motionQuery: MediaQueryList | null = null;

  onMount(() => {
    ctx = canvas.getContext('2d', { alpha: true });
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = motionQuery.matches;
    syncGrid();
    initMesh();
    mountShader();

    addEventListener('resize', initMesh);
    addEventListener('mousemove', setPointer, { passive: true });
    addEventListener('mouseleave', clearPointer);
    addEventListener('touchstart', setPointer, { passive: true });
    addEventListener('touchmove', setPointer, { passive: true });
    addEventListener('touchend', clearPointer);
    document.addEventListener('visibilitychange', handleVisibility);
    motionQuery.addEventListener('change', handleReducedMotionChange);

    if (reduceMotion) drawFrame();
    else raf = requestAnimationFrame(drawFrame);
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    cancelAnimationFrame(raf);
    shaderMount?.dispose();
    removeEventListener('resize', initMesh);
    removeEventListener('mousemove', setPointer);
    removeEventListener('mouseleave', clearPointer);
    removeEventListener('touchstart', setPointer);
    removeEventListener('touchmove', setPointer);
    removeEventListener('touchend', clearPointer);
    document.removeEventListener('visibilitychange', handleVisibility);
    motionQuery?.removeEventListener('change', handleReducedMotionChange);
  });
</script>

<div id="mesh" class:dimmed class:fallback={shaderFallback || reduceMotion} aria-hidden="true">
  <div class="mesh-light"></div>
  <div bind:this={shaderHost} class="mesh-shader"></div>
  <canvas bind:this={canvas} class="mesh-wave"></canvas>
</div>

<style>
  #mesh {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 130% -8%,
        rgba(var(--accent-rgb), 0) 0%,
        rgba(var(--accent-rgb), 0.16) 50%,
        rgba(var(--accent-rgb), 0.2) 75%,
        rgba(12, 15, 14, 0.32) 100%
      ),
      #0c0f0e;
    transition: filter var(--motion-base, 220ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  #mesh.dimmed {
    filter: blur(4px);
  }

  .mesh-light,
  .mesh-shader,
  .mesh-wave {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .mesh-light {
    background:
      radial-gradient(ellipse at 112% -8%, rgba(var(--accent-rgb), 0.07), transparent 58%),
      linear-gradient(142deg, rgba(217, 217, 217, 0.025) 12%, rgba(115, 115, 115, 0.014) 76%);
    mix-blend-mode: screen;
  }

  .mesh-shader {
    opacity: 0.42;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.98), rgba(0, 0, 0, 0.46) 72%, rgba(0, 0, 0, 0.24));
    -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.98), rgba(0, 0, 0, 0.46) 72%, rgba(0, 0, 0, 0.24));
  }

  .mesh-shader :global(canvas),
  .mesh-wave {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }

  .mesh-wave {
    opacity: 0.9;
  }

  #mesh.fallback .mesh-shader {
    display: none;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  let visible = true;
  let playing = false;

  onMount(() => {
    let timer: number | undefined;
    let cancelled = false;

    async function start() {
      try {
        const [{ Capacitor }, { SplashScreen }] = await Promise.all([
          import('@capacitor/core'),
          import('@capacitor/splash-screen')
        ]);

        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide({ fadeOutDuration: 160 });
        }
      } catch {
        // Native splash APIs are unavailable in the browser build.
      }

      if (cancelled) return;

      window.requestAnimationFrame(() => {
        playing = true;
        timer = window.setTimeout(() => {
          visible = false;
        }, 1380);
      });
    }

    void start();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  });
</script>

{#if visible}
  <section class:playing class="vela-splash" aria-label="Vela is opening">
    <div class="splash-field"></div>
    <div class="splash-ripple"></div>
    <img src="./ae.svg" alt="Vela" />
  </section>
{/if}

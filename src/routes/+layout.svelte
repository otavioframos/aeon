<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { DialRoot } from 'dialkit/svelte';
  import 'dialkit/styles.css';

  let { children } = $props();
</script>

{@render children()}
<DialRoot position="top-right" productionEnabled={dev || page.url.pathname.endsWith('/widget-lab')} />

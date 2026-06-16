import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const dialkitIconsShim = fileURLToPath(new URL('./src/lib/dialkit-shims/icons.ts', import.meta.url));
const dialkitShortcutShim = fileURLToPath(new URL('./src/lib/dialkit-shims/shortcut-utils.ts', import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: 'dialkit-svelte-published-package-shims',
      resolveId(source, importer) {
        const normalizedImporter = importer?.replaceAll('\\', '/');
        const fromDialkitSvelte = normalizedImporter?.includes('/node_modules/dialkit/dist/svelte/');

        if (fromDialkitSvelte && source === '../../icons') return dialkitIconsShim;
        if (fromDialkitSvelte && source === '../../shortcut-utils') return dialkitShortcutShim;

        return null;
      }
    },
    sveltekit()
  ]
});

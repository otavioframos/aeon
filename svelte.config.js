import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const repo = 'aeon';
const dev = process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';
const android = process.argv.includes('android') || process.env.VELA_TARGET === 'android' || process.env.npm_lifecycle_event === 'build:android';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    paths: {
      base: dev || android ? '' : `/${repo}`
    }
  }
};

export default config;

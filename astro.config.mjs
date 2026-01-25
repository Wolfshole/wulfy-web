// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  server: {
    // @ts-ignore
    proxy: {
      '/profile': 'http://localhost:3000',
      '/dashboard': 'http://localhost:3000'
    }
  }
});

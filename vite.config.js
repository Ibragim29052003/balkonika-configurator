import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    // The on-demand Three.js preview is ~152 KB gzip; the UI loads separately.
    chunkSizeWarningLimit: 700,
  },
});

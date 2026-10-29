import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // The on-demand Three.js preview is ~152 KB gzip; the UI loads separately.
    chunkSizeWarningLimit: 700,
  },
});

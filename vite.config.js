import { defineConfig } from 'vite';

// Plain JavaScript (no JSX), so no React plugin is needed.
export default defineConfig({
  build: { outDir: 'dist', sourcemap: false },
});

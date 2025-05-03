import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindPlugin from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindPlugin()],
  build: {
    outDir: resolve(__dirname, '../dist/client'),
    emptyOutDir: true,
  },
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
    'process': '({"env":{}})',
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'Hitster',
      fileName: () => 'hitster.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'hitster.[ext]',
      },
    },
    cssCodeSplit: false,
  },
  test: {
    environment: 'node',
  },
});

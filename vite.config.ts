/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2015',
    lib: {
      entry: './src/Delta.ts',
      formats: ['cjs', 'es'],
      fileName: 'Delta',
    },
    rollupOptions: {
      output: { exports: 'named' },
      external: ['fast-diff', 'lodash.clonedeep', 'lodash.isequal'],
    },
    sourcemap: true,
  },
  test: {
    include: ['./test/**/*'],
    coverage: {
      reporter: [['lcov', { projectRoot: './src' }]],
    },
  },
});

import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts'
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: true,
    treeshake: true,
    outDir: 'dist',
    tsconfig: './tsconfig.json',
  },
  {
    entry: {
      cli: 'src/cli.ts'
    },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    tsconfig: './tsconfig.json',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);

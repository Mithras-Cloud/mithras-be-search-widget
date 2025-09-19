import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    clean: true,
    minify: false,
    outDir: 'dist',
    target: 'es2019',
    treeshake: true,
    env: {
      NODE_ENV: 'production'
    },
    outExtension({ format }) {
      if (format === 'cjs') return { js: '.cjs' };
      return { js: '.js' };
    }
  },
  {
    entry: {
      'your-widget': 'src/wc.ts'
    },
    format: ['esm', 'iife'],
    sourcemap: true,
    splitting: false,
    clean: false,
    minify: true,
    outDir: 'dist',
    target: 'es2019',
    treeshake: true,
    globalName: 'YourWidget',
    outExtension({ format }) {
      if (format === 'esm') return { js: '.js' };
      if (format === 'iife') return { js: '.iife.js' };
      return { js: '.js' };
    }
  }
]);

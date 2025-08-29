import { defineConfig } from 'vite';
import path from 'node:path';
import oxlintPlugin from 'vite-plugin-oxlint';

// Types for Vite plugin
interface VitePlugin {
  name: string;
  generateBundle: (options: unknown, bundle: Record<string, BundleChunk>) => void;
}

interface BundleChunk {
  type: string;
  isEntry: boolean;
  code: string;
}

// Custom plugin to handle Flarum's module.exports assignment pattern
const flarumModuleExports = (): VitePlugin => ({
  name: 'flarum-module-exports',
  generateBundle(options: unknown, bundle: Record<string, BundleChunk>): void {
    for (const fileName in bundle) {
      if (Object.hasOwn(bundle, fileName)) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.isEntry) {
          // Add module.exports={} at the end like webpack does
          chunk.code += '\nmodule.exports={};';
        }
      }
    }
  },
});

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: false,
  plugins: [
    oxlintPlugin({
      path: 'src',
      params: '--quiet',
    }),
    flarumModuleExports(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clean on admin build
    sourcemap: true,
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'src/admin/index.ts'),
      },
      external: (id: string) => {
        if (id === '@flarum/core/admin') return true;
        if (id === 'jquery') return true;
        if (id === 'mithril') return true;
        if (id.startsWith('flarum/')) return true;
        return false;
      },
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: '[name].js',
        globals: (id: string) => {
          if (id === '@flarum/core/admin') return 'flarum.core';
          if (id === 'jquery') return 'jQuery';
          if (id === 'mithril') return 'm';
          const compat = id.match(/^flarum\/(.+)$/);
          if (compat) return `flarum.core.compat['${compat[1]}']`;
          return id;
        },
      },
    },
  },
  esbuild: {
    jsxFactory: 'm',
    jsxFragment: "'['",
    tsconfigRaw: {
      compilerOptions: {
        isolatedModules: true,
      },
    },
  },
});
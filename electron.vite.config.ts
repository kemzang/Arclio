import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig, loadEnv } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';

const require = createRequire(import.meta.url);
const { version } = require('./package.json') as { version: string };

export default defineConfig(({ mode }) => {
  // Inline OpenPanel credentials from .env at build time. Without this,
  // process.env.OPENPANEL_CLIENT_ID is undefined in the packaged app (no
  // shell env to read from) and analytics silently never initialize.
  // Empty-string prefix loads all keys regardless of VITE_/MAIN_VITE_ prefix.
  const env = loadEnv(mode, '.', '');
  const openpanelClientId = env.OPENPANEL_CLIENT_ID ?? process.env.OPENPANEL_CLIENT_ID ?? '';
  const openpanelClientSecret = env.OPENPANEL_CLIENT_SECRET ?? process.env.OPENPANEL_CLIENT_SECRET ?? '';
  const arroxyAnalyticsDebug = env.ARROXY_ANALYTICS_DEBUG ?? process.env.ARROXY_ANALYTICS_DEBUG ?? '';

  return {
    main: {
      define: {
        'process.env.OPENPANEL_CLIENT_ID': JSON.stringify(openpanelClientId),
        'process.env.OPENPANEL_CLIENT_SECRET': JSON.stringify(openpanelClientSecret),
        'process.env.ARROXY_ANALYTICS_DEBUG': JSON.stringify(arroxyAnalyticsDebug),
      },
      resolve: {
        alias: {
          '@main': path.resolve('src/main'),
          '@shared': path.resolve('src/shared')
        }
      },
      build: {
        externalizeDeps: true,
        rollupOptions: {
          // Workaround: electron-vite's preset auto-externalizes `electron` +
          // node:builtins + package.json deps, but rolldown re-bundles all of
          // them once `output.format` is overridden (the merge clobbers the
          // preset's `external` array). Re-asserting via a function — confirmed
          // empirically: drops main bundle from ~2.4 MB (got inlined) to ~750 KB.
          external: (id): boolean => {
            if (id.startsWith('node:')) return true;
            if (id.startsWith('@main/') || id.startsWith('@shared/')) return false;
            if (/^[./]/.test(id)) return false;
            return true;
          },
          output: { format: 'es', entryFileNames: '[name].js' }
        }
      }
    },
    preload: {
      define: {
        '__APP_VERSION__': JSON.stringify(version),
      },
      resolve: {
        alias: {
          '@preload': path.resolve('src/preload'),
          '@shared': path.resolve('src/shared')
        }
      },
      // Electron 42 sandboxed preload does not support ESM. Source uses .cts
      // (matches Element-desktop convention: .cts → .cjs is the contract that
      // this file stays CommonJS). electron-vite's findLibEntry only checks
      // {js,ts,mjs,cjs} so we must point lib.entry at the .cts explicitly.
      build: {
        externalizeDeps: true,
        lib: {
          entry: path.resolve('src/preload/index.cts')
        },
        rollupOptions: {
          // Same shape as main: rolldown re-bundles deps when output is CJS
          // unless we re-assert externals here. Crucially, `electron` lives in
          // devDependencies so the auto-externalize plugin skips it; without
          // an explicit external the bundler inlines `node_modules/electron`
          // (the npm postinstall shim, NOT the runtime electron module),
          // breaking ipcRenderer/contextBridge at preload load time.
          external: (id): boolean => {
            if (id === 'electron' || id.startsWith('electron/')) return true;
            if (id.startsWith('node:')) return true;
            if (id.startsWith('@preload/') || id.startsWith('@shared/')) return false;
            if (/^[./]/.test(id)) return false;
            return true;
          },
          output: {
            format: 'cjs',
            entryFileNames: '[name].cjs'
          }
        }
      }
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': path.resolve('src/renderer/src'),
          '@shared': path.resolve('src/shared')
        }
      },
      plugins: [react(), tailwindcss(), Icons({ compiler: 'jsx', jsx: 'react' }) as PluginOption]
    }
  };
});

import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
      plugins: [externalizeDepsPlugin()],
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
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      define: {
        '__APP_VERSION__': JSON.stringify(version),
      },
      resolve: {
        alias: {
          '@preload': path.resolve('src/preload'),
          '@shared': path.resolve('src/shared')
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
      plugins: [react(), tailwindcss()]
    }
  };
});

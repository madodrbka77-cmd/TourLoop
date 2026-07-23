
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use process.cwd() or fallback to dot. Casting process to any to avoid type issues if @types/node missing in some envs
  const currentDir = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, currentDir, '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {}, // Removed aliases to ensure strict relative path resolution
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PREVIEW_PORT || '8080'),
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000,
    },
  };
});

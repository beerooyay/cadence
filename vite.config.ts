import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],

      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false
      },

      // Preserved original Port and Host setting
      server: {
        port: 5173,
        host: '0.0.0.0',
      },

      // Preserved original Environment definitions
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      // Preserved original Alias
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});


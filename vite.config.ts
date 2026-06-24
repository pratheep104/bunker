
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,tsx}',
    }),
  ],
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});


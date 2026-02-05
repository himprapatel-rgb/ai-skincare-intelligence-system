import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), svgr()],
  base: '/',
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Split large vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('@mediapipe')) return 'mediapipe';
            if (id.includes('@tensorflow')) return 'tensorflow';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('react-router')) return 'router';
            if (id.includes('axios')) return 'http';
            // Default vendor chunk for smaller libs
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))

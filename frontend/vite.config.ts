import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    ...(mode === 'production'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  base: mode === 'production' ? '/ai-skincare-intelligence-system/' : '/',
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
          if (id.includes('react-router-dom') || id.includes('react-router')) return 'router';
          if (id.includes('@mediapipe')) return 'mediapipe';
          if (id.includes('@tensorflow')) return 'tensorflow';
          if (id.includes('html5-qrcode') || id.includes('react-webcam')) return 'camera';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('three')) return 'three';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'export-pdf';
          if (id.includes('axios')) return 'http';
          if (id.includes('zustand')) return 'state';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
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

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: process.env.VITE_BASE_PATH || './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          // Keep app shell (entry, store, api, main, components, utils) in default chunk
          if (id.includes('/src/main.js') ||
              id.includes('/src/store.js') ||
              id.includes('/src/api.js') ||
              id.includes('/src/components/') ||
              id.includes('/src/utils/') ||
              id.includes('/src/integrations/') ||
              id.includes('/src/payments.js') ||
              id.includes('/src/reviews.js') ||
              id.includes('/src/tracking.js') ||
              id.includes('/src/router.js')) return; // entry chunk
          if (id.includes('/screens/AquaOSScreen')) return 'app-aquaos';
          if (id.includes('/screens/IntelligenceScreen')) return 'app-intelligence';
          if (id.includes('/screens/AgriGalaxyScreen')) return 'app-agrigalaxy';
          if (id.includes('/screens/AgriFlowScreen')) return 'app-agriflow';
          if (id.includes('/screens/FarmerConnectScreen')) return 'app-farmerconnect';
          if (id.includes('/screens/KisanConnectScreen')) return 'app-kisanconnect';
          if (id.includes('/screens/BhoomiOSScreen')) return 'app-bhoomios';
          if (id.includes('/screens/FarmDiaryScreen') ||
              id.includes('/screens/SchemesScreen') ||
              id.includes('/screens/JobsScreen') ||
              id.includes('/screens/TrainingScreen')) return 'features-extra';
          if (id.includes('/screens/WeatherScreen') ||
              id.includes('/screens/CommunityScreen') ||
              id.includes('/screens/ChatScreen')) return 'features-social';
          if (id.includes('/i18n.js')) return 'i18n';
        },
      },
    },
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

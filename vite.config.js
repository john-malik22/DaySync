import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',

      manifest: {
        id: '/',
        name: 'DaySync',
        short_name: 'DaySync',
        description: 'DaySync personal productivity assistant',

        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',

        background_color: '#F6F8FB',
        theme_color: '#2F6F73',

        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        // Precache todos os assets estáticos gerados pelo Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webp}'],
        // SPA fallback: qualquer rota desconhecida serve o index.html em cache
        navigateFallback: 'index.html',
        // Excluir chamadas à API do fallback para não quebrar pedidos de rede
        navigateFallbackDenylist: [/^\/api\//, /supabase\.co/],
        runtimeCaching: [
          {
            // Supabase API — NetworkFirst: tenta rede, cai para cache em offline
            urlPattern: /^https:\/\/[^/]*supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 h
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Assets estáticos — StaleWhileRevalidate: resposta rápida do cache,
            // atualiza em background quando online
            urlPattern: /\.(?:js|css|woff2?|png|svg|ico|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
        ],
      },
      manifest: {
        name: 'StockFlow',
        short_name: 'StockFlow',
        description: 'Gestão de Stock Inteligente',
        theme_color: '#1a1d27',
        background_color: '#12141c',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})

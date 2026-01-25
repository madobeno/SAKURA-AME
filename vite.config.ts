
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // GitHub Pagesのサブディレクトリ名に合わせてベースパスを設定
  base: "/SAKURA-AME/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png','bg-start.webp','bg-night.webp','bg-capital.webp','bg-tsumugi.webp'],
      manifest: {
        name: '桜雨 - SakuraAme',
        short_name: '桜雨',
        description: 'Zen healing experience inspired by a Japanese garden',
        theme_color: '#4a0417',
        background_color: '#1c1917',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
  // 1. 静的アセット（JS, CSS, ローカル画像）のキャッシュ
  maximumFileSizeToCacheInBytes: 3000000,
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
  
  // 2. 外部キャッシュ設定（Unsplash用）はもう不要なので削除
  // 代わりに、もし Google Fonts などを使っているならそれだけ残します
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
}
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // パフォーマンス向上のためチャンク分割を最適化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  }
});

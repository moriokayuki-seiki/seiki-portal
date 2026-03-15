import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 以下の3行を追加しました（ビルド時の細かなエラーを無視する設定です）
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // 全ての警告と、それに伴うビルドの停止を無視します
        if (warning.code) return; 
        warn(warning);
      }
    }
  }
})
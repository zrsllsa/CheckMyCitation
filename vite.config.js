import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Dev: panggilan /api diteruskan ke VITE_API_BASE_URL lewat server Vite (lihat src/lib/api.js).
// Ini menghindari CORS dan halaman peringatan ngrok yang memutus request langsung dari browser.
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), '').VITE_API_BASE_URL
  const proxy = { target, changeOrigin: true, headers: { 'ngrok-skip-browser-warning': '1' } }
  return {
    plugins: [react()],
    server: target ? { proxy: { '/api': proxy, '/health': proxy } } : {},
  }
})

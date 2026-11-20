import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: fileURLToPath(new URL('./index.html', import.meta.url)),
        productos: fileURLToPath(new URL('./productos.html', import.meta.url)),
        acceso: fileURLToPath(new URL('./MiTiendita/login.html', import.meta.url))
      }
    }
  }
})

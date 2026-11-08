import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        productos: resolve(__dirname, 'productos.html'),
        inventario: resolve(__dirname, 'inventario.html'),
        compras: resolve(__dirname, 'compras.html'),
        ventas: resolve(__dirname, 'ventas.html'),
        proveedores: resolve(__dirname, 'proveedores.html'),
        reportes: resolve(__dirname, 'reportes.html')
      }
    }
  }
});

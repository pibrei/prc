import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/prc/', // Substitua pelo nome real do seu repositório
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})

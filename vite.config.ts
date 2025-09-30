// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importado

export default defineConfig({
  plugins: [react(), tailwindcss()], // Adicionado aqui
})
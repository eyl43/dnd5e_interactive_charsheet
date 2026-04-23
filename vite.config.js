import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/dnd5e_interactive_charsheet/',
  plugins: [react()],
})

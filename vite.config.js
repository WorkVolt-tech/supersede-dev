import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Vite's own JS/CSS go in /bundle, leaving /assets free for the game's
  // art (public/assets/armor, boss, enemy, ...) with the exact paths the
  // chapter data already uses.
  build: { assetsDir: 'bundle' },
})

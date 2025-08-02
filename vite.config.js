import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.', // tells Vite the root is the current directory
  build: {
    outDir: 'dist',
  }
})

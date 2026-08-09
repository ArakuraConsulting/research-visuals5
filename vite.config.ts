import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// base is the repo name so assets resolve when the app is served from GitHub
// Pages at https://<owner>.github.io/research-visuals5/. Locally, `npm run dev`
// simply serves at http://localhost:5173/research-visuals5/ (Vite prints the
// full URL to click).
export default defineConfig({
  base: '/research-visuals5/',
  plugins: [react()],
})

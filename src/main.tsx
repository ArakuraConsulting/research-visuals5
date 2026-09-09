import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker for offline support (production builds only),
// and keep it fresh so new deploys actually show up. iOS home-screen apps are
// sticky about caching, so we check for an update on load and every time the
// app is reopened, and reload once when a new version takes control.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL

  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        reg.update().catch(() => {})
        // Re-check for a new version whenever the app is brought back to the
        // foreground — the usual moment a PWA is reopened after a deploy.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {})
        })
      })
      .catch(() => {
        // Offline support is a progressive enhancement — ignore failures.
      })
  })
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/premium-polish.css'
import './styles/mobile-app-polish.css'
import './styles/task-1000-design-mobile.css'
import './styles/settings-mobile-app.css'
import './styles/mobile-product-ux.css'
import './styles/mobile-animations.css'      // ✨ Professional animations
import './styles/mobile-gradients.css'       // ✨ Modern gradients

// Register service worker for PWA support
import { registerServiceWorker } from './utils/registerServiceWorker'

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker().then((registered) => {
    if (registered) {
      console.log('✅ PWA enabled - App works offline!')
    }
  })
}

// Task 10000: Remove splash when app mounts (app-like loading)
const splash = document.getElementById('app-splash')
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
if (splash) {
  const hide = () => {
    splash.classList.add('hidden')
    setTimeout(() => splash.remove(), 250)
  }
  requestAnimationFrame(() => requestAnimationFrame(hide))
}
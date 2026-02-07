import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'  // index.css imports design-system, responsive-*, mobile-redesign, etc. via @import

// Register service worker for PWA support
import { registerServiceWorker } from './utils/registerServiceWorker'

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker().then((registered) => {
    void registered;
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
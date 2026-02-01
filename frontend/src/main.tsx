import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/premium-polish.css'
import './styles/mobile-app-polish.css'

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
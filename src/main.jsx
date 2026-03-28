import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function Root() {
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false

    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const registerSW = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          const sw = reg.active || reg.waiting || reg.installing
          if (sw && !sw.scriptURL.includes('/Ukpolls2/sw.js')) {
            await reg.unregister()
          }
        }

        const keys = await caches.keys()
        for (const key of keys) {
          if (key.startsWith('politiscope-') && !key.includes('v19')) {
            await caches.delete(key)
          }
        }

        const registration = await navigator.serviceWorker.register('/Ukpolls2/sw.js')

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              registration.waiting
            ) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch (err) {
        console.error('Service worker registration failed:', err)
      }
    }

    registerSW()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const s = document.getElementById('splash')
      if (s) {
        s.style.opacity = '0'
        setTimeout(() => s.remove(), 500)
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
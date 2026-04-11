import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function Root() {
  React.useEffect(() => {
    const isDev = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV

    if (!('serviceWorker' in navigator)) return undefined

    let refreshing = false
    const swUrl = '/sw.js'

    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    const unregisterAllServiceWorkers = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)))
      } catch (err) {
        console.warn('Failed to unregister service workers:', err)
      }
    }

    const clearPolitiscopeCaches = async () => {
      if (!('caches' in window)) return
      try {
        const keys = await caches.keys()
        await Promise.all(
          keys
            .filter((key) => key.startsWith('politiscope-'))
            .map((key) => caches.delete(key).catch(() => false)),
        )
      } catch (err) {
        console.warn('Failed to clear caches:', err)
      }
    }

    if (isDev) {
      unregisterAllServiceWorkers()
      clearPolitiscopeCaches()
      return undefined
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const registerSW = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          const sw = reg.active || reg.waiting || reg.installing
          if (sw && !sw.scriptURL.includes(swUrl)) {
            await reg.unregister()
          }
        }

        await clearPolitiscopeCaches()

        const registration = await navigator.serviceWorker.register(swUrl)

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
  </React.StrictMode>,
)

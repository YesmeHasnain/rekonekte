import { useEffect, useState } from 'react'

// Captured when the browser decides the app is installable.
let deferredPrompt = null

export function initPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    window.dispatchEvent(new Event('pwa-installable'))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event('pwa-installed'))
  })
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream

/**
 * Drives the "Install app" button. `can` is true when we can show a prompt
 * (Android/desktop Chrome) or when iOS needs the manual "Add to Home Screen"
 * hint. `install()` triggers the native prompt and returns true if accepted.
 */
export function useInstall() {
  const [can, setCan] = useState(!!deferredPrompt)
  const [installed, setInstalled] = useState(isStandalone())
  const ios = isIos() && !isStandalone()

  useEffect(() => {
    const onReady = () => setCan(true)
    const onDone = () => { setInstalled(true); setCan(false) }
    window.addEventListener('pwa-installable', onReady)
    window.addEventListener('pwa-installed', onDone)
    return () => { window.removeEventListener('pwa-installable', onReady); window.removeEventListener('pwa-installed', onDone) }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    setCan(false)
    return outcome === 'accepted'
  }

  return { can: can || ios, ios, installed, install }
}

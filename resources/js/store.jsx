import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const Store = createContext(null)

const DEFAULT_ME = { id: null, name: 'You', city: 'Add your city', age: null, photo: '/img/avatar.svg', verified: false, bio: '', interests: [], langs: [], job: '', lookingFor: 'Something serious' }

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState('light') // Classic theme is light-only
  const [me, setMe] = useState(DEFAULT_ME)
  const [toasts, setToasts] = useState([])
  const [safety, setSafety] = useState(null) // { mode:'block'|'report', member:{id,name,photo,city}, context?, after? }
  const [paletteOpen, setPaletteOpen] = useState(false)
  // The real signed-in account (Laravel session). null = signed out, undefined = still checking.
  const [account, setAccount] = useState(undefined)

  const refreshMe = useCallback(async () => {
    try { const r = await api('/profile'); if (r?.me) setMe({ ...DEFAULT_ME, ...r.me, photo: r.me.photo || '/img/avatar.svg' }) } catch {}
  }, [])

  useEffect(() => { api('/me').then((r) => setAccount(r?.user ?? null)).catch(() => setAccount(null)) }, [])
  useEffect(() => { if (account) refreshMe() }, [account, refreshMe])

  const logout = async () => { try { await api('/logout', { method: 'POST' }) } catch {} setAccount(null); setMe(DEFAULT_ME) }

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toast = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const value = { theme, setTheme, me, setMe, refreshMe, toasts, toast, safety, setSafety, paletteOpen, setPaletteOpen, account, setAccount, logout }
  return <Store.Provider value={value}>{children}</Store.Provider>
}
export const useStore = () => useContext(Store)

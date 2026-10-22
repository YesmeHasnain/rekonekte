import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ME, THREADS, POSTS, EVENTS, ADMIN_USERS, REPORTS, PENDING_POSTS } from './data.js'

const Store = createContext(null)

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState('light') // Classic theme is light-only
  const [me, setMe] = useState(ME)
  const [threads, setThreads] = useState(THREADS)
  const [posts, setPosts] = useState(POSTS)
  const [going, setGoing] = useState(['e1'])
  const [liked, setLiked] = useState([])
  const [passed, setPassed] = useState([])
  const [blocked, setBlocked] = useState([])
  const [users, setUsers] = useState(ADMIN_USERS)
  const [reports, setReports] = useState(REPORTS)
  const [queue, setQueue] = useState(PENDING_POSTS)
  const [toasts, setToasts] = useState([])
  const [safety, setSafety] = useState(null) // { mode: 'block'|'report', id, context }
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toast = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const send = (threadId, text) => setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, unread: 0, messages: [...t.messages, { from: 'me', text, at: 'Now' }] } : t))
  const receive = (threadId, from, text) => setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, messages: [...t.messages, { from, text, at: 'Now' }] } : t))
  const openThread = (memberId) => {
    let t = threads.find((x) => x.with === memberId)
    if (t) return t.id
    const id = 't' + Date.now()
    setThreads((ts) => [{ id, with: memberId, unread: 0, messages: [] }, ...ts])
    return id
  }
  const markRead = (threadId) => setThreads((ts) => ts.map((t) => t.id === threadId ? { ...t, unread: 0 } : t))
  const addPost = (p) => setPosts((ps) => [{ id: 'p' + Date.now(), author: 'me', time: 'Just now', likes: 0, comments: 0, status: 'approved', ...p }, ...ps])
  const toggleGoing = (id) => setGoing((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id])
  const like = (id) => setLiked((l) => l.includes(id) ? l : [...l, id])
  const pass = (id) => setPassed((l) => l.includes(id) ? l : [...l, id])
  const block = (id) => setBlocked((b) => b.includes(id) ? b : [...b, id])
  const unblock = (id) => setBlocked((b) => b.filter((x) => x !== id))
  const fileReport = (r) => setReports((rs) => [{ id: 'r' + Date.now(), by: 'me', time: 'Just now', status: 'open', severity: 'medium', ...r }, ...rs])

  const value = { theme, setTheme, me, setMe, threads, send, receive, openThread, markRead, posts, setPosts, addPost, going, toggleGoing, liked, like, passed, pass, setPassed, setLiked,
    blocked, block, unblock, users, setUsers, reports, setReports, fileReport, queue, setQueue, toasts, toast, safety, setSafety, paletteOpen, setPaletteOpen }
  return <Store.Provider value={value}>{children}</Store.Provider>
}
export const useStore = () => useContext(Store)

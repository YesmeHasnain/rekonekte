import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon, InstallButton, LangSwitch, Logo } from '../components/ui.jsx'
import { useApi } from '../useApi.js'

function Palette() {
  const { paletteOpen, setPaletteOpen } = useStore()
  const { t } = useI18n()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef(null)
  const { data } = useApi('/members', { skip: !paletteOpen })
  const members = data?.data ?? []
  useEffect(() => { if (paletteOpen) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 10) } }, [paletteOpen])
  const items = useMemo(() => {
    const s = q.trim().toLowerCase()
    const pages = [['Home', '/app/home', 'home'], ['Discover', '/app/discover', 'compass'], ['Discover More', '/app/more', 'grid'], ['Messages', '/app/messages', 'chat'], ['Community board', '/app/community', 'users'], ['Events', '/app/events', 'calendar'], ['My profile', '/app/profile', 'user'], ['Edit profile', '/app/profile/edit', 'camera'], ['Settings', '/app/settings', 'settings']]
      .map(([l, to, ic]) => ({ group: 'Go to', label: l, to, icon: ic }))
    const mem = members.map((m) => ({ group: 'Members', label: `${m.name}, ${m.age}`, sub: `${m.city}${m.job ? ' · ' + m.job : ''}`, to: '/app/members/' + m.id, photo: m.photo, hay: `${m.name} ${m.city} ${m.job} ${(m.interests || []).join(' ')}` }))
    const all = [...pages, ...mem]
    if (!s) return [...pages.slice(0, 5), ...mem.slice(0, 4)]
    return all.filter((x) => (x.label + ' ' + (x.hay || '')).toLowerCase().includes(s)).slice(0, 12)
  }, [q, members])
  if (!paletteOpen) return null
  const go = (it) => { setPaletteOpen(false); nav(it.to) }
  let lastGroup = ''
  return (
    <div className="modal-bg pal-bg" onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}>
      <div className="palette" role="dialog" aria-label="Search">
        <div className="pal-in"><Icon name="search" /><input ref={input} value={q} placeholder={t('app.search')} onChange={(e) => { setQ(e.target.value); setSel(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
            if (e.key === 'Enter' && items[sel]) go(items[sel])
            if (e.key === 'Escape') setPaletteOpen(false)
          }} /><kbd>esc</kbd></div>
        <div className="pal-list">
          {items.length === 0 && <p className="pal-empty">No results for “{q}”. Try a name or a city.</p>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? (lastGroup = it.group) : null
            return (
              <div key={it.group + it.label}>
                {head && <div className="pal-g">{head}</div>}
                <button className={'pal-i' + (i === sel ? ' on' : '')} onMouseEnter={() => setSel(i)} onClick={() => go(it)}>
                  {it.photo ? <Avatar src={it.photo} size={28} /> : <span className="pal-ic"><Icon name={it.icon} size={15} /></span>}
                  <span className="pal-t"><b>{it.label}</b>{it.sub && <span>{it.sub}</span>}</span>
                  <Icon name="arrow" size={14} className="pal-go" />
                </button>
              </div>
            )
          })}
        </div>
        <div className="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> toggle</span></div>
      </div>
    </div>
  )
}

function Notifications({ data }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef(null)
  const items = data?.notifications ?? []
  const unread = data?.unread ?? 0
  useEffect(() => { const f = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false); document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f) }, [])
  return (
    <div className="notif" ref={ref}>
      <button className="icon-btn" onClick={() => { setOpen(!open); setSeen(true) }} aria-label="Notifications"><Icon name="bell" />{!seen && unread > 0 && <em className="badge-dot">{unread}</em>}</button>
      {open && (
        <div className="dropdown notif-dd">
          <div className="dd-h"><b>Notifications</b><button className="link-btn" onClick={() => setOpen(false)}>Close</button></div>
          {items.length === 0 && <p className="muted small pad">Nothing new yet. Like a few profiles to get started.</p>}
          {items.map((n) => (
            <Link key={n.id} to={n.to} className="notif-i" onClick={() => setOpen(false)}>
              <Avatar src={n.photo} size={36} />
              <span><b>{n.who}</b> {n.action}<small>{n.time} ago</small></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { t } = useI18n()
  const { setPaletteOpen, me, account, logout } = useStore()
  const [drawer, setDrawer] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const { data: notifs } = useApi('/notifications')
  const unread = notifs?.unread ?? 0
  useEffect(() => setDrawer(false), [loc.pathname])
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [setPaletteOpen])
  const items = [['home', 'home', 'Home'], ['discover', 'search', t('side.discover')], ['community', 'users', t('side.community')], ['events', 'calendar', t('side.events')], ['messages', 'chat', t('side.messages'), unread], ['more', 'grid', 'Discover More'], ['profile', 'user', t('side.profile')], ['settings', 'settings', t('side.settings')]]
  const tabs = items.filter(([to]) => ['home', 'discover', 'community', 'events', 'profile'].includes(to))
  const links = items.filter(([to]) => ['home', 'discover', 'community', 'events', 'messages', 'more'].includes(to))
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  return (
    <div className={'app' + (drawer ? ' drawer' : '')}>
      <aside className="side">
        <div className="side-top"><Logo to="/app/home" /><button className="icon-btn side-x" onClick={() => setDrawer(false)} aria-label="Close menu"><Icon name="x" /></button></div>
        <button className="side-search" onClick={() => setPaletteOpen(true)}><Icon name="search" size={16} /> Search <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd></button>
        <nav className="side-nav">
          {items.map(([to, ic, l, n]) => <NavLink key={to} to={'/app/' + to} className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={ic} size={19} /> <span>{l}</span>{n ? <em>{n}</em> : null}</NavLink>)}
          {['admin', 'moderator'].includes(account?.role) && (<>
            <div className="side-sep">Team</div>
            <NavLink to="/app/admin" className={({ isActive }) => (isActive ? 'on' : '')}><Icon name="shield" size={19} /> <span>{t('side.admin')}</span></NavLink>
          </>)}
        </nav>
        <InstallButton />
        <div className="side-promo">
          <span className="soon"><i /> Coming soon</span>
          <b>Lakou Live</b>
          <p>Live music & talks with the kominote. Next phase.</p>
        </div>
        <div className="side-me">
          <Avatar src={me.photo} size={38} online />
          <div><b>{me.name}</b><span>{me.city}{account?.email_verified === false ? ' · Email not verified' : ' · Verified'}</span></div>
          <button className="icon-btn" onClick={async () => { await logout(); nav('/login') }} aria-label={t('btn.logout')} title={t('btn.logout')}><Icon name="logout" size={17} /></button>
        </div>
      </aside>
      <div className="side-scrim" onClick={() => setDrawer(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger-app" onClick={() => setDrawer(true)} aria-label="Menu"><Icon name="menu" /></button>
          <Logo to="/app/home" />
          <nav className="mk-appnav" aria-label="Main">
            {links.map(([to, , l, n]) => <NavLink key={to} to={'/app/' + to} className={({ isActive }) => (isActive ? 'on' : '')}>{l}{n ? <em>{n}</em> : null}</NavLink>)}
            {['admin', 'moderator'].includes(account?.role) && <NavLink to="/app/admin" className={({ isActive }) => (isActive ? 'on' : '')}>{t('side.admin')}</NavLink>}
          </nav>
          <div className="top-r">
            <button className="icon-btn desk-only" onClick={() => setPaletteOpen(true)} aria-label="Search"><Icon name="search" /></button>
            <span className="desk-only"><LangSwitch compact /></span>
            <Link to="/app/messages" className="icon-btn mob-only" aria-label={t('side.messages')}><Icon name="chat" />{unread > 0 && <em className="badge-dot">{unread}</em>}</Link>
            <Notifications data={notifs} />
            <Link to="/app/settings" className="icon-btn desk-only" aria-label="Settings"><Icon name="settings" /></Link>
            <Link to="/app/profile" className="top-me"><Avatar src={me.photo} size={34} /></Link>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      <nav className="tabbar">
        {tabs.map(([to, ic, l]) => <NavLink key={to} to={'/app/' + to} className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={ic} size={20} /><span>{l}</span></NavLink>)}
      </nav>
      <Palette />
    </div>
  )
}

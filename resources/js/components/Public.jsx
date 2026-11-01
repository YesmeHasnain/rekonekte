import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTr } from '../i18n.jsx'
import { Icon, LangSwitch, Logo } from './ui.jsx'

const NAV = [['/', 'Home'], ['/app/home', 'Dating'], ['/app/community', 'Community'], ['/app/events', 'Events'], ['/app/discover', 'Discover']]

export function PublicNav() {
  const tr = useTr()
  const [open, setOpen] = useState(false)
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  return (
    <header className={'mk-nav nav' + (open ? ' open' : '')}>
      <div className="mk-nav-in">
        <Logo />
        <nav className="mk-nav-links" aria-label="Main">
          {NAV.map(([h, l]) => <Link key={h} to={h}>{tr(l)}</Link>)}
        </nav>
        <div className="mk-nav-r">
          <Link to="/app/discover" className="ic-s hide-s" aria-label="Search"><Icon name="search" size={20} /></Link>
          <Link to="/login" className="mk-btn line hide-s">{tr('Log In')}</Link>
          <Link to="/register" className="mk-btn fill">{tr('Join Free')}</Link>
          <button className="icon-btn mk-burger burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}><Icon name={open ? 'x' : 'menu'} size={22} /></button>
        </div>
      </div>
      <div className="nav-drawer">
        {NAV.map(([h, l]) => <Link key={h} to={h} onClick={() => setOpen(false)}>{tr(l)} <Icon name="arrow" size={16} /></Link>)}
        <LangSwitch />
        <div className="nav-drawer-cta">
          <Link to="/login" className="btn outline lg">{tr('Log In')}</Link>
          <Link to="/register" className="btn primary lg">{tr('Join Free')}</Link>
        </div>
      </div>
    </header>
  )
}

const SOCIAL = {
  facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z',
  instagram: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.3-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z',
  x: 'M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z',
  tiktok: 'M16.6 3c.4 2.3 1.8 3.9 4.4 4.1v3.2c-1.6.1-3-.4-4.4-1.2v6.2c0 3.9-3 6.7-6.6 6.7a6.4 6.4 0 0 1-6.5-6.4c0-4 3.5-7 7.6-6.4v3.4c-1.9-.4-4.1.7-4.1 3 0 1.7 1.3 3 3 3 1.9 0 3.1-1.3 3.1-3.4V3h3.5Z',
  youtube: 'M22.5 7.2a3 3 0 0 0-2.1-2.1C18.5 4.6 12 4.6 12 4.6s-6.5 0-8.4.5a3 3 0 0 0-2.1 2.1C1 9.1 1 12 1 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.4.5 8.4.5s6.5 0 8.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM9.8 15.3V8.7L15.5 12l-5.7 3.3Z',
}
export function SocialIcon({ name, size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOCIAL[name]} /></svg>
}

export function Footer() {
  const tr = useTr()
  return (
    <footer className="mk-foot">
      <div className="mk-foot-in">
        <div>
          <Logo light />
          <div className="mk-foot-soc">{['instagram', 'facebook', 'x', 'tiktok', 'youtube'].map((s) => <a key={s} href="#" aria-label={s} onClick={(e) => e.preventDefault()}><SocialIcon name={s} size={18} /></a>)}</div>
        </div>
        <nav className="mk-foot-links" aria-label="Footer">
          <a href="mailto:hello@rekonekte.com">{tr('About Us')}</a>
          <a href="mailto:hello@rekonekte.com">{tr('Contact')}</a>
          <Link to="/privacy">{tr('Privacy Policy')}</Link>
          <Link to="/terms">{tr('Terms of Service')}</Link>
          <a href="mailto:help@rekonekte.com">{tr('Help & Support')}</a>
        </nav>
      </div>
      <div className="mk-foot-b">
        <span>© 2026 Rekonekte. {tr('All rights reserved.')}</span>
        <LangSwitch compact />
      </div>
    </footer>
  )
}

export function PublicShell({ children }) {
  return (<div className="public"><PublicNav />{children}<Footer /></div>)
}

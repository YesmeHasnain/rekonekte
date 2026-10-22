import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n, useTr, LANGS } from '../i18n.jsx'
import { Icon, LangSwitch, Logo } from './ui.jsx'

const NAV = [['/', 'Home'], ['/#dating', 'Dating'], ['/#community', 'Community'], ['/#live', 'Live Shows'], ['/#pricing', 'Pricing']]

function LangMenu() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [open])
  const cur = LANGS.find((l) => l.id === lang) || LANGS[0]
  return (
    <div className="lmenu" ref={ref}>
      <button className="lmenu-btn" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
        <Icon name="globe" size={17} /> {cur.label} <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div className="dropdown menu lmenu-dd" role="listbox">
          {LANGS.map((l) => (
            <button key={l.id} role="option" aria-selected={l.id === lang} onClick={() => { setLang(l.id); setOpen(false) }}>
              <span className="lmenu-code">{l.label}</span> {l.name} {l.id === lang && <Icon name="check" size={15} className="lmenu-ok" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PublicNav() {
  const tr = useTr()
  const { pathname, hash } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  const isOn = (h) => (h === '/' ? pathname === '/' && !hash : h === '/' + hash)
  return (
    <header className={'nav' + (scrolled ? ' scrolled' : '') + (open ? ' open' : '')}>
      <div className="wrap nav-in">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {NAV.map(([h, l]) => <Link key={h} to={h} className={isOn(h) ? 'on' : ''}>{tr(l)}</Link>)}
        </nav>
        <div className="nav-r">
          <LangMenu />
          <Link to="/login" className="btn outline sm hide-m">{tr('Login')}</Link>
          <Link to="/register" className="btn primary sm hide-m">{tr('Get Started')}</Link>
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}><Icon name={open ? 'x' : 'menu'} size={22} /></button>
        </div>
      </div>
      <div className="nav-drawer">
        {NAV.map(([h, l]) => <Link key={h} to={h} onClick={() => setOpen(false)}>{tr(l)} <Icon name="arrow" size={16} /></Link>)}
        <LangSwitch />
        <div className="nav-drawer-cta">
          <Link to="/login" className="btn outline lg">{tr('Login')}</Link>
          <Link to="/register" className="btn primary lg">{tr('Get Started')}</Link>
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

export function Newsletter() {
  const tr = useTr()
  const [done, setDone] = useState(false)
  return done ? (
    <p className="news-ok"><Icon name="check" size={16} /> {tr('Mèsi! We’ll keep you posted.')}</p>
  ) : (
    <form className="news" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
      <label htmlFor="news-email">{tr('Get Rekonekte news')}</label>
      <div className="news-row">
        <input id="news-email" type="email" required placeholder={tr('Your email address')} />
        <button className="btn primary">{tr('Join')}</button>
      </div>
    </form>
  )
}

export function Footer() {
  const tr = useTr()
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <Logo light />
          <p className="sig sig-foot">Lanmou · Kominote · Lakay</p>
          <p className="foot-about">{tr('The dating and community home made by and for the Haitian diaspora — from Port-au-Prince to Paris.')}</p>
        </div>
        <div className="foot-col"><h5>{tr('Quick Links')}</h5><Link to="/">{tr('Home')}</Link><Link to="/#dating">{tr('Dating')}</Link><Link to="/#community">{tr('Community')}</Link><Link to="/#live">{tr('Live Shows')}</Link><Link to="/#pricing">{tr('Pricing')}</Link></div>
        <div className="foot-col"><h5>{tr('Support')}</h5><a href="mailto:help@rekonekte.com">{tr('Help Center')}</a><Link to="/app/settings">{tr('Safety')}</Link><Link to="/terms">{tr('Terms & Conditions')}</Link><Link to="/privacy">{tr('Privacy Policy')}</Link><a href="mailto:hello@rekonekte.com">{tr('Contact Us')}</a></div>
        <div className="foot-col foot-connect">
          <h5>{tr('Connect With Us')}</h5>
          <div className="socials">{['facebook', 'instagram', 'x', 'tiktok', 'youtube'].map((s) => <a key={s} href="#" aria-label={s} onClick={(e) => e.preventDefault()}><SocialIcon name={s} /></a>)}</div>
          <Newsletter />
        </div>
      </div>
      <div className="wrap foot-b">
        <span>© 2026 Rekonekte.com. {tr('All rights reserved.')}</span>
        <span className="foot-made">{tr('Made with')} <Icon name="heart" size={13} fill="currentColor" stroke={0} className="foot-heart" /> {tr('for the Haitian diaspora')}</span>
        <LangSwitch compact />
      </div>
    </footer>
  )
}

export function PublicShell({ children }) {
  return (<div className="public"><PublicNav />{children}<Footer /></div>)
}

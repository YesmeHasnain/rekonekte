import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, LANGS } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { api } from '../api.js'
import { useInstall } from '../pwa.js'

const REPORT_REASONS = ['Fake profile / scam', 'Inappropriate messages', 'Harassment or bullying', 'Underage concern', 'Spam or promotion', 'Hate speech', 'Something else']

/** A usable image URL: API paths start with "/", bare demo names get /img/, blank falls back. */
export const photoUrl = (p) => (!p ? '/img/avatar.svg' : p.startsWith('blob:') || p.startsWith('data:') || p.startsWith('/') ? p : '/img/' + p)

const P = {
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5-5 2 2-5 5-2Z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 9v-1a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.4a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  x: 'M18 6 6 18M6 6l12 12',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  check: 'M20 6 9 17l-5-5',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  flag: 'M4 22V4m0 0s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1',
  ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM4.9 4.9l14.2 14.2',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  plus: 'M12 5v14M5 12h14',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-16v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  back: 'M19 12H5M11 19l-7-7 7-7',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  sparkle: 'M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3Z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  verified: 'M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2L12 2Zm-3.5 10 2.3 2.3 4.7-4.6',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  trash: 'M3 6h18M8 6V4h8v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  live: 'M2 8.8a15 15 0 0 1 0 6.4M22 8.8a15 15 0 0 1 0 6.4M6 10.4a7 7 0 0 0 0 3.2M18 10.4a7 7 0 0 1 0 3.2M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z',
  star: 'M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8Z',
  briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
  chevron: 'm6 9 6 6 6-6',
  cmd: 'M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 0 0 0-6Z',
}

export function Icon({ name, size = 18, fill = 'none', stroke = 2, className = '', style }) {
  return (
    <svg className={'ic ' + className} style={style} width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

export function Logo({ to = '/', small, light }) {
  return (
    <Link to={to} className={'logo' + (small ? ' logo-sm' : '')} aria-label="Rekonekte home">
      <img src={light ? '/img/logo-h-light.png' : '/img/logo-h.png'} alt="Rekonekte" width="162" height="40" />
    </Link>
  )
}

export function LangSwitch({ compact }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={'lang' + (compact ? ' lang-c' : '')} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)} title={l.name}>{l.label}</button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useStore()
  return (
    <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode" title="Toggle dark mode">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  const [instant, setInstant] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setShown(true); return }
    // Already on screen when the page mounts (e.g. a very tall window): show it without waiting.
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0 && window.innerHeight > 1400) { setInstant(true); setShown(true); return }
    let done = false
    const show = () => { if (done) return; done = true; setShown(true); cleanup() }
    // Fire a little before the element enters the viewport so content is never caught hidden.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) show() }, { threshold: 0, rootMargin: '0px 0px 20% 0px' })
    io.observe(el)
    // Belt and braces: a scroll check (in case IO fires late) and a hard timeout so nothing stays hidden.
    const onScroll = () => { const b = el.getBoundingClientRect(); if (b.top < window.innerHeight * 1.2 && b.bottom > -200) show() }
    window.addEventListener('scroll', onScroll, { passive: true })
    const t = setTimeout(show, 2500)
    function cleanup() { io.disconnect(); window.removeEventListener('scroll', onScroll); clearTimeout(t) }
    return cleanup
  }, [])
  return <Tag ref={ref} className={'reveal ' + (shown ? 'in ' : '') + (instant ? 'instant ' : '') + className} style={{ transitionDelay: instant ? '0ms' : delay + 'ms' }} {...rest}>{children}</Tag>
}

export function CountUp({ to, suffix = '', duration = 1600, decimals = 0 }) {
  const ref = useRef(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    let timer, started = false
    const run = () => {
      if (started) return; started = true
      const t0 = Date.now()
      // setTimeout (not rAF) so the counter also finishes in background tabs / headless captures
      const tick = () => { const p = Math.min(1, (Date.now() - t0) / duration); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) timer = setTimeout(tick, 16) }
      tick()
    }
    if (!('IntersectionObserver' in window)) { setV(to); return }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && run(), { threshold: 0 })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [to, duration])
  return <span ref={ref}>{v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  )
}

/** Global block / report modal, driven by store.safety ({ mode, member, context?, after? }) */
export function SafetyModal() {
  const { safety, setSafety, toast } = useStore()
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(true)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setReason(''); setDetail(''); setStep(1); setAlsoBlock(true); setBusy(false) }, [safety])
  if (!safety) return null
  const m = safety.member || { id: safety.id, name: 'this member', photo: null, city: '' }
  const close = () => setSafety(null)
  const doBlock = async () => {
    setBusy(true)
    try { await api('/members/' + m.id + '/block', { method: 'POST' }); toast(`${m.name} has been blocked`); close(); safety.after?.() }
    catch (e) { toast(e.message, 'err'); setBusy(false) }
  }
  const submitReport = async () => {
    setBusy(true)
    try { await api('/members/' + m.id + '/report', { method: 'POST', body: { reason, details: detail, also_block: alsoBlock } }); setStep(3) }
    catch (e) { toast(e.message, 'err'); setBusy(false) }
  }
  if (safety.mode === 'block') {
    return (
      <Modal open onClose={close} title={`Block ${m.name}?`}>
        <div className="safety-who"><img src={photoUrl(m.photo)} alt="" /><div><b>{m.name}</b><span>{m.city}</span></div></div>
        <ul className="safety-list">
          <li><Icon name="check" size={16} /> They won't be able to see your profile or message you.</li>
          <li><Icon name="check" size={16} /> Your conversation will be hidden from your inbox.</li>
          <li><Icon name="check" size={16} /> They won't be notified. You can unblock anytime in Settings.</li>
        </ul>
        <div className="modal-f">
          <button className="btn ghost" onClick={close}>Cancel</button>
          <button className="btn danger" disabled={busy} onClick={doBlock}><Icon name="ban" size={16} /> Block {m.name}</button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal open onClose={close} title={step === 3 ? 'Report sent — mèsi' : `Report ${m.name}`}>
      {step === 1 && (<>
        <p className="muted small">{safety.context === 'message' ? 'Reporting a message. ' : ''}Your report is confidential — {m.name} will never know who reported them.</p>
        <div className="reason-list">
          {REPORT_REASONS.map((r) => (
            <label key={r} className={'reason' + (reason === r ? ' on' : '')}>
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> <span>{r}</span>
            </label>
          ))}
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={close}>Cancel</button><button className="btn primary" disabled={!reason} onClick={() => setStep(2)}>Continue <Icon name="arrow" size={16} /></button></div>
      </>)}
      {step === 2 && (<>
        <label className="field"><span>Tell us more (optional)</span><textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What happened? Screenshots can be added once moderation goes live." /></label>
        <label className="check"><input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} /> Also block {m.name}</label>
        <div className="confirm-box"><Icon name="flag" size={16} /> You're reporting <b>{m.name}</b> for <b>{reason}</b>.</div>
        <div className="modal-f"><button className="btn ghost" onClick={() => setStep(1)}>Back</button>
          <button className="btn danger" disabled={busy} onClick={submitReport}>Submit report</button></div>
      </>)}
      {step === 3 && (<>
        <div className="done-ill"><Icon name="shield" size={40} /></div>
        <p className="center">Our moderation team reviews every report within 24 hours. {alsoBlock ? `${m.name} has also been blocked.` : ''}</p>
        <div className="modal-f"><button className="btn primary wide" onClick={() => { close(); safety.after?.() }}>Done</button></div>
      </>)}
    </Modal>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return <div className="toasts">{toasts.map((t) => <div key={t.id} className={'toast ' + t.tone}><Icon name="check" size={16} /> {t.text}</div>)}</div>
}

/**
 * "Install app" — shows only when the browser says the app is installable
 * (Android / desktop Chrome) or on iOS Safari (which needs the manual hint).
 * `variant`: "pill" (compact, for the sidebar) or "row" (for Settings).
 */
export function InstallButton({ variant = 'pill' }) {
  const { can, ios, install } = useInstall()
  const [hint, setHint] = useState(false)
  if (!can) return null
  const click = async () => { if (ios) setHint(true); else await install() }
  return (
    <>
      {variant === 'row' ? (
        <div className="set-row"><div><b>Install Rekonekte</b><span>Add it to your home screen and open it like an app.</span></div><button className="btn primary sm" onClick={click}><Icon name="plus" size={15} /> Install</button></div>
      ) : (
        <button className="install-pill" onClick={click}><Icon name="plus" size={15} /> Install app</button>
      )}
      <Modal open={hint} onClose={() => setHint(false)} title="Add Rekonekte to your Home Screen">
        <ol className="ios-steps">
          <li>Tap the <b>Share</b> button in Safari <Icon name="send" size={14} /></li>
          <li>Scroll and tap <b>Add to Home Screen</b></li>
          <li>Tap <b>Add</b> — Rekonekte opens like an app ❤️</li>
        </ol>
        <div className="modal-f"><button className="btn primary wide" onClick={() => setHint(false)}>Got it</button></div>
      </Modal>
    </>
  )
}

export function Avatar({ src, size = 40, online, ring }) {
  return (
    <span className={'av' + (ring ? ' ring' : '')} style={{ width: size, height: size }}>
      <img src={photoUrl(src)} alt="" />
      {online && <i className="dot-on" />}
    </span>
  )
}

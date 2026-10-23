import { api } from '../api.js'
import { useStore } from '../store.jsx'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { Icon, LangSwitch, Logo } from '../components/ui.jsx'

function AuthShell({ children, side = 'couple-hero.jpg', quote }) {
  return (
    <div className="auth">
      <div className="auth-l">
        <div className="auth-top"><Logo /><div className="row-g"><LangSwitch compact /></div></div>
        <div className="auth-form">{children}</div>
        <div className="auth-bot"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><span>© 2026 Rekonekte</span></div>
      </div>
      <div className="auth-r">
        <img src={'/img/' + side} alt="" />
        <div className="auth-r-card">
          <div className="stack">{['p-nadia', 'p-jean', 'p-roselande', 'p-wilson'].map((p) => <img key={p} src={`/img/${p}.jpg`} alt="" />)}</div>
          <p>{quote || '“I came for a date and found a whole kominote.”'}</p>
          <span>Lanmou · Kominote · Lakay</span>
        </div>
      </div>
    </div>
  )
}

function Pw({ value, onChange, placeholder = '••••••••', autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw"><input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required minLength={8} />
      <button type="button" onClick={() => setShow(!show)} aria-label="Show password"><Icon name="eye" size={16} /></button></div>
  )
}

export function Login() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { setAccount } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = await api('/login', { method: 'POST', body: { email, password: pw, remember } })
      setAccount(r.user)
      const next = new URLSearchParams(window.location.search).get('next')
      nav(r.user.email_verified ? (next && next.startsWith('/app') ? next : '/app/discover') : '/verify?email=' + encodeURIComponent(r.user.email))
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <AuthShell>
      <h1>{t('auth.loginTitle')}</h1>
      <p className="muted">Log in to see who's new in your city.</p>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="field"><span>Password <Link to="/reset" className="link-s">Forgot password?</Link></span><Pw value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
        <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me logged in</label>
        {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
        <button className="btn primary wide lg" disabled={busy}>{busy ? 'Logging in…' : t('nav.login')}</button>
      </form>
      <p className="muted center">New here? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function ageFrom(y, m, d) {
  if (!y || m === '' || !d) return null
  const dob = new Date(+y, +m, +d), now = new Date()
  let a = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) a--
  return a
}

export function Register() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [f, setF] = useState({ name: '', email: sp.get('email') || '', pw: '', gender: '', seeking: '', d: '', m: '', y: '' })
  const [adult, setAdult] = useState(false)
  const [terms, setTerms] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const { setAccount } = useStore()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const age = ageFrom(f.y, f.m, f.d)
  const under = age !== null && age < 18
  const strength = [f.pw.length >= 8, /[A-Z]/.test(f.pw), /[0-9]/.test(f.pw), /[^A-Za-z0-9]/.test(f.pw)].filter(Boolean).length
  const years = Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - 10 - i)
  const ok = f.name && f.email && f.pw.length >= 8 && f.gender && age !== null && !under && adult && terms
  return (
    <AuthShell side="dinner.jpg" quote="“Finally a place where my Kreyòl isn't a ‘fun fact’ — it's home.”">
      <div className="steps-mini"><span className="on">1 Account</span><i /><span>2 Verify email</span><i /><span>3 Profile</span></div>
      <h1>{t('auth.registerTitle')}</h1>
      <p className="muted">Free forever for the basics. 18+ only.</p>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault(); setTried(true); setErr('')
        if (!ok) return
        setBusy(true)
        try {
          const pad = (n) => String(n).padStart(2, '0')
          const r = await api('/register', { method: 'POST', body: {
            name: f.name, email: f.email, password: f.pw,
            gender: { 'A woman': 'woman', 'A man': 'man', 'Non-binary': 'other' }[f.gender],
            interested_in: { Women: 'women', Men: 'men' }[f.seeking] || 'everyone',
            date_of_birth: `${f.y}-${pad(+f.m + 1)}-${pad(f.d)}`,
            adult_confirmed: adult, terms_accepted: terms,
          } })
          setAccount(r.user)
          nav('/verify?email=' + encodeURIComponent(r.user.email))
        } catch (x) { setErr(x.message) } finally { setBusy(false) }
      }}>
        <div className="row2">
          <label className="field"><span>First name</span><input required value={f.name} onChange={set('name')} placeholder="Daniela" autoComplete="given-name" /></label>
          <label className="field"><span>Email</span><input type="email" required value={f.email} onChange={set('email')} placeholder="you@email.com" autoComplete="email" /></label>
        </div>
        <label className="field"><span>Password</span><Pw value={f.pw} onChange={set('pw')} placeholder="At least 8 characters" autoComplete="new-password" />
          <div className={'pw-meter s' + strength}><i /><i /><i /><i /></div></label>
        <div className="row2">
          <label className="field"><span>I am</span><select required value={f.gender} onChange={set('gender')}><option value="">Select…</option><option>A woman</option><option>A man</option><option>Non-binary</option></select></label>
          <label className="field"><span>Interested in</span><select value={f.seeking} onChange={set('seeking')}><option value="">Everyone</option><option>Women</option><option>Men</option></select></label>
        </div>
        <div className={'field dob' + (under ? ' err' : '')}><span>Date of birth <em>You must be 18 or older</em></span>
          <div className="row3">
            <select aria-label="Day" value={f.d} onChange={set('d')}><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
            <select aria-label="Month" value={f.m} onChange={set('m')}><option value="">Month</option>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
            <select aria-label="Year" value={f.y} onChange={set('y')}><option value="">Year</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
          </div>
          {under && <div className="alert err"><Icon name="ban" size={16} /> Sorry — you must be at least 18 to join Rekonekte. You're {age}. Mèsi for understanding.</div>}
          {age !== null && !under && <div className="alert ok"><Icon name="check" size={16} /> Age confirmed: {age}</div>}
        </div>
        <label className={'check' + (tried && !adult ? ' err' : '')}><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> I confirm I am 18 years of age or older.</label>
        <label className={'check' + (tried && !terms ? ' err' : '')}><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>
        {tried && !ok && !under && <div className="alert err"><Icon name="flag" size={16} /> Please complete every field and confirm both boxes.</div>}
        {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
        <button className="btn primary wide lg" disabled={under || busy}>{busy ? 'Creating your account…' : <>Create account <Icon name="arrow" size={16} /></>}</button>
      </form>
      <p className="muted center">Already a member? <Link to="/login">Log in</Link></p>
    </AuthShell>
  )
}

function CodeInput({ value, onChange, error }) {
  const refs = useRef([])
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')
  const setAt = (i, ch) => {
    const arr = value.padEnd(6, ' ').split('')
    arr[i] = ch || ' '
    onChange(arr.join('').trimEnd().replace(/ /g, ''))
  }
  return (
    <div className={'code' + (error ? ' err' : '')} onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(5, t.length)]?.focus() } }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" maxLength={1} aria-label={'Digit ' + (i + 1)} value={d.trim()}
          onChange={(e) => { const c = e.target.value.replace(/\D/g, '').slice(-1); setAt(i, c); if (c) refs.current[i + 1]?.focus() }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !d.trim()) refs.current[i - 1]?.focus() }} />
      ))}
    </div>
  )
}

export function Verify() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { account, setAccount } = useStore()
  const email = account?.email || sp.get('email') || ''
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [left, setLeft] = useState(30)
  const [ok, setOk] = useState(false)
  useEffect(() => { if (left <= 0) return; const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id) }, [left])
  return (
    <AuthShell side="cooking.jpg" quote="“Mèsi Rekonekte — I found my Sunday dinner crew.”">
      <div className="steps-mini"><span className="done">1 Account</span><i /><span className="on">2 Verify email</span><i /><span>3 Profile</span></div>
      {!ok ? (<>
        <div className="inbox-ill"><Icon name="mail" size={30} /><i /></div>
        <h1>{t('auth.verifyTitle')}</h1>
        <p className="muted">We sent a 6-digit code to <b>{email}</b>. It expires in 15 minutes.</p>
        <form className="form" onSubmit={async (e) => {
          e.preventDefault()
          if (code.length < 6) return setErr('Enter all 6 digits.')
          setBusy(true)
          try { const r = await api('/email/verify', { method: 'POST', body: { code } }); setAccount(r.user); setOk(true) }
          catch (x) { setErr(x.status === 401 ? 'Please log in again to verify your email.' : x.message) }
          finally { setBusy(false) }
        }}>
          <CodeInput value={code} onChange={(v) => { setCode(v); setErr('') }} error={err} />
          {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
          <button className="btn primary wide lg" disabled={busy}>{busy ? 'Checking…' : 'Verify email'}</button>
        </form>
        <p className="muted center small">Didn't get it? Check spam, or {left > 0 ? <span>resend in 0:{String(left).padStart(2, '0')}</span> : <button className="link-btn" onClick={() => { setLeft(30); api('/email/resend', { method: 'POST' }).catch((x) => setErr(x.message)) }}>resend the code</button>}</p>
      </>) : (
        <div className="success-block">
          <span className="done-ill big"><Icon name="check" size={40} /></span>
          <h1>Email verified — byenvini!</h1>
          <p className="muted">Your account is ready. Add a photo and a few details so people can find you.</p>
          <button className="btn primary wide lg" onClick={() => nav('/app/profile/edit')}>Set up my profile <Icon name="arrow" size={16} /></button>
          <Link to="/app/discover" className="btn ghost wide">Skip for now</Link>
        </div>
      )}
    </AuthShell>
  )
}

export function Reset() {
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  return (
    <AuthShell side="beach.jpg" quote="“Lakay se lakay — wherever we are.”">
      {step === 1 && (<>
        <Link to="/login" className="back-link"><Icon name="back" size={16} /> Back to log in</Link>
        <h1>{t('auth.resetTitle')}</h1>
        <p className="muted">Enter the email on your account and we'll send you a reset code.</p>
        <form className="form" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await api('/password/forgot', { method: 'POST', body: { email } }); setStep(2) } catch (x) { setErr(x.message) } }}>
          <label className="field"><span>Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></label>
          <button className="btn primary wide lg">Send reset code</button>
        </form>
      </>)}
      {step === 2 && (<>
        <button className="back-link" onClick={() => setStep(1)}><Icon name="back" size={16} /> Change email</button>
        <h1>Choose a new password</h1>
        <p className="muted">Code sent to <b>{email}</b>.</p>
        <form className="form" onSubmit={(e) => { e.preventDefault(); if (code.length < 6) return setErr('Enter the 6-digit code.'); if (p1.length < 8) return setErr('Password must be at least 8 characters.'); if (p1 !== p2) return setErr('Passwords don\'t match.'); api('/password/reset', { method: 'POST', body: { email, code, password: p1, password_confirmation: p2 } }).then(() => setStep(3)).catch((x) => setErr(x.message)) }}>
          <div className="field"><span>Reset code</span><CodeInput value={code} onChange={(v) => { setCode(v); setErr('') }} /></div>
          <label className="field"><span>New password</span><Pw value={p1} onChange={(e) => { setP1(e.target.value); setErr('') }} autoComplete="new-password" /></label>
          <label className="field"><span>Confirm password</span><Pw value={p2} onChange={(e) => { setP2(e.target.value); setErr('') }} autoComplete="new-password" /></label>
          {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
          <button className="btn primary wide lg">Update password</button>
        </form>
      </>)}
      {step === 3 && (
        <div className="success-block">
          <span className="done-ill big"><Icon name="lock" size={36} /></span>
          <h1>Password updated</h1>
          <p className="muted">You can now log in with your new password.</p>
          <Link to="/login" className="btn primary wide lg">Back to log in</Link>
        </div>
      )}
    </AuthShell>
  )
}

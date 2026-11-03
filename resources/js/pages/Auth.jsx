import { api } from '../api.js'
import { useStore } from '../store.jsx'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { Icon, LangSwitch, Logo } from '../components/ui.jsx'

function AuthShell({ children }) {
  return (
    <div className="mk-auth">
      <div className="mk-auth-card">
        <div className="mk-auth-top"><Logo stack /><p className="mk-script">Lanmou · Kominote · Lakay</p></div>
        {children}
      </div>
      <div className="mk-auth-foot"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><LangSwitch compact /></div>
    </div>
  )
}

const GOOGLE = <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.500c3.500 0 6.600 1.200 9.100 3.600l6.800-6.800C35.800 2.400 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.600 17.700 9.500 24 9.500Z" /><path fill="#4285F4" d="M46.900 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.900c-.6 3-2.300 5.500-4.800 7.200l7.700 6c4.500-4.200 7.100-10.300 7.100-17.700Z" /><path fill="#FBBC05" d="M10.500 28.700c-.5-1.400-.8-3-.8-4.700s.3-3.200.8-4.700l-7.900-6.100C.9 16.500 0 20.100 0 24s.9 7.500 2.600 10.800l7.900-6.100Z" /><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.200 1.400-4.900 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48Z" /></svg>
const APPLE = <svg width="17" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.600 12.700c0-2.500 2-3.700 2.100-3.800-1.200-1.700-3-1.900-3.600-2-1.500-.2-3 .9-3.800.9-.8 0-2-.9-3.300-.9-1.700 0-3.300 1-4.200 2.500-1.800 3.100-.5 7.700 1.300 10.200.9 1.200 1.900 2.600 3.200 2.600 1.300-.1 1.800-.8 3.300-.8 1.500 0 2 .8 3.300.8 1.400 0 2.300-1.200 3.100-2.500 1-1.400 1.400-2.800 1.400-2.900-.1 0-2.800-1.100-2.800-4.100ZM15.200 5.300c.7-.9 1.200-2.100 1-3.300-1 0-2.300.7-3 1.500-.6.700-1.200 2-1.100 3.200 1.200.1 2.400-.6 3.100-1.400Z" /></svg>

function SocialSignIn() {
  const { toast } = useStore()
  const soon = (name) => () => toast(`${name} sign-in is coming soon. Please use your email for now.`, 'info')
  return (<>
    <div className="mk-or">or</div>
    <button type="button" className="mk-oauth" onClick={soon('Google')}>{GOOGLE} Continue with Google</button>
    <button type="button" className="mk-oauth" onClick={soon('Apple')}>{APPLE} Continue with Apple</button>
  </>)
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
      nav(r.user.email_verified ? (next && next.startsWith('/app') ? next : '/app/home') : '/verify?email=' + encodeURIComponent(r.user.email))
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
      <SocialSignIn />
      <p className="muted center">Don't have an account? <Link to="/register">Sign Up</Link></p>
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
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [f, setF] = useState({ name: '', email: sp.get('email') || '', pw: '', gender: 'man', d: '', m: '', y: '' })
  const [adult, setAdult] = useState(false)
  const [terms, setTerms] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const { setAccount } = useStore()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const age = ageFrom(f.y, f.m, f.d)
  const under = age !== null && age < 18
  const years = Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - 10 - i)
  const ok = f.name && f.email && f.pw.length >= 8 && f.gender && age !== null && !under && adult && terms
  return (
    <AuthShell>
      <h1>Create Your Account</h1>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault(); setTried(true); setErr('')
        if (!ok) return
        setBusy(true)
        try {
          const pad = (n) => String(n).padStart(2, '0')
          const r = await api('/register', { method: 'POST', body: {
            name: f.name, email: f.email, password: f.pw, gender: f.gender, interested_in: 'everyone',
            date_of_birth: `${f.y}-${pad(+f.m + 1)}-${pad(f.d)}`,
            adult_confirmed: adult, terms_accepted: terms,
          } })
          setAccount(r.user)
          nav('/verify?email=' + encodeURIComponent(r.user.email))
        } catch (x) { setErr(x.message) } finally { setBusy(false) }
      }}>
        <div className="field"><span>I'm a</span>
          <div className="mk-seg" role="radiogroup" aria-label="I'm a">{[['man', 'Man'], ['woman', 'Woman'], ['other', 'Non-binary']].map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={f.gender === v} className={f.gender === v ? 'on' : ''} onClick={() => setF({ ...f, gender: v })}>{l}</button>)}</div>
        </div>
        <label className="field"><span>Full Name</span><input required value={f.name} onChange={set('name')} placeholder="Enter your name" autoComplete="name" /></label>
        <label className="field"><span>Email Address</span><input type="email" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></label>
        <label className="field"><span>Password</span><Pw value={f.pw} onChange={set('pw')} placeholder="Create a password" autoComplete="new-password" /></label>
        <div className={'field dob' + (under ? ' err' : '')}><span>Date of Birth</span>
          <div className="row3">
            <select aria-label="Month" value={f.m} onChange={set('m')}><option value="">Month</option>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
            <select aria-label="Day" value={f.d} onChange={set('d')}><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
            <select aria-label="Year" value={f.y} onChange={set('y')}><option value="">Year</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
          </div>
          {under && <div className="alert err"><Icon name="ban" size={16} /> Sorry, you must be at least 18 to join Rekonekte.</div>}
        </div>
        <label className={'check' + (tried && !adult ? ' err' : '')}><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> I confirm I am 18 years of age or older.</label>
        <label className={'check' + (tried && !terms ? ' err' : '')}><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>
        {tried && !ok && !under && <div className="alert err"><Icon name="flag" size={16} /> Please complete every field and confirm both boxes.</div>}
        {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
        <button className="btn primary wide lg" disabled={under || busy}>{busy ? 'Creating your account…' : 'Sign Up'}</button>
      </form>
      <SocialSignIn />
      <p className="muted center">Already have an account? <Link to="/login">Log In</Link></p>
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
  const [sp] = useSearchParams()
  const [step, setStep] = useState(sp.get('email') && sp.get('code') ? 2 : 1)
  const [email, setEmail] = useState(sp.get('email') || '')
  const [code, setCode] = useState(sp.get('code') || '')
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

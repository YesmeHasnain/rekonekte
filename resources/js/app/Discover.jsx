import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

const CITIES = ['Miami', 'Brooklyn', 'Montréal', 'Boston', 'Port-au-Prince', 'Paris', 'Orlando', 'Cap-Haïtien']

export function DualRange({ min, max, lo, hi, onChange }) {
  const pct = (v) => ((v - min) / (max - min)) * 100
  return (
    <div className="dual">
      <div className="dual-track"><i style={{ left: pct(lo) + '%', right: 100 - pct(hi) + '%' }} /></div>
      <input type="range" min={min} max={max} value={lo} aria-label="Minimum age" onChange={(e) => onChange([Math.min(+e.target.value, hi - 1), hi])} />
      <input type="range" min={min} max={max} value={hi} aria-label="Maximum age" onChange={(e) => onChange([lo, Math.max(+e.target.value, lo + 1)])} />
    </div>
  )
}

const DEFAULT = { age: [18, 60], gender: 'all', city: 'all', verified: false, online: false }
const TABS = [['recommended', 'Recommended'], ['nearby', 'Nearby'], ['new', 'New Members']]
const CULTURES = [['all', 'All'], ['haitian', 'Haitian'], ['caribbean', 'Caribbean'], ['other', 'Other Cultures']]

export default function Discover() {
  const { t } = useI18n()
  const { me, toast } = useStore()
  const nav = useNavigate()
  const { data, loading, reload } = useApi('/members')
  const members = data?.data ?? []
  const [liked, setLiked] = useState(() => new Set())
  const [passed, setPassed] = useState(() => new Set())
  const [passCount, setPassCount] = useState(0)
  const [f, setF] = useState(DEFAULT)
  const [tab, setTab] = useState('recommended')
  const [culture, setCulture] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [pop, setPop] = useState(null)

  useEffect(() => { setLiked(new Set(members.filter((m) => m.liked).map((m) => m.id))) }, [data]) // eslint-disable-line

  const list = useMemo(() => members
    .filter((m) => !passed.has(m.id))
    .filter((m) => m.age >= f.age[0] && m.age <= f.age[1])
    .filter((m) => f.gender === 'all' || m.gender === f.gender)
    .filter((m) => f.city === 'all' || m.city === f.city)
    .filter((m) => !f.verified || m.verified)
    .filter((m) => !f.online || m.online)
    .filter((m) => culture === 'all' || m.culture === culture)
    .filter((m) => tab !== 'nearby' || (me.city && m.city === me.city))
    .sort((a, b) => tab === 'new' ? String(b.joined).localeCompare(String(a.joined)) : b.match - a.match), [members, f, tab, culture, passed, me.city])

  const active = (f.age[0] !== 18 || f.age[1] !== 60) + (f.gender !== 'all') + (f.city !== 'all') + f.verified + f.online

  const doLike = async (m) => {
    if (liked.has(m.id)) return
    setLiked((s) => new Set(s).add(m.id))
    try {
      const r = await api('/members/' + m.id + '/like', { method: 'POST' })
      if (r.matched) { setPop(m); setTimeout(() => setPop(null), 3000) } else toast(`You liked ${m.name}`)
    } catch (e) { toast(e.message, 'err') }
  }
  const doPass = async (m) => {
    setPassed((s) => new Set(s).add(m.id)); setPassCount((n) => n + 1)
    toast(`Passed on ${m.name}`, 'info')
    try { await api('/members/' + m.id + '/pass', { method: 'POST' }) } catch {}
  }
  const undoPasses = async () => { try { await api('/passes/clear', { method: 'POST' }) } catch {} setPassed(new Set()); setPassCount(0); reload() }

  return (
    <div className="page mk-page mk-discover">
      <h1 className="mk-h1">{t('h.discover')}</h1>
      <div className="mk-tabs">{TABS.map(([v, l]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>)}</div>
      <div className="mk-chips">
        {CULTURES.map(([v, l]) => <button key={v} className={'mk-chip' + (culture === v ? ' on' : '')} onClick={() => setCulture(v)}>{l}</button>)}
        <button className="mk-chip sq" onClick={() => setShowFilters(!showFilters)} aria-label={t('app.filters')}><Icon name="sliders" size={16} />{active > 0 && <em className="count">{active}</em>}</button>
      </div>
      {showFilters && (
        <div className="mk-filters">
          <div className="fgroup"><label>{t('app.age')} <b>{f.age[0]} – {f.age[1]}{f.age[1] === 60 ? '+' : ''}</b></label><DualRange min={18} max={60} lo={f.age[0]} hi={f.age[1]} onChange={(age) => setF({ ...f, age })} /></div>
          <div className="fgroup"><label>{t('app.gender')}</label>
            <div className="seg">{[['all', 'Everyone'], ['woman', 'Women'], ['man', 'Men']].map(([v, l]) => <button key={v} className={f.gender === v ? 'on' : ''} onClick={() => setF({ ...f, gender: v })}>{l}</button>)}</div></div>
          <div className="fgroup"><label>{t('app.city')}</label>
            <select className="sel-s" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}><option value="all">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="fgroup">
            <label className="switch-row"><span>Verified only</span><input type="checkbox" className="switch" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} /></label>
            <label className="switch-row"><span>Online now</span><input type="checkbox" className="switch" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} /></label>
            <button className="link-btn" onClick={() => setF(DEFAULT)}>{t('app.reset')}</button>
          </div>
        </div>
      )}
      {passCount > 0 && <p className="muted small"><button className="link-btn" onClick={undoPasses}>Undo {passCount} pass{passCount > 1 ? 'es' : ''}</button></p>}
      {loading && <div className="gate-wait" aria-busy="true" style={{ minHeight: 200 }} />}
      {!loading && list.length === 0 && (
        <div className="empty card"><Icon name="search" size={32} /><h3>No one matches yet</h3><p className="muted">Try another tab or widen your filters.</p><button className="btn primary" onClick={() => { setF(DEFAULT); setCulture('all'); setTab('recommended') }}>{t('app.reset')} filters</button></div>
      )}
      <div className="mk-grid">
        {list.map((m) => { const isLiked = liked.has(m.id); return (
          <article key={m.id} className="mk-m">
            <div className="mk-m-top">
              <Link to={'/app/members/' + m.id} className="mk-m-img"><img src={photoUrl(m.photo)} alt={m.name} loading="lazy" /></Link>
              <button className={'mk-m-heart' + (isLiked ? ' on' : '')} onClick={() => doLike(m)} aria-label={t('btn.like')}><Icon name="heart" size={16} fill="currentColor" stroke={0} /></button>
            </div>
            <Link to={'/app/members/' + m.id} className="mk-m-b"><b>{m.name}, {m.age}</b><span>{m.job || m.city}</span></Link>
          </article>
        ) })}
      </div>
      {pop && (
        <div className="match-pop" onClick={() => setPop(null)}>
          <div className="match-card">
            <div className="hearts"><img src={photoUrl(me.photo)} alt="" /><img src={photoUrl(pop.photo)} alt="" /></div>
            <h2>It's a match! 💙❤️</h2><p>You and {pop.name} liked each other.</p>
            <button className="btn primary" onClick={() => nav('/app/messages/' + pop.id)}>Say bonjou</button>
          </div>
        </div>
      )}
    </div>
  )
}

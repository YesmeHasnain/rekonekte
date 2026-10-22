import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon } from '../components/ui.jsx'
import { CITIES, MEMBERS } from '../data.js'

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

export default function Discover() {
  const { t } = useI18n()
  const { liked, like, passed, pass, setPassed, blocked, openThread, toast } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState(DEFAULT)
  const [sort, setSort] = useState('match')
  const [showFilters, setShowFilters] = useState(false)
  const [pop, setPop] = useState(null)

  const list = useMemo(() => MEMBERS
    .filter((m) => !blocked.includes(m.id) && !passed.includes(m.id))
    .filter((m) => m.age >= f.age[0] && m.age <= f.age[1])
    .filter((m) => f.gender === 'all' || m.gender === f.gender)
    .filter((m) => f.city === 'all' || m.city === f.city)
    .filter((m) => !f.verified || m.verified)
    .filter((m) => !f.online || m.online)
    .sort((a, b) => sort === 'match' ? b.match - a.match : sort === 'young' ? a.age - b.age : Number(b.online) - Number(a.online)), [f, sort, blocked, passed])

  const active = (f.age[0] !== 18 || f.age[1] !== 60) + (f.gender !== 'all') + (f.city !== 'all') + f.verified + f.online
  const doLike = (m) => { if (liked.includes(m.id)) return; like(m.id); if (m.match >= 88) { setPop(m); setTimeout(() => setPop(null), 2600) } else toast(`You liked ${m.name}`) }

  return (
    <div className="page">
      <div className="page-h">
        <div><h1>{t('h.discover')}</h1><p className="muted">{list.length} {list.length === 1 ? 'member matches' : 'members match'} your filters{passed.length > 0 && <> · <button className="link-btn" onClick={() => setPassed([])}>undo {passed.length} pass{passed.length > 1 ? 'es' : ''}</button></>}</p></div>
        <div className="row-g">
          <select className="sel-s" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="match">Best match</option><option value="online">Online now</option><option value="young">Age: youngest</option></select>
          <button className="btn ghost sm filt-btn" onClick={() => setShowFilters(!showFilters)}><Icon name="sliders" size={15} /> {t('app.filters')}{active > 0 && <em className="count">{active}</em>}</button>
        </div>
      </div>

      <div className="disc">
        <aside className={'filters card' + (showFilters ? ' open' : '')}>
          <div className="filters-h"><b><Icon name="sliders" size={16} /> {t('app.filters')}</b><button className="link-btn" onClick={() => setF(DEFAULT)}>{t('app.reset')}</button></div>
          <div className="fgroup"><label>{t('app.age')} <b>{f.age[0]} – {f.age[1]}{f.age[1] === 60 ? '+' : ''}</b></label><DualRange min={18} max={60} lo={f.age[0]} hi={f.age[1]} onChange={(age) => setF({ ...f, age })} /></div>
          <div className="fgroup"><label>{t('app.gender')}</label>
            <div className="seg">{[['all', 'Everyone'], ['woman', 'Women'], ['man', 'Men']].map(([v, l]) => <button key={v} className={f.gender === v ? 'on' : ''} onClick={() => setF({ ...f, gender: v })}>{l}</button>)}</div></div>
          <div className="fgroup"><label>{t('app.city')}</label>
            <select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}><option value="all">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            <div className="city-chips">{['Miami', 'Brooklyn', 'Montréal', 'Paris'].map((c) => <button key={c} className={'chip' + (f.city === c ? ' on' : '')} onClick={() => setF({ ...f, city: f.city === c ? 'all' : c })}>{c}</button>)}</div></div>
          <label className="switch-row"><span>Verified only</span><input type="checkbox" className="switch" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} /></label>
          <label className="switch-row"><span>Online now</span><input type="checkbox" className="switch" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} /></label>
          <button className="btn primary wide show-m" onClick={() => setShowFilters(false)}>Show {list.length} members</button>
        </aside>

        <div className="disc-main">
          {list.length === 0 ? (
            <div className="empty card"><Icon name="search" size={32} /><h3>No one matches — yet</h3><p className="muted">Try widening the age range or picking another city.</p><button className="btn primary" onClick={() => setF(DEFAULT)}>{t('app.reset')} filters</button></div>
          ) : (
            <div className="mgrid">
              {list.map((m) => { const isLiked = liked.includes(m.id); return (
                <article key={m.id} className={'mcard' + (isLiked ? ' liked' : '')}>
                  <Link to={'/app/members/' + m.id} className="mcard-img">
                    <img src={'/img/' + m.photo} alt={m.name} loading="lazy" />
                    <span className="mcard-match">{m.match}%</span>
                    {m.online && <span className="mcard-on"><i /> Online</span>}
                    {isLiked && <span className="mcard-heart"><Icon name="heart" size={18} fill="currentColor" stroke={0} /></span>}
                    <div className="mcard-info"><b>{m.name}, {m.age} {m.verified && <Icon name="verified" size={15} className="vf" />}</b><span><Icon name="pin" size={12} /> {m.city}</span></div>
                  </Link>
                  <div className="mcard-tags">{m.interests.slice(0, 3).map((x) => <span key={x}>{x}</span>)}</div>
                  <div className="mcard-a">
                    <button className="ma pass sm" onClick={() => { pass(m.id); toast(`Passed on ${m.name}`, 'info') }} aria-label={t('btn.pass')} title={t('btn.pass')}><Icon name="x" size={18} /></button>
                    <button className="btn ghost sm grow" onClick={() => nav('/app/messages/' + openThread(m.id))}><Icon name="chat" size={14} /> {t('btn.message')}</button>
                    <button className={'ma like sm' + (isLiked ? ' done' : '')} onClick={() => doLike(m)} aria-label={t('btn.like')} title={t('btn.like')}><Icon name="heart" size={18} fill="currentColor" stroke={0} /></button>
                  </div>
                </article>
              ) })}
            </div>
          )}
        </div>
      </div>
      {pop && (
        <div className="match-pop" onClick={() => setPop(null)}>
          <div className="match-card">
            <div className="hearts"><img src="/img/p-nadia.jpg" alt="" /><img src={'/img/' + pop.photo} alt="" /></div>
            <h2>It's a match! 💙❤️</h2><p>You and {pop.name} liked each other.</p>
            <button className="btn primary" onClick={() => nav('/app/messages/' + openThread(pop.id))}>Say bonjou</button>
          </div>
        </div>
      )}
    </div>
  )
}

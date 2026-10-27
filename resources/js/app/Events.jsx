import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

export default function Events() {
  const { t } = useI18n()
  const { toast } = useStore()
  const { data, setData, loading } = useApi('/events')
  const events = data?.events ?? []
  const [city, setCity] = useState('All')
  const [tag, setTag] = useState('All')
  const [mine, setMine] = useState(false)

  const cities = ['All', ...new Set(events.map((e) => e.city).filter(Boolean))]
  const tags = ['All', ...new Set(events.map((e) => e.tag).filter(Boolean))]
  const list = events.filter((e) => (city === 'All' || e.city === city) && (tag === 'All' || e.tag === tag) && (!mine || e.mine))
  const goingCount = events.filter((e) => e.mine).length
  const [feat, ...rest] = list

  const rsvp = async (e) => {
    const was = e.mine
    setData({ events: events.map((x) => x.id === e.id ? { ...x, mine: !was, going: x.going + (was ? -1 : 1) } : x) })
    toast(was ? `RSVP cancelled for ${e.title}` : `You're going to ${e.title}! 🎉`, was ? 'info' : 'ok')
    try { await api('/events/' + e.id + '/rsvp', { method: 'POST' }) } catch { setData({ events }) }
  }

  return (
    <div className="page">
      <div className="page-h">
        <div><h1>{t('h.events')}</h1><p className="muted">Kompa nights, cook-offs and meetups across the diaspora. You're going to {goingCount}.</p></div>
        <div className="row-g wrap-g">
          <select className="sel-s" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">{cities.map((c) => <option key={c} value={c}>{c === 'All' ? 'All cities' : c}</option>)}</select>
          <button className={'btn sm ' + (mine ? 'primary' : 'ghost')} onClick={() => setMine(!mine)}><Icon name="check" size={14} /> My RSVPs</button>
        </div>
      </div>
      <div className="cat-tabs">{tags.map((x) => <button key={x} className={tag === x ? 'on' : ''} onClick={() => setTag(x)}>{x}</button>)}</div>
      {loading && <div className="gate-wait" aria-busy="true" style={{ minHeight: 160 }} />}
      {!loading && list.length === 0 && <div className="empty card"><Icon name="calendar" size={32} /><h3>No events match</h3><p className="muted">Try another city or category.</p></div>}
      {feat && (
        <article className="ev-feat card">
          <img src={photoUrl(feat.image)} alt="" />
          <div className="ev-feat-b">
            <span className="tag light">Featured · {feat.tag}</span>
            <h2>{feat.title}</h2>
            <p><Icon name="calendar" size={15} /> {feat.date} · {feat.time}</p>
            <p><Icon name="pin" size={15} /> {feat.venue}, {feat.city}</p>
            <div className="row-g"><button className={'btn ' + (feat.mine ? 'success' : 'sun')} onClick={() => rsvp(feat)}>{feat.mine ? <><Icon name="check" size={15} /> {t('btn.going')}</> : t('btn.rsvp')}</button><span>{feat.going} going · {feat.price}</span></div>
          </div>
        </article>
      )}
      <div className="ev-grid">
        {rest.map((e) => (
          <article key={e.id} className="ev-card card">
            <div className="ev-img"><img src={photoUrl(e.image)} alt="" loading="lazy" /><span className="ev-date"><b>{e.date.split(' ')[2]}</b>{e.date.split(' ')[1]}</span><span className="ev-tag">{e.tag}</span></div>
            <div className="ev-b"><h3>{e.title}</h3><span className="muted small"><Icon name="pin" size={13} /> {e.venue}, {e.city}</span><span className="muted small"><Icon name="calendar" size={13} /> {e.date} · {e.time}</span>
              <div className="ev-f"><span className="muted small">{e.going} going · {e.price}</span><button className={'btn sm ' + (e.mine ? 'success' : 'primary')} onClick={() => rsvp(e)}>{e.mine ? <><Icon name="check" size={14} /> {t('btn.going')}</> : t('btn.rsvp')}</button></div></div>
          </article>
        ))}
      </div>
      <div className="card live-banner">
        <img src="/img/live-lights.jpg" alt="" />
        <div><span className="soon"><i /> Coming soon</span><h3>Lakou Live</h3><p>Watch kompa sets and talks live on Rekonekte. Planned for a later phase.</p></div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon } from '../components/ui.jsx'
import { EVENTS } from '../data.js'

export default function Events() {
  const { t } = useI18n()
  const { going, toggleGoing, toast } = useStore()
  const [city, setCity] = useState('All')
  const [tag, setTag] = useState('All')
  const [mine, setMine] = useState(false)
  const cities = ['All', ...new Set(EVENTS.map((e) => e.city))]
  const tags = ['All', ...new Set(EVENTS.map((e) => e.tag))]
  const list = EVENTS.filter((e) => (city === 'All' || e.city === city) && (tag === 'All' || e.tag === tag) && (!mine || going.includes(e.id)))
  const [feat, ...rest] = list
  const rsvp = (e) => { const was = going.includes(e.id); toggleGoing(e.id); toast(was ? `RSVP cancelled for ${e.title}` : `You're going to ${e.title}! 🎉`, was ? 'info' : 'ok') }
  return (
    <div className="page">
      <div className="page-h">
        <div><h1>{t('h.events')}</h1><p className="muted">Kompa nights, cook-offs and meetups across the diaspora. You're going to {going.length}.</p></div>
        <div className="row-g wrap-g">
          <select className="sel-s" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">{cities.map((c) => <option key={c} value={c}>{c === 'All' ? 'All cities' : c}</option>)}</select>
          <button className={'btn sm ' + (mine ? 'primary' : 'ghost')} onClick={() => setMine(!mine)}><Icon name="check" size={14} /> My RSVPs</button>
        </div>
      </div>
      <div className="cat-tabs">{tags.map((x) => <button key={x} className={tag === x ? 'on' : ''} onClick={() => setTag(x)}>{x}</button>)}</div>
      {list.length === 0 && <div className="empty card"><Icon name="calendar" size={32} /><h3>No events match</h3><p className="muted">Try another city or category.</p></div>}
      {feat && (
        <article className="ev-feat card">
          <img src={'/img/' + feat.image} alt="" />
          <div className="ev-feat-b">
            <span className="tag light">Featured · {feat.tag}</span>
            <h2>{feat.title}</h2>
            <p><Icon name="calendar" size={15} /> {feat.date} · {feat.time}</p>
            <p><Icon name="pin" size={15} /> {feat.venue}, {feat.city}</p>
            <div className="row-g"><button className={'btn ' + (going.includes(feat.id) ? 'success' : 'sun')} onClick={() => rsvp(feat)}>{going.includes(feat.id) ? <><Icon name="check" size={15} /> {t('btn.going')}</> : t('btn.rsvp')}</button><span>{feat.going + (going.includes(feat.id) ? 1 : 0)} going · {feat.price}</span></div>
          </div>
        </article>
      )}
      <div className="ev-grid">
        {rest.map((e) => { const g = going.includes(e.id); return (
          <article key={e.id} className="ev-card card">
            <div className="ev-img"><img src={'/img/' + e.image} alt="" loading="lazy" /><span className="ev-date"><b>{e.date.split(' ')[2]}</b>{e.date.split(' ')[1]}</span><span className="ev-tag">{e.tag}</span></div>
            <div className="ev-b"><h3>{e.title}</h3><span className="muted small"><Icon name="pin" size={13} /> {e.venue}, {e.city}</span><span className="muted small"><Icon name="calendar" size={13} /> {e.date} · {e.time}</span>
              <div className="ev-f"><span className="muted small">{e.going + (g ? 1 : 0)} going · {e.price}</span><button className={'btn sm ' + (g ? 'success' : 'primary')} onClick={() => rsvp(e)}>{g ? <><Icon name="check" size={14} /> {t('btn.going')}</> : t('btn.rsvp')}</button></div></div>
          </article>
        ) })}
      </div>
      <div className="card live-banner">
        <img src="/img/live-lights.jpg" alt="" />
        <div><span className="soon"><i /> Coming soon</span><h3>Lakou Live</h3><p>Watch kompa sets and talks live on Rekonekte. Planned for Phase 2.</p></div>
      </div>
    </div>
  )
}

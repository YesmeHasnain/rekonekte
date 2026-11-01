import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

export function EventCard({ e, onRsvp }) {
  return (
    <article className="mk-ev">
      <Link to={'/app/events/' + e.id} className="mk-ev-img"><img src={photoUrl(e.image)} alt="" loading="lazy" /></Link>
      <div className="mk-ev-b">
        <Link to={'/app/events/' + e.id}><b>{e.title}</b></Link>
        <span>{e.date} · {e.time}</span>
        {(e.venue || e.city) && <span><Icon name="pin" size={12} /> {[e.venue, e.city].filter(Boolean).join(', ')}</span>}
        <button className={'mk-pill-btn' + (e.mine ? ' on' : '')} onClick={() => onRsvp(e)}>{e.mine ? <><Icon name="check" size={13} /> Going</> : 'Interested'}</button>
      </div>
    </article>
  )
}

export function useRsvp(events, setData) {
  const { toast } = useStore()
  return async (e) => {
    const was = e.mine
    setData({ events: events.map((x) => x.id === e.id ? { ...x, mine: !was, going: x.going + (was ? -1 : 1) } : x) })
    toast(was ? `RSVP cancelled for ${e.title}` : `You're going to ${e.title}!`, was ? 'info' : 'ok')
    try { await api('/events/' + e.id + '/rsvp', { method: 'POST' }) } catch { setData({ events }) }
  }
}

export default function Events() {
  const { t } = useI18n()
  const { data, setData, loading } = useApi('/events')
  const events = data?.events ?? []
  const [city, setCity] = useState('All')
  const [tag, setTag] = useState('All')
  const [mine, setMine] = useState(false)
  const rsvp = useRsvp(events, setData)

  const cities = ['All', ...new Set(events.map((e) => e.city).filter(Boolean))]
  const tags = ['All', ...new Set(events.map((e) => e.tag).filter(Boolean))]
  const list = events.filter((e) => (city === 'All' || e.city === city) && (tag === 'All' || e.tag === tag) && (!mine || e.mine))

  return (
    <div className="page mk-page mk-evpage">
      <div className="mk-head"><h1 className="mk-h1">{t('h.events')}</h1>
        <div className="row-g">
          <select className="sel-s" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">{cities.map((c) => <option key={c} value={c}>{c === 'All' ? 'All cities' : c}</option>)}</select>
          <button className={'mk-chip' + (mine ? ' on' : '')} onClick={() => setMine(!mine)}>My RSVPs</button>
        </div>
      </div>
      <div className="mk-chips">{tags.map((x) => <button key={x} className={'mk-chip' + (tag === x ? ' on' : '')} onClick={() => setTag(x)}>{x}</button>)}</div>
      {loading && <div className="gate-wait" aria-busy="true" style={{ minHeight: 160 }} />}
      {!loading && list.length === 0 && <div className="empty card"><Icon name="calendar" size={32} /><h3>No events match</h3><p className="muted">Try another city or category.</p></div>}
      <div className="mk-evgrid">{list.map((e) => <EventCard key={e.id} e={e} onRsvp={rsvp} />)}</div>
    </div>
  )
}

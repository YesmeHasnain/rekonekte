import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { Avatar, Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

const savedKey = 'rk-saved-events'
const readSaved = () => { try { return JSON.parse(localStorage.getItem(savedKey)) || [] } catch { return [] } }

export default function EventDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { toast } = useStore()
  const { data, setData, loading, error, reload } = useApi('/events/' + id)
  const e = data?.event
  const [tab, setTab] = useState('details')
  const [saved, setSaved] = useState(() => readSaved().includes(+id))

  const rsvp = async () => {
    try {
      const r = await api('/events/' + id + '/rsvp', { method: 'POST' })
      setData({ event: { ...e, mine: r.going, going: r.count } })
      toast(r.going ? `You're going to ${e.title}!` : 'RSVP cancelled', r.going ? 'ok' : 'info')
      reload()
    } catch (x) { toast(x.message, 'err') }
  }
  const toggleSave = () => {
    const next = saved ? readSaved().filter((x) => x !== +id) : [...readSaved(), +id]
    try { localStorage.setItem(savedKey, JSON.stringify(next)) } catch {}
    setSaved(!saved)
  }

  if (loading && !e) return <div className="gate-wait" aria-busy="true" style={{ minHeight: 320 }} />
  if (error || !e) return <div className="empty card"><h3>This event isn't available</h3><Link className="btn primary" to="/app/events">Back to events</Link></div>

  return (
    <div className="page mk-page mk-event">
      <div className="mk-event-hero">
        <img src={photoUrl(e.image)} alt="" />
        <button onClick={() => nav(-1)} aria-label="Back"><Icon name="back" size={16} /></button>
      </div>
      <h1>{e.title}</h1>
      <p className="mk-event-l"><Icon name="calendar" size={15} /> {e.date} <i /> {e.time}</p>
      {(e.venue || e.city) && <p className="mk-event-l"><Icon name="pin" size={15} /> {[e.venue, e.city].filter(Boolean).join(', ')}</p>}
      <div className="mk-event-cta">
        <button className={'mk-wide' + (e.mine ? ' on' : '')} onClick={rsvp}>{e.mine ? <><Icon name="check" size={16} /> You're going</> : 'Get Tickets'}</button>
        <button className={'mk-save' + (saved ? ' on' : '')} onClick={toggleSave} aria-label="Save event"><Icon name="bookmark" size={18} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="mk-tabs">{[['details', 'Details'], ['about', 'About'], ['attendees', 'Attendees']].map(([v, l]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>)}</div>
      {tab === 'details' && (<>
        <p className="mk-event-t">{e.description || 'Join the kominote for this event. More details will be shared soon.'}</p>
        <div className="mk-chips">{[e.tag, e.price].filter(Boolean).map((x) => <span key={x} className="mk-chip">{x}</span>)}</div>
      </>)}
      {tab === 'about' && <p className="mk-event-t">{e.tag} event{e.city ? ' in ' + e.city : ''}. Entry: {e.price}. Hosted by the Rekonekte kominote.</p>}
      {tab === 'attendees' && (e.attendees.length === 0
        ? <p className="mk-event-t">No one has joined yet. Be the first.</p>
        : <div className="mk-att-list">{e.attendees.map((a) => <Link key={a.id} to={'/app/members/' + a.id}><Avatar src={a.photo} size={40} /> {a.name}</Link>)}</div>)}
      <div className="mk-att">
        <div>{e.attendees.slice(0, 4).map((a) => <img key={a.id} src={photoUrl(a.photo)} alt="" />)}</div>
        <span>{e.going} {e.going === 1 ? 'person is' : 'people are'} attending</span>
      </div>
    </div>
  )
}

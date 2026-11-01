import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

/** Home: one member at a time, with pass, like and save. */
export default function Home() {
  const { toast, me } = useStore()
  const nav = useNavigate()
  const { data, loading, reload } = useApi('/members')
  const [gone, setGone] = useState(() => new Set())
  const [leaving, setLeaving] = useState('')
  const [pop, setPop] = useState(null)
  const members = (data?.data ?? []).filter((m) => !m.liked && !gone.has(m.id))
  const m = members[0]

  const next = (dir) => {
    setLeaving(dir)
    setTimeout(() => { setGone((s) => new Set(s).add(m.id)); setLeaving('') }, 240)
  }
  const pass = async () => {
    next('left')
    try { await api('/members/' + m.id + '/pass', { method: 'POST' }) } catch (e) { toast(e.message, 'err') }
  }
  const like = async () => {
    next('right')
    try {
      const r = await api('/members/' + m.id + '/like', { method: 'POST' })
      if (r.matched) setPop(m)
    } catch (e) { toast(e.message, 'err') }
  }
  const save = () => { toast(`${m.name} saved for later`); next('left') }

  if (loading) return <div className="gate-wait" aria-busy="true" style={{ minHeight: 320 }} />

  return (
    <div className="page mk-page mk-home">
      {m ? (<>
        <Link to={'/app/members/' + m.id} className={'mk-swipe ' + leaving} key={m.id}>
          <img src={photoUrl(m.photo)} alt={m.name} />
          <div className="mk-swipe-b">
            <h2>{m.name}, {m.age}</h2>
            <p>{m.job && <span><Icon name="briefcase" size={13} /> {m.job}</span>}{m.city && <span><Icon name="pin" size={13} /> {m.city}</span>}</p>
            <div className="mk-swipe-tags">{(m.interests || []).slice(0, 4).map((x) => <span key={x}>{x}</span>)}</div>
          </div>
        </Link>
        <div className="mk-swipe-a">
          <button className="pass" onClick={pass} aria-label="Pass"><Icon name="x" size={24} /></button>
          <button className="star" onClick={() => nav('/app/members/' + m.id)} aria-label="View profile"><Icon name="star" size={24} fill="currentColor" stroke={0} /></button>
          <button className="like" onClick={like} aria-label="Like"><Icon name="heart" size={26} fill="currentColor" stroke={0} /></button>
          <button className="save" onClick={save} aria-label="Save for later"><Icon name="bookmark" size={20} /></button>
        </div>
      </>) : (
        <div className="empty card"><Icon name="heart" size={32} /><h3>You've seen everyone for now</h3><p className="muted">New members join every week. Check back soon.</p><button className="btn primary" onClick={() => { setGone(new Set()); reload() }}>Refresh</button></div>
      )}
      {pop && (
        <div className="match-pop" onClick={() => setPop(null)}>
          <div className="match-card">
            <div className="hearts"><img src={photoUrl(me.photo)} alt="" /><img src={photoUrl(pop.photo)} alt="" /></div>
            <h2>It's a match!</h2><p>You and {pop.name} liked each other.</p>
            <button className="btn primary" onClick={() => nav('/app/messages/' + pop.id)}>Say bonjou</button>
          </div>
        </div>
      )}
    </div>
  )
}

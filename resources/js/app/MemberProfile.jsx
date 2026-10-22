import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon } from '../components/ui.jsx'
import { MEMBERS, member } from '../data.js'

export default function MemberProfile() {
  const { id } = useParams()
  const m = member(id)
  const { t } = useI18n()
  const { liked, like, blocked, unblock, setSafety, openThread, toast } = useStore()
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  if (!m) return <div className="page"><div className="empty card"><h3>Member not found</h3><Link to="/app/discover" className="btn primary">Back to Discover</Link></div></div>
  const isBlocked = blocked.includes(m.id)
  const isLiked = liked.includes(m.id)
  const similar = MEMBERS.filter((x) => x.id !== m.id && x.gender === m.gender && !blocked.includes(x.id)).slice(0, 3)
  return (
    <div className="page">
      <button className="back-link" onClick={() => nav(-1)}><Icon name="back" size={16} /> Back</button>
      {isBlocked ? (
        <div className="empty card"><Icon name="ban" size={34} /><h3>You blocked {m.name}</h3><p className="muted">They can't see your profile or message you.</p><button className="btn ghost" onClick={() => { unblock(m.id); toast(`${m.name} unblocked`) }}>Unblock</button></div>
      ) : (
        <div className="prof">
          <div className="prof-photo card">
            <img src={'/img/' + m.photo} alt={m.name} />
            {m.online && <span className="mcard-on"><i /> Online now</span>}
          </div>
          <div className="prof-body">
            <div className="card prof-main">
              <div className="prof-h">
                <div><h1>{m.name}, {m.age} {m.verified && <Icon name="verified" size={22} className="vf" />}</h1>
                  <p className="muted"><Icon name="pin" size={14} /> {m.city} · {m.job}</p></div>
                <div className="menu-wrap">
                  <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="More actions"><Icon name="more" /></button>
                  {menu && (<div className="dropdown menu" onMouseLeave={() => setMenu(false)}>
                    <button onClick={() => { setMenu(false); setSafety({ mode: 'report', id: m.id }) }}><Icon name="flag" size={16} /> {t('btn.report')} {m.name}</button>
                    <button className="danger-t" onClick={() => { setMenu(false); setSafety({ mode: 'block', id: m.id }) }}><Icon name="ban" size={16} /> {t('btn.block')} {m.name}</button>
                  </div>)}
                </div>
              </div>
              <div className="match-bar"><span>{m.match}% match</span><div className="bar"><i style={{ width: m.match + '%' }} /></div><span className="muted small">Shared: {m.interests.filter((x) => ['Kompa', 'Travel', 'Cooking', 'Books'].includes(x)).join(', ') || 'Kreyòl'}</span></div>
              <h4>About</h4><p>{m.bio}</p>
              <h4>Interests</h4><div className="chips">{m.interests.map((x) => <span key={x} className="chip on">{x}</span>)}</div>
              <h4>Languages</h4><div className="chips">{m.langs.map((x) => <span key={x} className="chip"><Icon name="globe" size={12} /> {x}</span>)}</div>
              <div className="prof-a">
                <button className={'btn lg ' + (isLiked ? 'liked-btn' : 'red')} onClick={() => { like(m.id); toast(`You liked ${m.name}`) }}><Icon name="heart" size={18} fill="currentColor" stroke={0} /> {isLiked ? 'Liked' : t('btn.like')}</button>
                <button className="btn primary lg" onClick={() => nav('/app/messages/' + openThread(m.id))}><Icon name="chat" size={18} /> {t('btn.message')}</button>
              </div>
            </div>
            <div className="card safety-mini">
              <Icon name="shield" size={20} /><div><b>Feel unsafe?</b><span>Blocking is instant and anonymous. Reports reach a moderator within 24h.</span></div>
              <button className="btn ghost sm" onClick={() => setSafety({ mode: 'report', id: m.id })}>{t('btn.report')}</button>
              <button className="btn ghost sm danger-t" onClick={() => setSafety({ mode: 'block', id: m.id })}>{t('btn.block')}</button>
            </div>
            <div className="card">
              <h4 className="mt0">You might also like</h4>
              <div className="similar">{similar.map((s) => <Link key={s.id} to={'/app/members/' + s.id} className="sim"><img src={'/img/' + s.photo} alt="" /><b>{s.name}, {s.age}</b><span>{s.city}</span></Link>)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

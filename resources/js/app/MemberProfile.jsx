import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

export default function MemberProfile() {
  const { id } = useParams()
  const { t } = useI18n()
  const { setSafety, toast } = useStore()
  const nav = useNavigate()
  const { data, loading, error, reload } = useApi('/members/' + id)
  const m = data?.member
  const [liked, setLiked] = useState(false)
  const [menu, setMenu] = useState(false)

  if (loading) return <div className="page"><div className="gate-wait" aria-busy="true" style={{ minHeight: 240 }} /></div>
  if (error || !m) return <div className="page"><div className="empty card"><h3>Member not found</h3><p className="muted">They may have left or be unavailable.</p><Link to="/app/discover" className="btn primary">Back to Discover</Link></div></div>

  const isLiked = liked || m.liked
  const doLike = async () => { setLiked(true); try { const r = await api('/members/' + m.id + '/like', { method: 'POST' }); toast(r.matched ? `It's a match with ${m.name}! 💙` : `You liked ${m.name}`) } catch (e) { toast(e.message, 'err') } }
  const shared = (m.interests || []).filter((x) => (m.interests || []).includes(x)).slice(0, 3)

  return (
    <div className="page">
      <button className="back-link" onClick={() => nav(-1)}><Icon name="back" size={16} /> Back</button>
      <div className="prof">
        <div className="prof-photo card">
          <img src={photoUrl(m.photo)} alt={m.name} />
          {m.online && <span className="mcard-on"><i /> Online now</span>}
        </div>
        <div className="prof-body">
          <div className="card prof-main">
            <div className="prof-h">
              <div><h1>{m.name}, {m.age} {m.verified && <Icon name="verified" size={22} className="vf" />}</h1>
                <p className="muted"><Icon name="pin" size={14} /> {m.city}{m.job ? ' · ' + m.job : ''}</p></div>
              <div className="menu-wrap">
                <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="More actions"><Icon name="more" /></button>
                {menu && (<div className="dropdown menu" onMouseLeave={() => setMenu(false)}>
                  <button onClick={() => { setMenu(false); setSafety({ mode: 'report', member: m }) }}><Icon name="flag" size={16} /> {t('btn.report')} {m.name}</button>
                  <button className="danger-t" onClick={() => { setMenu(false); setSafety({ mode: 'block', member: m, after: () => nav('/app/discover') }) }}><Icon name="ban" size={16} /> {t('btn.block')} {m.name}</button>
                </div>)}
              </div>
            </div>
            <div className="match-bar"><span>{m.match}% match</span><div className="bar"><i style={{ width: m.match + '%' }} /></div><span className="muted small">{m.matched ? 'You matched 💙' : 'Like to connect'}</span></div>
            {m.bio && <><h4>About</h4><p>{m.bio}</p></>}
            {(m.interests || []).length > 0 && <><h4>Interests</h4><div className="chips">{m.interests.map((x) => <span key={x} className="chip on">{x}</span>)}</div></>}
            {(m.langs || []).length > 0 && <><h4>Languages</h4><div className="chips">{m.langs.map((x) => <span key={x} className="chip"><Icon name="globe" size={12} /> {x}</span>)}</div></>}
            <div className="prof-a">
              <button className={'btn lg ' + (isLiked ? 'liked-btn' : 'red')} onClick={doLike}><Icon name="heart" size={18} fill="currentColor" stroke={0} /> {isLiked ? 'Liked' : t('btn.like')}</button>
              <button className="btn primary lg" onClick={() => nav('/app/messages/' + m.id)}><Icon name="chat" size={18} /> {t('btn.message')}</button>
            </div>
          </div>
          <div className="card safety-mini">
            <Icon name="shield" size={20} /><div><b>Feel unsafe?</b><span>Blocking is instant and anonymous. Reports reach a moderator within 24h.</span></div>
            <button className="btn ghost sm" onClick={() => setSafety({ mode: 'report', member: m })}>{t('btn.report')}</button>
            <button className="btn ghost sm danger-t" onClick={() => setSafety({ mode: 'block', member: m, after: () => nav('/app/discover') })}>{t('btn.block')}</button>
          </div>
          {(m.similar || []).length > 0 && (
            <div className="card">
              <h4 className="mt0">You might also like</h4>
              <div className="similar">{m.similar.map((s) => <Link key={s.id} to={'/app/members/' + s.id} className="sim"><img src={photoUrl(s.photo)} alt="" /><b>{s.name}, {s.age}</b><span>{s.city}</span></Link>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

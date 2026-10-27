import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

const POST_CATS = ['All', 'Housing', 'Jobs', 'Events', 'Food', 'Advice', 'Business']
const CAT_EMOJI = { Housing: '🏠', Jobs: '💼', Events: '🎉', Food: '🍲', Advice: '💬', Business: '🏪' }

function Composer({ onPosted }) {
  const { me, toast } = useStore()
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [cat, setCat] = useState('Advice')
  const [img, setImg] = useState(null) // data URL
  const [focus, setFocus] = useState(false)
  const [busy, setBusy] = useState(false)

  const loadImg = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) return toast('That image is over 8 MB', 'err')
    const r = new FileReader(); r.onload = () => setImg(r.result); r.readAsDataURL(file)
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const r = await api('/posts', { method: 'POST', body: { body: text.trim(), category: cat.toLowerCase(), image: img } })
      setText(''); setImg(null); setFocus(false)
      toast(r.post.status === 'pending' ? 'Posted — a moderator will review it shortly' : 'Posted to the kominote 🎉')
      onPosted?.(r.post)
    } catch (err) { toast(err.message, 'err') } finally { setBusy(false) }
  }
  return (
    <form className={'card composer-post' + (focus || text ? ' open' : '')} onSubmit={submit}>
      <div className="cp-top"><Avatar src={me.photo} size={40} /><textarea rows={focus || text ? 3 : 1} value={text} onFocus={() => setFocus(true)} onChange={(e) => setText(e.target.value)} placeholder={`Sak pase, ${me.name}? Share housing, jobs, food, events…`} maxLength={1000} /></div>
      {img && <div className="cp-img"><img src={img} alt="Upload preview" /><button type="button" className="icon-btn" onClick={() => setImg(null)} aria-label="Remove image"><Icon name="x" size={16} /></button></div>}
      <div className="cp-bar">
        <div className="cp-cats">{POST_CATS.slice(1).map((c) => <button type="button" key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{CAT_EMOJI[c]} {c}</button>)}</div>
        <div className="row-g">
          <label className="icon-btn" title="Add image"><Icon name="image" /><input type="file" accept="image/*" hidden onChange={(e) => loadImg(e.target.files?.[0])} /></label>
          <span className="muted small">{text.length}/1000</span>
          <button className="btn primary sm" disabled={!text.trim() || busy}>{t('btn.post')}</button>
        </div>
      </div>
    </form>
  )
}

function Comments({ postId, onCount }) {
  const { me, toast } = useStore()
  const { data, setData } = useApi('/posts/' + postId + '/comments')
  const comments = data?.comments ?? []
  const [text, setText] = useState('')
  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const r = await api('/posts/' + postId + '/comments', { method: 'POST', body: { body: text.trim() } })
      setData({ comments: [...comments, r.comment] }); setText(''); onCount?.(r.count)
    } catch (err) { toast(err.message, 'err') }
  }
  return (
    <div className="comments">
      {comments.map((c) => (
        <div key={c.id} className="comment"><Avatar src={c.photo} size={30} /><div className="comment-b"><b>{c.author}</b> <span className="muted small">{c.time}</span><p>{c.text}</p></div></div>
      ))}
      <form className="comment-add" onSubmit={add}>
        <Avatar src={me.photo} size={30} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" maxLength={500} />
        <button className="btn primary xs" disabled={!text.trim()}><Icon name="send" size={14} /></button>
      </form>
    </div>
  )
}

export default function Community() {
  const { t } = useI18n()
  const { setSafety } = useStore()
  const { data, setData, loading } = useApi('/posts')
  const { data: evData, reload: reloadEv } = useApi('/events')
  const posts = data?.posts ?? []
  const events = evData?.events ?? []
  const [cat, setCat] = useState('All')
  const [menu, setMenu] = useState(null)
  const [openComments, setOpenComments] = useState(null)

  const list = posts.filter((p) => (p.status === 'approved' || p.status === 'pending') && (cat === 'All' || p.cat === cat))

  const update = (id, patch) => setData({ posts: posts.map((p) => p.id === id ? { ...p, ...patch } : p) })
  const toggleLike = async (p) => {
    update(p.id, { liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) })
    try { await api('/posts/' + p.id + '/like', { method: 'POST' }) } catch {}
  }
  const rsvp = async (ev) => { try { await api('/events/' + ev.id + '/rsvp', { method: 'POST' }); reloadEv() } catch {} }

  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('h.community')}</h1><p className="muted">Housing, jobs, food and advice from the kominote — moderated and spam-free.</p></div></div>
      <div className="com-layout">
        <div className="feed">
          <div className="cat-tabs">{POST_CATS.map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c !== 'All' && CAT_EMOJI[c] + ' '}{c}</button>)}</div>
          <Composer onPosted={(post) => setData({ posts: [post, ...posts] })} />
          {loading && <div className="gate-wait" aria-busy="true" style={{ minHeight: 120 }} />}
          {!loading && list.length === 0 && <div className="empty card"><h3>No {cat.toLowerCase()} posts yet</h3><p className="muted">Be the first to post in {cat}.</p></div>}
          {list.map((p) => { const a = p.author; return (
            <article key={p.id} className="card post">
              <div className="post-h">
                <Avatar src={a.photo} size={42} />
                <div><b>{a.name} {a.verified && <Icon name="verified" size={13} className="vf" />}</b><span>{a.city} · {p.time}</span></div>
                <span className={'tag cat-' + p.cat.toLowerCase()}>{CAT_EMOJI[p.cat]} {p.cat}</span>
                {p.status === 'pending' && <span className="tag" style={{ marginLeft: 6 }}>Pending review</span>}
                <div className="menu-wrap">
                  <button className="icon-btn" onClick={() => setMenu(menu === p.id ? null : p.id)} aria-label="Post options"><Icon name="more" /></button>
                  {menu === p.id && <div className="dropdown menu" onMouseLeave={() => setMenu(null)}>
                    <button onClick={() => { setMenu(null); setSafety({ mode: 'report', member: a, context: 'post' }) }}><Icon name="flag" size={16} /> Report post</button>
                    <button className="danger-t" onClick={() => { setMenu(null); setSafety({ mode: 'block', member: a }) }}><Icon name="ban" size={16} /> Block {a.name}</button>
                  </div>}
                </div>
              </div>
              <p className="post-t">{p.text}</p>
              {p.image && <img className="post-img" src={photoUrl(p.image)} alt="" loading="lazy" />}
              <div className="post-f">
                <button className={p.liked ? 'liked' : ''} onClick={() => toggleLike(p)}><Icon name="heart" size={16} fill={p.liked ? 'currentColor' : 'none'} /> {p.likes}</button>
                <button className={openComments === p.id ? 'liked' : ''} onClick={() => setOpenComments(openComments === p.id ? null : p.id)}><Icon name="chat" size={16} /> {p.comments} comments</button>
                <button onClick={() => { navigator.clipboard?.writeText(location.origin + '/app/community'); }}><Icon name="send" size={16} /> Share</button>
              </div>
              {openComments === p.id && <Comments postId={p.id} onCount={(n) => update(p.id, { comments: n })} />}
            </article>
          ) })}
        </div>
        <aside className="com-side">
          <div className="card">
            <div className="row-b"><h4 className="mt0">Upcoming events</h4><Link to="/app/events" className="link-s">See all</Link></div>
            {events.slice(0, 3).map((e) => (
              <div key={e.id} className="ev-mini"><img src={photoUrl(e.image)} alt="" /><div><b>{e.title}</b><span>{e.date} · {e.city}</span></div>
                <button className={'btn xs ' + (e.mine ? 'success' : 'ghost')} onClick={() => rsvp(e)}>{e.mine ? <Icon name="check" size={13} /> : 'RSVP'}</button></div>
            ))}
            {events.length === 0 && <p className="muted small">No events yet.</p>}
          </div>
          <div className="card guide">
            <h4 className="mt0"><Icon name="shield" size={16} /> Kominote guidelines</h4>
            <ol><li>Respè — be kind, always.</li><li>No scams, money requests or MLM.</li><li>Housing & job posts must be real.</li><li>Report anything that feels off.</li></ol>
          </div>
        </aside>
      </div>
    </div>
  )
}

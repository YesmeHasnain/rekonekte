import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon, Modal, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'
import { EventCard, useRsvp } from './Events.jsx'

const POST_CATS = ['All', 'Housing', 'Jobs', 'Events', 'Food', 'Advice', 'Business', 'Services', 'Travel', 'Culture']
const CAT_EMOJI = { Housing: '🏠', Jobs: '💼', Events: '🎉', Food: '🍲', Advice: '💬', Business: '🏪', Services: '🛠️', Travel: '✈️', Culture: '🎨' }

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
      <div className="cp-top"><Avatar src={me.photo} size={40} /><div className="cp-field"><b>Create Post</b><textarea id="mk-new-post" rows={focus || text ? 3 : 1} value={text} onFocus={() => setFocus(true)} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" maxLength={1000} /></div></div>
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

function GroupCard({ g, onJoin }) {
  return (
    <article className="mk-group">
      <img src={photoUrl(g.image)} alt="" loading="lazy" />
      <div><b>{g.name}</b><span>{g.members.toLocaleString()} {g.members === 1 ? 'member' : 'members'}</span>
        <button className={'mk-pill-btn' + (g.joined ? ' on' : '')} onClick={() => onJoin(g)}>{g.joined ? 'Joined' : 'Join'}</button></div>
    </article>
  )
}

function NewGroup({ onClose, onCreated }) {
  const { toast } = useStore()
  const [f, setF] = useState({ name: '', description: '' })
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try { const r = await api('/groups', { method: 'POST', body: f }); toast('Group created'); onCreated(r.group) }
    catch (x) { toast(x.message, 'err') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={save}>
      <label className="field"><span>Group name</span><input required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="field"><span>Description</span><textarea rows={3} maxLength={300} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="modal-f"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>Create Group</button></div>
    </form>
  )
}

const TABS = [['home', 'Home'], ['groups', 'Groups'], ['posts', 'Posts'], ['events', 'Events']]

export default function Community() {
  const { t } = useI18n()
  const { setSafety, toast } = useStore()
  const [sp, setSp] = useSearchParams()
  const { data, setData, loading } = useApi('/posts')
  const { data: evData, setData: setEvData } = useApi('/events')
  const { data: grData, setData: setGrData } = useApi('/groups')
  const posts = data?.posts ?? []
  const events = evData?.events ?? []
  const groups = grData?.groups ?? []
  const tab = sp.get('tab') || (window.innerWidth <= 720 ? 'posts' : 'home')
  const catParam = (sp.get('cat') || '').toLowerCase()
  const cat = POST_CATS.find((c) => c.toLowerCase() === catParam) || 'All'
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(null)
  const [openComments, setOpenComments] = useState(null)
  const [creating, setCreating] = useState(false)
  const rsvp = useRsvp(events, setEvData)

  const list = posts.filter((p) => (p.status === 'approved' || p.status === 'pending') && (cat === 'All' || p.cat === cat))
  const shown = groups.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()))
  const go = (next) => setSp({ tab: next })
  const setCat = (c) => setSp(c === 'All' ? { tab: 'posts' } : { tab: 'posts', cat: c.toLowerCase() })

  const update = (id, patch) => setData({ posts: posts.map((p) => p.id === id ? { ...p, ...patch } : p) })
  const toggleLike = async (p) => {
    update(p.id, { liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) })
    try { await api('/posts/' + p.id + '/like', { method: 'POST' }) } catch {}
  }
  const joinGroup = async (g) => {
    try {
      const r = await api('/groups/' + g.id + '/join', { method: 'POST' })
      setGrData({ groups: groups.map((x) => x.id === g.id ? { ...x, joined: r.joined, members: r.members } : x) })
    } catch (x) { toast(x.message, 'err') }
  }

  const tools = (
    <div className="mk-tools">
      <label><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups..." aria-label="Search groups" /></label>
      <button className="mk-btn fill" onClick={() => setCreating(true)}>Create Group</button>
    </div>
  )

  return (
    <div className="page mk-page mk-comm">
      <h1 className="mk-h1">{t('side.community')}</h1>
      <div className="mk-tabs">{TABS.map(([v, l]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => go(v)}>{l}</button>)}</div>
      <div className="mk-mtabs">{[['posts', 'All'], ['groups', 'Groups'], ['home', 'Featured'], ['events', 'Events']].map(([v, l]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => go(v)}>{l}</button>)}</div>

      {tab === 'home' && (<>
        {tools}
        <div className="mk-sec"><h2>Featured Groups</h2></div>
        <div className="mk-groups">{shown.slice(0, 4).map((g) => <GroupCard key={g.id} g={g} onJoin={joinGroup} />)}</div>
        <div className="mk-sec"><h2>Upcoming Events</h2><Link to="/app/events">View All</Link></div>
        <div className="mk-evgrid">{events.slice(0, 3).map((e) => <EventCard key={e.id} e={e} onRsvp={rsvp} />)}</div>
        {events.length === 0 && <p className="muted small">No events yet.</p>}
      </>)}

      {tab === 'groups' && (<>
        {tools}
        <div className="mk-groups">{shown.map((g) => <GroupCard key={g.id} g={g} onJoin={joinGroup} />)}</div>
        {shown.length === 0 && <div className="empty card"><h3>No groups found</h3><p className="muted">Start one for your kominote.</p></div>}
      </>)}

      {tab === 'events' && (<>
        <div className="mk-evgrid tall">{events.map((e) => <EventCard key={e.id} e={e} onRsvp={rsvp} />)}</div>
        {events.length === 0 && <p className="muted small">No events yet.</p>}
      </>)}

      {tab === 'posts' && (
        <div className="feed mk-feed">
          <div className={'mk-chips cat-row' + (cat === 'All' ? ' quiet' : '')}>{POST_CATS.map((c) => <button key={c} className={'mk-chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
          <Composer onPosted={(post) => setData({ posts: [post, ...posts] })} />
          {loading && <div className="gate-wait" aria-busy="true" style={{ minHeight: 120 }} />}
          {!loading && list.length === 0 && <div className="empty card"><h3>No {cat === 'All' ? '' : cat.toLowerCase() + ' '}posts yet</h3><p className="muted">Be the first to post{cat === 'All' ? '' : ' in ' + cat}.</p></div>}
          {list.map((p) => { const a = p.author; return (
            <article key={p.id} className="card post">
              <div className="post-h">
                <Avatar src={a.photo} size={42} />
                <div><b>{a.name} {a.verified && <Icon name="verified" size={13} className="vf" />}</b><span>{a.city} · {p.time}</span></div>
                <span className={'tag cat-' + p.cat.toLowerCase()}>{p.cat}</span>
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
                <button className={openComments === p.id ? 'liked' : ''} onClick={() => setOpenComments(openComments === p.id ? null : p.id)}><Icon name="chat" size={16} /> {p.comments}</button>
                <button onClick={() => { navigator.clipboard?.writeText(location.origin + '/app/community?tab=posts'); toast('Link copied') }}><Icon name="send" size={16} /> Share</button>
              </div>
              {openComments === p.id && <Comments postId={p.id} onCount={(n) => update(p.id, { comments: n })} />}
            </article>
          ) })}
        </div>
      )}
      {tab === 'posts' && <button className="mk-fab" onClick={() => document.getElementById('mk-new-post')?.focus()} aria-label="Create post"><Icon name="plus" size={24} /></button>}
      <Modal open={creating} onClose={() => setCreating(false)} title="Create Group">
        {creating && <NewGroup onClose={() => setCreating(false)} onCreated={(g) => { setGrData({ groups: [...groups, g] }); setCreating(false); go('groups') }} />}
      </Modal>
    </div>
  )
}

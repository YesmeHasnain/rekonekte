import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon } from '../components/ui.jsx'
import { EVENTS, POST_CATS, member } from '../data.js'

const CAT_EMOJI = { Housing: '🏠', Jobs: '💼', Events: '🎉', Food: '🍲', Advice: '💬', Business: '🏪' }

function Composer() {
  const { me, addPost, toast } = useStore()
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [cat, setCat] = useState('Advice')
  const [img, setImg] = useState(null)
  const [focus, setFocus] = useState(false)
  return (
    <form className={'card composer-post' + (focus || text ? ' open' : '')} onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addPost({ text: text.trim(), cat, image: img }); setText(''); setImg(null); setFocus(false); toast('Posted to the kominote 🎉') }}>
      <div className="cp-top"><Avatar src={me.photo} size={40} /><textarea rows={focus || text ? 3 : 1} value={text} onFocus={() => setFocus(true)} onChange={(e) => setText(e.target.value)} placeholder={`Sak pase, ${me.name}? Share housing, jobs, food, events…`} maxLength={500} /></div>
      {img && <div className="cp-img"><img src={img} alt="Upload preview" /><button type="button" className="icon-btn" onClick={() => setImg(null)} aria-label="Remove image"><Icon name="x" size={16} /></button></div>}
      <div className="cp-bar">
        <div className="cp-cats">{POST_CATS.slice(1).map((c) => <button type="button" key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{CAT_EMOJI[c]} {c}</button>)}</div>
        <div className="row-g">
          <label className="icon-btn" title="Add image"><Icon name="image" /><input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)) }} /></label>
          <span className="muted small">{text.length}/500</span>
          <button className="btn primary sm" disabled={!text.trim()}>{t('btn.post')}</button>
        </div>
      </div>
    </form>
  )
}

export default function Community() {
  const { t } = useI18n()
  const { posts, me, blocked, setSafety, going, toggleGoing } = useStore()
  const [cat, setCat] = useState('All')
  const [likes, setLikes] = useState({})
  const [menu, setMenu] = useState(null)
  const list = posts.filter((p) => p.status === 'approved' && !blocked.includes(p.author) && (cat === 'All' || p.cat === cat))
  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('h.community')}</h1><p className="muted">Housing, jobs, food and advice from the kominote — moderated and spam-free.</p></div></div>
      <div className="com-layout">
        <div className="feed">
          <div className="cat-tabs">{POST_CATS.map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c !== 'All' && CAT_EMOJI[c] + ' '}{c}</button>)}</div>
          <Composer />
          {list.length === 0 && <div className="empty card"><h3>No {cat.toLowerCase()} posts yet</h3><p className="muted">Be the first to post in {cat}.</p></div>}
          {list.map((p) => { const a = p.author === 'me' ? me : member(p.author); const l = likes[p.id]; return (
            <article key={p.id} className="card post">
              <div className="post-h">
                <Avatar src={a.photo} size={42} />
                <div><b>{a.name} {a.verified && <Icon name="verified" size={13} className="vf" />}</b><span>{a.city} · {p.time}</span></div>
                <span className={'tag cat-' + p.cat.toLowerCase()}>{CAT_EMOJI[p.cat]} {p.cat}</span>
                {p.author !== 'me' && <div className="menu-wrap">
                  <button className="icon-btn" onClick={() => setMenu(menu === p.id ? null : p.id)} aria-label="Post options"><Icon name="more" /></button>
                  {menu === p.id && <div className="dropdown menu" onMouseLeave={() => setMenu(null)}>
                    <button onClick={() => { setMenu(null); setSafety({ mode: 'report', id: p.author, context: 'post' }) }}><Icon name="flag" size={16} /> Report post</button>
                    <button className="danger-t" onClick={() => { setMenu(null); setSafety({ mode: 'block', id: p.author }) }}><Icon name="ban" size={16} /> Block {a.name}</button>
                  </div>}
                </div>}
              </div>
              <p className="post-t">{p.text}</p>
              {p.image && <img className="post-img" src={p.image.startsWith('blob:') ? p.image : '/img/' + p.image} alt="" loading="lazy" />}
              <div className="post-f">
                <button className={l ? 'liked' : ''} onClick={() => setLikes((x) => ({ ...x, [p.id]: !x[p.id] }))}><Icon name="heart" size={16} fill={l ? 'currentColor' : 'none'} /> {p.likes + (l ? 1 : 0)}</button>
                <button><Icon name="chat" size={16} /> {p.comments} comments</button>
                <button><Icon name="send" size={16} /> Share</button>
              </div>
            </article>
          ) })}
        </div>
        <aside className="com-side">
          <div className="card">
            <div className="row-b"><h4 className="mt0">Upcoming events</h4><Link to="/app/events" className="link-s">See all</Link></div>
            {EVENTS.slice(0, 3).map((e) => (
              <div key={e.id} className="ev-mini"><img src={'/img/' + e.image} alt="" /><div><b>{e.title}</b><span>{e.date} · {e.city}</span></div>
                <button className={'btn xs ' + (going.includes(e.id) ? 'success' : 'ghost')} onClick={() => toggleGoing(e.id)}>{going.includes(e.id) ? <Icon name="check" size={13} /> : 'RSVP'}</button></div>
            ))}
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

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon } from '../components/ui.jsx'
import { member } from '../data.js'

const REPLIES = ['Haha mèsi! 😄', 'That sounds perfect — let\'s do it.', 'Sak pase with you today?', 'I\'m free Saturday afternoon!', 'You\'re funny, I like that 💙']

export default function Messages() {
  const { threadId } = useParams()
  const { t } = useI18n()
  const { threads, send, receive, markRead, blocked, setSafety, toast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [menu, setMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
    const body = useRef(null)
  const visible = threads.filter((x) => !blocked.includes(x.with))
  const list = visible.filter((x) => member(x.with).name.toLowerCase().includes(q.toLowerCase()))
  const th = visible.find((x) => x.id === threadId)
  const m = th && member(th.with)
  useEffect(() => { if (th?.unread) markRead(th.id) }, [threadId]) // eslint-disable-line
  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight }, [th?.messages.length, threadId])

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      if (th && th.messages.length && th.messages[th.messages.length - 1].from === 'me') {
        receive(th.id, th.with, REPLIES[th.messages.length % REPLIES.length])
      } else toast('No new messages', 'info')
    }, 700)
  }

  return (
    <div className={'page msgs' + (th ? ' has-thread' : '')}>
      <div className="inbox card">
        <div className="inbox-h"><h1>{t('h.messages')}</h1><span className="muted small">{visible.reduce((a, x) => a + x.unread, 0)} unread</span></div>
        <label className="search-in"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" /></label>
        <div className="inbox-list">
          {list.map((x) => { const p = member(x.with); const last = x.messages[x.messages.length - 1]; return (
            <Link key={x.id} to={'/app/messages/' + x.id} className={'ib-row' + (x.id === threadId ? ' on' : '') + (x.unread ? ' unread' : '')}>
              <Avatar src={p.photo} size={44} online={p.online} />
              <div className="ib-t"><div><b>{p.name}</b><span>{last?.at || 'New'}</span></div><p>{last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Start the conversation — say bonjou!'}</p></div>
              {x.unread > 0 && <em className="count">{x.unread}</em>}
            </Link>
          ) })}
          {list.length === 0 && <p className="muted small pad">No conversations found.</p>}
        </div>
      </div>

      <div className="thread card">
        {!th ? (
          <div className="empty"><Icon name="chat" size={36} /><h3>Pick a conversation</h3><p className="muted">Or find someone new in <Link to="/app/discover">Discover</Link>.</p></div>
        ) : (<>
          <div className="th-h">
            <button className="icon-btn th-back" onClick={() => nav('/app/messages')} aria-label="Back"><Icon name="back" /></button>
            <Link to={'/app/members/' + m.id} className="th-who"><Avatar src={m.photo} size={40} online={m.online} /><div><b>{m.name} {m.verified && <Icon name="verified" size={14} className="vf" />}</b><span>{m.online ? 'Online' : 'Last seen today'} · {m.city}</span></div></Link>
            <button className={'icon-btn' + (refreshing ? ' spin' : '')} onClick={refresh} aria-label="Refresh" title="Refresh for new messages"><Icon name="live" /></button>
            <div className="menu-wrap">
              <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="More"><Icon name="more" /></button>
              {menu && <div className="dropdown menu" onMouseLeave={() => setMenu(false)}>
                <Link to={'/app/members/' + m.id}><Icon name="user" size={16} /> View profile</Link>
                <button onClick={() => { setMenu(false); setSafety({ mode: 'report', id: m.id, context: 'message' }) }}><Icon name="flag" size={16} /> {t('btn.report')}</button>
                <button className="danger-t" onClick={() => { setMenu(false); setSafety({ mode: 'block', id: m.id, after: () => nav('/app/messages') }) }}><Icon name="ban" size={16} /> {t('btn.block')}</button>
              </div>}
            </div>
          </div>
          <div className="th-body" ref={body}>
            <div className="th-intro"><Avatar src={m.photo} size={64} /><b>{m.name}</b><span className="muted small">You matched · {m.match}% · {m.city}</span></div>
            {th.messages.map((x, i) => (
              <div key={i} className={'msg ' + (x.from === 'me' ? 'me' : 'them')}>
                <div className="bub">{x.text}</div>
                {x.from !== 'me' && <button className="msg-flag" onClick={() => setSafety({ mode: 'report', id: m.id, context: 'message' })} title="Report message" aria-label="Report message"><Icon name="flag" size={13} /></button>}
                <span className="msg-at">{x.at}{x.from === 'me' && i === th.messages.length - 1 ? ' · Delivered' : ''}</span>
              </div>
            ))}
          </div>
          <div className="th-note"><Icon name="live" size={13} /> Messages arrive when you refresh — real-time chat is coming in a later phase.</div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; send(th.id, draft.trim()); setDraft('') }}>
            <button type="button" className="icon-btn" aria-label="Add photo" onClick={() => toast('Photo messages arrive in Phase 2', 'info')}><Icon name="image" /></button>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${m.name}…`} aria-label="Message" />
            <button className="btn primary" disabled={!draft.trim()}><Icon name="send" size={16} /> <span className="hide-s">{t('btn.send')}</span></button>
          </form>
        </>)}
      </div>
    </div>
  )
}

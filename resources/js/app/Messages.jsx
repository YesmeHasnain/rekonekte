import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

export default function Messages() {
  const { threadId: peerId } = useParams()
  const { t } = useI18n()
  const { setSafety, toast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [menu, setMenu] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const body = useRef(null)

  const { data: inbox, reload: reloadInbox } = useApi('/threads')
  const { data: threadData, reload: reloadThread } = useApi(peerId ? '/threads/' + peerId : null, { skip: !peerId })
  const threads = inbox?.threads ?? []
  const th = threadData?.thread
  const m = th?.peer

  const list = threads.filter((x) => x.peer.name.toLowerCase().includes(q.toLowerCase()))
  const unreadTotal = threads.reduce((a, x) => a + x.unread, 0)

  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight }, [th?.messages?.length, peerId])
  useEffect(() => { if (peerId && th) reloadInbox() }, [th]) // eslint-disable-line

  const refresh = async () => { setRefreshing(true); await reloadThread(); await reloadInbox(); setTimeout(() => setRefreshing(false), 400) }

  const sendMsg = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true); setDraft('')
    try { await api('/threads/' + peerId, { method: 'POST', body: { body: text } }); await reloadThread(); reloadInbox() }
    catch (err) { toast(err.message, 'err'); setDraft(text) }
    finally { setSending(false) }
  }

  return (
    <div className={'page msgs' + (peerId ? ' has-thread' : '')}>
      <div className="inbox card">
        <div className="inbox-h"><h1>{t('h.messages')}</h1><span className="muted small">{unreadTotal} unread</span></div>
        <label className="search-in"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" /></label>
        <div className="inbox-list">
          {list.map((x) => { const p = x.peer; const last = x.messages[x.messages.length - 1]; return (
            <Link key={x.id} to={'/app/messages/' + p.id} className={'ib-row' + (String(p.id) === String(peerId) ? ' on' : '') + (x.unread ? ' unread' : '')}>
              <Avatar src={p.photo} size={44} online={p.online} />
              <div className="ib-t"><div><b>{p.name}</b><span>{last?.at || 'New'}</span></div><p>{last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Start the conversation — say bonjou!'}</p></div>
              {x.unread > 0 && <em className="count">{x.unread}</em>}
            </Link>
          ) })}
          {list.length === 0 && <p className="muted small pad">No conversations yet. Find someone in <Link to="/app/discover">Discover</Link>.</p>}
        </div>
      </div>

      <div className="thread card">
        {!peerId ? (
          <div className="empty"><Icon name="chat" size={36} /><h3>Pick a conversation</h3><p className="muted">Or find someone new in <Link to="/app/discover">Discover</Link>.</p></div>
        ) : !m ? (
          <div className="gate-wait" aria-busy="true" style={{ minHeight: 200 }} />
        ) : (<>
          <div className="th-h">
            <button className="icon-btn th-back" onClick={() => nav('/app/messages')} aria-label="Back"><Icon name="back" /></button>
            <Link to={'/app/members/' + m.id} className="th-who"><Avatar src={m.photo} size={40} online={m.online} /><div><b>{m.name} {m.verified && <Icon name="verified" size={14} className="vf" />}</b><span>{m.online ? 'Online' : 'Last seen recently'} · {m.city}</span></div></Link>
            <button className={'icon-btn' + (refreshing ? ' spin' : '')} onClick={refresh} aria-label="Refresh" title="Refresh for new messages"><Icon name="live" /></button>
            <div className="menu-wrap">
              <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="More"><Icon name="more" /></button>
              {menu && <div className="dropdown menu" onMouseLeave={() => setMenu(false)}>
                <Link to={'/app/members/' + m.id}><Icon name="user" size={16} /> View profile</Link>
                <button onClick={() => { setMenu(false); setSafety({ mode: 'report', member: m, context: 'message' }) }}><Icon name="flag" size={16} /> {t('btn.report')}</button>
                <button className="danger-t" onClick={() => { setMenu(false); setSafety({ mode: 'block', member: m, after: () => nav('/app/messages') }) }}><Icon name="ban" size={16} /> {t('btn.block')}</button>
              </div>}
            </div>
          </div>
          <div className="th-body" ref={body}>
            <div className="th-intro"><Avatar src={m.photo} size={64} /><b>{m.name}</b><span className="muted small">{m.matched ? 'You matched' : 'Say bonjou'} · {m.match}% · {m.city}</span></div>
            {th.messages.map((x) => (
              <div key={x.id} className={'msg ' + (x.from === 'me' ? 'me' : 'them')}>
                <div className="bub">{x.text}</div>
                {x.from !== 'me' && <button className="msg-flag" onClick={() => setSafety({ mode: 'report', member: m, context: 'message' })} title="Report message" aria-label="Report message"><Icon name="flag" size={13} /></button>}
                <span className="msg-at">{x.at}</span>
              </div>
            ))}
            {th.messages.length === 0 && <p className="muted small center" style={{ marginTop: 20 }}>No messages yet — say the first bonjou 👋</p>}
          </div>
          <div className="th-note"><Icon name="live" size={13} /> Messages arrive when you refresh — live chat is planned for a later phase.</div>
          <form className="composer" onSubmit={sendMsg}>
            <button type="button" className="icon-btn" aria-label="Add photo" onClick={() => toast('Photo messages arrive in a later phase', 'info')}><Icon name="image" /></button>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${m.name}…`} aria-label="Message" />
            <button className="btn primary" disabled={!draft.trim() || sending}><Icon name="send" size={16} /> <span className="hide-s">{t('btn.send')}</span></button>
          </form>
        </>)}
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon, Modal, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

const BLANK_EVENT = { title: '', description: '', category: 'music', starts_at: '', ends_at: '', venue: '', city: '', price_label: '', status: 'published', image: '' }

function EventForm({ event, onClose, onSaved }) {
  const { toast } = useStore()
  const [f, setF] = useState(event)
  const [busy, setBusy] = useState(false)
  const file = useRef(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const pick = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    const reader = new FileReader()
    reader.onload = () => setF((cur) => ({ ...cur, image: reader.result }))
    reader.readAsDataURL(picked)
  }
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = { ...f, category: f.category || null, ends_at: f.ends_at || null, image: f.image || null }
      await api('/admin/events' + (f.id ? '/' + f.id : ''), { method: f.id ? 'PUT' : 'POST', body })
      toast(f.id ? 'Event updated' : 'Event created')
      onSaved()
    } catch (err) { toast(err.message, 'err') } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <label className="field"><span>Title</span><input value={f.title} onChange={set('title')} maxLength={120} required /></label>
      <label className="field"><span>Description</span><textarea rows={3} maxLength={2000} value={f.description} onChange={set('description')} /></label>
      <label className="field"><span>Starts</span><input type="datetime-local" value={f.starts_at} onChange={set('starts_at')} required /></label>
      <label className="field"><span>Ends <em>Optional</em></span><input type="datetime-local" value={f.ends_at} onChange={set('ends_at')} /></label>
      <label className="field"><span>Venue</span><input value={f.venue} onChange={set('venue')} maxLength={160} /></label>
      <label className="field"><span>City</span><input value={f.city} onChange={set('city')} maxLength={80} /></label>
      <label className="field"><span>Category</span><select value={f.category} onChange={set('category')}>{['music', 'food', 'dating', 'culture', 'business'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select></label>
      <label className="field"><span>Price</span><input value={f.price_label} onChange={set('price_label')} maxLength={40} placeholder="Free for members" /></label>
      <label className="field"><span>Status</span><select value={f.status} onChange={set('status')}><option value="published">Published</option><option value="draft">Draft</option><option value="cancelled">Cancelled</option></select></label>
      <label className="field"><span>Image <em>{f.image ? 'Selected' : 'Optional'}</em></span><input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} /></label>
      <div className="modal-f"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{f.id ? 'Save changes' : 'Create event'}</button></div>
    </form>
  )
}

export default function Admin() {
  const { t } = useI18n()
  const { toast } = useStore()
  const { data: statData, reload: reloadStats } = useApi('/admin/stats')
  const { data: userData, reload: reloadUsers } = useApi('/admin/users')
  const { data: repData, reload: reloadReports } = useApi('/admin/reports')
  const { data: qData, reload: reloadQueue } = useApi('/admin/queue')
  const { data: evData, reload: reloadEvents } = useApi('/admin/events')
  const { data: grData, reload: reloadGroups } = useApi('/groups')
  const stats = statData?.stats ?? { totalMembers: 0, newThisWeek: 0, openReports: 0, queue: 0, signups: [] }
  const users = userData?.users ?? []
  const reports = repData?.reports ?? []
  const queue = qData?.queue ?? []
  const published = qData?.published ?? []
  const events = evData?.events ?? []
  const groups = grData?.groups ?? []

  const [tab, setTab] = useState('reports')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [review, setReview] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [editing, setEditing] = useState(null)
  const [dropEvent, setDropEvent] = useState(null)
  const [dropGroup, setDropGroup] = useState(null)

  const ulist = users.filter((u) => (status === 'all' || u.status === status) && ((u.name || '') + (u.email || '') + (u.city || '')).toLowerCase().includes(q.toLowerCase()))
  const maxBar = Math.max(1, ...stats.signups)

  const setUser = async (u, st) => {
    try { await api('/admin/users/' + u.id + '/status', { method: 'POST', body: { status: st } }); toast(`${u.name} ${st === 'suspended' ? 'suspended' : 'reactivated'}`, st === 'suspended' ? 'info' : 'ok'); reloadUsers(); reloadStats() }
    catch (e) { toast(e.message, 'err') }
  }
  const resolve = async (r, action) => {
    try { await api('/admin/reports/' + r.id + '/resolve', { method: 'POST', body: { action } }); setReview(null); toast(`Report resolved — ${action === 'dismiss' ? 'no action' : action === 'warn' ? 'warning sent' : 'user suspended'}`); reloadReports(); reloadUsers(); reloadStats() }
    catch (e) { toast(e.message, 'err') }
  }
  const moderate = async (p, action) => {
    try { await api('/admin/posts/' + p.id + '/moderate', { method: 'POST', body: { action } }); toast(action === 'approve' ? 'Post approved and published' : 'Post removed', action === 'approve' ? 'ok' : 'info'); reloadQueue(); reloadStats() }
    catch (e) { toast(e.message, 'err') }
  }

  const removeEvent = async (e) => {
    try { await api('/admin/events/' + e.id, { method: 'DELETE' }); setDropEvent(null); toast('Event deleted', 'info'); reloadEvents() }
    catch (err) { toast(err.message, 'err') }
  }

  const removeGroup = async (g) => {
    try { await api('/admin/groups/' + g.id, { method: 'DELETE' }); setDropGroup(null); toast('Group deleted', 'info'); reloadGroups() }
    catch (err) { toast(err.message, 'err') }
  }

  const cards = [
    ['Total members', stats.totalMembers, 'All time', 'users', 'blue'],
    ['New this week', stats.newThisWeek, 'Last 7 days', 'sparkle', 'palm'],
    ['Open reports', stats.openReports, stats.openReports > 3 ? 'Needs review' : 'On track', 'flag', 'red'],
    ['Posts in queue', stats.queue, 'Awaiting review', 'grid', 'sun'],
  ]

  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('h.admin')}</h1><p className="muted">Moderation & community health · live data</p></div><span className="tag">Admin · Moderator role</span></div>
      <div className="astats">
        {cards.map(([l, v, d, ic, c]) => (
          <div key={l} className={'card astat ' + c}><span className="astat-ic"><Icon name={ic} size={18} /></span><span className="muted small">{l}</span><b>{Number(v).toLocaleString()}</b><em>{d}</em></div>
        ))}
        <div className="card achart">
          <div className="row-b"><b>Sign-ups · last 14 days</b><span className="muted small">{stats.signups.reduce((a, b) => a + b, 0)} total</span></div>
          <div className="bars">{stats.signups.map((b, i) => <i key={i} style={{ height: (b / maxBar) * 100 + '%' }} title={b + ' sign-ups'} />)}</div>
        </div>
      </div>

      <div className="atabs">
        {[['reports', 'Reports', ' queue', reports.filter((r) => r.status === 'open').length], ['users', 'Users', '', users.length], ['moderation', 'Content', ' moderation', queue.length], ['events', 'Events', '', events.length], ['groups', 'Groups', '', groups.length]].map(([id, l, l2, n]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><span>{l}{l2 && <span className="hide-s">{l2}</span>}</span> <em>{n}</em></button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card table-card">
          <div className="table-tools">
            <label className="search-in"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or city" /></label>
            <div className="seg">{['all', 'active', 'flagged', 'suspended'].map((s) => <button key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div>
          </div>
          <div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>Member</th><th>City</th><th>Joined</th><th>Verified</th><th>Status</th><th /></tr></thead>
              <tbody>
                {ulist.map((u) => (
                  <tr key={u.id}>
                    <td><div className="row-g"><Avatar src={u.photo} size={34} /><div><b>{u.name}</b><span className="muted small block">{u.email}</span></div></div></td>
                    <td>{u.city}</td><td>{u.joined}</td>
                    <td>{u.verified ? <span className="ok-t"><Icon name="check" size={14} /> Yes</span> : <span className="muted">Pending</span>}</td>
                    <td><span className={'pill ' + u.status}>{u.status}</span></td>
                    <td className="right">{u.status === 'suspended'
                      ? <button className="btn ghost xs" onClick={() => setUser(u, 'active')}>Reactivate</button>
                      : <button className="btn danger-o xs" onClick={() => setConfirm(u)}>Suspend</button>}</td>
                  </tr>
                ))}
                {ulist.length === 0 && <tr><td colSpan={6} className="muted center">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="reports">
          {reports.length === 0 && <div className="empty card"><Icon name="check" size={32} /><h3>No reports</h3><p className="muted">The kominote is calm. 💙</p></div>}
          {reports.map((r) => (
            <div key={r.id} className={'card report ' + r.status}>
              <span className={'sev ' + r.severity}>{r.severity}</span>
              <Avatar src={r.target.photo} size={44} />
              <div className="report-b"><b>{r.reason} — {r.target.name}</b><span className="muted small">Reported by {r.by} · {r.time}</span>{r.detail && <p>{r.detail}</p>}</div>
              {r.status === 'open' ? <button className="btn primary sm" onClick={() => setReview(r)}>Review</button> : <span className="pill active">Resolved{r.action ? ' · ' + r.action : ''}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'moderation' && (
        <div className="reports">
          {queue.length === 0 && <div className="empty card"><Icon name="check" size={32} /><h3>Queue is clear</h3><p className="muted">Mèsi! Every post has been reviewed.</p></div>}
          {queue.map((p) => (
            <div key={p.id} className="card report">
              {p.flags > 0 ? <span className="sev high">{p.flags} flags</span> : <span className="sev low">new</span>}
              <Avatar src={p.author.photo} size={44} />
              <div className="report-b"><b>{p.author.name} · <span className="tag-s">{p.cat}</span></b><span className="muted small">{p.time}</span><p>{p.text}</p></div>
              <div className="row-g">
                <button className="btn ghost sm danger-t" onClick={() => moderate(p, 'remove')}><Icon name="trash" size={14} /> Remove</button>
                <button className="btn success sm" onClick={() => moderate(p, 'approve')}><Icon name="check" size={14} /> Approve</button>
              </div>
            </div>
          ))}
          {published.length > 0 && <h3>Published posts</h3>}
          {published.map((p) => (
            <div key={p.id} className="card report">
              {p.flags > 0 ? <span className="sev high">{p.flags} flags</span> : <span className="sev low">live</span>}
              <Avatar src={p.author.photo} size={44} />
              <div className="report-b"><b>{p.author.name} · <span className="tag-s">{p.cat}</span></b><span className="muted small">{p.time}</span><p>{p.text}</p></div>
              <button className="btn ghost sm danger-t" onClick={() => moderate(p, 'remove')}><Icon name="trash" size={14} /> Remove</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="reports">
          <div className="row-b"><span className="muted">Members only see published events.</span><button className="btn primary sm" onClick={() => setEditing({ ...BLANK_EVENT })}><Icon name="plus" size={14} /> New event</button></div>
          {events.length === 0 && <div className="empty card"><Icon name="calendar" size={32} /><h3>No events yet</h3><p className="muted">Create the first one for the kominote.</p></div>}
          {events.map((e) => (
            <div key={e.id} className="card report">
              <span className={'sev ' + (e.status === 'published' ? 'low' : e.status === 'draft' ? 'medium' : 'high')}>{e.status}</span>
              <Avatar src={e.image} size={44} />
              <div className="report-b"><b>{e.title}</b><span className="muted small">{e.when}{e.city ? ' · ' + e.city : ''} · {e.going} going</span></div>
              <div className="row-g">
                <button className="btn ghost sm danger-t" onClick={() => setDropEvent(e)}><Icon name="trash" size={14} /> Delete</button>
                <button className="btn primary sm" onClick={() => setEditing({ ...BLANK_EVENT, ...e, description: e.description ?? '', category: e.category ?? '', ends_at: e.ends_at ?? '', venue: e.venue ?? '', city: e.city ?? '', price_label: e.price_label ?? '', image: '' })}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'groups' && (
        <div className="reports">
          {groups.map((g) => (
            <div key={g.id} className="card report">
              <Avatar src={g.image} size={44} />
              <div className="report-b"><b>{g.name}</b><span className="muted small">{g.members} {g.members === 1 ? 'member' : 'members'}</span>{g.description && <p>{g.description}</p>}</div>
              <button className="btn ghost sm danger-t" onClick={() => setDropGroup(g)}><Icon name="trash" size={14} /> Delete</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!review} onClose={() => setReview(null)} title="Review report" width={540}>
        {review && (<>
          <div className="safety-who"><img src={photoUrl(review.target.photo)} alt="" /><div><b>{review.target.name}</b><span>{review.target.city}</span></div><span className={'sev ' + review.severity}>{review.severity}</span></div>
          <div className="confirm-box"><Icon name="flag" size={16} /> <b>{review.reason}</b></div>
          <p>{review.detail || 'No extra details provided.'}</p>
          <p className="muted small">Previous reports on this member: {review.priors}</p>
          <div className="modal-f wrap-g">
            <button className="btn ghost" onClick={() => resolve(review, 'dismiss')}>Dismiss</button>
            <button className="btn sun" onClick={() => resolve(review, 'warn')}>Send warning</button>
            <button className="btn danger" onClick={() => resolve(review, 'suspend')}><Icon name="ban" size={15} /> Suspend user</button>
          </div>
        </>)}
      </Modal>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Suspend ${confirm?.name}?`}>
        <p className="muted">They will be logged out and hidden from Discover until reactivated.</p>
        <div className="modal-f"><button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button><button className="btn danger" onClick={() => { setUser(confirm, 'suspended'); setConfirm(null) }}>Suspend</button></div>
      </Modal>
      <Modal open={!!dropGroup} onClose={() => setDropGroup(null)} title={`Delete ${dropGroup?.name}?`}>
        <p className="muted">Members will lose this group. This can't be undone.</p>
        <div className="modal-f"><button className="btn ghost" onClick={() => setDropGroup(null)}>Keep group</button><button className="btn danger" onClick={() => removeGroup(dropGroup)}>Delete</button></div>
      </Modal>
      <Modal open={!!dropEvent} onClose={() => setDropEvent(null)} title={`Delete ${dropEvent?.title}?`}>
        <p className="muted">This also removes its RSVPs and can't be undone. To keep the record, edit the event and set it to Cancelled.</p>
        <div className="modal-f"><button className="btn ghost" onClick={() => setDropEvent(null)}>Keep event</button><button className="btn danger" onClick={() => removeEvent(dropEvent)}>Delete</button></div>
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit event' : 'New event'} width={540}>
        {editing && <EventForm key={editing.id ?? 'new'} event={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadEvents() }} />}
      </Modal>
    </div>
  )
}

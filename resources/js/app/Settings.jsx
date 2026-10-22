import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n, LANGS } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Avatar, Icon, Modal } from '../components/ui.jsx'
import { member } from '../data.js'

function Toggle({ label, desc, def = true }) {
  const [on, setOn] = useState(def)
  return <label className="set-row"><div><b>{label}</b>{desc && <span>{desc}</span>}</div><input type="checkbox" className="switch" checked={on} onChange={(e) => setOn(e.target.checked)} /></label>
}

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const { me, theme, setTheme, blocked, unblock, toast } = useStore()
  const [del, setDel] = useState(false)
  const nav = useNavigate()
  return (
    <div className="page narrow">
      <div className="page-h"><div><h1>{t('h.settings')}</h1><p className="muted">Account, privacy and safety.</p></div></div>
      <section className="card set">
        <h3>Account</h3>
        <div className="set-row"><div><b>Email</b><span>daniela@mail.com · <span className="ok-t">Verified</span></span></div><button className="btn ghost sm" onClick={() => toast('Verification email sent', 'info')}>Change</button></div>
        <div className="set-row"><div><b>Password</b><span>Last changed 3 months ago</span></div><Link to="/reset" className="btn ghost sm">Reset</Link></div>
        <div className="set-row"><div><b>Language</b><span>Used across the whole app</span></div><div className="seg">{LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.name}</button>)}</div></div>
      </section>
      <section className="card set">
        <h3>Privacy</h3>
        <Toggle label="Show me in Discover" desc="Turn off to pause your profile without deleting it." />
        <Toggle label="Show my exact city" desc="Otherwise we show your region only." />
        <Toggle label="Only verified members can message me" def={false} />
        <Toggle label="Show online status" />
      </section>
      <section className="card set">
        <h3>Notifications</h3>
        <Toggle label="New likes & matches" />
        <Toggle label="New messages" />
        <Toggle label="Events near me" desc="Weekly digest of kompa nights and meetups." />
        <Toggle label="Rekonekte news" def={false} />
      </section>
      <section className="card set">
        <h3>Blocked members <span className="muted small">({blocked.length})</span></h3>
        {blocked.length === 0 && <p className="muted small">You haven't blocked anyone. You can block from any profile or conversation.</p>}
        {blocked.map((id) => { const m = member(id); return (
          <div key={id} className="set-row"><div className="row-g"><Avatar src={m.photo} size={36} /><div><b>{m.name}</b><span>{m.city}</span></div></div><button className="btn ghost sm" onClick={() => { unblock(id); toast(`${m.name} unblocked`) }}>Unblock</button></div>
        ) })}
      </section>
      <section className="card set danger-zone">
        <h3>Danger zone</h3>
        <div className="set-row"><div><b>Delete account</b><span>Permanently remove your profile, messages and posts.</span></div><button className="btn danger sm" onClick={() => setDel(true)}>Delete</button></div>
        <div className="set-row"><div><b>Log out</b></div><button className="btn ghost sm" onClick={() => nav('/')}>{t('btn.logout')}</button></div>
      </section>
      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?">
        <p className="muted">This can't be undone. {me.name}, we'll miss you in the kominote. 💙❤️</p>
        <div className="modal-f"><button className="btn ghost" onClick={() => setDel(false)}>Keep my account</button><button className="btn danger" onClick={() => { setDel(false); toast('Concept only — nothing was deleted', 'info') }}>Delete forever</button></div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon, photoUrl } from '../components/ui.jsx'
import { api } from '../api.js'
import { useApi } from '../useApi.js'

const CITIES = ['Miami', 'Brooklyn', 'Montréal', 'Boston', 'Port-au-Prince', 'Paris', 'Orlando', 'Cap-Haïtien']
const ALL_INTERESTS = ['Kompa', 'Rara', 'Zouk', 'Cooking', 'Travel', 'Books', 'Church', 'Soccer', 'Basketball', 'Poetry', 'Art', 'Fashion', 'Beach days', 'Business', 'Tech', 'Dance', 'Hiking', 'Family', 'Film', 'Fitness']
const ALL_LANGS = ['English', 'Kreyòl', 'French', 'Spanish', 'Portuguese']

export function MyProfile() {
  const { t } = useI18n()
  const { me } = useStore()
  const { data } = useApi('/profile')
  const stats = data?.stats ?? { likedBy: 0, likes: 0, events: 0 }
  const p = data?.me ?? me
  const complete = Math.min(100, 30 + ((p.bio?.length || 0) > 40 ? 20 : 0) + (p.interests?.length || 0) * 6 + (p.langs?.length || 0) * 5 + (p.photo ? 10 : 0))
  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('h.profile')}</h1><p className="muted">This is how other members see you.</p></div><Link to="/app/profile/edit" className="btn primary"><Icon name="camera" size={16} /> {t('btn.edit')}</Link></div>
      <div className="prof">
        <div className="prof-photo card"><img src={photoUrl(p.photo)} alt={p.name} /></div>
        <div className="prof-body">
          <div className="card prof-main">
            <h1>{p.name}{p.age ? ', ' + p.age : ''} {p.verified && <Icon name="verified" size={22} className="vf" />}</h1>
            <p className="muted"><Icon name="pin" size={14} /> {p.city}{p.job ? ' · ' + p.job : ''}{p.lookingFor ? ' · ' + p.lookingFor : ''}</p>
            <div className="match-bar"><span>Profile {complete}% complete</span><div className="bar"><i style={{ width: complete + '%' }} /></div></div>
            {p.bio && <><h4>About</h4><p>{p.bio}</p></>}
            <h4>Interests</h4><div className="chips">{(p.interests || []).map((x) => <span key={x} className="chip on">{x}</span>)}{(p.interests || []).length === 0 && <span className="muted small">Add interests to get better matches.</span>}</div>
            <h4>Languages</h4><div className="chips">{(p.langs || []).map((x) => <span key={x} className="chip"><Icon name="globe" size={12} /> {x}</span>)}</div>
          </div>
          <div className="mini-stats">
            <div className="card"><b>{stats.likedBy}</b><span>People who liked you</span></div>
            <div className="card"><b>{stats.likes}</b><span>People you liked</span></div>
            <div className="card"><b>{stats.events}</b><span>Events you're going to</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditProfile() {
  const { t } = useI18n()
  const { me, setMe, refreshMe, toast } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ name: me.name, culture: me.culture || 'haitian', job: me.job || '', city: me.city || 'Miami', lookingFor: me.lookingFor || 'Something serious', bio: me.bio || '', interests: me.interests || [], langs: me.langs || [], photo: me.photo, age: me.age, verified: me.verified })
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggle = (k, v, max) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : max && x[k].length >= max ? x[k] : [...x[k], v] }))
  const load = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file (JPG, PNG, WEBP).')
    if (file.size > 8 * 1024 * 1024) return setErr('That photo is over 8 MB — please pick a smaller one.')
    setErr('')
    const r = new FileReader()
    r.onload = async () => {
      setF((x) => ({ ...x, photo: r.result }))
      try { const res = await api('/profile/photo', { method: 'POST', body: { image: r.result } }); setF((x) => ({ ...x, photo: res.photo })); setMe((m) => ({ ...m, photo: res.photo })); toast('Photo updated') }
      catch (e) { toast(e.message, 'err') }
    }
    r.readAsDataURL(file)
  }
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api('/profile', { method: 'PUT', body: { name: f.name, culture: f.culture, job: f.job, city: f.city, lookingFor: f.lookingFor, bio: f.bio, interests: f.interests, langs: f.langs } })
      await refreshMe(); toast('Profile saved — mèsi!'); nav('/app/profile')
    } catch (err) { toast(err.message, 'err'); setBusy(false) }
  }
  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('btn.edit')}</h1><p className="muted">Changes preview live as you type.</p></div></div>
      <form className="edit" onSubmit={save}>
        <div className="edit-form">
          <section className="card">
            <h3 className="mt0">Profile photo</h3>
            <label className={'drop' + (drag ? ' drag' : '')} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]) }}>
              <img src={photoUrl(f.photo)} alt="Current photo" />
              <div><b><Icon name="camera" size={16} /> Upload a new photo</b><span>Drag & drop or click · JPG, PNG up to 8 MB. Clear face, no filters — it helps you get verified.</span></div>
              <input type="file" accept="image/*" hidden onChange={(e) => load(e.target.files?.[0])} />
            </label>
            {err && <div className="alert err"><Icon name="flag" size={16} /> {err}</div>}
          </section>
          <section className="card">
            <h3 className="mt0">Basics</h3>
            <div className="row2">
              <label className="field"><span>First name</span><input value={f.name} onChange={set('name')} required /></label>
              <label className="field"><span>Job</span><input value={f.job} onChange={set('job')} /></label>
            </div>
            <div className="row2">
              <label className="field"><span>City</span><select value={f.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="field"><span>Culture</span><select value={f.culture ?? 'haitian'} onChange={set('culture')}><option value="haitian">Haitian</option><option value="caribbean">Caribbean</option><option value="other">Other cultures</option></select></label>
              <label className="field"><span>Looking for</span><select value={f.lookingFor} onChange={set('lookingFor')}><option>Something serious</option><option>Marriage</option><option>Friendship & community</option><option>Not sure yet</option></select></label>
            </div>
            <label className="field"><span>Bio <em>{f.bio.length}/300</em></span><textarea rows={4} maxLength={300} value={f.bio} onChange={set('bio')} /></label>
          </section>
          <section className="card">
            <h3 className="mt0">Interests <span className="muted small">({f.interests.length}/8)</span></h3>
            <div className="chips">{ALL_INTERESTS.map((x) => <button type="button" key={x} className={'chip' + (f.interests.includes(x) ? ' on' : '')} onClick={() => toggle('interests', x, 8)}>{x}</button>)}</div>
            <h3>Languages I speak</h3>
            <div className="chips">{ALL_LANGS.map((x) => <button type="button" key={x} className={'chip' + (f.langs.includes(x) ? ' on' : '')} onClick={() => toggle('langs', x)}><Icon name="globe" size={12} /> {x}</button>)}</div>
          </section>
          <div className="edit-bar card"><Link to="/app/profile" className="btn ghost">Cancel</Link><button className="btn primary" disabled={busy}>{t('btn.save')}</button></div>
        </div>
        <aside className="edit-prev">
          <div className="pcard">
            <div className="pcard-img"><img src={photoUrl(f.photo)} alt="" /></div>
            <div className="pcard-b"><h3>{f.name || 'Your name'}{f.age ? ', ' + f.age : ''} {f.verified && <Icon name="verified" size={18} className="vf" />}</h3><span className="muted"><Icon name="pin" size={14} /> {f.city}{f.job ? ' · ' + f.job : ''}</span><p>{f.bio}</p>
              <div className="chips">{f.interests.slice(0, 5).map((x) => <span key={x} className="chip on">{x}</span>)}</div></div>
          </div>
          <p className="muted small center">Live preview — as seen in Discover</p>
        </aside>
      </form>
    </div>
  )
}

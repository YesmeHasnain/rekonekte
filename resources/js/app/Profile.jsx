import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'
import { useStore } from '../store.jsx'
import { Icon } from '../components/ui.jsx'
import { CITIES } from '../data.js'

const ALL_INTERESTS = ['Kompa', 'Rara', 'Zouk', 'Cooking', 'Travel', 'Books', 'Church', 'Soccer', 'Basketball', 'Poetry', 'Art', 'Fashion', 'Beach days', 'Business', 'Tech', 'Dance', 'Hiking', 'Family', 'Film', 'Fitness']
const ALL_LANGS = ['English', 'Kreyòl', 'French', 'Spanish', 'Portuguese']

const photoSrc = (p) => (p.startsWith('data:') || p.startsWith('blob:') ? p : '/img/' + p)

export function MyProfile() {
  const { t } = useI18n()
  const { me, liked, going } = useStore()
  const complete = Math.min(100, 30 + (me.bio?.length > 40 ? 20 : 0) + me.interests.length * 6 + me.langs.length * 5 + (me.photo ? 10 : 0))
  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('h.profile')}</h1><p className="muted">This is how other members see you.</p></div><Link to="/app/profile/edit" className="btn primary"><Icon name="camera" size={16} /> {t('btn.edit')}</Link></div>
      <div className="prof">
        <div className="prof-photo card"><img src={photoSrc(me.photo)} alt={me.name} /></div>
        <div className="prof-body">
          <div className="card prof-main">
            <h1>{me.name}, {me.age} {me.verified && <Icon name="verified" size={22} className="vf" />}</h1>
            <p className="muted"><Icon name="pin" size={14} /> {me.city} · {me.job} · {me.lookingFor}</p>
            <div className="match-bar"><span>Profile {complete}% complete</span><div className="bar"><i style={{ width: complete + '%' }} /></div></div>
            <h4>About</h4><p>{me.bio}</p>
            <h4>Interests</h4><div className="chips">{me.interests.map((x) => <span key={x} className="chip on">{x}</span>)}</div>
            <h4>Languages</h4><div className="chips">{me.langs.map((x) => <span key={x} className="chip"><Icon name="globe" size={12} /> {x}</span>)}</div>
          </div>
          <div className="mini-stats">
            <div className="card"><b>{128 + liked.length}</b><span>Profile views this week</span></div>
            <div className="card"><b>{liked.length}</b><span>People you liked</span></div>
            <div className="card"><b>{going.length}</b><span>Events you're going to</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditProfile() {
  const { t } = useI18n()
  const { me, setMe, toast } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState(me)
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggle = (k, v, max) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : max && x[k].length >= max ? x[k] : [...x[k], v] }))
  const load = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file (JPG, PNG, WEBP).')
    if (file.size > 8 * 1024 * 1024) return setErr('That photo is over 8 MB — please pick a smaller one.')
    setErr('')
    const r = new FileReader()
    r.onload = () => setF((x) => ({ ...x, photo: r.result }))
    r.readAsDataURL(file)
  }
  return (
    <div className="page">
      <div className="page-h"><div><h1>{t('btn.edit')}</h1><p className="muted">Changes preview live as you type.</p></div></div>
      <form className="edit" onSubmit={(e) => { e.preventDefault(); setMe(f); toast('Profile saved — mèsi!'); nav('/app/profile') }}>
        <div className="edit-form">
          <section className="card">
            <h3 className="mt0">Profile photo</h3>
            <label className={'drop' + (drag ? ' drag' : '')} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]) }}>
              <img src={photoSrc(f.photo)} alt="Current photo" />
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
          <div className="edit-bar card"><Link to="/app/profile" className="btn ghost">Cancel</Link><button className="btn primary">{t('btn.save')}</button></div>
        </div>
        <aside className="edit-prev">
          <div className="pcard">
            <div className="pcard-img"><img src={photoSrc(f.photo)} alt="" /></div>
            <div className="pcard-b"><h3>{f.name || 'Your name'}, {f.age} <Icon name="verified" size={18} className="vf" /></h3><span className="muted"><Icon name="pin" size={14} /> {f.city} · {f.job}</span><p>{f.bio}</p>
              <div className="chips">{f.interests.slice(0, 5).map((x) => <span key={x} className="chip on">{x}</span>)}</div></div>
          </div>
          <p className="muted small center">Live preview — as seen in Discover</p>
        </aside>
      </form>
    </div>
  )
}

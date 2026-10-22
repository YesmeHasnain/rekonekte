import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicShell } from '../components/Public.jsx'
import { CountUp, Icon, Reveal } from '../components/ui.jsx'
import { useTr } from '../i18n.jsx'

// Rekonekte's own mark — the two-colour heart — drives the whole page: the hero photo
// sits inside it, the "reconnect" thread is drawn in its stroke, and it closes the page.
const HEART = 'M150 268C58 196 14 146 14 96 14 50 48 18 90 18c28 0 48 14 60 36 12-22 32-36 60-36 42 0 76 32 76 78 0 50-44 100-136 172Z'
const HEART_L = 'M150 54C138 32 118 18 90 18 48 18 14 50 14 96c0 50 44 100 136 172'
const HEART_R = 'M150 54c12-22 32-36 60-36 42 0 76 32 76 78 0 50-44 100-136 172'

const Arrow = () => <Icon name="arrow" size={17} stroke={2.2} />

function HeartPhoto({ src, alt, id = 'hp', className = '' }) {
  return (
    <svg className={'heart-photo ' + className} viewBox="0 0 300 290" role="img" aria-label={alt}>
      <defs><clipPath id={id}><path d={HEART} /></clipPath></defs>
      <image href={src} x="0" y="0" width="300" height="290" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
      <path className="hl" d={HEART_L} pathLength="1" />
      <path className="hr" d={HEART_R} pathLength="1" />
      <circle className="hdot" cx="150" cy="50" r="10" />
    </svg>
  )
}

/* ---------------- Hero ---------------- */
function Hero() {
  const tr = useTr()
  return (
    <section className="h-hero" id="top">
      <div className="wrap h-hero-in">
        <div className="h-hero-copy">
          <p className="h-kicker rise">Lanmou · Kominote · Lakay</p>
          <h1 className="rise" style={{ '--d': '80ms' }}>
            <span>{tr('Find')} <em>{tr('love.')}</em></span>
            <span>{tr('Build community.')}</span>
            <span className="soft">{tr('Create a better tomorrow.')}</span>
          </h1>
          <p className="h-lead rise" style={{ '--d': '160ms' }}>
            {tr('Rekonekte is where Haitians date, gather and earn — real people, from Port-au-Prince to Miami, Montréal and Paris, in one place that feels like home.')}
          </p>
          <div className="h-ctas rise" style={{ '--d': '240ms' }}>
            <Link to="/register" className="hbtn red">{tr('Create your free profile')} <Arrow /></Link>
            <a href="#how" className="hlink">{tr('How it works')}</a>
          </div>
          <ul className="h-stats rise" style={{ '--d': '320ms' }}>
            <li><b><CountUp to={500} suffix="K+" /></b> {tr('members')}</li>
            <li><b><CountUp to={12} suffix="+" /></b> {tr('countries')}</li>
            <li><b><CountUp to={100} suffix="%" /></b> {tr('verified profiles')}</li>
          </ul>
        </div>
        <div className="h-hero-art rise" style={{ '--d': '120ms' }}>
          <HeartPhoto src="/img/couple-gold.jpg" alt="A Haitian couple embracing at dusk" id="hero-heart" className="draw" />
          <span className="h-tag t1"><img src="/img/flag.svg" alt="" /> {tr('Made for the diaspora')}</span>
          <span className="h-tag t2"><Icon name="shield" size={15} /> {tr('Every profile verified')}</span>
        </div>
      </div>
    </section>
  )
}

/* ---------------- The reconnect thread ---------------- */
function Thread() {
  const ref = useRef(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    const f = () => {
      const el = ref.current?.parentElement
      if (!el) return
      const r = el.getBoundingClientRect()
      const v = (window.innerHeight * 0.75 - r.top) / r.height
      setP(Math.max(0, Math.min(1, v)))
    }
    f(); window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f)
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f) }
  }, [])
  return (
    <svg ref={ref} className="kthread" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d="M50 0 C 92 80, 92 160, 50 250 S 8 420, 50 500 S 92 680, 50 750 S 8 920, 50 1000" pathLength="1" style={{ strokeDashoffset: 1 - p }} />
    </svg>
  )
}

/* ---------------- Lanmou / Kominote / Lakou Live / Fè lajan ---------------- */
const PILLARS = [
  {
    id: 'dating', word: 'Lanmou', en: 'Dating', img: 'couple-field.jpg', tone: 'red',
    title: 'Someone who gets where you’re from.',
    text: 'Meet Haitian singles who share your roots, your language and your Sunday-dinner standards. Smart recommendations, filters for age, gender and city, and only verified profiles.',
    points: ['Matches based on what you care about', 'Filter by age range, gender and city', 'Private messages once it’s mutual'],
    cta: ['Start meeting people', '/register'],
  },
  {
    id: 'community', word: 'Kominote', en: 'Community Hub', img: 'parade.jpg', tone: 'blue',
    title: 'The group chat, grown up.',
    text: 'Housing, jobs, events, services and help for newcomers — posted by members in your city and kept clean by real moderators.',
    points: ['Rooms, jobs and services near you', 'Community posts with photos', 'Events you can RSVP to'],
    cta: ['Visit the kominote', '/app/community'],
  },
  {
    id: 'live', word: 'Lakou Live', en: 'Live Dating Shows', img: 'live-lights.jpg', tone: 'sun',
    title: 'The whole lakou, together on screen.',
    text: 'Speed-dating shows, music, games and late-night stories hosted by the community. Watch, take part and meet people in real time.',
    points: ['Live speed dating & matchmaking', 'Kompa nights and talk shows', 'Arriving in the next phase'],
    cta: ['See upcoming events', '/app/events'],
  },
  {
    id: 'host', word: 'Fè lajan', en: 'Host & Monetization', img: 'live-spot.jpg', tone: 'palm',
    title: 'Share your talent. Earn from your community.',
    text: 'DJs, singers, matchmakers, chefs, pastors — if the community loves you, you can host events and shows and earn from them.',
    points: ['Host events and shows', 'Grow your own audience', 'Tools for hosts as they launch'],
    cta: ['Become a host', '/register'],
  },
]

function Pillars() {
  const tr = useTr()
  return (
    <section className="kpillars" id="features">
      <Thread />
      <div className="wrap">
        <Reveal className="h-head">
          <p className="h-kicker">{tr('Everything you need to connect, belong and grow')}</p>
          <h2>{tr('Four doors.')} <em>{tr('One home.')}</em></h2>
        </Reveal>
        {PILLARS.map((x, i) => (
          <article key={x.id} id={x.id} className={'kpillar tone-' + x.tone + (i % 2 ? ' flip' : '')}>
            <Reveal className="kpillar-pic">
              <div className="arch"><img src={'/img/' + x.img} alt="" loading="lazy" /></div>
              <span className="kpillar-no">0{i + 1}</span>
            </Reveal>
            <Reveal className="kpillar-copy" delay={120}>
              <p className="kpillar-word">{x.word}<span>{tr(x.en)}</span></p>
              <h3>{tr(x.title)}</h3>
              <p>{tr(x.text)}</p>
              <ul>{x.points.map((pt) => <li key={pt}><Icon name="heart" size={14} fill="currentColor" stroke={0} />{tr(pt)}</li>)}</ul>
              <Link to={x.cta[1]} className="hlink">{tr(x.cta[0])} <Arrow /></Link>
            </Reveal>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Ayiti cheri ---------------- */
const CITIES = ['Miami', 'Montréal', 'Paris', 'Santo Domingo', 'New York', 'Boston', 'Pòtoprens', 'Cap-Haïtien', 'Atlanta', 'Jacmel']
function Culture() {
  const tr = useTr()
  return (
    <section className="kculture" id="kculture">
      <div className="wrap">
        <Reveal><p className="ayiti" aria-label="Ayiti cheri">Ayiti <span>cheri</span></p></Reveal>
        <Reveal className="kculture-row" delay={100}>
          <div>
            <h2>{tr('Haitian culture.')} <em>{tr('Global community.')}</em></h2>
            <p>{tr('From Miami to Montréal, from Paris to Santo Domingo — Rekonekte keeps us close, no matter the distance.')}</p>
          </div>
          <Link to="/register" className="hbtn blue">{tr('Join our community')} <Arrow /></Link>
        </Reveal>
      </div>
      <div className="cities" aria-hidden="true">
        <div className="cities-track">{[...CITIES, ...CITIES].map((c, i) => <span key={i}>{c}</span>)}</div>
      </div>
    </section>
  )
}

/* ---------------- How it works (real UI pieces, not phone mock-ups) ---------------- */
function How() {
  const tr = useTr()
  return (
    <section className="how" id="how">
      <div className="wrap">
        <Reveal className="h-head">
          <p className="h-kicker">{tr('Why Rekonekte? More than a dating site — it’s a movement')}</p>
          <h2>{tr('From')} <em>bonjou</em> {tr('to first date.')}</h2>
        </Reveal>
        <div className="steps">
          <Reveal className="step">
            <div className="step-ui ui-profile">
              <img src="/img/p-nadia.jpg" alt="" />
              <div><b>Nadia, 29 <Icon name="check" size={13} stroke={3} /></b><span>{tr('Miami · from Jacmel')}</span><div className="kchips"><i>Kompa</i><i>{tr('Beach days')}</i><i>{tr('Faith')}</i></div></div>
            </div>
            <span className="step-no">1</span>
            <h3>{tr('Make your profile')}</h3>
            <p>{tr('Your photos, your city, where your family is from and what you love. Confirm you’re 18+ and verify your email.')}</p>
          </Reveal>
          <Reveal className="step" delay={120}>
            <div className="step-ui ui-match">
              <div className="pair"><img src="/img/p-mika.jpg" alt="" /><Icon name="heart" size={18} fill="currentColor" stroke={0} /><img src="/img/p-jean.jpg" alt="" /></div>
              <b>{tr('It’s a match')}</b><span>{tr('You and Jean-Robert liked each other')}</span>
            </div>
            <span className="step-no">2</span>
            <h3>{tr('Discover people')}</h3>
            <p>{tr('Browse members by age range, gender and city. Like the ones who make you smile — it’s a match when it’s mutual.')}</p>
          </Reveal>
          <Reveal className="step" delay={240}>
            <div className="step-ui ui-chat">
              <p className="them">Bonjou! Ki bò ou ye?</p>
              <p className="me">Montréal! Ou menm? 😊</p>
              <p className="them">Brooklyn — Konpa night Saturday?</p>
            </div>
            <span className="step-no">3</span>
            <h3>{tr('Say bonjou')}</h3>
            <p>{tr('Message privately in Kreyòl, French or English. Block or report anyone in two taps — real moderators review every report.')}</p>
          </Reveal>
        </div>
        <Reveal className="values">
          <div><Icon name="heart" size={20} fill="currentColor" stroke={0} /><b>{tr('Love')}</b><span>{tr('Real connections')}</span></div>
          <div><Icon name="users" size={20} /><b>{tr('Community')}</b><span>{tr('Support & friendship')}</span></div>
          <div><Icon name="star" size={20} fill="currentColor" stroke={0} /><b>{tr('Opportunities')}</b><span>{tr('Jobs & income')}</span></div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Stories ---------------- */
const STORIES = [
  { q: 'Rekonekte helped me find my boyfriend. We live in different countries, but now we talk every day!', n: 'Marie D.', c: 'New York, USA', img: 'couple-hero.jpg', av: 'p-sabine.jpg' },
  { q: 'The community hub is amazing! I found a job and made new friends in my city.', n: 'Jean P.', c: 'Montréal, Canada', img: 'dinner.jpg', av: 'p-jean.jpg' },
  { q: 'I love the live shows! It’s so fun and brings our culture to life.', n: 'Rose L.', c: 'Miami, USA', img: 'dancers.jpg', av: 'p-roselande.jpg' },
]
function Stories() {
  const tr = useTr()
  const [i, setI] = useState(0)
  const [pause, setPause] = useState(false)
  useEffect(() => {
    if (pause) return
    const t = setTimeout(() => setI((v) => (v + 1) % STORIES.length), 6000)
    return () => clearTimeout(t)
  }, [i, pause])
  const s = STORIES[i]
  return (
    <section className="stories" id="stories" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
      <div className="wrap stories-in">
        <Reveal className="stories-art">
          <HeartPhoto key={s.img} src={'/img/' + s.img} alt="" id="story-heart" className="swap" />
        </Reveal>
        <Reveal className="stories-copy" delay={100}>
          <p className="h-kicker">{tr('Real people. Real stories.')}</p>
          <blockquote key={s.n} className="swap-t">“{tr(s.q)}”</blockquote>
          <div className="who">
            <img src={'/img/' + s.av} alt="" />
            <div><b>{s.n}</b><span>{s.c}</span></div>
          </div>
          <div className="dots" role="tablist" aria-label="Stories">
            {STORIES.map((x, k) => <button key={x.n} role="tab" aria-selected={k === i} aria-label={x.n} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Plans: one clear comparison, not three sales cards ---------------- */
const PLANS = [
  { n: 'Free', p: '$0', s: 'Get started', cta: 'Join free' },
  { n: 'Rekonekte Plus', p: '$9.99', s: 'Unlock premium features', cta: 'Upgrade', on: true },
  { n: 'Host Pro', p: '$29.99', s: 'For creators & hosts', cta: 'Apply to host' },
]
const ROWS = [
  ['Profile, photos & matching', 'Basic', 'Smart', 'Smart'],
  ['Messaging', 'Limited', 'Unlimited', 'Unlimited'],
  ['Community & events', true, true, true],
  ['AI match insights', false, true, true],
  ['Advanced search', false, true, true],
  ['Live shows & gifts', false, true, true],
  ['Host live shows', false, false, true],
  ['Monetization tools & analytics', false, false, true],
  ['Priority support', false, false, true],
]
function Plans() {
  const tr = useTr()
  const cell = (v) => v === true ? <Icon name="check" size={18} stroke={2.6} className="yes" /> : v === false ? <span className="no">—</span> : <span className="txt">{tr(v)}</span>
  return (
    <section className="plans" id="pricing">
      <div className="wrap">
        <Reveal className="h-head">
          <p className="h-kicker">{tr('Choose the plan that fits you')}</p>
          <h2>{tr('Free to join.')} <em>{tr('More')}</em> {tr('when you’re ready.')}</h2>
        </Reveal>
        <Reveal className="cmp-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col"><span className="sr">{tr('Feature')}</span></th>
                {PLANS.map((p) => (
                  <th key={p.n} scope="col" className={p.on ? 'on' : ''}>
                    <span className="pn">{tr(p.n)}</span>
                    <span className="pp">{p.p}<small>{tr('/month')}</small></span>
                    <span className="ps">{tr(p.s)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([l, ...v]) => (
                <tr key={l}><th scope="row">{tr(l)}</th>{v.map((x, k) => <td key={k} className={PLANS[k].on ? 'on' : ''}>{cell(x)}</td>)}</tr>
              ))}
              <tr className="cta-row"><th scope="row" /> {PLANS.map((p) => <td key={p.n} className={p.on ? 'on' : ''}><Link to="/register" className={'hbtn sm ' + (p.on ? 'red' : 'line')}>{tr(p.cta)}</Link></td>)}</tr>
            </tbody>
          </table>
        </Reveal>
        <div className="plan-m">
          {PLANS.map((p, k) => (
            <Reveal key={p.n} className={'pm' + (p.on ? ' on' : '')}>
              <span className="pn">{tr(p.n)}</span>
              <span className="pp">{p.p}<small>{tr('/month')}</small></span>
              <span className="ps">{tr(p.s)}</span>
              <ul>{ROWS.filter((r) => r[k + 1] !== false).map((r) => <li key={r[0]}><Icon name="check" size={16} stroke={2.6} />{tr(r[0])}{typeof r[k + 1] === 'string' ? ` · ${tr(r[k + 1])}` : ''}</li>)}</ul>
              <Link to="/register" className={'hbtn sm ' + (p.on ? 'red' : 'line')}>{tr(p.cta)}</Link>
            </Reveal>
          ))}
        </div>
        <p className="plans-note">{tr('Prices in USD. Cancel any time.')}</p>
      </div>
    </section>
  )
}

/* ---------------- Closing ---------------- */
function Closing() {
  const tr = useTr()
  return (
    <section className="closing">
      <div className="wrap closing-in">
        <Reveal className="closing-mark">
          <img src="/img/logo-full-light.png" alt="Rekonekte — Lanmou · Kominote · Lakay" />
        </Reveal>
        <Reveal className="closing-copy" delay={100}>
          <h2><em>Lanmou,</em> Kominote, Lakay.</h2>
          <p>{tr('Join Rekonekte today and be part of something bigger.')}</p>
          <Link to="/register" className="hbtn red">{tr('Get started free')} <Arrow /></Link>
        </Reveal>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <PublicShell>
      <Hero />
      <Pillars />
      <Culture />
      <How />
      <Stories />
      <Plans />
      <Closing />
    </PublicShell>
  )
}

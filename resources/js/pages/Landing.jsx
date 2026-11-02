import { Link } from 'react-router-dom'
import { PublicShell } from '../components/Public.jsx'
import { Icon, Logo } from '../components/ui.jsx'
import { useTr } from '../i18n.jsx'
import { MORE_TILES } from '../app/DiscoverMore.jsx'

const PILLS = [['heart', 'Dating', '/app/discover'], ['users', 'Community', '/app/community'], ['calendar', 'Events', '/app/events'], ['globe', 'Culture', '/app/more']]

const FEATURES = [
  ['heart', 'Meaningful Connections', 'Real people. Real intentions.'],
  ['users', 'Vibrant Community', 'Make friends. Share. Belong.'],
  ['calendar', 'Exciting Events', 'From local meetups to cultural festivals.'],
  ['globe', 'Explore Cultures', 'Celebrate diversity. Build bridges.'],
]

function Hero() {
  const tr = useTr()
  return (
    <section className="mk-hero">
      <img className="mk-hero-img" src="/img/hero-couple.jpg" alt="" />
      <div className="mk-hero-in">
        <Logo big light />
        <h1>{tr('More than a match.')}<br />{tr('A place to connect.')}</h1>
        <p>{tr('Find meaningful relationships, discover your community, and connect across cultures.')}</p>
        <Link to="/register" className="mk-cta">{tr('Join Rekonekte')} <Icon name="arrow" size={22} /></Link>
        <div className="mk-pills">
          {PILLS.map(([ic, l, to]) => <Link key={l} to={to}><Icon name={ic} size={20} /> {tr(l)}</Link>)}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  ['user', 'Create your profile', 'Add your photos, your city and what you are looking for.'],
  ['search', 'Discover people', 'Browse members by age, city and culture, and like who you want to meet.'],
  ['chat', 'Connect and meet', 'When the like is mutual, start talking. Then join groups and events together.'],
]

const EVENTS = [
  ['dancers2.jpg', 'Kompa Nights', 'Live music and dancing with the kominote.'],
  ['live-crowd.jpg', 'Cultural Festivals', 'Celebrate where we come from, together.'],
  ['dinner.jpg', 'Dinners & Meetups', 'Good food, good people and new friends.'],
]

const SAFETY = [
  ['shield', '18+ only', 'Every member confirms their age at sign-up.'],
  ['ban', 'Block and report', 'Stop any conversation in one tap and tell us about it.'],
  ['check', 'Reviewed by people', 'Our moderators review every report.'],
]

function Split({ img, kicker, title, text, cta, to, flip }) {
  const tr = useTr()
  return (
    <section className={'mk-split' + (flip ? ' flip' : '')}>
      <img src={'/img/' + img} alt="" loading="lazy" />
      <div>
        <p className="mk-script">{kicker}</p>
        <h2>{tr(title)}</h2>
        <p>{tr(text)}</p>
        <Link to={to} className="mk-cta">{tr(cta)} <Icon name="arrow" size={18} /></Link>
      </div>
    </section>
  )
}

export default function Landing() {
  const tr = useTr()
  return (
    <PublicShell>
      <Hero />
      <section className="mk-features">
        {FEATURES.map(([ic, h, p]) => (
          <div key={h}><Icon name={ic} size={38} stroke={1.6} /><b>{tr(h)}</b><span>{tr(p)}</span></div>
        ))}
      </section>
      <Split img="couple-field.jpg" kicker="Lanmou" title="Find someone who gets you." text="Meet people who share your roots, your values and your idea of home, wherever you live in the world." cta="Start Dating" to="/register" />
      <Split img="parade.jpg" kicker="Kominote" title="Your community is waiting." text="Join groups, share what matters and stay close to the culture, from Port-au-Prince to Miami, Montréal and Paris." cta="Explore Community" to="/app/community" flip />
      <section className="mk-how">
        <h2>{tr('How Rekonekte works')}</h2>
        <div className="mk-how-g">
          {STEPS.map(([ic, h, p], i) => <div key={h}><em>{i + 1}</em><Icon name={ic} size={30} stroke={1.6} /><b>{tr(h)}</b><span>{tr(p)}</span></div>)}
        </div>
      </section>
      <section className="mk-evs">
        <div className="mk-evs-h"><h2>{tr('Exciting Events')}</h2><Link to="/app/events">{tr('See all events')} <Icon name="arrow" size={16} /></Link></div>
        <div className="mk-evs-g">
          {EVENTS.map(([img, h, p]) => <Link key={h} to="/app/events"><img src={'/img/' + img} alt="" loading="lazy" /><span><b>{tr(h)}</b>{tr(p)}</span></Link>)}
        </div>
      </section>
      <section className="mk-safe">
        <h2>{tr('A safe place to connect')}</h2>
        <div>{SAFETY.map(([ic, h, p]) => <p key={h}><Icon name={ic} size={26} /><b>{tr(h)}</b><span>{tr(p)}</span></p>)}</div>
      </section>
      <section className="mk-more-sec">
        <h2>{tr('Discover More')}</h2>
        <div className="mk-more">
          {MORE_TILES.map(([img, ic, label, cat]) => (
            <Link key={label} to={'/app/community?tab=posts&cat=' + cat} className="mk-tile">
              <img src={'/img/' + img} alt="" loading="lazy" /><span><Icon name={ic} size={17} /> {tr(label)}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="mk-banner">
        <img src="/img/banner-island.jpg" alt="" loading="lazy" />
        <div className="mk-banner-l">
          <p className="mk-script">Lanmou · Kominote · Lakay</p>
          <p>{tr('Rekonekte is a Haitian-rooted, multicultural platform where people come to date, make friends, discover their community, and build a life they love.')}</p>
        </div>
        <div className="mk-banner-c">
          <h2>{tr('Be part of something bigger.')}</h2>
          <p>{tr('Love')} <i>·</i> {tr('Community')} <i>·</i> {tr('Culture')} <i>·</i> {tr('Opportunity')}</p>
        </div>
        <Link to="/register" className="mk-cta light">{tr('Join Rekonekte')} <Icon name="arrow" size={18} /></Link>
      </section>
    </PublicShell>
  )
}

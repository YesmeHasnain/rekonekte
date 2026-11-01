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

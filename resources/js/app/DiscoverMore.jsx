import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import { useTr } from '../i18n.jsx'

// Each tile opens the community board on that category.
export const MORE_TILES = [
  ['more-jobs.jpg', 'briefcase', 'Jobs & Career', 'jobs'],
  ['more-housing.jpg', 'house', 'Housing', 'housing'],
  ['more-food.jpg', 'utensils', 'Food & Restaurants', 'food'],
  ['more-services.jpg', 'wrench', 'Services', 'services'],
  ['more-travel.jpg', 'plane', 'Travel', 'travel'],
  ['more-culture.jpg', 'palette', 'Culture & Art', 'culture'],
]

export default function DiscoverMore() {
  const tr = useTr()
  return (
    <div className="page mk-page mk-narrow">
      <h1 className="mk-h1">{tr('Discover More')}</h1>
      <div className="mk-more">
        {MORE_TILES.map(([img, ic, label, cat]) => (
          <Link key={label} to={'/app/community?tab=posts&cat=' + cat} className="mk-tile">
            <img src={'/img/' + img} alt="" loading="lazy" /><span><Icon name={ic} size={17} /> {tr(label)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

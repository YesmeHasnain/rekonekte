import { Link } from 'react-router-dom'
import { PublicShell } from '../components/Public.jsx'
import { Icon } from '../components/ui.jsx'

function LegalPage({ title, updated, sections, other }) {
  return (
    <PublicShell>
      <main className="legal wrap">
        <div className="legal-h">
          <span className="kicker">Legal</span>
          <h1>{title}</h1>
          <p className="muted">Last updated {updated}</p>
          <div className="placeholder-note"><Icon name="flag" size={16} /><span><b>Placeholder text — Client to supply final text.</b> This page shows structure only and is not legal advice.</span></div>
        </div>
        <div className="legal-grid">
          <nav className="legal-toc">{sections.map(([h], i) => <a key={h} href={'#s' + i}>{i + 1}. {h}</a>)}<Link to={other[0]} className="btn ghost sm">{other[1]}</Link></nav>
          <article>{sections.map(([h, p], i) => (<section key={h} id={'s' + i}><h2>{i + 1}. {h}</h2>{p.map((x, k) => <p key={k}>{x}</p>)}</section>))}</article>
        </div>
      </main>
    </PublicShell>
  )
}

export function Privacy() {
  return <LegalPage title="Privacy Policy" updated="October 2026" other={['/terms', 'Read the Terms →']} sections={[
    ['Who we are', ['[Client to supply final text] Rekonekte ("we", "us") operates the Rekonekte dating and community platform for the Haitian diaspora.']],
    ['Information we collect', ['[Client to supply final text] Account details (name, email, date of birth), profile content (photos, bio, city, interests, languages), messages, community posts, reports and basic usage data.']],
    ['How we use it', ['[Client to supply final text] To run the service, show your profile to other members, match you by your filters, keep the community safe and moderate reports.']],
    ['Who can see your information', ['[Client to supply final text] Your public profile is visible to signed-in members you have not blocked. Messages are only visible to participants and, when reported, to moderators.']],
    ['Safety & moderation', ['[Client to supply final text] Reports are confidential. Moderators may review reported content and take action, including suspension.']],
    ['Your choices & rights', ['[Client to supply final text] Edit or delete your profile, download your data, change visibility and language settings, or close your account at any time.']],
    ['Data retention', ['[Client to supply final text] How long each type of data is kept and how deleted accounts are handled.']],
    ['Contact', ['[Client to supply final text] privacy@rekonekte.com']],
  ]} />
}

export function Terms() {
  return <LegalPage title="Terms of Service" updated="October 2026" other={['/privacy', 'Read the Privacy Policy →']} sections={[
    ['Acceptance of terms', ['[Client to supply final text] By creating an account you agree to these Terms and our Privacy Policy.']],
    ['Eligibility — 18+ only', ['[Client to supply final text] You must be at least 18 years old. Accounts found to belong to minors will be removed.']],
    ['Your account', ['[Client to supply final text] You are responsible for your login details and for the accuracy of your profile.']],
    ['Community guidelines', ['[Client to supply final text] Be respectful. No harassment, hate speech, scams, spam, nudity or impersonation. Respect the kominote.']],
    ['Content you post', ['[Client to supply final text] You keep ownership of your content and grant Rekonekte a licence to display it within the service.']],
    ['Reporting, blocking & enforcement', ['[Client to supply final text] We may warn, suspend or terminate accounts that break these Terms.']],
    ['Paid features', ['[Client to supply final text] Phase 1 has no paid features. Future subscriptions will have separate terms.']],
    ['Limitation of liability', ['[Client to supply final text] Standard limitation and disclaimer language.']],
    ['Contact', ['[Client to supply final text] legal@rekonekte.com']],
  ]} />
}

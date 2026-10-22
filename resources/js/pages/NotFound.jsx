import { Link } from 'react-router-dom'
import { PublicShell } from '../components/Public.jsx'
export default function NotFound() {
  return (
    <PublicShell>
      <main className="wrap nf"><img src="/img/logo-mark.png" alt="" width="96" /><h1>404 — Nou pa jwenn paj sa a</h1><p className="muted">We couldn't find that page. Let's get you back lakay.</p><Link to="/" className="btn primary">Back home</Link></main>
    </PublicShell>
  )
}

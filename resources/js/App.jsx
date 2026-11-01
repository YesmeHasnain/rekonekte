import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import { Login, Register, Verify, Reset } from './pages/Auth.jsx'
import { Privacy, Terms } from './pages/Legal.jsx'
import NotFound from './pages/NotFound.jsx'
import AppLayout from './app/AppLayout.jsx'
import Discover from './app/Discover.jsx'
import MemberProfile from './app/MemberProfile.jsx'
import Messages from './app/Messages.jsx'
import Community from './app/Community.jsx'
import Events from './app/Events.jsx'
import EventDetail from './app/EventDetail.jsx'
import Home from './app/Home.jsx'
import DiscoverMore from './app/DiscoverMore.jsx'
import { MyProfile, EditProfile } from './app/Profile.jsx'
import Settings from './app/Settings.jsx'
import Admin from './app/Admin.jsx'
import { SafetyModal, Toasts } from './components/ui.jsx'
import { useStore } from './store.jsx'

// Members-only area: signed in AND email verified. Anyone else is sent to log in
// (with a link to register), unverified accounts finish verification first.
function RequireMember({ children, admin }) {
  const { account } = useStore()
  const loc = useLocation()
  if (account === undefined) return <div className="gate-wait" aria-busy="true" />
  if (!account) return <Navigate to={'/login?next=' + encodeURIComponent(loc.pathname)} replace />
  if (!account.email_verified) return <Navigate to={'/verify?email=' + encodeURIComponent(account.email)} replace />
  if (admin && !['admin', 'moderator'].includes(account.role)) return <Navigate to="/app/home" replace />
  return children
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) { const el = document.getElementById(hash.slice(1)); if (el) { el.scrollIntoView({ behavior: 'smooth' }); return } }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/app" element={<RequireMember><AppLayout /></RequireMember>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="more" element={<DiscoverMore />} />
          <Route path="discover" element={<Discover />} />
          <Route path="members/:id" element={<MemberProfile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:threadId" element={<Messages />} />
          <Route path="community" element={<Community />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<RequireMember admin><Admin /></RequireMember>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SafetyModal />
      <Toasts />
    </>
  )
}

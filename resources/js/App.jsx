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
import { MyProfile, EditProfile } from './app/Profile.jsx'
import Settings from './app/Settings.jsx'
import Admin from './app/Admin.jsx'
import { SafetyModal, Toasts } from './components/ui.jsx'

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
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="discover" replace />} />
          <Route path="discover" element={<Discover />} />
          <Route path="members/:id" element={<MemberProfile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:threadId" element={<Messages />} />
          <Route path="community" element={<Community />} />
          <Route path="events" element={<Events />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SafetyModal />
      <Toasts />
    </>
  )
}

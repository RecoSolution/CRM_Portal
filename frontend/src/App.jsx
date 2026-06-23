import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import VerifyOTP from './pages/auth/VerifyOTP'
import ForgotPassword from './pages/auth/ForgotPassword'
import CreatePassword from './pages/auth/CreatePassword'
import PasswordResetSuccess from './pages/auth/PasswordResetSuccess'
import ProfileIntro from './pages/auth/ProfileIntro'
import ProfilePhoto from './pages/auth/ProfilePhoto'
import SetupProfile from './pages/auth/SetupProfile'
import ProfileComplete from './pages/auth/ProfileComplete'
import EditContact from './pages/EditContact';

import Home from './pages/Home'
import Scan from './pages/Scan'
import ScannedCardForm from './pages/ScannedCardForm'
import VoiceNote from './pages/VoiceNote'
import SetReminder from './pages/SetReminder'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Followups from './pages/Followups'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications';
import FilterContacts from './pages/FilterContacts';

function Gate({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/password-reset-success" element={<PasswordResetSuccess />} />

          <Route path="/profile-intro" element={<Gate><ProfileIntro /></Gate>} />
          <Route path="/profile-photo" element={<Gate><ProfilePhoto /></Gate>} />
          <Route path="/setup-profile" element={<Gate><SetupProfile /></Gate>} />
          <Route path="/profile-complete" element={<Gate><ProfileComplete /></Gate>} />

          <Route path="/home" element={<Gate><Home /></Gate>} />
          <Route path="/scan" element={<Gate><Scan /></Gate>} />
          <Route path="/scanned-card" element={<Gate><ScannedCardForm /></Gate>} />
          <Route path="/voice-note" element={<Gate><VoiceNote /></Gate>} />
          <Route path="/set-reminder" element={<Gate><SetReminder /></Gate>} />
          <Route path="/contacts" element={<Gate><Contacts /></Gate>} />
          <Route path="/contacts/:id" element={<Gate><ContactDetail /></Gate>} />
          <Route path="/followups" element={<Gate><Followups /></Gate>} />
          <Route path="/profile" element={<Gate><Profile /></Gate>} />
          <Route path="/contacts/:id/edit" element={<Gate><EditContact /></Gate>} />
          <Route path="/notifications" element={<Gate><Notifications /></Gate>} />
          <Route path="/contacts/filters" element={<Gate><FilterContacts /></Gate>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
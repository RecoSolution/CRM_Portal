import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [fabState, setFabState] = useState('idle') // idle | pressed | loading

  const hasContacts = false // wire to real contacts count later

  function handleScanTap() {
    setFabState('pressed')
    setTimeout(() => setFabState('loading'), 150)
    setTimeout(() => navigate('/scan'), 900)
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Top header */}
      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={() => setMenuOpen(true)}>
          <img src="/assets/icons/menu.svg" alt="menu" className="w-6 h-6" />
        </button>
        <span className="text-white font-semibold text-[16px]">RecoSolution</span>
        <button onClick={() => navigate('/notifications')}>
          <img src="/assets/icons/bell.svg" alt="notifications" className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {!hasContacts ? (
          <>
            <h1 className="text-[19px] font-bold text-forest mb-8 text-center">
              No Contacts Yet
            </h1>
            <img
              src="/assets/illustrations/no-contacts.png"
              alt="No contacts"
              className="w-[210px] h-[210px] object-contain mb-10"
            />
            <p className="text-center text-[14px] font-medium text-gray-800 mb-2">
              Scan your first<br />business card
            </p>
            <img src="/assets/icons/arrow-down.svg" alt="" className="w-5 h-5" />
          </>
        ) : (
          <div className="w-full text-left">
            {/* Populated dashboard state goes here later */}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="bg-forest relative px-2 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 flex-1">
            <img src="/assets/icons/tab-home.svg" alt="" className="w-6 h-6" />
            <span className="text-white text-[11px] font-medium">Home</span>
          </button>

          <button onClick={() => navigate('/contacts')} className="flex flex-col items-center gap-1 flex-1">
            <img src="/assets/icons/tab-contacts.svg" alt="" className="w-6 h-6" />
            <span className="text-white/80 text-[11px] font-medium">Contacts</span>
          </button>

          {/* Spacer for the floating scan button */}
          <div className="flex-1" />

          <button onClick={() => navigate('/followups')} className="flex flex-col items-center gap-1 flex-1">
            <img src="/assets/icons/tab-followup.svg" alt="" className="w-6 h-6" />
            <span className="text-white/80 text-[11px] font-medium">Follow-Up</span>
          </button>

          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 flex-1">
            <img src="/assets/icons/tab-profile.svg" alt="" className="w-6 h-6" />
            <span className="text-white/80 text-[11px] font-medium">Profile</span>
          </button>
        </div>

        {/* Floating Scan button */}
        <button
          onClick={handleScanTap}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-16 h-16 rounded-full bg-sage flex flex-col items-center justify-center shadow-lg"
        >
          <div className={`w-14 h-14 rounded-full bg-forest flex items-center justify-center ${fabState !== 'idle' ? 'scale-95' : ''} transition-transform`}>
            {fabState === 'loading' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src="/assets/icons/camera.svg" alt="Scan" className="w-6 h-6 invert" />
            )}
          </div>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 -top-[-30px] text-white text-[11px] font-semibold">
          {fabState === 'loading' ? 'Just a sec...' : 'Scan'}
        </span>
      </div>

      {/* Side menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white px-5 py-6">
            <p className="font-semibold text-gray-900 mb-1">{user?.firstName} {user?.lastName}</p>
            <p className="text-[13px] text-gray-500 mb-6">{user?.email}</p>
            <button onClick={() => navigate('/profile')} className="block text-left text-[14px] text-gray-800 mb-4">
              My Profile
            </button>
            <button onClick={() => navigate('/contacts')} className="block text-left text-[14px] text-gray-800 mb-4">
              All Contacts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  function getInitials() {
    const f = user?.firstName?.[0] || ''
    const l = user?.lastName?.[0] || ''
    return (f + l).toUpperCase() || '?'
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      {/* Header — curved bottom edge, matches Contacts / Filter Contacts / Help & Support / Notifications / Privacy Policy */}
      <div className="bg-gradient-to-br from-sage to-forest px-5 pt-5 pb-7 shrink-0 rounded-b-[32px] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.18)] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
            <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
          </button>
          <span className="text-white font-semibold text-[16px]">Profile</span>
          <div className="w-9 h-9" />
        </div>
      </div>

      <div className="px-6 pt-8 pb-10 flex-1">

        <div className="flex flex-col items-center mb-9">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-sage/15 flex items-center justify-center mb-3 ring-4 ring-white">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-forest font-bold text-[22px]">{getInitials()}</span>
            )}
          </div>
          <p className="font-bold text-[17px] text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-[13px] text-gray-500 mt-0.5">{user?.jobTitle}</p>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Contact Info
        </p>
        <div className="flex flex-col gap-2.5 mb-8">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="w-9 h-9 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
              <img src="/assets/icons/mail.svg" alt="" className="w-4 h-4" />
            </div>
            <span className="text-[14px] text-gray-800 truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="w-9 h-9 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
              <img src="/assets/icons/phone-outline.svg" alt="" className="w-4 h-4" />
            </div>
            <span className="text-[14px] text-gray-800">{user?.phone || 'Not set'}</span>
          </div>
        </div>

        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
          Account
        </p>
        <div className="flex flex-col mb-8 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <button
            onClick={() => navigate('/setup-profile')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-100"
          >
            <img src="/assets/icons/edit.svg" alt="" className="w-4.5 h-4.5 opacity-70" />
            <span className="text-[14px] text-gray-800 font-medium">Edit Profile</span>
          </button>
          <button
            onClick={() => navigate('/profile-photo')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <img src="/assets/icons/camera.svg" alt="" className="w-4.5 h-4.5 opacity-70" />
            <span className="text-[14px] text-gray-800 font-medium">Change Photo</span>
          </button>
        </div>

        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full h-12 rounded-full border-[1.5px] border-red-400 text-red-500 font-semibold text-[14px] active:scale-[0.99] transition-transform"
          >
            Logout
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmLogout(false)}
              className="flex-1 h-12 rounded-full border-[1.5px] border-forest text-forest font-semibold text-[14px] active:scale-[0.99] transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 h-12 rounded-full bg-red-500 text-white font-semibold text-[14px] active:scale-[0.99] transition-transform"
            >
              Confirm Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
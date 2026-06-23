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

      {/* Header */}
      <div className="bg-sage px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-[17px]">Profile</span>
        <div className="w-9 h-9" />
      </div>

      <div className="px-6 pt-8 pb-10 flex-1">
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/70 flex items-center justify-center mb-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-forest font-bold text-[22px]">{getInitials()}</span>
            )}
          </div>
          <p className="font-bold text-[17px] text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-[13px] text-gray-500">{user?.jobTitle}</p>
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-3 bg-white/60 rounded-2xl px-4 py-3.5">
            <img src="/assets/icons/mail.svg" alt="" className="w-4.5 h-4.5" />
            <span className="text-[14px] text-gray-800">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 bg-white/60 rounded-2xl px-4 py-3.5">
            <img src="/assets/icons/phone-outline.svg" alt="" className="w-4.5 h-4.5" />
            <span className="text-[14px] text-gray-800">{user?.phone || 'Not set'}</span>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex flex-col gap-1 mb-8">
          <button
            onClick={() => navigate('/setup-profile')}
            className="flex items-center gap-3 px-1 py-3 text-left"
          >
            <img src="/assets/icons/edit.svg" alt="" className="w-4.5 h-4.5" />
            <span className="text-[14px] text-gray-800 font-medium">Edit Profile</span>
          </button>
          <button
            onClick={() => navigate('/profile-photo')}
            className="flex items-center gap-3 px-1 py-3 text-left"
          >
            <img src="/assets/icons/camera.svg" alt="" className="w-4.5 h-4.5" />
            <span className="text-[14px] text-gray-800 font-medium">Change Photo</span>
          </button>
        </div>

        {/* Logout */}
        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full h-12 rounded-full border-[1.5px] border-red-400 text-red-500 font-semibold text-[14px]"
          >
            Logout
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmLogout(false)}
              className="flex-1 h-12 rounded-full border-[1.5px] border-forest text-forest font-semibold text-[14px]"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 h-12 rounded-full bg-red-500 text-white font-semibold text-[14px]"
            >
              Confirm Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
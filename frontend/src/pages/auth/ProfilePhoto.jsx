import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadAvatar, removeAvatar } from '../../utils/authApi'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePhoto() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [preview, setPreview] = useState(user?.avatar || null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const galleryInputRef = useRef(null)
  const cameraInputRef  = useRef(null)

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSheetOpen(false)
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await uploadAvatar(formData)
      setPreview(res.data.avatar)
      updateUser(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload photo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      const res = await removeAvatar()
      setPreview(null)
      updateUser(res.data.user)
    } catch {
      setError('Could not remove photo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-6 pb-10 relative">

      <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-1 mb-6">
        <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
      </button>

      <h1 className="text-center text-[19px] font-bold text-gray-700 mb-1">
        Add a Profile Photo
      </h1>
      <p className="text-center text-[13px] text-gray-500 mb-8">(Optional)</p>

      <div className="bg-white/60 rounded-3xl aspect-square flex items-center justify-center mb-8 overflow-hidden">
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <img
            src="/assets/icons/avatar-placeholder.svg"
            alt="No photo"
            className="w-28 h-28 object-contain opacity-60"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {!preview ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setSheetOpen(true)}
            disabled={loading}
            className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60"
          >
            {loading ? 'Please wait...' : 'Upload'}
          </button>
          <button
            onClick={() => navigate('/setup-profile')}
            className="text-center text-[14px] text-gray-600 underline"
          >
            Skip
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 h-12 rounded-full border-[1.5px] border-forest text-forest font-semibold text-[14px] disabled:opacity-60"
            >
              Remove
            </button>
            <button
              onClick={() => setSheetOpen(true)}
              disabled={loading}
              className="flex-1 h-12 rounded-full bg-forest text-white font-semibold text-[14px] disabled:opacity-60"
            >
              Replace
            </button>
          </div>
          <button
            onClick={() => navigate('/setup-profile')}
            className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white"
          >
            Continue
          </button>
        </>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileSelected}
      />

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl px-5 pt-3 pb-8">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-4 border-[1.5px] border-forest/50 rounded-2xl px-4 py-3.5 mb-3 text-left"
            >
              <img src="/assets/icons/gallery.svg" alt="" className="w-10 h-10" />
              <span>
                <span className="block font-semibold text-gray-900 text-[14px]">Upload from gallery</span>
                <span className="block text-[12px] text-gray-500">Pick your photos manually</span>
              </span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 border-[1.5px] border-forest/50 rounded-2xl px-4 py-3.5 text-left"
            >
              <img src="/assets/icons/camera.svg" alt="" className="w-10 h-10" />
              <span>
                <span className="block font-semibold text-gray-900 text-[14px]">Open Camera</span>
                <span className="block text-[12px] text-gray-500">Take a selfie & upload</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
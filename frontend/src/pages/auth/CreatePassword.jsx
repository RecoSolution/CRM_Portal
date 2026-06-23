import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { resetPassword } from '../../utils/authApi'

export default function CreatePassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) navigate('/forgot-password')
  }, [email, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, password })
      navigate('/password-reset-success')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-20 pb-10">

      <h1 className="text-center text-[20px] font-bold text-gray-900 mb-2">
        Create Password
      </h1>
      <p className="text-center text-[14px] text-gray-700 mb-10">
        Enter a New Password
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[13px] font-semibold text-gray-500 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 rounded-full px-4 pr-12 text-[15px] text-gray-900 bg-white/70 border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <img
                src={showPassword ? '/assets/icons/eye-off.svg' : '/assets/icons/eye.svg'}
                alt="toggle password"
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-gray-500 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-12 rounded-full px-4 pr-12 text-[15px] text-gray-900 bg-white/70 border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <img
                src={showPassword ? '/assets/icons/eye-off.svg' : '/assets/icons/eye.svg'}
                alt="toggle password"
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60"
          >
            {loading ? 'Please wait...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
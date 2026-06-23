import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../../utils/authApi'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginUser({ email, password })
      login(res.data.token, res.data.user)
      navigate(res.data.user.isProfileComplete ? '/home' : '/profile-intro')
    } catch (err) {
      const data = err.response?.data
      if (data?.needsVerification) {
        navigate('/verify-otp', { state: { email: data.email, flow: 'signup' } })
        return
      }
      setError(data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-16 pb-10">
      <h1 className="text-center text-[22px] font-bold text-gray-900 tracking-wide mb-10">
        LOGIN
      </h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[13px] font-semibold text-gray-500 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 rounded-full px-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-gray-500 mb-2">
            Password
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

        <Link
          to="/forgot-password"
          className="text-center text-[13px] text-gray-600 underline -mt-2"
        >
          Forgot Password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60"
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>
      </form>

      {/* Removed "Continue with Google/Apple" per company policy */}

      <p className="text-center text-[13px] text-gray-600 mt-10">
        Don't have an account?{' '}
        <Link to="/signup" className="text-forest font-semibold">
          Sign Up
        </Link>
      </p>
    </div>
  )
}
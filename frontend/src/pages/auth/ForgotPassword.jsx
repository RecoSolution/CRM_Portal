import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPassword } from '../../utils/authApi'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await forgotPassword({ email })
      navigate('/verify-otp', { state: { email, flow: 'reset' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-20 pb-10">

      <h1 className="text-center text-[20px] font-bold text-gray-900 mb-3">
        Forgot Password
      </h1>
      <p className="text-center text-[14px] text-gray-700 mb-10">
        Enter your registered Email to receive an OTP
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[13px] font-semibold text-gray-500 mb-2">
            Email
          </label>
          <div className="relative">
            <img
              src="/assets/icons/mail.svg"
              alt=""
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 rounded-full pl-11 pr-4 text-[15px] text-gray-900 bg-white/70 border-none outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60"
        >
          {loading ? 'Please wait...' : 'Send OTP'}
        </button>
      </form>

      <p className="text-center text-[13px] text-gray-600 mt-8">
        Remembered it?{' '}
        <Link to="/login" className="text-forest font-semibold">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
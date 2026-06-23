import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp, verifyResetOtp, resendResetOtp } from '../../utils/authApi'
import { useAuth } from '../../context/AuthContext'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const email = location.state?.email
  const flow  = location.state?.flow || 'signup' // 'signup' | 'reset'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) {
      navigate(flow === 'reset' ? '/forgot-password' : '/signup')
    }
  }, [email, flow, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  function maskEmail(e) {
    if (!e) return ''
    const [user, domain] = e.split('@')
    return `${user.slice(0, 4)}${'*'.repeat(Math.max(user.length - 4, 3))}@${domain}`
  }

  function handleChange(index, digit) {
    if (!/^\d*$/.test(digit)) return
    const next = [...otp]
    next[index] = digit.slice(-1)
    setOtp(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      setOtp(pasted.padEnd(6, '').split('').slice(0, 6))
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Enter the complete 6-digit code')
      return
    }
    setError('')
    setLoading(true)

    try {
      if (flow === 'signup') {
        const res = await verifyOtp({ email, otp: code })
        login(res.data.token, res.data.user)
        navigate('/profile-intro')
      } else {
        await verifyResetOtp({ email, otp: code })
        navigate('/create-password', { state: { email } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    try {
      if (flow === 'signup') {
        await resendOtp({ email })
      } else {
        await resendResetOtp({ email })
      }
      setResendTimer(60)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code.')
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-10 pb-10">

      <img
        src="/assets/illustrations/verify-otp.png"
        alt="Verify code"
        className="w-[180px] h-[140px] mx-auto mb-6 object-contain"
      />

      <h1 className="text-center text-[20px] font-bold text-gray-900 mb-3">
        {flow === 'signup' ? 'Verify Email' : 'Verify OTP'}
      </h1>
      <p className="text-center text-[14px] text-gray-700 mb-8 leading-relaxed">
        We've sent a verification code to<br />
        <span className="font-semibold text-gray-900">{maskEmail(email)}</span>
      </p>

      <form onSubmit={handleVerify} className="flex flex-col gap-6">

        <div className="flex gap-2.5 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={`w-11 h-12 rounded-2xl text-center text-lg font-bold text-gray-900 bg-white border-2 outline-none ${
                digit ? 'border-forest' : 'border-sage/40'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <p className="text-center text-[13px] text-gray-500">
          Didn't Receive the OTP?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className={`font-bold ${resendTimer > 0 ? 'text-gray-400' : 'text-forest'}`}
          >
            {resendTimer > 0 ? `RESEND (${resendTimer}s)` : 'RESEND OTP'}
          </button>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white disabled:opacity-60"
        >
          {loading ? 'Please wait...' : flow === 'signup' ? 'Continue' : 'Verify'}
        </button>
      </form>
    </div>
  )
}
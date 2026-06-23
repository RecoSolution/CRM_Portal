import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfileComplete() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/home'), 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col items-center justify-center text-center px-6">

      <div className="w-[90px] h-[90px] rounded-full bg-forest flex items-center justify-center mb-6">
        <img src="/assets/icons/check.svg" alt="success" className="w-10 h-10" />
      </div>

      <h1 className="text-[19px] font-bold text-gray-900 mb-2">
        Profile Setup Complete
      </h1>
      <p className="text-[14px] text-gray-600">
        Your account is ready to use.
      </p>
    </div>
  )
}
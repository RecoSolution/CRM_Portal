import { useNavigate } from 'react-router-dom'

export default function PasswordResetSuccess() {
  const navigate = useNavigate()

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 flex flex-col items-center justify-center text-center">

      <div className="w-[90px] h-[90px] rounded-full bg-forest flex items-center justify-center mb-6">
        <img
          src="/assets/icons/check.svg"
          alt="success"
          className="w-10 h-10"
        />
      </div>

      <h1 className="text-[20px] font-bold text-gray-900 mb-2">
        Password Updated Successfuly
      </h1>
      <p className="text-[14px] text-gray-700 mb-10 leading-relaxed">
        Your Password has been<br />successfully Updated
      </p>

      <button
        onClick={() => navigate('/login')}
        className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white"
      >
        Back To Login
      </button>
    </div>
  )
}
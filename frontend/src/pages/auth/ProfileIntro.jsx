import { useNavigate } from 'react-router-dom'

export default function ProfileIntro() {
  const navigate = useNavigate()

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-20 pb-10 flex flex-col">

      <img
        src="/assets/illustrations/team-setup.png"
        alt="Set up your profile"
        className="w-[220px] h-[180px] mx-auto mb-10 object-contain"
      />

      <h1 className="text-center text-[21px] font-bold text-gray-900 mb-3">
        Let's Set Up Your Profile
      </h1>
      <p className="text-center text-[14px] text-gray-700 mb-10 leading-relaxed px-2">
        Help your team identify contact ownership and collaborate more effectively.
      </p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/profile-photo')}
          className="w-full h-12 rounded-full font-semibold text-[15px] bg-forest text-white"
        >
          Continue
        </button>
        <button
          onClick={() => navigate('/home')}
          className="text-center text-[14px] text-gray-600 underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
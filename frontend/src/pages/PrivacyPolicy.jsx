import { useNavigate } from 'react-router-dom';

const POINTS = [
  {
    icon: '/assets/icons/privacy-lock.svg',
    text: 'Contact information is encrypted and secure.',
  },
  {
    icon: '/assets/icons/privacy-team.svg',
    text: 'Team members can only access shared company data.',
  },
  {
    icon: '/assets/icons/privacy-shield-check.svg',
    text: 'Your personal information is never shared with third parties.',
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">

      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Privacy Policy</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-6 pt-10 pb-10">

        <div className="flex justify-center mb-7">
          <div className="w-[120px] h-[120px] rounded-full bg-sage/10 flex items-center justify-center">
            <img
              src="/assets/illustrations/privacy-shield.png"
              alt=""
              className="w-[76px] h-[76px] object-contain"
            />
          </div>
        </div>

        <h1 className="text-[19px] font-bold text-gray-900 text-center mb-2 tracking-tight">
          Your Privacy Matters
        </h1>
        <p className="text-[13.5px] text-gray-500 text-center mb-10 px-3 leading-relaxed">
          We are committed to protecting your data and being transparent about how it is used.
        </p>

        <div className="flex flex-col gap-3">
          {POINTS.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="w-11 h-11 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
                <img src={p.icon} alt="" className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] text-gray-700 leading-snug">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
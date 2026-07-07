import { useNavigate } from 'react-router-dom';

const SUPPORT_EMAIL = 'hetu.recosolution@gmail.com';
const CARD_SHADOW = 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]';

export default function ContactSupport() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col">
      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/help-support')} className="w-9 h-9 flex items-center justify-center -ml-1.5 rounded-full active:bg-white/10 transition-colors">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-[16px]">Contact Support</span>
        <div className="w-9 h-9" />
      </div>

      <div className="flex-1 px-6 pt-14 pb-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-[22px] bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03] flex items-center justify-center mb-6">
          <div className="w-11 h-11 rounded-full bg-forest/10 flex items-center justify-center">
            <img src="/assets/icons/help-contact.svg" alt="" className="w-5 h-5" />
          </div>
        </div>

        <h1 className="text-[19px] font-bold text-gray-900 tracking-tight mb-2.5">Need a hand?</h1>

        <p className="text-[13px] text-gray-500 leading-relaxed mb-10 px-3">
          Reach out to our support team and expect a reply as soon as possible.
        </p>

        <div className={`w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3.5 mb-8 ${CARD_SHADOW}`}>
          <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
            <img src="/assets/icons/help-contact.svg" alt="" className="w-4.5 h-4.5 opacity-70" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[11.5px] text-gray-400 mb-0.5">Email us at</p>
            <p className="text-[14px] font-semibold text-gray-900 truncate">{SUPPORT_EMAIL}</p>
          </div>
        </div>

        <a href={`mailto:${SUPPORT_EMAIL}?subject=Support Request`} className="w-full h-12 rounded-full font-semibold text-[14.5px] bg-forest text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_4px_14px_-4px_rgba(64,101,80,0.5)]">
          <img src="/assets/icons/help-contact.svg" alt="" className="w-4 h-4 brightness-0 invert" />
          Send Email
        </a>

        <p className="text-[11.5px] text-gray-400 mt-6">Typical response time: within 24 hours</p>
      </div>
    </div>
  );
}